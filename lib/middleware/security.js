/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

/**
 * App security related custom Express middleware
 *
 * Note that consolidateRequest should always be last.
 *
 * The suggested order is:
 *  1) checkClientAppId
 *  2) allowedRequestContentTypes
 *  3) allowedAcceptContentTypes
 *  4) deleteUnknownRequestData
 *  5) sanitizeRequestData
 *  6) consolidateRequestData
 *
 */

const _ = require('lodash');
const debug = require('debug')('app:security');
const requestIs = require('type-is');
const stripTags = require('striptags');

const config = require('../app-config');
const searchConfig = config.searchConfig;
const clientConfig = config.clientConfig;
const securityConfig = config.securityConfig;

const statsd = require('../statsd');
const errors = require('../errors');

const requestContentTypes = searchConfig.get('requestContentTypes');
const acceptContentTypes = searchConfig.get('acceptContentTypes');

/**
 * Module API
 *
 * @type {{middleware: *[], test_checkClientAppId: checkClientAppId,
 * test_allowedRequestContentTypes: allowedRequestContentTypes,
 * test_allowedAcceptContentTypes: allowedAcceptContentTypes,
 * test_deleteUnknownRequestData: deleteUnknownRequestData,
 * test_sanitizeRequestData: sanitizeRequestData, test_consolidateRequestData: consolidateRequestData}}
 */
module.exports = {
    middleware: [
        checkClientAppId,
        allowedRequestContentTypes,
        allowedAcceptContentTypes,
        deleteUnknownRequestData,
        sanitizeRequestData,
    ],
    test: {
        checkClientAppId,
        allowedRequestContentTypes,
        allowedAcceptContentTypes,
        deleteUnknownRequestData,
        sanitizeRequestData,
        acceptContentTypes
    },
};

/**
 * Verify app id provided (unless running in development mode) as either
 * a query parameter or request header.
 * Returns 403 error if value missing or not in list of accepted app-ids
 *
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function checkClientAppId(req, res, next) {

    debug('checkClientAppId');

    if (process.env.NODE_ENV !== 'development') {

        res.locals.appId = req.header(clientConfig.appIdHeader) || req.query[clientConfig.appIdQueryParam];

        if (!res.locals.appId || !_.includes(clientConfig.acceptedAppIds, res.locals.appId)) {
            statsd.increment('request.invalid.app-id');

            const error = new errors.InvalidAppId();
            return next(error);
        }
    }

    return next();
}

/**
 * Verify request content type header format is allowed by app
 * Returns 415 error if not
 *
 * @param req
 * @param res
 * @param next
 */
function allowedRequestContentTypes(req, res, next) {

    debug('allowedRequestContentTypes');

    if (!_.isEmpty(req.body)) {

        if (requestIs(req, requestContentTypes)) {
            next();
        } else {

            statsd.increment('request.invalid.body.content-type');

            const error = new errors.InvalidRequestContentType();
            next(error);
        }

    } else {
        next();
    }
}

/**
 * Verify accept header format is allowed by app
 * Returns 406 error if not
 *
 * @param req
 * @param res
 * @param next
 */
function allowedAcceptContentTypes(req, res, next) {

    debug('allowedAcceptContentTypes');

    if (req.accepts(acceptContentTypes)) {
        next();
    } else {

        statsd.increment('request.invalid.accept.content-type');

        const error = new errors.InvalidAcceptContentType();
        next(error);
    }
}

/**
 * Delete any unexpected/unknown request body and query parameters
 *
 * @param req
 * @param res
 * @param next
 */
function deleteUnknownRequestData(req, res, next) {

    debug('deleteUnknownRequestData');

    debug('before deleting unknown query params: %s', JSON.stringify(req.query));

    const badQPKeys = _.difference(_.keys(req.query), searchConfig.supportedSolrQueryParams);

    if (!_.isEmpty(badQPKeys)) {

        req.query = _.omit(req.query, badQPKeys);

        statsd.increment('request.invalid.query-params');
        if (securityConfig.logBadKeys) {
            _.set(res.locals, 'logInfo.security.unknownQPs', _.join(badQPKeys));
        }
    }

    debug('after deleting unknown query params: %s', JSON.stringify(req.query));

    debug('before deleting unknown body properties: %s', JSON.stringify(req.body));

    const badBPKeys = _.difference(_.keys(req.body), searchConfig.supportedSolrQueryParams);

    if (!_.isEmpty(badBPKeys)) {

        req.body = _.omit(req.body, badBPKeys);

        statsd.increment('request.invalid.body-params');
        if (securityConfig.logBadKeys) {
            _.set(res.locals, 'logInfo.security.unknownBPs', _.join(badBPKeys));
        }
    }

    debug('unknown deleting unknown body properties: %s', JSON.stringify(req.body));

    next();
}

