"use strict";



/**
 * Represents an image.
 * @def class View.Img extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.Img ( image, text )
 * @param string|undefined If this is provided, the constructor will call {@see setImage()} with the given image.
 * @param string|undefined If this is provided, the constructor will call {@see setText()} with the given text.
 */
View.Img = function ( image, text ) {
	View.call( this, 'img' );
	this._element.classList.add( 'Img' );
	if ( image ) {
		this.setImage( image );
	}
	if ( text ) {
		this.setText( text );
	}
};

View.Img.extend( View, {

	/**
	 * Sets the URL of the image to be displayed.
	 * If a global {@see Config} instance named 'R' is found,
	 * the string will be passed though R's {@see Config.render()}.
	 * @def function View.Img.setImage ( image )
	 * @param string
	 * @return string The new URL of the image.
	 */
	setImage: function ( image ) {
		return this._element.src = ( typeof R != 'undefined' ? R.render( image ) || image : image );
	},

	/**
	 * Sets the title (tooltip) of the image.
	 * This function will set the 'title' attribute
	 * of the underlying DOM element effectively causing
	 * the browser to display a tooltip when hovering the image.
	 * If a global {@see Config} instance named 'R' is found,
	 * the string will be passed though R's {@see Config.render()}.
	 * @def View.Img.setText ( text )
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
Unitest( 'View.Img.*', function () {

	var src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAA2CAIAAAD4cAhVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD8SURBVGhD7ZNBDoJQEEM9iEvvfzPPgD+hMUMVBJyZhqQvXdnPpG/hbbo4FlBjATUWUGMBNRZQYwE1FlBjATVKgef98TN4uo5AgCbuD75f0i1Am44GVwJ9AjTlXHAr0CRAO04H5wIdAjQiBi9W2PO4XIBGvIP6b2oFaPQcdEl0C6DIo1CApo+gSMUCK9D0ERTZlAjQ9BEUBVjgA5o+gqKGcgH8WkayAK0fQVFGpgBNH0FRSZoATZ+DrpIcAdo9B10xLHB0QXwfg7qehQCNOB2cayFfALe6SBbAoUa2/gOHgu/bYYEITfwaPNWxJXAJLKDGAmosoMYCaiygZZpe7U0ia+UfXOwAAAAASUVORK5CYII=';
	var v = new View.Img( src, 'titl' );
	test( v instanceof View.Img );
	test( v.getElement().src == src );
	test( v.getElement().getAttribute( 'title' ) == 'titl' );

	var r = window.R;
	window.R = new Config( { str: { asd: 'asd' } } );

	test( v.setText( '{str.asd}' ) === 'asd' );
	test( v.getElement().getAttribute( 'title' ) == 'asd' );
	window.R = r;

	v.setText( 'qwe' );
	test( v.getElement().getAttribute( 'title' ) == 'qwe' );

	v.setText( null );
	test( v.getElement().getAttribute( 'title' ) == null );

	test( v.setImage( src ) == src );

} );
/*UNITESTS@*/