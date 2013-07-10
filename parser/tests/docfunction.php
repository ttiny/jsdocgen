<?

namespace docnamespace {

	function docfunction1 ( $param1, array $param2 = array( 'asd' => 5 ) , $optional = 'option' ) {

	}

	function &docfunction2 ( $param1, $param2, SomeType &$optional = null ) {
		return $param;
	}
}

?>