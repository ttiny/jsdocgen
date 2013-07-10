"use strict";



/**
 * A view containing free-form HTML.
 * @def class View.HtmlArea extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.HtmlArea ( html )
 * @param string HTML content of the view.
 */
View.HtmlArea = function ( html ) {
	View.call( this );
	var handle = this._element;
	handle.classList.add( 'HtmlArea' );
	if ( html ) {
		handle.innerHTML = html;
	}
};

/**
 * @private
 */
View.HtmlArea.fromTemplate = function ( element ) {
	var html = '';
	var ser = View.HtmlArea._serializer || ( View.HtmlArea._serializer = new XMLSerializer() );
	var child = element.firstChild;
	while ( child ) {
		html += ser.serializeToString( child );
		child = child.nextSibling;
	}
	var ret = new View.HtmlArea( html );
	ViewTemplate.setupViewFromAttributes( ret, element );
	return ret;
}

View.HtmlArea.extend( View, {

	/**
	 * @unstable
	 */
	setHtml: function ( html ) {
		this._element.innerHTML = html;
		return this;
	},

	/**
	 * @unstable
	 */
	getHtml: function ( html ) {
		return this._element.innerHTML;
	}
} );

/*@UNITESTS*/
Unitest( 'ViewTemplate.loadString()', function () {

	var t = ViewTemplate.loadString( '<View.HtmlArea><h1>header</h1></View.HtmlArea>' );
	var h = View.HtmlArea.fromTemplate( t.getDocument().firstChild );
	test( h instanceof View.HtmlArea );
	test( h.getElement().innerHTML == '<h1>header</h1>' );

} );
/*UNITESTS@*/