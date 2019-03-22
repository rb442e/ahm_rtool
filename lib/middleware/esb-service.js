/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const debug = require('debug')('app:esb-service');
const soap = require('soap');
const esbClient = require('../app-config').esbClient;

module.exports = {
    callESB
};

// makes a call to ESB Soap webservice
function callESB(req, res, next) {

    const processServiceAction = res.locals.esbRequest;
    soap.createClient(esbClient.wsdl, function (err, client) {
        client.processServiceAction(processServiceAction, function (err, result, body) {
            debug('result', result);
            res.locals.esbResponse = result;
            next();
        });
    });
}
