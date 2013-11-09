"use strict";

var ApiDef = require( '../ApiDef.js' );
var VarType = require( './VarType.js' );

/**
@def class VarDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function VarDef ( access, attr, _static, _class, name, vartype, value, declared ) {
	ApiDef.call( this, 'var' );
	this.access = access;
	this.attr = attr;
	this.static = _static;
	this.class = _class;
	this.name = name;
	this.vartype = vartype;
	this.declared = declared;
}

VarDef.extend( ApiDef );

VarDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var Re = parser.getRegexProvider();
		var prop = def.match( Re.property );
		if ( prop !== null ) {
		 	return new VarDef(
				prop[1],
				prop[2],
				prop[3],
				prop[4],
				prop[5],
				new VarType( prop[6], prop[7], false ),
				docblock.tags.declared
			);
		}
		return null;
	}
} );

module.exports = VarDef;