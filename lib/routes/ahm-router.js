/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

/**
 * Mounts middleware and route handlers using routing definitions from json files.
 * Currently uses glob matcher to find all files matching '*-routes.json' in the config.routeDir
 * Routing definition json files must contain the following information:
 *  -skip: if true then route modules are not loaded
 *  -basePath: base path to use for routeModule paths
 *  -routeModules: array of route module definitions. Cannot be empty
 *
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const _ = require('lodash');
const glob = require('glob');
const debug = require('debug')('app:ahm-router');

const middleware = require('../middleware');
const security = middleware.security;
const requestData = middleware.requestData;
const reporting = middleware.reporting;

const appLog = require('../app-log');
const errors = require('../errors');

const validator = require('./route-validator');

const appConfig = require('../app-config').appConfig;

module.exports = {
    createRouter,
    __test__: {
        addRouterMiddleware,
        checkSearchDisabled,
        getRouteFiles,
        loadRouteDefinition,
        loadRouteModule,
        mountRoute,
    }
};

/**
 * Loads, validates and mounts the search routes
 *
 * @param
 */
function createRouter() {

    const router = express.Router();

    /*-------------------------------------------------------------------------
     Middleware to be used by all search routes
     ------------------------------------------------------------------------*/

    addRouterMiddleware(router);

    /*-------------------------------------------------------------------------
     Find, load, validate and mount the search routes
     ------------------------------------------------------------------------*/
    const routes = _.reduce(getRouteFiles(), (arr, rf) => _.concat(arr, loadRouteDefinition(rf)), []);

    /**
     * We filter out invalid route definitions, continuing to load the valid route definitions
     * @type {Array}
     */
    const validRouteDefs = _.filter(routes, (r) => validator.isValidRouteDefinition(r) && !r.skip);

    _.each(validRouteDefs, (rd) => {

        const routeModules = _.reduce(rd.routeModules, (arr, rm) => _.concat(arr, loadRouteModule(rm)), []);

        /**
         * Within a route definition, all the route modules must be valid to proceed with mounting
         */
        if (_.every(routeModules, (rm) => validator.isValidRouteModule(rm))) {
            _.each(routeModules, (rm) => mountRoute(router, rd.basePath, rm));
        } else {
            const error = new errors.InvalidRouteModule(rd);
            appLog.error({ err: error });
        }

    });

    return router;
}

function addRouterMiddleware(router) {

    router.use(reporting.requestReporting());

    // sets one or more HTTP response headers prefixed with 'Access-Control-"
    // for more info see:
    //  * https://github.com/expressjs/cors
    //  * http://www.html5rocks.com/en/tutorials/cors/
    router.use(cors());

    /* istanbul ignore else */
    // security-related response headers
    // for more info see https://github.com/helmetjs/helmet
    // may a simpler alternative to lusca for a stateless api
    if (process.env.NODE_ENV !== 'development') {
        router.use(helmet());
        router.use(helmet.frameguard({ action: 'deny' }));
    }

    router.use(checkSearchDisabled);

    // verifies request is acceptable, cleans up any suspicious data
    router.use(security.middleware);

}

function checkSearchDisabled(req, res, next) {

    if (req.app.locals.searchEnabled) {
        next();
    } else {
        const error = new errors.SearchDisabled();
        next(error);
    }
}

function getRouteFiles() {
    return glob.sync(`${appConfig.routeDefinitionDir}/${appConfig.routeMatcher}`);
}

/**
 * Load and validate the route definition json file
 * @param routeFile
 * @returns {*}
 */
function loadRouteDefinition(routeFile) {
    const routeDef = require(path.resolve(routeFile));
    routeDef.name = routeFile;
    return routeDef;
}

/**
 * Load and validate the route module specified by the routeModuleDef
 *
 * @param routeModuleDef
 * @returns {*}
 */
function loadRouteModule(routeModuleDef) {

    /*
        If routeModuleDef.module starts with "/" we strip it since that' considered an absolute path
        and path.resolve will not create the correct final absolute path.
     */
    const modulePath = path.resolve(appConfig.routeModuleDir, _.trimStart(routeModuleDef.module, '/'));

    /*
        If the routeModuleDef has a queryDefs property, then use that for the
        name of the query definitions file, else use the name of the route module
     */
    if (!routeModuleDef.queryDefs) {
        routeModuleDef.queryDefs = path.parse(modulePath).name;
    }

    const routeModule = require(modulePath)(routeModuleDef);

    /*
        New properties I'm adding to the routeModule object from the routeModuleDef
        to make mounting the routeModule easier
     */
    _.assign(routeModule, _.pick(routeModuleDef, [
        'path', 'pathParams'
    ]));

    return routeModule;
}

/**
 * Mount the endpoints for this route routeModule.
 * Uses Express 4.x router objects.
 * Supports GET and POST methods to allow for large query payloads associated with
 * complex Solr queries.
 *
 * NOTE: At some point we may be able to remove the need to support POST once the search-api
 * takes over the responsibility for generating the Fusion/Solr queries.
 * For now we need to support applications that generate most of the query requests on their
 * own, and thus the need to allow the of POST.
 *
 * @param app - our Express app
 * @param basePath - the basePath property from the *-routes.json file
 * @param modulePath - the routeModules[n].path property from the *-routes.json file
 * @param routeModule - the routeModules[n].routeModule property from the *-routes.json file
 */
function mountRoute(router, basePath, routeModule) {

    const fullPath = `${appConfig.context}${basePath}${routeModule.path}${routeModule.pathParams ? routeModule.pathParams : ''}`;
    debug(`Mounting ${fullPath} using handler ${routeModule.name}`);

    if (!_.isEmpty(routeModule.middleware)) {
        router.use(fullPath, routeModule.middleware);
    }

    router.route(fullPath)
        .get(routeModule.routeHandlers)
        .post(routeModule.routeHandlers);

}
