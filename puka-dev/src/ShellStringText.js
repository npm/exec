import { formatSymbol, preformatSymbol } from './symbols';
import { isObject } from './internal/utils';

/**
 * Represents a contiguous span of text that may or must be quoted. The contents
 * may already contain quoted segments, which will always be quoted. If unquoted
 * segments also require quoting, the entire span will be quoted together.
 * @ignore
 */
export class ShellStringText {
  constructor(contents, untested) {
    this.contents = contents;
    this.untested = untested;
  }

  [formatSymbol](formatter, context) {
    const unformattedContents = this.contents;
    const { length } = unformattedContents;
    const contents = new Array(length);
    for (let i = 0; i < length; i++) {
      const c = unformattedContents[i];
      contents[i] =
        isObject(c) && formatSymbol in c
          ? c[formatSymbol](formatter)
          : c;
    }
    for (let unquoted = true, i = 0; i < length; i++) {
      const content = contents[i];
      if (content === null) {
        unquoted = !unquoted;
      } else {
        if (unquoted
          && (formatter.hasExtraMetaChars
            || this.untested && this.untested.has(i))
          && formatter.metaChars.test(content)
        ) {
          return formatter.quote(contents.join(''), false, context.at(this));
        }
      }
    }
    const parts = [];
    for (let quoted = null, i = 0; i < length; i++) {
      const content = contents[i];
      if (content === null) {
        quoted = quoted ? (
          parts.push(formatter.quote(quoted.join(''), true, context.at(this))),
          null
        ) : [];
      } else {
        (quoted || parts).push(content);
      }
    }
    const result = parts.join('');
    return result.length ? result : formatter.emptyString;
  }

  [preformatSymbol](context) {
    context.mark(this);
  }
}
