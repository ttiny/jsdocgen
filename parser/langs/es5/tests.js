"use strict";


global.UNITESTS = true;
global.UNITESTS_NOCOLOR = true;


var DocBlock = require( '../oop/DocBlock.js' );
var OopDocBlock = require( '../oop/OopDocBlock.js' );
var Re = require( './RegExes.js' );
var Fs = require( 'fs' );
var Path = require( 'path' );

var parser = {};

function readDocBlocks ( file ) {
	return OopDocBlock.sanitizeDocBlock( Fs.readFileSync( file, 'utf-8' ) );
}

var blocks = readDocBlocks( __dirname + '/tests/docblock.txt' );
var headerarr = {
	'summary': 'Short description.',
	'description': "Long description\nlorem ipsum.",
	'tags': {
		'package': 'tests.docs',
		'author': [ 'Name Surname <email@address.com>' ],
		'todo': [ "Multiline todo\nsomething.", 'single Line todo.' ]
	}
};
test( JSON.stringify( new DocBlock( parser, blocks ) ) == JSON.stringify( headerarr ) );

var blocks = readDocBlocks( __dirname + '/tests/docblock2.txt' );
var headerarr = {
	'tags': {
		'private': true,
		'author': [ 'Name Surname <email@address.com>' ]
	}
};
test( JSON.stringify( new DocBlock( parser, blocks ) ) == JSON.stringify( headerarr ) );

var blocks = readDocBlocks( __dirname + '/tests/docblock3.txt' );
var headerarr = {
	'summary': 'Docblock without asterisks.',
	'tags': {
		'private': true,
		'author': [ 'Name Surname <email@address.com>' ],
	}
};
test( JSON.stringify( new DocBlock( parser, blocks ) ) == JSON.stringify( headerarr ) );
