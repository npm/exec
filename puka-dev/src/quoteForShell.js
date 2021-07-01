import { Formatter } from './Formatter';

/**
 * Quotes a string for injecting into a shell command.
 *
 * This function is exposed for some hypothetical case when the `sh` DSL simply
 * won't do; `sh` is expected to be the more convenient option almost always.
 * Compare:
 *
 * ```javascript
 * console.log('cmd' + args.map(a => ' ' + quoteForShell(a)).join(''));
 * console.log(sh`cmd ${args}`); // same as above
 *
 * console.log('cmd' + args.map(a => ' ' + quoteForShell(a, true)).join(''));
 * console.log(sh`cmd "${args}"`); // same as above
 * ```
 *
 * Additionally, on Windows, `sh` checks the entire command string for pipes,
 * which subtly change how arguments need to be quoted. If your commands may
 * involve pipes, you are strongly encouraged to use `sh` and not try to roll
 * your own with `quoteForShell`.
 *
 * @param {String} text to be quoted
 * @param {Boolean} [forceQuote] whether to always add quotes even if the string
 * is already safe. Defaults to `false`.
 * @param {String} [platform] a value that `process.platform` might take:
 * `'win32'`, `'linux'`, etc.; determines how the string is to be formatted.
 * When omitted, effectively the same as `process.platform`.
 *
 * @returns {String} a string that is safe for the current (or specified)
 * platform.
 */
export function quoteForShell(text, forceQuote, platform) {
  return Formatter.for(platform).quote(text, forceQuote);
}
