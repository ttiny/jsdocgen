<?
namespace DocBlockParser {

	/**
	 * Uses PHP's reflection to generate docblocks with @def tags.
	 * @author Borislav Peev <borislav.asdf@gmail.com>
	 * @private
	 */
	class PhpParser {

		private $_relativePaths = [];
		private $_fileTokens = [];
		private $_usedFiles = [];
		private $_propDefaults = [];
		private $_usedDocComments = [];

		// converts default values of parameters and properties to strings so they are "loseless" when converted to JSON
		private function _safeDefault ( $value, $export = true ) {
			if ( true || $export ) {
				$arr = is_array( $value );
				$value = var_export( $value, true );
				if ( $arr ) {
					$value = str_replace( 'array (', 'array(', $value );
					$value = preg_replace( '/=> \n\s*array/m', '=> array', $value );
					$value = preg_replace( '/\( ?\n(\s*)\)/m', '($1)', $value );
					$value = preg_replace( '/,(\s*)\)/m', '$1)', $value );
				}
			}
			//return '"' . str_replace( "\n", '\n', str_replace( '"', '\\"', str_replace( '\\', '\\\\', $value ) ) ) . '"';
			return '"' . substr( json_encode( $value ), 1, -1 ) . '"';

		}

		private function _prettyDocBlock ( $doc, $markused = false ) {

			if ( empty( $doc ) ) {
				return "@autoinheritdoc\n";
			}
			
			if ( $markused ) {
				$this->_usedDocComments[ $markused . '_' . md5( $doc ) ] = true;
			}
			
			//normalize newlines
			$comment = preg_replace( '/\r\n|\r/', "\n", $doc );
			//strip /**\n\n*/
			$indent = substr( $comment, 4, -2 );
			$comment = rtrim( $indent );
			$eols = substr_count( $comment, "\n" ) + 1;
			//check if all lines start with *
			$matches = preg_match_all( '/^[\t ]*\*/m', $comment );
			if ( $matches == $eols ) {
				//remove * prefix if so
				$comment = preg_replace( '/^[\t ]*\* ?/m', '', $comment );
			}
			else {
				//remove the same ammount indent of each line as the last one
				$indent = substr( $indent, strlen( $comment ) );
				$i = strrpos( $indent, "\n" );
				if ( $i !== false ) {
					$indent = substr( $indent, $i + 1 );
				}
				if ( strlen( $indent ) > 0 ) {
					$comment = preg_replace( '/^'.$indent.'/m', '', $comment );
				}
			}

			$comment = rtrim( $comment );
			if ( !empty( $comment ) ) {
				$comment .= "\n";
			}

			return $comment;
		}

		/**
		 * Retrieves all files that were in use by the symbols parsed by this instance.
		 * @return string[]
		 */
		function getUsedFiles () {
			return array_keys( $this->_usedFiles );
		}

		/**
		 * Parses the first docblock in the document, aka header.
		 * @param string Presumably a PHP script.
		 * @return string|false
		 */
		function getHeader( $string, $file ) {
			// if ( preg_match( '/.*<\?(?:php)?\s*(\/\*\*.*?\*\/)/ms', $string, $matches ) == 1 ) {
			// get the first docblock and see if it is used
			if ( preg_match( '/\/\*\*.*?\*\//ms', $string, $matches ) == 1 ) {
				$md5 = $file . '_' . md5( $matches[0] );
				if ( !isset( $this->_usedDocComments[$md5] ) ) {
					return $matches[0];
				}
			}
			return false;
		}

		/**
		 * Parses a file and returns its documentation in JSON format.
		 * @param string File path.
		 * @return array
		 */
		function reflectFile ( $file ) {

			$ret = [];

			$file = realpath( $file );
			$contents = file_get_contents( $file );
			$docblock = $this->getHeader( $contents, $file );
			if ( $docblock !== false ) {
				$docblock = "/**\n" . $this->_prettyDocBlock( $docblock, false );
				$docblock .= "@def file " . $file;
				$docblock .= "\n*/";
				
				echo "\n\n\n", $docblock;
			}

		}

		

