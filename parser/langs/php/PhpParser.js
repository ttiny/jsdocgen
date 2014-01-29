"use strict";

//todo: ideally we would have class for each def type. like new Def.file( ... )

require( 'Prototype' );
var DocBlockParser = require( '../../DocBlockParser.js' );
var ChildProcess = require( 'child_process' );
var Path = require( 'path' );
var Fs = require( 'fs' );
var Semaphore = require( 'Sync' ).Semaphore;
var PathUtils = require( 'PathUtils' );
var Re = require( './RegExes.js' );
var OopDocBlock = require( '../oop/OopDocBlock.js' );

function PhpParser ( argv ) {
	DocBlockParser.call( this );
	argv = argv || {}
	this._defaultPackage = argv.defaultpackage || '<default>';
	this._autoInherit = argv.autoinherit;
	this._autoNotices = argv.autonotices;
	this._warnings = argv.warnings;
	this._strict = argv.strict;
	this._includePrivateMembers = argv.withprivatemembers;
	this._introPage = argv.intro ? Path.resolve( argv.intro ) : null;
	this._autoSee = argv.phpautosee;
	this._phpBin = argv.phpbin || 'php';
	this._phpInit = argv.phpinit ? Path.resolve( argv.phpinit ) : null;
	this._projectDir = argv.projectdir ? Path.resolve( argv.projectdir ) : undefined;
	this._outDir = argv.outdir ? Path.resolve( argv.outdir ) : require( 'os' ).tmpdir();
	this._debug = argv.debug;
	this._cli = argv.cli;
	this._cache = argv.cache;
	this._extraFiles = argv.phpextrafiles ? argv.phpextrafiles.split( '|' ) : [];
}

var _reAnySlash = /[\\\/:]/g;

