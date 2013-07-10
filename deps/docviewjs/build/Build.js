"use strict";

//global.UNITESTS = true;
require( 'Unitest' );
require( 'Prototype' );
var Fs = require( 'fs' );
var Path = require( 'path' );
var Os = require( 'os' );
var ChildProcess = require( 'child_process' );
var PathUtils = require( 'PathUtils' );

//todo: these can be turned into generic #ifdefs, no need to be predefined, a single regex will do
// JavaScript building rules
// /*@UNITESTS*/ .. /*UNITESTS@*/        - .. will be removed if UNITESTS is not defined
// /*@DEBUG*/ .. /*DEBUG@*/              - .. will be removed in RELEASE builds
// /*@RELEASE*/ .. /*RELEASE@*/          - .. will be removed in DEBUG builds
// /*@*/require( .. );                   - .. will be merged in RELEASE BUILDS and the require() call will be removed
// /*@=VariableName*/                    - will be replaced with the value of predefined variable VariableName
// /*@=?VariableName:OtherVar|string*/   - will be raplaced with the value of VariableName if it has value, otherwise with OtherVar or string (in JS format)
// /*@?VariableName*/anything/*@:else*/  - if variable name is defined will be replaed with 'anything', otherwise with 'else'.

function Build ( options ) {
	this._UNITESTS = options.UNITESTS;
	this._DEBUG = !options.RELEASE;
	this._RELEASE = !options.DEBUG;
	this._importPaths = options.ImportPaths;
	if ( !this._importPaths ) {
		var paths = ( process.env.NODE_PATH || './node_modules' ).split( Os.platform() == 'win32' ? ';' : ':' );
		for ( var i = paths.length - 1; i >= 0; --i ) {
			paths[i] = Path.resolve( paths[i] );
		}
		this._importPaths = paths;
	}
	this._definitions = options.Definitions || {};
	this._definitions.UNITESTS = this._UNITESTS;
	this._definitions.DEBUG = this._DEBUG;
	this._definitions.RELEASE = this._RELEASE;
}

