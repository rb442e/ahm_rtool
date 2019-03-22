/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';

const _ = require('lodash');
const appConfig = require('../app-config').appConfig;
const middleware = require('../middleware');
const errors = require('../errors');

module.exports = function ahmHandler(routeModuleDef) {

    let ahmHandlerName;
    if (routeModuleDef.searchType) {
        ahmHandlerName = routeModuleDef.searchType;
    } else {
        ahmHandlerName = appConfig.defaultSearchType;
    }

    if (_.has(middleware, ahmHandlerName)) {
        return _.get(middleware, ahmHandlerName);
    } else {
        throw new errors.InvalidAppConfig();
    }
};
