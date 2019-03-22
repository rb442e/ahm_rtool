/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

//
// MODULES
//----------------------------------------------------------------------------------------------------------------------

/**
 * Starting this probe during automated testing can cause build tools like gulp to hang
 */
/* istanbul ignore next */
if (!process.env.unit_testing && !process.env.integration_testing) {
    require('ca-apm-probe').start();
}

// node core modules
const http = require('http');

// npm modules
const express = require('express');
const bodyParser = require('body-parser');
const compress = require('compression');
const _ = require('lodash');
const co = require('co');
const debug = require('debug')('app:main');

// app modules
const middleware = require('./lib/middleware');

const errorHandler = middleware.errorHandler;
const appLog = require('./lib/app-log');
//const dbConfig = require('./lib/routes/v1/login-api/db-config').prod;

const expressConfig = require('./lib/app-config').expressConfig;
const serverConfig = require('./lib/app-config').serverConfig;

const searchRouter = require('./lib/routes/ahm-router');
const adminRouter = require('./lib/routes/admin');

// Startup message
const startMsg = `starting app with NODE_ENV=${process.env.NODE_ENV}, DEBUG=${process.env.DEBUG}`;
console.log(startMsg);
appLog.info(startMsg);

// Create express app
const app = express();

// set general logging for the app - uses bunyan
app.locals.log = appLog;

// TODO: the admin services must not be publicly accessible
// used by admin to turn search services on and off
app.locals.searchEnabled = true;

/* istanbul ignore else */
// configure express
if (expressConfig) {
    (function (stanza) {
        _.forOwn(stanza, (value, key) => {
            app.set(key, value);
        });

    }(expressConfig));
}

//----------------------------------------------------------------------------------------------------------------------
//
// App root level middleware
// NOTE: Middleware functions are executed sequentially, therefore the order of middleware inclusion is important!!!!!
//----------------------------------------------------------------------------------------------------------------------

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// compress (gzip) HTTP response bodies
app.use(compress());

//----------------------------------------------------------------------------------------------------------------------
//
// Request routing
//----------------------------------------------------------------------------------------------------------------------

// mount the admin routes
app.use('/admin', adminRouter.createRouter());

app.use('/search/healthcheck', adminRouter.createRouter());

// mount the search service routes
app.use('/', searchRouter.createRouter());

// This must be attached after primary routes are established
app.use(errorHandler);

// module exports
module.exports = app;

//----------------------------------------------------------------------------------------------------------------------
//
// Conditional server start
//----------------------------------------------------------------------------------------------------------------------

/* istanbul ignore next */
function startServer() {
    console.log('Starting app server on port %s', (serverConfig.ports.http || 3001));
    return http.createServer(app).listen(parseInt(serverConfig.ports.http, 10) || 3001);
}

/* istanbul ignore if */
if (require.main === module) {  // this means app.js was run directly by node

    co(function *() {

        try {
            // application was run directly, start an instance of the app server (single core and vulnerable to failure)
            console.log('App called directly from node');

            startServer();
            const msg = 'App is running; press ctrl-c to exit.';
            appLog.info(msg);
            console.log(msg);

        } catch (err) {
            const msg = 'App failed to initialize; exiting';
            appLog.error(msg);
            console.log(msg);
        }

    }).catch((err) => {

        console.log('App startup failed with unexpected error: %s', JSON.stringify(err));

        appLog.error(err, 'App startup failed with unexpected error; exiting');

    });
} else {
    console.log('App required as a module');
}

