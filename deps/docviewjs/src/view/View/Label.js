"use strict";



/**
 * Label is a view made of image and text.
 * Both the image and the text are optional.
 * @def class View.Label extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.Label ()
 */
View.Label = function () {
	View.call( this );
	this._image = null;
	this._text = null;
	this._order = 'ltr';
	this._element.classList.add( 'Label' );
};

View.Label.extend( View, {

	/**
	 * @def private var View.Label._image
	 * @var View.Img|View.StockImg|null
	 */

	/**
	 * @def private var View.Label._text
	 * @var View.Txt|null
	 */

	/**
	 * @def private var View.Label._order
	 * @var string|null 'ltr'|'rtl'
	 */

	/**
	 * Sets the order in which the image and text are arranged.
	 * 'ltr' = left to right, image -> text, 'rtl' = right to left, text -> image. The default is 'ltr'.
	 * This function will rearange the image and the text if they exist.
	 * @def function View.Label.setOrder( order )
	 * @param string|null Pass null cancel any arrangements.
	 * @return string The newly set order.
	 */
	setOrder: function ( order ) {
		if ( this._order !== order ) {
			this._order = order;
			if ( order !== null && this._image && this._text ) {
				this.moveView( this._text, order == 'ltr' ? 'last' : 'first' );
			}
		}
		return this._order;
	},

	/**
	 * Sets the text of the label.
	 * This function will create a new {@see View.Txt} element if there isn't one already.
	 * @def function View.Label.setText( text )
	 * @param string|null Pas null to remove the label's text.
	 * @return View.Txt|null The associated text object, or in case null is passed as text the previously associated text object.
	 */
	setText: function ( text ) {
		if ( text === null ) {
			var ret = this._text;
			if ( ret ) {
				this.removeView( ret );
			}
			return ret;
		}
		if ( this._text === null) {
			var order = this._order == 'ltr' ? 'last' : ( this._order == 'rtl' ? 'first' : undefined );
			this.addView ( this._text = new View.Txt(), order );
		}
		this._text.setText( text );
		return this._text;
	},

	/**
	 * Sets the text (i.e. title) of the image element.
	 * @def function View.Label.setTitle( title )
	 * @param string|null
	 * @return View.Img|View.StockImg|null The image object.
	 */
	setTitle: function ( title ) {
		var image = this._image;
		if ( image === null ) {
			return null;
		}
		image.setText( title );
		return image;
	},

	/**
	 * Sets the image of the label.
	 * This function will create a new {@see View.Img} element if there isn't one already.
	 * If a stock image is associated with the label already it will be removed.
	 * @def function View.Label.setImage( image, title )
	 * @param string|null URL of the image or null to remove the image.
	 * @param string|undefined Title of the image.
	 * @return View.Img|View.StockImg|null The associated image object, or in case null is passed as image, it will return the previously associated image object.
	 */
	setImage: function ( image, title ) {
		if ( image === null ) {
			var ret = this._image;
			if ( ret ) {
				this.removeView( ret );
				return ret;
			}
		}
		if ( !(this._image instanceof View.Img) ) {
			if ( this._image !== null ) {
				this.removeView( this._image );
			}
			var order = this._order == 'ltr' ? 'first' : ( this._order == 'rtl' ? 'last' : undefined );
			this.addView ( this._image = new View.Img(), order );
		}
		this._image.setImage( image, title );
		return this._image;
	},

	/**
	 * Sets a stock image as the image of the label.
	 * This function will create a new {@see View.StockImg} element if there isn't one already.
	 * If a regular (non-stock) image is associated with the label already it will be removed.
	 * @def function View.Label.setImage( image, title )
	 * @param string|null Name of the stock image or null to remove the image.
	 * @param string|undefined Title of the image.
	 * @return View.Img|View.StockImg|null The associated image object, or in case null is passed as image, it will return the previously associated image object.
	 */
	setStockImage: function ( image, title ) {
		if ( image === null ) {
			var ret = this._image;
			if ( ret ) {
				this.removeView( ret );
				return ret;
			}
		}
		if ( !(this._image instanceof View.StockImg) ) {
			if ( this._image !== null ) {
				this.removeView( this._image );
			}
			var order = this._order == 'ltr' ? 'first' : ( this._order == 'rtl' ? 'last' : undefined );
			this.addView ( this._image = new View.StockImg(), order );
		}
		this._image.setImage( image, title );
		return this._image;
	}
} );


/*@UNITESTS*/
Unitest( 'View.StockImg.*', function () {

	var v = new View.Label();

	var src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA2CAIAAAD4cAhVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD8SURBVGhD7ZNBDoJQEEM9iEvvfzPPgD+hMUMVBJyZhqQvXdnPpG/hbbo4FlBjATUWUGMBNRZQYwE1FlBjATVKgef98TN4uo5AgCbuD75f0i1Am44GVwJ9AjTlXHAr0CRAO04H5wIdAjQiBi9W2PO4XIBGvIP6b2oFaPQcdEl0C6DIo1CApo+gSMUCK9D0ERTZlAjQ9BEUBVjgA5o+gqKGcgH8WkayAK0fQVFGpgBNH0FRSZoATZ+DrpIcAdo9B10xLHB0QXwfg7qehQCNOB2cayFfALe6SBbAoUa2/gOHgu/bYYEITfwaPNWxJXAJLKDGAmosoMYCaiygZZpe7U0ia+UfXOwAAAAASUVORK5CYII=';
	var img = v.setImage( src );
	test( img instanceof View.Img );
	test( v.getElement().firstChild._view === img );

	var txt = v.setText( 'txt' );
	test( txt instanceof View.Txt );
	test( v.getElement().lastChild._view === txt );

	v.setOrder( 'rtl' );
	test( v.getElement().firstChild._view === txt );
	test( v.getElement().lastChild._view === img );

	var simg = v.setStockImage( 'star' );
	test( v.getElement().firstChild._view === txt );
	test( v.getElement().lastChild._view === simg );

	v.setOrder( 'ltr' );
	test( v.getElement().firstChild._view === simg );
	test( v.getElement().lastChild._view === txt );

	test( v.setImage( null ) === simg );
	test( v.getElement().firstChild._view === txt );

	test( v.setText( null ) === txt );
	test( v.getElement().firstChild === null );

});
/*UNITESTS@*/