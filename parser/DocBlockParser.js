"use strict";

require( 'Prototype' );
var Path = require( 'path' );
var Fs = require( 'fs' );
var Markdown = require( 'Markdown' ).Markdown;
var Highlight = require( 'highlight.js' );


/**
 * Collection of function for parsing doc blocks and converting them to JSON for the doc viewer.
 * @def class DocBlockParser
 * @author Borilav Peev <borislav.asdf@gmail.com>
 */ 

function DocBlockParser () {
	this._markdownOptions = {
		codeDefaultLang: this.getLanguage(),
		codeBlockClass: 'block',
		codeBlockCallback: function ( code, lang, deflang ) {
			if ( !lang ) {
				lang = deflang;
			}
			if ( lang ) {
				if ( lang == 'auto' ) {
					code = Highlight.highlightAuto( code ).value;
				}
				else {
					code = Highlight.highlight( lang, code ).value;
				}
			}
			return code;
		},
		codeCallback: function ( code ) {
			//escape @ symbol so we won't get false inline tags in code
			return code.replace( RE_AT, '&#64;' );
		}
	};
}

var RE_AT = /@/g;
var _reTrimDocBlock = /\/\*\*\s*([\s\S]*?)\*\//gm;
var _reDocBlock = /\/\*\*[\s\S]*?\*\//mg;

DocBlockParser.define( {

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
		return Markdown( text, this._markdownOptions ).html;
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