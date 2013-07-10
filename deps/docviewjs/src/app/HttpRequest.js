"use strict";

(function ( exports ) {

	/*@UNITESTS*/
	if ( window.UNITESTS !== false ) {
		var t_XMLHttpRequest = XMLHttpRequest;
	}
	/*UNITESTS@*/

	function _onLoad () {
		var request = this._request;
		var good = true;
		var data = null;
		var error = null;

		//check for errors
		if ( request.status < 200 || request.status >= 400 ) {
			error = request.status;
			good = false;
		}
		else {
			var responseType = this._options.responseType;
			if ( responseType !== undefined && responseType != request.getResponseHeader( 'Content-Type' ) ) {
				error = 'UNEXPECTED_RESPONSE_TYPE';
				good = false;
			}
		}
		
		var finished;
		if ( good ) {
			var forceResponse = this._options.forceResponseEncoding;
			if ( forceResponse == 'json' || request.getResponseHeader( 'Content-Type' ) == 'application/json' ) {
				try {
					data = ( request.responseType == 'json' ? request.response : JSON.parse( request.responseText ) );
				}
				catch ( e ) {
					/*@DEBUG*/
					console.error( '(HttpRequest) Error parsing JSON', e.message );
					/*DEBUG@*/
					if ( forceResponse ) {
						error = 'UNEXPECTED_RESPONSE_TYPE';
						good = false;
					}
					else {
						data = request.response || request.responseText;
					}
				}
			}
			else {
				data = request.response || request.responseText;
			}
		}

		if ( good ) {
			finished = { Success: true, Data: data, Cancelled: false, Request: request };
			if ( this._callback instanceof Function ) {
				this._callback( finished );
			}
			this.dispatchEvent( new CustomEvent( 'Request.Success', { bubbles: false, cancelable: false, detail: { Request: request } } ) );
			this.resolve();
		}
		else {
			finished = { Success: false, Error: error, Cancelled: false, Request: request };
			if ( this._callback instanceof Function ) {
				this._callback( finished );
			}
			this.dispatchEvent( new CustomEvent( 'Request.Error', { bubbles: false, cancelable: false, detail: { Request: request } } ) );
			this.reject();
		}

		this.dispatchEvent( new CustomEvent( 'Request.Finished', { bubbles: false, cancelable: false, detail: finished } ) );
	}

	function _onError () {
		var request = this._request;
		var error = null;
		if ( request.status < 200 || request.status >= 400 ) {
			error = request.status;
		}
		else {
			error = request.statusText || error;
		}
		var finished = { Success: false, Error: error, Cancelled: false, Request: request };
		if ( this._callback instanceof Function ) {
			this._callback( finished );
		}
		this.dispatchEvent( new CustomEvent( 'Request.Error', { bubbles: false, cancelable: false, detail: { Request: request } } ) );
		this.reject();
		this.dispatchEvent( new CustomEvent( 'Request.Finished', { bubbles: false, cancelable: false, detail: finished } ) );
	}

	function _onAbort () {
		var request = this._request;
		var error = null;
		if ( request.status < 200 || request.status >= 400 ) {
			error = request.status;
		}
		else {
			error = request.statusText || error;
		}
		var finished = { Success: false, Error: error, Cancelled: true, Request: request };
		if ( this._callback instanceof Function ) {
			this._callback( finished );
		}
		this.dispatchEvent( new CustomEvent( 'Request.Cancelled', { bubbles: false, cancelable: false, detail: { Request: request } } ) );
		Task.prototype.cancel.call( this );
		this.dispatchEvent( new CustomEvent( 'Request.Finished', { bubbles: false, cancelable: false, detail: finished } ) );
	}

	function _onState () {
		var request = this._request;
		if ( request.readyState === request.HEADERS_RECEIVED ) {
			this.dispatchEvent( new CustomEvent( 'Request.Headers', { bubbles: false, cancelable: false, detail: { Request: request } } ) );
		}
	}

	/**
	 * @def class HttpRequest extends Task uses TEventDispatcher2
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 * @todo Shouldn't abort in case of HTTP errors because the server can still return some relevant content
	 */

	/**
	 * Dispatched when the request is sent.
	 * This event is actually called just before the event
	 * is sent, otherwise the finished event may occur first.
	 * @def event HttpRequest::Request.Started { request }
	 * @param HttpRequest
	 */

	/**
	 * Dispatched when the response headers are received.
	 * @def event HttpRequest::Request.Headers { request }
	 * @param HttpRequest
	 */

	/**
	 * Dispatched after one of the success/cancelled/failed events.
	 * Dispatched after the notification callback.
	 * @def event HttpRequest::Request.Finished { request }
	 * @param HttpRequest.FinishedCallbackDetail
	 */

	/**
	 * Dispatched when the request is successful.
	 * Dispatched after the notification callback.
	 * @def event HttpRequest::Request.Success { request }
	 * @param HttpRequest
	 */

	/**
	 * Dispatched when the request is cancelled by the user.
	 * Dispatched after the notification callback.
	 * @def event HttpRequest::Request.Cancelled { request }
	 * @param HttpRequest
	 */

	/**
	 * Dispatched when error occurs in the request.
	 * Dispatched after the notification callback.
	 * @def event HttpRequest::Request.Error { request }
	 */


	/**
	 * @def constructor HttpRequest ( url, callback )
	 * @param string
	 * @param HttpRequest.FinishedCallback|undefined
	 */

	/**
	 * @def constructor HttpRequest ( options, callback )
	 * @param HttpRequest.Options
	 * @param HttpRequest.FinishedCallback|undefined
	 */
	
	/**
	 * @def object HttpRequest.Options { method, url, dataEncoding, responseType, headers }
	 * @param string 'get' or 'post'. {@see HttpRequest.DefaultOptions}.
	 * @param string
	 * @param string 'json' or 'url'. {@see HttpRequest.DefaultOptions}.
	 * @param string|undefined
	 * @param object|undefined
	 */
	
	/**
	 * @def callback HttpRequest.FinishedCallback ( result )
	 * @param HttpRequest.FinishedCallbackDetail
	 */

	/**
	 * @def object HttpRequest.FinishedCallbackDetail { Success, Cancelled, Data, Error }
	 * @param bool If the request was successful.
	 * @param bool If the request was unsuccessful due to .abort() call.
	 * @param object|string|Document|undefined Response data.
	 * @param string|int|undefined Error associated with the request. Integer is a HTTP status code. Status code < 200 and >= 400 are considered errors.
	 * @param XMLHttpRequest
	 */
	function HttpRequest ( options, callback ) {

		Task.call( this );
		
		if ( typeof options == 'string' || options instanceof String ) {
			options = {}.merge( HttpRequest.DefaultOptions ).merge( { url: options } );
		}
		else {
			options = {}.merge( HttpRequest.DefaultOptions ).merge( options );
		}

		/*@UNITESTS*/
		if ( window.UNITESTS !== false ) {
			var request = new t_XMLHttpRequest();
		}
		else {/*UNITESTS@*/
		var request = new XMLHttpRequest;
		/*@UNITESTS*/}/*UNITESTS@*/

		this._callback = callback;
		this._request = request;
		request.onreadystatechange = _onState.bind( this );
		request.addEventListener( 'load', this._onLoad = _onLoad.bind( this ) ); //save these because of ie9, so we can remove it on abort
		request.addEventListener( 'error', this._onError = _onError.bind( this ) );
		request.addEventListener( 'abort', this._onAbort = _onAbort.bind( this ) );

		var headers = {};

		var dataEncoding = options.dataEncoding;
		if ( dataEncoding == 'url' ) {
			headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}
		else if ( dataEncoding == 'json' ) {
			headers['Content-Type'] = 'application/json';
		}

		if ( options.headers instanceof Object ) {
			headers.merge( options.headers );
		}

		this._options = options;

		request.open( options.method, options.url );

		this._headers = headers;
		
		for ( var i in headers ) {
			request.setRequestHeader( i, headers[i] );
		}
	}

	/**
	 * @def static var HttpRequest.DefaultOptions
	 * @var HttpRequest.DefaultOptions
	 */
	
	/**
	 * @def object HttpRequest.DefaultOptions { method, dataEncoding }
	 * @param string 'get'
	 * @param string 'url'
	 */
	HttpRequest.DefaultOptions = {
		method: 'get',
		dataEncoding: 'url'
	};

	//priate
	function encodePrimitive( val ) {
		if ( typeof val == 'number' || val instanceof Number ) {
			val = String( val );
		}
		return encodeURIComponent( val );
	}

	//private
	function encodeArray ( array, namePrefix ) {
		var ret = '';
		for ( var i = 0, iend = array.length; i < iend; ++i ) {
			var name = namePrefix + '[' + i + ']';
			var val = array[i];
			if ( val instanceof Array ) {
				val = encodeArray( val, name );
				ret += ( ret.length > 0 ? '&' : '' ) + val;
			}
			else if ( val instanceof Object ) {
				val = encodeObject( val, name );
				ret += ( ret.length > 0 ? '&' : '' ) + val;
			}
			else {
				val = encodePrimitive( val );
				ret += ( ret.length > 0 ? '&' : '' ) + name + '=' + val;
			}
		}
		return ret;
	}

	//private
	function encodeObject ( object, namePrefix ) {
		var ret = '';
		for ( var i in object ) {
			var name = namePrefix ? namePrefix + '[' + encodeURIComponent( i ) + ']' : encodeURIComponent( i );
			var val = object[i];
			if ( val instanceof Array ) {
				val = encodeArray( val, name );
				ret += ( ret.length > 0 ? '&' : '' ) + val;
			}
			else if ( val instanceof Object ) {
				val = encodeObject( val, name );
				ret += ( ret.length > 0 ? '&' : '' ) + val;
			}
			else {
				val = encodePrimitive( val );
				ret += ( ret.length > 0 ? '&' : '' ) + name + '=' + val;
			}
			
		}
		return ret;
	}

	/**
	 * @def static function HttpRequest.urlEncode ( object )
	 * @param object
	 * @return string|null
	 */
	HttpRequest.urlEncode = function ( object ) {
		if ( !(object instanceof Object) ) {
			return null;
		}
		return encodeObject( object );
		
	};

	HttpRequest.extend( Task, {

		/**
		 * @def private var HttpRequest._callback
		 * @var HttpRequest.FinishedCallback
		 */

		/**
		 * @def private var HttpRequest._request
		 * @var XMLHttpRequest
		 */

		/**
		 * @def private var HttpRequest._onLoad
		 * @var function
		 */

		/**
		 * @def private var HttpRequest._onError
		 * @var function
		 */

		/**
		 * @def private var HttpRequest._onAbort
		 * @var function
		 */

		/**
		 * @def private var HttpRequest._options
		 * @var object
		 */

		/**
		 * @def private var HttpRequest._headers
		 * @var object
		 */


		/**
		 * @def function send( data )
		 * @param object|string|undefined
		 * @return this
		 */
		 send: function ( data ) {
		 	if ( data instanceof Object ) { 
			 	var dataEncoding = this._options.dataEncoding;
			 	if ( dataEncoding == 'url' ) {
					data = HttpRequest.urlEncode( data );
				}
				else if ( dataEncoding == 'json' ) {
					data = JSON.stringify( data );
				}
			}
			
			//if we haven't aborted yet
			var request = this._request;
			if ( request.readyState === request.OPENED ) {
				this.dispatchEvent( new CustomEvent( 'Request.Started', { bubbles: false, cancelable: false, detail: { Request: request, data: data } } ) );
				this.start();
				//it is possible to abort the request in the event handler so it will never reach opened state and .send() will crash
				if ( request.readyState === request.OPENED ) {
					request.send( data );
				}
			}
			
			return this;
		 },

		/**
		 * @def HttpRequest.abort ()
		 * @return this
		 */
		abort: function () {
			var request = this._request;
			request.removeEventListener( 'load', this._onLoad ); //ie9 fix
			request.abort();
			return this;
		},

		/**
		 * Alias for {@see abort()} for consistency with Promise.
		 * @def HttpRequest.cancel ()
		 * @return this
		 */
		cancel: function () {
			return this.abort();
		},

		/**
		 * Registers an event listener for the request.
		 * @def function HttpRequest.addEventListener( event, listener )
		 * @param string Event type.
		 * @param function Notification callback.
		 * @return this
		 */
		addEventListener: function ( event, listener ) {
			this._request.addEventListener( event, listener );
			return this;
		},

		/**
		 * Removes a previously registered event listener.
		 * @def function HttpRequest.removeEventListener( event, listener )
		 * @param string Event type.
		 * @param function Notification callback.
		 * @return this
		 */
		removeEventListener: function ( event, listener ) {
			this._request.removeEventListener( event, listener );
			return this;
		},

		/**
		 * Dispatches an event.
		 * @def function HttpRequest.dispatchEvent( event )
		 * @param object Event to dispatch.
		 * @return this
		 */
		dispatchEvent: function ( eventObject ) {
			this._request.dispatchEvent( eventObject );
			return this;
		}
	} ).mixin( TEventDispatcher2 );

	/*@UNITESTS*/
	Unitest( 'HttpRequest.urlEncode()', function () {
		test( HttpRequest.urlEncode( 5 ) === null );
		test( HttpRequest.urlEncode( { a: 1, b: 2 } ) === 'a=1&b=2' );
		test( HttpRequest.urlEncode( { c: 'asd', d: 'q&a' } ) === 'c=asd&d=' + encodeURIComponent( 'q&a' ) );
		test( HttpRequest.urlEncode( { a: { aa: 1, bb: 2 }, b: 2 } ) === 'a[aa]=1&a[bb]=2&b=2' );
		test( HttpRequest.urlEncode( { a: [ 1, 2 ], b: 2 } ) === 'a[0]=1&a[1]=2&b=2' );
		test( HttpRequest.urlEncode( { a: [ { aa: 1 }, {bb: [ { cc: { dd: 2 } } ]} ], b: 2 } ) === 'a[0][aa]=1&a[1][bb][0][cc][dd]=2&b=2' );
	} );
	/*UNITESTS@*/

	/*@UNITESTS*/
	Unitest( 'HttpRequest()', function () {

		t_XMLHttpRequest = function () {
			return {
				send: function ( data ) {
					test( data == 'a=1&b=2' )
				},

				open: function ( method, url ) {
					test( method == 'get' && url == 'asdf' )
				},

				setRequestHeader: function ( name, value ) {
					test( name == 'Content-Type' && value == 'application/x-www-form-urlencoded' )
				},

				addEventListener: function () {

				},

				dispatchEvent: function () {
					
				}
			}
		};

		new HttpRequest( 'asdf' )
		.send( { a: 1, b: 2 } );

		t_XMLHttpRequest = function () {
			return {
				send: function ( data ) {
					test( data == '{"a":1,"b":2}' );
				},

				open: function ( method, url ) {
					test( method == 'get' && url == 'asdf' )
				},

				setRequestHeader: function ( name, value ) {
					test( ( name == 'Content-Type' && value == 'application/json' ) ||
						( name == 'Content-Type2' && value == 'funny' ) );
				},

				addEventListener: function () {
					
				},

				dispatchEvent: function () {
					
				}
			}
		};

		new HttpRequest( {url: 'asdf', dataEncoding: 'json', headers: { 'Content-Type2': 'funny' } } )
		.send( { a: 1, b: 2 } );

		t_XMLHttpRequest = function () {
			return {
				send: function ( data ) {
					test( data == '{"a":1,"b":2}' );
				},

				open: function ( method, url ) {
					test( method == 'get' && url == 'asdf' )
				},

				setRequestHeader: function ( name, value ) {
					test( ( name == 'Content-Type' && value == 'funny' ) );
				},

				addEventListener: function () {
					
				},

				dispatchEvent: function () {

				}
			}
		};

		new HttpRequest( {url: 'asdf', dataEncoding: 'json', headers: { 'Content-Type': 'funny' } } )
		.send( { a: 1, b: 2 } );

		t_XMLHttpRequest = XMLHttpRequest;

		var started = [];
		var failed = [];
		var success = [];
		var aborted = [];
		var finished = [];

		new HttpRequest( 'http://asdasdasdasdasdasdasdasd.com', function ( res ) {
			test( started[0] );
			test( res.Success === false );
			test( res.Error === 404 || res.Error === 0 ); //sometimes is 0, not 404, always 0 in ie
			test( res.Cancelled === false );
		} )
		.addEventListener( 'Request.Started', function () { started[0] = true; } )
		.addEventListener( 'Request.Error', function () { failed[0] = true; } )
		.addEventListener( 'Request.Success', function () { success[0] = true; } )
		.addEventListener( 'Request.Cancelled', function () { aborted[0] = true; } )
		.addEventListener( 'Request.Finished', function () { finished[0] = true; test( started[0] && !success[0] && !aborted[0] && failed[0] ); } )
		.send();

		new HttpRequest( location.href, function ( res ) {
			test( started[1] );
			test( res.Success === true );
			test( res.Request.status === 200 );
			test( res.Request.getResponseHeader( 'Content-Type' ) == 'text/html' );
		} )
		.addEventListener( 'Request.Started', function () { started[1] = true; } )
		.addEventListener( 'Request.Error', function () { failed[1] = true; } )
		.addEventListener( 'Request.Success', function () { success[1] = true; } )
		.addEventListener( 'Request.Cancelled', function () { aborted[1] = true; } )
		.addEventListener( 'Request.Finished', function () { finished[1] = true; test( started[1] && success[1] && !aborted[1] && !failed[1] ); } )
		.send();

		new HttpRequest( { url: location.href, responseType: 'application/bson' } , function ( res ) {
			test( started[2] );
			test( res.Success === false );
			test( res.Cancelled === false );
			test( res.Error === 'UNEXPECTED_RESPONSE_TYPE' );
		} )
		.addEventListener( 'Request.Started', function () { started[2] = true; } )
		.addEventListener( 'Request.Error', function () { failed[2] = true; } )
		.addEventListener( 'Request.Success', function () { success[2] = true; } )
		.addEventListener( 'Request.Cancelled', function () { aborted[2] = true; } )
		.addEventListener( 'Request.Finished', function () { finished[2] = true; test( started[2] && !success[2] && !aborted[2] && failed[2] ); } )
		.send();

		new HttpRequest( location.href, function ( res ) {
			test( res.Success === false );
			test( res.Cancelled === true );
		} )
		.addEventListener( 'Request.Headers', function ( evt ) {
			evt.detail.Request.abort();
		} )
		.addEventListener( 'Request.Cancelled', function () { aborted[3] = true; } )
		.addEventListener( 'Request.Finished', function () { finished[3] = true; test( aborted[3] ); } )
		.send();

		/*new HttpRequest( 'http://bobef.github.com/404040404', function ( res ) {
			test( res.Success === false );
			test( res.Error === 404 || res.error === 0 ); //sometimes is 0, not 404, always 0 in ie
			test( res.Cancelled === false );
		} )
		.addEventListener( 'Request.Finished', function () { finished[4] = true; } )
		.send();*/

		setTimeout( function () {
			test( finished[0] );
			test( finished[1] );
			test( finished[2] );
			test( finished[3] );
			//test( finished[4] );
		}, 2000 );
	} );
	/*UNITESTS@*/

	exports.HttpRequest = HttpRequest;

})( this );