// Do NOT rename this file to anything other than "main.ts". ddu.vim looks for this file.
/**
 * Entry point for the ddu.vim filter plugin.
 *
 * @module
 */

// Re-export filter class as `Filter` for ddu.vim to recognize it.
export { MatcherKensakuFilter as Filter } from "./matcher.ts";
export type * from "./types.ts";
