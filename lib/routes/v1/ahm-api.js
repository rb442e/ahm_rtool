/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';
const _ = require('lodash');
const debug = require('debug')('app:global-search');
const middleware = require('../../middleware/index');
const sendResponse = middleware.sendResponse.defaultResponse;
const acceptContentTypes = middleware.acceptContent.defaultTypes;
const transformData = middleware.transformData;
const ahmCommon = require('../../ahm-common/index');

const mockResponse = require('../../app-config').mock;
const JSON = 'json';
module.exports = function (routeModuleDef) {
    return globalSearch(routeModuleDef);
};
function globalSearch(routeModuleDef) {
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
            acceptContentTypes
        ],
        routeHandlers: [
            blankMemberId,
            composeQuery,
            ahmHandler.search,
            prepareResponse,
            sendResponse
        ]
    };
    function composeQuery(req, res, next) { //res.locals.test = 100;

        //reading original query coming to search-api from UI.
        debug('Original URI from UI', req.originalUrl);
        const pathQueryName = _.camelCase(routeModuleDef.path);
        const routeQuery = routeQueries.getQuery(pathQueryName);
        let qry, routeUrl;
        switch (pathQueryName) {
            case 'goals':
                qry = _.replace(_.replace(_.replace(routeQuery.mahQuery, '&', req.query.memberId),
                    '#goalId', req.query.goalId), '#instance', req.query.instance);
                routeUrl = `${qry}?LanguageCode=${routeQuery.languageCode}`;
                break;
            case 'activities':
                qry = _.replace(_.replace(_.replace(routeQuery.mahQuery, '&', req.query.memberId),
                    '#activityId', req.query.activityId), '#instance', req.query.instance);
                routeUrl = `${qry}?LanguageCode=${routeQuery.languageCode}`;
                break;
            default:
                qry = _.replace(routeQuery.mahQuery, '&', req.query.memberId);
                routeUrl = `${qry}?LanguageCode=${routeQuery.languageCode}`;
        }
        debug('routeUrl: ', routeUrl);
        res.locals.searchQuery = routeUrl;
        res.locals.pathQueryName = pathQueryName;
        next();
    }
}
function prepareResponse(req, res, next) {

    const serviceName = res.locals.pathQueryName;
    if (res.locals.searchResult.body) {
        switch (serviceName) {
            case 'healthAssessments':
                res.locals.clientResult = transformData.hraQandA(res.locals.searchResult.body);
               // res.locals.clientResult = transformData.hraResponse(res.locals.searchResult.body);
                break;
            case 'goals':
                res.locals.clientResult = transformData.behaviorResponse(res.locals.searchResult.body);
                break;
            default:
                res.locals.clientResult = res.locals.searchResult.body;
        }
    }
    next();
}
function blankMemberId(req, res, next) {
    if (!(req.query.memberId) || _.isEqual(req.query.memberId, '')) {
        res.locals.clientResult = mockResponse;
        res.locals.searchResult = {};
        res.locals.searchResult.type = 'json';
        sendResponse(req, res, next);
    } else {
        next();
    }
}
