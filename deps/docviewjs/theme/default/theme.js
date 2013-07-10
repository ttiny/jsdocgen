"use strict";

/*@*/require( '../../src/docview.js' );

var CssTheme = {
	DeviceSizes: {
		'device-large': [ 1200, -1 ], //@min-width-large, -1
		'device-desktop': [ 992, 1999 ], //@min-width-desktop, @max-width-desktop
		'device-tablet': [ 768, 991 ], //@min-width-tablet, @max-width-tablet
		'device-phone': [ -1, 767 ] //-1, @max-width-phone
	}
};
