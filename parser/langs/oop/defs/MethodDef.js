"use strict";

var FunctionDef = require( './FunctionDef.js' );

/**
@def class MethodDef extends FunctionDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function MethodDef () {
	FunctionDef.call( this );
}

MethodDef.extend( FunctionDef );

MethodDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = MethodDef;