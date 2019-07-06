# postrequire · [![npm version][npm badge]][npm url]

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

## Other similar software

### [import-fresh](https://github.com/sindresorhus/import-fresh)

* Does not run in older versions of Node.js.

### [proxyquire](https://github.com/thlorenz/proxyquire)

* Adds new modules to the children list of the parent module.
* Creates new objects when required multiple times in the same module, i.e.
  `require("proxyquire") !== require("proxyquire")` always.
* Always needs second parameter `stubs`.

### [rewire](https://github.com/jhnns/rewire)

* Adds new modules to the children list of the parent module.
* Creates new objects when required multiple times in the same module, i.e.
  `require("rewire") !== require("rewire")` always.
* Does not run in older versions of Node.js.

### [Stealthy-Require](https://github.com/analog-nico/stealthy-require)

* Transitively reloads all modules required by another module at load time.
* Adds new modules to the children list of the parent module.
* Complicated usage.

[npm badge]: https://badge.fury.io/js/postrequire.svg
[npm url]: https://www.npmjs.com/package/postrequire
