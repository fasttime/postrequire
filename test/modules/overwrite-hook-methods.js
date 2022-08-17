'use strict';

var functionPrototype = Function.prototype;
functionPrototype.call      = 'foo';
functionPrototype.apply     = 'bar';
var Module = module.constructor;
Module._load                = 'baz';
Module.prototype._compile   = 42;
