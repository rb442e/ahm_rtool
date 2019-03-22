/**
 * Created by rbhatnagar on 5/15/2018.
 */

'use strict';

const oracledb = require('oracledb');
const debug = require('debug')('app:callODSdb');
const dbConfig = require('./../../../db-config/db-config-ods').prod;

module.exports = {
    callODS
};

function callODS(req, res, next) {

    oracledb.getConnection(dbConfig, function (err, connection) {
        if (err) {
            console.error(err.message);
            console.error(err.stack);
            return;
        }
        connection.execute(res.locals.qry, function (err, result) {
            if (err) {
                console.error(err.message);
                doRelease(connection);
                return;
            }
            debug(result.rows);
            res.locals.result = result;
            doRelease(connection);
            next();
        });
    });
}

function doRelease(connection) {
    connection.close(
        function (err) {
            if (err) {console.error(err.message);}
        });
}
