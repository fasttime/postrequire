'use strict';

var parentModule = module.parent;

if (parentModule == null)
    throw Error('Failed to load postrequire: no parent module found');

var inspect = require('util').inspect;

var _Array_prototype_push_apply;
var _Function_prototype_call_apply;

var CJS_VAR_NAMES = ['this', 'exports', 'require', 'module', '__filename', '__dirname'];
var PARAM_NAMES;

var Module = module.constructor;

function patchApplyCall(stubsOrHook)
{
    function applyCall(fn, args)
    {
        if (typeof fn !== 'function')
            throw TypeError('Invalid operation');
        if (fn.length === 5 && fn.name === '')
        {
            undo();
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
    }

    function undo()
    {
        if (_Function_prototype !== null)
        {
            _Function_prototype.apply = apply;
            _Function_prototype.call = call;
            _Function_prototype = apply = call = null;
        }
    }

    var _Function_prototype = Function.prototype;
    var apply = _Function_prototype.apply;
    var call = _Function_prototype.call;
    (
        _Function_prototype.apply =
        function apply(thisArg, args) // eslint-disable-line func-names
        {
            var applyCallArgs = [thisArg];
            _Array_prototype_push_apply(applyCallArgs, args);
            var returnValue = applyCall(this, applyCallArgs);
            return returnValue;
        }
    )
    .prototype = undefined;
    (
        _Function_prototype.call =
        function call(thisArg) // eslint-disable-line func-names, no-unused-vars
        {
            var returnValue = applyCall(this, arguments);
            return returnValue;
        }
    )
    .prototype = undefined;
    return undo;
}

// In Node.js 14.17.1 and later, Module.prototype._compile does not invoke call or apply on the CJS
// module wrapper.
// This patch attempts to restore the previous behavior.
function patchCompile()
{
    function undo()
    {
        if (_Module_prototype !== undefined)
        {
            _Module_prototype._compile = _compile;
            _Module_prototype = _compile = undefined;
        }
    }

    if (!PARAM_NAMES)
        PARAM_NAMES = CJS_VAR_NAMES.slice(1);
    var _Module_prototype = Module.prototype;
    var _compile = _Module_prototype._compile;
    _Module_prototype._compile =
    function (content, filename)
    {
        undo();
        var compileFunction = require('vm').compileFunction;
        var pathDirname = require('path').dirname;
        var createRequire = Module.createRequire;
        var compiledWrapper = compileFunction(content, PARAM_NAMES, { filename: filename });
        var dirname = pathDirname(filename);
        var newRequire = createRequire(filename);
        var exports = this.exports;
        var returnValue =
        compiledWrapper.call(exports, exports, newRequire, this, filename, dirname);
        return returnValue;
    };
    return undo;
}

// In Node.js 0.x, require incorrectly uses the global object as a second parameter in a call to
// Module._load.
function patchLegacyNode()
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

function postrequire(id, stubsOrHook)
{
    if (typeof id !== 'string' || !id)
        throw TypeError('First argument must be a non-empty string, received ' + inspect(id));
    if (stubsOrHook !== undefined && stubsOrHook !== null && stubsOrHook !== Object(stubsOrHook))
    {
        throw TypeError
        (
            'Second argument must be an object, a function, undefined or null, received ' +
            inspect(stubsOrHook)
        );
    }
    var cache = Module._cache;
    var filename = Module._resolveFilename(id, parentModule);
    var cachedModule = cache[filename];
    var _require = parentModule.require;
    cache[filename] = undefined;
    patchLegacyNode();
    if (stubsOrHook !== undefined && stubsOrHook !== null)
    {
        var undoApplyCallPatch = patchApplyCall(stubsOrHook);
        if (process.config.variables.node_module_version >= 83)
            var undoCompilePatch = patchCompile();
    }
    try
    {
        var exports = _require(filename);
        return exports;
    }
    finally
    {
        if (undoApplyCallPatch)
            undoApplyCallPatch();
        if (undoCompilePatch)
            undoCompilePatch();
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
    var childModules = parentModule.children;
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
