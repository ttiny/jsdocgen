"use strict";

/**
 * The basis for {@see View} layouts.
 * Layouts determine how child views are ordered (when applicable).
 * @def class Layout
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * Creates a layout and attaches it to a {@see View}.
 * @def constructor Layout ( view )
 * @param View
 */
function Layout ( view ) {
	this._view = view;
	view.getElement().classList.add( 'Layout' );
}

/**
 * Finds a layout constructor from string representation.
 * @def static function Layout.findByName ( layout )
 * @param string
 * @return function|null
 */
Layout.findByName = function ( layout ) {
	if ( typeof layout == 'string' || layout instanceof String ) {
		return Layout[layout] || null;
	}
	return null;
};

Layout.define( {

	/**
	 * private var Layout._view
	 * @var View
	 */

	/**
	 * Detaches the layout from its {@see View}.
	 * @def function Layout.detach ()
	 */
	detach: function () {
		this._view.getElement().classList.remove( 'Layout' );
		this._view = null;
	}
} );

/*@UNITESTS*/
Unitest( 'Layout()/Layout.detach()', function () {

	var v = new View();
	var lay = new Layout( v );
	test( v.getElement().classList.contains( 'Layout' ) );
	
	lay.detach();
	test( !v.getElement().classList.contains( 'Layout' ) );
});
/*UNITESTS@*/