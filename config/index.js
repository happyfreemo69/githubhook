'use strict';
/**
 * override this config in privateConfig.js for ... private details
 */
exports = module.exports;
exports.port = 4033;
exports.phase = 'usr';
exports.dbpath = __dirname+'/../pushes';
exports.hot = {};
exports.tokens = [];
exports.push_expiresAt = 24*3600*7*1000;//7days
exports.intervalCleanup = 24*3600*1000;//ms (1day)
var fs = require('fs');
var res = fs.existsSync(__dirname+'/privateConfig.js') && require('./privateConfig.js');
Object.assign(exports, res);