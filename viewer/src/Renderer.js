"use strict";

/*@import view/View/HtmlArea*/

(function ( exports ) {

	/**
	 * Renders a docblock in JSON format as HTML.
	 * @def class DocBlockViewer.Renderer extends View.HtmlArea
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */
	function Renderer () {
		View.HtmlArea.call( this );
		this._element.classList.add( 'DocBlockViewer-Renderer' );
		this._lang = null;
	}

	var _reSee = /{@see (.+?)}/g;
	Renderer.extend( View.HtmlArea, {

		setLang: function ( lang ) {
			this._lang = lang;
			return this;
		},

		/**
		 * Renders a docblock from JSON format to HTML.
		 * @def function DocBlockViewer.Renderer.render ( context )
		 * @unstable
		 */
		render: function ( context ) {

			var that = this;
			var docblock = context.DocBlock;
			var contextblock = context.DocBlock;

			if ( context.Type == 'method' || context.Type == 'var' || context.Type == 'const' ) {
				var imember = docblock.members[ context.Type ].index[ context.Symbol ];
				if ( imember !== undefined ) {
					docblock = docblock.members[ context.Type ][ imember ];
				}
			}


			function description ( text ) {
				if ( !text ) {
					return text;
				}
				text = text.replace( _reSee, function ( m, m1 ) {
					return $TT( 'Tmpl.DocBlockViewer.Renderer.SeeTag', that._lang.parseSeeTag( m1 ) );
				} );
				return text;
			}

			function summary ( docblock ) {
				if ( docblock.summary === undefined ) {
					return '';
				}
				return $TT( 'Tmpl.DocBlockViewer.Renderer.Summary', description( docblock.summary ) );
			}

			function attrs ( docblock ) {

				/*if ( docblock.def['type'] == 'function' || docblock.def['type'] == 'method' ) {
					return '';
				}*/
				if (
					docblock.def['declared'] ||
					docblock.def['access'] == 'protected' ||
					docblock.def['access'] == 'private' ||
					docblock.def['abstract'] ||
					docblock.def['attr']
				) {
					return $TT( 'Tmpl.DocBlockViewer.Renderer.SymbolAttrsSection', docblock.def );
				}
				return '';
			}

			function syntax ( docblock ) {
				if ( docblock.def['type'] == 'method' || docblock.def['type'] == 'function' ) {
					                                                      //this is dirty
					return $TT( 'Tmpl.DocBlockViewer.Renderer.Syntax', { def: docblock.def, parseUrl: that._lang.parseSeeTag } );
				}
				return '';
			}

			function args ( docblock ) {
				if ( !docblock.def['args'] ) {
					return '';
				}

				//parse the see tags in argument descriptions
				var data = [];
				var args = docblock.def['args'];
				data.length = args.length;
				for ( var i = args.length - 1; i >= 0; --i ) {
					var def = args[i]/*.duplicate()*/;
					data[i] = { def: def, parseUrl: that._lang.parseSeeTag };
					if ( def['description'] ) {
						def['description'] = description( def['description'] );
					}
				}

				if ( docblock.def['vaarg'] ) {
					data.push( {
						def: {
							name: '...',
							description:
								docblock.def['vaarg'] === true ?
									R.get( 'str.docblockviewer.renderer.vaarg', docblock.def['type'] ) :
									description( docblock.def['vaarg'] )
						},
						parseUrl: that._lang.parseSeeTag
					} );
				}

				return $TT( 'Tmpl.DocBlockViewer.Renderer.Arguments', data );
			}

			function thraws ( docblock ) {
				if ( docblock.tags['throws'] === undefined ) {
					return '';
				}

				//parse the see tags in descriptions
				var data = [];
				var trolls = docblock.tags['throws'];
				data.length = trolls.length;
				for ( var i = trolls.length - 1; i >= 0; --i ) {
					var def = trolls[i]/*.duplicate()*/;
					data[i] = { def: def, parseUrl: that._lang.parseSeeTag };
					if ( def['description'] ) {
						def['description'] = description( def['description'] );
					}
				}

				return $TT( 'Tmpl.DocBlockViewer.Renderer.Throws', data );
			}

			function vartype ( docblock ) {
				if ( docblock.def['type'] != 'var' && docblock.def['type'] != 'const' ) {
					return '';
				}
				if ( !docblock.def['description'] && !docblock.def['vartype'] && !docblock.def['value'] ) {
					return '';
				}

				//parse the see tags in descriptions
				var data = { def: docblock.def, parseUrl: that._lang.parseSeeTag };
				if ( data.def['description'] ) {
					data.def['description'] = description( data.def['description'] );
				}

				return $TT( 'Tmpl.DocBlockViewer.Renderer.VariableSyntax', data );
			}

			function returns ( docblock ) {
				if ( docblock.def['return'] === undefined ) {
					return '';
				}
				if ( !docblock.def['return'].description && !docblock.def['return'].vartype ) {
					return '';
				}

				//parse the see tags in description
				var data = { def: docblock.def['return'], parseUrl: that._lang.parseSeeTag };
				if ( data.def['description'] ) {
					data.def['description'] = description( data.def['description'] );
				}

				return $TT( 'Tmpl.DocBlockViewer.Renderer.Returns', data );
			}

			function inherited ( docblock ) {
				var def = docblock.def;
				var data = [];
				var types = { 'extends': 'class', 'implements': 'interface', 'uses': 'trait' }
				for ( var key in types ) {
					if ( def[key] instanceof Array && def[key].length > 0 ) {
						var list = def[key];
						for ( var i = 0, iend = list.length; i < iend; ++i ) {
							var item = list[i];
							data.push( {
								name: item.name,
								direct: item.direct,
								url: that._lang.parseSeeTag( item.link ).url
							} );
						}
						
					}
				}
				return data.length > 0 ? $TT( 'Tmpl.DocBlockViewer.Renderer.InheritedTypes', data ) : '';
			}

			function derived ( docblock ) {
				var def = docblock.def;
				if ( def['derived'] === undefined || def['derived'].length == 0 ) {
					return '';
				}
				var data = [];
				data.length = def['derived'].length;
				var list = def['derived'];
				for ( var i = 0, iend = list.length; i < iend; ++i ) {
					var item = list[i];
					data[i] = {
						name: item.name,
						direct: item.direct,
						url: that._lang.parseSeeTag( item.link ).url
					};
				}
				return $TT( 'Tmpl.DocBlockViewer.Renderer.DerivedTypes', data );
			}

			function members ( docblock ) {
				if ( docblock.members === undefined ) {
					return '';
				}
				var datalength = 0;
				var data = { 'const': [], 'var': [], 'method': [] };
				for ( var key in docblock.members ) {
					var members = docblock.members[key];
					if ( members.length > 0 ) {
						++datalength;
						for ( var i = 0, iend = members.length; i < iend; ++i ) {
							data[key].push( {
								type: key,
								name: members[i].def['name'],
								summary: description( members[i].summary ),
								symbol: members[i].def,
								url: that._lang.makeSymbolUrl( key, members[i].def ) 
							} );
						}
						
					}
				}
				return datalength > 0 ? $TT( 'Tmpl.DocBlockViewer.Renderer.Members', data ) : '';
			}

			function remarks ( docblock ) {
				if ( docblock.description === undefined ) {
					return '';
				}
				return $TT( 'Tmpl.DocBlockViewer.Renderer.Remarks', { text: description( docblock.description ), context: docblock.def } );
			}

			function deprecated ( docblock ) {
				if ( docblock.tags['deprecated'] === undefined ) {
					return '';
				}
				return $TT( 'Tmpl.DocBlockViewer.Renderer.Deprecated', docblock.tags['deprecated'].description || null );
			}

			function seealso ( docblock ) {
				var see = docblock.tags['see'];
				if ( see === undefined ) {
					return '';
				}
				var data = [];
				data.length = see.length;
				for ( var i = see.length - 1; i >= 0; --i ) {
					data[i] = that._lang.parseSeeTag( see[i] );
				}
				return $TT( 'Tmpl.DocBlockViewer.Renderer.SeeSection', data );
			}

			function meta ( docblock ) {
				var data = [];

				var pkg = docblock.tags['package'] || contextblock.tags['package'];
				if ( pkg ) {
					data.push( { name: 'package', value: TextTemplate.escapeHtml( pkg ) } );
				}

				if ( context.Ns ) {
					data.push( { name: 'namespace', value: TextTemplate.escapeHtml( context.Ns ) } );
				}
				
				var file;
				if ( docblock.def['type'] == 'file' ) {
					file = docblock.def['name'];
				}
				else {
					file = docblock.tags['file'] ? docblock.tags['file'].name : (contextblock.tags['file'] ? contextblock.tags['file'].name : null );
				}
				if ( file ) {
					data.push( { name: 'file', value: file } );
				}

				if ( docblock.tags['autoinheritdoc'] instanceof Object ) {
					data.push( {
						name: 'autoinheritdoc',
						//todo: no markup here
						value: '<a href="' +
							that._lang.parseSeeTag( docblock.tags['autoinheritdoc'].link ).url + '">' +
							docblock.tags['autoinheritdoc'].name + '</a>'
					} );
				}

				[ 'author', 'license', 'copyright' ].forEach( function( key ) {
					if ( docblock.tags[key] !== undefined ) {
						var tag = docblock.tags[key];
						for ( var i = 0, iend = tag.length; i < iend; ++i ) {
							data.push( {
								name: key,
								value: description( tag[i] )
							} );
						}
					}
				} );

				if ( context.IsMember && contextblock.tags['author'] !== undefined ) {
					for ( var i = 0, iend = contextblock.tags['author'].length; i < iend; ++i ) {
						data.push( {
							name: 'author-inherited',
							value: description( contextblock.tags['author'][i] ),
							parentType: contextblock.def['type']
						} );
					}
				}

				return data.length > 0 ? $TT( 'Tmpl.DocBlockViewer.Renderer.Meta', data ) : '';
			}

			var html = '';
			html += summary( docblock );
			html += deprecated( docblock );
			html += attrs( docblock );
			html += syntax( docblock );
			html += thraws( docblock );
			html += returns( docblock );
			html += args( docblock );
			html += vartype( docblock );
			html += inherited( docblock );
			html += derived( docblock );
			html += remarks( docblock );
			html += members( docblock );
			html += seealso( docblock );
			html += meta( docblock );
			this.setHtml( html );

			var el = this.getElement();
			var codes = el.querySelectorAll( 'code:not(.inline):not(.prettyprinted)' );
			for ( var i = codes.length - 1; i >= 0; --i ) {
				var code = codes[i];
				var html = code.innerHTML;
				if ( !code.classList.contains( 'block' ) && html.indexOf( '\n' ) > -1 ) {
					code.classList.add( 'block' );
				}
				if ( html.charAt( 0 ) == '\n' ) {
					html = html.substr( 1 );
					code.innerHTML = html;
				}
				code.classList.add( 'prettyprint' );
			}

			if ( window.prettyPrint ) {
				prettyPrint();
			}
		}
	} );

	exports.DocBlockViewer.Renderer = Renderer;

})( this );