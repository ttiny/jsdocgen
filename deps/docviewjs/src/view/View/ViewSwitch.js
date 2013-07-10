"use strict";



/**
 * A view which can have one active sub-view.
 * All non-active child views are hidden and the active one spans
 * the whole size of the view switch.
 * @def class View.ViewSwitch extends View mixin View.TActiveView
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor View.ViewSwitch ()
 */
View.ViewSwitch = function () {
	View.call( this );
	View.TActiveView.call( this );
	this._element.classList.add( 'ViewSwitch' );
	this.setBehaviour( 'auto' );
};

/**
 * @private
 */
View.ViewSwitch.fromTemplate = function ( element ) {
	var ret = ViewTemplate.classFromTemplate( View.ViewSwitch, element );
	View.TActiveView.fromTemplate( ret, element );
	return ret;
};

View.ViewSwitch.extend( View ).mixin( View.TActiveView );