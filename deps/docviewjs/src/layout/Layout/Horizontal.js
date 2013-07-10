"use strict";



/**
 * Layout where child views are ordered horizontally.
 * @def class Layout.Horizontal extends Layout
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Layout.Horizontal = function ( view ) {
	Layout.call( this, view );
	view.getElement().classList.add( 'Layout-Horizontal' );
};

Layout.Horizontal.extend( Layout, {

	/**
	 * @inheritdoc
	 * @def function Layout.Horizontal.detach ()
	 */
	detach: function () {
		this._view.getElement().classList.remove( 'Layout-Horizontal' );
		Layout.prototype.detach.call( this );
	}
} );

/*@UNITESTS*/
Unitest( 'Layout.Horizontal()/Layout.Horizontal.detach()', function () {

	var v = new View();
	var lay = new Layout.Horizontal( v );
	test( v.getElement().classList.contains( 'Layout-Horizontal' ) );
	
	lay.detach();
	test( !v.getElement().classList.contains( 'Layout-Horizontal' ) );
});
/*UNITESTS@*/