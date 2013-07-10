<?
/**
 * This is the main example source.
 * It has no meaningful information in it.
 * @package example
 */


namespace PHP_s\Ns_es\are\ugly;

/**
Interfaces contain only abstract functions.
See {@see get_declared_interfaces()}.
*/
interface IGoodInterface {

	/**
	Returns a number specific to the class.
	@return int|float
	*/
	function getNumber( \Exception $arg );
}

/**
One line summary.
And many lines of description.
All **descriptions are** markdown.
*/
class ExampleClass extends \Exception implements IGoodInterface {

	// this will get its doc from the interface
	function getNumber( \Exception $arg ) {
		return 1;
	}
}

?>