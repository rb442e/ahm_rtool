/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');
const cuid = require('cuid');
const urlParse = require('url-parse');
const onHeaders = require('on-headers');
const debug = require('debug')('app:reporting');

const localStats = require('../routes/admin').localStats;

const appUtil = require('../util');
const Timer = appUtil.Timer;
const statsd = require('../statsd');
const appLog = require('../app-log');

function getStatusType(statusCode) {
    return statusCode / 100 | 0;
}

function doLocalRequestStats(req, res, time) {
    localStats.updateStats(res.statusCode, time);
    debug('localStats: %s', JSON.stringify(localStats.getStats()));
}

/**
 * Sends various stats to the statsd service. Note the intent of these stats is to identify interesting trends
 * and not to debug specific problems. The logs should contain the detail needed for such debugging.
 *
 * @param req
 * @param res
 * @param time
 */
function doRequestStats(req, res, time) {

    if (res.locals.isReported) {
        return;
    }

    const url = urlParse(req.originalUrl);

    const statusType = getStatusType(res.statusCode);

    if (statusType === 2) {

        const statUrl = _.trim(url.pathname.toLowerCase().replace(/\//g, '_'), '_');

        const endpoint = `request.url.${statUrl}`;

        statsd.timing(endpoint, time);

        statsd.increment(endpoint);

        statsd.increment(`request.method.${req.method.toLowerCase()}`);

        statsd.increment('request.succeeded');

    } else if (statusType === 4) {

        statsd.increment(`request.http.${res.statusCode}`);
        statsd.increment('request.failed');
    }

    statsd.increment(`request.app.${res.locals.appId}`);

    res.locals.isReported = true;

}

function doRequestLogging(req, res, time) {

    if (!res.locals.isLogged) {
        appLog.info({
            requestId: res.locals.requestId,
            appId: res.locals.appId,
            req, res, duration: time,
        });
        res.locals.isLogged = true;
    }
}

function requestReporting() {

    return function doReporting(req, res, next) {

        const timer = new Timer();

        res.locals.requestId = cuid();

        _.set(res.locals, 'logInfo', {});

        res.locals.isLogged = false;

        res.locals.isReported = false;

        res.locals.timing = {};

        onHeaders(res, () => {

            const time = timer.getElapsedTime();

            doLocalRequestStats(req, res, time);
            doRequestStats(req, res, time);
            doRequestLogging(req, res, time);
        });

        next();
    };
}

module.exports = {
    getStatusType,
    requestReporting,
};
