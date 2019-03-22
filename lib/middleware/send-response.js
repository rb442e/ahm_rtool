/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const _ = require('lodash');
const xml = require('js2xmlparser');
//const xml2js = require('xml2js').parseString;
const debug = require('debug')('app:send-response');

const errors = require('../errors');

module.exports = {
    defaultResponse,
    sendResponse
};

function defaultResponse(req, res, next) {
    switch (res.locals.searchResult.type) {
        case 'text':
            res.setHeader('Content-Type', 'text/plain');
            res.send(res.locals.clientResult);
            break;
        case 'xml':
            res.setHeader('Content-Type', 'application/xml');
            res.send(res.locals.clientResult);
            break;
        default:
            res.setHeader('Content-Type', 'application/json');
            res.send(res.locals.clientResult);
    }

   /* res.format({
        'application/json': function () {
            res.send(res.locals.clientResult);
        },

        'application/xml': function () {
            res.send(xml('searchResponse', _.get(res.locals.clientResult, 'response')));
        },

        'default': function () {
            // log the request and respond with 406 status code - Not Acceptable
            const error = new errors.InvalidAcceptContentType();
            next(error);
        }
    });*/
}

/**
 * Used for requests use Solr query param "wt=csv" instead of HTTP Accept header to specify response format.
 * Therefore we cannot use Express res.format handler approach.
 *
 * Assumption is that res.locals.clientResult is a text string containing Solr response body as csv
 *
 * @param req
 * @param res
 * @param next
 */
function sendResponse(req, res, next) {

    //res.setHeader('Content-Type', 'application/json');
    res.send(res.locals.clientResult);
}

