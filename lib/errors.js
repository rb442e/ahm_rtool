/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');
const errorTypes = require('./error-types.json');
const messages = require('./messages.json');

/* eslint-disable no-multi-spaces */
const typeToStatus = _.cond([
    [_.matches({ type: errorTypes.client.badRoute }),             _.constant(404)],
    [_.matches({ type: errorTypes.client.requestContentTypes }),  _.constant(415)],
    [_.matches({ type: errorTypes.client.acceptContentTypes }),   _.constant(406)],
    [_.matches({ type: errorTypes.client.solrWtParamType }),      _.constant(406)],
    [_.matches({ type: errorTypes.client.invalidSearch }),        _.constant(400)],
    [_.matches({ type: errorTypes.client.invalidAppId }),         _.constant(400)],
    [_.stubTrue,                                                  _.constant(500)]
]);

// TODO: create new subtypes ClientError and ServerError

function extractDetails(causalErrorInfo) {

    /*
     superagent errors may include following objects:
     err.response
     err.response.body
     err.response.req
     err.response.request
     */

    // TODO: try _.defaultsTo here

    if (_.isObject(causalErrorInfo)) {

        const details = _.assign({}, _.pick(causalErrorInfo, [
            'type', 'name', 'message', 'msg', 'status', 'code', 'syscall', 'signal',
            'req', 'error', 'stack'
        ]));

        if (_.has(causalErrorInfo, 'response.body') && !_.isEmpty(causalErrorInfo.response.body)) {
            _.assign(details, _.pick(causalErrorInfo.response.body, [
                'cause', 'class', 'details', 'error', 'httpStatusCode', 'httpStatusMessage',
            ]));
        }

        const filteredDetails = _.omitBy(details, (val) => _.isNil(val));
        return filteredDetails;

    } else {
        return causalErrorInfo;
    }
}

class AppError {

    constructor(type, message, causalErrorInfo) {

        this.type = type;
        this.message = message;
        this.details = extractDetails(causalErrorInfo);

        this.status = typeToStatus(this);

        Error.captureStackTrace(this, AppError);
    }

    isClientError() {
        return _.includes(errorTypes.client, this.type);
    }

    isServerError() {
        return _.includes(errorTypes.server, this.type);
    }

    getStatusCode() {
        return this.status;
    }

    toString() {
        return JSON.stringify(this);
    }
}

class InvalidRouteModule extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.invalidRouteModule, messages.INVALID_ROUTE_MODULE, causalErrorInfo);
    }
}

class InvalidAppConfig extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.appConfig, messages.APP_CONFIG_ERROR, causalErrorInfo);
    }
}

class InvalidAppId extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.invalidAppId, messages.INVALID_APP_ID, causalErrorInfo);
    }
}

class InvalidAcceptContentType extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.acceptContentTypes, messages.ACCEPT_CONTENT_TYPES, causalErrorInfo);
    }
}

class InvalidSolrWtType extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.solrWtParamType, messages.ACCEPT_SOLR_WT_TYPES, causalErrorInfo);
    }
}

class InvalidRequestContentType extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.requestContentTypes, messages.REQUEST_CONTENT_TYPES, causalErrorInfo);
    }
}

class InvalidRoute extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.badRoute, messages.ROUTE_NOT_FOUND, causalErrorInfo);
    }
}

class InvalidSearch extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.invalidSearch, messages.INVALID_SEARCH, causalErrorInfo);
    }
}

class InvalidSolrQueryVarRequest extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.client.solrQueryVarNotReplaced, messages.SOLR_QUERY_VAR_FAILURE, causalErrorInfo);
    }
}

class InvalidFusionResponseError extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.invalidFusionResponse, messages.FUSION_FAILURE, causalErrorInfo);
    }
}

class InvalidSolrResponseError extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.invalidSolrResponse, messages.SOLR_FAILURE, causalErrorInfo);
    }
}

class FusionFailure extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.fusionFailure, messages.FUSION_FAILURE, causalErrorInfo);
    }
}

class SolrFailure extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.solrFailure, messages.SOLR_FAILURE, causalErrorInfo);
    }
}

class SearchDisabled extends AppError {

    constructor(causalErrorInfo) {
        super(errorTypes.server.searchDisabled, messages.SEARCH_DISABLED, causalErrorInfo);
    }
}

module.exports = {
    AppError,
    InvalidAppConfig,
    InvalidRouteModule,
    InvalidAppId,
    InvalidAcceptContentType,
    InvalidSolrWtType,
    InvalidRequestContentType,
    InvalidRoute,
    InvalidSolrQueryVarRequest,
    InvalidSearch,
    InvalidFusionResponseError,
    InvalidSolrResponseError,
    FusionFailure,
    SolrFailure,
    SearchDisabled,
};
