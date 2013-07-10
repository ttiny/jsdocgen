"use strict";

var toHtml = require( './Markdown.js' ).Markdown.toHtml;
var Fs = require( 'fs' );
var html_beautify = require( './tests/js-beautify/beautify-html.js' ).html_beautify;

var files = Fs.readdirSync( __dirname + '/tests' );

var reCRLF = /\r\n|\r/g;

files.forEach( function ( file ) {
	var file = file.split( '.' );
	
	if ( file[1] == 'md' ) {
		if ( process.argv[2] == 'only' && process.argv[3] != file[0] ) {
			return;
		}
		if ( process.argv[2] == 'ignore' && process.argv[3] == file[0] ) {
			return;
		}
		test( file[0] );
	}
} );

function findDiff ( a, b ) {
	for ( var i = 0, iend = a.length, iiend = b.length; i < iend && i < iiend; ++i ) {
		if ( a.charAt( i ) != b.charAt( i ) ) {
			console.log( 'Diff (expected) ===>\n' + JSON.stringify( a.substr( i, 20 ) ) + '\n' + 'Diff (result) ===>\n' + JSON.stringify( b.substr( i, 20 ) ) );
			break;
		}
	}
}


function test ( file ) {
	var md = Fs.readFileSync( __dirname + '/tests/' + file + '.md', 'UTF-8' ).replace( reCRLF, '\n' );
	var html = undefined;
	var opts = { wrap_line_length: 0 };
	if ( Fs.existsSync( __dirname + '/tests/' + file + '.html' ) ) {
		html = Fs.readFileSync( __dirname + '/tests/' + file + '.html', 'UTF-8' ).replace( reCRLF, '\n' );
		html = html_beautify( html, opts );
	}

	try {
		md = toHtml( md, { needParagraph: true, codeInlineClass: null, codeBlockClass: null } );
	}
	catch ( e ) {
		console.error( '\nTEST FAILED in ' + file + '.md' );
		throw e;
	}
	var md1 = html_beautify( md, opts );
	if ( md1 != html ) {
		console.error( '\nTEST FAILED in ' + file + '.md' );
		console.error( '\nEXPECTED\n========\n'+html+'\n========\n\nRESULT\n======\n'+md1+'\n======' );
		findDiff( html, md1 );
		process.exit( 1 );
	}
	else {
		if ( process.argv[ process.argv.length - 1 ] == 'rewrite' ) {
			Fs.writeFileSync( __dirname + '/tests/' + file + '.html', md );
		}
	}
}


console.log( 'TESTS OK' );

