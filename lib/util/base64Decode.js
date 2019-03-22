'use strict'

const basicAuth = require('basic-auth');

module.exports = {
    base64decoder
};

function base64decoder(req) {
    return basicAuth(req);
}
