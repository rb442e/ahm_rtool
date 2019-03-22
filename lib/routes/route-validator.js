/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');
const appUtil = require('../util');
const appLog = require('../app-log');
const debug = require('debug')('app:search-route-validator');

const routeValidation = require('../app-config').routeValidationConfig;

const reqRouteDefKeys = routeValidation.get('reqRouteDefKeys');
const reqRouteModDefKeys = routeValidation.get('reqRouteModDefKeys');
const optRouteModDefKeys = routeValidation.get('optRouteModDefKeys');
const reqRouteModKeys = routeValidation.get('reqRouteModKeys');
const optRouteModKeys = routeValidation.get('optRouteModKeys');

module.exports = {
    isValidRouteDefinition,
    isValidRouteModule,
};

/**
 * Validate the route definition.
 *
 * Every route definition must have:
 *  - The keys as defined in reqRouteDefKeys
 *  - The routeModules value must be a non-empty array
 *  - Every element in this array have the keys reqRouteModDefKeys
 *
 * @param routeDefs
 * @returns {*|boolean}
 */
function isValidRouteDefinition(routeDef) {

    const validations = {
        routeDefHasAllReqKeys: appUtil.hasEvery(routeDef, reqRouteDefKeys),
        routeDefHasOnlyReqKeys: appUtil.hasOnly(routeDef, reqRouteDefKeys),
        routeModulesIsArray: _.isArray(routeDef.routeModules),
        routeModulesNotEmpty: !_.isEmpty(routeDef.routeModules),
        routeModulesHaveAllReqKeys: appUtil.everyElementHasEvery(routeDef.routeModules, reqRouteModDefKeys),
        routeModulesHaveOnlyAllowedKeys: appUtil.everyElementHasOnly(routeDef.routeModules,
            _.concat(reqRouteModDefKeys, optRouteModDefKeys))
    };

    let passedValidation = true;

    _.each(validations, (val, key) => {
        if (!val) {
            passedValidation = false;
            const msg = `routeDef '${routeDef.name}' validation failure: ${key}`;
            debug(msg);
            appLog.error(msg);
        }
    });

    return passedValidation;
}

/**
 * Validate the route module
 *
 * Every routeModule must have:
 *  - keys as defined in reqRouteModKeys
 *  - value for each of these keys must be an array
 *  - all elements of these arrays are functions
 *
 * @param routeModule
 * @returns {*|boolean}
 */
function isValidRouteModule(routeModule) {

    const validations = {
        routeModuleHasAllReqKeys: appUtil.hasEvery(routeModule, reqRouteModKeys),
        routeModuleHasOnlyAllowedKeys: appUtil.hasOnly(routeModule, _.concat(reqRouteModKeys, optRouteModKeys))
    };

    let passedValidation = true;

    _.each(validations, (val, key) => {
        if (!val) {
            passedValidation = false;
            const msg = `routeModule '${routeModule.name}' validation failure: ${key}`;
            debug(msg);
            appLog.error(msg);
        }
    });

    return passedValidation;
}

