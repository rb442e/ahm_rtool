'use strict';

const debug = require('debug')('app:retry');

const retryConfig = require('../app-config').retryConfig;

const defaultCount = retryConfig.get('defaultCount');
const defaultFactor = retryConfig.get('defaultFactor');
const defaultInterval = retryConfig.get('defaultInterval');

require('util').inherits(NoRetryError, Error);

module.exports = retry;
module.exports.NoRetryError = NoRetryError;

function *retry(fn, opts) {

    const options = opts || {};

    const retries = 'retries' in options ? options.retries : defaultCount;
    const factor = 'factor' in options ? options.factor : defaultFactor;

    let interval = 'interval' in options ? options.interval : defaultInterval;
    let attempts = retries + 1;

    while (true) {
        try {
            return yield fn();
        } catch (err) {

            if (err instanceof NoRetryError) {
                throw err;
            } else {

                attempts--;
                if (!attempts) {
                    debug('no more attempts left - throwing error');
                    throw err;
                }

                debug('%s attempts remaining; waiting %s for next attempt', attempts, interval);

                yield wait(interval);
                interval = interval * factor;
            }
        }
    }
}

/**
 * Wait for `ms` milliseconds.
 *
 * @param {Number} ms
 * @return {Function}
 */
function wait(ms) {
    return function (done) {
        setTimeout(done, ms);
    };
}

function NoRetryError() {

    this.name = this.constructor.name;
    this.type = 'NoRetryError';
    this.message = 'Error cannot be resolved by retrying function';
    Error.captureStackTrace(this, this.constructor);
}
