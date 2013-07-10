"use stict";

/**
 * The basis for behaviours.
 * Behaviours are chunk of logic that can be attached to other objects.
 * @def class Behaviour
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
function Behaviour () {
}

/**
 * Finds a behaviour constructor from string representation.
 * @def static function Behaviour.findByName ( behaviour )
 * @param string
 * @return function|null
 */
Behaviour.findByName = function ( behaviour ) {
	if ( typeof behaviour == 'string' || behaviour instanceof String ) {
		return Behaviour[behaviour] || null;
	}
	return null;
};

Behaviour.define( {

	/**
	 * Detaches the behaviour from its subject.
	 * @def function Behaviour.detach ()
	 */
	detach: function () {
	}
} );