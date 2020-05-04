/**
 * A callback called by postrequire to preview and modify the values for CommonJS global‐like
 * variables and the `this` keyword at top level in the module being loaded.
 */
export type PostrequireHook = (stubs: PostrequireStubs) => void;

/**
 * Specifies values for CommonJS global‐like variables and the `this` keyword at top level in the
 * module being loaded.
 */
export interface PostrequireStubs
{
    this:       any;
    exports:    any;
    require:    any;
    module:     any;
    __filename: any;
    __dirname:  any;
}

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
export default function postrequire
(id: string, stubsOrHook?: Readonly<Partial<PostrequireStubs>> | PostrequireHook): any;
