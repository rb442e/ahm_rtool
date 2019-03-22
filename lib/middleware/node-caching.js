/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const NodeCache = require( "node-cache" ),
    debug = require('debug')('app:node-caching');
const siteMapCache = new NodeCache();
const cacheTimeOut = require('../app-config').cacheConfig;
const sendResponse = require('./send-response');

module.exports = {
    hasCache,
    getResponseFromCache,
    setResponseToCache
};


    function hasCache(res) {
        let isCache = undefined;
        if(res.locals.pathQueryName && siteMapCache.get(res.locals.pathQueryName)) {
            isCache = true;
        }
        return isCache;
    }

    function getResponseFromCache(req, res, next) {

        debug('Response from Node Cache...');
        res.locals.clientResult = siteMapCache.get(res.locals.pathQueryName);
        res.locals.searchResult = {};
        res.locals.searchResult.type = 'xml';
        sendResponse.defaultResponse(req, res, next);
    }

    function setResponseToCache(res) {

        siteMapCache.set(res.locals.searchQuery.queryName, res.locals.clientResult, cacheTimeOut, (err, success) => {
            if (!err && success) {
                debug('queryName saved to cache: ', res.locals.searchQuery.queryName);
                debug('cache status: ', success);
            }
        });
    }