"use strict";


global.UNITESTS = true;


var DocBlockParser = require( './DocBlockParser.js' );
var PhpParser = require( './langs/php/PhpParser.js' );
var Re = require( './langs/php/RegExes.js' );
var Fs = require( 'fs' );
var Path = require( 'path' );

function test ( condition, text ) {
	if ( condition ) {
		return;
	}

	throw new Error( text );
}


var parser = new DocBlockParser();
var blocks = parser.readDocBlocks( __dirname + '/tests/docblock.txt' );
var headerarr = {
	'summary': 'Short description.',
	'description': "Long description\nlorem ipsum.",
	'tags': {
		'package': 'tests.docs',
		'author': [ 'Name Surname <email@address.com>' ],
		'todo': [ "Multiline todo\nsomething.", 'single Line todo.' ]
	}
};
test( JSON.stringify( parser.parseDocBlock( blocks[0] ) ) == JSON.stringify( headerarr ) );

var blocks = parser.readDocBlocks( __dirname + '/tests/docblock2.txt' );
var headerarr = {
	'tags': {
		'private': true,
		'author': [ 'Name Surname <email@address.com>' ]
	}
};
test( JSON.stringify( parser.parseDocBlock( blocks[0] ) ) == JSON.stringify( headerarr ) );

var blocks = parser.readDocBlocks( __dirname + '/tests/docblock3.txt' );
var headerarr = {
	'summary': 'Docblock without asterisks.',
	'tags': {
		'private': true,
		'author': [ 'Name Surname <email@address.com>' ],
	}
};
test( JSON.stringify( parser.parseDocBlock( blocks[0] ) ) == JSON.stringify( headerarr ) );



//test errors
var caught = false;
try { parser.parseDocBlock( '/**\n@stable\n@unstable\n*/' ); }
catch( e ) { caught = true; }
test ( caught === false );






var phpParser = new PhpParser();
var reReplace = /~~~file~~~/gm;
var reCRLF = /\r\n|\r/gm;

function cmpFile ( file, done ) {

	file = Path.normalize( file );
	phpParser.parseSources( [ file ], function ( err, outfile ) {
		test( err === false );
		var fileout = file.substr( 0, file.length - 4 ) + '.out.php';
		var left = Fs.readFileSync( outfile, 'UTF-8' ).replace( reCRLF, '\n' );
		var right = Fs.readFileSync( fileout, 'UTF-8' ).replace( reCRLF, '\n' );
		right = right.replace( reReplace, file );
		test( left == right, outfile + ' doesnt match ' + fileout );
		if ( done ) {
			done();
		}
	} );

}

cmpFile( __dirname + '/tests/docmodule.php', function () {
	cmpFile( __dirname + '/tests/docfunction.php', function () {
		cmpFile( __dirname + '/tests/docclass.php' );
	} );
} );


//test errors
var caught = false;
try { phpParser.parseDocBlock( '/**@nodef\n@nopackage*/' ); }
catch( e ) { caught = true; }
test ( caught === true );







process.on( 'exit', function ( code ) {
	if ( code == 0 ) {
		console.log( 'TESTS OK' );
	}
} );


