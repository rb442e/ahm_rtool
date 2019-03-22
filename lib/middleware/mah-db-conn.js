/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const debug = require('debug')('app:login');
const sql = require('mssql');
//const dbConfig2 = require('../../app-config').dbConfig;

const userName = '2159539709';
const dbConfig = {
    user: 'phruser',
    password: 'phruser',
    server: '172.20.11.54',
    port: 55407,
    database: 'DEVMAH'
};


const middleware = require('../../../middleware/index');
const ahmCommon = require('../../../ahm-common/index');
const esbClient = require('../../app-config').esbClient;

module.exports = {
    dbConn
};

// makes a call to ESB Soap webservice
function dbConn(req, res, next) {
}