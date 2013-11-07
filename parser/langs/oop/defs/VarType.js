"use strict";

/**
@def class VarType
@author Borislav Peev <borislav.asdf@gmail.com>
*/

function VarType ( type, value, byref ) {
	this.vartype = type;
	this.value = value;
	this.byref = byref;
}

module.exports = VarType;