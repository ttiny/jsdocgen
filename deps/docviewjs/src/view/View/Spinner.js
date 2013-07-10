"use strict";


/**
 * Spinner is a loading indicator.
 * @def class View.Spinner extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
View.Spinner = function () {
	View.call( this );
	this._element.classList.add( 'Spinner' );
};

View.Spinner.extend( View );