function safeStripTags(value) {

    if (_.isString(value)) {
        return stripTags(value);
    } else {
        return value;
    }
}

/**
 * Remove any HTML tags from the request body, query parameters and headers
 *
 * @param req
 * @param res
 * @param next
 */
function sanitizeRequestData(req, res, next) {

    debug('before sanitizing query params: %s', JSON.stringify(req.query));

    let origData;

    if (securityConfig.logBadValues) {

        origData = _.assign(_.stubObject(), _.cloneDeep(req.query), _.cloneDeep(req.body));

        _.each(['cookie', 'user-agent', 'host', 'referer'], (header) => {
            if (req.headers[header]) {
                _.set(origData, header, req.headers[header]);
            }
        });

    }

    // sanitize all query params
    _.forOwn(req.query, (val, key) => {

        if (!_.isArray(val)) {
            req.query[key] = safeStripTags(req.query[key]);
        } else {
            _.each(val, (iVal, i) => {
                req.query[key][i] = safeStripTags(req.query[key][i]);
            });
        }
    });

    debug('after sanitizing query params: %s', JSON.stringify(req.query));

    if (!_.isEmpty(req.body)) {

        debug('before sanitizing body: %s', JSON.stringify(req.body));

        _.forOwn(req.body, (val, key) => {

            if (!_.isArray(val)) {
                req.body[key] = safeStripTags(req.body[key]);
            } else {
                _.each(val, (iVal, i) => {
                    req.body[key][i] = safeStripTags(req.body[key][i]);
                });
            }
        });

        debug('after sanitizing body: %s', JSON.stringify(req.body));

    }

    // sanitize all cookies and headers that might be reflected in browser
    _.each(['cookie', 'user-agent', 'host', 'referer'], (header) => {
        req.headers[header] = safeStripTags(req.headers[header]);
    });

    if (securityConfig.logBadValues) {

        const badData = {
            query: {},
            body: {},
            headers: {},
        };

        _.forOwn(req.query, (val, key) => {

            if (!_.isArray(val) && origData[key] !== val) {
                badData.query[key] = origData[key];
            } else {
                const badArr = [];
                _.each(val, (iVal, i) => {
                    if (origData[key][i] !== iVal) {
                        badArr.push(origData[key][i]);
                    }
                });
                if (badArr.length) {
                    badData.query[key] = badArr;
                }
            }
        });

        _.forOwn(req.body, (val, key) => {

            if (!_.isArray(val) && origData[key] !== val) {
                badData.body[key] = origData[key];
            } else {
                const badArr = [];
                _.each(val, (iVal, i) => {
                    if (origData[key][i] !== iVal) {
                        badArr.push(origData[key][i]);
                    }
                });
                if (badArr.length) {
                    badData.body[key] = badArr;
                }
            }
        });

        _.each(['cookie', 'user-agent', 'host', 'referer'], (header) => {
            if (req.headers[header] && origData[header] !== req.headers[header]) {
                badData.headers[header] = origData[header];
            }
        });

        if (!_.isEmpty(badData.query)) {
            _.set(res.locals, 'logInfo.security.badRequestData.query', badData.query);
            statsd.increment('request.invalid.query-param-data');
        }

        if (!_.isEmpty(badData.body)) {
            _.set(res.locals, 'logInfo.security.badRequestData.body', badData.body);
            statsd.increment('request.invalid.body-data');
        }

        if (!_.isEmpty(badData.headers)) {
            _.set(res.locals, 'logInfo.security.badRequestData.headers', badData.headers);
            statsd.increment('request.invalid.header-data');
        }
    }

    next();
}
