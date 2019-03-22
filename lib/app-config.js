/**
 * Created by rbhatnagar on 5/15/2018.
 */
'use strict';

module.exports = (function () {

    // TODO: need to be using config.get as often as possible to take advantage of config module assertions that
    // config element exists.

    /* istanbul ignore next */
    /**
     * Allows node-config to be used without generating errors or warnings
     * when node app is managed by pm2. Problem related conflict between
     * pm2 and node-config usage of NODE_APP_INSTANCE.
     *
     * For more info see https://github.com/lorenwest/node-config/issues/210
     *
     * @returns {Config}
     */
    function pm2SafeNodeConfig() {

        // Moving NODE_APP_INSTANCE aside during configuration loading
        const argAppInstance = process.argv.NODE_APP_INSTANCE;
        const envAppInstance = process.env.NODE_APP_INSTANCE;
        delete process.argv.NODE_APP_INSTANCE;
        delete process.env.NODE_APP_INSTANCE;
        const config = require('config');
        process.argv.NODE_APP_INSTANCE = argAppInstance;
        process.env.NODE_APP_INSTANCE = envAppInstance;

        return config;
    }

    const config = pm2SafeNodeConfig();

    const appConfig = config.get('app');
    const serverConfig = config.get('server');
    const expressConfig = config.get('express');
    const adminConfig = config.get('admin');
    const searchConfig = config.get('paramSupported');
    const clientConfig = config.get('clients');
    const mahConfig = config.get('mahHost');
    const loggingConfig = config.get('logging');
    const statsdConfig = config.get('statsd');
    const securityConfig = config.get('security');
    const routeValidationConfig = config.get('routeValidation');
    const retryConfig = config.get('retry');
    const cacheConfig = config.get('nodeCacheTimeOut');
    const mock = config.get('mock');
    const dbConfig = config.get('dbConfig');
    const esbClient = config.get('esbClient');


    return {
        supportedSolrQueryParams: searchConfig.get('supportedSolrQueryParams'),
        routeDefinitionDir: appConfig.get('routeDefinitionDir'),
        routeMatcher: appConfig.get('routeMatcher'),
        appConfig,
        serverConfig,
        expressConfig,
        adminConfig,
        searchConfig,
        clientConfig,
        mahConfig,
        loggingConfig,
        statsdConfig,
        securityConfig,
        routeValidationConfig,
        retryConfig,
        cacheConfig,
        mock,
        dbConfig,
        esbClient
    };
}());
