/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';
const _ = require('lodash');
const debug = require('debug')('app:processMemberData');
const middleware = require('../../../middleware/index');
const sendResponse = middleware.sendResponse.defaultResponse;
const ahmCommon = require('../../../ahm-common/index');
const db = require('./common/callODSdb');
const transformData = require('./common/transform-data');
const mockResponse = require('../../../app-config').mock;
module.exports = function (routeModuleDef) {
    const routeQueries = new ahmCommon.RouteQueries(routeModuleDef);
    const ahmHandler = ahmCommon.ahmHandler(routeModuleDef);
    /**
     * Return middleware and route handlers for this route module.
     * Note that order of the functions in the two arrays matters.
     * These function are loaded in order, and the functions loaded
     * first are also executed first
     */
    return {
        name: module.id,
        middleware: [
            //acceptContentTypes,
        ],
        routeHandlers: [
            validateRequest,
            prepareQry,
            db.callODS,
            prepareResponse,
            middleware.sendResponse.sendResponse
        ]
    };
    function prepareQry(req, res, next) {
        debug('Inside prepareQry() function');
        const qryNmPattern = transformData.queryPattern(req);
        const qryNmRegEx = new RegExp(qryNmPattern);
        let query = _.filter(routeQueries.queries, (val, key) => qryNmRegEx.test(key))[0];

        if (_.includes(req.originalUrl, 'crosswalk')) {

            const cumbId = `'${req.query.memberId}'`;
            query = _.replace(query, '&cumbId', cumbId);
        } else if (_.includes(query, '&memberId')) {

            query = _.replace(query, '&memberId', req.query.memberId);
        }
        debug('query: ', query);
        res.locals.qry = query;
        res.locals.qryNm = qryNmPattern;
        next();
    }

    function prepareResponse(req, res, next) {
        res.locals.clientResult = transformData.processApiData(req, res, next);
        next();
    }

    function validateRequest(req, res, next) {
        if (!(req.query.memberId) || _.isEqual(req.query.memberId, '')) {

            res.locals.clientResult = mockResponse;
            res.locals.searchResult = {};
            res.locals.searchResult.type = 'json';

            sendResponse(req, res, next);

        } else {

            next();
        }
    }
};

