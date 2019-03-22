/**
 * Created by RBhatnagar on 12/21/2018.
 */
const _ = require('lodash');

var data = [
    { rel: 'link1', href: 'url1'},
    { rel: 'link2', href: 'url2'},
    { rel: 'link3', href: 'url3'},
    { rel: 'link4', href: 'url4'},
];

//var toHashMap = function (data, name, value) {
//    return _.zipObject(_.pluck(data, name),
//        _.pluck(data, value));
//}

var toMap = function (data, name, value) {
    return _.reduce(data, function(acc, item) {
        acc[item[name]] = item[value];
        return acc;
    }, {});
}

//console.log('toHashMap', toHashMap(data, 'rel', 'href'));
console.log('toMap', toMap(data, 'rel', 'href'));
//console.log('lodash.indexBy', _.indexBy(data, 'rel'));
