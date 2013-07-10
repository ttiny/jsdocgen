"use strict";



/**
 * This is a special view representing the root application element.
 * Unlike other views it appends itsel to document.body and spans its whole size.
 * @def class View.AppView extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

/**
 * Creates a new View.AppView object and appends itself to document.body.
 * @def constructor View.AppView ()
 */
View.AppView = function () {
	View.call( this );
	this._element.classList.add( 'AppView' );

	this._lastDeviceClass = null;
	if ( window.CssTheme !== undefined ) {
		this._onResize = new EventListener( 'resize', this.updateDeviceClass.bind( this ), 'capture' ).add( window );
		this.updateDeviceClass();
	}
	else {
		this._onResize = null;
	}

	document.body.appendChild( this._element );
};

/**
 * Issued when the logical device size changes.
 * The actual device sizes and their names are theme-specific.
 * @def event View.AppView::AppView.DeviceSize.Changed { Device:string, LastDevice:string }
 */
View.AppView.defineStatic( {
	DeviceSizeChanged: function ( device, lastDevice ) {
		return new CustomEvent( 'AppView.DeviceSize.Changed', {
			bubbles: true,
			cancelable: false,
			detail: { Device: device, LastDevice: lastDevice }
		} );
	}
} );

View.AppView.extend( View, {

	/**
	 * @def private var View.AppView._lastDeviceClass
	 * @var string|null
	 */

	/**
	 * @def private var View.AppView._onResize
	 * @var EventListener|null
	 */


	/**
	 * Adds a CSS class name to the view's DOM element identifying the device size.
	 * Device class names and sizes must be defined in window.CssTheme.DeviceSizes.
	 * The format of the object is { 'classname': [ minsize|-1, maxsize|-1 ] }.
	 * @def function AppView.updateDeviceClass ()
	 * @return bool
	 */
	updateDeviceClass: function () {
		var css = window.CssTheme ? window.CssTheme.DeviceSizes : undefined; 

		if ( !(css instanceof Object) ) {
			return false;
		}

		var deviceClass = null;
		var w = window.innerWidth;
		for ( var i in css ) {
			var sizes = css[i];
			var min = sizes[0];
			var max = sizes[1];
			if ( ( min == -1 || w >= min ) && ( max == -1 || w <= max ) ) {
				deviceClass = i;
				break;
			}
		}

		if ( deviceClass === null ) {
			return false;
		}

		var classList = this._element.classList;
		if ( deviceClass !== this._lastDeviceClass ) {
			if ( this._lastDeviceClass !== null ) {
				classList.remove( this._lastDeviceClass );
			}
			var evt =  new View.AppView.DeviceSizeChanged( deviceClass, this._lastDeviceClass );
			classList.add( this._lastDeviceClass = deviceClass );
			this.dispatchEvent( evt );
			return true;
		}

		return false;
	},

	/**
	 * Sets the document title.
	 * If a global {@see Config} instance named 'R' is found,
	 * the string will be passed though R's {@see Config.render()}.
	 * @def function View.AppView.setText ( title )
	 * @param string
	 * @return string
	 */
	setText: function ( title ) {
		return document.title = ( typeof R != 'undefined' ? R.render( title ) || title : title );
	},

	/**
	 * Retrieves the document title.
	 * @def function View.AppView.getText ()
	 * @return string
	 */
	getText: function () {
		return document.title;
	}

} );

/*@UNITESTS*/
Unitest( 'View.AppView.setText()/View.AppView.getText()', function () {

	var t = View.AppView.prototype.getText();
	
	View.AppView.prototype.setText( 'test' );
	test( View.AppView.prototype.getText() == 'test' );

	View.AppView.prototype.setText( t );
	test( View.AppView.prototype.getText() == t );
});
/*UNITESTS@*/