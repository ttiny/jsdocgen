"use strict";


/**
 * Represent a stock image.
 * Stock images are set of images provided by the theme
 * identified by their name rather than URL.
 * @def class View.StockImg extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.StockImg ( image, text )
 * @param string|undefined If this is provided, the constructor will call {@see setImage()} with the given image.
 * @param string|undefined If this is provided, the constructor will call {@see setText()} with the given text.
 */
View.StockImg = function ( image, text ) {
	View.call( this, 'span' );
	this._element.classList.add( 'StockImg' );

	this._lastImage = null;

	if ( image ) {
		this.setImage( image );
	}
	if ( text ) {
		this.setText( text );
	}
};

View.StockImg.extend( View, {

	/**
	 * @def private var View.StockImg._lastImage
	 * @var string|null
	 */

	/**
	 * Sets the type of stock image.
	 * This function will add to the class list of the underlying
	 * DOM element the image provided, while removing the last one.
	 * @def View.StockImg.setImage ( image )
	 * @param string|null Pass null to remove the image.
	 * @return this
	 */
	setImage: function ( image ) {
		var last = this._lastImage;
		if ( image == last ) {
			return this;
		}

		var classList = this._element.classList;
		if ( last !== null ) {
			classList.remove( last );
		}
		this._lastImage = image;
		if ( image !== null ) {
			classList.add( image );
		}
		return image;
	},

	/**
	 * Sets the title (tooltip) of the image.
	 * This function will set the 'title' attribute
	 * of the underlying DOM element effectively causing
	 * the browser to display a tooltip when hovering the image.
	 * If a global {@see Config} instance named 'R' is found,
	 * the string will be passed though R's {@see Config.render()}.
	 * @def View.StockImg.setText ( text )
	 * @param string|null Pass null to remove the title.
	 * @return string|null The new title of the image.
	 */
	setText: function ( text ) {
		if ( text === null ) {
			this._element.removeAttribute( 'title' );
			return null;
		}
		else {
			text = ( typeof R != 'undefined' ? R.render( text ) || text : text )
			this._element.setAttribute( 'title', text );
			return text;
		}
	}
} );

/*@UNITESTS*/
Unitest( 'View.StockImg.*', function () {

	var v = new View.StockImg( 'stock0', 'title' );
	test( v.getElement().getAttribute( 'title' ) == 'title' );
	test( v.getElement().classList.contains( 'stock0' ) );
	
	var r = window.R;
	window.R = new Config( { str: { asd: 'asd' } } );

	test( v.setText( '{str.asd}' ) === 'asd' );
	test( v.getElement().getAttribute( 'title' ) == 'asd' );
	window.R = r;
	
	v.setText( 'qwe' );
	test( v.getElement().getAttribute( 'title' ) == 'qwe' );

	v.setText( null );
	test( v.getElement().getAttribute( 'title' ) == null );

	test( v.setImage( 'stock1' ) === 'stock1' );
	test( !v.getElement().classList.contains( 'stock0' ) );
	test( v.getElement().classList.contains( 'stock1' ) );
	
	v.setImage( 'stock2' );
	test( !v.getElement().classList.contains( 'stock1' ) );
	test( v.getElement().classList.contains( 'stock2' ) );

	v.setImage( null );
	test( !v.getElement().classList.contains( 'stock2' ) );
});
/*UNITESTS@*/