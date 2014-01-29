"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class ClassDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function ClassDef ( attr, name, _extends, _implements, uses ) {
	ApiDef.call( this, 'class' );
	this.attr = attr;
	this.name = name;
	this.extends = _extends;
	this.implements = _implements;
	this.uses = uses;
}

ClassDef.extend( ApiDef );

ClassDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var Re = parser.getRegexProvider();
		var cls = def.match( Re.class );
		if ( cls ) {
			return new ClassDef(
				cls[1],
				cls[2],
				cls[3],
				cls[4],
				cls[5]
			);
		}
		return null;
	}
} );

module.exports = ClassDef;