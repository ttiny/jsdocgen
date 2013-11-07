"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class VarDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function VarDef () {
	ApiDef.call( this );
}

VarDef.extend( ApiDef );

VarDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = VarDef;