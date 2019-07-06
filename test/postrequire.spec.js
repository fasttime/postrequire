/* eslint-env mocha */

'use strict';

var assert = require('assert');

describe
(
    'postrequire',
    function ()
    {
        var POSTREQUIRE_PATH = '..';
        var SOME_MODULE = './dummy';

        function callPostrequire(postrequire, id)
        {
            var exports = postrequire(id);
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
            'loads a new module',
            function ()
            {
                var testId = require.resolve('./test');
                var postrequire = require(POSTREQUIRE_PATH);
                var test = callPostrequire(postrequire, './test');

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
                var postrequire = require(POSTREQUIRE_PATH);
                var test = require('./test');
                var testModule = require.cache[testId];
                require(SOME_MODULE);
                var test2 = callPostrequire(postrequire, './test');

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
                var postrequire = require(POSTREQUIRE_PATH);
                var test = require('./load-test');
                var testModule = require.cache[testId];
                var test2 = callPostrequire(postrequire, './test');

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
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws
                (
                    postrequire.bind(null, ''),
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
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws(postrequire.bind(null, '?'), /\bCannot find module '\?'/);
            }
        );

        it
        (
            'throws on failing module',
            function ()
            {
                var throwId = require.resolve('./throw');
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws(postrequire.bind(null, './throw'), /\bTEST\b/);
                assert(!(throwId in require.cache));
                assert.strictEqual(module.children.length, 1);
            }
        );
    }
);
