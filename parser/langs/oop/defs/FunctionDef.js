"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class FunctionDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function FunctionDef () {
	ApiDef.call( this );
}

FunctionDef.extend( ApiDef );

FunctionDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = FunctionDef;