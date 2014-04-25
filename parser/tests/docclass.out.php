<?


/**
DocInterface1
@def interface docnamespace\DocInterface1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:8-14
*/


/**
DocInterface1::ifunc1
@def abstract function docnamespace\DocInterface1::ifunc1 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:13-13
*/


/**
DocInterface2
@def interface docnamespace\DocInterface2
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:19-25
*/


/**
DocInterface2::ifunc2
@def abstract function docnamespace\DocInterface2::ifunc2 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:24-24
*/


/**
DocInterface3
@def interface docnamespace\DocInterface3 implements docnamespace\DocInterface2, docnamespace\DocInterface1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:30-36
*/


/**
DocInterface3::ifunc3
@def abstract function docnamespace\DocInterface3::ifunc3 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:35-35
*/


/**
DocInterface2::ifunc2
@def abstract function docnamespace\DocInterface3::ifunc2 (  )
@declared docnamespace\DocInterface2
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:24-24
*/


/**
DocInterface1::ifunc1
@def abstract function docnamespace\DocInterface3::ifunc1 (  )
@declared docnamespace\DocInterface1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:13-13
*/


/**
DocTrait1
@def trait docnamespace\DocTrait1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:41-51
*/


/**
@autoinheritdoc
@def var docnamespace\DocTrait1::$tprop1 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:43-43
*/


/**
DocTrait1::funa
@def function docnamespace\DocTrait1::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:48-50
*/


/**
DocTrait2
@def trait docnamespace\DocTrait2
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:56-73
*/


/**
@autoinheritdoc
@def var docnamespace\DocTrait2::$tprop2 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:58-58
*/


/**
DocTrait2::funa
@def function docnamespace\DocTrait2::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:63-65
*/


/**
DocTrait2::funb
@def function docnamespace\DocTrait2::funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:70-72
*/


/**
DocTrait3
@def trait docnamespace\DocTrait3 uses docnamespace\DocTrait2, docnamespace\DocTrait1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:78-83
*/


/**
@autoinheritdoc
@def var docnamespace\DocTrait3::$tprop2 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:58-58
*/


/**
@autoinheritdoc
@def var docnamespace\DocTrait3::$tprop1 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:43-43
*/


/**
DocTrait2::funa
@def function docnamespace\DocTrait3::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:63-65
*/


/**
DocTrait2::funb
@def private function docnamespace\DocTrait3::Doctrait2__funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:70-72
*/


/**
DocTrait2::funb
@def function docnamespace\DocTrait3::funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:70-72
*/


/**
DocClass2
@def class docnamespace\DocClass2
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:121-136
*/


/**
DocClass2::funa
@def function docnamespace\DocClass2::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:126-128
*/


/**
DocClass1::funb
@def function docnamespace\DocClass2::funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:133-135
*/


/**
DocClass4
@def abstract class docnamespace\DocClass4
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:152-165
*/


/**
DocClass4::__construct
@def protected function docnamespace\DocClass4::__construct (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:157-159
*/


/**
DocClass4::abst
@def protected abstract function docnamespace\DocClass4::abst (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:164-164
*/


/**
DocClass1
@def class docnamespace\DocClass1 implements docnamespace\DocInterface1
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:88-116
*/


/**
DocClass1::$prop1
@def private var docnamespace\DocClass1::$prop1 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:93-93
*/


/**
@autoinheritdoc
@def protected var docnamespace\DocClass1::$prop2 = "2"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:94-94
*/


/**
@autoinheritdoc
@def var docnamespace\DocClass1::$prop3 = "array(\n  0 => 1,\n  1 => 2,\n  2 => 3\n)"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:95-96
*/


/**
@autoinheritdoc
@def static var docnamespace\DocClass1::$static = "5"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:102-102
*/


/**
@autoinheritdoc
@def var docnamespace\DocClass1::$f = "'f'"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:107-107
*/


/**
DocClass1::CONSTANT
@def const docnamespace\DocClass1::CONSTANT = "4"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:100-100
*/


/**
@autoinheritdoc
@def final static function docnamespace\DocClass1::StaticF ( $f )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:104-106
*/


/**
@autoinheritdoc
@def function docnamespace\DocClass1::ifunc1 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:108-108
*/


/**
DocClass1::funa
@def function docnamespace\DocClass1::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:113-115
*/


/**
DocClass3
@def final class docnamespace\DocClass3 extends docnamespace\DocClass2 implements docnamespace\DocInterface3, docnamespace\DocInterface1, docnamespace\DocInterface2 uses docnamespace\DocTrait3
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:141-147
*/


/**
@autoinheritdoc
@def var docnamespace\DocClass3::$tprop2 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:58-58
*/


/**
@autoinheritdoc
@def var docnamespace\DocClass3::$tprop1 = "NULL"
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:43-43
*/


/**
@autoinheritdoc
@def function docnamespace\DocClass3::ifunc1 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:144-144
*/


/**
@autoinheritdoc
@def function docnamespace\DocClass3::ifunc2 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:145-145
*/


/**
@autoinheritdoc
@def function docnamespace\DocClass3::ifunc3 (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:146-146
*/


/**
DocTrait2::funa
@def function docnamespace\DocClass3::funa (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:63-65
*/


/**
DocTrait2::funb
@def function docnamespace\DocClass3::funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:70-72
*/


/**
DocTrait2::funb
@def private function docnamespace\DocClass3::funb (  )
@file /Users/Bobi/Dev/jsdocgen/parser/tests/docclass.php:70-72
*/


?>