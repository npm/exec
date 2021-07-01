import { ShellString } from './ShellString';

/**
 * A string template tag for safely constructing cross-platform shell commands.
 *
 * An `sh` template is not actually treated as a literal string to be
 * interpolated; instead, it is a tiny DSL designed to make working with shell
 * strings safe, simple, and straightforward. To get started quickly, see the
 * examples below. {@link #the-sh-dsl More detailed documentation} is available
 * further down.
 *
 * @name sh
 * @example
 * const title = '"this" & "that"';
 * sh`script --title=${title}`; // => "script '--title=\"this\" & \"that\"'"
 * // Note: these examples show results for non-Windows platforms.
 * // On Windows, the above would instead be
 * // 'script ^^^"--title=\\^^^"this\\^^^" ^^^& \\^^^"that\\^^^"^^^"'.
 *
 * const names = ['file1', 'file 2'];
 * sh`rimraf ${names}.txt`; // => "rimraf file1.txt 'file 2.txt'"
 *
 * const cmd1 = ['cat', 'file 1.txt', 'file 2.txt'];
 * const cmd2 = ['use-input', '-abc'];
 * sh`${cmd1}|${cmd2}`; // => "cat 'file 1.txt' 'file 2.txt'|use-input -abc"
 *
 * @returns {String} - a string formatted for the platform Node is currently
 * running on.
 */
export const sh = (...args) => ShellString.sh(...args).toString();
