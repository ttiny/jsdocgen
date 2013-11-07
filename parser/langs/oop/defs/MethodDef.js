"use strict";

var FunctionDef = require( './FunctionDef.js' );
var Re = require( '../RegExes.js' );
var VarType = require( './VarType.js' );

/**
@def class MethodDef extends FunctionDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function MethodDef ( access, attr, _static, _return, _class, name, args, vaarg, declared ) {
	FunctionDef.call( this, access, attr, _static, _return, name, args, vaarg );
	this.type = 'method';
	this.class = _class;
	this.declared = declared;
}

MethodDef.extend( FunctionDef );

MethodDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var method = def.match( Re.method );
		if ( method ) {
			return new MethodDef(
				method[1],
				method[2],
				method[3],
				new VarType( method[4], undefined, method[5] ? true : false ),
				method[6],
				method[7],
				method[8],
				docblock.tags.vaarg,
				docblock.tags.declared
			);
		}
		return null;
	}
} );

module.exports = MethodDef;