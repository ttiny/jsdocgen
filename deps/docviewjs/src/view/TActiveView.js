"use strict";

/**
 * Functionality template for view that can have an active sub-view.
 * @def mixin View.TActiveView
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * Issued when the active sub-view is being changed.
 * Can be cancelled.
 * @def event View.TActiveView::ActiveView.Changing { Active, Inactive, Parent }
 * @param View|null View becoming active.
 * @param View|null View becoming inactive.
 * @param object Object that implements TActiveView.
 */

/**
 * Issued when the active sub-view was changed.
 * Can not be cancelled.
 * @def event View.TActiveView::ActiveView.Changed { Active, Inactive, Parent }
 * @param {@ditto}
 * @param {@ditto}
 * @param {@ditto}
 */

/**
 * Issued to the sub-view that was just activated.
 * Can not be cancelled.
 * @def event View.TActiveView::ActiveView.Activated { Inactive, Parent }
 * @param View|null View becoming inactive.
 * @param object Object that implements TActiveView.
 */

/**
 * Issued to the sub-view that was just de-activated.
 * Can not be cancelled.
 * @def event View.TActiveView::ActiveView.Deactivated { Active, Parent }
 * @param View|null View becoming active.
 * @param object Object that implements TActiveView.
 */
View.TActiveView = function () {
	this._active = null;
};

View.TActiveView.fromTemplate = function ( view, element ) {
	var child = view._element.firstChild;
	while ( child ) {
		if ( child._view.hasState( 'active' ) ) {
			view.setActive( child._view );
			break;
		}
		child = child.nextSibling;
	}
};

// dont use .define because we need these to be enumerable
View.TActiveView.prototype = {

	/**
	 * @def private var View.TActiveView._active
	 * @var View
	 */

	/**
	 * Sets one of the child views (tabs) as active.
	 * @def function View.TActiveView.setActive( view )
	 * @param View
	 * @return bool
	 */
	setActive: function ( view ) {
		var active = this._active;
		if ( view === active ) {
			return false;
		}
		
		var changing = new CustomEvent( 'ActiveView.Changing', { bubbles: true, cancelable: true, detail: { Active: view, Inactive: active, Parent: this } } );
		if ( this.dispatchEvent( changing ) === true ) {
			if ( active ) {
				active.setState( 'active', false );
			}
			this._active = view;
			if ( view ) {
				view.setState( 'active', true );
			}
			var changed = new CustomEvent( 'ActiveView.Changed', { bubbles: true, cancelable: false, detail: { Active: view, Inactive: active } } );
			this.dispatchEvent( changed );
			if ( active ) {
				var deactivated = new CustomEvent( 'ActiveView.Deactivated', { bubbles: true, cancelable: false, detail: { Active: view, Parent: this } } );
				active.dispatchEvent( deactivated );
			}
			if ( view ) {
				var activated = new CustomEvent( 'ActiveView.Activated', { bubbles: true, cancelable: true, detail: { Inactive: active, Parent: this } } );
				view.dispatchEvent( activated );
			}
			return true;
		}
		return false;
	},

	/**
	 * Retrieves the currently active view (tab).
	 * @def function View.TActiveView.getActive ()
	 * @return View|null
	 */
	getActive: function () {
		return this._active;
	}

};



/*@UNITESTS*/
Unitest( 'View.TActiveView.*', function () {

	var a = new View();
	var b = new View();
	var fired = false;
	var fired2 = false;
	var fired3 = false;

	var av = new View();
	av.merge( View.TActiveView.prototype );
	View.TActiveView.call( av );

	av.setActive( a );
	test( av.getActive() === a );

	var h = new EventListener( 'ActiveView.Changing', function ( evt ) {
		fired = true;
		test( evt.detail.Active === b );
		test( evt.detail.Inactive === a );
		evt.detail.Active = null;
		evt.detail.Inactive = null;
	} ).add( av );

	var h1 = new EventListener( 'ActiveView.Changed', function ( evt ) {
		fired2 = true;
		test( evt.detail.Active === b );
		test( evt.detail.Inactive === a );
		evt.preventDefault();
	} ).add( av );

	var h2 = new EventListener( 'ActiveView.Changed', function ( evt ) {
		fired3 = true;
	} ).add( av );

	av.setActive( b );
	test( av.getActive() === b );
	test( fired === true );
	test( fired2 === true );
	test( fired3 === true );

	h.remove( av );
	h = new EventListener( 'ActiveView.Changing', function ( evt ) {
		evt.preventDefault();
	} ).add( av );

	av.setActive( a );
	test( av.getActive() === b );

} );
/*UNITESTS@*/