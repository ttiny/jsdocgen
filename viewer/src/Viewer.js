"use strict";

function jsdocgen_data ( file, json ) {
	jsdocgen_data._callbacks[ file ]( { Success: true, Data: json } );
}

jsdocgen_data._callbacks = {};

(function ( exports ) {


	/**
	 * This is the main view class of the doc viewer.
	 * @def class DocBlockViewer
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	 /**
	  * @def constructor DocBlockViewer
	  * @param App
	  * @param DocBlockViewer.Config
	  */

	/**
	 @def object DocBlockViewer.Config
	 {
	 	DocsLocation:string,
	 	Lang: string,
	 	Sidebar: bool = "true",
	 	Contents: bool = "true",
	 	Namespaces: bool = "true",
	 	Packages: bool = "true"
	 }
	 */

	/**
	 * Dispatched when some content is being loaded in the component.
	 * @def event DockBlockViewer::DocBlockViewer.Loading
	 */

	/**
	 * Dispatched when loading content is finished in the component.
	 * @def event DockBlockViewer::DocBlockViewer.Loaded
	 */
	function DocBlockViewer ( appView, config ) {
		View.call( this );
		this._element.classList.add( 'DocBlockViewer' );


		this._appView = appView;
		this._cfg = config;
		this._docContext = new DocBlockViewer.SymbolContext();
		this._lastDocContext = null;
		this._req = new RequestManager();
		this._req.defineGroup( 'index', 'abort' );
		this._req.defineGroup( 'content', 'abort' );
		this._lang = new DocBlockViewer.Lang[ config.Lang.charAt( 0 ).toUpperCase() + config.Lang.substr( 1 ) ];

		this.addView( $T( 'Tmpl.DocBlockViewer' ) );

		this._vHeader = this.findView( '#DocBlockViewer-Header' );
		this._vHeaderTmpl = this._vHeader.getHtml();
		this._vSidebar = this.findView( '#DocBlockViewer-Sidebar' );
		
		this._vTabContents = this.findView( '#DocBlockViewer-Tab-Contents' );
		this._vContents = this.findView( '#DocBlockViewer-Contents' );
		this._vContents.setLang( this._lang );

		this._vTabPackages = this.findView( '#DocBlockViewer-Tab-Packages' );
		this._vPackages = this.findView( '#DocBlockViewer-Packages' );
		this._vPackages.setLang( this._lang );

		this._vTabNamespaces = this.findView( '#DocBlockViewer-Tab-Namespaces' );
		this._vNamespaces = this.findView( '#DocBlockViewer-Namespaces' );
		this._vNamespaces.setLang( this._lang );

		this._vRenderer = this.findView( '#DocBlockViewer-Renderer' );
		this._vRenderer.setLang( this._lang );

		var that = this;
		this._req.addEventListener( 'RequestManager.Started', function () {
			var evt = new CustomEvent( 'DocBlockViewer.Loading', { bubbles: false, cancelable: false } );
			that.dispatchEvent( evt );
		} );

		this._req.addEventListener( 'RequestManager.Finished', function () {
			var evt = new CustomEvent( 'DocBlockViewer.Loaded', { bubbles: false, cancelable: false } );
			that.dispatchEvent( evt );
		} );

		window.addEventListener( 'hashchange', this._hashChanged.bind( this ) );
	}

	DocBlockViewer.defineStatic( {
		Locale: {},
		Lang: {}
	} );


	DocBlockViewer.extend( View, {

		/**
		 * Initializes the view with all its subviews and loads the content.
		 * @def function DocBlockViewer.init ()
		 */
		init: function ( title, subtitle ) {
			this._setHeader( title, subtitle );
			this._title = title;
			this._subtitle = subtitle;
			this._loadIndex();
			this._hashChanged();
		},

		_setHeader: function ( title, subtitle ) {
			this._vHeader.setHtml( R.render( this._vHeaderTmpl, title, subtitle ) );
		},

		_requestDocJson: function ( group, file, callback ) {
			if ( location.href.startsWith( 'file:///' ) ) {
				jsdocgen_data._callbacks[ file ] = callback;
				App.include( this._cfg.DocsLocation + file, 'js', function () {
					this.parentNode.removeChild( this );
					delete jsdocgen_data._callbacks[ file ];
				} );
			}
			else {
				this._req.addRequest(
					group, {
						url: this._cfg.DocsLocation + file,
						//dataEncoding: 'json',
						//forceResponseEncoding: 'json'
					}, function ( res ) {
						if ( res.Success ) {
							res.Data = JSON.parse( res.Data.substring( res.Data.indexOf( '{' ), res.Data.lastIndexOf( '}' ) + 1 ) );
							callback( res );
						}
						else {
							/*@DEBUG*/
							if ( window.DEBUG ) {
								console.error( res.Error );
							}
							/*DEBUG@*/
						}
					}
				).send();
			}
		},

		_loadIndex: function () {
			var that = this;
			this._requestDocJson( 'index', 'index.jsonp', function ( res ) {
				that._vNamespaces.setIndex( res.Data );
				that._vTabNamespaces.setState( 'disabled', false );
				that._vPackages.setIndex( res.Data );
				that._vTabPackages.setState( 'disabled', false );
				if ( !that._docContext.HasContents ) {
					that._vSidebar.getStrip().setActive( that._vTabPackages );
				}
			} );
		},

		_showContent: function ( docblock ) {
			this._docContext.DocBlock = docblock;

			var title, subtitle;
			if ( docblock.def.type == 'page' ) {
				title = this._title;
				subtitle = this._subtitle;
			}
			else {
				
				title =
					( this._docContext.IsMember && this._docContext.ContentsSymbol ?
						'<a href="'+this._lang.makeSymbolUrl( this._docContext.DocBlock.def.type, this._docContext.DocBlock.def )+'">' + this._docContext.ContentsSymbol + '</a>::' : '' 
					) +
					( this._docContext.SymbolPretty || this._docContext.Symbol );
				subtitle = R.get( 'str.docblockviewer.header.subtitle.' + this._docContext.Type );
			}

			this._setHeader( title, subtitle );

			if ( this._docContext.HasContents ) {
				this._vTabContents.setState( 'disabled', false );
				if ( this._docContext.ContentsSymbol != this._lastDocContext.ContentsSymbol ) {
					this._vSidebar.getStrip().setActive( this._vTabContents );
					this._vContents.render( this._docContext );
				}

			}
			else {
				if ( this._vSidebar.getStrip().getActive() === this._vTabContents ) {
					this._vSidebar.getStrip().setActive( this._vTabPackages );
				}
				this._vTabContents.setState( 'disabled', true );
				this._vContents.setHtml( null );
			}
			
			this._appView._element.scrollTop = 0;
			this._vRenderer.render( this._docContext );
		},

		_hashChanged: function () {

			var hash = window.location.hash;

			this._lastDocContext = this._docContext;
			this._docContext = this._lang.getSymbolContextFromUrl( hash );
			this._vPackages.setCurrentContext( this._docContext );
			this._vNamespaces.setCurrentContext( this._docContext );

			if ( this._docContext.HasContents ) {
				this._vTabContents.setState( 'disabled', true );
			}

			var needsreload = false;
			if ( this._docContext.ContentsSymbol ) {
				if ( this._docContext.ContentsSymbol != this._lastDocContext.ContentsSymbol ) {
					needsreload = true;
				}
				else if ( this._lastDocContext.DocBlock === null ) {
					needsreload = true;
				}
			}
			else {
				if ( this._docContext.Symbol != this._lastDocContext.Symbol ) {
					needsreload = true;
				}
				else if ( this._docContext.Ns != this._lastDocContext.Ns ) {
					needsreload = true;
				}
			}

			if ( needsreload ) {
				
				var that = this;
				return this._requestDocJson( 'content', this._docContext.File, function ( res ) {
					that._showContent( res.Data );
				} );
			}
			else {

				this._showContent( this._lastDocContext.DocBlock );
			}
		}

	} );

	exports.DocBlockViewer = DocBlockViewer;

})( this );