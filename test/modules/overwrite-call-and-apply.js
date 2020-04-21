'use strict';

var functionPrototype = Function.prototype;
functionPrototype.call = 'foo';
functionPrototype.apply = 'bar';