PhpParser.extend( DocBlockParser, {

	getLanguage: function () {
		return 'php';
	},

	getFactorySymbols: function ( callback ) {
		ChildProcess.execFile(
			this._phpBin,
			[ '-r', 'require \'' + __dirname + '/update_factorysymbols.php\';' ],
			null,
			function ( err, stdout, stderr ) {
				callback( err, err ? stderr : JSON.parse( stdout) );
			}
		);
	},

	getParseSourcesOutput: function () {
		return Path.resolve( this._outDir + '/jsdocgen_tmp.php' );
	},

	// runs the php binary telling it to perform the -phpinit argument (if any), then run.php
	// which should result in having all php doc comments in a single file
	parseSources: function ( sources, done ) {

		for ( var i = sources.length - 1; i >= 0; --i ) {
			sources[i] = Path.resolve( sources[i] );
		}

		for ( var i = this._extraFiles.length - 1; i >= 0; --i ) {
			this._extraFiles[i] = Path.resolve( this._extraFiles[i] );
		}

		var args = [
			'-r',
				'define( \'JSDOCGEN_PHP_PARSER\', true );\n' +
				( this._phpInit ? 'require \'' + this._phpInit + '\';\n' : '' ) +
				'require \'' + __dirname + '/run.php\';',
			'--',
			/*this._debug ? 'debug' :*/ 'ndebug',
			this._outDir
		].concat( sources ).concat( [ '|||' ].concat( this._extraFiles ) );

		var outfile = this.getParseSourcesOutput();
		if ( !Fs.existsSync( this._outDir ) ) {
			PathUtils.createDir( this._outDir );
		}
		var out = Fs.openSync( outfile, 'w' );
		Fs.writeSync( out, '<?' );

		var options = {
			cwd: this._outDir,
			stdio: [ 'ignore', out, 'ignore' ]
		};

		var t = null;
		var that = this;
		if ( this._cli ) {
			t = Date.now();
			console.log( '\nParsing sources... ' );
		}

		var php = ChildProcess.spawn( this._phpBin, args, options );
		php.on( 'close', function ( code ) {
			Fs.writeSync( out, '\n\n\n?>' );
			Fs.closeSync( out );

			if ( that._cli ) {
				console.log( 'Sources parsed in ' + ( ( Date.now() - t ) / 1000 ) + 's' );
			}

			if ( done instanceof Function ) {
				done( code != 0, outfile );
			}
		} );
	},

	filterPrivate: function ( blocks ) {
		var ret = [];
		ret.length = blocks.length;
		var c = 0;
		for ( var i = 0, iend = blocks.length; i < iend; ++i ) {
			var block = blocks[i];
			if ( block.tags.private || ( block.def && block.def.access == 'private' ) ) {
				continue;
			}
			else if ( block.members !== undefined ) {
				for ( var key in block.members ) {
					var members = block.members[key];
					for ( var j = 0, jend = members.length; j < jend; ++j ) {
						block.members[key] = this.filterPrivate( members );
					}
				}
				
			}
			ret[c++] = block;
		}
		ret.length = c;
		return ret;
	},

	parseDocBlocks: function ( blocks ) {
		var ret = [];
		ret.length = blocks.length;
		for ( var i = blocks.length - 1; i >= 0; --i ) {
			ret[i] = this.parseDocBlock( blocks[i] );
		}
		this.postProcessDocBlocks( ret );

		if ( !this._includePrivateMembers ) {
			ret = this.filterPrivate( ret );
		}
		
		return ret;
	},

	writeJsons: function ( blocks, done ) {

		function jsonp ( file, json ) {
			return 'jsdocgen_data('+JSON.stringify(Path.basename(file))+','+JSON.stringify(json)+');';
		}

		PathUtils.cleanDir( this._outDir, 'index.jsonp|file_*.jsonp|class_*.jsonp|function_*.jsonp' );
		var outdir = this._outDir + '/';
		var lock = new Semaphore( 1, done );

		var index = this.buildIndex( blocks );

		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var def = block.def;
			if ( def === undefined || ( def.type !== 'class' && def.type !== 'trait' && def.type !== 'interface' && def.type !== 'file' && def.type !== 'function' ) ) {
				continue;
			}
			if ( def.type == 'file' && block.summary === undefined && block.description === undefined ) {
				continue;
			}
			var type = def.type;
			if ( type == 'trait' || type == 'interface' ) {
				type = 'class';
			}
			var fn =
				outdir +
				type +
				( def.class ? '_' + def.class.replace( _reAnySlash, '.' ) : '' ) +
				( def.name ? '_' + def.name.replace( _reAnySlash, '.' ) : '' ) +
				'.jsonp';

			lock.lock();
			Fs.writeFile( fn, jsonp( fn, blocks[i] ), function () {
				lock.notify();
			} );
		}

		var intromd = '';
		if ( this._introPage && Fs.existsSync( this._introPage ) ) {
			intromd = Fs.readFileSync( this._introPage, 'UTF-8' );
		}
		else {
			intromd = '';
		}

		var intro = {
			description: intromd,
			tags: {},
			def: {
				type: 'page'
			}
		};
		if ( intro.description.length > 0 ) {
			intro.description = this.parseDescription( intro.description, intro );
		}
		
		lock.lock();
		var fn = outdir + 'intro.jsonp';
		Fs.writeFile( fn, jsonp( fn, intro ), function () {
			lock.notify();
		} );
		
		fn = outdir + 'index.jsonp';
		Fs.writeFile( fn, jsonp( fn, index ), function () {
			lock.notify();
		} );
		
	},

	run: function ( sources, done ) {

		var that = this;
		var t = null;
		if ( that._cli ) {
			t = Date.now();
			console.log( '\nGenerating docs... ' );
		}

		// if caching is enabled check if we have upto date output
		var outfile = null;;
		if ( this._cache ) {
			outfile = this.getParseSourcesOutput();
			if ( Fs.existsSync( outfile ) ) {
				var max = Fs.statSync( outfile ).mtime;
				for ( var i = sources.length - 1; i >= 0; --i ) {
					if ( Fs.statSync( sources[i] ).mtime > max ) {
						outfile = null;
						break;
					}
				}
			}
			else {
				outfile = null;
			}
		}
		
		function sourcesReady ( err, outfile ) {
			
			if ( err ) {
				console.error( 'Error: Parsing the PHP sources failed. Check the results in ' + outfile );
				return;
			}
			
			var t1 = null;
			var blocks = DocBlockParser.prototype.readDocBlocks.call( that, outfile );
			if ( that._cli ) {
				console.log( 'Found ' + blocks.length + ' doc comments ' );
				t1 = Date.now();
				console.log( 'Parsing documentation... ' );
			}

			var blocks = that.parseDocBlocks( blocks );
			that.writeJsons( blocks, function () {
				if ( that._cli ) {
					console.log( 'Doc comments parsed in ' + ( ( Date.now() - t1 ) / 1000 ) + 's' );
				}
				
				if ( !that._debug ) {
					Fs.unlinkSync( outfile );
				}
				
				if ( that._cli ) {
					console.log( '\nFinished in ' + ( ( Date.now() - t ) / 1000 ) + 's' );
				}
				
				if ( done instanceof Function ) {
					done();
				}
			} );
		}

		if ( outfile !== null ) {
			if ( this._cli ) {
				console.log( 'Using sources cache' );
			}
			sourcesReady( false, outfile )
		}
		else {
			this.parseSources( sources, sourcesReady );
		}
	},

	/**
	 * Parses a doc block into logical parts.
	 * @def function PhpParser.parseDocBlock ( docblock )
	 * @param string The docblock.
	 * @return OopDocBlock|null
	 * @throws Error
	 */
	parseDocBlock: function ( docblock ) {

		return new OopDocBlock( this, OopDocBlock.sanitizeDocBlock( docblock ) );

	}

}.merge( require( './Index.js' ) ).merge( require( './DocBlocks.js' ) ) );


PhpParser.defineStatic( {
	DefaultPattern: '**.php:.*|**/.*'
} );

module.exports = PhpParser;