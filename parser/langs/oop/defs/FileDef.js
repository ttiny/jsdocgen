"use strict";

var ApiDef = require( '../ApiDef.js' );

/**
@def class FileDef extends ApiDef
@author Borislav Peev <borislav.asdf@gmail.com>
*/
function FileDef ( name ) {
	ApiDef.call( this, 'file' );
	this.name = name;
}

FileDef.extend( ApiDef );

var _reBackSlash = /\\/g;

FileDef.defineStatic( {
	fromString: function ( parser, docblock, def ) {
		var Re = parser.getRegexProvider();
		var file = def.match( Re.file );
		if ( file !== null ) {
			return new FileDef(
				(parser._projectDir ? Path.relative( parser._projectDir, file[1] ) : file[1])
					.replace( _reBackSlash, '/' )
			);
			if ( tags.package === undefined ) {
				tags.package = parser._defaultPackage;
			}
		}
		return null;
	}
} );

module.exports = FileDef;