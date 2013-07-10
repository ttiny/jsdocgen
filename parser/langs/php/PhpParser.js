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

function PhpParser ( argv ) {
	argv = argv || {}
	DocBlockParser.call( this );
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

var _reBackSlash = /\\/g;
var _reAnySlash = /[\\\/:]/g;

PhpParser.extend( DocBlockParser, {

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
	 * This is a language specific version of {@see DocBlockParser.parseDocBlock()}.
	 *
	 * Supported tags:
	 * - @param <type|type[]|mixed|self...|callback>[="value"] [description] - self is same the method's class
	 * - @return <type|type[]|mixed|void|$this|self...|callback>[="value"] [description] - $this mean the function can be chained,
	 *   self is the same class as the method's class
	 * - @var <same as @param> - describes a variable or constant type
	 * - @declared <class> - when a symbol is present in a class but is inherited from other class
	 * - @throws <type|type2...> <description>
	 * - @vaarg [description] - the function supports variable number of arguments
	 * - @see function()|Class|Class::$property|Class::constant|Class::method()|link|php:PHP_builtin_symbol
	 * - @inheritdoc [symbol like in @see]- the docblock is inherited from the parent class/interface/etc,
	 *   or specific symbol if it is provided
	 * - @def <symbol definition> - see bellow
	 * 
	 * Inline tags:
	 * - inline {&#64;inheritdoc [symbol like in @see]} - inherit the docs only for the part where the tag is is inherited -
	 *   like summary, tag etc, from the parent class or specific symbol if it is provided.
	 * 
	 * The @def tag:
	 * The def tag is special in that it defines the symbol the doc block is about. This allows to create structured
	 * documentation for languages like JavaScript which don't have language construct for classes and namespaces and others.
	 * For such languages one can add the symbol definitions manually to create structure, for others like PHP, this information
	 * can be collected by the parser itself from the sources and it is not necessary to add it manually.
	 * The type defintions (funtion arguments, variables, etc) consist of the full type name, including any namespaces
	 * or class prefixes, optionaly including "[]" to indicate array of this type or can be severa types in this format separated by "|".
	 * 
	 * Files definition:
	 * <pre>
	 * &#64;def [file] <filename>
	 * </pre>
	 *
	 * Function definitions:
	 * <pre>
	 * &#64;def [public|private|protected] [final] [abstract] [static] [return_type] function [&]<[ns_class_prefix::]function_name> ( [argument1[, argument2]..] )
	 * </pre>
	 * - Funtion arguments are in the format [&]name[:type][ = "value"]. & mean "by reference" and value must be enclosed in double quotes.
	 * - If the last function argument is "..." this means the function accepts variable number of arguments.
	 * - Return type and argument type may be specified in the @def tag or in the @return/@param tag, but not both.
	 * 
	 * Class definitions:
	 * <pre>
	 * &#64;def [final|abstract] class <full_class_name> [extends [parentclass1[, parentclass2]..] )] [implements [iface1[, iface2]..] )] [uses [trait1[, trait2]..] )]
	 * &#64;def interface <[ns_class_prefix::]iface_name> [extends [iface1[, iface2]..] )]
	 * &#64;def trait <[ns_class_prefix::]trait_name> [uses [trait1[, trait2]..] )]
	 * </pre>
	 *
	 * Constant or variable definitions:
	 * <pre>
	 * &#64;def [public|private|protected] [final] [static] var <[ns_class_prefix::]variable_name>[:type] [ = "value"]
	 * &#64;def const <[ns_class_prefix::]constant_name>[:type] [ = "value"]
	 * </pre>
	 * - Type may be specified in the @def tag or in the @var tag, but not both.
	 * - Value, if provided, must be enclosed in double quotes.
	 *
	 * @def function PhpParser.parseDocBlock ( docblock )
	 * @param string The docblock.
	 * @return DocBlock|null
	 * @throws Error
	 */
	parseDocBlock: function ( docblock ) {
		var docblocktext = docblock;
		var docblock = DocBlockParser.prototype.parseDocBlock.call( this, docblock );
		var tags = docblock.tags;

		//def/return/var/inheritdoc/declared can appear only once
		if ( tags.def !== undefined ) {
			docblock.def = tags.def[0];
			delete tags.def;
		}
		// no def, issue error
		else {
			throw new DocBlockParser.Error( docblock, 'A comment without a @def', docblocktext );
		}
		
		if ( tags.return !== undefined ) {
			tags.return = tags.return[0];
		}
		if ( tags.var !== undefined ) {
			tags.var = tags.var[0];
		}
		if ( tags.vaarg !== undefined ) {
			tags.vaarg = tags.vaarg[0];
		}
		if ( tags.inheritdoc !== undefined ) {
			tags.inheritdoc = tags.inheritdoc[0];
		}
		if ( tags.autoinheritdoc !== undefined ) {
			tags.autoinheritdoc = tags.autoinheritdoc[0];
		}

		var declared = undefined;
		if ( tags.declared !== undefined ) {
			declared = tags.declared[0];
			delete tags.declared;
		}

		

		if ( tags.file !== undefined && this._projectDir ) {
			tags.file.name = Path.relative( this._projectDir, tags.file.name ).replace( _reBackSlash, '/' );
		}

		var def = docblock.def;

		var method = def.match( Re.method );
		if ( method !== null ) {
			docblock.def = {
				type: 'method',
				access: method[1],
				attr: method[2],
				static: method[3],
				return: { vartype: method[4],  byref: method[5] ? true : false },
				class: method[6],
				name: method[7],
				args: method[8],
				vaarg: tags.vaarg,
				declared: declared
			};
			return docblock;
		}

		var cls = def.match( Re.class );
		if ( cls !== null ) {
		 	docblock.def = {
				type: 'class',
				attr: cls[1],
				name: cls[2],
				extends: cls[3],
				implements: cls[4],
				uses: cls[5]
			};
			return docblock;
		}

		var iface = def.match( Re.interface );
		if ( iface !== null ) {
		 	docblock.def = {
				type: 'interface',
				name: iface[1],
				implements: iface[2]
			};
			return docblock;
		}

		var trait = def.match( Re.trait );
		if ( trait !== null ) {
		 	docblock.def = {
				type: 'trait',
				name: trait[1],
				uses: trait[2]
			};
			return docblock;
		}

		var prop = def.match( Re.property );
		if ( prop !== null ) {
		 	docblock.def = {
				type: 'var',
				access: prop[1],
				attr: prop[2],
				static: prop[3],
				class: prop[4],
				name: prop[5],
				vartype: prop[6],
				value: prop[7],
				declared: declared
			};
			return docblock;
		}

		var constant = def.match( Re.const );
		if ( constant !== null ) {
		 	docblock.def = {
				type: 'const',
				class: constant[1],
				name: constant[2],
				vartype: constant[3],
				value: constant[4],
				declared: declared
			};
			return docblock;
		}
		
		var func = def.match( Re.function );
		if ( func !== null ) {
			docblock.def = {
				type: 'function',
				access: func[1],
				attr: func[2],
				static: func[3],
				return: { vartype: func[4], byref: func[5] ? true : false },
				name: func[6],
				args: func[7],
				vaarg: tags.vaarg
			};
			return docblock;
		}

		var file = def.match( Re.file );
		if ( file !== null ) {
			docblock.def = {
				type: 'file',
				name: (this._projectDir ? Path.relative( this._projectDir, file[1] ) : file[1]).replace( _reBackSlash, '/' )
			};
			if ( tags.package === undefined ) {
				tags.package = this._defaultPackage;
			}
			return docblock;
		}

		throw new DocBlockParser.Error( docblock, 'Unable to parse @def tag', docblocktext );
	}

}.merge( require( './Index.js' ) ).merge( require( './DocBlocks.js' ) ) );


PhpParser.defineStatic( {
	DefaultPattern: '**.php:.*|**/.*'
} );

module.exports = PhpParser;