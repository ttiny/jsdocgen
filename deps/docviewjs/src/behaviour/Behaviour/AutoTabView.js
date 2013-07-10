"use strict";



(function ( exports ) {

	//private
	function findElementIndex ( element ) {
		var ret = -1;
		while ( element ) {
			element = element.previousSibling;
			++ret;
		}
		return ret;
	}

	//private
	var _clickHandler = null;
	function _getClickHandler () {
		return ( _clickHandler || ( _clickHandler = new EventListener( 'ActiveView.Activated', function ( evt ) {
			var view = this/*._view*/;
			if ( view && evt.detail.Parent === view.getStrip() ) {
				var tswitch = view.getSwitch();
				if ( tswitch ) {
					var index = findElementIndex( evt.target );
					var child = tswitch.getElement().children[ index ];
					var view = child ? child._view : null;
					tswitch.setActive( view );
				}
			}
		}, 'bubble' ) ) );
	}

	/**
	 * Automatic behaviour for {@see View.TabView}.
	 * This behaviour will listen for 'ActiveView.Activated' in the {@see View.TabStrip}
	 * and activate view with the same index in the {@see View.ViewSwitch}.
	 * @def class Behaviour.AutoTabView extends Behaviour
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */
	
	/**
	 * @def constructor Behaviour.AutoTabView( tabview )
	 * @param View.TabView
	 */
	function AutoTabView ( view ) {
		this._tabview = view;
		this._onActivated = _getClickHandler().add( view );
	}

	AutoTabView.extend( Behaviour, {
		/**
		 * @def private var Behaviour.AutoTabView._tabview
		 * @var View.TabView
		 */
		
		/**
		 * @def private var Behaviour.AutoTabView._onActivated
		 * @var EventListener
		 */

		detach: function () {
			this._onActivated.remove( this._tabview );
			this._onActivated = null;
			this._tabview = null;
		}
	} );

	View.TabView.prototype.AutoBehaviour = AutoTabView;

	exports.AutoTabView = AutoTabView;

})( this.Behaviour );


/*@UNITESTS*/
Unitest( 'AutoTabView()', function () {
	var v = new View.TabView();
	v.setBehaviour( 'auto' );
	var t1 = new View.Tab();
	var t2 = new View.Tab();
	var v1 = new View();
	var v2 = new View();
	
	v.getStrip().addView( t1 );
	v.getStrip().addView( t2 );
	v.getStrip().setBehaviour( 'auto' );
	v.getSwitch().addView( v1 );
	v.getSwitch().addView( v2 );

	document.body.appendChild( v.getElement() );

	test( v.getStrip().getActive() === null );
	test( v.getSwitch().getActive() === null );

	t1.getElement().click();
	test( v.getStrip().getActive() === t1 );
	test( v.getSwitch().getActive() === v1 );

	t2.getElement().click();
	test( v.getStrip().getActive() === t2 );
	test( v.getSwitch().getActive() === v2 );

	document.body.removeChild( v.getElement() );
} );
/*UNITESTS@*/