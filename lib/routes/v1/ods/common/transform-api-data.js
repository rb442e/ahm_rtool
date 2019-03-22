/**
 * Created by rbhatnagar on 12/22/2018.
 */
'use strict';
const debug = require('debug')('app:transform-api-data');
const _ = require('lodash');
const mapObj = require('map-obj');
module.exports = {
    memberDetails,
};
function memberDetails(data) {
    const dataArr = [];
    const dataObj = {};
    /*_.each(data, (key, val) => {
        if (_.eq(key.MEMBERTYPECODE, 'Employee')) {
            const resp = {};
            resp.employee = key;
            dataArr.push(resp);
        } /!*else {
            const resp = {};
            //resp.depandent = key;
            _.assign(resp, val);
            dataArr.push(resp);
        }*!/
    });*/
/*    _.reduce(dataArr, (resp, val, key) => {
        _.each(dataArr, (valu) => {
            let count = 0;
            if (_.isObject(valu.depandent)) {
                let dep = {};
                dep = valu.depandent;
                valu[count] = dep;
                //delete valu.depandent;
            }
            _.assign(dataObj, valu);
            count++;
        });
    }, {});*/
    //debug('dataObj: ', dataObj);
    return data;
}