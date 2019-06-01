/* eslint-env mocha */

'use strict';

var assert = require('assert');

describe
(
    'subrequire',
    function ()
    {
        var PROXYQUIRE_PATH = '..';
        var SOME_MODULE = './dummy';

        function callSubrequire(subrequire, id)
        {
            var exports = subrequire(id);
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
                var subrequireId = require.resolve(PROXYQUIRE_PATH);
                var subrequire = require(PROXYQUIRE_PATH);

                assert(!(subrequireId in require.cache));
                assert.strictEqual(module.children.length, 1);
                var subrequireModule = module.children[0];
                assert.strictEqual(subrequireModule.id, subrequireId);

                require(SOME_MODULE);
                var subrequire2 = require(PROXYQUIRE_PATH);

                assert(!(subrequireId in require.cache));
                assert.strictEqual(module.children.length, 2);
                assert.strictEqual(module.children[0], subrequireModule);
                assert.strictEqual(subrequire2, subrequire);
            }
        );

        it
        (
            'loads a new module',
            function ()
            {
                var testId = require.resolve('./test');
                var subrequire = require(PROXYQUIRE_PATH);
                var test = callSubrequire(subrequire, './test');

                assert(!(testId in require.cache));
                assert.strictEqual(module.children.length, 1);
                assert.deepEqual(test, { });
            }
        );

        it
        (
            'loads a module already required in the same parent',
            function ()
            {
                var testId = require.resolve('./test');
                var subrequire = require(PROXYQUIRE_PATH);
                var test = require('./test');
                var testModule = require.cache[testId];
                require(SOME_MODULE);
                var test2 = callSubrequire(subrequire, './test');

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
                var testId = require.resolve('./test');
                var subrequire = require(PROXYQUIRE_PATH);
                var test = require('./load-test');
                var testModule = require.cache[testId];
                var test2 = callSubrequire(subrequire, './test');

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
                var subrequireId = require.resolve(PROXYQUIRE_PATH);
                var subrequire = require(PROXYQUIRE_PATH);
                var subrequireModule = module.children[0];
                require(SOME_MODULE);
                var subrequire2 = callSubrequire(subrequire, PROXYQUIRE_PATH);

                assert(!(subrequireId in require.cache));
                assert.strictEqual(module.children.length, 2);
                assert.strictEqual(module.children[0], subrequireModule);
                assert.notStrictEqual(subrequire2, subrequire);
            }
        );

        it
        (
            'throws on non-string argument',
            function ()
            {
                var subrequire = require(PROXYQUIRE_PATH);

                assert.throws
                (
                    subrequire.bind(null),
                    function (error)
                    {
                        assert(error instanceof TypeError);
                        assert.strictEqual(error.message, 'Argument must be a non-empty string');
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
                var subrequire = require(PROXYQUIRE_PATH);

                assert.throws
                (
                    subrequire.bind(null, ''),
                    function (error)
                    {
                        assert(error instanceof TypeError);
                        assert.strictEqual(error.message, 'Argument must be a non-empty string');
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
                var subrequire = require(PROXYQUIRE_PATH);

                assert.throws(subrequire.bind(null, '?'), /\bCannot find module '\?'/);
            }
        );

        it
        (
            'throws on failing module',
            function ()
            {
                var throwId = require.resolve('./throw');
                var subrequire = require(PROXYQUIRE_PATH);

                assert.throws(subrequire.bind(null, './throw'), /\bTEST\b/);
                assert(!(throwId in require.cache));
                assert.strictEqual(module.children.length, 1);
            }
        );
    }
);
