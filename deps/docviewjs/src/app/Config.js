"use strict";

(function ( exports ) {

	/**
	 Provides some resources to the application.
	 Each resource is identified by its id. Configs can be stacked
	 effectively providing resourse sets that can be used for 
	 internationalization, theming and others.
	 ```
	 //default language
	 var cfg = new Config( { hello: 'hello', bye: 'bye' } );
	 //another language extends the default
	 cfg = new Config( { hello: 'hallo', bye: 'auf wiedersehen' }, cfg );
	 cfg = new Config( { hello: 'holla' }, cfg );
	 if ( cfg.hello == 'holla' ) {
		//we have spanish string for hello
	 }
	 if ( cfg.bye == 'auf wiedersehen' ) {
	 	//we don't have spanish string for bye and we use the german fallback
	 }
	 ```
	 @def class Config
	 @author Borislav Peev <borislav.asdf@gmail.com>
	 */

	 /**
	 Creates a new config instance.
	 @def constructor Config ( defaultset:Object = "null", parent:Config = "undefined" )
	 @param Object with collecition of properties for the config.
	 @param Parent config to inherit some properties from.
	 */
	function Config ( configset, parent ) {
		
		var that = this;
		var Config = function () {};
		Config.prototype = parent || this;
		var ret = new Config;

		if ( parent ) {
			ret.parent = parent;
		}

		if ( configset ) {
			ret.merge( configset );
		}

		return ret;
	}

	var _regexCache = {};
	var RE_MATCH1 = /[\?\.\+\[\]\(\)\{\}\$\^\\\|]/g;
	var RE_MATCH2 = /\*\*/g;
	var RE_MATCH3 = /\*(?!\?)/g;
	var RE_VARIABLE = /{([\s\S]+?)}/g;

	function _flatten ( obj, callback, param, prefix ) {
		for ( var i in obj ) {
			var val = obj[i];
			if ( Object.isObject( val ) ) {
				_flatten( val, callback, param, prefix ? prefix + i + '.' : i + '.' );
			}
			callback( param, prefix ? prefix + i : i, val );
		}
		if ( prefix === undefined && obj.parent ) {
			param.config = obj.parent;
			_flatten( obj.parent, callback, param );
		}
	}

	function _match ( param, name, value ) {
		var m = name.match( param.regex );
		if ( m && param.ret[name] === undefined ) {
			param.ret[name] = new Config.Match( param.config, name, value, m.slice( 0 ) );
		}
	}

	function _filterGet ( val ) {
		return !(val instanceof Object);
	}

	Config.defineStatic( {
		/**
		@def object Config.Match {
			config:Config,
			name:String,
			value:mixed,
			matches:string[]
		}
		@param Reference to the config object containing this property.
		@param Dot delimited string with the id of the property.
		@param Value of the matching property.
		@param Array of all submatching patterns.
		*/
		Match: function ( config, name, value, matches ) {
			this.config = config;
			this.name = name;
			this.value = value;
			this.matches = matches;
		}
	} );

	Config.define( {

		/**
		The Config this instance is inheriting from.
		@def var Config.parent:Config = "null"
		*/

		/**
		Find all properties of the config matching a pattern.
		`*` in the pattern matches everything but dot,
		and `**` matches everything, non greedy.
		@def function Object Config.match( pattern:String )
		@return Returns Object where each key is the name of the
		matching property and the value is {@see Config.Match}.
		Unlike {@see get()} returned values will be raw, not passed
		through {@see render()}.
		*/

		match: function ( pattern ) {
			var regex = _regexCache[pattern];
			if ( regex === undefined ) {
				pattern = '^' + pattern
					.replace( RE_MATCH1, '\\$&' )
					.replace( RE_MATCH2, '(.*?)' )
					.replace( RE_MATCH3, '([^\.]*?)' ) + '$';
				regex = new RegExp( pattern );
				_regexCache[pattern] = regex;
			}
			var param = { regex: regex, ret: {}, config: this };
			_flatten( this, _match, param );
			return param.ret;
		},

		/**
		Retrieves a resource with a given id.
		Id could be a string delimited with dots
		or a pattern for {@see match()}.
		@def function Config.get ( id:String )
		@return mixed|Object|undefined
		For patterns returns Object where the key is the name of
		the matched property and the value.
		Returns undefined if nothing is found.
		All returned values will be passed through {@see render()}.
		*/
		get: function ( id ) {
			
			//if we have a pattern
			if ( id.indexOf( '*' ) > 0 ) {
				var ret = this.match( id );
				for ( var key in ret ) {
					var val = ret[key].value;
					arguments[0] = val;
					ret[key] = this.render.apply( this, arguments );
				}
				return ret.filter( _filterGet );
			}
			else {
				var obj;
				
				//if we have a dot chain
				if ( id.indexOf( '.' ) > 0 ) {
					var ids = id.split( '.' );
					obj = this;
					for ( var i = 0, iend = ids.length; obj !== undefined && i < iend; ++i ) {
						obj = obj[ ids[i] ];
					}
				}
				else {
					obj = this[id];
				}

				if ( obj === undefined && this.parent ) {
					return this.parent.get.apply( this.parent, arguments );
				}

				arguments[0] = obj;
				return this.render.apply( this, arguments );
			}
		},

		/**
		Converts config variable references in a text to their values.
		Variables are in the format {id} where id is either dot delimited string or number.
		If it is a number then this is taken from the arguments of render.
		@def function String Config.render ( text:String )
		*/
		render: function ( text ) {
			if ( text instanceof Function ) {
				return text.apply( Array.prototype.slice.call( arguments, 1 ) );
			}
			else if ( String.isString( text ) && text.indexOf( '{' ) >= 0 ) {
				var that = this;
				var args = arguments;
				return text.replace( RE_VARIABLE, function ( match, id ) {
					var n = parseInt( id );
					var value = that.get( id ) || (n > 0 && args.length > n ? args[n] : undefined);
					return value !== undefined ? that.render( value ) : match;
				} );
			}
			else {
				return text;
			}
		}

	} );

	exports.Config = Config;

})( this );

