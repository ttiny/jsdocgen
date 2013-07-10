"use strict";

/**
 * class Callback
 * Makes a function wrapper that can be disabled and re-enabled.
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * function Callback ( callback )
 * @param function
 */
function Callback ( callback ) {

	this._naked = callback;

	var that = this;
	this._callback = function () {
		if ( that._enabled ) {
			return callback.apply( this, arguments );
		}
	};

	this._enabled = true;

};

Callback.define( {

	/**
	 * private var Callback._naked
	 * @var function
	 */

	/**
	 * private var Callback._callback
	 * @var function
	 */

	/**
	 * private var Callback._enabled
	 * @var bool
	 */

	/**
	 * function Callback.enable ()
	 * Enables the callback.
	 * @return this
	 */
	enable: function () {
		this._enabled = true;
		return this;
	},

	/**
	 * function Callback.disable ()
	 * Disabled the callback.
	 * @return this
	 */
	disable: function () {
		this._enabled = false;
		return this;
	},

	/**
	 * function Callback.isEnabled ()
	 * Checks if the callback is _enabled.
	 * @return bool
	 */
	isEnabled: function () {
		return this._enabled;
	},

	/**
	 * function Callback.getNaked ()
	 * Returns the original callback passed to the constructor.
	 * This one is indepenedent of the _enabled state of this object.
	 * @return function
	 */
	getNaked: function () {
		return this._naked;
	},

	/**
	 * function Callback.getCallback ()
	 * Returns the wrapped callback that can be _enabled or disabled.
	 * @return function
	 */
	getCallback: function () {
		return this._callback;
	}
 } );


/*@UNITESTS*/
Unitest( 'Callback.*', function () {

	var calls = 0;
	var naked = function () {
		return ++calls;
	};

	var a = new Callback( naked );

	test( a instanceof Callback );
	test( a.getCallback() instanceof Function );
	test( a.getCallback() !== naked );
	test( a.getNaked() ===  naked );

	var b = a.getCallback();
	test( b() == 1 );
	test( naked() == 2 );
	test( b() == 3 );
	
	a.disable();
	test( a.isEnabled() === false );
	b();
	test( calls == 3 );
	test( naked() == 4 );
	b();
	test( calls == 4 );
	
	a.enable();
	test( a.isEnabled() == true );
	test( b() == 5 );
	test( naked() == 6 );



} );
/*UNITESTS@*/