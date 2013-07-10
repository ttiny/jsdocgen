"use strict";

/*@UNITESTS*//*@*/require( 'Unitest' );/*UNITESTS@*/

/**
 * Defines properties in the prototype of the function.
 * Each property will be added using Object.definePrototype.
 * @def function Function.define ( properties )
 * @param object Collection of properties.
 * @return this
 */
Object.defineProperty( Function.prototype, 'define', { 
	value: function ( prototype ) {
		var proto = this.prototype;
		for ( var i in prototype ) {
			Object.defineProperty( proto, i, { value: prototype[i], writable: true } );
		}
		return this;
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.define()', function () {

	var A = function () {};
	A.define( { test: function () { return this.qwe; }, qwe: 5 } );
	var a = new A();
	test( a.test() === 5 );

} );
/*UNITESTS@*/

/**
 * Defines properties in the the function object itself.
 * Each property will be added using Object.definePrototype.
 * @def function Function.defineStatic ( properties )
 * @param object Collection of properties.
 * @return this
 */
Object.defineProperty( Function.prototype, 'defineStatic', { 
	value: function ( prototype ) {
		for ( var i in prototype ) {
			Object.defineProperty( this, i, { value: prototype[i], writable: true } );
		}
		return this;
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.defineStatic()', function () {

	var A = function () {};
	A.defineStatic( { test: function () { return this.qwe; }, qwe: 5 } );
	var a = new A();
	test( a.test === undefined );
	test( A.test() == 5 );

} );
/*UNITESTS@*/

/**
 * Will make functions's prototype to inherit from given parent's prototype.
 * @def static function Function.extend ( class, parent )
 * @param function
 * @return this
 */

/**
 * Will make functions's prototype to inherit from given parent's prototype.
 * @def static function Function.extend ( parent, prototype )
 * @param function
 * @param object Prototype for the class itself.
 * @return this
 */
Object.defineProperty( Function.prototype, 'extend', { 
	value: function ( parent, prototype ) {
		this.prototype = Object.create( parent.prototype );
		this.define( prototype );
		return this;
	},
	writable: true
} );


/*@UNITESTS*/
Unitest( 'Function.extend()', function () {

	// test simple prototype
	function A () {

	}

	A.extend( Array, {
		size: function () {
			return this.length;
		}
	} );

	var a = new A();

	test( a instanceof A );
	test( a instanceof Array );
	test( a.size() === 0 );

	// test inheritance without own functions
	function C () {

	}

	C.extend( Array );
	C.prototype.test = 5;

	var c = new C();
	Array.prototype.test2 = 6;

	test( c instanceof C );
	test( c instanceof Array );
	test( c.test === 5 );
	test( Array.prototype.test === undefined );
	test( [].test === undefined );
	test( c.test2 === 6 );

	delete Array.prototype.test2;


} );
/*UNITESTS@*/

/**
 * Mixes the prototype of another function into the prototype of this function.
 * Notice that other function's prototype must have some enumerable properties,
 * which means the can not be defined using {@see Function.define() .define()}
 * @def static function Function.mixin( anotherFunction )
 * @param function
 * @return this
 */
Object.defineProperty( Function.prototype, 'mixin', { 
	value: function ( otherklass ) {
		var prototype = otherklass.prototype || otherklass;
		for ( var i in prototype ) {
			Object.defineProperty( this.prototype, i, { value: prototype[i], writable: true } );
		}
		return this;
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.mixin()', function () {

	function B () {

	}

	B.prototype = {
		asd: 'qwe'
	};

	function A () {

	}

	A.mixin( B );

	var a = new A();

	test( a.asd == 'qwe' );
	test( a instanceof A );

} );
/*UNITESTS@*/

/**
 * Creates a wrapper functon that always calls another function with the same this context.
 * There is native Function.bind() in ES5, but surprisingly it works slower than a JS implementation.
 * @def function Function.bind ( newthis )
 * @param object
 * @return function
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( Function.prototype, 'bind', { 
	value: function( that ) {
		var fn = this;
		return function ( ) {
			return fn.apply( that, arguments );
		};
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.bind()', function () {

	var obj = {}

	var a = function () {
		return this;
	};

	test( a() === this );
	test( a.bind( obj )() === obj );

	var b = function () {
		return arguments;
	};

	var args = b.bind( obj )( 1, 2, 3 );
	test( args[0] == 1 && args[1] == 2 && args[2] == 3 && args.length == 3 );

} );
/*UNITESTS@*/

/**
 * Creates a wrapper function that always calls another function with the same arguments.
 * Bound arguments will be appended to any arguments that the function is called with.
 * @def function Function.bindArgsAfter ( ... )
 * @vaarg
 * @return function
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( Function.prototype, 'bindArgsAfter', { 
	value: function () {
		var func = this;
		var slice = Array.prototype.slice;
		var concat = Array.prototype.concat;
		var args = slice.call( arguments );
		return function ( ) {
			return func.apply( this, arguments.length ? concat.call( slice.call( arguments, 0 ), args ) : args );
		};
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.bindArgsAfter()', function () {

	var a = function () {
		return arguments;
	};

	var b = a.bindArgsAfter( 2, 3 );
	test( b()[0] == 2 );
	test( b()[1] == 3 );
	test( b( 1 )[0] == 1 );
	test( b( 1 )[1] == 2 );
	test( b( 1 )[2] == 3 );

} );
/*UNITESTS@*/

/**
 * Creates a wrapper function that always calls another function with the same arguments.
 * Bound arguments will be prepended to any arguments that the function is called with.
 * @def function Function.bindArgsBefore ( ... )
 * @vaarg
 * @return function
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( Function.prototype, 'bindArgsBefore', { 
	value: function () {
		var func = this;
		var slice = Array.prototype.slice;
		var concat = Array.prototype.concat;
		var args = slice.call( arguments );
		return function ( ) {
			return func.apply( this, arguments.length ? concat.call( args, slice.call( arguments, 0 ) ) : args );
		};
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Function.bindArgsBefore()', function () {

	var a = function () {
		return arguments;
	};

	var b = a.bindArgsBefore( 2, 3 );
	test( b()[0] == 2 );
	test( b()[1] == 3 );
	test( b( 1 )[0] == 2 );
	test( b( 1 )[1] == 3 );
	test( b( 1 )[2] == 1 );

} );
/*UNITESTS@*/