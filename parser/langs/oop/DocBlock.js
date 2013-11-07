"use strict";

var _reSplitTags = /^@/gm;

/**
Represents the most basic doc comment features, not language specific.
@def class DocBlock
@author Borislav Peev <borislav.asdf@gmail.com>
*/

/**
Creates a structure from sanitized doc string.
This function is not language specific, it does not know
about language elements. It takes as input a sanitized string,
this is the actual doc comment stripped of any language specific
comments or prefixes.

A doc block consists of:
- Optional one line summary.
- Optional possibly multiline description.
- List of tags. Each tag has a name and optional value. The value spans from after the name
(+ one space) to the start of the next tag.
- No tags before the summary or the description.

```
This is a docblock summary (summary).
(description:) The asterisks at the beginning of lines,
together with the whitespace
will be trimmed.
@tags start after the description. The tag here is "tag".
@another tag - the tag here is
"another", this one spans multiple lines.
```

Newlines will be converted to \n.

Supported tags:
- @package <package[.subpackage.subsub...]> - only supported in file header
- @private - the element of the docblock is marked private, not supported in file header. It will not show in the viewer.
- @author <author>
- @license <licese>
- @copyright <copyright>
- @todo <todo text>
- @deprecated <description> - marks the API as deprecated
- @file <filename>[:start_line[-end_line]] - overrides the file where the docblock is found

Inline tags:
- inline {&#64;see <same as @see>[ description]}

@def constructor DocBlock ( docblock:String )
*/
function DocBlock ( parser, docblock ) {

	if ( !String.isString( docblock ) ) {
		throw new Error( 'Not a docblock' );
	}

	/**
	@def var DocBlock.summary:string|undefined
	*/
	this.summary = undefined;

	/**
	@def var DocBlock.description:description|undefined
	*/
	this.description = undefined;

	/**
	Collection of tags with their name and value. If the tag has no value (text) but is present its value will be true.
	@def var DocBlock.tags:object
	@todo Document the known tags, see `DocBlockParser.parseDocBlock()`.
	*/
	this.tags = {};

	//split into tags (repace with @@ first because we lose one @ on spit)
	docblock = docblock.replace( _reSplitTags, '@@' );
	docblock = docblock.split( _reSplitTags );

	//check if we have description
	if ( docblock[0][0] != '@' ) {
		var description = docblock[0].trim();
		//check if we have more than one line
		var pos = description.indexOf( '\n' );
		if ( pos >= 0 ) {
			this.summary = description.substr( 0, pos );
			this.description = description.substr( pos + 1 ).trim();
		}
		else {
			description = description.trim();
			if ( description.length > 0 ) {
				this.summary = description;
			}
		}
	}

	var tags = this.tags;
	for ( var i = 1, iend = docblock.length; i < iend; ++i ) {
		var tag = docblock[i];
		var pos = tag.indexOf( ' ' );
		if ( pos >= 0 ) {
			var key = tag.substr( 1, pos - 1 );
			if ( tags[key] === undefined ) {
				tags[key] = [];
			}
			tags[key].push( tag.substr( pos + 1 ).trim() );
		}
		else {
			var key = tag.substr( 1 ).trim();
			if ( tags[key] === undefined ) {
				tags[key] = [];
			}
			tags[key].push( true );
		}
		
	}

	// parse the file tag
	if ( tags.file !== undefined ) {
		var file = tags.file[0];
		var icolon = file.lastIndexOf( ':' );
		if ( file.charAt( icolon + 1 ) != '\\' ) {
			var line = file.substr( icolon + 1 ).split( '-' );
			file = {
				name: file.substr( 0, icolon ),
				startLine: parseInt( line[0] ),
				endLine: line[1] === undefined ? undefined : parseInt( line[1] )
			};
		}
		else {
			file = { name: file };
		}
		tags.file = file;
	}

	//private/package/deprecated can appear only once
	if ( tags.private !== undefined ) {
		tags.private = tags.private[0];
	}
	if ( tags.package !== undefined ) {
		tags.package = tags.package[0];
	}
	if ( tags.deprecated !== undefined ) {
		tags.deprecated = ( tags.deprecated[0] === true ? {} : { description: tags.deprecated[0] } );
	}
}

module.exports = DocBlock;