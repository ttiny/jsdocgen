

var Os = require( 'os' );
var Path = require( 'path' );
var Build = require( './Build.js' );
var Fs = require( 'fs' );

// build themes
var DIR_REDIST = __dirname + '/../redist';
var DIR_THEME = __dirname + '/../theme';
var DIR_SRC = __dirname + '/../src';



function buildRelease ( version, options, callback ) {
	
	if ( version == 'unitests' ) {

		var name = options.Name;

		// build one copy for the unitests
		// var build = new Build( {
		// 	UNITESTS: true,
		// 	RELEASE: true
		// } );

		// options.Name = name + '-uni';
		// build.buildTheme( options );

		var build = new Build( {
			UNITESTS: true,
			DEBUG: true
		} );

		options.Name = name + '-dev-uni';
		build.buildTheme( options, callback );
	}

	else if ( version == 'debug' ) {

		// build one copy for debuging
		var build = new Build( {
			DEBUG: true
		} );

		options.Name += '-dev';
		build.buildTheme( options, callback );

	}

	// build release
	else if ( version == 'release' ) {

		// build one copy for release
		var build = new Build( {
			RELEASE: true
		} );

		build.buildTheme( options, function () {

			// build one copy for release
			var build = new Build( {
				RELEASE: true,
				UNITESTS: true
			} );

			options.Name += '-uni';
			build.buildTheme( options, callback );

		} );

	}
}


buildRelease( 'unitests', {
	Name: 'docviewjs',
	InputDir: DIR_SRC,
	OutputDir: DIR_REDIST,
	ThemeJs: 'docview.js',
	ThemeLess: 'docviewjs.less',
	DevVersion: true
} );

buildRelease( 'debug', {
	Name: 'docviewjs',
	InputDir: DIR_SRC,
	OutputDir: DIR_REDIST,
	ThemeJs: 'docview.js',
	ThemeLess: 'docviewjs.less',
	DevVersion: true
} );

Fs.readdirSync( DIR_THEME ).forEach( function ( dir ) {

	buildRelease( 'debug', {
		Name: 'docviewjs-' + dir,
		InputDir: DIR_THEME + '/' + dir,
		OutputDir: DIR_REDIST + '/' + 'docviewjs-' + dir,
		DevVersion: true
	} );

	buildRelease( 'release', {
		Name: 'docviewjs-' + dir,
		InputDir: DIR_THEME + '/' + dir,
		OutputDir: DIR_REDIST + '/' + 'docviewjs-' + dir
	} );

} );