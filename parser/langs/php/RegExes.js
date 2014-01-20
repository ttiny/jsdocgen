require( 'Unitest' );

// WARNING: changing these regexes will affect the code using them in PhpParser.js, because the submatch indexes are hardcoded
// export the regexps for tests.js
// these regexes are used to parse the @def tags of doc comments
var Re = {
	strAccess 		: '(?:(public|private|protected)\\s+)',
	strFinal 		: '(?:(final)\\s+)',
	strAbstractFin 	: '(?:(final|abstract)\\s+)',
	strStatic 		: '(?:(static)\\s+)',
	strReturnType 	: '(?:(\\\\?(?:[A-Za-z_]+[A-Za-z0-9_]*)(?:\\\\[A-Za-z_]+[A-Za-z0-9_]*)*)\\s+)',
	strClassPrefix 	: '(?:(\\\\?(?:[A-Za-z_]+[A-Za-z0-9_]*)(?:\\\\[A-Za-z_]+[A-Za-z0-9_]*)*)::)',
	strFullName 	: function(nc,ns){ return '('+(!nc?'?:':'')+'\\\\?(?:[A-Za-z_]+[A-Za-z0-9_]'+(ns?'+':'*')+')(?:\\\\[A-Za-z_]+[A-Za-z0-9_]*)'+(ns?'+':'*')+')'; },
	strShortName 	: function(nc){ return '('+(!nc?'?:':'')+'[A-Za-z_]+[A-Za-z0-9_]*)'; },
	strString 		: function(nc){ return '"('+(!nc?'?:':'')+'[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"'; },
	strFileName		: '(?:[\\s^]([^\\s\\\\/:\\*\\?<>\\|"]+(?:/[^\\s\\\\/:\\*\\?<>\\|"]+)*\\.php)[\\s$])',
	strUrl 			: '[\\s^]((?:http|https)://[^\\s$]+)'
};

Re.strVarDef		= function(nc){ return Re.strShortName(nc)+'(?:\\s*:\\s*'+Re.strFullName(nc)+'(?:\\[\\])*)?(?:\\s*=\\s*'+Re.strString(nc)+')?'; },
Re.strFunArgument 	= function(nc){ return '&?\\$'+Re.strVarDef(nc); },
Re.strFunArgument2 	= function(nc,optcomma){ return '(?:\\s*,'+(optcomma?'?':'')+'\\s*'+Re.strFunArgument(nc)+')'; },
Re.strFunArguments	= function(nc){ return '\\(\\s*('+(!nc?'?:':'')+Re.strFunArgument(0)+Re.strFunArgument2(0)+'*)?\\s*\\)'; },
Re.strMethod 		= Re.strAccess+'?'+Re.strAbstractFin+'?'+Re.strStatic+'?'+Re.strReturnType+'?function\\s*(&)?'+Re.strClassPrefix+Re.strShortName(1)+'\\s*'+Re.strFunArguments(1),
Re.strFunction 		= Re.strAccess+'?'+Re.strAbstractFin+'?'+Re.strStatic+'?'+Re.strReturnType+'?(?:function|method)\\s*(&)?'+Re.strFullName(1)+'\\s*'+Re.strFunArguments(1)
Re.strClassList 	= '('+Re.strFullName(0)+'(?:\\s*,\\s*'+Re.strFullName(0)+')*)';
Re.strClass 		= Re.strAbstractFin+'?class\\s*'+Re.strFullName(1)+'(?:\\s*extends\\s*'+Re.strFullName(1)+')?'+'(?:\\s*implements\\s*'+Re.strClassList+')?'+'(?:\\s*uses\\s*'+Re.strClassList+')?';
Re.strInterface 	= 'interface\\s*'+Re.strFullName(1)+'(?:\\s*implements\\s*'+Re.strClassList+')?';
Re.strTrait 		= 'trait\\s*'+Re.strFullName(1)+'(?:\\s*uses\\s*'+Re.strClassList+')?';
Re.strClassConst 	= 'const\\s*'+Re.strClassPrefix+Re.strVarDef(1);
Re.strClassVar 		= Re.strAccess+'?'+Re.strFinal+'?'+Re.strStatic+'?var\\s*'+Re.strClassPrefix+'\\$'+Re.strVarDef(1);
Re.strFile 			= 'file (.+)';

Re.file 			= new RegExp( '^' + Re.strFile + '$' );
Re.method 			= new RegExp( '^' + Re.strMethod + '$' );
Re.function 		= new RegExp( '^' + Re.strFunction + '$' );
Re.property 		= new RegExp( '^' + Re.strClassVar + '$' );
Re.const 			= new RegExp( '^' + Re.strClassConst + '$' );
Re.class 			= new RegExp( '^' + Re.strClass + '$' );
Re.interface 		= new RegExp( '^' + Re.strInterface + '$' );
Re.trait 			= new RegExp( '^' + Re.strTrait + '$' );
Re.autoSee			= new RegExp( '(\\{@see [^\\}]*)?(?:(?:'+Re.strFullName(0)+'::\\$?'+Re.strShortName(0)+'(?:\\(\\))?)|(?:'+Re.strFullName(0)+'\\(\\))|(?:'+Re.strFullName(0,1)+')|'+Re.strFileName+'|'+Re.strUrl+')', 'gm' );