		/**
		 * Parses the doc block of an user defined function into array.
		 * @param string|Closure Name of the function.
		 * @return array|false
		 */
		function reflectFunction ( $function, $contextclass = null ) {
			if ( $function instanceof \ReflectionFunctionAbstract ) {
				$reflector = $function;
			}
			else {
				$reflector = new \ReflectionFunction( $function );
			}
			
			if ( !$reflector->isUserDefined() ) {
				return false;
			}

			$params = [];
			$fparams = $reflector->getParameters();
			foreach ( $fparams as $param ) {

				//extract class name
				$class = $param->isArray() ? 'mixed[]' : null;
				if ( $class === null ) {
					if( preg_match( '/Parameter #\d+ \[ <\w+>(?: (\S+)(?: or \S+)?)? &?\$[\w_]+(?: = \S+)? \]/', (string)$param, $matches ) == 1 ) {
						if ( isset( $matches[1] ) ) {
							$class = $matches[1];
						}
					}
				}

				$p = '';
				$p .= $param->isPassedByReference() ? '&' : '';
				$p .= '$' . $param->getName();
				$p .= $class !== null ? ':' . $class : '' ;
				$p .= $param->isDefaultValueAvailable() ? ' = ' . $this->_safeDefault( $param->getDefaultValue() ) : '';
				$params[] = $p;
			}

			$fun = '@def';
			if ( $contextclass !== null ) {
				$fun .= $reflector->isPrivate() ? ' private' : ( $reflector->isProtected() ? ' protected' : '' );
				$fun .= $reflector->isFinal() ? ' final' : '';
				$fun .= $reflector->isAbstract() ? ' abstract' : '';
				$fun .= $reflector->isStatic() ? ' static' : '';
			}
			$name = $reflector->getName();
			/*if ( $contextclass !== null && ( $name == '__construct' || $name == '__destruct' ) ) {
				$fun .= $name == '__construct' ? ' constructor ' : ' destructor ';
				$fun .= $contextclass;
			}
			else {*/
				$fun .= ' function ';
				$fun .= $reflector->returnsReference() ? '&' : '';
				if ( $contextclass !== null ) {
					$fun .= $contextclass . '::';
				}
				$fun .= $name;
			/*}*/

			$fun .= ' ( ' . implode( ', ', $params ) . ' )';

			$docblock = "/**\n" . $this->_prettyDocBlock( $reflector->getDocComment(), $reflector->getFileName() );
			$docblock .= $fun;
			if ( $contextclass !== null && $reflector->class != $contextclass ) {
				$docblock .= "\n@declared " . $reflector->class;
			}
			$docblock .= "\n@file " . $reflector->getFileName() . ':' . $reflector->getStartLine() . '-' . $reflector->getEndLine();
			$docblock .= "\n*/";

			$this->_usedFiles[ $reflector->getFileName() ] = true;

			echo "\n\n\n", $docblock;
		}

