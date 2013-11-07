"use strict";

var DocBlock = require( './DocBlock.js' );
var ApiDef = require( './ApiDef.js' );
var DocBlockParser = require( '../../DocBlockParser.js' );

/**
{@see DocBlock} that supports wide variety of OOP features in use by many languages.
@def class OopDocBlock extends DocBlock
@author Borislav Peev <borislav.asdf@gmail.com>
*/

/**
Creates a structure from sanitized doc comment string.
Supported tags:
- @param <type|type[]|mixed|self...|callback>[="value"] [description] - self is same the method's class
- @return <type|type[]|mixed|void|$this|self...|callback>[="value"] [description] - $this mean the function can be chained,
  self is the same class as the method's class
- @var <same as @param> - describes a variable or constant type
- @declared <class> - when a symbol is present in a class but is inherited from other class
- @throws <type|type2...> <description>
- @vaarg [description] - the function supports variable number of arguments
- @see function()|Class|Class::$property|Class::constant|Class::method()|link|php:PHP_builtin_symbol
- @inheritdoc [symbol like in @see]- the docblock is inherited from the parent class/interface/etc,
  or specific symbol if it is provided
- @def <symbol definition> - see bellow

Inline tags:
- inline `{@inheritdoc [symbol like in @see]}` - inherit the docs only for the part where the tag is is inherited -
  like summary, tag etc, from the parent class or specific symbol if it is provided.

The @def tag:
The def tag is special in that it defines the symbol the doc block is about. This allows to create structured
documentation for languages like JavaScript which don't have language construct for classes and namespaces and others.
For such languages one can add the symbol definitions manually to create structure, for others like PHP, this information
can be collected by the parser itself from the sources and it is not necessary to add it manually.
The type defintions (funtion arguments, variables, etc) consist of the full type name, including any namespaces
or class prefixes, optionaly including "[]" to indicate array of this type or can be severa types in this format separated by "|".

Files definition:
```
@def [file] <filename>
```

Function definitions:
```
@def [public|private|protected] [final] [abstract] [static] [return_type] function [&]<[ns_class_prefix::]function_name> ( [argument1[, argument2]..] )
```
- Funtion arguments are in the format [&]name[:type][ = "value"]. & mean "by reference" and value must be enclosed in double quotes.
- If the last function argument is "..." this means the function accepts variable number of arguments.
- Return type and argument type may be specified in the @def tag or in the @return/@param tag, but not both.

Class definitions:
```
@def [final|abstract] class <full_class_name> [extends [parentclass1[, parentclass2]..] )] [implements [iface1[, iface2]..] )] [uses [trait1[, trait2]..] )]
@def interface <[ns_class_prefix::]iface_name> [extends [iface1[, iface2]..] )]
@def trait <[ns_class_prefix::]trait_name> [uses [trait1[, trait2]..] )]
```

Constant or variable definitions:
```
@def [public|private|protected] [final] [static] var <[ns_class_prefix::]variable_name>[:type] [ = "value"]
@def const <[ns_class_prefix::]constant_name>[:type] [ = "value"]
```
- Type may be specified in the @def tag or in the @var tag, but not both.
- Value, if provided, must be enclosed in double quotes.

@def constructor OopDocBlock ( docblock:String )
@param string The sanitized doc comment to parse.
*/

function OopDocBlock ( parser, docblock ) {
	DocBlock.call( this, parser, docblock );

	var tags = this.tags;

	//def/return/var/inheritdoc/declared can appear only once
	if ( tags.def !== undefined ) {
		this.def = tags.def[0];
		delete tags.def;
	}
	// no def, issue error
	else {
		throw new DocBlockParser.Error( this, 'A comment without a @def', docblock );
	}
	
	if ( tags.return !== undefined ) {
		tags.return = tags.return[0];
	}
	if ( tags.var !== undefined ) {
		tags.var = tags.var[0];
	}
	if ( tags.vaarg !== undefined ) {
		tags.vaarg = tags.vaarg[0];
	}
	if ( tags.inheritdoc !== undefined ) {
		tags.inheritdoc = tags.inheritdoc[0];
	}
	if ( tags.autoinheritdoc !== undefined ) {
		tags.autoinheritdoc = tags.autoinheritdoc[0];
	}

	var declared = undefined;
	if ( tags.declared !== undefined ) {
		declared = tags.declared[0];
		delete tags.declared;
	}

	if ( tags.file !== undefined && parser._projectDir ) {
		tags.file.name = Path.relative( parser._projectDir, tags.file.name ).replace( _reBackSlash, '/' );
	}

	for ( var key in OopDocBlock.Defs ) {
		var def = OopDocBlock.Defs[key].fromString( parser, this, this.def );
		if ( def instanceof ApiDef ) {
			this.def = def;
			return /*this*/;
		}
	}

	throw new DocBlockParser.Error( this, 'Unable to parse @def tag', docblock );
}

