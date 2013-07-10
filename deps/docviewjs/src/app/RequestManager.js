"use strict";


(function ( exports ) {

	function _onRequestFinished ( evt ) {
		this._request = null;
		this.dispatchEvent( new CustomEvent( 'RequestGroup.Finished', { bubbles: false, cancelable: false } ) );
	}

	function RequestGroup ( name, policy ) {
		EventDispatcher.call( this );

		this._name = name;
		this._policy = policy || 'ignore';
		this._request = null;
		this._onRequestFinished = new EventListener( 'Request.Finished', _onRequestFinished.bind( this ) );
	}

	RequestGroup.extend( EventDispatcher, {
		addRequest: function ( options, callback ) {
			if ( this._request ) {
				if ( this._policy == 'abort' ) {
					this._onRequestFinished.remove( this._request );
					this._request.abort();
				}
				else if ( this._policy == 'ignore' ) {
					return false;
				}
			}
			else {
				this.dispatchEvent( new CustomEvent( 'RequestGroup.Started', { bubbles: false, cancelable: false } ) );
			}
			var request = new HttpRequest( options, callback );
			this._request = request;
			this._onRequestFinished.add( request );
			return request;
		},

		abort: function () {
			if ( this._request ) {
				this._request.abort();
				return true;
			}
			else {
				return false;
			}
		}
	} );

	/**
	 * @def event RequestManager::RequestManager.Started
	 */
	function _onRequestGroupStarted () {
		if ( ++this._activeRequests == 1 ) {
			this.dispatchEvent( new CustomEvent( 'RequestManager.Started', { bubbles: false, cancelable: false } ) );
		}
	}

	function _onRequestGroupFinished () {
		if ( --this._activeRequests == 0 ) {
			this.dispatchEvent( new CustomEvent( 'RequestManager.Finished', { bubbles: false, cancelable: false } ) );
		}
		/*@DEBUG*/
		if ( this._activeRequests < 0 ) {
			throw new Error( '_activeRequests < 0' );
		}
		/*DEBUG@*/
	}

	/**
	 * Utility class for managing logical groups of {@see HttpRequest}s.
	 * This is intended for use in UIs where certain actions trigger an
	 * request and the request shouldn't be performed multiple times.
	 * Such actions can be logically arranged in groups, where each
	 * group can have its own active request independently of the other groups.
	 * @def class RequestManager extends EventDispatcher
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */
	function RequestManager () {
		EventDispatcher.call( this );

		this._groups = [];
		this._activeRequests = 0;
		this._onRequestGroupStarted = null;
		this._onRequestGroupFinished = null;

		this._onRequestGroupStarted = new EventListener( 'RequestGroup.Started', _onRequestGroupStarted.bind( this ) );
		this._onRequestGroupFinished = new EventListener( 'RequestGroup.Finished', _onRequestGroupFinished.bind( this ) );
	}

	RequestManager.extend( EventDispatcher, {

		/**
		 * @def private var RequestManager._groups
		 * @var RequestGroup[]
		 */

		/**
		 * @def private var RequestManager._activeRequests
		 * @var int
		 */

		/**
		 * @def private var RequestManager._onRequestGroupStarted
		 * @var EventListener
		 */

		/**
		 * @def private var RequestManager._onRequestGroupFinished
		 * @var EventListener
		 */

		/**
		 * Defines a new request group with the given policy.
		 * @def function RequestManager.defineGroup ( name, policy )
		 * @param string
		 * @parma string 'abort' aborts the previous request, 'ignore' ignores the new request.
		 */
		defineGroup: function( name, policy ) {
			var group = new RequestGroup( name, policy );
			this._onRequestGroupStarted.add( group );
			this._onRequestGroupFinished.add( group );
			this._groups[name] = group;
			return this;
		},

		/**
		 * Adds a new request in a given group.
		 * @def function RequestManager.addRequest ( group, options, callback )
		 * @param string Group name. Must be added with {@see defineGroup()}.
		 * @param HttpRequest.Options|string {@see HttpRequest()}.
		 * @param HttpRequest.FinishedCallback {@see HttpRequest()}.
		 * @return HttpRequest|false Returns false if the group policy is set to 'ignore' and there is already request in progress.
		 */
		addRequest: function ( group, options, callback ) {
			return this._groups[group].addRequest( options, callback );
		},

		/**
		 * Aborts the request in progress (if any) of a given group.
		 * @def RequestManager.abortGroup ( group )
		 * @param string Group name.
		 * @return bool True if there was a request to be cancelled, false otherwise.
		 */
		abortGroup: function ( group ) {
			return this._groups[group].abort();
		}
	} );

	exports.RequestManager = RequestManager;

})( this );

/*@UNITESTS*/
Unitest( 'RequestManager.*', function () {
	var started = 0;
	var finished = 0;
	var rm = new RequestManager();
	
	//test 'abort' policy
	rm.defineGroup( '1', 'abort' );
	
	rm.addEventListener( 'RequestManager.Started', function () {
		++started;
	} );
	
	rm.addEventListener( 'RequestManager.Finished', function () {
		++finished;
		test( finished == 1 );
	} );
	
	var req = rm.addRequest( '1', location.href, function ( res ) {
		test( res.Cancelled );
	} );
	
	req.addEventListener( 'Request.Started', function ( evt ) {
		var req2 = rm.addRequest( '1', location.href );
		test( started == 1 );
		test( finished == 0 );
		req2.send();
	} );

	req.send();

	setTimeout( function () {
		test( started == 1 );
		test( finished == 1 );
	}, 2000 );


	var started2 = 0;
	var finished2 = 0;

	//test ignore policy
	rm = new RequestManager();

	rm.addEventListener( 'RequestManager.Started', function () {
		++started2;
		test( started2 == 1 );
	} );
	
	rm.addEventListener( 'RequestManager.Finished', function () {
		++finished2;
		test( finished2 == 1 );
	} );

	rm.defineGroup( '2', 'ignore' );
	req = rm.addRequest( '2', location.href );
	test( req instanceof HttpRequest );
	var req2 = rm.addRequest( '2', location.href );
	test( req2 === false );
	req.send();

	setTimeout( function () {
		test( started2 == 1 );
		test( finished2 == 1 );
	}, 2000 );
} );
/*UNITESTS@*/