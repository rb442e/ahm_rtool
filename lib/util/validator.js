'use strict';

const _ = require('lodash');

module.exports = {
    hasEvery,
    everyElementHasEvery,
    hasOnly,
    everyElementHasOnly,
    isJsonString,

};

/**
 * Test if object has every key
 *
 * @param object - object to test
 * @param keys - array of keys
 * @returns {boolean}
 */
function hasEvery(object, keys) {
    return _.every(keys, (key) => _.has(object, key));
}

/**
 * Tests if every object in array has every key
 * @param objects - array of objects to test
 * @param keys - array of keys
 * @returns {boolean}
 */
function everyElementHasEvery(objects, keys) {
    return _.every(objects, (obj) => hasEvery(obj, keys));
}

/**
 * Test if object has only the specified keys
 *
 * @param object - object to test
 * @param keys - array of allowed keys
 * @returns {boolean}
 */
function hasOnly(object, keys) {
    return _.every(_.keys(object), (key) => _.includes(keys, key));
}

/**
 * Tests if every object in array has only the specified keys
 * @param objects - array of objects to test
 * @param keys - array of allowed keys
 * @returns {boolean}
 */
function everyElementHasOnly(objects, keys) {
    return _.every(objects, (obj) => hasOnly(obj, keys));
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
