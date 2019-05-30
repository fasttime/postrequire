# subrequire · [![npm version][npm badge]][npm url]

**subrequire** is a Node.js utility that can load a module multiple times, rerunning any
initialization code contained in that module.
The newly created module is discarded immediately, without being stored in the module cache or added
to the children list of the parent module.
If the new module calls `require` to require other modules, those modules will be loaded and cached
normally, and any initialization code they contain will only run when the modules are required for
the first time.

```js
var subrequire = require("subrequire");
// Like `require("./my-module")`, except new module is not cached.
var obj1 = subrequire("./my-module");
// ...
var obj2 = subrequire("./my-module"); // Rerunning initialization code.
```

[npm badge]: https://badge.fury.io/js/subrequire.svg
[npm url]: https://www.npmjs.com/package/subrequire
