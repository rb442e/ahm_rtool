/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';

const path = require('path');
const _ = require('lodash');
const debug = require('debug')('app:route-queries');

const appUtil = require('../util');
const appConfig = require('../app-config').appConfig;
const errors = require('../errors');

const queryValidationConfig = require('../app-config').queryValidationConfig;

module.exports = RouteQueries;

function RouteQueries(routeModuleDef) {

    const queryDefsFileName = `${appConfig.queryDefinitionDir}/${routeModuleDef.queryDefs}.json`;
    debug('For route %s using query definitions %s', routeModuleDef.path, queryDefsFileName);

    this.queries = require(path.resolve(queryDefsFileName));
}

RouteQueries.prototype.validateQuery = function (fusionQuery) {
    // TODO: consider adding "hasOnly" validation as well and testing for required value types
    // TODO: could do this by adding support for optional value validator func to hasEvery
    // TODO: then we split keys up into string, object, boolean, etc.
    //return appUtil.hasEvery(fusionQuery, requiredKeys);
};

RouteQueries.prototype.defaults = function () {
    return _.cloneDeep(_.get(this.queries, 'defaults', {}));
};

RouteQueries.prototype.getQuery = function (fusionQueryName) {

    const routeQuery = _.get(this.queries, fusionQueryName, null);

    const mergedQuery = this.configureQuery(_.cloneDeep(routeQuery));

    return mergedQuery;
};

RouteQueries.prototype.getMatchingQueries = function (queryNamePattern) {

    debug('looking up queries using queryNamePattern "%s"', queryNamePattern);

    const queryNameRegEx = new RegExp(queryNamePattern);

    const matchingQueries = _.filter(this.queries, (val, key) => queryNameRegEx.test(key));

    const mergedQueries = [];
    _.each(matchingQueries, (q) => {
        mergedQueries.push(this.configureQuery(_.cloneDeep(q)));
    });

    return mergedQueries;
};

RouteQueries.prototype.configureQuery = function (query) {

    if (_.isNil(query) || _.isEmpty(query)) {
        throw new errors.InvalidAppConfig('query arg is missing or empty');
    }

    // merge route defaults and query defaults

    const routeDefaults = this.defaults();

    // Adding { solrQuery: {} } provides a minor optimization by not attempting to copy
    // property solrQuery from sources that will be handled in the second statement
    const mergedQuery = _.defaults({ solrQuery: {} }, query, routeDefaults);
    mergedQuery.solrQuery = _.defaults({}, query.solrQuery, routeDefaults.solrQuery);

    this.validateQuery(mergedQuery);

    /* istanbul ignore else */
    if (!_.get(mergedQuery.solrQuery, 'debug', false)) {
        _.unset(mergedQuery.solrQuery, 'debug');
    }

    /* istanbul ignore else */
    if (_.get(mergedQuery.solrQuery, 'echoParams', 'none') === 'none') {
        _.unset(mergedQuery.solrQuery, 'echoParams');
    }

    return mergedQuery;

};
