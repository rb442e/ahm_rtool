/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const superagent = require('superagent');
const _ = require('lodash');
const co = require('co');
const urlParse = require('url-parse');
const debug = require('debug')('app:restClient');

const appUtil = require('../util');
const Timer = appUtil.Timer;
const errors = require('../errors');
const appLog = require('../app-log');
const statsd = require('../statsd');

const ahmCommon = require('../ahm-common');
const queryString = ahmCommon.queryString;

const mahConfig = require('../app-config').mahConfig;
const fusionUser = mahConfig.get('auth.user');
const fusionPassword = mahConfig.get('auth.pass');

const baseUri = `http://${mahConfig.host}/${mahConfig.baseQueryPath}`;
const statsPrefix = 'restClient';

module.exports = {
    search,
    multiSearch,
    fusionRequest,
    test: {
        getQueryPath,
    }
};

function getQueryPath(query) {
    return `${query.pipelineId}/collections/${query.collectionName}/${query.handler}`;
}

function search(req, res, next) {

    co(function *() {
        try {
            res.locals.searchResult = yield fusionRequest(res.locals.searchQuery);
            next();
        } catch (err) {
            appLog.error({ req: req, res: res, err: err });
            res.locals.isLogged = true;
            next(err);
        }

    }).catch((err) => {
        /* istanbul ignore next */
        appLog.error({ req: req, res: res, err: err });
        res.locals.isLogged = true;
        /* istanbul ignore next */
        next(err);
    });
}

function multiSearch(req, res, next) {

    const fusionRequests = [];

    _.each(res.locals.searchQueries, (q) => fusionRequests.push(fusionRequest(q)));

    co(function *() {
        try {
            res.locals.searchResult = yield fusionRequests;
            next();
        } catch (err) {
            appLog.error({ req: req, res: res, err: err });
            res.locals.isLogged = true;
            next(err);
        }

    }).catch((err) => {
        /* istanbul ignore next */
        appLog.error({ req: req, res: res, err: err });
        res.locals.isLogged = true;
        /* istanbul ignore next */
        next(err);
    });

}

/**
 * Returns the segments of the URL path we want to use for statsD. An Example:
 *
 * For the fusionUrl path = /api/apollo/query-pipelines/query_rules/collections/globalsearch_q/select
 * we return 'query_rules.globalsearch_q'
 *
 * @param fusionUrl
 * @returns {*}
 */
function getStatsQueryPath(fusionUrl) {

    const url = urlParse(fusionUrl);
    const pathSegments = _.split(url.pathname, '/');

    if (pathSegments.length >= 7) {
        return `${pathSegments[4]}.${pathSegments[6]}`;
    } else {
        return url.pathname;
    }

}

/**
 *
 * Following the conventions for SuperAgent, the result returned will have the following properties:
 *      searchResult.type - the content type returned by Fusion
 *  Then either:
 *      searchResult.body - the parsed Fusion search results, provided the results could be parsed.
 *  Or:
 *      searchResult.text - the unparsed Fusion search results if the Fusion response could not be parsed.
 *
 * @param fusionQuery
 * @returns {{}}
 */
function *fusionRequest(fusionQuery) {

    const fusionUrl = `${baseUri}/${fusionQuery}`;
    //const fusionUrl = 'http://mahbz.azprd.ahmcert.com/MAHBusinessServices/v1/members/0/health-assessments?source=MEMBER&MemberCEID=1091374281&MemberCumbId=205375870&LanguageCode=ES';

    debug('fusionRequest URL: %s', fusionUrl);

/*    const qpStr = queryString(fusionQuery.solrQuery);
    debug('fusionRequest POST Params: %s', qpStr);

    const statsQueryPath = getStatsQueryPath(fusionUrl);*/

    try {

        const timer = new Timer();

        const fusionResponse = yield superagent
            .get(fusionUrl)
            //.auth(fusionUser, fusionPassword)
            //.type('application/x-www-form-urlencoded')
            //.accept(fusionQuery.acceptType || 'json');
            //.send(qpStr);

        const time = timer.getElapsedTime();

/*        statsd.timing(`${statsPrefix}.query.${statsQueryPath}`, time);
        statsd.increment(`${statsPrefix}.query.${statsQueryPath}.succeeded`);*/

        const searchResult = {};

        if (!_.isEmpty(fusionResponse.body)) {
            searchResult.type = 'json';
            searchResult.body = fusionResponse.body;
            return searchResult;
        } else if (fusionResponse.text) {
            if (appUtil.isJsonString(fusionResponse.text)) {
                searchResult.type = 'json';
                searchResult.body = JSON.parse(fusionResponse.text);
            } else {
                searchResult.type = 'text';
                searchResult.text = fusionResponse.text;
            }
            return searchResult;
        } else {
            throw new errors.InvalidFusionResponseError('Missing Fusion response body or text');
        }

    } catch (err) {

        debug('fusionRequest failed with err=%s', err.status || err.code);

        //statsd.increment(`${statsPrefix}.query.${statsQueryPath}.failed`);

        if (err instanceof errors.AppError) {
            throw err;
        } else {
            throw new errors.FusionFailure(err);
        }

    }
}
