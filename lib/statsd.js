/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

const StatsD = require('node-statsd');


/**
 * Attempting to send stats to StatsD using the node-statsd client can result in gulp and perhaps other tools
 * hanging after executing unit tests that use this reporting module. To avoid this we set mock option=true
 * if the environment variable 'unit_testing' or 'integration_testing' has been set.
 *
 * Setting mock=true probably makes sense even without the handing issue since we should not be attempting
 * to record stats during automated testing.
 */
let statsdConfig;

// TODO: these values should probably be coming from config json
// TODO: this needs to be tested during integration testing
/* istanbul ignore next */
if (process.env.unit_testing || process.env.integration_testing) {
    console.log('setting statsdConfig mock=true');
    statsdConfig = {
        mock: true
    };
} else {
    /* istanbul ignore next */
    statsdConfig = require('./app-config').statsdConfig;
}

module.exports = (function () {
    return new StatsD(statsdConfig);
}());

