"use strict";

/*@UNITESTS*//*@*/require( 'Unitest' );/*UNITESTS@*/



/**
 * Checks if argument is a string.
 * This function checks for both typeof and instanceof
 * to make sure the argument is a string.
 * @def static function String.isString ( string )
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( String, 'isString', { 
	value: function ( str ) {
		return typeof str == 'string' || str instanceof String;
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'String.isString()', function () {


	test( !('asd' instanceof String) && String.isString( 'sad' ) );
	test( typeof new String() == 'object' && String.isString( new String ) );

} );
/*UNITESTS@*/



/**
 * Splits a string on the first occurence of substring.
 * @def function String.splitFirst ( search:string|RegExp )
 * @return object Object will have two properties -
 * 'left', which could be reference to the original string, and 'right' which could be undefined.
 * * Both properties can be empty string.
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( String.prototype, 'splitFirst', { 
	value: function ( search ) {
		if ( String.isString( search ) ) {
			var i = this.indexOf( search );
			if ( i >= 0 ) {
				return { left: this.substr( 0, i ), right: this.substr( i + search.length ) };
			}
		}
		else {
			var last = search.exec( this );
			if ( last !== null ) {
				return { left: this.substr( 0, last.index ), right: this.substr( last.index + last[0].length ) };
			}
		}
		return { left: this };
	},
	writable: true
} );


/*@UNITESTS*/
Unitest( 'String.splitFirst()', function () {

	var r = 'left center right'.splitFirst( ' ' );
	test( r.left == 'left' );
	test( r.right == 'center right' );
	
	var r = ' left center right'.splitFirst( ' ' );
	test( r.left == '' );
	test( r.right == 'left center right' );

	var s = 'leftright';
	var r = s.splitFirst( ' ' );
	test( r.left === s );
	test( s.right === undefined );


	var r = 'left\ncenter right'.splitFirst( /\s/ );
	test( r.left == 'left' );
	test( r.right == 'center right' );


} );
/*UNITESTS@*/


/**
 * Splits a string on the last occurence of substring.
 * @def function String.splitLast ( search:string|RegExp )
 * @return {@see String.splitFirst()}
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( String.prototype, 'splitLast', { 
	value: function ( search ) {
		if ( String.isString( search ) ) {
			var i = this.lastIndexOf( search );
			if ( i >= 0 ) {
				return { left: this.substr( 0, i ), right: this.substr( i + search.length ) };
			}
		}
		else {
			var last, m;
			if ( !search.global ) {
				//if no global flag we will end in infinite loop
				search = new RegExp( search.source, (search.ignoreCase ?  'i' : '') + (search.multiline ?  'm' : '') + 'g' );
				//throw new Error( 'String.splitLast for RegExp without g flag will loop forever.' );
			}
			while ( m = search.exec( this ) ) {
				last = m;
			}
			if ( last !== null ) {
				return { left: this.substr( 0, last.index ), right: this.substr( last.index + last[0].length ) };
			}
		}
		return { left: this };
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'String.splitLast()', function () {


	var r = 'left center right'.splitLast( ' ' );
	test( r.left == 'left center' );
	test( r.right == 'right' );
	
	var r = 'left center right '.splitLast( ' ' );
	test( r.left == 'left center right' );
	test( r.right == '' );

	var s = 'leftright';
	var r = s.splitLast( ' ' );
	test( r.left === s );
	test( s.right === undefined );



	/*var caught = false;
	try {
		var r = 'left\ncenter right'.splitLast( /\s/ );
	}
	catch ( e ) {
		caught = true;
	}
	test( caught );
	*/
	var r = 'left\ncenter right'.splitLast( /\s/ );
	test( r.left == 'left\ncenter' );
	test( r.right == 'right' );

} );
/*UNITESTS@*/


/**
@def bool function String.startsWith( searchString:string, position:int = "0" )
@param String to search for.
@param Position in the string where to start the search.
*/
if ( String.prototype.startsWith === undefined ) {
	Object.defineProperty( String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function ( searchString, position ) {
			position = position || 0;
			if ( this.length <= position + searchString.length ) {
				return false;
			}
			return this.indexOf( searchString, position ) === position;
		}
	} );


	/*@UNITESTS*/
	Unitest( 'String.startsWith()', function () {
		
		test( 'asd_qwe_zxc'.startsWith( 'asd' ) );
		test( !'asd_qwe_zxc'.startsWith( '!asd' ) );
		test( !'asd_qwe_zxc'.startsWith( 'qwe' ) );
		test( 'asd_qwe_zxc'.startsWith( 'qwe', 4 ) );
		test( !'asd_qwe_zxc'.startsWith( 'qwe', 5 ) );
	
	} );
	/*UNITESTS@*/

}


/**
 * Counts the occurences of substring in a string.
 * @def function String.count ( search:string )
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Object.defineProperty( String.prototype, 'count', { 
	value: function ( search ) {
		//if ( String.isString( search ) ) {
			var ret = 0;
			for ( var i = 0; (i = this.indexOf( search, i )) >= 0; i += search.length ) {
				++ret;
			}
			return ret;
		//}
		return { left: this };
	},
	writable: true
} );

/*@UNITESTS*/
Unitest( 'String.count()', function () {

	test( 'asd'.count( 'sd' ) == 1 );
	test( 'asd'.count( 's' ) == 1 );
	test( 'asd'.count( 'a' ) == 1 );
	test( 'asaad'.count( 'a' ) == 3 );
	test( 'asaad'.count( 'aa' ) == 1 );
	test( 'aaa'.count( 'a' ) == 3 );
} );
/*UNITESTS@*/