"use strict";

/**
 * This is proxy that will create the actual default behaviour based on the type of the subject.
 * @def class Behaviour.auto
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
Behaviour.auto = function ( subject ) {
	if ( subject.AutoBehaviour instanceof Function ) {
		return new subject.AutoBehaviour( subject );
	}
	else {
		return null;
	}
};