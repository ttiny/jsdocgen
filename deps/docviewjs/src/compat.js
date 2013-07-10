"use strict";

/**
 * Some compatibility fixes for IE 9 and 10
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */

if ( document.documentMode !== undefined ) {

	if ( document.documentMode === 10 || document.documentMode === 9 ) {
		
		//.preventDefault() is not working properly with CustomEvent
		(function () {

			var og_preventDefault = CustomEvent.prototype.preventDefault;
			Object.defineProperty( CustomEvent.prototype, 'preventDefault', {
				value: function () {
					og_preventDefault.call( this );
					this._ie_defaultPrevented = true;
				}
			} );

			Object.defineProperty( CustomEvent.prototype, 'defaultPrevented', {
				get: function () {
					return this._ie_defaultPrevented === true ? true : false;
				}
			} );

		})();

		//custom event constructor
		(function () {
			function CustomEvent ( event, params ) {
				params = params || { bubbles: false, cancelable: false, detail: undefined };
				var evt = document.createEvent( 'CustomEvent' );
				evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
				return evt;
			};

			CustomEvent.prototype = window.CustomEvent.prototype;

			window.CustomEvent = CustomEvent;
		})();

		if ( document.documentMode === 9 ) {

			//.classList is not supported in ie9
			(function () {

				function classList ( element ) {
					this._element = element;
				}

				function has ( className, klass ) {
					var pos = className.indexOf( klass );
					if ( pos < 0 ) {
						return -1;
					}
					if ( pos > 0 && className.charAt( pos - 1 ) != ' ' ) {
						return -1;
					}
					var klasslength = klass.length;
					if ( pos < className.length - klasslength - 1 && className.charAt( pos + klasslength ) != ' ' ) {
						return -1;
					}
					return pos;
				}

				var proto = {
					contains: function ( klass ) {
						return has( this._element.className, klass ) >= 0;
					},

					add: function ( klass ) {
						var className = this._element.className;
						if ( has( className, klass ) < 0 ) {
							className = ( className.length ? className + ' ' : '' ) + klass;
							this._element.className = className;
						}
					},

					remove: function ( klass ) {
						var className = this._element.className;
						var pos = has( className, klass );
						if ( pos >= 0 ) {
							className = className.substr( 0, pos ) + className.substr( pos + klass.length + 1 );
							this._element.className = className;
						}
					}
				};

				var p = classList.prototype;
				for ( var i in proto ) {
					Object.defineProperty( p, i, { value: proto[i] } );
				}

				Object.defineProperty( HTMLElement.prototype, 'classList', {
					get: function () {
						return new classList( this );
					}
				} );

			})();
		}

	}

}