var STR_RE_STRING1 = '"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"';
var STR_RE_STRING2 = "'([^'\\\\]*(?:\\\\.[^'\\\\]*)*)'";
var STR_RE_REQUIRE = '/\\*@\\*/require\\(\\s*(?:'+STR_RE_STRING1+'|'+STR_RE_STRING2+')\\s*\\);?';
var RE_REQUIRE = new RegExp( STR_RE_REQUIRE, 'gm' );
var RE_UNITESTS = /(?:\/\*@UNITESTS\*\/([\s\S]*?)\/\*UNITESTS@\*\/)/gm;
var RE_UNITESTS_HTML = /(?:<!--@UNITESTS-->([\s\S]*?)<!--UNITESTS@-->)/gm;
var RE_DEBUG = /(?:\/\*@DEBUG\*\/([\s\S]*?)\/\*DEBUG@\*\/)/gm;
var RE_DEBUG_HTML = /(?:<!--@DEBUG-->([\s\S]*?)<!--DEBUG@-->)/gm;
var RE_RELEASE = /(?:\/\*@RELEASE\*\/([\s\S]*?)\/\*RELEASE@\*\/)/gm;
var RE_RELEASE_HTML = /(?:<!--@RELEASE-->([\s\S]*?)<!--RELEASE@-->)/gm;
var RE_CONDITIONAL = /(?:\/\*@\?([^\s]+?)\*\/([\s\S]*?)\/\*@:([\s\S]*?)\*\/)/gm;
var RE_CONDITIONAL_HTML = /(?:<!--@\?([^\s]+?)-->([\s\S]*?)<!--@:([\s\S]*?)-->)/gm;
var RE_VAR = /(?:\/\*@=([^\?][^\s]*?)\*\/)/gm;
var RE_VAR_HTML = /(?:<!--@=([^\?][^\s]*?)-->)/gm;
var STR_CONDITIONAL_VAR = '(?:/\\*@=\\?([^:]+?):(?:'+STR_RE_STRING1+'|'+STR_RE_STRING2+'|([^\\s]+?))?\\*/)';
var STR_CONDITIONAL_VAR_HTML = '(?:<!--@=\\?([^s:]+?):(?:'+STR_RE_STRING1+'|'+STR_RE_STRING2+'|([^\\s]+?))?-->)';
var RE_CONDITIONAL_VAR = new RegExp( STR_CONDITIONAL_VAR, 'gm' );
var RE_CONDITIONAL_VAR_HTML = new RegExp( STR_CONDITIONAL_VAR_HTML, 'gm' );
var RE_TEMPLATE1 = /<script[^>]*\stype\s*=\s*(['"])template\/docviewjs\1[^>]*\sid\s*=\s*(['"])([^>]*?)\2[^>]*>([\s\S]*?)<\/script>/gm;
var RE_TEMPLATE2 = /<script[^>]*\sid\s*=\s*(['"])([^>]*?)\1[^>]*\stype\s*=\s*(['"])template\/docviewjs\3[^>]*>([\s\S]*?)<\/script>/gm;

var _unique = 0;


Build.define( {

	//preprocess string in 'js' or 'html' mode
	preprocessString: function ( text, mode ) {
		var that = this;
		if ( mode != 'js' ) {
			if ( !this._UNITESTS ) {
				text = text.replace( RE_UNITESTS_HTML, '' );
			}
			if ( !this._DEBUG ) {
				text = text.replace( RE_DEBUG_HTML, '' );
			}
			if ( !this._RELEASE ) {
				text = text.replace( RE_RELEASE_HTML, '' );
			}
			text = text.replace( RE_CONDITIONAL_HTML, function ( m, var1, yes, no ) {
				return !that._definitions[ var1 ] ? no : yes;
			} );
			text = text.replace( RE_VAR_HTML, function ( m, var1 ) {
				return that._definitions[ var1 ] || '';
			} );
			text = text.replace( RE_CONDITIONAL_VAR_HTML, function ( m, var1, str1, str2, var2 ) {
				return that._definitions[ var1 ] ? that._definitions[ var1 ] : ( str1 || str2 || that._definitions[ var2 ] || '' );
			} );
		}

		if ( !this._UNITESTS ) {
			text = text.replace( RE_UNITESTS, '' );
		}
		if ( !this._DEBUG ) {
			text = text.replace( RE_DEBUG, '' );
		}
		if ( !this._RELEASE ) {
			text = text.replace( RE_RELEASE, '' );
		}
		text = text.replace( RE_CONDITIONAL, function ( m, var1, yes, no ) {
			return !that._definitions[ var1 ] ? no : yes;
		} );
		text = text.replace( RE_VAR, function ( m, var1 ) {
			return that._definitions[ var1 ] || '';
		} );
		text = text.replace( RE_CONDITIONAL_VAR, function ( m, var1, str1, str2, var2 ) {
			return that._definitions[ var1 ] ? that._definitions[ var1 ] : ( str1 || str2 || that._definitions[ var2 ] || '' );
		} );

		return text;
	},

	//extract /*@*/require( .. );
	_extractJsRequires: function ( text ) {
		//check defines because require could be inside them
		text = this.preprocessString( text, 'js' );
		var requires = [];
		text = text.replace( RE_REQUIRE, function ( m, m1, m2 ) {
			requires.push( m1 || m2 );
			return '';
		} );
		return { requires: requires, text: text };
	},

	//resolves require() using predefined module paths
	_resolveRequirePath: function ( require, file ) {
		if ( require.charAt( 0 ) == '.' ) {
			return Path.resolve( Path.dirname( file ) + '/' + require );
		}
		else {
			require = require.splitFirst( '/' );
			for ( var i = 0, iend = this._importPaths.length; i < iend; ++i ) {
				var path = this._importPaths[i];
				var reqpath = path + '/' + require.left;
				if ( Fs.existsSync( reqpath ) && Fs.statSync( reqpath ).isDirectory() ) {
					if ( require.right ) {
						reqpath += '/' + require.right + ( Path.extname( require.right ) == '' ? '.js' : '' );
					}
					else {
						reqpath += '/' + require.left + '.js';
					}
					if ( Fs.existsSync( reqpath ) && Fs.statSync( reqpath ).isFile() ) {
						return Path.resolve( reqpath );
					}
				}
			}
			return undefined;
		}
	},

	//loads /*@*/require( .. ); clauses recusively
	_resolveJsImports: function( file, checklist ) {
		checklist = checklist || {};

		var fullpath = Path.resolve( file );
		if ( checklist[ fullpath ] ) {
			return false;
		}
		checklist[ fullpath ] = true;

		var text = Fs.readFileSync( file, 'UTF-8' );
		var requires = this._extractJsRequires( text );
		var imports = [];
		for ( var i = 0, iend = requires.requires.length; i < iend; ++i ) {
			var resolved = this._resolveRequirePath( requires.requires[i], fullpath );
			if ( !resolved ) {
				console.error( '\nERROR:\nUnable to resolve import "' + requires.requires[i] + '" in file ' + fullpath );
				process.exit( 1 );
			}
			var subimports = this._resolveJsImports( resolved, checklist );
			if ( subimports ) {
				imports = imports.concat( subimports );
			}
		}

		imports.push( {
			file: fullpath,
			text: requires.text
		} );
		
		return imports;
	},


	/**
	@def function Build.preprocessFile( options:Build.PreprocessOptions )
	*/
	/**
	@def object Build.PreprocessOptions {
		Input:string,
		Output:string,
		Mode:string|undefined
	}
	*/
	preprocessFile: function ( options ) {
		var mode = options.Mode || Path.extname( options.Input ).substr( 1 );
		var text = Fs.readFileSync( options.Input, 'UTF-8' );
		text = this.preprocessString( text, mode )
		Fs.writeFileSync( options.Output, text );
	},


	/**
	@def function Build.buildJs( options:Build.BuildJsOptions )
	*/
	/**
	@def object Build.BuildJsOptions {
		Input:string|string[],
		Output:string,
		DevOutput:string|undefined
	}
	*/
		//SourceMap:string|undefined,
	buildJs: function ( options, callback ) {
		

		options.Input = options.Input instanceof Array ? options.Input : [ options.Input ]
		var imports = [];
		for ( var i = 0, iend = options.Input.length; i < iend; ++i ) {
			var input = options.Input[i];
			imports = imports.concat( this._resolveJsImports( input ) );
		}

		if ( options.DevOutput ) {
			var dev = Fs.openSync( options.DevOutput, 'w' );
			var devdir = Path.dirname( Path.resolve( options.DevOutput ) );
			Fs.writeSync( dev, '"use strict";\n' );
			Fs.writeSync( dev, 'if ( window.require === undefined ) { window.require = function () {}; }\n' );
			Fs.writeSync( dev, 'if ( window.DOCVIEWJS_LOCATION === undefined ) { window.DOCVIEWJS_LOCATION = ""; }\n\n' );
			var RE_SLASH = /\\/g;
			for ( var i = 0, iend = imports.length; i < iend; ++i ) {
				var file = imports[i];
				Fs.writeSync( dev, 'document.write( \'<script src="\'+DOCVIEWJS_LOCATION+\'' + Path.relative( devdir, file.file ).replace( RE_SLASH, '/' ) + '"></script>\\n\' );\n' );
			}
			Fs.closeSync( dev );
		}

		if ( options.Output ) {
			//var tmpdir = __dirname + '/tmp';
			var tmpdir = Os.tmpdir();
			var tmpfn = tmpdir + '/docviewjs_build'+(++_unique)+'.js';
			var tmp = Fs.openSync( tmpfn, 'w' );
			for ( var i = 0, iend = imports.length; i < iend; ++i ) {
				var file = imports[i];
				Fs.writeSync( tmp, '/* start of ' + file.file + ' */\n' );
				Fs.writeSync( tmp, file.text );
				Fs.writeSync( tmp, '\n/* end of ' + file.file + ' */\n' );
			}
			Fs.closeSync( tmp );

			// clojure tries to be too smart and breaks code so using yuicompressor
			var done = function ( err, stdout, stderr ) {
				if ( err ) {
					console.log();
					console.error( stderr );
					process.exit( 1 );
				}
				else {
					Fs.unlinkSync( tmpfn );
					if ( callback ) {
						callback();
					}
				}
			}

			var Compressor = require( 'yuicompressor' );
			Compressor.compress( tmpfn, {
				charset: 'utf8',
				type: 'js',
				'line-break': 80
			}, function( err, stdout, stderr ) {
				if ( !err ) {
					Fs.writeFileSync( options.Output, stdout, 'UTF-8' );
				}
				else {
					console.log( 'JS input: ' + tmpfn );
				}
				done ( err, stdout, stderr );
			} );
			
		}
		else {
			if ( callback ) {
				callback();
			}
		}

	},


	/**
	@def function Build.buildLess( options:Build.BuildLessOptions )
	*/
	/**
	@def object Build.BuildLessOptions {
		Input:string,
		Output:string
	}
	*/
	buildLess: function ( options, callback ) {
		var Less = require( 'less' );
		var fullpath = Path.resolve( options.Input );
		var parser = new Less.Parser( {
			paths: [ Path.dirname( fullpath ) ],
			filename: Path.basename( fullpath )
		} );

		var compress = this._RELEASE || false;

		parser.parse( Fs.readFileSync( fullpath, 'UTF-8' ), function ( err, tree ) {
			if ( err ) {
				console.log( '\nError while parsing ' + fullpath );
				console.error( err );
				process.exit( 1 );
			}
			Fs.writeFileSync( options.Output, tree.toCSS( { compress: compress } ), 'UTF-8' );
			if ( callback ) {
				callback();
			}
		} );
	},

	/**
	@def function Build.buildTemplates( options:Build.BuildTemplatesOptions )
	*/
	/**
	@def object Build.BuildTemplatesOptions {
		Input:string,
		Output:string
	}
	*/
	buildTemplates: function ( options ) {

		var t = global.DEBUG;
		global.DEBUG = this._DEBUG;

		var tt = require( __dirname + '/../src/view/TextTemplate.js' );

		var text = Fs.readFileSync( options.Input, 'UTF-8' );
		text = this.preprocessString( text, 'html' );
		var m;
		var templates = {};
		while ( m = RE_TEMPLATE1.exec( text ) ) {
			var id = m[3];
			var tmpl = m[4];
			templates[id] = new tt.TextTemplate( tmpl ).getSource();
		}
		while ( m = RE_TEMPLATE2.exec( text ) ) {
			var id = m[2];
			var tmpl = m[4];
			templates[id] = new tt.TextTemplate( tmpl ).getSource();
		}

		var out = Fs.openSync( options.Output, 'w' );
		Fs.writeSync( out, '"use strict";\n' );
		for ( var id in templates ) {
			var tmpl = templates[id];
			Fs.writeSync( out, 'TextTemplate.Cache[ '+JSON.stringify( id )+' ] = '+JSON.stringify( tmpl )+';\n' );
		}
		Fs.closeSync( out );

		global.DEBUG = t;
	},

	_copyFile: function ( src, dst ) {
		PathUtils.createDir( Path.dirname( dst ) );
		Fs.createReadStream( src ).pipe( Fs.createWriteStream( dst ) );
	},

	/**
	@def function Build.buildRules( options:Build.BuildRulesOptions )
	*/
	/**
	@def object Build.BuildRulesOptions {
		Input:string,
		OutputDir:string
	}
	*/
	buildRules: function ( options, checklist ) {

		checklist = checklist || {};

		var input = Path.resolve( options.Input );

		if ( checklist[input] ) {
			return false;
		}
		checklist[input] = true;

		var outdir = Path.resolve( options.OutputDir );
		var indir = Path.dirname( input );

		var props = JSON.parse( Fs.readFileSync( input, 'UTF-8' ) );
		if ( props.require ) {
			for ( var i = 0, iend = props.require.length; i < iend; ++i ) {
				var require = props.require[i];
				this.buildRules(
					{
						Input: Path.resolve( indir + '/' + require ),
						OutputDir: outdir
					},
					checklist
				);
			}
		}
		if ( props.copy ) {
			for ( var i in props.copy ) {
				var dest = props.copy[i];
				var src = i;
				this._copyFile( indir + '/' + i, outdir + '/' + props.copy[i] );
			}
		}
	},


	/**
	@def function Build.buildTheme( options:Build.BuildThemeOptions )
	*/
	/**
	@def object Build.BuildThemeOptions {
		Name:string,
		InputDir:string,
		OutputDir:string,
		CreateOutputDir:bool = "true",
		DevVersion:bool = "false",
		ThemeJs:string = "theme.js",
		ThemeLess:string = "theme.less",
		ThemeTemplates:string = "theme.html",
		ThemeRules:string = "theme.json"
	}
	*/
	buildTheme: function ( options, callback ) {
		var defs = {
			CreateOutputDir: true,
			ThemeJs: 'theme.js',
			ThemeLess: 'theme.less',
			ThemeTemplates: 'theme.html',
			ThemeRules: 'theme.json'
		};
		options = defs.merge( options );

		var outdir = Path.resolve( options.OutputDir );
		var indir = Path.resolve( options.InputDir );

		if ( options.CreateOutputDir && !Fs.existsSync( outdir ) ) {
			PathUtils.createDir( outdir );
		}

		var input = indir + '/' + options.ThemeTemplates;
		var outtmpl;
		if ( Fs.existsSync( input ) ) {
			outtmpl = outdir + '/' + options.Name + '-templates.js';
			this.buildTemplates( {
				Input: input,
				Output: outtmpl
			} );
		}


		var lock = 1;
		function done () {
			if ( --lock == 0 && callback ) {
				callback();
			}
		}

		var input = indir + '/' + options.ThemeLess;
		if ( Fs.existsSync( input ) ) {
			++lock;
			this.buildLess( {
				Input: input,
				Output: outdir + '/' + options.Name + '.css'
			}, done );
		}

		var input = indir + '/' + options.ThemeJs;
		if ( Fs.existsSync( input ) ) {
			++lock;
			var jsopts = {
				Input: ( outtmpl && !options.DevVersion ) ? [ input, outtmpl ] : input
			};
			jsopts[ options.DevVersion ? 'DevOutput' : 'Output' ] = outdir + '/' + options.Name + '.js';
			this.buildJs( jsopts, function ( err ) {
				if ( outtmpl ) {
					Fs.unlinkSync( outtmpl )
				}
				done();
			} );

		}

		var input = indir + '/' + options.ThemeRules;
		if ( Fs.existsSync( input ) ) {
			this.buildRules( {
				Input: input,
				OutputDir: outdir
			} );

		}

		done();

	}
} );



Unitest( 'Build.*', function () {


	//test( RE_TEMPLATE1.exec( '<script type="template/docviewjs" id="id.tmpl1">asd\nqwe</script>' )[3] == 'id.tmpl1' );
	test( RE_TEMPLATE1.exec( '<script type=\'template/docviewjs\' arg="123" id="id.tmpl1">qwe\nqwe</script>' )[3] == 'id.tmpl1' );
	//test( RE_TEMPLATE2.exec( '<script id="id.tmpl2" type="template/docviewjs">asd\nqwe</script>' )[2] == 'id.tmpl2' );
	test( RE_TEMPLATE2.exec( '<script arg="123" id=\'id.tmpl2\' type="template/docviewjs">asd\nqwe</script>' )[2] == 'id.tmpl2' );
	

	var build = new Build( { DEBUG: true } );
	var reqs = build._extractJsRequires( '/*@*/require( "qwe" )/*@*/require( "asd" );/*@RELEASE*//*@*/require("releasefile")/*RELEASE@*/' );
	testeqdeep( reqs.requires, [ 'qwe', 'asd' ] );



	var build = new Build( { RELEASE: true } );
	var reqs = build._extractJsRequires( '/*@*/require( "qwe" )/*@*/require( "asd" );/*@RELEASE*//*@*/require("releasefile")/*RELEASE@*/' );
	testeqdeep( reqs.requires, [ 'qwe', 'asd', 'releasefile' ] );



	var node_modules = Path.resolve( __dirname + '/../deps/node/node_modules' );
	
	var build = new Build( { ImportPaths: [ node_modules ] } );
	test( build._resolveRequirePath( './' + Path.basename( __filename ), __filename ) == __filename );
	test( build._resolveRequirePath( '../build.js', __filename ) == Path.dirname( __dirname ) + Path.sep + 'build.js' );

	test( build._resolveRequirePath( 'PathUtils', __filename ) == node_modules + Path.sep + 'PathUtils' + Path.sep + 'PathUtils.js' );
	test( build._resolveRequirePath( 'PathUtils/tests', __filename ) == node_modules + Path.sep + 'PathUtils' + Path.sep + 'tests.js' );
	test( build._resolveRequirePath( 'PathUtils/tests.js', __filename ) == node_modules + Path.sep + 'PathUtils' + Path.sep + 'tests.js' );



	var build = new Build( { ImportPaths: [ node_modules ] } );
	var imports = build._resolveJsImports( node_modules + '/Prototype/Prototype.js' );
	testeq( imports.length , 5 );
	testeq( imports[0].file , Path.resolve( node_modules + '/Prototype/Object.js' ) );
	testeq( imports[3].file , Path.resolve( node_modules + '/Prototype/Function.js' ) );
	testeq( imports[4].file , Path.resolve( node_modules + '/Prototype/Prototype.js' ) );



	var build = new Build( { ImportPaths: [ node_modules ], UNITESTS: true } );
	var imports = build._resolveJsImports( node_modules + '/Prototype/Prototype.js' );
	testeq( imports.length , 6 );
	testeq( imports[0].file , Path.resolve( node_modules + '/Unitest/Unitest.js' ) );
	testeq( imports[1].file , Path.resolve( node_modules + '/Prototype/Object.js' ) );
	testeq( imports[4].file , Path.resolve( node_modules + '/Prototype/Function.js' ) );
	testeq( imports[5].file , Path.resolve( node_modules + '/Prototype/Prototype.js' ) );
} );

module.exports = Build;