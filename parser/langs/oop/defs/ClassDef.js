"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class ClassDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function ClassDef () {
	ApiDef.call( this );
}

ClassDef.extend( ApiDef );

ClassDef.defineStatic( {
	fromString: function ( parser, def ) {
		return null;
	}
} );

module.exports = ClassDef;