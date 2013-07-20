

var defs = {};
defs.JSDOCGEN_VERSION = '0.9dev';




var Fs = require( 'fs' );
var Build = require( '../deps/docviewjs/build/Build.js' );
var ArgvUtils = require( 'ArgvUtils' );
var Path = require( 'path' );

var DIR_THEME = __dirname + '/theme';
var DIR_REDIST = __dirname + '/redist';
var DIR_SRC = __dirname + '/src';


var argv = ArgvUtils.parseArgs();


if ( argv.def ) {
	if ( !(argv.def instanceof Array) ) {
		argv.def = [ argv.def ];
	}
	for ( var i = argv.def.length - 1; i >= 0; --i ) {
		var def = argv.def[i].splitFirst( ':' );
		defs[def.left] = def.right || true;
	}
}

defs.JSDOCGEN_LOCATION = defs.JSDOCGEN_LOCATION || '';
defs.JSDOCGEN_DOCS = argv.docslocation || 'docs/';
defs.JSDOCGEN_LANG = argv.lang;
defs.JSDOCGEN_DEV_LOCATION = '';

var outdir = argv.outdir || DIR_REDIST;

if ( argv.outdir ) {
	defs.JSDOCGEN_DEV_LOCATION = Path.relative( argv.outdir, DIR_REDIST ).replace( /\\/g, '/' ) + '/';
}


var themes = Fs.readdirSync( DIR_THEME );
themes.forEach( function ( dir ) {

	defs.JSDOCGEN_THEME = dir;

	if ( argv[1] != 'release' && argv[1] !== undefined ) {
		
		var build = new Build( {
			DEBUG: true,
			UNITESTS: true,
			Definitions: defs
		} );

		build.buildTheme( {
			Name: 'jsdocgen-' + dir + '-dev',
			InputDir: DIR_THEME + '/' + dir,
			OutputDir: outdir + '/' + 'jsdocgen-' + dir,
			DevVersion: true
		} );

		build.preprocessFile( {
			Input: DIR_SRC + '/App.html',
			Output: outdir + '/' + 'index'+ ( themes.length > 1 ? '-' + dir : '' ) + '-dev.html'
		} );
	
	}


	if ( argv[1] != 'debug' ) {
		
		var build = new Build( {
			RELEASE: true,
			Definitions: defs
		} );

		build.buildTheme( {
			Name: 'jsdocgen-' + dir,
			InputDir: DIR_THEME + '/' + dir,
			OutputDir: outdir + '/' + 'jsdocgen-' + dir,
		} );

		build.preprocessFile( {
			Input: DIR_SRC + '/App.html',
			Output: outdir + '/' + 'index'+ ( themes.length > 1 ? '-' + dir : '' ) + '.html'
		} );
	
	}



} );