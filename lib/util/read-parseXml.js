'use strict'

const debug = require('debug')('app:login');
const soap = require('soap');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');


const parser = new xml2js.Parser();
const filePath = path.join('./soapRequest.xml');

module.exports = {
    parseXML
};

function parseXML() {
    fs.readFile(filePath, function (err, data) {
        xml2js.parseString(data, function (err, result) {
            debug('my result::: ', result);
        });
    });
}
