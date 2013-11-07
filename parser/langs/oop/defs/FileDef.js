"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class FileDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function FileDef () {
	ApiDef.call( this );
}

FileDef.extend( ApiDef );

FileDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = FileDef;