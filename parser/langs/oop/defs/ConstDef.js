"use strict";

var ApiDef = require( '../ApiDef.js' );
var VarType = require( './VarType.js' );

/**
@def class ConstDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function ConstDef ( _class, name, vartype, declared ) {
	ApiDef.call( this, 'const' );
	this.class = _class;
	this.name = name;
	this.vartype = vartype;
	this.declared = declared;
}

ConstDef.extend( ApiDef );

ConstDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var Re = parser.getRegexProvider();
		var constant = def.match( Re.const );
		if ( constant !== null ) {
		 	return new ConstDef(
				constant[1],
				constant[2],
				new VarType( constant[3], constant[4], false ),
				docblock.tags.declared
			);
		}
		return null;
	}
} );

module.exports = ConstDef;