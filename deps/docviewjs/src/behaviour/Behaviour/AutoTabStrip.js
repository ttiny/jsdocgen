"use strict";



(function ( exports ) {

	//private
	function _fromWhichTab ( tabstrip, element ) {
		var prev = element;
		var element = element.parentNode;
		while ( element ) {
			if ( element._view === tabstrip ) {
				if ( prev.classList.contains( 'Tab' ) ) {
					return prev._view;
				}
				else {
					break;
				}
			}
			else {
				prev = element;
				element = element.parentNode;
			}
		}
		return false;
	}

	/**
	 * Automatic behaviour for {@see View.TabStrip}.
	 * This behaviour will listen for clicks in the {@see View.TabStrip}
	 * items and activate them.
	 * @def class Behaviour.AutoTabStrip extends Behaviour
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	/**
	 * @def constructor Behaviour.AutoTabStrip ( view )
	 * @param View.TabStrip
	 */
	function AutoTabStrip ( view ) {
		this._strip = view;
		this._onClick = new EventListener( 'click', function ( evt ) {
			var tab = _fromWhichTab( view, evt.target );
			if ( tab && tab !== view.getActive() && !tab.hasState( 'disabled' ) ) {
				view.setActive( tab );
				evt.preventDefault();
			}
		}, 'bubble' ).add( view );
	}

	AutoTabStrip.extend( Behaviour, {
		/**
		 * @def private Behaviour.AutoTabStrip._onClick
		 * @var EventListener
		 */
		
		/**
		 * @def private Behaviour.AutoTabStrip._strip
		 * @var View.TabStrip
		 */

		detach: function () {
			this._onClick.remove( this._strip );
			this._onClick = null;
			this._strip = null;
		}
	} );

	View.TabStrip.prototype.AutoBehaviour = AutoTabStrip;

	exports.AutoTabStrip = AutoTabStrip;

})( this.Behaviour );

/*@UNITESTS*/
Unitest( 'AutoTabStrip()', function () {
	var v = new View.TabStrip();
	v.setBehaviour( 'auto' );
	var t1 = new View.Tab();
	var t2 = new View.Tab();
	v.addView( t1 );
	v.addView( t2 );
	document.body.appendChild( v.getElement() );

	test( v.getActive() === null );

	t1.getElement().click();
	test( v.getActive() === t1 );

	t2.getElement().click();
	test( v.getActive() === t2 );

	document.body.removeChild( v.getElement() );
} );
/*UNITESTS@*/