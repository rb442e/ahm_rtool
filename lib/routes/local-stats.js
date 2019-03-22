/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');

const debug = require('debug')('app:local-stats');

const stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    invalidRequests: 0,
    minResponseTime: Number.MAX_VALUE,
    maxResponseTime: 0,
    lastResponseTime: 0,
    invalidStats: 0,
};

module.exports = {
    getStats,
    updateStats,
};

function getStats() {
    const statsCopy = _.clone(stats);
    statsCopy.minResponseTime = statsCopy.minResponseTime === Number.MAX_VALUE ? 0 : statsCopy.minResponseTime;
    return statsCopy;
}

function updateStats(statusCode, time) {
    const statusType = statusCode / 100 | 0;
    incrTotal();
    incrResponseType(statusType);
    if (statusType === 2) {
        updateResponseTime(time);
    }
}

function updateResponseTime(time) {

    stats.lastResponseTime = time;
    if (time < stats.minResponseTime) {
        stats.minResponseTime = time;
    }
    if (time > stats.maxResponseTime) {
        stats.maxResponseTime = time;
    }
}

function incrTotal() {
    stats.totalRequests++;
}

function incrResponseType(statusType) {

    if (statusType === 2) {
        stats.successfulRequests++;
    } else if (statusType === 4) {
        stats.invalidRequests++;
    } else if (statusType === 5) {
        stats.failedRequests++;
    } else {
        stats.invalidStats++;
    }
}
