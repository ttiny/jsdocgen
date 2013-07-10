"use strict";


/**
 * Global application config.
 * It is global because it is really inconvenient to pass reference
 * to the application object to each view you create, also makes no
 * sense to keep reference to the app in each view and templates make
 * this even harder.
 * @def var R
 * @var Config
 */
var R = new Config();

/**
 * @def class App
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * @def constructor App ( run )
 * @param App.AppReadyCallback
 */

/**
 * Callback to be called when all scripts of the framework are loaded and ready for use.
 * @def callback AppReadyCallback ( app )
 * @param App reference to the application object
 */

/**
 * @def private var App._onReady
 * @var EventListener
 */
function App ( run ) {

	var that = this;

	this._onReady = new EventListener( 'DOMContentLoaded', function () {
		if ( run instanceof Function ) {
			run( that )
		}
	}, 'bubble' ).add( document );
	
}

/*
 * Includes a JS or CSS file(s) in the document.
 * @def static function App.include ( file, type, callback )
 * @param string|string[] File(s) to be included.
 * @param string|undefined Force the file to be included as 'js' or 'css', otherwise
 * the function will detect the file type by file's extension.
 * @param function|undefined Callback to be notified when each file is loaded.
 * The first agrument of the function will be true if this is the last file of the group.
 */
App.include = function ( file, type, then ) {
	if ( !(file instanceof Array) ) {
		file = [file];
	}
	var loaded = 0;
	var toload = file.length;

	if ( type instanceof Function ) {
		then = type;
		type = null;
	}
	
	function onload () {
		if ( ++loaded == toload && then instanceof Function ) {
			then.call( this, loaded == toload );
		}
	}
	
	var head = document.getElementsByTagName( 'head' )[0];
	for ( var i = 0, end = file.length; i < end; ++i ) {
		var f = file[i];
		var ext = type || f.splitLast( '.' ).right;
		if ( ext == 'js' ) {
			var node = document.createElement( 'script' );
			node.type = 'text/javascript';
			node.src = f;
			node.addEventListener( 'load', onload );
			head.appendChild( node );
		}
		else if ( ext == 'css' ) {
			var node = document.createElement( 'link' );
			node.rel = 'stylesheet';
			node.href = f;
			node.addEventListener( 'load', onload );
			head.appendChild( node );
		}
	}
};
