"use strict";

var ApiDef = require( '../ApiDef.js' );
var Re = require( '../RegExes.js' );

/**
@def class TraitDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function TraitDef ( name, uses ) {
	ApiDef.call( this, 'trait' );
	this.name = name;
	this.uses = uses;
}

TraitDef.extend( ApiDef );

TraitDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var trait = def.match( Re.trait );
		if ( trait !== null ) {
		 	return new TraitDef(
				trait[1],
				trait[2]
			);
		}
		return null;
	}
} );

module.exports = TraitDef;