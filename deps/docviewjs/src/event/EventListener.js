"use strict";



/**
 * Represents an event handler.
 * @def class EventListener
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor EventListener ( event, callback, phase )
 * @param string
 * @param function
 * @param bool|string|undefined true = 'capture', 'false' = 'bubble'
 */
function EventListener ( event, callback, phase ) {
	this._event = event;
	this._callback = callback;
	this._phase = ( phase == 'capture' ? true : ( phase == 'bubble' ? false : phase ) );
}

EventListener.define( {

	/**
	 * @def protected var EventListener._event
	 * @var string
	 */
	
	/**
	 * @def protected var EventListener._callback
	 * @var function
	 */
	
	/**
	 * @def protected var EventListener._phase
	 * @var bool|undefined
	 */


	/**
	 * Adds this handler as event listener of an element.
	 * @def function EventListener.add ( element )
	 * @param object Object that implements EventTarget.
	 * @return this
	 */
	add: function ( element ) {
		element.addEventListener( this._event, this._callback, this._phase );
		return this;
	},

	/**
	 * Adds this handler as event listener of an element for one time notification.
	 * The event listener is removed the first time the event is received.
	 * @def function EventListener.add ( element )
	 * @param object Object that implements EventTarget.
	 * @return this
	 */
	once: function ( element ) {
		var that = this;
		var cb = function () {
			element.removeEventListener( that._event, cb, that._phase );
			return that._callback.apply( this, arguments );
		};

		element.addEventListener( this._event, cb, this._phase );
		return this;
	},

	/**
	 * Removes this handler from the list of event listeners of an element.
	 * @def function EventListener.remove ( element )
	 * @param object Object that implements EventTarget.
	 * @return this
	 */
	remove: function ( element ) {
		element.removeEventListener( this._event, this._callback, this._phase );
		return this;
	},

	/**
	 * @def function EventListener.getEvent ()
	 * @return string
	 */
	getEvent: function () {
		return this._event;
	},

	/**
	 * @def function EventListener.getCallback ()
	 * @return function
	 */
	getCallback: function () {
		return this._callback;
	},

	/**
	 * Retrieves the event phase this handler setup for.
	 * @def function EventListener.getPhase ()
	 * @return bool|undefined true is capture phase, false is bubble phase, undefined for non-DOM objects like XMLHttpRequest.
	 */
	getPhase: function () {
		return this._phase;
	}
} );


/*@UNITESTS*/
Unitest( 'EventListener.*', function () {

	var calls = 0;
	var callback = function () {
		return ++calls;
	};

	var div = document.createElement( 'div' );
	var evt = document.createEvent( 'CustomEvent' );
	evt.initEvent( 'customevent', true, true, null );

	var h = new EventListener( 'customevent', callback, 'capture' );
	test( h instanceof EventListener );
	test( h.getPhase() == true );
	test( h.getCallback() === callback );
	test( h.getEvent() == 'customevent' );

	h.add( div );
	div.dispatchEvent( evt );
	test( calls == 1 );
	
	h.remove( div );
	div.dispatchEvent( evt );
	test( calls == 1 );

	h.once( div );
	div.dispatchEvent( evt );
	test( calls == 2 );

	div.dispatchEvent( evt );
	test( calls == 2 );

} );
/*UNITESTS@*/