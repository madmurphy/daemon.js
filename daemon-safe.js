/*\
|*|
|*|			*******************************
|*|			*        daemon-safe.js       *
|*|			*******************************
|*|
|*|	ver. 1.0 rev. 2
|*|
|*|	daemon.js - A JAVASCRIPT HIGHLY SCALABLE DAEMONS MANAGER
|*|
|*|	https://developer.mozilla.org/en-US/docs/JavaScript/Timers/Daemons
|*|	https://developer.mozilla.org/User:fusionchess
|*|
|*|	This framework is released under the GNU Public License, version 3 or later.
|*|	http://www.gnu.org/licenses/gpl-3.0.html
|*|
\*/

"use strict";


	/**************************************
	*     THE SAFE-DAEMON SUB-SYSTEM      *
	**************************************/



/* The "Daemon.safe" constructor */

	Daemon.safe = function () { Daemon.apply(this, arguments); };

		/* Create the Daemon.safe.blank() constructor and the Daemon.safe.context object */

	Daemon.safe.blank = function () {};
	Daemon.safe.context = Daemon.safe.prototype;
	Daemon.TO_BE_DEFINED = Daemon.safe.blank.prototype; /* Make love with the GC :-) */
	Daemon.safe.blank.prototype = /* Important! */ Daemon.safe.prototype = /* Important! */ new Daemon.blank();
	Daemon.safe.prototype.constructor = Daemon.safe;
	Daemon.TO_BE_DEFINED.constructor = Daemon.safe.context.constructor = Object;


/* SYSTEM REQUIRED Daemon.safe global object methods */

	Daemon.safe.forceCall = function (oDmn) {

		oDmn.INDEX += oDmn.BACKW ? -1 : 1;

		var
			bBreak = oDmn.task.call(oDmn.owner, oDmn.INDEX, oDmn.length, oDmn.BACKW) === false,
			bEnd = oDmn.isAtEnd(), bInvert = oDmn.reversals > 0;

		if (bEnd && !bInvert || bBreak) {
			oDmn.PAUSED = true;
			return false;
		}

		if (bEnd && bInvert) {
			oDmn.BACKW = !oDmn.BACKW;
			oDmn.reversals--;
		}

		oDmn.synchronize();

		return true;

	};


/* SYSTEM NOT REQUIRED Daemon.safe global object methods */

	/**
	* Daemon.safe global object optional methods (shortcuts). You could safely remove all or some of
	* them, depending on your needs.
	**/

		/* Warning: this method requires the global Daemon.construct() method */
	Daemon.safe.construct = Daemon.construct;

		/* Warning: this method requires the global Daemon.buildAround() method */
	Daemon.safe.buildAround = Daemon.buildAround;

		/* Warning: this method requires the global Daemon.incorporate() method */
	Daemon.safe.incorporate = Daemon.incorporate;


/* SYSTEM REQUIRED Daemon.safe instances methods */

	Daemon.safe.prototype.synchronize = function () {
		if (this.PAUSED) { return; }
		clearTimeout(this.SESSION);
		this.SESSION = setTimeout(Daemon.safe.forceCall, this.rate, this);
	};

	Daemon.safe.prototype.pause = function () {
		clearTimeout(this.SESSION);
		this.PAUSED = true;
	};


/* SYSTEM NOT REQUIRED Daemon.safe instances methods */

	/* [inherited from Daemon.prototype] */



	/****************************************
	*     THE SAFE-DAEMON IS NOW READY!     *
	*****************************************/
