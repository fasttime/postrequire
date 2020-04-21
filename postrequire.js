'use strict';

var _Array_prototype_slice_call;
var _Function_prototype_apply_call;

var CJS_VAR_NAMES = ['exports', 'require', 'module', '__filename', '__dirname'];

var parentModule = module.parent;

function postrequire(id, stubs)
{
    if (typeof id !== 'string' || !id)
        throw TypeError('First argument must be a non-empty string');
    if (stubs !== undefined && typeof stubs !== 'object')
        throw TypeError('Second argument must be an object, undefined or null');
    var Module = parentModule.constructor;
    var cache = Module._cache;
    var filename = Module._resolveFilename(id, parentModule);
    var cachedModule = cache[filename];
    var _require = parentModule.require;
    cache[filename] = undefined;
    var indexedStubs = [];
    if (stubs !== undefined && stubs !== null)
    {
        CJS_VAR_NAMES.forEach
        (
            function (stubName, index)
            {
                if (stubName in stubs)
                    indexedStubs[index] = stubs[stubName];
            }
        );
    }
    if (indexedStubs.length)
    {
        var prototype = Function.prototype;
        var apply = prototype.apply;
        var call = prototype.call;
        var doApply =
        function (fn, thisArg, args)
        {
            if (fn.length === 5 && fn.name === '')
            {
                prototype.apply = apply;
                prototype.call = call;
                prototype = undefined;
                indexedStubs.forEach
                (
                    function (stub, index)
                    {
                        args[index] = stub;
                    }
                );
            }
            var returnValue = _Function_prototype_apply_call(fn, thisArg, args);
            return returnValue;
        };
        prototype.apply =
        function (thisArg, args)
        {
            var returnValue = doApply(this, thisArg, args);
            return returnValue;
        };
        prototype.call =
        function (thisArg)
        {
            var args = _Array_prototype_slice_call(arguments, 1);
            var returnValue = doApply(this, thisArg, args);
            return returnValue;
        };
    }
    try
    {
        var exports = _require(filename);
        return exports;
    }
    finally
    {
        if (prototype !== undefined)
        {
            prototype.apply = apply;
            prototype.call = call;
        }
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
    var _Function_prototype_call = _Function_prototype.call;
    _Array_prototype_slice_call = _Function_prototype_call.bind(Array.prototype.slice);
    _Function_prototype_apply_call = _Function_prototype_call.bind(_Function_prototype.apply);

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
