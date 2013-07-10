"use strict";


(function ( exports ) {

	/**
	 * Implements a promise object.
	 * Promise is a an object that holds a state and promises
	 * to notify listeners for changes in that state even
	 * if they start to listen after the state is changed.
	 * @def class Promise extends EventDispatcher
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */
	function Promise () {
		EventDispatcher.call( this );
		this._state = undefined;
	}

	/**
	 * @def event Promise::State.Changed { State:string, LastState: string }
	 */
	Promise.defineStatic( {
		StateChanged: function ( state, lastState ) {
			return new CustomEvent( 'State.Changed', {
				bubbles: false,
				cancelable: false,
				detail: { State: state, LastState: lastState }
			} );
		}
	} );

	var EventDispatcher_addEventListener = EventDispatcher.prototype.addEventListener;

	Promise.extend( EventDispatcher, {
		addEventListener: function ( event, callback ) {
			var ret = EventDispatcher_addEventListener.apply( this, arguments );
			if ( event == 'State.Changed' ) {
				var state = this.getState()
				callback( new Promise.StateChanged( state, state ) );
			}
			return ret;
		},

		/**
		 * Changes the object state.
		 * {@see Promise::State.Changed} event is dispatched upon successful change.
		 * @def function Promise.setState ( state )
		 * @param string New state.
		 * @return bool
		 */
		setState: function ( state ) {
			if ( this._state == state ) {
				return false;
			}
			var lastState = this._state;
			this.dispatchEvent( new Promise.StateChanged( this._state = state, lastState ) );
			return true;
		},

		/**
		 * Retrieves the current object state.
		 * @def function Promise.getState ()
		 * @return mixed|undefined
		 */
		getState: function () {
			return this._state;
		},

		/**
		 * Registers an event listener for specific state.
		 * @def function Promise.onState ( state, listener )
		 * @param mixed
		 * @param function
		 * @return EventListener
		 */
		onState: function ( state, listener ) {
			return new EventListener( 'State.Changed', function ( event ) {
				if ( event.detail.State == state ) {
					return listener( event );
				}
			} ).add( this );
		}
	} )

	exports.Promise = Promise;

})( this );

/*@UNITESTS*/
Unitest( 'Promise states', function () {

	var stateful = new Promise();
	var resolved = 0;
	var rejected = 0;
	stateful.onState( 'resolved', function ( event ) {
		++resolved;
	} );
	stateful.onState( 'rejected', function ( event ) {
		++rejected;
	} );
	stateful.setState( 'resolved' );
	test( resolved == 1 );
	test( rejected == 0 );
	stateful.setState( 'rejected' );
	test( rejected == 1 );
	test( resolved == 1 );
	stateful.onState( 'resolved', function ( event ) {
		++resolved;
	} );
	test( resolved == 1 );

} );
/*UNITESTS@*/


/*@UNITESTS*/
Unitest( 'Promise promises', function () {

	var promise = new Promise();
	var resolved = 0;
	var rejected = 0;
	promise.setState( 'resolved' );
	promise.onState( 'resolved', function ( event ) {
		++resolved;
	} );
	test( resolved == 1 );
	promise.onState( 'resolved', function ( event ) {
		++resolved;
	} );
	test( resolved == 2 );
	promise.onState( 'rejected', function ( event ) {
		++rejected;
	} );
	promise.setState( 'rejected' );
	test( rejected == 1 );
	test( resolved == 2 );

} );
/*UNITESTS@*/