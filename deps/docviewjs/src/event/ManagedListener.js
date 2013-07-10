"use strict";



/**
 * Represents an event handler.
 * Extended {@see EventListener} which keeps track of which
 * objects it was attached to.
 * @def class ManagedListener extends EventListener
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor ManagedListener ( event, callback, phase )
 * @param string
 * @param function
 * @param bool|string|undefined true = 'capture', 'false' = 'bubble'
 */
function ManagedListener ( event, callback, phase ) {
	this._subjects = [];
	EventListener.call( this, event, callback, phase );
}

ManagedListener.extend( EventListener, {

	/**
	 * @def private var ManagedListener._subjects
	 * @var object[]
	 */


	add: function ( element ) {
		element.addEventListener( this._event, this._callback, this._phase );
		this._subjects.push( element );
		return this;
	},

	remove: function ( element ) {
		element.removeEventListener( this._event, this._callback, this._phase );
		this._subjects.splice( this._subjects.lastIndexOf( element ), 1 );
		return this;
	},

	/**
	 * Removes the event handler from the last element where it was attached.
	 * @def ManagedListener.removeLast()
	 * @return object The last element for which the handler was removed.
	 */
	removeLast: function () {
		var element = this._subjects.pop();
		if ( element ) {
			element.removeEventListener( this._event, this._callback, this._phase );
		}
		return element;
	},

	/**
	 * Removes the event handler from the all elements where it was attached.
	 * @def ManagedListener.removeAll()
	 * @return this
	 */
	removeAll: function () {
		var subjects = this._subjects;
		for ( var i = subjects.length - 1; i >= 0; --i ) {
			subjects[i].removeEventListener( this._event, this._callback, this._phase );
		}
		this._subjects = [];
		return this;
	}
} );


/*@UNITESTS*/
Unitest( 'ManagedListener.*', function () {

	var calls = 0;
	var callback = function () {
		return ++calls;
	};

	var div = document.createElement( 'div' );
	var evt = document.createEvent( 'CustomEvent' );
	evt.initEvent( 'customevent', true, true, null );

	var h = new ManagedListener( 'customevent', callback, 'capture' );
	test( h instanceof ManagedListener );
	test( h.getPhase() == true );
	test( h.getCallback() === callback );
	test( h.getEvent() == 'customevent' );

	h.add( div );
	test( h._subjects[0] === div );
	div.dispatchEvent( evt );
	test( calls == 1 );
	
	h.remove( div );
	div.dispatchEvent( evt );
	test( calls == 1 );

	var div1 = document.createElement( 'div' );
	var div2 = document.createElement( 'div' );
	h.add( div1 );
	h.add( div2 );
	test( h._subjects[0] === div1 );
	test( h._subjects[1] === div2 );
	
	div1.dispatchEvent( evt );
	div2.dispatchEvent( evt );
	test( calls == 3 );

	h.remove( div1 );
	test( h._subjects[0] === div2 );
	
	div1.dispatchEvent( evt );
	test( calls == 3 );

	h.removeLast();
	test( h._subjects.length == 0 );
	
	div2.dispatchEvent( evt );
	test( calls == 3 );

	h.add( div1 );
	h.add( div2 );
	h.removeLast();
	test( h._subjects[0] === div1 );

	div2.dispatchEvent( evt );
	test( calls == 3 );

	h.removeAll();
	test( h._subjects.length == 0 );

	div1.dispatchEvent( evt );
	test( calls == 3 );

} );
/*UNITESTS@*/