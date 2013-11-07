"use strict";

var FunctionDef = require( './FunctionDef.js' );
var Re = require( '../RegExes.js' );
var VarType = require( './VarType.js' );

/**
@def class CallbackDef extends FunctionDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function CallbackDef ( access, attr, _static, _return, _class, name, args, vaarg, declared ) {
	FunctionDef.call( this, access, attr, _static, _return, name, args, vaarg );
	this.type = 'callback';
}

CallbackDef.extend( FunctionDef );

CallbackDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var callback = def.match( Re.callback );
		if ( callback ) {
			return new CallbackDef(
				callback[1],
			 	callback[2],
			 	callback[3],
			 	new VarType( callback[4], undefined, callback[5] ? true : false ),
			 	callback[6],
			 	callback[7],
			 	docblock.tags.vaarg 
			);
		}
		return null;
	}
} );

module.exports = CallbackDef;