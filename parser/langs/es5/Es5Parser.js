"use strict";

//require( '../oop/OopParser.js' );
var Semaphore = require( 'Sync' ).Semaphore;
var Fs = require( 'fs' );
var Path = require( 'path' );
var Debug = require( '../../Debug.js' );
var OopDocBlock = require( '../oop/OopDocBlock.js' );

function Es5Parser ( argv ) {
	this._outDir = argv.outdir ? Path.resolve( argv.outdir ) : require( 'os' ).tmpdir();
	this._debug = argv.debug;
	this._cli = argv.cli;
}

Es5Parser.define( {

	getLanguage: function () {
		return 'es5';
	},

	run: function ( sources, done ) {
		
		var that = this;
		if ( that._cli ) {
			Debug.startTimer();
			console.log( '\nGenerating docs... ' );
		}

		function sourcesReady ( err, blocks ) {

			if ( err ) {
				console.error( 'Error: Parsing the JS sources failed.' );
				return;
			}
			
			if ( that._cli ) {
				console.log( 'Found ' + blocks.length + ' doc comments ' );
				Debug.startTimer();
				console.log( 'Parsing documentation... ' );
			}

			/*var blocks = that.parseDocBlocks( blocks );
			that.writeJsons( blocks, function () {*/
				if ( that._cli ) {
					console.log( 'Doc comments parsed in ' + Debug.endTimer() + 's' );
				}
				
				if ( that._cli ) {
					console.log( '\nFinished in ' + Debug.endTimer() + 's' );
				}
				
				if ( done instanceof Function ) {
					done();
				}
			/*} );*/
		}

		this.parseSources( sources, sourcesReady );
	},

	parseSources: function ( sources, done ) {

		for ( var i = sources.length - 1; i >= 0; --i ) {
			sources[i] = Path.resolve( sources[i] );
		}

		if ( !Fs.existsSync( this._outDir ) ) {
			PathUtils.createDir( this._outDir );
		}
		
		var that = this;
		if ( this._cli ) {
			Debug.startTimer();
			console.log( '\nParsing sources... ' );
		}

		// this is called when all files are parsed
		var goodsources = 0;
		var blocks = [];
		var wait = new Semaphore( sources.length, function () {

			if ( that._cli ) {
				console.log( 'Sources parsed in ' + Debug.endTimer() + 's' );
			}

			if ( done instanceof Function ) {
				done( goodsources != sources.length, blocks );
			}

		} );

		var SSTRING = "'(?:[^'\\\\]*(?:\\\\.[^'\\\\]*)*)'";
		var DSTRING = '"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"';
		var BLOCK = '(/\\*\\*[\\s\\S]+?\\*/)';
		var RE_DOCS = new RegExp( SSTRING+'|'+DSTRING+'|'+BLOCK, 'gm' );

		// this is called to parse each file
		function oneSourceRead ( fn ) {
			// wrap this in another call because node doesn't report the filename
			return function ( err, data ) {
				if ( err ) {
					console.error( 'Error: Error reading ' + fn + ': ' + err.toString() );
					wait.notify();
					return;
				}
				var m;
				while ( m = RE_DOCS.exec( data ) ) {
					var block = m[1];
					if ( !block ) {
						continue;
					}
					var start = data.substr( 0, m.index ).count( '\n' ) + 1;
					var end = start + block.count( '\n' );
					block = OopDocBlock.sanitizeDocBlock( block );
					block += '\n@def file ' + fn + ':' + start + '-' + end;
					blocks.push( new OopDocBlock( this, block ) );
				}
				++goodsources;
				wait.notify();
			};
		}

		// read sources the node way
		for ( var i = 0, iend = sources.length; i < iend; ++i ) {
			Fs.readFile( sources[i], 'utf-8', oneSourceRead( sources[i] ) );
		}
	}

} );

Es5Parser.defineStatic( {
	DefaultPattern: '**.js:.*|**/.*'
} );

module.exports = Es5Parser;