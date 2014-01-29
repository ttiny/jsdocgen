"use strict";

require( 'Prototype' );

/**
 * @package travelsdk.core.utils
 */


/**
 * A class that keeps track of debug information.
 * The class manages a list of debug stats, each having a unique name.
 *
 * Nesting and summing timers:
 * <code>
 * Debug::startTimer();
 * for(...) {
 * 	func1();
 * 	Debug::startTimer();
 * 	func2();
 * 	Debug::addTimer('My.Inner.Thingie'); //measure the sum of the time of all calls to func2()
 * }
 * Debug::saveTimer('My.Outer.Loop'); //measure the time taken for the for last loop (not the sum)
 * </code>
 *
 * Timers and counting:
 * <code>
 * $slowestSQL = null;
 * $slowestTime = 0;
 * for(...) {
 * 	Debug::startTimer();
 * 	perform_sql_query($sql);
 * 	$last = Debug::endTimer();
 * 	if($last > $slowestTime) {
 * 		$slowestTime = $last;
 * 		$slowestSQL = $sql;
 * 	}
 * 	Debug::addStat('SQL.Queries.Count', 1);
 * }
 * Debug::setStat('SQL.Slowest.Query', $slowestSQL);
 * Debug::setStat('SQL.Slowest.Timing', $slowestTime);
 * </code>
 * @author Borislav Peev <borislav.asdf@gmail.com>
 */
function Debug () {
}

