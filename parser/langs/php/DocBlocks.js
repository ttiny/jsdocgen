"use strict";

var DocBlockParser = require( '../../DocBlockParser.js' );
var Re = require( './RegExes.js' );
var FactorySymbols = require( './FactorySymbols.js' );

var _reSee = /{@see (.+?)}/g;
var _reBackSlash = /\\/g;

//some functions for PhpParser related to parsing docblocks, outsourced here for compactness
module.exports = {

	findClassMembers: function ( classname, blocks ) {
		var ret = {
			method: [],
			var: [],
			const: []
		};

		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var def = block.def;
			if ( def !== undefined && def.class == classname && ( def.type == 'method' || def.type == 'var' || def.type == 'const' ) ) {
				ret[ def.type ].push( block );
			}
		}

		for ( var key in ret ) {
			ret[key] = ret[key].sort( function ( a, b ) { 
				var aa = a.def;
				var bb = b.def;

				// static first
				if ( aa.static ) {
					if ( !bb.static ) {
						return -1;
					}
				}
				else if ( bb.static ) {
					return 1;
				}

				// protected last
				if ( aa.access == 'protected' ) {
					if ( bb.access != 'protected' ) {
						return 1;
					}
				}
				else if ( bb.access == 'protected' ) {
					return -1;
				}

				// magic first
				if ( aa.name.substr( 0, 2 ) == '__' ) {
					if ( bb.name.substr( 0, 2 ) != '__' ) {
						return -1;
					}
				}
				else if ( bb.name.substr( 0, 2 ) == '__' ) {
					return 1;
				}
				
				return aa.name.localeCompare( bb.name );
			} );
		}

		//build indices
		for ( var key in ret ) {
			var members = ret[key];
			members.index = {};
			for ( var i = members.length - 1; i >= 0; --i ) {
				var symbol = members[i];
				members.index[ symbol.def.name ] = i;
			}
		}

		return ret;
	},

	//the namespace part of a class or function
	getNameSpace: function ( name ) {
		var name = name.splitLast( '\\' );
		if ( name.left.charAt( 0 ) == '\\' ) {
			name.left = name.left.substr( 1 );
		}
		if ( name.right ) {
			return {
				ns: name.left,
				name: name.right
			};
		}
		else {
			return {
				ns: undefined,
				name: name.left
			};
		}
	},

	resolveTypeNameVsClass: function ( name, classcontext, ignoreindex ) {
		var ns = this.getNameSpace( classcontext );
		return this.resolveTypeNameVsNamespace( name, ns.ns, ignoreindex );
	},

	//resolves a posibly relative type name in relation to given name space
	//return the resolved name or null if it can not be resolved
	resolveTypeNameVsNamespace: function ( name, ns, ignoreindex ) {
		var newname;
		if ( name.charAt( 0 ) == '\\' ) {
			newname = name.substr( 0 );
		}
		else {
			newname = ns ? ( ns + '\\' ) + name : name;
		}

		if ( ignoreindex ) {
			return newname;
		}
		else {
			return this.getIndexedClass( newname ) ? newname : undefined;
		}
	},

	//retrieves a file from index
	getIndexedFile: function ( file ) {
		return this._index.file[ file ];
	},

	//retrieves a class from index
	getIndexedClass: function ( cls ) {
		return this._index.class[ cls ];
	},

	//retrieves a function from index
	getIndexedFunction: function ( func ) {
		return this._index.function[ func ];
	},

	//retrieves a method
	getIndexedMethod: function ( cls, method ) {
		var cls = this._index.class[ cls ];
		if ( cls ) {
			var i = cls.members.method.index[ method ];
			if ( i >= 0 ) {
				return cls.members.method[i];
			}
		}
		return undefined;
	},

	//retrieves a const
	getIndexedConst: function ( cls, constant ) {
		var cls = this._index.class[ cls ];
		if ( cls ) {
			var i = cls.members.const.index[ constant ];
			if ( i >= 0 ) {
				return cls.members.const[i];
			}
		}
		return undefined;
	},

	//retrieves a property
	getIndexedVar: function ( cls, prop ) {
		var cls = this._index.class[ cls ];
		if ( cls ) {
			var i = cls.members.var.index[ prop ];
			if ( i >= 0 ) {
				return cls.members.var[i];
			}
		}
		return undefined;
	},

	primitiveTypes: {
		'int': true,
		'float': true,
		'string': true,
		'bool': true,
		'null': true,
		'$this': true,
		'function': true,
		'callback': true,
		'mixed': true
	},

	//coverts from ns\name to class/ns/name or php:classname
	classNameToLink: function ( name ) {

		if ( !name || this.primitiveTypes[name] !== undefined ) {
			return undefined;
		}

		//if the name is not in the index use the orgiinal name and check again
		var cls = this.getIndexedClass( name );
		if ( cls ) {
			return cls.def.type + '/' + name.replace( _reBackSlash, '/' );
		}
		else if ( FactorySymbols.types[name] !== undefined ) {
			return 'php:class/' + name.replace( _reBackSlash, '/' );
		}
		
		return undefined;
	},

	//resolves the types of @param @var and @return to full name as they could be relative to their ns
	//needs class index
	resolveDefTypes: function ( blocks ) {

		var that = this;
		var _reTagTypeSeparator = /[ \n\t]/;

		function splitArguments ( def ) {
			var args = [];
			var reArgs = new RegExp( Re.strFunArgument2( true, true ), 'g' );
			var m;
			var i = 0;
			var argstxt = def.args;
			while ( m = reArgs.exec( argstxt ) ) {
				args.push( {
					name: m[1],
					vartype: m[2],
					value: m[3] ? JSON.parse( '"' + m[3] + '"' ) : m[3],
					byref: m[0].charAt( 0 ) == '&'
				} );
			}
			def.args = args;
		}
		
		//parse type[]|type\asd and resolve types names which could be relative to their ns
		function parseParam ( param, def, block ) {
			var param = param.splitFirst( _reTagTypeSeparator );
			def.description = param.right;

			var types = param.left.split( '|' );
			for ( var i = types.length - 1; i >= 0; --i ) {
				//turn phpish syntax into our own
				if ( types[i] == 'array' ) {
					types[i] = 'mixed[]';
				}
				//get the name wo array suffix
				var t = types[i].splitFirst( '[' );
				var name = that.resolveTypeNameVsClass( t.left, block.def.class || block.def.name ) || t.left;
				var link = that.classNameToLink( name );

				types[i] = {
					name: types[i],
					link: that.classNameToLink( name )
				};
			}
			def.vartype = types;
		}


		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var tags = block.tags;
			var def = block.def;

			//todo: warn if the number of args is different than the number of params
			if ( def.args ) {

				//split arguments for funcs and methods
				splitArguments( def );

				var args = def.args;
				var params = tags.param;
				for ( var j = 0, jend = args.length; j < jend; ++j ) {
					var arg = args[j];
					var param = params && params.length > j ? params[j] : undefined;
					if ( arg.vartype ) {
						parseParam( arg.vartype, arg, block );
						arg.description = param;
						//arg.vartype = [ { name: arg.vartype == 'array' ? 'mixed[]' : arg.vartype, link: this.classNameToLink( arg.vartype ) } ];
					}
					else if ( param ) {
						parseParam( param, arg, block );
					}
				}
				delete tags.param;
			}

			if ( def.return && tags.return ) {
				if ( def.return.vartype ) {
					def.return.description = tags.return;
				}
				else {
					parseParam( tags.return, def.return, block );
				}
				delete tags.return;
			}

			if ( def.type == 'var' || def.type == 'constant' ) {
				
				if ( tags.var ) {
					if ( def.vartype ) {
						def.description = tags.var;
					}
					else {
						parseParam( tags.var, def, block );
					}
					if ( block.summary === undefined ) {
						block.summary = def.description;
						delete def.description;
					}
					delete tags.var;
				}

				if ( def.value ) {
					//fix newlines
					def.value = JSON.parse( '"' + def.value + '"' );
				}

			}

			//and throws to
			if ( tags.throws ) {
				for ( var j = tags.throws.length - 1; j >= 0; --j ) {
					var th = {};
					parseParam( tags.throws[j], th, block );
					tags.throws[j] = th;
				}
			}
		}
	},


	populateClassHierarchy: function ( blocks ) {
		var that = this;
		var index = this._index;

		function splitClassList ( text ) {
			text = text.split( ',' );
			for ( var i = 0, iend = text.length; i < iend; ++i ) {
				var cls = { name: text[i].trim() };
				cls.link = that.classNameToLink( cls.name );
				text[i] = cls;
			}
			return text;
		}

		// populate some members that are roughly parsed
		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var def = block.def;
			var type = def.type;

			
	
			//fill class members and build class index
			if ( type == 'class' || type == 'interface' || type == 'trait' ) {

				// split lists of all classes
				if ( def.extends ) {
					def.extends = splitClassList( def.extends );
				}
				if ( def.implements ) {
					def.implements = splitClassList( def.implements );
				}
				if ( def.uses ) {
					def.uses = splitClassList( def.uses );
				}

				block.members = this.findClassMembers( def.name, blocks );
				def.derived = [];
				if ( block.tags.package === undefined ) {
					block.tags.package = index.file[ block.tags.file.name ].tags.package || this._defaultPackage;
				}

			}
			
		}


		function walkParents ( clsname, callback, arg ) {
			var cls = index.class[clsname];
			if ( cls === undefined ) {
				return 1;
			}
			cls = cls.def;
			var ret = false;
			if ( cls.extends ) {
				ret = callback( cls.extends, arg );
				if ( ret ) {
					return ret;
				}
			}
			if ( cls.implements ) {
				ret = callback( cls.implements, arg );
				if ( ret ) {
					return ret;
				}
			}
			if ( cls.uses ) {
				ret = callback( cls.uses, arg );
				if ( ret ) {
					return ret;
				}
			}
			return ret;
		}

		function Array_indexOf( arr, callback, arg ) {
			for ( var i = 0, iend = arr.length; i < iend; ++i ) {
				var ret = callback( arr[i], arg );
				if ( ret === true ) {
					return ret;
				}
			}
			return false;
		}

		function compareParent ( it, klass ) {
			if ( it.name == klass ) {
				return true;
			}
			else {
				return walkParents( it.name, checkParentTreeForClass, klass );
			}
		}

		function checkParentTreeForClass ( parents, klass ) {
			return Array_indexOf( parents, compareParent, klass );
		}


		//try to detect if class inherits directly from parents or indirectly... could be wrong but unlikelikely
		function checkParents ( parents ) {
			for ( var i = 0, iend = parents.length; i < iend; ++i ) {
				var p = parents[i];
				var notfound = true;
				for ( var j = 0, jend = parents.length; j < jend; ++j ) {
					var p1 = parents[j];
					if ( p.name == p1.name ) {
						continue;
					}
					if ( walkParents( p1.name, checkParentTreeForClass, p.name ) ) {
						notfound = false;
						break;
					}
				}
				if ( notfound ) {
					p.direct = true;
				}
			}
			return false;
		}

		for ( var key in index.class ) {
			walkParents( key, checkParents, key );
		}
		//// end try to


		// find derived classes
		function isDirect ( parents, klass ) {
			for ( var i = 0, iend = parents.length; i < iend; ++i ) {
				var p = parents[i];
				if ( p.direct && p.name == klass ) {
					return true;
				}
			}
			return false;
		}

		for ( var key in index.class ) {
			var cls = index.class[key].def;
			for ( var key2 in index.class ) {
				if ( key == key2 ) {
					continue;
				}
				//does cls2 derives from cls
				if ( walkParents( key2, checkParentTreeForClass, key ) === true ) {
					var ret = { name: key2, link: this.classNameToLink( key2 ) };
					//reverse check again if it is direct, but we already have this info so just walk parents once, no recusion
					if ( walkParents( key2, isDirect, key ) ) {
						ret.direct = true;
					}
					cls.derived.push( ret );
				}
			}
		}
	},


	buildInternalIndex: function ( blocks ) {
		var index = { class: {}, file: {}, function: {} };

		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];
			var def = block.def;
			var type = def.type;

			//build file/function index
			if ( type == 'file' || type == 'function' ) {
				index[ type ][ def.name ] = block;
			}

			//fill class members and build class index
			else if ( type == 'class' || type == 'interface' || type == 'trait' ) {				
				index.class[ def.name ] = block;
			}
			
		}

		this._index = index;
	},

	findAutoInheritTarget: function ( block, checklist ) {

		checklist = checklist || {};

		var def = block.def;
		var type = def.type;
		//only for class members
		if ( type != 'method' && type != 'var' && type != 'const' ) {
			return undefined;
		}
		//not for magic methods
		if ( type == 'method' && def.name.startsWith( '__' ) ) {
			return undefined;
		}

		//check for circular autoinherit
		var id = type + '/' + def.class  + '/' + def.name;
		if ( checklist[id] ) {
			return undefined;
		}
		checklist[id] = true;

		var declared = block.tags.declared;
		var cls = this.getIndexedClass( def.class );
		var lookup = 'getIndexed' + def.type.charAt( 0 ).toUpperCase() + def.type.substr( 1 );

		// try in the interfaces first
		if ( cls.def.implements ) {
			for ( var i = cls.def.implements.length - 1; i >= 0; --i ) {
				var iface = this[lookup]( cls.def.implements[i].name, def.name );
				if ( iface ) {
					if ( iface.tags.autoinheritdoc === true ) {
						return this.findAutoInheritTarget( iface, checklist );
					}
					return iface;
				}
			}
		}

		//try in the parent class next but only if different from where the method is declared
		if ( cls.def.extends && cls.def.extends[0] !== declared ) {
			var extended = this[lookup]( cls.def.extends[0].name, def.name );
			if ( extended ) {
				if ( extended.tags.autoinheritdoc === true ) {
					return this.findAutoInheritTarget( extended, checklist );
				}
				return extended;
			}
		}
		

		return undefined;
	},

	autoInheritDocs: function ( blocks ) {
		for ( var i = blocks.length - 1; i >= 0; --i ) {
			var block = blocks[i];

			//look for block with @autoinherit tag
			if ( block.tags.autoinheritdoc !== true ) {
				continue;
			}

			var inherit = this.findAutoInheritTarget( block );
			if ( inherit ) {

				if ( this._autoNotices ) {
					console.log( '\nAUTO NOTICE:' );
					console.log( 
						'Inherted documentation' +
						'\n  for element ' + DocBlockParser.formatElement( block ) +
						'\n  in file ' + DocBlockParser.formatFile( block ) +
						'\n  from element ' + DocBlockParser.formatElement( inherit ) +
						'\n  in file ' + DocBlockParser.formatFile( inherit )
					);
				}

				block.summary = inherit.summary;
				block.description = inherit.description;
				block.tags.autoinheritdoc = { 
					name: inherit.def.class,
					link: this.classNameToLink( inherit.def.class )
				};
				block.def.args = inherit.def.args;
				block.def.return = inherit.def.return;
				block.def.vartype = inherit.def.vartype;
				block.def.description = inherit.def.description;
			}
		}
	},

	//performs additional parsing
	postProcessDocBlocks: function ( blocks ) {

		
		this.buildInternalIndex( blocks );
		this.populateClassHierarchy( blocks );
		this.resolveDefTypes( blocks );

		if ( this._autoInherit ) {
			this.autoInheritDocs( blocks );
		}

		//parse descriptions
		for ( var i = blocks.length - 1; i >= 0; --i ) {
			this.renderDescriptions( blocks[i] );
		}
		
	},

	renderDescriptions: function ( block ) {

		var index = this._index;

		var tags = block.tags;
		var def = block.def;

		if ( block.summary ) {
			block.summary = this.parseDescription( block.summary, block );
		}
		if ( block.description ) {
			block.description = this.parseDescription( block.description, block );
		}
		if ( tags.deprecated && tags.deprecated.description ) {
			tags.deprecated.description = this.parseDescription( tags.deprecated.description, block );
		}

		var that = this;
		[ 'todo', 'author', 'license', 'copyright' ].forEach( function ( key ) {
			if ( tags[key] !== undefined ) {
				var list = tags[key];
				for ( var i = list.length - 1; i >= 0; --i ) {
					list[i] = that.parseDescription( list[i], block );
				}
			}
		} );

		if ( tags.see ) {
			var see = tags.see;
			for ( var i = see.length - 1; i >= 0; --i ) {
				var url = this.parseSeeTag( see[i], block );
				see[i] = url ? url.url : see[i];
			}
		}

		if ( def.args ) {
			var args = def.args;
			for ( var i = args.length - 1; i >= 0; --i ) {
				var arg = args[i];
				if ( arg.description ) {
					arg.description = this.parseDescription( arg.description, block );
				}
			}
		}

		if ( def.return && def.return.description ) {
			def.return.description = this.parseDescription( def.return.description, block );
		}

		if ( def.description ) {
			this.parseDescription( def.description, block );
		}

		if ( tags.inheritdoc ) {
			if ( !block.summary ) {
				block.summary = '{@inheritdoc}';
			}
			else if ( !block.description ) {
				block.description = '{@inheritdoc}';
			}
		}
	},


	//[php:]function()
	//[php:]Class
	//[php:]Class::$property
	//[php:]Class::constant
	//[php:]Class::method()
	//file/name.php
	//http://url.com
	parseSeeTag: function ( see, block, noerror, forcestrict ) {

		forcestrict = forcestrict || this._strict;
		var foundblock = undefined;

		var index = this._index;
		var context = null;
		if ( block.def.class ) {
			context = index.class[block.def.class]
		}
		else if ( block.members !== undefined ) {
			context = block;
		}
		var asee = see;

		var isphp = false;
		if ( see.substr( 0, 4 ) == 'php:' ) {
			see = see.substr( 4 );
			isphp = true;
		}

		var idesc = see.indexOf( ' ' );
		var desc = see;
		if ( idesc > 0 ) {
			desc = see.substr( idesc + 1 );
			see = see.substr( 0, idesc );
		}

		var cls = '';
		var type = null;
		
		//class:method()
		//class::$property
		//class::constant
		var iclass = see.indexOf( '::' );
		if ( iclass > 0 ) {
			cls = see.substr( 0, iclass );
			
			if ( cls.charAt( 0 ) == '\\' ) {
				cls = cls.substr( 1 );
			}
			else if ( context ) {
				cls = this.resolveTypeNameVsClass( cls, context.def.name ) || cls;
			}

			see = see.substr( iclass + 2 );
			//$property
			if ( see.charAt( 0 ) == '$' ) {
				see = see.substr( 1 );
				if ( isphp || ( foundblock = this.getIndexedVar( cls, see ) ) ) {
					type = 'var';
				}
			}
			//method()
			else if ( see.substr( see.length - 2 ) == '()' ) {
				see = see.substring( see, see.length - 2 );
				if ( isphp || ( foundblock = this.getIndexedMethod( cls, see ) ) ) {
					type = 'method';
				}
			}
			else if ( isphp || ( foundblock = this.getIndexedConst( cls, see ) ) ) {
				type = 'const';
			}

			cls = cls.replace( _reBackSlash, '/' ) + '/'
		}
		else {
			//link like http://
			if ( see.indexOf( '://' ) > 0 ) {
				type = 'url';
			}
			//function()
			else if ( see.substr( see.length - 2 ) == '()' ) {
				see = see.substring( see, see.length - 2 );
				if ( context && ( foundblock = this.getIndexedMethod( context.def.name, see ) ) ) {
					type = 'method';
					cls = context.def.name.replace( _reBackSlash, '/' ) + '/';
				}
				else {
					if ( !isphp && FactorySymbols.functions[see] !== undefined ) {
						isphp = true;
					}
					//todo: check for the function in the current namespace and then in the global namespace
					type = isphp || ( foundblock = this.getIndexedFunction( see ) ) ? 'function' : null
				}
			}
			else {

				//property in the current class
				if ( see.charAt( 0 ) == '$' ) {
					see = see.substr( 1 );
					if ( context && ( foundblock = this.getIndexedVar( context.def.name, see ) ) ) {
						cls = context.def.name.replace( _reBackSlash, '/' ) + '/';
						type = 'var';
					}
					
				}
				//constant in the current class
				else if ( context && ( foundblock = this.getIndexedConst( context.def.name, see ) ) ) {
					cls = context.def.name.replace( _reBackSlash, '/' ) + '/';
					type = 'const';
				}
				//file
				else if ( foundblock = this.getIndexedFile( see ) ) {
					type = 'file';
				}
				//assume class
				else {

					//check if it is in the current ns
					if ( context && see.charAt( 0 ) != '\\' ) {

						var newsee = this.resolveTypeNameVsClass( see, context.def.name );
						if ( newsee ) {
							see = newsee;
							type = (foundblock = this.getIndexedClass( newsee )).def.type;
						}
					}

					//check global namespace
					if ( type === null ) {

						if ( see.charAt( 0 ) == '\\' ) {
							see = see.substr( 1 );
						}

						if ( index.class[ see ] !== undefined ) {
							type = ( foundblock = this.getIndexedClass( see ) ).def.type;
						}

						//finally check php builtin class
						else if ( !isphp && FactorySymbols.types[see] !== undefined ) {
							isphp = true;
							type = 'class';
						}
						//we have php: then we don't care if it is valid
						else if ( isphp ) {
							type = 'class';
						}

					}
					
					
					see = see.replace( _reBackSlash, '/' );
				}
			}
		}

		if ( type !== null ) {

			
			if ( isphp && forcestrict ) {
				if ( type == 'class' && FactorySymbols.types[see] === undefined ) {
					if ( noerror ) {
						return undefined;
					}
				 	throw new DocBlockParser.Error( block, 'Unknown PHP type "'+see+'" in @see tag "'+asee+'"' );
				}
				// this is not reliable because php_get_defined functions ommit some functions, for example mysql_* are not present
				// else if ( type == 'function' && FactorySymbols.functions[see] === undefined ) {
				// 	throw new DocBlockParser.Error( block, 'Unknown PHP function "'+see+'" in @see tag "'+asee+'"' );
				// }
			}

			return { url: ( isphp ? 'php:' : '' ) + type + '/' + cls + see + ' ' + desc, block: foundblock };
		}
		else {
			if ( noerror ) {
				return undefined;
			}
			else if ( forcestrict ) {
				throw new DocBlockParser.Error( block, 'Unable to resolve @see tag "'+asee+'"' );
			}
			else if ( this._warnings ) {
				DocBlockParser.Warning( block, 'Unable to resolve @see tag "'+asee+'"' );
			}
		}

		
	},

	parseDescription: function ( text, block ) {
		var that = this;
		var index = this._index;
		this._markdownOptions.noCodeCallback = function ( text ) {
			//parse {@see}
			text = text.replace( _reSee, function ( m, m1 ) {
				try {
					return '{@see ' + that.parseSeeTag( m1, block ).url + '}';
				}
				catch ( e ) {
					return m1;
				}
			} );

			//auto see
			if ( this._autoSee ) {
				text = text.replace( Re.autoSee, function ( m, m1, m2, m3 ) {
					//m1 matches see tags, so we don't interfere with them
					if ( m1 ) {
						return m;
					}
					//we have whitespace in some regexes
					var add = '';
					var mm = m2 || m3;
					if ( mm ) {
						add = ' ';
					}
					else {
						mm = m;
					}
					var ret = that.parseSeeTag( mm, block, true, true );
					if ( !ret || ret.block === block ) {
						return m;
					}
					if ( that._autoNotices ) {
						console.log( '\nAUTO NOTICE:' );
						console.log( 
							'Found a symbol reference "' + mm + '"' +
							'\n  for element ' + DocBlockParser.formatElement( block ) +
							'\n  in file ' + DocBlockParser.formatFile( block ) );
					}
					return add + '{@see ' + ret.url + '}';
				} );
			}
			return text;
		};
		text = DocBlockParser.prototype.parseDescription.call( this, text );
		this._markdownOptions.noCodeCallback = null;
		return text;
	}
};