"use strict";

require( 'Prototype' );
var Path = require( 'path' );
var Fs = require( 'fs' );
var Markdown = require( 'Markdown' ).Markdown;

/**
 * Collection of function for parsing doc blocks and converting them to JSON for the doc viewer.
 * @def class DocBlockParser
 * @author Borilav Peev <borislav.asdf@gmail.com>
 */ 

//todo: /***/ wouldnt work for languages with different comments, this thing has no place here

function DocBlockParser () {
}

var _reNormalizeWhiteSpace = /\r\n|\r/g;
var _reTrimDocBlock = /\/\*\*\s*([\s\S]*?)\*\//gm;
var _reDocBlockStarPrefix = /^[\t ]*\* ?/gm;
var _reCountEols = /\n/gm;
var _reSplitTags = /^@/gm;
var _reDocBlock = /\/\*\*[\s\S]*?\*\//mg;

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

DocBlockParser.define( {

	/**
	 * Parses a doc block into logical parts.
	 * This function is not language specific, it does not know
	 * about language elements.
	 * A doc block consists of:
	 * - Optional one line summary.
	 * - Optional possibly multiline description.
	 * - List of tags. Each tag has a name and optional value. The value spans from after the name
	 * (+ one space) to the start of the next tag.
	 * - No tags before the summary or the description.
	 * - /&#41;&#41; and &#41;/ reside on their own lines, not with the actual comments.
	 * - All lines after /&#41;&#41; must have same indentation, including &#41;/.
	 *   This indentation may differ from the indent before the /&#41;&#41; .
	 *
	 * ```
	 * /&#41;&#41;
	 *  &#41; This is a docblock summary (summary).
	 *  &#41; (description:) The asterisks at the beginning of lines,
	 *  &#41; together with the whitespace
	 *  &#41; will be trimmed.
	 *  &#41; @tags start after the description. The tag here is "tag".
	 *  &#41; @another tag - the tag here is
	 *  &#41; "another", this one spans multiple lines.
	 *  &#41;/
	 *
	 * /&#41;&#41;
	 * This is valid docblock too,
	 * No asterisks at the beginning of lines.
	 * &#41;/
	 * ```
	 *
	 * Newlines will be converted to \n.
	 *
	 * Supported tags:
	 * - @package <package[.subpackage.subsub...]> - only supported in file header
	 * - @private - the element of the docblock is marked private, not supported in file header. It will not show in the viewer.
	 * - @author <author>
	 * - @license <licese>
	 * - @copyright <copyright>
	 * - @todo <todo text>
	 * - @deprecated <description> - marks the API as deprecated
	 * - @file <filename>[:start_line[-end_line]] - overrides the file where the docblock is found
	 * 
	 * Inline tags:
	 * - inline {&#64;see <same as @see>[ description]}
	 *
	 * @def function DocBlockParser.parseDocBlock ( docblock )
	 * @param string The docblock.
	 * @return DocBlockParser.DocBlock|null
	 */

	/**
	 * @def object DocBlockParser.DocBlock { summary, description, tags }
	 * @param string|undefined
	 * @param string|undefined
	 * @return object Collection of tags with their name and value. If the tag has no value (text) but is present its value will be true.
	 * @throws Error
	 */

	parseDocBlock: function ( docblock ) {

		if ( typeof docblock != 'string' && !(docblock instanceof String) ) {
			throw new Error( 'Not a docblock' );
		}

		var docblocktext = docblock;
		var ret = {};

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

		//split into tags (repace with @@ first because we lose one @ on spit)
		docblock = docblock.replace( _reSplitTags, '@@' );
		docblock = docblock.split( _reSplitTags );

		//check if we have description
		if ( docblock[0][0] != '@' ) {
			var description = docblock[0].trim();
			//check if we have more than one line
			var pos = description.indexOf( '\n' );
			if ( pos >= 0 ) {
				ret.summary = description.substr( 0, pos );
				ret.description = description.substr( pos + 1 ).trim();
			}
			else {
				description = description.trim();
				if ( description.length > 0 ) {
					ret.summary = description;
				}
			}
		}

		var tags = {};
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
		ret.tags = tags;

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

		//parse descriptions
		if ( tags.deprecated !== undefined ) {
			tags.deprecated = ( tags.deprecated[0] === true ? {} : { description: tags.deprecated[0] } );
		}

		return ret;
	},

	/**
	 * Parses a file and returns its documentation in JSON format.
	 * @def function DocBlockParser.readDocBlocks ( file )
	 * @param string File path.
	 * @return string[]|null Array of all doc blocks found.
	 */
	readDocBlocks: function ( file ) {

		var contents = Fs.readFileSync( file, 'UTF-8' );
		return contents.match( _reDocBlock );

	},

	/**
	@def function DocBlockParser.parseDescription ( text )
	@return string
	*/
	parseDescription: function ( text ) {
		return Markdown.toHtml( text );
	}

} );

/**
@def class DocBlockParser.Error
@author Borislav Peev <borislav.asdf@gmail.com>
*/

/**
@def class DocBlockParser.Warning extends DocBlockParser.Error
@author Borislav Peev <borislav.asdf@gmail.com>
*/
	
DocBlockParser.defineStatic( {

	formatElement: function ( docblock ) {
		//todo: this shouldn't know about @def yet
		//      the Def classes should have debugString() or something
		if ( docblock.def && ( docblock.def.type || docblock.def.name ) ) {
			var ret = docblock.def.type ? docblock.def.type : '';
			if ( docblock.def.name ) {
				ret += (ret ? ' ' : '') + 
					( docblock.def.class ? docblock.def.class + '::' : '' ) +
					( docblock.def.type == 'var' ? '$' : '' ) +
					docblock.def.name;
			}
			return ret;
		}
		else {
			return null;
		}
	},

	formatFile: function ( docblock ) {
		if ( docblock.tags.file !== undefined ) {
			return docblock.tags.file.name + ( docblock.tags.file.startLine !== undefined ? ' @' + docblock.tags.file.endLine : '' );
		}
		else {
			return null;
		}
	},

	/**
	Formats an error message about a doc comment.
	@def constructor DocBlockParser.Error( docblock, text, docblocktext )
	@param object The docblock.
	@param string Error text.
	@param string|undefined The text of the docblock.
	*/
	Error: function ( docblock, text, docblocktext, severity ) {
		Error.captureStackTrace( this, this );
		this.name = severity || 'ERROR';
		var element = DocBlockParser.formatElement( docblock );
		var file = DocBlockParser.formatFile( docblock );
		this.message =
			'\n' +
			( docblocktext !== undefined ? docblocktext + '\n\n' : '' ) +
			/*severity + ': ' +*/ text + '\n'  + 
			(element ? 'element ' + element : '') +
			( file ? ' in file ' + file : '' ) +
			'\n';
	},

	/**
	Formats a warning message about a doc comment.
	@def function DocBlockParser.Warning( docblock, text, docblocktext )
	@param object The docblock.
	@param string Warning text.
	@param string|undefined The text of the docblock.
	*/
	Warning: function ( docblock, text, docblocktext ) {
		if ( !(this instanceof Error ) )  {
			console.log();
			console.log( new DocBlockParser.Warning( docblock, text, docblocktext ).toString() );
			return;
		}
		DocBlockParser.Error.call( this, docblock, text, docblocktext, 'WARNING' );
	},
} );

DocBlockParser.Error.extend( Error );
DocBlockParser.Warning.extend( DocBlockParser.Error );

module.exports = DocBlockParser;