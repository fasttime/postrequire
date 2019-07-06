/**
 * (Re)runs initialization code contained in a Node.js module.
 * The new module is discarded immediately, without being stored in the module cache or added to the
 * children list of the parent module.
 *
 * @param id
 *
 * Module name or path.
 *
 * @returns
 *
 * The exported module contents.
 */
declare function postrequire(id: string): any;

export = postrequire;
