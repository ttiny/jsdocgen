"use strict";

var ApiDef = require( '../ApiDef.js' );
var Re = require( '../RegExes.js' );

/**
@def class InterfaceDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function InterfaceDef ( name, _implements ) {
	ApiDef.call( this, 'interface' );
	this.name = name;
	this.implements = _implements;
}

InterfaceDef.extend( ApiDef );

InterfaceDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var iface = def.match( Re.interface );
		if ( iface !== null ) {
		 	return new InterfaceDef(
				iface[1],
				iface[2]
			)
		}
		return null;
	}
} );

module.exports = InterfaceDef;