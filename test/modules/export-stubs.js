'use strict';

exports.exports     = exports;
exports.module      = module;
exports.require     = require;
exports.__filename  = __filename;
exports.__dirname   = __dirname;

var _Function_prototype = Function.prototype;
exports.call    = _Function_prototype.call;
exports.apply   = _Function_prototype.apply;
