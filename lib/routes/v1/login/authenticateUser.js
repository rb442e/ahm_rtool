/**
 * Created by rbhatnagar on 5/13/2018.
 */

'use strict';
const _ = require('lodash');
const debug = require('debug')('app:authenticateUser');
const middleware = require('../../../middleware/index');
const sendResponse = middleware.sendResponse.defaultResponse;
const acceptContentTypes = middleware.acceptContent.defaultTypes;
const transformData = middleware.transformData;
const ahmCommon = require('../../../ahm-common/index');

const mockResponse = require('../../../app-config').mock;
const userSchema = require('./../../../models/userLogin');
const conn = middleware.mongoDBConn;

const JSON = 'json';
module.exports = function (routeModuleDef) {
    return authenticateUser(routeModuleDef);
};
function authenticateUser(routeModuleDef) {
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
            validateBody,
            composeQuery,
            ahmHandler.search,
            prepareResponse,
            sendResponse
        ]
    };
    function composeQuery(req, res, next) {

        //reading original query coming to search-api from UI.
        debug('Original URI from UI', req.originalUrl);
        const email = req.body.email;
        const password = req.body.password;

        const User = conn.model('userLogin', userSchema);

        //See if the user with the given email exists
        User.findOne({ email: email }, (err, existingUser) => {
            if (err) {
                return next(err);
            } else if (existingUser) {
                return res.status(422).send({ error: 'Email is already in use' });
            } else {
                const user = new User({
                    email: email,
                    password: password
                });

                user.save((error) => {
                    if (error) {
                        return next(err);
                    } else {
                        return res.json({ status: 'Success' });
                    }
                });
                return null;
            }
        });

        //If a user with email does exists, return error

        //If a user with email does NOT exists, create and save the user record

        //Respond to the request indicating the user was created


        //res.locals.searchQuery = routeUrl;
        //res.locals.pathQueryName = pathQueryName;
        //next();
    }
}
function prepareResponse(req, res, next) {

    const serviceName = res.locals.pathQueryName;
    if (res.locals.searchResult.body) {
        switch (serviceName) {
            case 'healthAssessments':
                res.locals.clientResult = transformData.hraResponse(res.locals.searchResult.body);
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
function validateBody(req, res, next) {
    if (!(req.body.email) || _.isEqual(req.body.email, '') ||
    !(req.body.password) || _.isEqual(req.body.password, '')) {
        res.locals.clientResult = mockResponse;
        res.locals.searchResult = {};
        res.locals.searchResult.type = 'json';
        sendResponse(req, res, next);
    } else {
        next();
    }
}

