var Fs = require( 'fs' );
var PhpParser = require( './PhpParser.js' );
var parser = new PhpParser();
parser.getFactorySymbols( function ( err, json ) {
	if ( err ) {
		console.error( 'Error: ', json );
		return;
	}
	var str = 'module.exports = ' + JSON.stringify( json, null, '\t' ) + ';'
	Fs.writeFileSync( __dirname + '/FactorySymbols.js', str );
	console.log( 'OK FactorySymbols.js' );
} );