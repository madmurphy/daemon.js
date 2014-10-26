/*\
|*|
|*|			*******************************
|*|			*          daemon.js          *
|*|			*******************************
|*|
|*|	ver. 1.0 rev. 2
|*|
|*|	daemon.js - A JAVASCRIPT HIGHLY SCALABLE DAEMONS MANAGER.
|*|
|*|	https://developer.mozilla.org/en-US/docs/JavaScript/Timers/Daemons
|*|	https://developer.mozilla.org/User:fusionchess
|*|
|*|	This framework is released under the GNU Public License, version 3 or later.
|*|	http://www.gnu.org/licenses/gpl-3.0.html
|*|
\*/

"use strict";


	/****************************
	*     THE DAEMON SYSTEM     *
	****************************/



/* The global "Daemon" constructor */

	function Daemon (oOwner, fTask, nRate, nLen, fInit, fOnstart) {
		if (!(this && this instanceof Daemon)) { return; }
		if (arguments.length < 2) { throw new TypeError("Daemon - not enough arguments"); }
		if (oOwner) { this.owner = oOwner };
		this.task = fTask;
		if (isFinite(nRate) && nRate > 0) { this.rate = Math.floor(nRate); }
		if (nLen > 0) { this.length = Math.floor(nLen); }
		if (fOnstart) { this.onstart = fOnstart; }
		if (fInit) {
			this.onstop = fInit;
			fInit.call(oOwner, this.INDEX, this.length, this.BACKW);
		}
	}

		/* Create the Daemon.blank() constructor and the global Daemon.context object */

	Daemon.blank = function () {};
	Daemon.context = Daemon.blank.prototype; /* Make love with the GC :-) */
	Daemon.blank.prototype = /* Important! */ Daemon.prototype;
	Daemon.context.constructor = Object;

		/* These properties can be manually reconfigured after the creation of the daemon */

	Daemon.prototype.owner = Daemon.context;
	Daemon.prototype.task = null;
	Daemon.prototype.rate = 100;
	Daemon.prototype.length = Infinity;
	Daemon.prototype.reversals = 0;
	Daemon.prototype.onstart = null;
	Daemon.prototype.onstop = null;

		/* These properties should be read-only after the creation of the daemon */

	Daemon.prototype.SESSION = -1;
	Daemon.prototype.INDEX = 0;
	Daemon.prototype.PAUSED = true;
	Daemon.prototype.BACKW = true;


/* SYSTEM REQUIRED Daemon global object methods */

	Daemon.forceCall = function (oDmn) {

		oDmn.INDEX += oDmn.BACKW ? -1 : 1;

		var
			bBreak = oDmn.task.call(oDmn.owner, oDmn.INDEX, oDmn.length, oDmn.BACKW) === false,
			bEnd = oDmn.isAtEnd(), bInvert = oDmn.reversals > 0;

		if (bEnd && !bInvert || bBreak) {
			oDmn.pause();
			return false;
		}

		if (bEnd && bInvert) {
			oDmn.BACKW = !oDmn.BACKW;
			oDmn.reversals--;
		}

		return true;

	};


/* SYSTEM NOT REQUIRED Daemon global object methods */

	/**
	* Daemon global object optional methods (shortcuts). You could safely remove all or some of them,
	* depending on your needs. If you want to remove them and are using the Daemon.safe subsystem you
	* should also remove the Daemon.safe global object methods that require them.
	**/

	Daemon.construct = function (aArgs) {
		var oDmn = new this.blank();
		this.apply(oDmn, aArgs);
		return oDmn;
	};

	Daemon.buildAround = function (oCtx, nRate, nLen) {
		if (!oCtx.perform) { throw new TypeError("You cannot create a daemon around an object devoid of a \"perform\" function"); }
		return new this(oCtx, oCtx.perform, nRate || null, nLen || null, oCtx.create || null, oCtx.prepare || null);
	};

		/* Warning! Calling Daemon.incorporate(@func) will modify the @func.prototype property! */

	Daemon.incorporate = function (fConstr) {
		var oLegacy = fConstr.prototype;
		fConstr.prototype = new Daemon.blank();
		fConstr.prototype.legacy = oLegacy;
		return fConstr;
	};


/* SYSTEM REQUIRED Daemon instances methods */

	Daemon.prototype.isAtEnd = function () {
		return this.BACKW ? isFinite(this.length) && this.INDEX < 1 : this.INDEX + 1 > this.length;
	};

	Daemon.prototype.synchronize = function () {
		if (this.PAUSED) { return; }
		clearInterval(this.SESSION);
		this.SESSION = setInterval(Daemon.forceCall, this.rate, this);
	};

	Daemon.prototype.pause = function () {
		clearInterval(this.SESSION);
		this.PAUSED = true;
	};


/* SYSTEM NOT REQUIRED Daemon instances methods */

	/**
	* Basic user interface. You could remove this method, but your daemon will be virtually unusable.
	* All other optional instances methods depend on this one or on the previous ones.
	**/

	Daemon.prototype.start = function (bReverse) {
		var bBackw = Boolean(bReverse);
		if (this.BACKW === bBackw && (this.isAtEnd() || !this.PAUSED)) { return false; }
		this.BACKW = bBackw;
		this.PAUSED = false;
		if (this.onstart) { this.onstart.call(this.owner, this.INDEX, this.length, this.BACKW); }
		this.synchronize();
		return true;
	};

	Daemon.prototype.stop = function () {
		this.pause();
		if (this.onstop) { this.onstop.call(this.owner, this.INDEX, this.length, this.BACKW); }
		delete this.INDEX;
		delete this.BACKW;
		delete this.reversals;
	};



	/*******************************
	*     DAEMON IS NOW READY!     *
	*******************************/




	/*******************************
	*          POLYFILLS           *
	*******************************/




/*\
|*|
|*|	IE-specific polyfill which enables the passage of arbitrary arguments to the
|*|	callback functions of JavaScript timers (HTML5 standard syntax).
|*|
|*|	https://developer.mozilla.org/en-US/docs/DOM/window.setInterval
|*|
|*|	Syntax:
|*|	var timeoutID = window.setTimeout(func, delay, [param1, param2, ...]);
|*|	var timeoutID = window.setTimeout(code, delay);
|*|	var intervalID = window.setInterval(func, delay[, param1, param2, ...]);
|*|	var intervalID = window.setInterval(code, delay);
|*|
\*/

/*

if (document.all && !window.setTimeout.isPolyfill) {
	var __nativeST__ = window.setTimeout;
	window.setTimeout = function (vCallback, nDelay) {
		var aArgs = Array.prototype.slice.call(arguments, 2);
		return __nativeST__(vCallback instanceof Function ? function () {
			vCallback.apply(null, aArgs);
		} : vCallback, nDelay);
	};
	window.setTimeout.isPolyfill = true;
}
	
if (document.all && !window.setInterval.isPolyfill) {
	var __nativeSI__ = window.setInterval;
	window.setInterval = function (vCallback, nDelay) {
		var aArgs = Array.prototype.slice.call(arguments, 2);
		return __nativeSI__(vCallback instanceof Function ? function () {
			vCallback.apply(null, aArgs);
		} : vCallback, nDelay);
	};
	window.setInterval.isPolyfill = true;
}

*/
