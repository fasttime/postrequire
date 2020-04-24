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

It is also possible to replace the values of the CommonJS global‐like variables `exports`,
`require`, `module`, `__filename` and `__dirname` inside the module being loaded with custom
predefined values.
The value of `this` at module level can be replaced, too.

In order to replace the value of one or more of the identifiers, pass an object as a second
parameter to `postrequire`, including the names of the identifiers as property names along with
their new values.

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

### Example 2: Pretending to be a browser with JSDOM

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
