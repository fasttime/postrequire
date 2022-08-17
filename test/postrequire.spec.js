/* eslint-env mocha */

'use strict';

var assert          = require('assert');
var childProcess    = require('child_process');

assert.throwsTypeError =
function (block, expectedErrorMessage)
{
    assert.throws
    (
        block,
        function (actualError)
        {
            assert(actualError instanceof TypeError);
            assert.strictEqual(actualError.message, expectedErrorMessage);
            return true;
        }
    );
};

describe
(
    'postrequire',
    function ()
    {
        var POSTREQUIRE_PATH = '..';
        var SOME_MODULE = './modules/dummy';

        function callPostrequire(postrequire, id, stubsOrHook)
        {
            var exports = postrequire(id, stubsOrHook);
            return exports;
        }

        function captureHooks()
        {
            var _Function_prototype = Function.prototype;
            var call = _Function_prototype.call;
            var apply = _Function_prototype.apply;
            var Module = module.constructor;
            var _load = Module._load;
            var _Module_prototype = Module.prototype;
            var _compile = _Module_prototype._compile;
            var hooks = { call: call, apply: apply, _load: _load, _compile: _compile };
            return hooks;
        }

        function noop()
        { }

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
            '(re)loads a nested module',
            function ()
            {
                var testId = require.resolve('./modules/use-postrequire');
                var postrequire = require(POSTREQUIRE_PATH);
                var test  = callPostrequire(postrequire, './modules/use-postrequire');
                var test2 = callPostrequire(postrequire, './modules/use-postrequire');

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
            'stubs this',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { this: Infinity });

                assert.strictEqual(returnValue.this, Infinity);
                assert.strictEqual(returnValue.exports, returnValue);
                assert.strictEqual(typeof returnValue.require, 'function');
                assert.strictEqual(typeof returnValue.module, 'object');
                assert.strictEqual(typeof returnValue.__filename, 'string');
                assert.strictEqual(typeof returnValue.__dirname, 'string');
            }
        );

        it
        (
            'stubs exports',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var exports = { };
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { exports: exports });

                assert.strictEqual(exports.this, returnValue);
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
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { require: 'foo' });

                assert.strictEqual(returnValue.this, returnValue);
                assert.strictEqual(returnValue.exports, returnValue);
                assert.strictEqual(returnValue.require, 'foo');
                assert.strictEqual(typeof returnValue.module, 'object');
                assert.strictEqual(typeof returnValue.__filename, 'string');
                assert.strictEqual(typeof returnValue.__dirname, 'string');
            }
        );

        it
        (
            'stubs module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { module: 42 });

                assert.strictEqual(returnValue.this, returnValue);
                assert.strictEqual(returnValue.exports, returnValue);
                assert.strictEqual(typeof returnValue.require, 'function');
                assert.strictEqual(returnValue.module, 42);
                assert.strictEqual(typeof returnValue.__filename, 'string');
                assert.strictEqual(typeof returnValue.__dirname, 'string');
            }
        );

        it
        (
            'stubs __filename',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { __filename: 'bar' });

                assert.strictEqual(returnValue.this, returnValue);
                assert.strictEqual(returnValue.exports, returnValue);
                assert.strictEqual(typeof returnValue.require, 'function');
                assert.strictEqual(typeof returnValue.module, 'object');
                assert.strictEqual(returnValue.__filename, 'bar');
                assert.strictEqual(typeof returnValue.__dirname, 'string');
            }
        );

        it
        (
            'stubs __dirname',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var returnValue =
                callPostrequire(postrequire, './modules/export-stubs', { __dirname: 'baz' });

                assert.strictEqual(returnValue.this, returnValue);
                assert.strictEqual(returnValue.exports, returnValue);
                assert.strictEqual(typeof returnValue.require, 'function');
                assert.strictEqual(typeof returnValue.module, 'object');
                assert.strictEqual(typeof returnValue.__filename, 'string');
                assert.strictEqual(returnValue.__dirname, 'baz');
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
                    this:       Math.PI,
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
                    this:       null,
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
            'calls a stubbing hook with all stubs',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var actualStubs;
                var returnValue =
                callPostrequire
                (
                    postrequire,
                    './modules/export-stubs',
                    function (stubs)
                    {
                        actualStubs = stubs;
                    }
                );

                assert.strictEqual(actualStubs.module.exports, returnValue);
                assert.strictEqual(actualStubs.this,        returnValue.this);
                assert.strictEqual(actualStubs.exports,     returnValue.exports);
                assert.strictEqual(actualStubs.require,     returnValue.require);
                assert.strictEqual(actualStubs.module,      returnValue.module);
                assert.strictEqual(actualStubs.__filename,  returnValue.__filename);
                assert.strictEqual(actualStubs.__dirname,   returnValue.__dirname);
            }
        );

        it
        (
            'uses all stubs from a stubbing hook',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var exports = { };
                var expected = { };
                callPostrequire
                (
                    postrequire,
                    './modules/export-stubs',
                    function (stubs)
                    {
                        expected.this       = stubs.this          = 0;
                        expected.exports    = stubs.exports       = exports;
                        expected.require    = stubs.require       = 3;
                        expected.module     = stubs.module        = 4;
                        expected.__filename = stubs.__filename    = 5;
                        expected.__dirname  = stubs.__dirname     = 6;
                    }
                );

                assert.strictEqual(exports.this,        expected.this);
                assert.strictEqual(exports.exports,     expected.exports);
                assert.strictEqual(exports.require,     expected.require);
                assert.strictEqual(exports.module,      expected.module);
                assert.strictEqual(exports.__filename,  expected.__filename);
                assert.strictEqual(exports.__dirname,   expected.__dirname);
            }
        );

        it
        (
            'does not prevent a module from overwriting hook methods',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var hooks = captureHooks();
                try
                {
                    callPostrequire
                    (postrequire, './modules/overwrite-hook-methods', { this: null });

                    assert.strictEqual(Function.prototype.call, 'foo');
                    assert.strictEqual(Function.prototype.apply, 'bar');
                    assert.strictEqual(module.constructor._load, 'baz');
                    assert.strictEqual(module.constructor.prototype._compile, 42);
                }
                finally
                {
                    // eslint-disable-next-line no-extend-native
                    Function.prototype.call                 = hooks.call;
                    // eslint-disable-next-line no-extend-native
                    Function.prototype.apply                = hooks.apply;
                    module.constructor._load                = hooks._load;
                    module.constructor.prototype._compile   = hooks._compile;
                }
            }
        );

        it
        (
            'restores hook methods before initializing a module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var hooks = captureHooks();
                var exports = callPostrequire(postrequire, './modules/export-stubs', noop);

                assert.strictEqual(exports.call, hooks.call);
                assert.strictEqual(exports.apply, hooks.apply);
                assert.strictEqual(exports._load, hooks._load);
                assert.strictEqual(exports._compile, hooks._compile);
            }
        );

        it
        (
            'restores hook methods when loading a non-module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var hooks = captureHooks();
                callPostrequire(postrequire, './modules/non-module.json', noop);

                assert.strictEqual(Function.prototype.call, hooks.call);
                assert.strictEqual(Function.prototype.apply, hooks.apply);
                assert.strictEqual(module.constructor._load, hooks._load);
                assert.strictEqual(module.constructor.prototype._compile, hooks._compile);
            }
        );

        it
        (
            'restores hook methods when trying to load a nonexisting module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var hooks = captureHooks();
                try
                {
                    callPostrequire(postrequire, '?', noop);
                }
                catch (error)
                { }

                assert.strictEqual(Function.prototype.call, hooks.call);
                assert.strictEqual(Function.prototype.apply, hooks.apply);
                assert.strictEqual(module.constructor._load, hooks._load);
                assert.strictEqual(module.constructor.prototype._compile, hooks._compile);
            }
        );

        it
        (
            'restores hook methods when trying to load a malformed module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);
                var hooks = captureHooks();
                try
                {
                    callPostrequire(postrequire, './modules/malformed', noop);
                }
                catch (error)
                { }

                assert.strictEqual(Function.prototype.call, hooks.call);
                assert.strictEqual(Function.prototype.apply, hooks.apply);
                assert.strictEqual(module.constructor._load, hooks._load);
                assert.strictEqual(module.constructor.prototype._compile, hooks._compile);
            }
        );

        describe
        (
            'provides a consistent temporary replacement for',
            function ()
            {
                function test(hook)
                {
                    var postrequire = require(POSTREQUIRE_PATH);
                    var _extensions = module.constructor._extensions;
                    var originalExtensionsJS = _extensions['.js'];
                    _extensions['.js'] =
                    function (module, filename)
                    {
                        hook();
                        originalExtensionsJS(module, filename);
                    };
                    try
                    {
                        callPostrequire(postrequire, './modules/test.js', { this: null });
                    }
                    finally
                    {
                        _extensions['.js'] = originalExtensionsJS;
                    }
                }

                function testWithCallback(callbackCaller, expectedArgs)
                {
                    var _Array_prototype_slice_call =
                    Function.prototype.call.bind(Array.prototype.slice);
                    var actualReturnValue;
                    var actualThis;
                    var actualArgs;
                    test
                    (
                        function ()
                        {
                            actualReturnValue =
                            callbackCaller
                            (
                                function ()
                                {
                                    actualThis = this;
                                    actualArgs = _Array_prototype_slice_call(arguments);
                                    return expectedReturnValue;
                                }
                            );
                        }
                    );
                    assert.strictEqual(actualReturnValue, expectedReturnValue);
                    assert.strictEqual(actualThis, expectedThis);
                    assert.deepEqual(actualArgs, expectedArgs);
                }

                var expectedReturnValue = 'A';
                var expectedThis = 'B';

                it
                (
                    'Function.prototype.call',
                    function ()
                    {
                        var actualPrototype;
                        var actualLength;
                        var actualName;
                        test
                        (
                            function ()
                            {
                                actualPrototype = Function.prototype.call.prototype;
                                actualLength    = Function.prototype.call.length;
                                actualName      = Function.prototype.call.name;
                            }
                        );
                        assert.strictEqual(actualPrototype, undefined);
                        assert.strictEqual(actualLength, 1);
                        assert.strictEqual(actualName, 'call');
                    }
                );

                it
                (
                    'Function.prototype.call with arguments',
                    function ()
                    {
                        var expectedArgs = ['foo', 'bar'];
                        testWithCallback
                        (
                            function (callback)
                            {
                                var returnValue =
                                callback.call(expectedThis, expectedArgs[0], expectedArgs[1]);
                                return returnValue;
                            },
                            expectedArgs
                        );
                    }
                );

                it
                (
                    'new Function.prototype.call',
                    function ()
                    {
                        assert.throwsTypeError
                        (
                            function ()
                            {
                                test
                                (
                                    function ()
                                    {
                                        // eslint-disable-next-line new-cap
                                        new Function.prototype.call();
                                    }
                                );
                            },
                            'Invalid operation'
                        );
                    }
                );

                it
                (
                    'Function.prototype.apply',
                    function ()
                    {
                        var actualPrototype;
                        var actualLength;
                        var actualName;
                        test
                        (
                            function ()
                            {
                                actualPrototype = Function.prototype.apply.prototype;
                                actualLength    = Function.prototype.apply.length;
                                actualName      = Function.prototype.apply.name;
                            }
                        );
                        assert.strictEqual(actualPrototype, undefined);
                        assert.strictEqual(actualLength, 2);
                        assert.strictEqual(actualName, 'apply');
                    }
                );

                it
                (
                    'Function.prototype.apply with an (iterable) arguments array',
                    function ()
                    {
                        var expectedArgs = ['foo', 'bar'];
                        testWithCallback
                        (
                            function (callback)
                            {
                                var returnValue =
                                callback.apply(expectedThis, expectedArgs);
                                return returnValue;
                            },
                            expectedArgs
                        );
                    }
                );

                it
                (
                    'Function.prototype.apply with an array-like arguments object',
                    function ()
                    {
                        var expectedArgs = ['foo', 'bar'];
                        testWithCallback
                        (
                            function (callback)
                            {
                                var args = { 0: expectedArgs[0], 1: expectedArgs[1], length: 2 };
                                var returnValue = callback.apply(expectedThis, args);
                                return returnValue;
                            },
                            expectedArgs
                        );
                    }
                );

                it
                (
                    'Function.prototype.apply without arguments',
                    function ()
                    {
                        testWithCallback
                        (
                            function (callback)
                            {
                                var returnValue = callback.apply(expectedThis);
                                return returnValue;
                            },
                            []
                        );
                    }
                );

                it
                (
                    'new Function.prototype.apply',
                    function ()
                    {
                        assert.throwsTypeError
                        (
                            function ()
                            {
                                test
                                (
                                    function ()
                                    {
                                        // eslint-disable-next-line new-cap
                                        new Function.prototype.apply();
                                    }
                                );
                            },
                            'Invalid operation'
                        );
                    }
                );
            }
        );

        it
        (
            'throws on non-string argument',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throwsTypeError
                (
                    postrequire.bind(null),
                    'First argument must be a non-empty string, received undefined'
                );
            }
        );

        it
        (
            'throws on empty string argument',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throwsTypeError
                (
                    postrequire.bind(null, ''),
                    'First argument must be a non-empty string, received \'\''
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
            'throws on malformed module',
            function ()
            {
                var postrequire = require(POSTREQUIRE_PATH);

                assert.throws(postrequire.bind(null, './modules/malformed'), SyntaxError);
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

                assert.throwsTypeError
                (
                    postrequire.bind(null, './modules/test', 'foobar'),
                    'Second argument must be an object, a function, undefined or null, received ' +
                    '\'foobar\''
                );
            }
        );

        describe
        (
            'cannot be loaded without a parent module',
            function ()
            {
                var EXPECTED_MESSAGE = 'Failed to load postrequire: no parent module found';

                it
                (
                    'with `import`',
                    function ()
                    {
                        var semver = require('semver');
                        if (!semver.satisfies(process.version, '12 >=12.19 || >=14'))
                            this.skip();
                        var promise =
                        require('./modules/import-postrequire').then
                        (
                            function ()
                            {
                                assert.fail('Exception not thrown');
                            },
                            function (reason)
                            {
                                assert.strictEqual(reason.constructor, Error);
                                assert.strictEqual(reason.message, EXPECTED_MESSAGE);
                            }
                        );
                        return promise;
                    }
                );

                it
                (
                    'by itself',
                    function ()
                    {
                        var postrequire = require(POSTREQUIRE_PATH);
                        try
                        {
                            callPostrequire(postrequire, POSTREQUIRE_PATH);
                        }
                        catch (error)
                        {
                            assert.strictEqual(error.constructor, Error);
                            assert.strictEqual(error.message, EXPECTED_MESSAGE);
                            return;
                        }
                        assert.fail('Exception not thrown');
                    }
                );

                it
                (
                    'as a main module',
                    function (done)
                    {
                        var postrequireId = require.resolve(POSTREQUIRE_PATH);
                        var callback =
                        function (error)
                        {
                            try
                            {
                                var message = error.message;
                                assert(typeof message === 'string');
                                assert(message.indexOf('Error: ' + EXPECTED_MESSAGE + '\n') >= 0);
                            }
                            catch (error)
                            {
                                done(error);
                                return;
                            }
                            done();
                        };
                        childProcess.execFile(process.execPath, [postrequireId], callback);
                    }
                );
            }
        );
    }
);
