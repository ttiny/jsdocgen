"use strict";

/**
Class for synchronizing several callbacks.
When a predefined number of callbacks notify
the object, the lock is released.
@def class Semaphore
@author Borislav Peev <borislav.asdf@gmail.com>
*/

/**
@def constructor Semaphore ( nlocks, callback )
@param int Number of inital locks.
@param function Callback to be notified when the lock is released.
*/
function Semaphore ( nlocks, callback ) {
    EventDispatcher.call( this );
    this._nLocks = nlocks;
    this._callback = callback;
}

Semaphore.defineStatic( {

	/**
	 * This event is sent when the semaphore is notified.
	 * @def event Semaphore::Semaphore.Notify
	 */
	SemaphoreNotify: function () {
		return new CustomEvent( 'Semaphore.Notify', {
			bubbles: false,
			cancelable: false
		} );
	},

	/**
	 * This event is sent when the semaphore is released.
	 * @def event Semaphore::Semaphore.Released
	 */
	SemaphoreReleased: function () {
		return new CustomEvent( 'Semaphore.Released', {
			bubbles: false,
			cancelable: false
		} );
	}

} );

Semaphore.extend( EventDispatcher, {

	/**
	Notifies the lock once.
	@def function Semaphore.notify ()
	*/
	notify: function () {
		--this._nLocks;
		if ( this._nLocks < 0 ) {
			throw new Error( 'Unable to notify lock, all locks are released' )
		}
		this.dispatchEvent( new Semaphore.SemaphoreNotify() );
		if ( this._nLocks === 0 ) {
			this._callback();
			this.dispatchEvent( new Semaphore.SemaphoreReleased() );
		}
	},

	/**
	Increases the lock count.
	@def function Semaphore.lock ()
	*/
	lock: function () {
		++this._nLocks;
	}
} );

/*@UNITESTS*/
Unitest( 'Semaphore.*', function () {
	// locks
	var released = false;
	var lock = new Semaphore( 1, function () { released = true; } );
	lock.lock();
	lock.notify();
	test( released === false );
	lock.notify();
	test( released === true );
	try {
		lock.notify();
	}
	catch ( e ) {
		released = false;
	}
	test( released === false );
} );
/*UNITESTS@*/