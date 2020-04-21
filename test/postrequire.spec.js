/* eslint-env mocha */

'use strict';

var assert = require('assert');

describe
(
    'postrequire',
    function ()
    {
        var POSTREQUIRE_PATH = '..';
        var SOME_MODULE = './modules/dummy';

        function callPostrequire(postrequire, id, stubs)
        {
            var exports = postrequire(id, stubs);
            return exports;
        }

        var children = null;
        var keySet = null;

        beforeEach
        (
            function ()
            {
                keySet = Object.create(null);
                for (var key in module.constructor._cache)
                    keySet[key] = null;
                children = module.children;
                module.children = [];
            }
        );

        afterEach
        (
            function ()
            {
                var cache = module.constructor._cache;
                for (var key in cache)
                {
                    if (!(key in keySet))
                        delete cache[key];
                }
                keySet = null;
                module.children = children;
                children = null;
            }
        );

        it
        (
            'loads correctly',
            function ()
            {
                var postrequireId = require.resolve(POSTREQUIRE_PATH);
                var postrequire = require(POSTREQUIRE_PATH);

                assert(!(postrequireId in require.cache));
                assert.strictEqual(module.children.length, 1);
                var postrequireModule = module.children[0];
                assert.strictEqual(postrequireModule.id, postrequireId);

                require(SOME_MODULE);
                var postrequire2 = require(POSTREQUIRE_PATH);

                assert(!(postrequireId in require.cache));
                assert.strictEqual(module.children.length, 2);
                assert.strictEqual(module.children[0], postrequireModule);
                assert.strictEqual(postrequire2, postrequire);
            }
        );

        it
        (
            '(re)loads a new module',
            function ()
            {
                var testId = require.resolve('./modules/test');
                var postrequire = require(POSTREQUIRE_PATH);
                var test  = callPostrequire(postrequire, './modules/test');
                var test2 = callPostrequire(postrequire, './modules/test');

                assert(!(testId in require.cache));
                assert.strictEqual(module.children.length, 1);
                assert.notStrictEqual(test2, test);
                assert.deepEqual(test, { });
                assert.deepEqual(test2, { });
            }
        );

        it
        (
            'loads a module already required in the same parent',
            function ()
            {
                var testId = require.resolve('./modules/test');
                var postrequire = require(POSTREQUIRE_PATH);
                var test = require('./modules/test');
                var testModule = require.cache[testId];
                require(SOME_MODULE);
                var test2 = callPostrequire(postrequire, './modules/test');

                assert.strictEqual(require.cache[testId], testModule);
                assert.strictEqual(module.children.length, 3);
                assert.strictEqual(module.children[1], testModule);
                assert.notStrictEqual(test2, test);
                assert.deepEqual(test2, { });
            }
        );

        it
        (
            'loads a module already required in a different parent',
            function ()
            {
                var testId = require.resolve('./modules/test');
                var postrequire = require(POSTREQUIRE_PATH);
                var test = require('./modules/load-test');
                var testModule = require.cache[testId];
                var test2 = callPostrequire(postrequire, './modules/test');

                assert.strictEqual(require.cache[testId], testModule);
                assert.strictEqual(module.children.length, 2);
                assert.notStrictEqual(test2, test);
                assert.deepEqual(test2, { });
            }
        );

        it
        (
            'loads itself',
            function ()
            {
                var postrequireId = require.resolve(POSTREQUIRE_PATH);
                var postrequire = require(POSTREQUIRE_PATH);
                var postrequireModule = module.children[0];
                require(SOME_MODULE);
                var postrequire2 = callPostrequire(postrequire, POSTREQUIRE_PATH);

                assert(!(postrequireId in require.cache));
                assert.strictEqual(module.children.length, 2);
                assert.strictEqual(module.children[0], postrequireModule);
                assert.notStrictEqual(postrequire2, postrequire);
            }
        );

        it
        (
            'loads a non-module',
            function ()
            {
                var testId = require.resolve('./modules/non-module');
                var postrequire = require(POSTREQUIRE_PATH);
                var test = callPostrequire(postrequire, './modules/non-module.json');

                assert(!(testId in require.cache));
                assert.strictEqual(module.children.length, 1);
                assert.deepEqual(test, { foo: 'bar' });
            }
        );

        it
        (
            'stubs exports',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var exports = { };
                callPostrequire(postrequire, './modules/export-stubs', { exports: exports });

                assert.strictEqual(exports.exports, exports);
                assert.strictEqual(typeof exports.require, 'function');
                assert.strictEqual(typeof exports.module, 'object');
                assert.strictEqual(typeof exports.__filename, 'string');
                assert.strictEqual(typeof exports.__dirname, 'string');
            }
        );

        it
        (
            'stubs require',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var actual =
                callPostrequire(postrequire, './modules/export-stubs', { require: 'foo' });

                assert.strictEqual(actual.exports, actual);
                assert.strictEqual(actual.require, 'foo');
                assert.strictEqual(typeof actual.module, 'object');
                assert.strictEqual(typeof actual.__filename, 'string');
                assert.strictEqual(typeof actual.__dirname, 'string');
            }
        );

        it
        (
            'stubs module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var actual = callPostrequire(postrequire, './modules/export-stubs', { module: 42 });

                assert.strictEqual(actual.exports, actual);
                assert.strictEqual(typeof actual.require, 'function');
                assert.strictEqual(actual.module, 42);
                assert.strictEqual(typeof actual.__filename, 'string');
                assert.strictEqual(typeof actual.__dirname, 'string');
            }
        );

        it
        (
            'stubs __filename',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var actual =
                callPostrequire(postrequire, './modules/export-stubs', { __filename: 'bar' });

                assert.strictEqual(actual.exports, actual);
                assert.strictEqual(typeof actual.require, 'function');
                assert.strictEqual(typeof actual.module, 'object');
                assert.strictEqual(actual.__filename, 'bar');
                assert.strictEqual(typeof actual.__dirname, 'string');
            }
        );

        it
        (
            'stubs __dirname',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var actual =
                callPostrequire(postrequire, './modules/export-stubs', { __dirname: 'baz' });

                assert.strictEqual(actual.exports, actual);
                assert.strictEqual(typeof actual.require, 'function');
                assert.strictEqual(typeof actual.module, 'object');
                assert.strictEqual(typeof actual.__filename, 'string');
                assert.strictEqual(actual.__dirname, 'baz');
            }
        );

        it
        (
            '(re)stubs all stubs',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var exports1 = { };
                var stubs1 =
                {
                    exports:    exports1,
                    require:    true,
                    module:     42,
                    __filename: 'a',
                    __dirname:  'b',
                };
                callPostrequire(postrequire, './modules/export-stubs', stubs1);
                var exports2 = { };
                var stubs2 =
                {
                    exports:    exports2,
                    require:    undefined,
                    module:     undefined,
                    __filename: undefined,
                    __dirname:  undefined,
                };
                callPostrequire(postrequire, './modules/export-stubs', stubs2);

                var argName;
                for (argName in stubs1)
                    assert.deepEqual(exports1[argName], stubs1[argName]);
                for (argName in stubs2)
                    assert.deepEqual(exports2[argName], stubs2[argName]);
            }
        );

        it
        (
            'does not prevent a module from overwriting call and apply',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                var _Function_prototype = Function.prototype;
                var call = _Function_prototype.call;
                var apply = _Function_prototype.apply;
                try
                {
                    postrequire('./modules/overwrite-call-and-apply', { exports: { } });

                    assert.strictEqual(_Function_prototype.call, 'foo');
                    assert.strictEqual(_Function_prototype.apply, 'bar');
                }
                finally
                {
                    _Function_prototype.call = call;
                    _Function_prototype.apply = apply;
                }
            }
        );

        it
        (
            'restores call and apply hooks before initializing a module',
            function ()
            {
                var _Function_prototype = Function.prototype;
                var call = _Function_prototype.call;
                var apply = _Function_prototype.apply;
                var postrequire = require(POSTREQUIRE_PATH);
                var exports = { };
                callPostrequire(postrequire, './modules/export-stubs', { exports: exports });

                assert.strictEqual(exports.call, call);
                assert.strictEqual(exports.apply, apply);
            }
        );

        it
        (
            'restores call and apply hooks when loading a non-module',
            function ()
            {
                var _Function_prototype = Function.prototype;
                var call = _Function_prototype.call;
                var apply = _Function_prototype.apply;
                var postrequire = require(POSTREQUIRE_PATH);
                callPostrequire(postrequire, './modules/non-module.json', { exports: null });

                assert.strictEqual(_Function_prototype.call, call);
                assert.strictEqual(_Function_prototype.apply, apply);
            }
        );

        it
        (
            'throws on non-string argument',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws
                (
                    postrequire.bind(null),
                    function (error)
                    {
                        assert(error instanceof TypeError);
                        assert.strictEqual
                        (error.message, 'First argument must be a non-empty string');
                        return true;
                    }
                );
            }
        );

        it
        (
            'throws on empty string argument',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws
                (
                    postrequire.bind(null, ''),
                    function (error)
                    {
                        assert(error instanceof TypeError);
                        assert.strictEqual
                        (error.message, 'First argument must be a non-empty string');
                        return true;
                    }
                );
            }
        );

        it
        (
            'throws on nonexistent module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws(postrequire.bind(null, '?'), /\bCannot find module '\?'/);
            }
        );

        it
        (
            'throws on failing module',
            function ()
            {
                var throwId = require.resolve('./modules/throw');
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws(postrequire.bind(null, './modules/throw'), /\bTEST\b/);
                assert(!(throwId in require.cache));
                assert.strictEqual(module.children.length, 1);
            }
        );

        it
        (
            'throws on invalid stubs argument',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws
                (
                    postrequire.bind(null, './modules/test', 'foobar'),
                    function (error)
                    {
                        assert(error instanceof TypeError);
                        assert.strictEqual
                        (error.message, 'Second argument must be an object, undefined or null');
                        return true;
                    }
                );
            }
        );
    }
);
