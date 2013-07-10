"use strict";



/**
 * A type of view with one active sub-view.
 * Non active sub-views are usually rendered in some kind of
 * minimized state.
 * @see View.AccordionItem
 * @def class View.Accordion extends View mixin View.TActiveView
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
View.Accordion = function () {
	View.call( this );
	View.TActiveView.call( this );
	this._element.classList.add( 'Accordion' );
};

/**
 * @private
 */
View.Accordion.fromTemplate = function ( element ) {
	var ret = ViewTemplate.classFromTemplate( View.Accordion, element );
	if ( element.getAttribute( 'behaviour' ) !== '' ) {
		ret.setBehaviour( 'auto' );
	}
	View.TActiveView.fromTemplate( ret, element );
	return ret;
};

View.Accordion.extend( View ).mixin( View.TActiveView );
