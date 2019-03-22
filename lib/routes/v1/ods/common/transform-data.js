/**
 * Created by rbhatnagar on 4/17/2018.
 */
'use strict';
const debug = require('debug')('app:transform-data');
const _ = require('lodash');
const apiData = require('./transform-api-data');
module.exports = {
    fetchData,
    processApiData,
    queryPattern
};
/* fetchData(): This is the generic function to get the data from ODS, All the request
 * Should flow through it.
 * */
function fetchData(result) {
    const metaData = result.metaData;
    const colName = _.transform(metaData, function (resp, val) {
        resp.push(val.name);
        return resp;
    }, []);
    const rows = result.rows;
    const dataObj = [];
    if (!_.eq(rows.length, 0)) {
        _.each(rows, (row) => {
            const response = {};
            for (let i = 0; i < row.length; i++) {
                response[colName[i]] = row[i];
            }
            dataObj.push(response);
        });
        return dataObj;
        //commenting below code: returning array instead of object so that it is easy to populate on screens on UI
        /*return _.reduce(dataObj, (res, value, key) => {
            res[key] = value;
            return res;
        }, {});*/
    } else {
        return { status: 401, statusMessage: 'No data found in ODS' };
    }
}
function processApiData(req, res, next) {
    //let resp = {};
    /*switch (res.locals.qryNm) {
        case 'getmemberdetails':
            resp = apiData.memberDetails(fetchData(res.locals.result));
            break;
        case 'getmemberdata':
            resp = apiData.memberDetails(fetchData(res.locals.result));
            break;
        default:
            resp = fetchData(res.locals.result);
    }*/
    return fetchData(res.locals.result);
}
function queryPattern(req) {
    return (_.split(_.split(req.originalUrl, '/')[3], '?')[0]).toLowerCase();
}
