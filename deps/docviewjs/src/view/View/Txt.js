"use strict";


/**
 * View representing some text.
 * @def class View.Txt extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.Txt ( text )
 * @param string|undefined Some initial text to be set with {@see setText()}.
 */
View.Txt = function ( text ) {
	View.call( this, 'span' );
	this._element.classList.add( 'Txt' );
	if ( text ) {
		this.setText( text );
	}
};

/**
 * @private
 */
View.Txt.fromTemplate = function ( element ) {
	var text = element.getAttribute( 'text' );
	var ret = new View.Txt();
	ViewTemplate.setupViewFromAttributes( ret, element );
	if ( text === null ) {
		ret.setText( element.textContent );
	}
	return ret;
};

View.Txt.extend( View, {

	/**
	 * Sets the text of the element.
	 * If a global {@see Config} instance named 'R' is found,
	 * the string will be passed though R's {@see Config.render()}.
	 * @param string|null Pass null to remove the text.
	 * @return string The new text content of the view.
	 */
	setText: function ( text ) {
		if ( text !== null ) {
			text = ( typeof R != 'undefined' ? R.render( text ) || text : text )
		}
		return View.prototype.setText.call( this, text );
	}
} );

/*@UNITESTS*/
Unitest( 'View.Txt.*', function () {

	var v = new View.Txt( 'txt' );
	test( v instanceof View.Txt );
	test( v.getElement().textContent == 'txt' );
	var r = window.R;
	window.R = new Config( { str: { asd: 'asd' } } );

	test( v.setText( '{str.asd}' ) === 'asd' );
	test( v.getElement().textContent == 'asd' );
	window.R = r;

	v.setText( 'qwe' );
	test( v.getElement().textContent == 'qwe' );

	test( v.setText( null ) === null );
	test( v.getElement().textContent == '' );

} );
/*UNITESTS@*/