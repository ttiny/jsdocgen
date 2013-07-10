"use strict";

(function ( exports ) {

	// this is the table of contents, it is loaded for each class
	function Contents () {
		View.HtmlArea.call( this );
		this.setBehaviour( 'auto' );
		this._lang = null;
	}

	Contents.extend( View.HtmlArea, {

		setLang: function ( lang ) {
			this._lang = lang;
			return this;
		},

		render: function ( context ) {

			//build indices
			for ( var key in context.DocBlock.members ) {
				var members = context.DocBlock.members[key];
				members.index = {};
				for ( var i = members.length - 1; i >= 0; --i ) {
					var symbol = members[i];
					members.index[ symbol.def.name ] = i;
				}
			}

			//make template data
			var data = { 'const': [], 'var': [], 'method': [] };
			for ( var key in context.DocBlock.members ) {
				var members = context.DocBlock.members[key];
				for ( var i = 0, iend = members.length; i < iend; ++i ) {
					var symbol = members[i];
					data[key].push( {
						url: this._lang.makeSymbolUrl( key, symbol.def ),
						symbol: symbol.def
					} );
				}
			}

			this.setHtml( $TT( 'Tmpl.DocBlockViewer.Contents', data ) );

		}
	} );

	exports.DocBlockViewer.Contents = Contents;

})( this );