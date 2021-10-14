/**
 * A Windows-specific version of {@link quoteForShell}.
 * @param {String} text to be quoted
 * @param {Boolean} [forceQuote] whether to always add quotes even if the string
 * is already safe. Defaults to `false`.
 */
export { quoteForCmd } from './internal/platform-win32';
