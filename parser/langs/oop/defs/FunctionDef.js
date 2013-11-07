"use strict";

var ApiDef = require( '../ApiDef.js' );
var Re = require( '../RegExes.js' );
var VarType = require( './VarType.js' );

/**
@def class FunctionDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function FunctionDef ( access, attr, _static, _return, name, args, vaarg ) {
	ApiDef.call( this, 'function' );
	this.access = access;
	this.attr = attr;
	this.static = _static;
	this.return = _return;
	this.name = name;
	this.args = args;
	this.vaarg = vaarg;
}

FunctionDef.extend( ApiDef );

FunctionDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var func = def.match( Re.function );
		if ( func !== null ) {
			 return new FunctionDef(
			 	func[1],
			 	func[2],
			 	func[3],
			 	new VarType( func[4], undefined, func[5] ? true : false ),
			 	func[6],
			 	func[7],
			 	docblock.tags.vaarg 
			 );
		}
		return null;
	}
} );

module.exports = FunctionDef;