'use strict';

var functionPrototype = Function.prototype;
functionPrototype.call      = 'foo';
functionPrototype.apply     = 'bar';
module.constructor._load    = 'baz';
module.__proto__._compile   = 42;
