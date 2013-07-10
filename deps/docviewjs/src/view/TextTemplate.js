"use strict";

(function ( exports, global ) {

	//private static
	var _textEscapes = {
		"'": "\\'",
		'\\': '\\\\',
		'\r': '\\r',
		'\n': '\\n',
		'\t': '\\t'
	};

	//private static
	var _textEscaper = /[\\'\r\n\t]/g;

	//private
	function escapeText ( text ) {
		return text.replace( _textEscaper, '\\$&' );
	}

	/**
	 * Compiles a function that produces HTML for given data.
	 * Meant to complement {@see HtmlArea}.
	 * 
	 * Adapted from underscorejs.org's _.template().
	 * @def class TextTemplate
	 * @author Borislav Peev <borislav.asdf@gmail.com>.
	 */

	/**
	 * Creates an HTML template that can be rendered with different data.
	 * @def constructor TextTemplate ( text )
	 * @param string Template's text.
	 */
	 

	 function _fromCache ( cache, id ) {
	 	return new TextTemplate( { cache: true, source: cache, id: id } );
	 }

	/**
	 * @def constructor Template ( text, settings )
	 * @param Template's text.
	 * @param object Template settings. Defaults to {@see TextTemplate.DefaultSettings}
	 */
	function TextTemplate ( text, settings, id ) {

		var tsettings = {}.merge( TextTemplate.DefaultSettings );
		settings = settings instanceof Object ? tsettings.merge( settings ) : tsettings;

		var founds = 0;
		var source = '';
		if ( text instanceof Object && text.cache === true ) {
			founds = 1;
			source = text.source;
			id = text.id;
		}
		else {
			var regex = new RegExp( settings.escape + '|' + settings.interpolate + '|' + settings.evaluate, 'g' );
			var index = 0;
			text.replace( regex, function ( match, escape, interpolate, evaluate, offset ) {
				++founds;
				source += "__p += '" + escapeText( text.slice( index, offset ) ) + "';\n";

				if ( escape ) {
					source += "__p += TextTemplate.escapeHtml( " + escape + "\n);\n"; //\n after the match so we can have line comments
				}
				else if ( interpolate ) {
					source += "__p += ( " + interpolate + "\n);\n"; //\n after the match so we can have line comments
				}
				else if ( evaluate ) {
					source += "" + evaluate.trim() + "\n";
				}

				index = offset + match.length;
				return match;
			} );
		}

		if ( founds > 0 ) {
			if ( index < text.length - 1 ) {
				source += "__p += '" + escapeText( text.slice( index ) ) + "';\n";
			}
			source = //"\"use strict\";\n" +
			"var __p = '';\n" + 
			( settings.print ? "function " + settings.print + " ( t, e ) { __p += e ? TextTemplate.escapeHtml( t ) : t; };\n" : "") + 
			/*@DEBUG*/( global.DEBUG ? "try {\n" : '' ) +/*DEBUG@*/
			source + "return __p;\n"
			/*@DEBUG*/+ ( global.DEBUG ? "}\ncatch ( e ) {\nconsole.error( '(TextTemplate"+(id?' '+id:'')+") Error in template', source );\nthrow e;\n}\n" : '' )/*DEBUG@*/
			;
			try {
				this._template = new Function( settings.variable/*@DEBUG*/, 'source'/*DEBUG@*/, source );
			} catch (e) {
				/*@DEBUG*/
				if ( global.DEBUG ) {
					console.error( '(TextTemplate'+(id?' '+id:'')+') Error compiling template', source );
				}
				/*DEBUG@*/
				e.source = source;
				throw e;
			}
		}
		else {
			source = "return '" + escapeText( text ) + "';";
			this._template = function () {
				return text;
			};
		}
		

		this._settings = settings;
		this._source = /*'function (' + settings.variable + ') {\n' +*/ source /*+ '}'*/;
	}

	/*@UNITESTS*/
	Unitest( 'TextTemplate.render()', function () {
		
		var t = new TextTemplate( '<h1>\'ello</h1>: <%= data.firstName %> <%! data.lastName %>. <% for ( var i = 0; i < data.days.length; ++i ) { %> <%= data.days[i] %> <% } %>' );
		var r = t.render( { firstName: 'first', lastName: 'l&ast', days: [ 'mon', 'tue' ] } );
		test( r == '<h1>\'ello</h1>: first l&amp;ast.  mon  tue ' );

		test( new TextTemplate( 'asd' ).render() == 'asd' );

		test( new TextTemplate( '<asd atr="<%= 1 %>" />' ).render() == '<asd atr="1" />' );

		test( new TextTemplate( '<asd atr="<% prn(1) %>" />' ).render() == '<asd atr="1" />' );

		test( new TextTemplate( '<asd atr="<%= 2 //1 %>" />' ).render() );

	} );
	/*UNITESTS@*/

	/**
	 * Default settings for TextTemplate-s.
	 * An object with the following properties:
	 * - 'variable' - the name of the variable under which the template code will
	 *   access the template data, defaults to 'data';
	 * - 'evaluate' - evaluate regex, defaults to '<%([\\s\\S]+?)%>' - code inside <% %> will
	 *   be evaluated as JavaScript code;
	 * - 'interpolate' - interpolate regex, defaults to '<%=([\\s\\S]+?)%>' - code inside <%= %>
	 *   will be inserted in the output template;
	 * - 'escape' - escaped interpolation regex, defaults to '<%!([\\s\\S]+?)%>' - code inside <%! %>
	 *   will be inserted escaped in the output so it won't break HTML;
	 * - 'print' - name of function that will be available for the code inside the templates to
	 *   print text as it was enclosed in <%= %> or <%! %>. Defaults to 'prn', first argument accecpts text
	 *   second argument accepts bool if you want to escape the text. Could be null to disable this feature.
	 * @def static var TextTemplate.DefaultSettings
	 * @var object
	 */
	TextTemplate.DefaultSettings = {
		variable: 'data',
		evaluate: "<%([\\s\\S]+?)%>",
		interpolate: "<%=([\\s\\S]+?)%>",
		escape: "<%!([\\s\\S]+?)%>",
		print: 'prn'
	};

	//private static
	var _htmlEscapes = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#27;'
	};

	//private static
	var _htmlEscaper = /[&<>"']/g;

	function _escapeHtml ( match ) {
		return _htmlEscapes[match]; 
	}

	/**
	 * Converts HTML special characters inside text to entities.
	 * @def static function TextTemplate.escapeHtml ( text )
	 * @param string
	 * @return string
	 */
	TextTemplate.escapeHtml = function ( text ) {
		return text.replace( _htmlEscaper, _escapeHtml );
	};

	/*@UNITESTS*/
	Unitest( 'TextTemplate.escapeHtml()', function () {
		
		var escaped = TextTemplate.escapeHtml( '<a href="&\'">' );
		test( escaped == '&lt;a href=&quot;&amp;&#27;&quot;&gt;' );

	} );
	/*UNITESTS@*/

	TextTemplate.define( {

		/**
		 * Retrieves the source of the compiled template.
		 * @def function TextTemplate.getSource ()
		 * @return string
		 */
		getSource: function () {
			return this._source;
		},

		/**
		 * Renders the template with the given data.
		 * @def function TextTemplate.render ( data )
		 * @param mixed
		 * @return string
		 */
		render: function ( data ) {
			return this._template( data/*@DEBUG*/, this._source/*DEBUG@*/ );
		}
	} );

	/**
	 * @def static var TextTemplate.Cache
	 * @var object
	 */
	TextTemplate.Cache = {};

	var _cache = {};

	/**
	 * Shortcut function to create template from DOM element with given id.
	 * If second parameter is passed the template is rendered and the result returned.
	 * @param string Id of DOM element.
	 * @param mixed|undefined Data Data for {@see render()}.
	 * @return TextTemplate|string
	 * @throws Error Throws if the the specified id is neither in the cache nor in the DOM.
	 */
	function $TT ( id , data ) {
		var l2 = _cache[ id ];
		if ( l2 !== undefined ) {
			return data !== undefined ? l2.render( data ) : l2;
		}
		
		var l1 = TextTemplate.Cache[ id ];
		if ( l1 !== undefined ) {
			l2 = _fromCache( l1, id );
			_cache[ id ] = l2;
			return data !== undefined ? l2.render( data ) : l2;
		}

		var el = document.getElementById( id );
		if ( el ) {
			l2 = new TextTemplate( el.innerHTML, undefined, id );
			_cache[ id ] = l2;
			return data !== undefined ? l2.render( data ) : l2;
		}

		throw new Error( 'TEXTTEMPLATE_ID_NOT_FOUND' );
	}

	/*@UNITESTS*/
	Unitest( 'TextTemplate.Cache', function () {
		
		TextTemplate.Cache[ 't1' ] = new TextTemplate( 'asd' ).getSource();
		test( $TT( 't1' ).render() == 'asd' );
		
		TextTemplate.Cache[ 't1' ] = new TextTemplate( 'qwer' ).getSource();
		test( $TT( 't1' ).render() == 'asd' );

		TextTemplate.Cache = {};

	} );
	/*UNITESTS@*/

	exports.$TT = $TT;
	exports.TextTemplate = TextTemplate;

})( this, typeof global != 'undefined' ? global : window );