		/**
		 * Parses the doc block of an user defined class/interface/trait into array.
		 * @param string Name of the class.
		 * @return array|false
		 */
		function reflectClass ( $reflector ) {

			if ( !$reflector->isUserDefined() ) {
				return false;
			}

			if ( $reflector->getName() == __CLASS__ ) {
				return false;
			}
			

			$classname = $reflector->getName();
			$file = $reflector->getFileName();
			$type = ( $reflector->isInterface() ? 'interface' : ( $reflector->isTrait() ? 'trait' : 'class' ) );
			$cls = '@def';
			if ( $type == 'class' ) {
				$cls .= $reflector->isAbstract() ? ' abstract' : '';
				$cls .= $reflector->isFinal() ? ' final' : '';
			}
			$cls .= ' ' . $type;
			$cls .= ' ' . $classname;
			$parent = $reflector->getParentClass();
			if ( $parent !== false ) {
				$cls .= ' extends ' . $parent->getName();
			}
			$interfaces = $reflector->getInterfaceNames();
			if ( !empty( $interfaces ) ) {
				$cls .= ' implements ' . implode( ', ', $interfaces );
			}
			$traits = $reflector->getTraitNames();
			if ( !empty( $traits ) ) {
				$cls .= ' uses ' . implode( ', ', $traits );
			}

			$docblock = "/**\n" . $this->_prettyDocBlock( $reflector->getDocComment(), $file );
			$docblock .= $cls;
			$docblock .= "\n@file " . $file . ':' . $reflector->getStartLine() . '-' . $reflector->getEndLine();
			$docblock .= "\n*/";

			$this->_usedFiles[ $file ] = true;

			echo "\n\n\n", $docblock;


			// properties
			$props = [];
			$cprops = $reflector->getProperties();
			$propdefs = $this->_findPropValues( $reflector );
			foreach ( $cprops as $prop ) {

				if ( $prop->class != $classname ) {
					$decl = $prop->getDeclaringClass();
					if ( !$decl->isUserDefined() ) {
						continue;
					}
					$propdefs = array_merge( $this->_findPropValues( $decl ), $propdefs );
				}

				$name = $prop->getName();
				$def = $propdefs[$name];

				$propdef = '@def';
				$propdef .= $prop->isPrivate() ? ' private' : ( $prop->isProtected() ? ' protected' : '' );
				$propdef .= $prop->isStatic() ? ' static' : '';
				$propdef .= ' var ' . $classname . '::' . '$' . $name . ' = ' . $this->_safeDefault( $def[3] );

				$docblock = "/**\n" . $this->_prettyDocBlock( $prop->getDocComment(), $def[0] );
				$docblock .= $propdef;
				if ( $prop->class != $classname ) {
					$docblock .= "\n@declared " . $prop->class;
				}
				$docblock .= "\n@file " . $def[0] . ':' . $def[1] . '-' . $def[2];
				$docblock .= "\n*/";

				$this->_usedFiles[ $def[0] ] = true;

				echo "\n\n\n", $docblock;
			}



			// constants
			$consts = $reflector->getConstants();
			if ( !empty( $consts ) ) {
				$constblocks = $this->_findConstDocBlocks( $reflector );
				foreach ( $consts as $name => &$const ) {
					$def = $constblocks[$name];

					$constdef = '@def const ' . $classname . '::' . $name . ' = ' . $this->_safeDefault( $const, false );

					$docblock = "/**\n" . $this->_prettyDocBlock( $def[4], $def[0] );
					$docblock .= $constdef;
					if ( $def[1] != $classname ) {
						$docblock .= "\n@declared " . $def[1];
					}
					$docblock .= "\n@file " . $def[0] . ':' . $def[2] . '-' . $def[3];
					$docblock .= "\n*/";

					$this->_usedFiles[ $file ] = true;

					echo "\n\n\n", $docblock;
				}
			}


			// methods
			$cmethods = $reflector->getMethods();
			foreach ( $cmethods as $method ) {
				
				$this->reflectFunction( $method, $classname );

			}
		}

		////// utility functions to parse tokens from token_get_all,
		////// needed to find info which is not available in the reflection classes:

		private function _findClassToken ( &$tokens, $lasttoken, $offset, $class, $start, $end, $classType = T_CLASS ) {
			for ( $i = $offset; $i < $lasttoken; ++$i ) { 
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					continue;
				}
				$line = $token[2];
				if ( $line == $start && $token[0] == $classType ) {
					$i = $this->_findNextToken( $tokens, $lasttoken, $i + 1, T_STRING, $end );
					if ( $i != false ) {
						if ( $tokens[$i][1] == $class ) {
							return $i;
						}
					}
				}
				else if ( $line > $start ) {
					break;
				}
			}
			return false;
		}

