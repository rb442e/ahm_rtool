/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const debug = require('debug')('app:error-handler');

const appLog = require('../app-log');
const statsd = require('../statsd');

const returnErrorDetails = require('./../app-config').returnErrorDetails;

const errors = require('../errors');
const errorMsgs = require('../messages.json');

/**
 * This module defines handlers for 'no matching routes' and errors
 * To understand how this code works, read http://expressjs.com/en/guide/error-handling.html
 * Some things to keep in mind:
 *  * Middleware insertion order matters, and error handing needs to be added last
 *  * Error handlers are defined by the method signature having 4 args instead of the usual 3.
 *  * The extra arg is the first, 'err'
 *
 * @param app
 */
module.exports = [
    send404,
    logErrors,
    reportErrors,
    errorHandler,
];

// handles any requests not previously handled by the express app (route not found)
function send404(req, res, next) {
    debug(`sending 404 - ${req.url}`);

    statsd.increment('response.http.404');
    statsd.increment('request.failed');
    res.locals.isReported = true;

    const error = new errors.InvalidRoute();

    appLog.warn({ req: req, res: res, err: error });
    res.locals.isLogged = true;

    res.status(404).send({ errorMessage: errorMsgs.ROUTE_NOT_FOUND });
}

function logErrors(err, req, res, next) {

    if (!res.locals.isLogged) {

        if (err instanceof errors.AppError && err.isClientError()) {
            appLog.warn({ req: req, res: res, err: err });
        } else {
            appLog.error({ req: req, res: res, err: err });
        }

        res.locals.isLogged = true;
    }

    next(err);
}

/**
 * Report to statsd frequency of errors by err.message and err.status.
 *
 * Note that statsd reporting is not intended for debugging these errors; error logging should
 * be used for this purpose.
 *
 * @param err
 * @param req
 * @param res
 * @param next
 */
function reportErrors(err, req, res, next) {

    statsd.increment(`error.msg.${err.message}`);
    /*
        1)  AppError objects will have err.type
        2)  Network failures, timeouts, and other errors that produce no response will
            contain err.code
        3)  Failed HTTP requests will have err.status
     */
    statsd.increment(`error.type.${err.type || err.code || err.status}`);

    next(err);
}

function errorHandler(err, req, res, next) {

    if (res.headersSent) {
        // headers already sent so delegate to Express default error handling
        return next(err);
    }

    const responseMsg = {};

    if (err instanceof errors.AppError) {
        responseMsg.errorStatus = err.getStatusCode();
        debug('AppError Message >>>>>>>>>>>>>>>> ', err.message);
        debug('Error stack >>>>>>>>>>>>>>>> ', err.stack);
    } else {
        debug('Error Message >>>>>>>>>>>>>>>> ', err.message);
        debug('Error stack >>>>>>>>>>>>>>>> ', err.stack);

        responseMsg.errorStatus = 500;
    }

    if (returnErrorDetails) {
        responseMsg.errorType = err.type || 'Error';
        responseMsg.errorMessage = err.message || errorMsgs.APP_FAILURE;
        responseMsg.errorDetails = err.details || err.stack || err.toString();
    }

    statsd.increment(`response.http.${responseMsg.errorStatus}`);
    statsd.increment('request.failed');

    debug(responseMsg);

    return res.status(responseMsg.errorStatus).send(responseMsg);

}

