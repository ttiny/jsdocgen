<?

require __DIR__ . '/PhpParser.php';

$debug = $_SERVER['argv'][1] == 'debug';
chdir( $_SERVER['argv'][2] );
$sources = array_slice(  $_SERVER['argv'], 3 );

$iextra_files = array_search( '|||', $sources );
$extra_files = null;
if ( $iextra_files !== false ) {
	$extra_files = array_slice( $sources, $iextra_files + 1 );
	$sources = array_slice( $sources, 0, $iextra_files );
}
$sourcemap = [];

if ( !empty( $extra_files ) ) {
	foreach ( $extra_files as $key => $value ) {
		$extra_files[$key] = $value;
		$sourcemap[ $value ] = true;
	}
}


//var_dump( $sources );

$t1 = microtime( true );
foreach ( $sources as $key => $src ) {
	$sources[$key] = $src;
	$sourcemap[$src] = true;
	include_once ( $src );
}
$t1 = microtime( true ) - $t1;

$t2 = microtime( true );
$parser = new DocBlockParser\PhpParser( false );

$functions = get_defined_functions()['user'];
foreach ( $functions as $function ) {
	$reflector = new \ReflectionFunction( $function );
	if ( !isset( $sourcemap[ $reflector->getFileName() ] ) ) {
		continue;
	}
	$parser->reflectFunction( $reflector );
}

$classes = get_declared_interfaces();
foreach ( $classes as $class ) {
	$reflector = new \ReflectionClass( $class );
	if ( !isset( $sourcemap[ $reflector->getFileName() ] ) ) {
		continue;
	}
	$parser->reflectClass( $reflector );
}

$classes = get_declared_traits();
foreach ( $classes as $class ) {
	$reflector = new \ReflectionClass( $class );
	if ( !isset( $sourcemap[ $reflector->getFileName() ] ) ) {
		continue;
	}
	$parser->reflectClass( $reflector );
}

$classes = get_declared_classes();
foreach ( $classes as $class ) {
	$reflector = new \ReflectionClass( $class );
	if ( !isset( $sourcemap[ $reflector->getFileName() ] ) ) {
		continue;
	}
	$parser->reflectClass( $reflector );
}

$files = array_merge( $sources, $parser->getUsedFiles() );
if ( !empty( $extra_files ) ) {
	$files = array_merge( $extra_files, $files );
}
$files = array_unique( $files );
foreach ( $files as $file ) {
	$parser->reflectFile( $file );
}

$t2 = microtime( true ) - $t2;

if ( $debug ) {
	echo '//Loading sources: ', $t1, "s\n";
	echo '//Generating docs: ', $t2, "s\n";
}

?>