'use strict';

var _Array_prototype_push_apply;
var _Function_prototype_call_apply;

var CJS_VAR_NAMES = ['this', 'exports', 'require', 'module', '__filename', '__dirname'];

var parentModule = module.parent;

function postrequire(id, stubsOrHook)
{
    if (typeof id !== 'string' || !id)
        throw TypeError('First argument must be a non-empty string');
    if (stubsOrHook !== undefined && stubsOrHook !== null && stubsOrHook !== Object(stubsOrHook))
        throw TypeError('Second argument must be an object, a function, undefined or null');
    var Module = module.constructor;
    var cache = Module._cache;
    var filename = Module._resolveFilename(id, parentModule);
    var cachedModule = cache[filename];
    var _require = parentModule.require;
    cache[filename] = undefined;
    patchLegacyNode(Module);
    if (stubsOrHook !== undefined && stubsOrHook !== null)
    {
        var _Function_prototype = Function.prototype;
        var apply = _Function_prototype.apply;
        var call = _Function_prototype.call;
        var applyCall =
        function (fn, args)
        {
            if (typeof fn !== 'function')
                throw TypeError('Invalid operation');
            if (fn.length === 5 && fn.name === '')
            {
                _Function_prototype.apply = apply;
                _Function_prototype.call = call;
                _Function_prototype = undefined;
                if (typeof stubsOrHook !== 'function')
                {
                    CJS_VAR_NAMES.forEach
                    (
                        function (stubName, index)
                        {
                            if (stubName in stubsOrHook)
                                args[index] = stubsOrHook[stubName];
                        }
                    );
                }
                else
                {
                    var stubMap = { };
                    CJS_VAR_NAMES.forEach
                    (
                        function (stubName, index)
                        {
                            stubMap[stubName] = args[index];
                        }
                    );
                    stubsOrHook(stubMap);
                    CJS_VAR_NAMES.forEach
                    (
                        function (stubName, index)
                        {
                            args[index] = stubMap[stubName];
                        }
                    );
                }
            }
            var returnValue = _Function_prototype_call_apply(fn, args);
            return returnValue;
        };
        (
            _Function_prototype.apply =
            function apply(thisArg, args) // eslint-disable-line func-names
            {
                var applyCallArgs = [thisArg];
                _Array_prototype_push_apply(applyCallArgs, args);
                var returnValue = applyCall(this, applyCallArgs);
                return returnValue;
            }
        ).prototype = undefined;
        (
            _Function_prototype.call =
            function call(thisArg) // eslint-disable-line func-names, no-unused-vars
            {
                var returnValue = applyCall(this, arguments);
                return returnValue;
            }
        ).prototype = undefined;
        if (process.config.variables.node_module_version >= 88)
        {
            var _Module_prototype = Module.prototype;
            var _compile = _Module_prototype._compile;
            _Module_prototype._compile =
            function (content, filename)
            {
                _Module_prototype._compile = _compile;
                _Module_prototype = undefined;
                var patchedCompile = getPatchedCompile();
                var returnValue = patchedCompile(this, content, filename);
                return returnValue;
            };
        }
    }
    try
    {
        var exports = _require(filename);
        return exports;
    }
    finally
    {
        if (_Function_prototype !== undefined)
        {
            _Function_prototype.apply = apply;
            _Function_prototype.call = call;
        }
        if (_Module_prototype !== undefined)
            _Module_prototype._compile = _compile;
        if (cachedModule !== undefined)
            cache[filename] = cachedModule;
        else
            delete cache[filename];
    }
}

(function ()
{
    function findChildModuleById()
    {
        for (var index = childModules.length; index > 0;)
        {
            var childModule = childModules[--index];
            if (childModule !== module && childModule.id === id)
                return childModule;
        }
    }

    function removeChildModule()
    {
        for (var index = childModules.length; index > 0;)
        {
            if (childModules[--index] === module)
                childModules.splice(index, 1);
        }
    }

    var _Function_prototype = Function.prototype;
    var _Function_prototype_apply = _Function_prototype.apply;
    _Array_prototype_push_apply = _Function_prototype_apply.bind(Array.prototype.push);
    _Function_prototype_call_apply = _Function_prototype_apply.bind(_Function_prototype.call);

    var id = module.id;
    delete require.cache[id];
    if (parentModule !== undefined)
        var childModules = parentModule.children;
    if (childModules === undefined)
        childModules = [];
    var postrequireModule = findChildModuleById();
    if (postrequireModule)
    {
        module.exports = postrequireModule.exports;
        removeChildModule();
    }
    else
        module.exports = postrequire;
}
)();

////////////////////////////////////////////////////////////////////////////////////////////////////

// In Node.js 0.x, require incorrectly uses the global object as a second parameter in a call to
// Module._load.

function patchLegacyNode(Module)
{
    var _load = Module._load;
    Module._load =
    function (request)
    {
        Module._load = _load;
        var returnValue = _load(request);
        return returnValue;
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////

// In Node.js 15, Module.prototype._compile does not invoke call or apply on the CJS module wrapper.
// This patch attempts to restore the previous behavior.

var patchedCompile;

function getPatchedCompile()
{
    if (!patchedCompile)
    {
        var pathDirname     = require('path').dirname;
        var compileFunction = require('vm').compileFunction;

        var PARAM_NAMES = CJS_VAR_NAMES.slice(1);

        var createRequire = module.constructor.createRequire;
        patchedCompile =
        function (module, content, filename)
        {
            var compiledWrapper = compileFunction(content, PARAM_NAMES, { filename: filename });
            var dirname = pathDirname(filename);
            var require = createRequire(filename);
            var exports = module.exports;
            var returnValue =
            compiledWrapper.call(exports, exports, require, module, filename, dirname);
            return returnValue;
        };
    }
    return patchedCompile;
}
