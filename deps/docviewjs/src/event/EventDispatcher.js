"use strict";


/**
 * A custom EventTarget implementation that can be used for any object.
 * @def class EventDispatcher uses TEventDispatcher2
 * @see http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
function EventDispatcher () {
	this._events = {};
}

EventDispatcher.define( {

	/**
	 * @def private var EventDispatcher._events
	 * @var object
	 */

	addEventListener: function ( type, callback, capture ) {
		var events;
		if ( ( events = this._events[type] ) === undefined ) {
			events = [];
			this._events[type] = events;
		}
		events.push( [ callback, capture ] );
	},

	removeEventListener: function ( type, callback, capture ) {
		var events = this._events[type];
		if ( events instanceof Array ) {
			for ( var i = 0, iend = events.length; i < iend; ++i ) {
				var event = events[i];
				if ( event !== null && event[0] === callback && event[1] === capture ) {
					events[i] = null;
					break;
				}
			}
		}
	},

	dispatchEvent: function ( evt ) {
		var events = this._events[ evt.type ];
		if ( events instanceof Array ) {
			for ( var i = 0, iend = events.length; i < iend; ++i ) {
				var event = events[i];
				if ( event !== null /*&& evt.bubbles === !event[1]*/ ) {
					event[0].call( this, evt );
					if ( evt.defaultPrevented ) {
						break;
					}
				}
			}
			return !evt.defaultPrevented;
		}
		return true;
	}
} ).mixin( TEventDispatcher2 );


/*@UNITESTS*/
Unitest( 'EventDispatcher.*', function () {

	var a = 0;
	var acb = function ( evt ) {
		++a;
		if ( a == 3 ) {
			evt.preventDefault();
		}
	};

	var b = 0;
	var bcb = function ( evt ) {
		++b;
	};

	var evt = new CustomEvent( 'event', { bubbles: false, cancelable: true } );

	var target = new EventDispatcher();
	target.addEventListener( 'event', acb, true );
	target.on( 'event', bcb, false );
	test( target.dispatchEvent( evt ) === true );
	test( target.notify( evt ) === true );
	test( a == 2 );
	test( b == 2 );

	evt = new CustomEvent( 'event', { bubbles: false, cancelable: true } );
	test( target.dispatchEvent( evt ) === false );
	test( target.dispatchEvent( evt ) === false );
	test( a == 4 );
	test( b == 2 );
	
	evt = new CustomEvent( 'event', { bubbles: false, cancelable: true } );
	target.removeEventListener( 'event', acb, false );
	target.dispatchEvent( evt );
	target.dispatchEvent( evt );
	test( a == 6 );
	test( b == 4 );

	evt = new CustomEvent( 'event', { bubbles: false, cancelable: true } );
	target.off( 'event', acb, true );
	target.dispatchEvent( evt );
	target.dispatchEvent( evt );
	test( a == 6 );
	test( b == 6 );
	
	evt = new CustomEvent( 'event', { bubbles: false, cancelable: true } );
	target.removeEventListener( 'event', bcb, false );
	target.dispatchEvent( evt );
	target.dispatchEvent( evt );
	test( a == 6 );
	test( b == 6 );

} );
/*UNITESTS@*/