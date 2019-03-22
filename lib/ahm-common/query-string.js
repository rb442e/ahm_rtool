/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';

const _ = require('lodash');

const debug = require('debug')('app:query-string');

const fixQPMatcher = /[&%+]/;
const percentileMatcher = /[%]/;

module.exports = queryString;

module.exports.__test__ = {
    fixQPValue,
    fixQueryParams
};

function queryString(queryParams) {

    let qpStr = '';

    fixQueryParams(queryParams);

    _.forOwn(queryParams, (qpVal, qpKey) => {
        if (_.isArray(qpVal)) {
            _.forEach(qpVal, av => {
                qpStr += `${qpKey}=${av}&`;
            });
        } else {
            qpStr += `${qpKey}=${qpVal}&`;
        }
    });

    qpStr = _.trimEnd(qpStr, '&');

    debug('qpStr: %s', qpStr);

    return qpStr;
}

function fixQPValue(qpVal) {

    let newValue = qpVal;

    if (percentileMatcher.test(qpVal) && _.endsWith(qpVal, '%')) {
        newValue = _.replace(newValue, '%', '%25');
    }
    newValue = _.replace(newValue, /\#/g, '%23');
    newValue = _.replace(newValue, /\!/g, '%21');
    newValue = _.replace(newValue, /\&/g, '%26');
    newValue = _.replace(newValue, '+', ' ');

    return newValue;
}

function fixQueryParams(queryParams) {

    _.forOwn(queryParams, (qpVal, qpKey) => {

        if (_.isArray(qpVal)) {

            _.forEach(qpVal, (qpArrVal, i) => {
                if (fixQPMatcher.test(qpArrVal)) {
                    queryParams[qpKey][i] = fixQPValue(qpArrVal);
                }
            });

        } else {
            if (fixQPMatcher.test(qpVal)) {
                queryParams[qpKey] = fixQPValue(qpVal);
            }
        }

    });
}

