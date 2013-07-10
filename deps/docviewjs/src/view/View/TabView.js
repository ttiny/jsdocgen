"use strict";


/**
 * A tab view has a {@see View.TabStrip} and a {@see View.ViewSwitch}.
 * @def class View.TabView extends View
 * @author Borislav Peev <borislav.asdf@gmail.com>
 * @todo Order of the strip and the swich should be optional similar to {@see View.Label} and the TabView should be able to change it.
 */

/**
 * @def constructor View.TabView ( strip, switch )
 * @param View.TabStrip|false|undefined Existing tab strip to add and use as tab strip,
 * false to prevent the creation of new one.
 * @param View.ViewSwitch|false|undefined Existing view switch to add and use as switch,
 * false to prevent the creation of new one.
 */
View.TabView = function ( strip, tswitch ) {
	View.call( this );

	var classList = this._element.classList;
	classList.add( 'TabView' );

	this._strip = null;
	this._switch = null;
	
	if ( strip !== false ) {
		if ( !(strip instanceof View.TabStrip) ) {
			strip = new View.TabStrip();
		}
		this.addView( strip );
	}
	
	if ( tswitch !== false ) {
		if ( !(tswitch instanceof View.ViewSwitch) ) {
			tswitch = new View.ViewSwitch();
		}
		this.addView( tswitch );
	}
	
};

/**
 * @private
 */
View.TabView.fromTemplate = function ( element ) {
	var ret = new View.TabView( false, false );
	ViewTemplate.setupViewFromAttributes( ret, element );
	ViewTemplate.addViewsFromChildren( ret, element );
	if ( ret.getStrip() === null ) {
		var strip = new View.TabStrip();
		strip.setBehaviour( 'auto' );
		ret.addView( strip );
	}
	if ( ret.getSwitch() === null ) {
		ret.addView( new View.TabSwitch() );
	}
	if ( element.getAttribute( 'behaviour' ) !== '' ) {
		ret.setBehaviour( 'auto' );
	}
	return ret;
};

View.TabView.extend( View, {

	/**
	 * @def private var View.TabView._strip
	 * @var View.TabStrip
	 */

	/**
	 * @def private var View.TabView._switch
	 * @var View.TabView
	 */

	/**
	 * Associates a {@see View.TabStrip} with this view.
	 * @def function View.TabView.setStrip( view )
	 * @param View.TabStrip
	 * @return View.TabStrip|null The previously associated strip.
	 */
	setStrip: function ( view ) {
		var ret = this._strip;
		this._strip = view;
		return ret;
	},

	/**
	 * Retrieves the currently associated {@see View.TabStrip}.
	 * @def function View.TabView.getStrip ()
	 * @return View.TabStrip|null
	 */
	getStrip: function () {
		return this._strip;
	},

	/**
	 * Associates a {@see View.ViewSwitch} with this view.
	 * @def function View.TabView.setSwitch( view )
	 * @param View.ViewSwitch
	 * @return View.ViewSwitch|null The previously associated switch.
	 */
	setSwitch: function ( view ) {
		var ret = this._switch;
		this._switch = view;
		return ret;
	},

	/**
	 * Retrieves the currently associated {@see View.ViewSwitch}.
	 * @def function View.TabView.getSwitch ()
	 * @return View.ViewSwitch|null
	 */
	getSwitch: function () {
		return this._switch;
	},

	/**
	 * {@inheritdoc}
	 * {@inheritdoc}
	 * This function will check the type of the view
	 * that is being added and and call
	 * {@see setStrip()} or {@see setSwitch()}.
	 * @see View.addView()
	 * @param {@inheritdoc}
	 * @param {@inheritdoc}
	 * @return {@inheritdoc}
	 */
	addView: function ( view, order ) {
		if ( view instanceof View.TabStrip ) {
			this.setStrip( view );
		}
		else if ( view instanceof View.ViewSwitch ) {
			this.setSwitch( view );
		}
		else {
			return false;
		}
		return View.prototype.addView.call( this, view, order );
	},

	removeView: function ( view ) {
		if ( view === this._strip ) {
			this.setStrip( null );
		}
		else if ( view === this._switch ) {
			this.setSwitch( null );
		}
		else {
			return false;
		}
		return View.prototype.removeView.call( this, view );
	}

} );

/*@UNITESTS*/
Unitest( 'View.TabView()', function () {
	var tv = new View.TabView();

	var ts = tv.getStrip();
	test( ts instanceof View.TabStrip );

	var vs = tv.getSwitch();
	test( vs instanceof View.ViewSwitch );
	
	tv.removeView( tv.getStrip() );
	test( tv.getStrip() === null );
	
	tv.removeView( tv.getSwitch() );
	test( tv.getSwitch() === null );

	tv.addView( vs );
	test( tv.getSwitch() === vs );

	tv.addView( ts );
	test( tv.getStrip() === ts );

} );
/*UNITESTS@*/