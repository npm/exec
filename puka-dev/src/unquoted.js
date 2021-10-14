import { ShellStringUnquoted } from './ShellStringUnquoted';

/**
 * This function permits raw strings to be interpolated into a `sh` template.
 *
 * **IMPORTANT**: If you're using Puka due to security concerns, make sure you
 * don't pass any untrusted content to `unquoted`. This may be obvious, but
 * stray punctuation in an `unquoted` section can compromise the safety of the
 * entire shell command.
 *
 * @param value - any value (it will be treated as a string)
 *
 * @example
 * const both = true;
 * sh`foo ${unquoted(both ? '&&' : '||')} bar`; // => 'foo && bar'
 */
export const unquoted = value => new ShellStringUnquoted(value);
