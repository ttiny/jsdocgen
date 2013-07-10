"use strict";


/**
 * Tab is an child view in a {@see View.TabStrip}.
 * @see View.TabStrip
 * @see View.TabView
 * @def class View.Tab extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
View.Tab = function () {
	View.call( this );
	this._element.classList.add( 'Tab' );
};

View.Tab.extend( View );