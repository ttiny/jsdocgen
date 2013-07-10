"use strict";


(function ( exports ) {

	/**
	 * Somehow GFM compatible parser.
	 * - [GFM](https://help.github.com/articles/github-flavored-markdown)
	 * - [GFM Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
	 *
	 * Additionally:
	 * - ~~~ can be used for code blocks (GitHub also supports this)
	 * - \[Internal link\]\[^anchor-name\]
	 * - \[^anchor-name\]:
	 * - This is \___underline\___.
	 * - This is \--strike though\-- also.
	 * - Line breaks inside headers.
	 * - GFM line breaks are not respected.
	 *   Always two trailing spaces and a newline to insert a line break.
	 * - \\b will delete the previous character.
	 * - Additional escape characters: ~ < > / | and space and tab.
	 *
	 * @def function string Markdown.toHtml ( text:string, options:Markdown.Options|undefined )
	 * @param Markdown string.
	 * @param Options for the generated HTML.
	 * @return Html string.
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	/**
	@def object Markdown.Options {
		tableClass:string = "'table stripped'",
		thClass:string = "'text-left'"
		tdLeftClass:string = "'text-left'",
		tdRightClass:string = "'text-right'",
		tdCenterClass:string = "'text-center'",
		codeLangClassPrefix:string = "'lang-'",
		codeDefaultLang:string = "null",
		codeBlockWrapPre:bool = "false",
		codeBlockClass:string = "block",
		codeInlineClass:string = "inline",
		codeInlineTag:string = "code",
		codeBlockCallback:function = "null",
		needParagraph:bool = "false"
	}
	@param Class attribute for table tag.
	@param Class attribute for table > thead > th tag.
	@param Class attribute for table > tbody > td tag to align the text left.
	@param Class attribute for table > tbody > td tag to align the text right.
	@param Class attribute for table > tbody > td tag to align the text center.
	@param Class prefix for code blocks with specified language.
	@param Default language for code blocks.
	@param If to wrap code blocks with pre tag.
	@param Adds a class name to the code blocks to be able to identify the from inline code.
	@param Adds a class name to the inline code elments to be able to identify the from code block.
	@param Chooses a different tag for 'inline code'.
	@param Callback that can be used to style the the code in code blocks.
	If used this callback is reponsible for escaping HTML entities inside the block.
	@param If needs to wrap the top level element in paragraph.
	*/



	
	// based on the work by Steven Levithan
	// http://stevenlevithan.com/assets/misc/recursion/matchRecursiveRegExp.js
	function matchRecursive ( str, left, right, flags ) {
		var flags = flags || '';
		var global = flags.indexOf( 'g' ) > -1;
		var re = new RegExp( '(' + left + ')|' + right, 'g' + flags );
		var ret = [];
		var t, start, m;
		var startm;

		ret:do {
			t = 0;
			while ( m = re.exec( str ) ) {
				if ( m[1] ) {
					if ( t++ == 0 ) {
						start = re.lastIndex;
						startm = m;
					}
				}
				else if ( t ) {
					if ( --t == 0 ) {
						ret.push( {
							match: str.slice( startm.index, re.lastIndex ),
							start: startm.index,
							end: re.lastIndex,
							left: {
								match: startm[1],
								start: startm.index,
								end: startm.index + startm[1].length
							},
							right: {
								match: m[2],
								start: m.index,
								end: re.lastIndex
							}
						} );
						if ( global === false ) {
							break ret;
						}
					}
				}
			}
		} while ( t && ( re.lastIndex = start ) );

		return ret.length > 0 ? ( global ? ret : ret[0] ) : null;
	}

	//console.log( matchRecursive( '<code>asd <code>asd</code> qwe</code>', '<code[^>]*>', '</code>' ) );
	//console.log( matchRecursive( '<code>asd <code>asd qwe</code>', '<code[^>]*>', '</code>' ) );
	//console.log( matchRecursive( '<code>asd <code>asd qwe', '<code[^>]*>', '</code>' ) );

	var _reUnderline = /([^_]|^)(___(?!_))([\s\S]+?)___(?!_)/gm;
	var _reStrong1 = /([^\*]|^)(\*\*(?!\*))([\s\S]+?)\*\*(?!\*)/gm;
	var _reStrong2 = /([^_]|^)(__(?!_))([\s\S]+?)__(?!_)/gm;
	var _reEm1 = /([^\*]|^)(\*(?!\*))([\s\S]+?)\*(?!\*)/gm;
	var _reEm2 = /([^_a-zA-Z0-9]|^)(_(?!_))((?:[^_]|[a-zA-Z0-9_]+_+[a-zA-Z0-9_]+)+?)_(?![_a-zA-Z0-9])/gm;
	var _reStrike1 = /([^\-]|^)(--(?!-))([\s\S]+?)--(?!-)/gm;
	var _reStrike2 = /([^~]|^)(~~(?!~))([\s\S]+?)~~(?!-)/gm;
	var _reInlineCode1 = /([^`]|^)(?:``)(?!`) ?([\s\S]+?) ?``(?!`)/gm;
	var _reInlineCode2 = /([^`]|^)(?:`(?!`))([\s\S]+?)`(?!`)/gm;
	var _emphasisTags = {
		'*': 'em',
		'_': 'em',
		'**': 'strong',
		'__': 'strong',
		'~~': 'strike',
		'--': 'strike',
		'___': 'u',
	};

	var _reBr = /  \n/gm;
	var _reBackSpace = /(.)\\b/gm;
	function _aNameCb ( m, id ) {
		return '<a name="'+escapeHtmlAttr(id.substr(1).toLowerCase())+'"></a>';
	}

	var _reRef2 = /\[(\^.+?)\]:\n?/gm;
	function parseBrBs ( text ) {
		var ret = text
					.replace( _reBackSpace, '' )
					.replace( _reBr, '<br/>' )
					.replace( _reRef2, _aNameCb )
					.trim();
		return ret;
	}

	//inline
	var _reLink1 = /(!)?\[(.*?)\]\((.*?)(?: "([^"\\]*(?:\\.[^"\\]*)*)")?\)/gm;
	//reference
	var _reLink2 = /(!)?\[(.*?)\]\[(.*?)\]/gm;

	//<email|url> which is not html tag
	var _reAutoLink = /<(?!\/[a-zA-Z])(?:([^"'>\s]+@[^"'\s>]+)|([^"'>\s]+:\/\/[^"'>\s]+))>/gm;

	function parseInline_cb0 ( m, email, url ) {
		if ( email ) {
			return '&lt;<a href="mailto:'+escapeHtmlAttr(email)+'">'+email+'</a>&gt;';
		}
		else /*if ( url )*/ {
			return '&lt;<a href="'+escapeHtmlAttr(url)+'">'+url+'</a>&gt;';
		}
	}

	function parseInline ( text, ret ) {

		function parseInline_cb1 ( m, isimg, text, url, title ) {
			if ( isimg ) {
				var title = ' title="'+escapeHtmlAttr(text||title)+'"';
				title = title.length > 9 ? title : '';
				return '<img src="'+escapeHtmlAttr(url)+'"'+title+' />';
			}
			else {
				if ( !text ) {
					return m;
				}
				var title = ' title="'+escapeHtmlAttr(title||'')+'"';
				title = title.length > 9 ? title : '';
				return '<a href="'+escapeHtmlAttr(url)+'"'+title+'>'+parseInline(text, ret)+'</a>';
			}
		}

		function parseInline_cb2 ( m, isimg, text, id ) {
			if ( !id ) {
				if ( text ) {
					id = text;
				}
				else {
					return m;
				}
			}
			if ( !isimg && id.charAt( 0 ) == '^' ) {
				return '<a href="#'+escapeHtmlAttr(id.substr(1).toLowerCase())+'">'+parseInline(text, ret)+'</a>';
			}
			else {
				var ref = ret.references[ id.toLowerCase() ];
				if ( ref === undefined ) {
					return m;
				}
				if ( isimg ) {
					var title = ' title="'+escapeHtmlAttr(text||ref.title)+'"';
					title = title.length > 9 ? title : '';
					return '<img src="'+escapeHtmlAttr(ref.url)+'"'+title+' />';
				}
				else {
					if ( !text ) {
						return m;
					}
					var title = ' title="'+escapeHtmlAttr(ref.title||'')+'"';
					title = title.length > 9 ? title : '';
					return '<a href="'+escapeHtmlAttr(ref.url)+'"'+title+'>'+parseInline(text, ret)+'</a>';
				}
			}
		}

		function parseInline_cb3 ( m, m1, m2, m3 ) {
			var tag = _emphasisTags[ m2 ];
			return m1 + '<'+tag+'>' + parseInline( m3, ret ) + '</'+tag+'>';
		}

		function parseInline_cb4 ( m, m1, m2 ) {
			var tag = ret.codeInlineTag;
			var cls = ret.codeInlineClass ? ' class="'+ret.codeInlineClass+'"' : '';
			return m1 + '<'+tag+cls+'>' + escapeHtmlAttr( m2 ) + '</'+tag+'>';
		}

		text = text.replace( _reInlineCode1, parseInline_cb4 );
		text = text.replace( _reInlineCode2, parseInline_cb4 );
		text = text.replace( _reAutoLink, parseInline_cb0 );
		text = text.replace( _reLink1, parseInline_cb1 );
		text = text.replace( _reLink2, parseInline_cb2 );
		text = text.replace( _reUnderline, parseInline_cb3 );
		text = text.replace( _reStrong1, parseInline_cb3 );
		text = text.replace( _reStrong2, parseInline_cb3 );
		text = text.replace( _reEm1, parseInline_cb3 );
		text = text.replace( _reEm2, parseInline_cb3 );
		text = text.replace( _reStrike1, parseInline_cb3 );
		text = text.replace( _reStrike2, parseInline_cb3 );

		return parseBrBs( text );
	}

	function parseListItems ( text, spaces, type, ret ) {
		type = type.length == 1 ? '[\\+\\-\\*]' : '\\d+\\.';
		var _reListItem = new RegExp( '^(?: *'+type+' ((?:[^\\n]|\\n(?!'+spaces+type+' ))*))', 'gm' );
		var m;
		while ( m = _reListItem.exec( text ) ) {
			ret.html += '<li>';
			parseMarkdown( m[1], ret, false );
			ret.html += '</li>';
		}
	}

	var _reList = /^(?:( *)([\+\-\*]|\d+\.) (?:[^\n]|\n(?!\n))*)+(?:\n\n|$)/gm;
	function parseList ( text, ret ) {
		var m = _reList.exec( text );
		if ( m === null ) {
			return false;
		}

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );

		//the match
		var tag = m[2].length == 1 ? 'ul' : 'ol';
		ret.html += '<'+tag+'>';
		parseListItems( m[0], m[1], m[2], ret );
		ret.html += '</'+tag+'>'

		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );
		
		return true;
	}


	var _reHeader = /^(#+) ((?:[^\n]+?(?:  \n)?)+?)#*$/gm;
	function parseHeaders ( text, ret ) {
		var m = _reHeader.exec( text );
		if ( m === null ) {
			return false;
		}

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );

		//the match
		var tag = 'h'+Math.min( m[1].length , 6 );
		ret.html += '<'+tag+'>';
		parseMarkdown( m[2], ret, false );
		ret.html += '</'+tag+'>'
		
		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );

		return true;
	}

	var _reAltHeader = /^((?:[^\n](?:  \n[^\n=\-])?)+?)\n(?:(=){3,}|(-){3,})$/gm;
	function parseAltHeaders ( text, ret ) {

		var m = _reAltHeader.exec( text );
		if ( m === null ) {
			return false;
		}

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );
		
		var tag = 'h'+(m[2] ? '1' : '2');
		ret.html += '<'+tag+'>';
		parseMarkdown( m[1], ret, false );
		ret.html += '</'+tag+'>';
		
		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );

		return true;
	}


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
	var _htmlEscaper2 = /[&<>]/g;

	function escapeHtml_cb ( match ) {
		return _htmlEscapes[match]; 
	}

	function escapeHtml ( text ) {
		return text.replace( _htmlEscaper, escapeHtml_cb );
	}

	function escapeHtmlBasic ( text ) {
		return text.replace( _htmlEscaper2, escapeHtml_cb );
	}

	var _mdEscaper = /\\[\\`\*_{}\[\]()#+\-\.!~<> \t\/\|]/gm;
	var _mdEscaper2 =  /[\\`\*_{}\[\]()#+\-\.!~<>\/\|]/gm;

	function escapeMarkdown_cb ( match ) {
		return '&#'+match.charCodeAt( 1 )+';'; 
	}

	function escapeMarkdown_cb2 ( match ) {
		return '&#'+match.charCodeAt( 0 )+';'; 
	}

	function escapeMarkdown ( text ) {
		return text.replace( _mdEscaper, escapeMarkdown_cb );
	}

	function escapeMarkdownAttr ( text ) {
		return text.replace( _mdEscaper2, escapeMarkdown_cb2 );
	}

	function escapeHtmlAttr ( text ) {
		return escapeMarkdownAttr( escapeHtml( text ) );
	}

	var _reRef1 = /\[([^\^].*?)\]: ?([^\s]+)(?: "([^"\\]*(?:\\.[^"\\]*)*)")?\n?/gm;
	function getReferences ( text, ret ) {
		return text.replace( _reRef1, function ( m, id, url, title ) {
			ret.references[id.toLowerCase()] = { url: url, title: title };
			return '';
		} );
	}

	function markdownWithoutCode ( text, ret ) {
		return getReferences( escapeMarkdown( text ), ret );
	}

	var _reTrimCodeLeft1 = /^    /gm;
	var _reTrimCodeLeft2 = /^\t/gm;
	var _reCode1 = /^`{3,}([^\n]+)?\n(?:([\s\S]+?)\n)?`{3,}$/gm;
	var _reCode2 = /^~{3,}([^\n]+)?\n(?:([\s\S]+?)\n)?~{3,}$/gm;
	var _reCode3 = /(?:\n\n|^)(\t(?:[^\n]|\n\t)+)(?:\n\n|$|\n(?!\t))/g;
	var _reCode4 = /(?:\n\n|^)(    (?:[^\n]|\n    )+)(?:\n\n|$|\n(?!    ))/g;
	function parseCode ( text, ret ) {

		var m = _reCode1.exec( text ) || _reCode2.exec( text );
		var alt = false;

		if ( m === null ) {
			alt = true;
			m = _reCode3.exec( text );
			if ( m === null ) {
				m = _reCode4.exec( text );
				if ( m === null) {
					m = matchRecursive( text, '<code[^>]*>', '</code>', 'i' );
					if ( m === null ) {
						return false;
					}
					else {
						//before the match
						parseMarkdown( markdownWithoutCode( text.substr( 0, m.start ), ret ), ret, true );
						
						//the match
						ret.html += m.match;

						//after the match
						parseMarkdown( text.substr( m.end ), ret, true );

						return true;
					}
				}
				else {
					m[1] = m[1].replace( _reTrimCodeLeft1, '' );
				}
			}
			else {
				m[1] = m[1].replace( _reTrimCodeLeft2, '' );
			}
		}

		//before the match
		parseMarkdown( markdownWithoutCode( text.substr( 0, m.index ), ret ), ret, true );
		
		var cls = m[1] || ret.codeDefaultLang;
		if ( ret.codeBlockClass ) {
			cls = ( cls ? ret.codeLangClassPrefix + cls + ' ' : '' ) + ret.codeBlockClass;
		}
		cls = ( alt == false && cls ) ? ' class="'+cls+'"' : '';
		
		ret.html += ( ret.codeBlockWrapPre ? '<pre>' : '' ) + '<code'+cls+'>';
		
		ret.html += ret.codeBlockCallback ?
						ret.codeBlockCallback( m[ alt ? 1 : 2 ] ) :
						escapeHtmlBasic( m[ alt ? 1 : 2 ], m[1], ret.codeDefaultLang );
		
		ret.html += '</code>' + ( ret.codeBlockWrapPre ? '</pre>' : '' );
		
		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );

		return true;
	}


	var _reHr = /(?:^|\n\n)[\*_\-]{3,}(?:$|\n\n)/gm;
	function parseHr ( text, ret ) {
		var m = _reHr.exec( text );
		if ( m === null ) {
			return false;
		}

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );

		//the match
		ret.html += '<hr/>'
		
		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );

		return true;
	}

	var _reBlockquote = /^(> (?:[^\n]|\n>)+)(?:\n\n|$)/gm;
	var _reTrimBlockquoteLeft = /^> /gm;
	function parseBlockquote ( text, ret ) {
		var m = _reBlockquote.exec( text );
		if ( m === null ) {
			return false;
		}

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );

		m[1] = m[1].replace( _reTrimBlockquoteLeft, '' );

		//the match
		ret.html += '<blockquote>';
		parseMarkdown( m[1], ret, false );
		ret.html += '</blockquote>';

		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );
		
		return true;
	}


	var _strReTableRow = '(?:^ *\\|?(?:[^\\|\\n]+\\|[^\\|\\n]+)+(?:\\|[^\\|\\n]+)?\\|? *\\n?)';
	var _strReTableHead = '(?:^ *\\|?(?: *:?-+?:? *\\| *:?-+:? *)+(?:\\| *:?-+:? *)?\\|? *\\n?)';
	var _reTrimTableLeft = /^ *\|? */gm;
	var _reTrimTableRight = / *\|? *$/gm;
	var _reTable = new RegExp( '('+_strReTableRow+')('+_strReTableHead+')('+_strReTableRow+'*)', 'gm' );
	function parseTable ( text, ret ) {
		var m = _reTable.exec( text );
		if ( m === null ) {
			return false;
		}

		var m0 = m[0].trim().replace( _reTrimTableLeft, '' ).replace( _reTrimTableRight, '' );

		//before the match
		parseMarkdown( text.substr( 0, m.index ), ret, true );

		//the match
		ret.html += '<table class="'+ret.tableClass+'">';
		var rows = m0.split( '\n' );
		var aligns = [];
		//captions, if any
		if ( m[1] ) {
			var captions = rows.shift().split( '|' );
			ret.html += '<thead><tr>';
			for ( var i = 0, iend = captions.length; i < iend; ++i ) {
				ret.html += '<th class="'+ret.thClass+'">';
				parseMarkdown( captions[i].trim(), ret, false );
				ret.html += '</th>';
			}
			ret.html += '</tr></thead>';
		}
		//aligns, if any
		if ( m[2] ) {
			aligns = rows.shift().split( '|' );
			for ( var i = 0, iend = aligns.length; i < iend; ++i ) {
				var col = aligns[i].trim();
				var left = col.charAt( 0 ) == ':';
				var right = col.charAt( col.length - 1 ) == ':';
				if ( left && right ) {
					aligns[i] = ret.tdCenterClass;
				}
				else if ( right ) {
					aligns[i] = ret.tdRightClass;
				}
				else if ( left ) {
					aligns[i] = ret.tdLeftClass;
				}
				else {
					aligns[i] = '';
				}
			}
		}

		//normal rows
		ret.html += '<tbody>';
		for ( var i = 0, iend = rows.length; i < iend; ++i ) {
			var cols = rows[i].split( '|' );
			ret.html += '<tr>';
			for ( var j = 0, jend = cols.length; j < jend; ++j ) {
				var cls = ' class="'+(aligns.length>j?aligns[j]:'')+'"';
				cls = cls.length > 9 ? cls : '';
				ret.html += '<td'+cls+'>';
				parseMarkdown( cols[j].trim(), ret, false );
				ret.html += '</td>';
			}
			ret.html += '</tr>';
		}
		ret.html += '<tbody>';
		ret.html += '</table>';

		//after the match
		parseMarkdown( text.substr( m.index + m[0].length ), ret, true );
		
		return true;
	}

	function parseMarkdown ( text, ret, needp ) {
		
		if ( !parseCode( text, ret ) ) {
			text = markdownWithoutCode( text, ret );
		}
		else {
			return ret.html;
		}

		if (
		
			!parseHeaders( text, ret ) &&
			!parseAltHeaders( text, ret ) &&
			!parseList( text, ret ) &&
			!parseBlockquote( text, ret ) &&
			!parseTable( text, ret ) &&
			!parseHr( text, ret ) &&
			(text = parseInline( text, ret )).length > 0

		) {
			if ( text.indexOf( '\n\n' ) >= 0 ) {
				text = text.split( '\n\n' ).join( '</p><p>' );
				needp = true;
			}
			if ( needp ) {
				ret.html += '<p>' + text + '</p>';
			}
			else {
				ret.html += text;
			}
		}

		return ret.html;
	}


	function toHtml ( text, options ) {
		
		var ret = {
			tableClass: 'table stripped',
			thClass: 'text-left',
			tdLeftClass: 'text-left',
			tdRightClass: 'text-right',
			tdCenterClass: 'text-center',
			codeLangClassPrefix: 'lang-',
			codeDefaultLang: null,
			codeBlockClass: 'block',
			codeInlineClass: 'inline',
			codeInlineTag: "code",
			needParagraph: false
		};

		if ( options instanceof Object ) {
			delete options.html;
			delete options.references;
			for ( var key in ret ) {
				if ( options[key] !== undefined ) {
					ret[key] = options[key];
				}
			}
		}

		ret.html = '';
		ret.references = {};

		text = text.replace( /\r\n|\r/g, '\n' );
			
		return parseMarkdown( text, ret, ret.needParagraph );
	}


	exports.Markdown = {
		toHtml: toHtml,
		escapeHtml: escapeHtml
	};

})( this );