"use strict";

/**
 * A template with functions with short syntax aliasing the functions in {@see EventDispatcher}.
 * @def mixin TEventDispatcher2
 * @unstable
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
var TEventDispatcher2 = {

	/**
	 * Alias for addEventListener().
	 * @def function TEventDispatcher2.on ( ... )
	 */
	on: function () {
		return this.addEventListener.apply( this, arguments );
	},

	/**
	 * Alias for removeEventListener().
	 * @def function TEventDispatcher2.on ( ... )
	 */
	off: function () {
		return this.removeEventListener.apply( this, arguments );
	},

	/**
	 * Alias for dispatchEvent().
	 * @def function TEventDispatcher2.on ( ... )
	 */
	notify: function () {
		return this.dispatchEvent.apply( this, arguments );
	},

	/**
	 * Alias for new EventListener(...).once( this ).
	 * @def function TEventDispatcher2.once ( ... )
	 * @return EventListener
	 */
	once: function ( event, callback, phase ) {
		return new EventListener( event, callback, phase).once( this );
	}
};