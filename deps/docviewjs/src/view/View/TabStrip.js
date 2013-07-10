"use strict";


(function ( exports ) {

	/**
	 * A view representing a strip with tabs.
	 * Each sub-view (usually a {@see View.Tab} or another view with 'Tab' CSS class)
	 * is a clickable tab and one sub-view can be made active.
	 * @def class View.TabStrip extends View mixin View.TActiveView
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 * @todo Horizontal layout should be optional. Cross browser rotation seems possible.
	 */
	function TabStrip () {
		View.call( this );
		View.TActiveView.call( this );
		this._element.classList.add( 'TabStrip' );
		this.setLayout( 'Horizontal' );
	}

	TabStrip.extend( View ).mixin( View.TActiveView );

	/**
	 * @private
	 */
	TabStrip.fromTemplate = function ( element ) {
		var ret = ViewTemplate.classFromTemplate( TabStrip, element );
		if ( element.getAttribute( 'behaviour' ) !== '' ) {
			ret.setBehaviour( 'auto' );
		}
		View.TActiveView.fromTemplate( ret, element );
		return ret;
	};

	exports.TabStrip = TabStrip;

})( this.View );