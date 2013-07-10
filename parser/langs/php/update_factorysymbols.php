<?

$tfuncs = get_defined_functions();
$ttypes = array_merge( get_declared_classes(), get_declared_interfaces(), get_declared_traits() );
$funcs = [];
$types = [];
foreach ( $tfuncs['internal'] as $value ) {
	$funcs[$value] = 1;
}
foreach ( $ttypes as $value ) {
	$types[$value] = 1;
}
$json = [
	'types' => $types,
	'functions' => $funcs
];
echo json_encode( $json );

?>