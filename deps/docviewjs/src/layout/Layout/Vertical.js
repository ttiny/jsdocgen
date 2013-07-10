"use strict";



/**
 * Layout where child views are ordered vertically.
 * This is the defaul browser layout.
 * @def class Layout.Vertical extends Layout
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Layout.Vertical = function ( view ) {
	Layout.call( this, view );
	view.getElement().classList.add( 'Layout-Vertical' );
};

Layout.Vertical.extend( Layout, {

	/**
	 * @inheritdoc
	 * @def function Layout.Vertical.detach ()
	 */
	detach: function () {
		this._view.getElement().classList.remove( 'Layout-Vertical' );
		Layout.prototype.detach.call( this );
	}
} );

/*@UNITESTS*/
Unitest( 'Layout.Vertical()/Layout.Vertical.detach()', function () {

	var v = new View();
	var lay = new Layout.Vertical( v );
	test( v.getElement().classList.contains( 'Layout-Vertical' ) );
	
	lay.detach();
	test( !v.getElement().classList.contains( 'Layout-Vertical' ) );
});
/*UNITESTS@*/