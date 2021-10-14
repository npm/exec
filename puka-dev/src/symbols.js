/**
 * Key a method on your object with this symbol and you can get special
 * formatting for that value! See ShellStringText, ShellStringUnquoted, or
 * shellStringSemicolon for examples.
 * @ignore
 */
export const formatSymbol = Symbol('format');

/**
 * This symbol is for implementing advanced behaviors like the need for extra
 * carets in Windows shell strings that use pipes. If present, it's called in
 * an earlier phase than formatSymbol, and is passed a mutable context that can
 * be read during the format phase to influence formatting.
 * @ignore
 */
export const preformatSymbol = Symbol('preformat');