		private function _findNextToken ( &$tokens, $lasttoken, $offset, $target, $end ) {
			for ( $i = $offset; $i < $lasttoken; ++$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					/*if ( $token === $target ) {
						return $i;
					}*/
					continue;
				}
				if ( $token[2] > $end ) {
					break;
				}
				if ( $token[0] == $target ) {
					return $i;
				}
			}
			return false;
		}

		private function _findNextTokenLine ( &$tokens, $lasttoken, $offset, $target, $end ) {
			$lastKnownLine = 0;
			for ( $i = $offset; $i < $lasttoken; ++$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					if ( $token === $target ) {
						return $lastKnownLine;
					}
					continue;
				}
				$lastKnownLine = $token[2];
				if ( $lastKnownLine > $end ) {
					break;
				}
				if ( $token[0] === $target ) {
					return $lastKnownLine;
				}
			}
			return false;
		}

		private function _skipToLine ( &$tokens, $lasttoken, $offset, $end ) {
			for ( $i = $offset; $i < $lasttoken; ++$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					continue;
				}
				$line = $token[2];
				if ( $line >= $end ) {
					return $i;
				}
			}
			return false;
		}

		private function _findNextToken2 ( $reflector, &$tokens, $lasttoken, $offset, $target, $end ) {
			for ( $i = $offset; $i < $lasttoken; ++$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					continue;
				}
				if ( $token[2] > $end ) {
					break;
				}
				$type = $token[0];
				if ( $type == $target ) {
					return $i;
				}
				//skip functions
				else if ( $type == T_FUNCTION ) {
					$i = $this->_findNextToken( $tokens, $lasttoken, $i + 1, T_STRING, $end );
					if ( $i != false ) {
						$method = $reflector->getMethod( $tokens[$i][1] );
						$startLine = $method->getStartLine();
						$endLine = $method->getEndLine();
						if ( $startLine === $endLine ) {
							++$endLine;
						}
						$i = $this->_skipToLine( $tokens, $lasttoken, $i + 1, $endLine );
						if ( $i === false ) {
							break;
						}
					}
				}
			}
			return false;
		}

		private function _findPrevDocBlockToken ( $tokens, $lasttoken, $offset, $start ) {
			for ( $i = $offset; $i >= 0; --$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					continue;
				}
				if ( $token[2] < $start ) {
					break;
				}
				$type = $token[0];
				if ( $type == T_DOC_COMMENT ) {
					return $i;
				}
				else if ( $type == T_WHITESPACE || $type == T_COMMENT ) {
					continue;
				}
				else {
					break;
				}
			}
			return false;
		}

		private function _findPrevToken ( $tokens, $offset, $start ) {
			for ( $i = $offset; $i >= 0; --$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					continue;
				}
				if ( $token[2] < $start ) {
					break;
				}
				$type = $token[0];
				if ( $type == T_WHITESPACE || $type == T_COMMENT ) {
					continue;
				}
				else {
					break;
				}
			}
			return false;
		}

		private function _findPropValue ( &$tokens, $lasttoken, $offset, $end, $reflector ) {
			$ret = '';
			$collecting = false;
			$lastKnownLine = 0;
			for ( $i = $offset; $i < $lasttoken; ++$i ) {
				$token = $tokens[$i];
				if ( is_string( $token ) ) {
					if ( $token === ';' ) {
						break;
					}
					else if ( $collecting ) {
						$ret .= $token;
					}
					else if ( $token === '=' ) {
						$collecting  = true;
					}
				}
				else {
					$lastKnownLine = $token[2];
					if ( $collecting ) {
						$ret .= $token[1];
					}
				}
			}
			$ret = trim( $ret );
			if ( strlen( $ret ) > 0 ) {
				if ( substr( $ret, 0, 6 ) === 'self::' ) {
					$ret = $reflector->getName() . '::' . substr( $ret, 6 );
				}
				$f = create_function( '', 'return ' . $ret . ';' );
				return [ $lastKnownLine, $f() ];
			}
			else {
				return [ $lastKnownLine, null ];
			}
		}

		private function _findConstDocBlocks ( $reflector ) {

			$file = $reflector->getFileName();
			$class = $reflector->getShortName();
			$start = $reflector->getStartLine();
			$end = $reflector->getEndLine();
			$type = ( $reflector->isTrait() ? T_TRAIT : ( $reflector->isInterface() ? T_INTERFACE : T_CLASS ) );

			$tokens = $this->_getFileTokens( $file );
			$lasttoken = count( $tokens );
			$i = $this->_findClassToken( $tokens, $lasttoken, 0, $class, $start, $end, $type );
			$ret = [];
			while ( $i !== false ) {
				$i = $this->_findNextToken( $tokens, $lasttoken, $i + 1, T_CONST, $end );
				if ( $i != false ) {
					$startLine = $tokens[$i][2];
					$namei = $this->_findNextToken( $tokens, $lasttoken, $i + 1, T_STRING, $end );
					if ( $namei != false ) {
						$name = $tokens[$namei][1];
						$doci = $this->_findPrevDocBlockToken( $tokens, $lasttoken, $i - 1, $start );
						$endLine = max( $tokens[$namei][2], $this->_findNextTokenLine( $tokesn, $lasttoken, $i + 1, ';', $end ) );
						if ( $doci !== false ) {
							$ret[$name] = [ $file, $reflector->getName(), $startLine, $endLine, $tokens[$doci][1] ];
						}
						else {
							$ret[$name] = [ $file, $reflector->getName(), $startLine, $endLine, false ];
						}
					}
					else {
						break;
					}
				}
			}

			foreach ( $reflector->getTraits() as $trait ) {
				$ret = array_merge( $ret, $this->_findConstDocBlocks( $trait ) );
			}

			foreach ( $reflector->getInterfaces() as $iface ) {
				if ( $iface->isInternal() ) {
					continue;
				}
				$ret = array_merge( $ret, $this->_findConstDocBlocks( $iface ) );
			}

			$parent = $reflector->getParentClass();
			if ( $parent !== false ) {
				$ret = array_merge( $ret, $this->_findConstDocBlocks( $parent ) );
			}

			return $ret;
		}

		private function _findPropValues ( $reflector ) {

			$fullName = $reflector->getName();
			if ( isset( $this->_propDefaults[ $fullName ] ) ) {
				return $this->_propDefaults[ $fullName ];
			}

			$file = $reflector->getFileName();
			$class = $reflector->getShortName();
			$start = $reflector->getStartLine();
			$end = $reflector->getEndLine();
			$type = ( $reflector->isTrait() ? T_TRAIT : T_CLASS );

			$tokens = $this->_getFileTokens( $file );
			$lasttoken = count( $tokens );
			$i = $this->_findClassToken( $tokens, $lasttoken, 0, $class, $start, $end, $type );			
			$ret = [];
			while ( $i !== false ) {
				$i = $this->_findNextToken2( $reflector, $tokens, $lasttoken, $i + 1, T_VARIABLE, $end );
				if ( $i != false ) {
					$startLine = $this->_findPrevToken( $tokens, $i - 1, $start );
					$startLineT = $startLine[0];
					if ( $startLineT == T_PRIVATE || $startLineT == T_PROTECTED || $startLineT == T_PUBLIC ) {
						$startLine = $startLine[2];
					}
					else {
						$startLine = $tokens[$i][2];
					}
					$name = substr( $tokens[$i][1], 1 );
					$propval = $this->_findPropValue( $tokens, $lasttoken, $i + 1, $end, $reflector );
					$endLine = max( $startLine, $propval[0] );
					$ret[$name] = [ $file, $startLine, $endLine, $propval[1] ];
				}
			}

			foreach ( $reflector->getTraits() as $trait ) {
				$ret = array_merge( $ret, $this->_findPropValues( $trait ) );
			}

			$this->_propDefaults[ $fullName ] = $ret;

			return $ret;
		}

		private function _getFileTokens ( $file ) {
			if ( !isset( $this->_fileTokens[ $file ] ) ) {
				$this->_fileTokens[ $file ] = token_get_all( file_get_contents( $file ) );
			}
			return $this->_fileTokens[ $file ];
		}

	}

}