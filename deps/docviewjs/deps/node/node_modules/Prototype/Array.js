"use strict";

/*@UNITESTS*//*@*/require( 'Unitest' );/*UNITESTS@*/

/**
 * Creates array with duplicates of the items of this array.
 * This function works recursively and will call .duplicate() for the
 * items that implement this function.
 * @def function Array.duplicate ()
 * @return Array
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( Array.prototype, 'duplicate', {
	value: function () {
		var ret = [].concat( this );
		for ( var i = ret.length - 1; i >= 0; --i ) {
			var r = ret[i];
			if ( r instanceof Object && r.duplicate instanceof Function ) {
				ret[i] = r.duplicate();
			}
		}
		return ret;
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'Array.duplicate()', function () {

	var a = [ {}, 1, "", [ 2 ] ];
	test( a.duplicate() !== a );
	test( a.duplicate()[0] !== a[0] );
	test( a.duplicate()[1] == a[1] );
	test( a.duplicate()[2] == a[2] );
	test( a.duplicate()[3] !== a[3] );
	test( a.duplicate()[3][0] == a[3][0] );

} );
/*UNITESTS@*/