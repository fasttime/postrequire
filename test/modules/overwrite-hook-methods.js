'use strict';

var functionPrototype = Function.prototype;
functionPrototype.call = 'foo';
functionPrototype.apply = 'bar';
module.__proto__._compile = 'baz';
