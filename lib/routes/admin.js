/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

// TODO: determine how to remove admin queries from restClient/solr stats

const path = require('path');
const os = require('os');
const dateFormat = require('dateformat');
const express = require('express');
const _ = require('lodash');
const co = require('co');
const basicAuth = require('basic-auth');
const debug = require('debug')('app:admin');

const appLog = require('../app-log');

const errors = require('../errors');
const messages = require('../messages.json');

const fusion = require('../middleware/restClient');
const localStats = require('./local-stats');

const config = require('../app-config');
const adminConfig = config.adminConfig;
const appConfig = config.appConfig;

const queryDefsFileName = `${appConfig.queryDefinitionDir}/admin.json`;
const routeQueries = require(path.resolve(queryDefsFileName));

module.exports = {
    createRouter,
    localStats,
    __test__: {
        isValidUser,
        authenticateUser,
    }
};

function createRouter() {

    const router = express.Router();

    router.use(authenticateUser);

    router.get(adminConfig.pingPath, doPing);

    router.get(adminConfig.healthCheckPath, doHealthCheck);

    router.post(adminConfig.appControlPath, doAppControl);

    router.use((req, res, next) => {
        res.status(404).send({ errorMessage: messages.ROUTE_NOT_FOUND });
    });

    return router;
}

function isValidUser(user) {
    const foundMatch = _.find(adminConfig.authorizedUsers, v => _.isMatch(v, user));
    return !!foundMatch;
}

function authenticateUser(req, res, next) {
    //added for bypassing authentication middleware
    if (_.isEqual(req.baseUrl, '/search/healthcheck')) {
        return next();
    }

    debug('authenticateUser');
    const user = basicAuth(req);

    if (user && isValidUser(user)) {
        return next();
    } else {
        const errMsg = { error: '401 - Missing or Invalid User ID' };
        appLog.warn(errMsg);
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).send(errMsg);
    }

}

function createAdminResponseBody(msg) {

    const now = new Date();

    return {
        message: msg,
        hostname: os.hostname(),
        time: dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT')
    };
}

function doPing(req, res, next) {

    debug('doPing');

    res.status(200).send(createAdminResponseBody(adminConfig.pingMsg));
}

function doHealthCheck(req, res, next) {

    debug('doHealthCheck');

    if (req.app.locals.searchEnabled) {

        co(function *() {
            const query = _.get(routeQueries, adminConfig.healthCheckQueryName);
            if (!query) {
                throw new errors.InvalidAppConfig();
            }
            yield fusion.fusionRequest(query);

            res.status(200).send(
                _.assign(createAdminResponseBody(adminConfig.serviceUpMsg),
                    { stats: localStats.getStats() }));

        }).catch((err) => {
            appLog.error({ err: err });
            const errMsg = { error: `Fusion request failed with ${err.message}` };
            res.status(500).send(
                _.assign(createAdminResponseBody(adminConfig.serviceDownMsg), errMsg));
        });

    } else {
        res.status(500).send(createAdminResponseBody(adminConfig.serviceDisabledMsg));
    }

}

function doAppControl(req, res, next) {

    debug('doAppControl');

    debug('search-enabled = %s', req.body['search-enabled']);

    req.app.locals.searchEnabled = req.body['search-enabled'] === 'true';

    res.status(200).send(
        _.assign(createAdminResponseBody(adminConfig.appControlMsg),
            { 'DE Search Service Enabled': req.app.locals.searchEnabled }));

}
