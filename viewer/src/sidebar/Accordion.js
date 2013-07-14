"use strict";

(function ( exports ) {

	// this view is used in namespaces and packages, it loads their contents the first time it is activated
	function Accordion () {
		View.Accordion.call( this );
		this.setBehaviour( 'auto' );
		this._lang = null;
		this._index = null;

		var accordion = this;
		//this happens the first time Packages tab is ativated:populate accordion with packages
		this.once( 'ActiveView.Activated', function () {

			//this happen once when each Package in the accordion is activated: populate the htmlarea with package contents
			var onceInner = new EventListener( 'ActiveView.Activated', function () {

				this
					.findView( '.AccordionItemContents' )
						.setLang( accordion._lang )
						.setIndex( accordion._index )
						.setType( accordion.accordionType )
						.render();

			}, 'capture' );

			var items = $T( 'Tmpl.DocBlockViewer.Accordion', accordion.getTmplData() );
			for ( var i = items.length - 1; i >= 0; --i ) {
				onceInner.once( items[i] );
			}
			accordion.addView( items );

			//todo: this is not working for methods. we should request update of this one we have the contents and docblock
			//todo: this should also be triggered when a link is clicked inside a page
			//todo: if there is only one item, always expand it
			var hash = location.hash;
			if ( hash ) {
				for ( var i = items.length - 1; i >= 0; --i ) {
					if ( accordion.findSymbol( hash, i ) ) {
						accordion.setActive( items[i] );
						break;
					}
				}
			}

		}, 'capture' );
	}

	Accordion.extend( View.Accordion, {

		setCurrentContext: function ( context ) {
			this._docContext = context;
		},

		findSymbol: function ( hash, groupIndex ) {
			for ( var key in this._index.symbols ) {
				var symbols = this._index.symbols[key];
				for ( var i = 0, iend = symbols.length; i < iend; ++i ) {
					var symbol = symbols[i];
					if ( symbol[ this.accordionType ] != groupIndex ) {
						continue;
					}
					if ( this._lang.makeSymbolUrl( key, symbol, this._index ) == hash ) {
						return true;
					}
				}
			}
			return false;
		},

		setLang: function ( lang ) {
			this._lang = lang;
			return this;
		},

		setIndex: function ( index ) {
			this._index = index;
			return this;
		},

		getTmplData: function () {
			var data = [];
			var items = this._index.groups[ this.accordionType ];
			data.length = items.length;
			for ( var i = 0, iend = items.length; i < iend; ++i ) {
				data[i] = { name: items[i] };
			}
			return data;
		},

		setType: function ( type ) {
			this.accordionType = type;
		}
	} );

	function AccordionItemContents ( groupIndex ) {
		View.HtmlArea.call( this );
		this._element.classList.add( 'AccordionItemContents' );
		this._groupIndex = parseInt( groupIndex );
		this._lang = null;
		this._index = null;
	}

	AccordionItemContents.extend( View.HtmlArea, {

		setLang: function ( lang ) {
			this._lang = lang;
			return this;
		},

		setGroupIndex: function ( index ) {
			this._groupIndex = index;
		},

		setIndex: function ( index ) {
			this._index = index;
			return this;
		},

		render: function () {
			var slashre =  /\\/g;
			
			var data = {};

			for ( var key in this._index.symbols ) {
				var symbols = this._index.symbols[key];
				data[key] = [];
				for ( var i = 0, iend = symbols.length; i < iend; ++i ) {
					var symbol = symbols[i];
					if ( symbol[ this.accordionType ] != this._groupIndex ) {
						continue;
					}
					data[key].push( {
						url: this._lang.makeSymbolUrl( key, symbol, this._index ),
						name: symbol.name
					} );
				}
			}

			this.setHtml( $TT( 'Tmpl.DocBlockViewer.Accordion.Contents', data ) );
		},

		setType: function ( type ) {
			this.accordionType = type;
			return this;
		}
	} );

	function Namespaces () {
		Accordion.call( this );
		this.setType( 'ns' );
	}

	Namespaces.extend( Accordion );

	function Packages () {
		Accordion.call( this );
		this.setType( 'pkg' );
	}

	Packages.extend( Accordion );

	exports.DocBlockViewer.Namespaces = Namespaces;
	exports.DocBlockViewer.Packages = Packages;
	exports.DocBlockViewer.AccordionItemContents = AccordionItemContents;

})( this );