/*@UNITESTS*/
Unitest( 'Config.*', function () {

	var cfg = new Config( { a: { b: 2 } } );
	var cfg2 = new Config( { a: 1 }, cfg );
	test( cfg2.get( 'a.b' ) == 2 );

	var cfg = new Config( { a: { b: 2 } } );
	var cfg2 = new Config( { a: { c: 3 } }, cfg );
	testeqdeep( cfg2.get( 'a.*' ) , { 'a.b': 2, 'a.c': 3 } );

	var cfg = new Config( { a: 1, b: 2 } );
	test( cfg instanceof Config );
	test( cfg.a == 1 );

	var cfg2 = new Config( { b: 3, c: 4 }, cfg );
	test( cfg2 instanceof Config );
	test( cfg2.a == 1 );
	test( cfg2.b == 3 );
	test( cfg2.parent.b == 2 );

	var cfg = new Config( { a: 1, b: 2 } );
	test( cfg.get( 'a' ) === 1 );

	var cfg2 = new Config( { a: 2, b: 1 }, cfg );
	test( cfg2.get( 'a' ) === 2 );

	var cfg2 = new Config( { c: 'ccc', d: '{a} {b} {c}' }, cfg );
	test( cfg2.get( 'a' ) === 1 );
	test( cfg2.get( 'c' ) == 'ccc' );
	test( cfg2.get( 'd' ) == '1 2 ccc' );

	cfg2.e = 'ee';
	test( cfg2.get( 'e' ) == 'ee' );
	test( cfg.get( 'e' ) === undefined );

	var cfg = new Config( { a: { b: { c: 1, d: '{1}' }, bb: 2 } } );
	test( cfg.a.b.c == 1 );
	test( cfg.get( 'a.b.c' ) == 1 );
	test( cfg.get( 'a.b.d', 2 ) == 2 );
	test( cfg.get( 'a.b.d', function () { return 3; } ) == 3 );

	var m = cfg.match( 'a.*' );
	test( Object.keys( m ).length == 2 );
	test( m['a.b'].name == 'a.b' );
	test( m['a.b'].value.c == 1 );
	test( m['a.bb'].name == 'a.bb' );
	test( m['a.bb'].value == 2 );

	var m = cfg.match( 'a.**' );
	test( Object.keys( m ).length == 4 );
	test( m['a.b.d'].name == 'a.b.d' );
	test( m['a.b.d'].value == '{1}' );
	test( m['a.b.d'].matches[1] == 'b.d' );

	var cfg = new Config( { 'bb00': '11', 'aa00': '00', 'aabb': { 'ccdd': '{1} {aabb.eeff}', 'eeff': function () { return '--'; } } } );
	test( cfg.get( 'aabb.ccdd' ) == '{1} --' );
	test( cfg.get( 'aabb.ccdd', 1 ) == '1 --' );
	test( cfg.get( 'aa*0' )['aa00'] == '00' );
	test( Object.keys( cfg.get( 'aa*0' ) ).length == 1 );
	test( Object.keys( cfg.get( 'aa**' ) ).length == 3 );
	test( cfg.get( 'aa**' )['aabb.ccdd'] == '{1} --' );
	test( cfg.get( 'aa**', 2 )['aabb.ccdd'] == '2 --' );

} );
/*UNITESTS@*/