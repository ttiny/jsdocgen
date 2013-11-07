"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class InterfaceDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function InterfaceDef () {
	ApiDef.call( this );
}

InterfaceDef.extend( ApiDef );

InterfaceDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = InterfaceDef;