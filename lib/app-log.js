/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

/*
 Bunyan logging levels:
 Level Name : trace, Level Number : 10
 Level Name : debug, Level Number : 20
 Level Name : info, Level Number : 30
 Level Name : warn, Level Number : 40
 Level Name : error, Level Number : 50
 Level Name : fatal, Level Number : 60
 */

const mkdirp = require('mkdirp');
const _ = require('lodash');

const loggingConfig = require('./app-config').loggingConfig;
const appConfig = require('./app-config').appConfig;

const root = process.cwd();

/**
 * If we are doing unit testing then turn off logging.
 */
module.exports = (function () {

    // TODO: should be using a value from config json
    if (process.env.unit_testing === 'true') {
        console.log('app-log using stub logging!');
        return createStubLogging();
    } else {
        return createBunyanLogging();
    }

}());

function createStubLogging() {

    return {
        info: function infoStub() {},
        error: function errorStub() {},
        warn: function warnStub() {},
    };
}

function createBunyanLogging() {

    const bunyan = require('bunyan');

    /* istanbul ignore next */
    const logDir = (loggingConfig.logDir.indexOf('/') === 0) ?
        loggingConfig.logDir : `${root}/${loggingConfig.logDir}`;

    mkdirp.sync(logDir);

    const infoLogger = bunyan.createLogger({
        name: `${appConfig.name}.info`,
        serializers: {
            req: reqSerializer,
            res: resSerializer,
            err: errSerializer
        },
        streams: [
            {
                type: 'rotating-file',
                level: 'info',
                path: `${logDir}/${appConfig.alias}.info.log`,
                period: '1d',   // daily rotation
                count: loggingConfig.logCount
            }
        ]
    });

    const errorLogger = bunyan.createLogger({
        name: `${appConfig.name}.error`,
        serializers: {
            req: reqSerializer,
            res: resSerializer,
            err: errSerializer
        },
        streams: [
            {
                type: 'rotating-file',
                level: 'warn',
                path: `${logDir}/${appConfig.alias}.error.log`,
                period: '1d',   // daily rotation
                count: loggingConfig.logCount
            }
        ]
    });

    function infoLog() {
        /*
         Why are we doing this you might ask?

         Well if we do this:

         infoLogger.info(arguments)

         then within the bunyan function "info", which also uses the arguments object,
         we end up with arguments[0] set to the arguments in this function.
         The effect becomes that the first argument to this function ends
         up being passed into the "info" function as arguments[0][0] instead of arguments[0],
         and the serialization support does not work correctly.

         So infoLogger.info.apply(infoLogger, arguments) lets our infoLogger.info function
         be called with the same arguments as the "info" function in this module.
         */

        infoLogger.info.apply(infoLogger, arguments);
    }

    function errorLog() {
        errorLogger.error.apply(errorLogger, arguments);
    }

    function warnLog() {
        errorLogger.warn.apply(errorLogger, arguments);
    }

    /**
     * We return these wrapper functions rather than the bunyan functions to we can change the logger
     * associated with info, error or warn without changing the client code
     */
    return {
        info: infoLog,
        error: errorLog,
        warn: warnLog
    };

}

/**
 * Serialize Express Request
 *
 * @param req
 * @returns {*}
 */
function reqSerializer(req) {

    if (!req || !req.connection) {
        return req;
    } else {

        const serReq = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: req.connection.remoteAddress,
            remotePort: req.connection.remotePort,
        };

        // TODO: the properties picked below can be moved to the config
        // TODO: should we just log all the query request data
        if (_.has(req, 'query') && !_.isEmpty(req.query)) {
            const reqQueryToLog = _.pick(req.query, ['q', 'start', 'rows']);
            if (!_.isEmpty(reqQueryToLog)) {
                serReq.query = reqQueryToLog;
            }
        }

        if (_.has(req, 'body') && !_.isEmpty(req.body)) {
            const reqBodyToLog = _.pick(req.body, ['q', 'start', 'rows']);
            if (!_.isEmpty(reqBodyToLog)) {
                serReq.body = reqBodyToLog;
            }
        }

        return serReq;

    }
}

/**
 * Serialize Express Response
 *
 * @param res
 * @returns {*}
 */
function resSerializer(res) {

    if (!res) {
        return res;
    } else {

        const serRes = {
            requestId: res.locals.requestId,
            statusCode: res.statusCode,
            header: res._headers,
        };

        if (_.has(res, 'locals.logInfo') && !_.isEmpty(res.locals.logInfo)) {
            const securityDataToLog = _.pick(res.locals.logInfo.security,
                ['unknownQPs', 'unknownBPs', 'badRequestData']);
            if (!_.isEmpty(securityDataToLog)) {
                serRes.security = securityDataToLog;
            }
        }

        return serRes;
    }
}

/**
 * Serialize Errors
 *
 * @param err
 * @returns {*}
 */
function errSerializer(err) {

    if (!err) {
        return err;
    } else {

        const serialErr = _.assign({}, _.pick(err, [
            'type', 'name', 'message', 'msg', 'status', 'code', 'syscall', 'signal',
            'req', 'error', 'stack'
        ]));

        if (_.has(err, 'response.body') && !_.isEmpty(err.response.body)) {
            serialErr.body = _.assign({}, _.pick(err.response.body, [
                'cause', 'class', 'details', 'error', 'httpStatusCode', 'httpStatusMessage',
            ]));
        }

        if (_.has(err, 'details') && !_.isEmpty(err.details)) {
            serialErr.details = _.assign({}, err.details);
        }

        return serialErr;
    }
}
