# postrequire · [![npm version][npm badge]][npm url]

## Overview

**postrequire** is a Node.js utility that can load a module multiple times, rerunning any
initialization code contained in that module.
The newly created module is discarded immediately, without being stored in the module cache or added
to the children list of the parent module.
If the new module calls `require` to require other modules, those modules will be loaded and cached
normally, and any initialization code they contain will only run when the modules are required for
the first time.

```js
var postrequire = require("postrequire");
// Like `require("./my-module")`, except new module is not cached.
var obj1 = postrequire("./my-module");
// ...
var obj2 = postrequire("./my-module"); // Rerunning initialization code.
```

## Stubbing CommonJS variables

It is also possible to modify the values of the CommonJS global‐like variables `exports`, `require`,
`module`, `__filename` and `__dirname` inside the module being loaded with custom values.
The value of `this` at module level can be modified, too.

In order to modify the value of one or more of the identifiers inside the new modules, a second
parameter must be passed to `postrequire`.

If the second parameter is a regular object, the values of any defined properties having the name of
a CommonJS variable or `this` will be used to replace the values of their respective identifiers
inside the module.

Another option is passing a callback function as a second parameter.
The callback is called with an object as a single argument before the module is loaded.
The object passed to the callback contains name‐value property mappings for all CommonJS variables
and `this` as they would regularly occur inside the new module.
If the property values are modified inside the callback, the changes are reflected when the module
is loaded.

### Example 1: Faking `__filename` and `__dirname`

```js
// real-module.js
console.log("The pathname of this module is " + __filename);
console.log("This module is located inside " + __dirname);
```

```js
// main.js
var postrequire = require("postrequire");
postrequire("./real-module", { __filename: "/tmp/fake-module.js", __dirname: "/tmp" });
```

`node main.js` outputs
```
The pathname of this module is /tmp/fake-module.js
This module is located inside /tmp
```

### Example 2: Transitive postrequire

```js
function withTransitivePostrequire(stubs)
{
    var require = stubs.require;
    var postrequire = require("postrequire");
    function transitivePostrequire(id)
    {
        return postrequire(id, withTransitivePostrequire);
    }
    for (var key in require)
        transitivePostrequire[key] = require[key];
    stubs.require = transitivePostrequire;
}

var postrequire = require("postrequire");
// Load a module and all its descendant modules without using the cache.
// NOTE: This will result in a stack overflow error if any circular dependencies are encountered.
var imports = postrequire("semver", withTransitivePostrequire);
```

### Example 3: Pretending to be a browser with JSDOM

```js
// browser.js
if (typeof module !== "undefined")
    throw Error("This script can only run in a browser. Node.js/CommonJS found!");
if (typeof window !== "undefined")
{
    console.log("Browser window found!");
    // ...
}
```

```js
// main.js
const jsdom = require("jsdom");
const postrequire = require("postrequire");
const window = new jsdom.JSDOM("");
Object.setPrototypeOf(global, window); // Make properties of the window object available globally.
postrequire
(
    "./browser.js",
    {
        this: window,
        exports: undefined,
        require: undefined,
        module: undefined,
        __filename: undefined,
        __dirname: undefined,
    }
);
```

`node main.js` outputs
```
Browser window found!
```

## Other similar software

### [import-fresh](https://github.com/sindresorhus/import-fresh)

* Does not run in older versions of Node.js.

### [proxyquire](https://github.com/thlorenz/proxyquire)

* Adds new modules to the children list of the parent module.
* Creates new exports when required multiple times in the same module, i.e.
  `require("proxyquire") !== require("proxyquire")` always.
* Always needs second parameter `stubs`.

### [rewire](https://github.com/jhnns/rewire)

* Adds new modules to the children list of the parent module.
* Creates new exports when required multiple times in the same module, i.e.
  `require("rewire") !== require("rewire")` always.
* Does not run in older versions of Node.js.

### [Stealthy-Require](https://github.com/analog-nico/stealthy-require)

* Transitively reloads all modules required by another module at load time.
* Adds new modules to the children list of the parent module.
* Complicated usage.

[npm badge]: https://badge.fury.io/js/postrequire.svg
[npm url]: https://www.npmjs.com/package/postrequire
