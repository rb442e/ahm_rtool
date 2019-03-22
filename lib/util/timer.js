'use strict';

const _ = require('lodash');

module.exports = Timer;

function Timer() {
    this.startTime = process.hrtime();
}

/**
 * The diff value will contain tuple representing high resolution time:
 *  diff[0] = time in seconds
 *  diff[1] = remaining time in nanoseconds
 *
 *  To return elapsed time in milliseonds the ht tuple is processes as follows:
 *  diff[0] * 1000:     this converts the time in seconds to milliseconds
 *  diff[0] / 1000000:  this converts remaining time in nanoseconds to milliseconds
 *
 *  The two are added together to get the result.
 *
 * @returns {number} - Elapsed time in milliseconds
 */
Timer.prototype.getElapsedTime = function () {
    const diff = process.hrtime(this.startTime);
    return diff[0] * 1e3 + diff[1] * 1e-6;
};

Timer.prototype.getElapsedTimeStr = function () {
    return `${_.floor(this.getElapsedTime(), 2)} ms`;
};

