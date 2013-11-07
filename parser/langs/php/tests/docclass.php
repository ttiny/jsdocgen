<?

namespace docnamespace {

	/**
	 * DocInterface1
	 */
	interface DocInterface1 {

		/**
		 * DocInterface1::ifunc1
		 */
		function ifunc1 ();
	}

	/**
	 * DocInterface2
	 */
	interface DocInterface2 {

		/**
		 * DocInterface2::ifunc2
		 */
		function ifunc2 ();
	}

	/**
	 * DocInterface3
	 */
	interface DocInterface3 extends DocInterface2, DocInterface1 {

		/**
		 * DocInterface3::ifunc3
		 */
		function ifunc3 ();
	}

	/**
	 * DocTrait1
	 */
	trait DocTrait1 {

		public $tprop1;

		/**
		 * DocTrait1::funa
		 */
		function funa () {

		}
	}

	/**
	 * DocTrait2
	 */
	trait DocTrait2 {

		public $tprop2;

		/**
		 * DocTrait2::funa
		 */
		function funa () {

		}

		/**
		 * DocTrait2::funb
		 */
		function funb () {

		}
	}

	/**
	 * DocTrait3
	 */
	trait DocTrait3 {
		use DocTrait2, DocTrait1 {
			DocTrait2::funa insteadof DocTrait1;
			Doctrait2::funb as private Doctrait2__funb;
		}
	}

	/**
	 * DocClass1
	 */
	class DocClass1 implements DocInterface1 {

		/**
		 * DocClass1::$prop1
		 */
		private $prop1;
		protected $prop2 = 2;
		public $prop3 = [ 1, 2, 
		                        3 ];
		/**
		 * DocClass1::CONSTANT
		 */
		const CONSTANT = 4;

		static $static = 5;

		final static function StaticF ( $f ) {

		}
		public $f = 'f';
		function ifunc1() {}

		/**
		 * DocClass1::funa
		 */
		function funa () {

		}
	}

	/**
	 * DocClass2
	 */
	class DocClass2 {

		/**
		 * DocClass2::funa
		 */
		function funa () {

		}

		/**
		 * DocClass1::funb
		 */
		function funb () {

		}
	}

	/**
	 * DocClass3
	 */
	final class DocClass3 extends DocClass2 implements DocInterface3 {
		use DocTrait3;

		function ifunc1() {}
		function ifunc2() {}
		function ifunc3() {}
	}

	/**
	 * DocClass4
	 */
	abstract class DocClass4 {

		/**
		 * DocClass4::__construct
		 */
		protected function __construct () {

		}

		/**
		 * DocClass4::abst
		 */
		protected abstract function abst();
	}
}

?>