OopDocBlock.extend( DocBlock );

var _reBackSlash = /\\/g;
var _reNormalizeWhiteSpace = /\r\n|\r/g;
var _reDocBlockStarPrefix = /^[\t ]*\* ?/gm;
var _reCountEols = /\n/gm;

function Rtrim ( str ) {
	for ( var i = str.length - 1; i >= 0; --i ) {
		var ch = str.charAt( i );
		if ( ch != ' ' && ch != '\t' && ch != '\n' ) {
			return i + 1;
		}
	}
	return 0;
}

function Rtrim2 ( str ) {
	for ( var i = str.length - 1; i >= 0; --i ) {
		var ch = str.charAt( i );
		if ( ch != ' ' && ch != '\t' ) {
			return i + 1;
		}
	}
	return 0;
}

OopDocBlock.defineStatic( {

	Defs: {
		'method': require( './defs/MethodDef.js' ),
		'class': require( './defs/ClassDef.js' ),
		'interface': require( './defs/InterfaceDef.js' ),
		'trait': require( './defs/TraitDef.js' ),
		'function': require( './defs/FunctionDef.js' ),
		'var': require( './defs/VarDef.js' ),
		'file': require( './defs/FileDef.js' )
	},

	/**
	Removes all comment stuff and optional leading stars from a doc comment.
	The doc comment is assumed to be in the following format.
	- Having /&#41;&#41; prefix and &#41;/ suffix.
	- /&#41;&#41; and &#41;/ reside on their own lines, not with the actual comments.
	- All lines after /&#41;&#41; must have same indentation, including &#41;/.
	  This indentation may differ from the indent before the /&#41;&#41; .
	- Lines may have leading `*` symbol.

	For example:
	```
	/&#41;&#41;
	 &#41; This is a docblock summary (summary).
	 &#41; (description:) The asterisks at the beginning of lines,
	 &#41; together with the whitespace
	 &#41; will be trimmed.
	 &#41; @tags start after the description. The tag here is "tag".
	 &#41; @another tag - the tag here is
	 &#41; "another", this one spans multiple lines.
	 &#41;/

	/&#41;&#41;
	This is valid docblock too,
	No asterisks at the beginning of lines.
	&#41;/
	```

	@def static function OopDocBlock.sanitizeDocBlock ( file )
	@param string The full doc comment, including  &#41;/.
	@return string
	*/
	sanitizeDocBlock: function ( docblock ) {
		//make consistent line endings
		docblock = docblock.replace( _reNormalizeWhiteSpace, '\n' );
		//remove the /**\n\n*/
		docblock = docblock.substring( 4, docblock.length - 2 );
		var indent = docblock.substr( Rtrim2( docblock ) );
		docblock = docblock.substring( 0, Rtrim( docblock ) );
		//count newlines
		var eols = docblock.match( _reCountEols );
		eols = eols === null ? 0 : eols.length + 1;
		//check if all lines start with *
		var stars = docblock.match( _reDocBlockStarPrefix );
		stars = stars === null ? 0 : stars.length;
		if ( eols === stars ) {
			//if so strip * at start of lines, leave only the text
			docblock = docblock.replace( _reDocBlockStarPrefix, '' );
		}

		//if the block starts with whitespace trim the same ammount of whitespacce from all lines
		else if ( indent ) {
			var re = new RegExp( '^' + indent, 'gm' );
			var before = docblock;
			docblock = docblock.replace( re, '' );
		}

		return docblock;
	},
} );

module.exports = OopDocBlock;