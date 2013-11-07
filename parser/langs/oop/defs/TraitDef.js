"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class TraitDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function TraitDef () {
	ApiDef.call( this );
}

TraitDef.extend( ApiDef );

TraitDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = TraitDef;