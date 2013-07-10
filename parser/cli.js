"use strict";

var PathUtils = require( 'PathUtils' );
var ArgvUtils = require( 'ArgvUtils' );
var DocBlockParser = require( './DocBlockParser.js' );
var Path = require( 'path' );

function main ( argv ) {
	var usage = 
		'\nUSAGE:\n' +
		'node DocBlockParser/run.js OPTIONS\n' +
		'\nSee README.md for detailed information.';

	if ( argv === null || argv.help ) {
		console.log( usage );
		return 0;
	}

	if ( argv.lang === undefined ) {
		console.error( 'Error: No -lang argument.' );
		return 1;
	}

	if ( argv.projectdir === undefined ) {
		console.error( 'Error: No -projectdir argument.' );
		return 1;
	}

	var LangParser = require( './langs/' + argv.lang + '/' + argv.lang.charAt( 0 ).toUpperCase() + argv.lang.substr( 1 ) + 'Parser.js' );
	var parser = new LangParser( { cli: true }.merge( argv ) );

	if ( argv.pattern === undefined ) {
		argv.pattern = LangParser.DefaultPattern;
	}

	if ( argv.pattern === undefined ) {
		console.error( 'Error: No -pattern argument, don\'t know what files to look for.' );
		return 1;
	}

	process.stdout.write( '\nLooking for sources... ' );
	var t = Date.now();
	process.stdout.write( '\n  ' + Path.normalize( argv.projectdir ) + ' ' + argv.pattern + ' ... ' );

	var sources = PathUtils.listPath( argv.projectdir, argv.pattern, PathUtils.LIST_DEFAULT | PathUtils.LIST_FULL_PATH ) || [];

	process.stdout.write( ( ( Date.now() - t ) / 1000 ) + 's' );

	if ( sources.length == 0 ) {
		console.error( 'Error: No sources matching the specified pattern were found.' );
		return 1;
	}

	console.log( '\nFound ' + sources.length + ' files' );

	function uncaught ( e ) {
		if ( !(e instanceof DocBlockParser.Error) || argv.debug ) {
			throw e;
		}
		else {
			console.log();
			console.error( e.toString() );
			process.exit( 1 );
		}
	}

	process.on( 'uncaughtException', uncaught );

	try {
		parser.run( sources );
	}
	catch ( e ) {
		uncaught( e );
	}
	
}

return main( ArgvUtils.parseArgs() );