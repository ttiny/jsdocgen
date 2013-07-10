var ArgvUtils = require( 'ArgvUtils' );
var Build = require( './Build.js' );

var argv = ArgvUtils.parseArgs();

if ( !argv || !argv.indir || !argv.outdir || !argv.name ) {
	console.error( 'docviewjs build: Required argument is missing' );
	process.exit( 1 );
}

var defs = {};
if ( argv.def ) {
	if ( !(argv.def instanceof Array) ) {
		argv.def = [ argv.def ];
	}
	for ( var i = argv.def.length - 1; i >= 0; --i ) {
		var def = argv.def[i].splitFirst( ':' );
		defs[def.left] = def.right || true;
	}
}

var build = new Build( {
	DEBUG: argv.DEBUG,
	UNITESTS: argv.UNITESTS,
	RELEASE: argv.RELEASE,
	Definitions: defs
} );

build.buildTheme( {
	Name: argv.name,
	InputDir: argv.indir,
	OutputDir: argv.outdir,
	DevVersion: argv.dev
} );