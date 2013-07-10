"use strict";


(function ( exports ) {
	/**
	 * An object which will be resolved at future time.
	 * Task is a promise that knows about several
	 * prefined states which can progress in one direction only.
	 * The states are 'started', 'success', 'error', 'cancelled'.
	 * Notice that only the 'finished' state is actually a promise.
	 * @def class Task extends Promise
	 */
	function Task () {
		Promise.call( this );
		//this._progress = undefined;
	}

	Task.defineStatic( {

		/**
		 * This event is sent after the task becomes
		 * in 'success', 'error' or 'cancelled' state.
		 * @def event Task::Task.Finished { State:string }
		 */
		TaskFinished: function ( state ) {
			return new CustomEvent( 'Task.Finished', {
				bubbles: false,
				cancelable: false,
				detail: { State: state }
			} );
		}

	} );

	var Promise_addEventListener = Promise.prototype.addEventListener;
	var Promise_setState = Promise.prototype.setState;

	Task.extend( Promise, {

		setState: function ( state ) {
			if ( this.isFinished() ) {
				return false;
			}
			return Promise_setState.call( this, state );
		},

		/**
		 * Changes the object state to 'started'.
		 * @def function Task.start ()
		 * @return bool
		 */
		start: function () {
			return this.setState( 'started' );
		},

		/**
		 * Changes the object state to 'success'.
		 * @def function Task.resolve ()
		 * @return bool
		 */
		resolve: function () {
			if ( this.setState( 'success' ) ) {
				this.dispatchEvent( new Task.TaskFinished( 'success' ) );
				return true;
			}
			return false;
		},
		
		/**
		 * Registers an listener for {@see Promise::State.Changed} event for the state 'success'.
		 * @def function Task.onSuccess ( callback )
		 * @param function Callback.
		 * @return EventListener
		 */
		onSuccess: function ( callback ) {
			return this.onState( 'success', callback );
		},

		/**
		 * Changes the object state to 'error'.
		 * @def function Task.reject ()
		 * @return bool
		 */
		reject: function () {
			if ( this.setState( 'error' ) ) {
				this.dispatchEvent( new Task.TaskFinished( 'error' ) );
				return true;
			}
			return false;
		},

		/**
		 * Registers an listener for {@see Promise::State.Changed} event for the state 'error'.
		 * @def function Task.onError ( callback )
		 * @param function Callback.
		 * @return EventListener
		 */
		onError: function ( callback ) {
			return this.onState( 'error', callback );
		},

		/**
		 * Changes the object state to 'cancelled'.
		 * @def function Task.cancel ()
		 * @return bool
		 */
		cancel: function () {
			if ( this.setState( 'cancelled' ) ) {
				this.dispatchEvent( new Task.TaskFinished( 'cancelled' ) );
				return true;
			}
			return false;
		},

		/**
		 * Registers an listener for {@see Promise::State.Changed} event for the state 'cancelled'.
		 * @def function Task.onCancelled ( callback )
		 * @param function Callback.
		 * @return EventListener
		 */
		onCancelled: function ( callback ) {
			return this.onState( 'cancelled', callback );
		},

		/**
		 * Registers an listener for {@see Task::Task.Finished} event.
		 * @def function Task.onFinished ( callback )
		 * @param function Callback.
		 * @return EventListener
		 */
		onFinished: function ( callback ) {
			return new EventListener( 'Task.Finished', callback ).add( this );
		},

		/**
		 * Deterimines if the task is finished.
		 * A finished task will not change states anymore.
		 * @def function Task.isFinished ()
		 * @return bool
		 */
		isFinished: function () {
			var state = this.getState();
			return ( state == 'success' || state == 'error' || state == 'cancelled' );
		},

		/*getProgress: function () {
			return this._progress;
		},

		setProgress: function ( progress ) {
			this._progress = progress;
			this.dispatchEvent( new Task.Progress( progress ) );
		},*/

		addEventListener: function ( event, callback ) {
			var ret = Promise_addEventListener.apply( this, arguments );
			if ( event == 'Task.Finished' && this.isFinished() ) {
				callback( new Task.TaskFinished( this.getState() ) );
			}
			/*else if ( event == 'Task.Progress' && !this.isFinished() && this._progress !== undefined ) {
				callback( new Task.Progress( this._progress ) );
			}*/
			return ret;
		}

	} );

	exports.Task = Task;

})( this );


/*@UNITESTS*/
Unitest( 'Task.*', function () {


	var task = new Task();
	task.resolve();
	test( task.setState( 'running' ) === false );
	test( task.getState() == 'success' );


	var task = new Task();

	var finished = 0;
	var success = 0;
	var cancelled = 0;
	var error = 0;
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( task.reject() === true );
	test( finished == 1 && success == 0 && cancelled == 0 && error == 1 );
	test( task.reject() === false );
	test( task.resolve() === false );
	test( task.cancel() === false );
	test( finished == 1 && success == 0 && cancelled == 0 && error == 1 );
	
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( finished == 2 && success == 0 && cancelled == 0 && error == 2 );





	var task = new Task();
	
	var finished = 0;
	var success = 0;
	var cancelled = 0;
	var error = 0;
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( task.resolve() === true );
	test( finished == 1 && success == 1 && cancelled == 0 && error == 0 );
	test( task.reject() === false );
	test( task.resolve() === false );
	test( task.cancel() === false );
	test( finished == 1 && success == 1 && cancelled == 0 && error == 0 );
	
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( finished == 2 && success == 2 && cancelled == 0 && error == 0 );




	var task = new Task();
	
	var finished = 0;
	var success = 0;
	var cancelled = 0;
	var error = 0;
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( task.cancel() === true );
	test( finished == 1 && success == 0 && cancelled == 1 && error == 0 );
	test( task.reject() === false );
	test( task.resolve() === false );
	test( task.cancel() === false );
	test( finished == 1 && success == 0 && cancelled == 1 && error == 0 );
	
	task.onFinished( function () { ++finished; } );
	task.onError( function () { ++error; } );
	task.onSuccess( function () { ++success; } );
	task.onCancelled( function () { ++cancelled; } );
	test( finished == 2 && success == 0 && cancelled == 2 && error == 0 );

	
} );
/*UNITESTS@*/