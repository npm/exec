import { Formatter } from './Formatter';
import { formatSymbol, preformatSymbol } from './symbols';
import { parse } from './internal/parse';
import { evaluate } from './internal/evaluate';

/**
 * A ShellString represents a shell command after it has been interpolated, but
 * before it has been formatted for a particular platform. ShellStrings are
 * useful if you want to prepare a command for a different platform than the
 * current one, for instance.
 *
 * To create a ShellString, use `ShellString.sh` the same way you would use
 * top-level `sh`.
 */
export class ShellString {
  /** @hideconstructor */
  constructor(children) {
    this.children = children;
  }

  /**
   * `ShellString.sh` is a template tag just like `sh`; the only difference is
   * that this function returns a ShellString which has not yet been formatted
   * into a String.
   * @returns {ShellString}
   * @function sh
   * @static
   * @memberof ShellString
   */
  static sh(templateSpans, ...values) {
    return new ShellString(evaluate(parse(templateSpans), values));
  }

  /**
   * A method to format a ShellString into a regular String formatted for a
   * particular platform.
   *
   * @param {String} [platform] a value that `process.platform` might take:
   * `'win32'`, `'linux'`, etc.; determines how the string is to be formatted.
   * When omitted, effectively the same as `process.platform`.
   * @returns {String}
   */
  toString(platform) {
    return this[formatSymbol](Formatter.for(platform));
  }

  [formatSymbol](formatter, context = formatter.createContext(this)) {
    return this.children
      .map(child => child[formatSymbol](formatter, context)).join('');
  }

  [preformatSymbol](context) {
    const { children } = this;
    for (let i = 0, iMax = children.length; i < iMax; i++) {
      const child = children[i];
      if (preformatSymbol in child) {
        child[preformatSymbol](context);
      }
    }
  }
}
