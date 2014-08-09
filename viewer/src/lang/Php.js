"use strict";

(function ( exports ) {

	/**
	Handles PHP specific doc rendering and UI.
	@def class DocBlockViewer.Lang.Php
	@author Borislav Peev <borislav.asdf@gmail.com>
	*/
	function Php () {

	}


	var _reAnySlash = /[\/\\]/g;
	var _reSee = /^(php:)?([^\/]+)\/([^ ]+) ?(.*)$/;
	Php.define( {

		getName: function () {
			return 'php';
		},

		parseSeeTag: function ( see ) {
			var m = see.match( _reSee );
			if ( m === null ) {
				return see;
			}

			var isphp = m[1];
			var type = m[2];
			var see = m[3];
			var desc = m[4];
			if ( isphp ) {

				var ret = 'http://www.php.net/';
				if ( type == 'class' || type == 'function' ) {
					ret += type + '.' + see;
				}
				else if ( type == 'var' || type == 'method' || type == 'const' ) {
					ret += see.replace( _reAnySlash, '/' );
				}

				return { url: ret, name: desc }
			}
			else if ( type == 'url' ) {
				return { url: see, name: desc };
			}
			else {
				return { url: '#' + type + '/' + see, name: desc };
			}
		},

		makeSymbolUrl: function ( symbolType, symbol, index ) {
			var ret =
					'#' +
					symbolType + '/' +
					( index && symbol.ns ? index.groups.ns[ symbol.ns ].replace( _reAnySlash, '/' ) + '/' : '' ) +
					( symbol['class'] ? symbol['class'].replace( _reAnySlash, '/' ) + '/' : '' ) +
					symbol.name.replace( _reAnySlash, '/' );
			return ret;
		},

		makeSymbolName: function ( ns, name ) {
			if ( ns == '<global>' ) {
				return name;
			}
			return ns + '\\' + name;
		},

		// the reverse of makeSymbolUrl()
		getSymbolContextFromUrl: function ( url ) {

			var ret = new DocBlockViewer.SymbolContext();
			var path = url.substr( 1 );

			if ( path.length == 0 || path == 'intro' ) {
				ret.HasContents = false;
				ret.ContentsSymbol = 'page/intro.jsonp';
				ret.File = 'intro.jsonp';
				return ret;
			}
			
			var i = path.indexOf( '/' );
			
			var type = path.substr( 0, i );
			ret.Type = type;

			function makeNs ( name ) {
				var ins = name.lastIndexOf( '\\' );
				if ( ins > 0 ) {
					return name.substr( 0, ins );
				}
				else {
					return '<global>';
				}
			}

			// class/Namespaced/ClassName
			// trait/Namespaced/TraitName
			// interface/Namespaced/ClassName
			if ( type == 'class' || type == 'interface' || type == 'trait' ) {
				ret.HasContents = true;
				ret.ContentsSymbol = path.substr( i + 1 ).replace( _reAnySlash, '\\' );
				ret.Symbol = ret.ContentsSymbol;
				ret.Ns = makeNs( ret.Symbol );
				type = 'class';
			}
			// method/Namespaced/ClassName/MethodName
			// var/Namespaced/ClassName/PropertyName
			// const/Namespaced/ClassName/ConstName
			else if ( type == 'method' || type == 'var' || type == 'const' ) {
				var ii = path.lastIndexOf( '/' );
				ret.HasContents = true;
				ret.ContentsSymbol = path.substring( i + 1, ii ).replace( _reAnySlash, '\\' );
				ret.Ns = makeNs( ret.ContentsSymbol );
				ret.Symbol = path.substr( ii + 1 );
				ret.IsMember = true;
			}
			// file/some_file.php
			else if ( type == 'file' ) {
				ret.Symbol = path.substr( i + 1 );
			}
			// function/GlobalFunctionName
			else if ( type == 'function' ) {
				ret.Symbol = path.substr( i + 1 ).replace( _reAnySlash, '\\' );
				ret.Ns = makeNs( ret.Symbol );
			}

			
			if ( type == 'var' ) {
				ret.SymbolPretty = '$' + ret.Symbol;
			}
			else if ( type == 'method' || type == 'function' ) {
				ret.SymbolPretty = ret.Symbol + '()';
			}

			if ( type == 'method' || type == 'var' || type == 'const' ) {
				ret.File = 'class_' + ret.ContentsSymbol.replace( _reAnySlash, '.' ) + '.jsonp';
			}
			else {
				ret.File = type + '_' + path.substr( i + 1 ).replace( _reAnySlash, '.' ) + '.jsonp';
			}

			return ret;
		}
	} );


	exports.DocBlockViewer.Lang.Php = Php;

})(this);