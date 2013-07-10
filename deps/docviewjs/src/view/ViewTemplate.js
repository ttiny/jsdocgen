"use strict";


(function ( exports ) {
	/**
	 * Represents a XML template from which views can be created.
	 * @def class ViewTemplate
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	/**
	 * Creates a new template.
	 * @def constructor ViewTemplate ( template )
	 * @param Document XML document of the template.
	 */
	 
	/**
	 * @def private var ViewTemplate._template
	 * @var Document
	 */ 
	function ViewTemplate ( template ) {
		this._template = template;
	}

	/**
	 * Creates a new {@see ViewTemplate} from a string.
	 * The string is parsed into a XML document.
	 * @def static function ViewTemplate.loadString ( string )
	 * @param string XML content.
	 * @return ViewTemplate
	 * @throws SyntaxError
	 */
	ViewTemplate.loadString = function ( string ) {
		var parser = ViewTemplate._parser || ( ViewTemplate._parser = new DOMParser() );
		var template = parser.parseFromString( string, 'text/xml' );
		var error = template.getElementsByTagName( 'parsererror' );
		if ( error.length > 0 ) {
			//throw syntax error for consistency with ie10
			throw new SyntaxError( error[0].textContent );
		}
		return new ViewTemplate( template );
	};

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.loadString()', function () {

		var t = ViewTemplate.loadString( '<View/>' );
		test( t.getDocument().firstChild.tagName == 'View' );

		var caught = false;
		try {
			var t = ViewTemplate.loadString( '<View>&error;</View>' );
		}
		catch ( e ) {
			//           browsers                       ie9
			caught = ( e instanceof SyntaxError ) || ( e.code == 12 );
		}
		test( caught );

	} );
	/*UNITESTS@*/

	/**
	 * Creates a new {@see ViewTemplate} from a string made of DOM element's innerHTML.
	 * The string is parsed into a XML document.
	 * @def static function ViewTemplate.loadInline ( elementId )
	 * @param string Id of the DOM element containing the template.
	 * @return ViewTemplate|null
	 */
	ViewTemplate.loadInline = function ( elementId ) {
		var element = document.getElementById( elementId );
		if ( element ) {
			return ViewTemplate.loadString( element.innerHTML );
		}
		
		throw new Error( 'VIEWTEMPLATE_ID_NOT_FOUND' );
	};


	/**
	 * Creates a view with the new operator for the given class
	 * and calls {@see ViewTemplate.setupViewFromAttributes()} and
	 * {@see ViewTemplate.addViewsFromChildren()} on that view
	 * in this order.
	 * @def static function ViewTemplate.classFromTemplate ( class, element )
	 * @param string
	 * @param Node
	 * @return View
	 */
	ViewTemplate.classFromTemplate = function ( klass, element ) {
		var view = new klass();
		ViewTemplate.setupViewFromAttributes( view, element );
		ViewTemplate.addViewsFromChildren( view, element );
		return view;
	};

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.classFromTemplate()', function () {

		var view = ViewTemplate.classFromTemplate( View, ViewTemplate.loadString( '<View id="a"><View/></View>' ).getDocument().firstChild );
		test( view instanceof View );
		test( view.getElement().id == 'a' );
		test( view.getElement().firstChild._view instanceof View );

	} );
	/*UNITESTS@*/

	/**
	 * Creates a {@see View} from a XML node element.
	 * The function tries to create a new object of a class
	 * with the same name as the tag name of the element.
	 * If the class exists it will check it it has a static
	 * function called fromTemplate() and call it if it does.
	 * This function allows for customized behaviour.
	 * Otherwise {@see ViewTemplate.classFromTemplate()} will be used
	 * to create the view.
	 * @def static function ViewTemplate.createViewFromElement ( element )
	 * @param Node
	 * @return View
	 */
	ViewTemplate.createViewFromElement = function ( element ) {
		var type = element.tagName;
		var klass = window[type] || View[type];
		if ( klass === undefined ) {
			if ( type.indexOf( '.' ) >= 0 ) {
				var types = type.split( '.' );
				klass = window[ types[0] ];
				for ( var i = 1, iend = types.length; i < iend && klass !== undefined; ++i ) {
					klass = klass[ types[i] ];
				}
			}
			if ( klass === undefined ) {
				throw new Error( 'Undefined view "' + type + '"' );
			}
		}

		var view = null;
		if ( klass.fromTemplate instanceof Function ) {
			view = klass.fromTemplate( element );
		}
		else {
			view = ViewTemplate.classFromTemplate( klass, element );
		}

		return view;
	};

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.createViewFromElement()', function () {

		var view = ViewTemplate.createViewFromElement( ViewTemplate.loadString( '<View/>' ).getDocument().firstChild );
		test( view instanceof View );

	} );
	/*UNITESTS@*/

	/**
	 * This function will walk the attributes of XML node element and
	 * and for each attribute will either try to call a function
	 * called setAttribute, where attribute is the actual name of the attribute.
	 * @def static function ViewTemplate.setupViewFromAttributes ( view, element )
	 * @param View
	 * @param Node
	 * @todo Move the setter that only serve the template creation out of the
	 * views into a separate interface. It should be in the View.prototype so
	 * it can be inherited/extended. View.fromTemplate should also reside in this interface.
	 */
	ViewTemplate.setupViewFromAttributes = function ( view, element ) {
		for ( var i = 0, iend = element.attributes.length; i < iend; ++i ) {
			var attr = element.attributes[i];
			var name = attr.name;
			if ( name.indexOf( '-' ) > 0 ) {
				var names = name.split( '-' );
				for ( var j = names.length - 1; j >= 0; --j ) {
					name = names[j];
					names[j] = name.charAt( 0 ).toUpperCase() + name.substr( 1 );
				}
				name = 'set' + names.join( '' );
			}
			else {
				name = 'set' + name.charAt( 0 ).toUpperCase() + name.substr( 1 );
			}
			var fn = view[name];
			if ( fn instanceof Function ) {
				fn.call( view, attr.value );
			}
		}
	};

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.setupViewFromAttributes()', function () {

		var t = ViewTemplate.loadString( '<View/>' ).getDocument();
		var view = ViewTemplate.createViewFromElement( t.firstChild );
		test( view instanceof View );
		test( view.getElement().id === '' );
		
		t = ViewTemplate.loadString( '<View id="test"/>' ).getDocument();
		ViewTemplate.setupViewFromAttributes( view, t.firstChild );
		test( view.getElement().id === 'test' )

	} );
	/*UNITESTS@*/

	/**
	 * This function will walk all child element nodes of an XML node element and
	 * and for each child it will attempt to call {@see ViewTemplate.createViewFromElement()}
	 * and then add the resulting view to the target view using {@see View.addView()}.
	 * @def static function ViewTemplate.addViewsFromChildren ( view, element )
	 * @param View
	 * @param Node
	 */
	ViewTemplate.addViewsFromChildren = function ( view, element ) {
		var child = element.firstChild;
		while ( child ) {
			if ( child.nodeType == Node.ELEMENT_NODE ) {
				view.addView( ViewTemplate.createViewFromElement( child ) );
			}
			child = child.nextSibling;
		}
	};

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.addViewsFromChildren()', function () {

		var t = ViewTemplate.loadString( '<View/>' ).getDocument();
		var view = ViewTemplate.createViewFromElement( t.firstChild );
		test( view instanceof View );
		test( view.getElement().firstChild === null );
		
		t = ViewTemplate.loadString( '<View><View id="test"/></View>' ).getDocument();
		ViewTemplate.addViewsFromChildren( view, t.firstChild );
		test( view.getElement().id === '' );
		test( view.getElement().firstChild.id === 'test' );
		test( view.getElement().firstChild.parentNode._view === view );

	} );
	/*UNITESTS@*/

	ViewTemplate.define( {

		/**
		 * Retrieves the XML document representing this template.
		 * @def function ViewTemplate.getDocument ()
		 * @return Document
		 */
		getDocument: function () {
			return this._template;
		},

		/**
		 * Creates a {@see View} from the template.
		 * @def function ViewTemplate.createView ()
		 * @return View|View[]
		 */
		createView: function () {
			var element = this._template.documentElement;
			if ( element.tagName == 'Template' ) {
				var ret = [];
				element = element.firstChild;
				while ( element ) {
					if ( element.nodeType == element.ELEMENT_NODE ) {
						var v = ViewTemplate.createViewFromElement( element );
						if ( v instanceof View ) {
							ret.push( v );
						}
					}
					element = element.nextSibling;
				}
				return ret.length > 0 ? ret : null;
			}
			else {
				return ViewTemplate.createViewFromElement( element );
			}
		}
	} );

	/*@UNITESTS*/
	Unitest( 'ViewTemplate.crateView()', function () {

		var views = ViewTemplate.loadString( '<View/>' ).createView();
		test( views instanceof View );

		views = ViewTemplate.loadString( '<Template><View/><View/></Template>' ).createView();
		test( views instanceof Array );
		test( views[0] instanceof View );
		test( views[1] instanceof View );

	} );
	/*UNITESTS@*/
	
	/*
	 * A shortcut for ViewTemplate.loadInline( id ).createView().
	 * @def static function $T( id )
	 * @param string Id of DOM element containing the template.
	 * @return {@see ViewTemplate.createView()}
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	/**
	 * A shortcut for ViewTemplate.loadString( $TT( id ).render( data ) ).createView().
	 * @def static function $T( id, data )
	 * @param string|TextTemplate Id of DOM element containing the template.
	 * @param mixed Data to pass to the TextTemplate
	 * @return {@see ViewTemplate.createView()}
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 */ 
	function $T ( id, data ) {

		var tt = id instanceof TextTemplate ? id : $TT( id );
		return ViewTemplate.loadString( tt.render( data ) ).createView();

	}

	exports.$T = $T;
	exports.ViewTemplate = ViewTemplate;

})(this);