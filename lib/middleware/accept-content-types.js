/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');
const debug = require('debug')('app:accept-content-types');

const reporting = require('./reporting');
const statsd = require('../statsd');
const errors = require('../errors');

const searchConfig = require('../app-config').searchConfig;

const defaultMediaTypes = searchConfig.get('defaultMediaTypes');
const textMediaTypes = searchConfig.get('textMediaTypes');

module.exports = {
    defaultTypes,
    textTypes,
};


/**
 * Verify accept header format is allowed by GlobalSearch services
 * Returns 406 error if not
 *
 * @param req
 * @param res
 * @param next
 */
function defaultTypes(req, res, next) {

    debug('defaultTypes');

    if (!req.accepts(defaultMediaTypes)) {
        statsd.increment('request.invalid.accept.content-type');
        const err = new errors.InvalidAcceptContentType();
    } else if (!acceptsSolrWtParam(res, ['json'])) {
        statsd.increment('request.invalid.solr.wt');
        const err = new errors.InvalidSolrWtType();
        next(err);
    } else {
        next();
    }
}

function textTypes(req, res, next) {

    debug('textTypes');

    if (!req.accepts(textMediaTypes)) {
        statsd.increment('request.invalid.accept.content-type');
        const err = new errors.InvalidAcceptContentType();
    } else if (!acceptsSolrWtParam(res, ['csv'])) {
        statsd.increment('request.invalid.solr.wt');
        const err = new errors.InvalidSolrWtType();
        next(err);
    } else {
        next();
    }
}

/**
 * Check the 'wt' params that may have been included in request query or body.
 * Important Notes:
 *      Assumption is that function consolidateRequestData has already been executed. This function
 *      creates single object named res.locals.requestData that contains both the query and body key-value pairs
 *
 *      Multiple wt params can (and unfortunately sometimes are) be included in the request.
 *      Therefore the 'wt' key may be an array of values.
 *
 * @param res
 * @param acceptableWtTypes
 * @returns {boolean}
 */
function acceptsSolrWtParam(res, acceptableWtTypes) {

    const wtValues = _.castArray(_.get(res.locals.requestData, 'wt', []));

    if (!_.isEmpty(wtValues)) {
        return _.every(wtValues, (val) => _.includes(acceptableWtTypes, val));
    } else {
        return true;
    }

}

