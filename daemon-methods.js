/*\
|*|
|*|			*******************************
|*|			*       daemon-methods.js     *
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


/* SYSTEM NOT REQUIRED Daemon instances methods */

		/* Movement */

	Daemon.prototype.syncStart = function (bReverse) {
		this.synchronize();
		if (this.start(bReverse || false)) {
			Daemon.forceCall(this);
			return true;
		}
		return false;
	};

	Daemon.prototype.play = function (bSync) {
		/* Warning: this method OPTIONALLY requires the Daemon.prototype.syncStart() method */
		return this[bSync ? "start" : "syncStart"]();
	};

	Daemon.prototype.reversePlay = function (bSync) {
		/* Warning: this method OPTIONALLY requires the Daemon.prototype.syncStart() method */
		return this[bSync ? "start" : "syncStart"](true);
	};

	Daemon.prototype.move = function (bSync, nCycles, bDirection) {
		/* Warning: this method OPTIONALLY requires the Daemon.prototype.syncStart() method */
		if (arguments.length > 1 && !isNaN(nCycles)) { this.reversals = Number(nCycles); }
		this[bSync ? "start" : "syncStart"](arguments.length > 2 ? bDirection : this.isAtEnd() !== this.BACKW);
	};

	Daemon.prototype.turn = function (bSync) {
		/* Warning: this method OPTIONALLY requires the Daemon.prototype.syncStart() method */
		this[bSync ? "start" : "syncStart"](!this.BACKW);
	};

		/* Settings tools */

	Daemon.prototype.makeLoop = function () {
		this.reversals = Infinity;
	};

	Daemon.prototype.unmakeLoop = function () {
		this.reversals = 0;
	};

	Daemon.prototype.setRate = function (vTo) {
		var nRate = Number(vTo);
		if (!isFinite(nRate) || nRate < 1) { return; }
		this.rate = nRate;
		this.synchronize();
	};

	Daemon.prototype.forcePosition = function (vTo) {
		if (isFinite(vTo)) { this.INDEX = Math.round(Math.abs(vTo)); }
	};

	Daemon.prototype.getDuration = function () {
		return this.rate * this.length;
	};

	Daemon.prototype.getDirection = function () {
		return this.isAtEnd() !== this.BACKW;
	};

	Daemon.prototype.getPosition = function () {
		return this.INDEX;
	};

		/* Instantaneous movement (synchronous). */

	Daemon.prototype.makeSteps = function (nHowMany, bReverse, bForce) {
		if (nHowMany === 0) { return true; }
		if (isNaN(nHowMany)) { return false; }
		var nIdx = 0, nLen = Math.round(Math.abs(nHowMany)), bContinue = true, bBackw = nHowMany > 0 === Boolean(bReverse);
		this.BACKW = bBackw;
		for (nIdx; nIdx < nLen && bContinue; nIdx++) {
			if (this.BACKW === bBackw && this.isAtEnd()) {
				if (this.reversals > 0) { this.BACKW = bBackw = !this.BACKW; }
				else { break; }
			}
			bContinue = Daemon.forceCall(this) || bForce;
		}
		return nIdx === nLen;
	};

	Daemon.prototype.skipTo = function (nIdx, bForce) {
		/* Warning: this method requires the Daemon.prototype.makeSteps() method */
		if (nIdx === this.INDEX) { return; }
		if (isFinite(this.length) && nIdx < 0 || nIdx > this.length) { return; }

		var
			bDirection = (this.INDEX !== 0 && this.INDEX !== this.length) === this.BACKW,
			bSuccess = this.makeSteps(this.INDEX - nIdx, true, bForce);

		if (this.INDEX !== 0 && this.INDEX !== this.length) { this.BACKW = bDirection; }
		return bSuccess;
	};

	Daemon.prototype.skipFor = function (nDelta, bForce) {
		/* Warning: this method requires the Daemon.prototype.makeSteps() method */
		return this.makeSteps(nDelta, this.isAtEnd() !== this.BACKW, bForce);
	};

	Daemon.prototype.close = function (bReverse, bForce) {
		/* Warning: this method requires the Daemon.prototype.makeSteps() method */
		if (!isFinite(this.length)) { return false; }
		this.pause();
		this.reversals = 0;
		return this.makeSteps(bReverse ? this.INDEX : this.length - this.INDEX, bReverse, bForce);
	};

	Daemon.prototype.reclose = function (bForce) {
		/* Warning: this method requires the Daemon.prototype.makeSteps() and Daemon.prototype.close() methods */
		return this.close(this.isAtEnd() !== this.BACKW, bForce || false);
	};

	/* Others */

	Daemon.prototype.restart = function () {
		this.stop();
		this.start();
	};

	Daemon.prototype.loopUntil = function (vDate) {
		if (!isFinite(this.length)) { return; }
		var nTime = vDate.constructor === Date ? vDate.getTime() : isNaN(vDate) ? Date.parse(vDate) : vDate;
		if (isFinite(nTime) && nTime > Date.now()) {
			this.reversals = Math.floor((nTime - Date.now() - (this.BACKW ? this.INDEX : this.length - this.INDEX) * this.rate) / (this.length * this.rate));
			this.start(this.isAtEnd() !== this.BACKW);
		}
	};

	Daemon.prototype.spread = function (nTime) {
		if (!isFinite(this.length)) { throw new TypeError("Daemon.prototype.spread - the length is not a finite number. Use Daemon.prototype.adaptLength()."); }
		if (nTime > 0) {
			this.rate = Math.floor(nTime / this.length);
			this.synchronize();
		}
		return this.rate;
	};

	Daemon.prototype.adaptLength = function (nTime) {
		this.length = Math.floor(nTime / this.rate);
		return this.length;
	};

	Daemon.prototype.playUntil = function (vDate) {
		var nTime = vDate.constructor === Date ? vDate.getTime() : isNaN(vDate) ? Date.parse(vDate) : vDate;
		if (isFinite(nTime) && nTime > Date.now()) {
			this.length = Math.floor((nTime - Date.now()) / this.rate) + this.INDEX;
			this.pause();
			this.start();
		}
		return this.length;
	};