Debug.defineStatic( {

	_timers: [],
	_stats: {},
	_counts: {},
	_units: {},
	
	/**
	 * Starts a new timer.
	 * Timers are stacked. I.e. you can call startTimer again before the previous timer was flushed with endTimer()
	 * Each startTimer() call must be matched by a call to {@see endTimer()} or {@see saveTimer()}.
	 * Timers have microsecond precision.
	 * @return float see {@see microtime()}
	 */
	startTimer: function () {
		Debug._timers.push( Date.now() );
	},
	
	/**
	 * Stops the timer started by the last {@see startTimer()} call
	 * @return float the time elapsed in seconds (with microseconds precision)
	 */
	endTimer: function () {
		return (Date.now() - Debug._timers.pop()) / 1000;
	},
	
	/**
	 * Stops the timer started by the last {@see startTimer()} call and saves its value to the list of debug stats
	 * @param string name for the property under which the elapsed time will be saved
	 * @return float the time elapsed in seconds (with microseconds precision)
	 */
	saveTimer: function ( $stat ) {
		var $t = Debug.endTimer();
		Debug.setStat( $stat, $t, 's' );
		return $t;
	},
	
	/**
	 * Stops the timer started by the last {@see startTimer()} call and adds its value to existing value in the list of debug stats.
	 * @see addStat()
	 * @param string name for the property to which the elapsed time will be added
	 * @return float the time elapsed in seconds (with microseconds precision)
	 */
	addTimer: function ( $stat ) {
		var $t = Debug.endTimer();
		Debug.addStat( $stat, $t, 's' );
		return $t;
	},
	
	/**
	 * Writes a debug property in the list of maintained stats.
	 * If such property already exists it is replaced.
	 * @param string name for the property
	 * @param mixed value of the stat
	 * @param string|null the unit of the value. see {@see getStats()} for more info units
	 * @return mixed returns $value
	 */
	setStat: function ( $stat, $value, $unit ) {
		Debug._stats[$stat] = $value;
		Debug._counts[$stat] = 1;
		if( $unit !== undefined ) {
			Debug._units[$stat] = $unit;
		}
		return $value;
	},
	
	/**
	 * Adds to the value of existing property in the list of maintained stats.
	 * If the property doesn't exist this function is the identical to {@see setStat()}.
	 * This function should be called only on scalable (i.e. int, float) stats.
	 * The function also maintains the 'count' of how many times it was called,
	 * i.e. how many times a value was added, making possible to find the average (see {@see getCount()}).
	 * @param string name for the property
	 * @param mixed value to be added to the stat
	 * @param string|null the unit of the value. see {@see getStats()} for more info units
	 * @return mixed the resulting value of the stat
	 */
	addStat: function ( $stat, $value, $unit ) {
		if( Debug._stats[$stat] === undefined ) {
			Debug._stats[$stat] = $value;
			Debug._counts[$stat] = 1;
		}
		else {
			Debug._stats[$stat] += $value;
			++Debug._counts[$stat];
		}
		if ( $unit !== undefined ) {
			Debug._units[$stat] = $unit;
		}
		return Debug._stats[$stat];
	},
	
	/**
	 * Retrieves the value of stored property in the list of maintained stats.
	 * @param string name of the property to be retrieved
	 * @return mixed returns null if the property doesn't exist
	 */
	getStat: function ( $stat ) {
		return Debug._stats[$stat] || null;
	},
	
	/**
	 * Sets (or changes) the unit of a property in the list of maintained stats.
	 * @param string name of the property to be changed
	 * @param string|null the unit of the value. see {@see getStats()} for more info units
	 * @return mixed returns null if the property doesn't exist
	 */
	setUnit: function ( $stat, $unit ) {
		Debug._units[$stat] = $unit;
	},
	
	/**
	 * Retrieves the unit of a property
	 * @param string name of the property to be retrieved
	 * @return string|null
	 */
	getUnit: function ( $stat ) {
		return Debug._units[$stat] || null;
	},
	
	/**
	 * Retrieves the 'count' of a stat in the list of maintained stats.
	 * 'count' means how many times {@see addStat()} was called for this property.
	 * The 'count' for stats created by {@see setStat()} is 1.
	 * @see getAverage()
	 * @param string name of the property to be retrieved
	 * @return mixed returns 0 if the property doesn't exist
	 */
	getCount: function ($stat) {
		return Debug._counts[$stat] || 0;
	},
	
	/**
	 * Retrieves the average for a stat.
	 * This function is for stats that are made of several {@see addStat()} calls.
	 * @param string name of the property to be retrieved
	 * @return mixed returns null if the property doesn't exist
	 */
	getAverage: function ( $stat ) {
		var $v = Debug.getStat( $stat );
		var $n = Debug.getCount( $stat );
		if( Number.isNumber( $v ) && $n > 0 ) {
			return $v / $n;
		}
		else {
			return null;
		}
	},
	
	/**
	 * Saves the average value of a stat in a separate stat
	 * @param string name of the property to be saved
	 * @param string new name under which the average will be saved. If it is the same like the name of the property, it will replaced
	 * @return mixed returns the value of the saved stat or null if the property doesn't exist
	 */
	saveAverage: function ( $stat, $newname ) {
		var $a = Debug.getAverage( $stat );
		if( $a !== null ) {
			return Debug.setStat( $newname, $a, Debug.getUnit( $stat ) );
		}
		else {
			return null;
		}
	},

	/**
	 * Retrieves the list of maitained debug stats.
	 * Stats that have an unit specified are formated accordingly to be more readable.
	 * Supported units are:
	 * <pre>
	 * 'b': bytes, formated as "1.5 MB", "2.12 KB", etc
	 * 's': seconds, formated as "1.123456 s", "3 minutes 1 second", "5 days 3 hours"
	 * other units are just appended with a space to the value
	 * </pre>
	 * @return array AA aray where the key is the name of the stat. The array is sorted by key.
	 */
	getStats: function () {
		var $ret = {};
		for ( var $k in Debug._stats ) {
			var $v = Debug._stats[$k];
			var $u = Debug.getUnit( $k );
			/*if( $u == 'b' ) {
				$v = FormatUtils::formatBytes( $v );
			}
			else if ( $u == 's' ) {
				if ( $v > 60 ) {
					$v = TimeUtils::timeAgoFormat( Math.ceil( Number( $v ) ), null, true );
				}
				else {
					$v = $v + ' ' + $u;
				}
			}
			else*/ if ( $u !== null ) {
				$v = $v + ' ' + $u;
			}
			$ret[$k] = $v;
		}
		return $ret;
	}

} );

module.exports = Debug;