Unitest( 'PHP RegExes', function () {
	//test regular expressions
	var re = new RegExp( '^' + Re.strFullName(1) );
	test( 'asdQWE_123'.match( re )[0] == 'asdQWE_123' );
	test( '\\asdQWE_123'.match( re )[0] == '\\asdQWE_123' );
	test( 'as\\dQWE_123'.match( re )[0] == 'as\\dQWE_123' );
	test( '\\as\\dQWE\\_123'.match( re )[0] == '\\as\\dQWE\\_123' );
	test( !'123asdQWE_123'.match( re ) );
	//test( !'asdQWE_\\123'.match( re ) ); //cant get this to work

	var re = new RegExp( '^' + Re.strString(1) );
	test( '"asd"'.match( re )[1] == 'asd' );
	test( '"as\\"d"'.match( re )[1] == 'as\\"d' );
	test( '"as\\\"d\\\\"'.match( re )[1] == 'as\\\"d\\\\' );
	test( !'"as\\\"d\\\"'.match( re ) );

	var re = new RegExp( '^' + Re.strFunArgument(1) );
	test( '&$asd:\\Exception\\asd = "qwe"'.match( re )[0] = '&$asd:\\Exception\\asd = "qwe"' );
	test( '$asd = "qwe"'.match( re )[0] == '$asd = "qwe"' );
	test( '&$asd:array'.match( re )[0] == '&$asd:array' );
	test( '&$asd = "5"'.match( re )[0] == '&$asd = "5"' );
	test( '$asd'.match( re )[0] == '$asd' );
	test( '&$asd'.match( re )[0] == '&$asd' );
	test( !'asd'.match( re ) );

	var re = new RegExp( '^' + Re.strFunArguments(1) );
	test( '( &$asd:\\Exception\\asd = "qwe" )'.match( re )[0] == '( &$asd:\\Exception\\asd = "qwe" )' );
	test( '( &$asd:\\Exception\\asd = "qwe", $qwe, &$zxc = "5", $poi:array )'.match( re )[0] == '( &$asd:\\Exception\\asd = "qwe", $qwe, &$zxc = "5", $poi:array )' );

	var re = Re.class;
	test( 'class asd'.match( re )[0] == 'class asd' );
	test( 'abstract class asd extends \\qwe\\zxc implements iface1 uses trait1, trait2'.match( re )[0] == 'abstract class asd extends \\qwe\\zxc implements iface1 uses trait1, trait2' );
	test( 'final class qwe\\qwe extends class1 implements i1, i2 uses t1, t2'.match( re )[0] == 'final class qwe\\qwe extends class1 implements i1, i2 uses t1, t2' );
	test( !'final class qwe\\qwe extends class1, class2 implements i1'.match( re ) );

	var re = Re.const;
	test( 'const cls::ASD:int = "5"'.match( re )[0] == 'const cls::ASD:int = "5"' );
	test( 'const cls::ASD = "5"'.match( re )[0] == 'const cls::ASD = "5"' );
	test( 'const cls\\ns\\asd1::ASD'.match( re )[0] == 'const cls\\ns\\asd1::ASD' );

	var re = Re.property;
	test( 'var cls::$asd'.match( re )[0] == 'var cls::$asd' );
	test( 'private final static var cls::$asd:qwe\\qwex = "5"'.match( re )[0] == 'private final static var cls::$asd:qwe\\qwex = "5"' );
	test( 'protected var cls::$asd = "\\""'.match( re )[0] == 'protected var cls::$asd = "\\""' );

	var re = new RegExp( Re.strUrl, 'm' );
	test( 'asd adq we qe q e http://google.com asd'.match( re )[1] == 'http://google.com' );

	var re = new RegExp( Re.strFileName, 'm' );
	test( 'asd adq we qe q e init.php asd'.match( re )[1] == 'init.php' );
	test( 'asd adq we qe q e asd/qwe/init.php asd'.match( re )[1] == 'asd/qwe/init.php'  );

	var re = Re.autoSee;
	test( 'asd adq we qe q e asd/qwe/init.php asd'.match( re )[0] == ' asd/qwe/init.php ' );
	test( 'asd adq we qe \\ns\\class::$property q e asd/qwe/init.php asd'.match( re )[0] == '\\ns\\class::$property' );
	test( 'asd adq we qe \\ns\\class q e asd/qwe/init.php asd'.match( re )[0] == '\\ns\\class' );
	test( 'asd adq we qe class::const q e asd/qwe/init.php asd'.match( re )[0] == 'class::const' );
	test( 'asd \\adq\\qq() we qe method() q e asd/qwe/init.php asd'.match( re )[0] == '\\adq\\qq()' );
	test( 'asd adq we qe class::func() q e asd/qwe/init.php asd'.match( re )[0] == 'class::func()' );
} );

module.exports = Re;