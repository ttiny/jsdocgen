"use strict";

/**
@def class ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function ApiDef ( type ) {
	this.type = type;
}

ApiDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		return null;
	}
} );

module.exports = ApiDef;