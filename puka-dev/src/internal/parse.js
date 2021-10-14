import { ShellStringText } from '../ShellStringText';
import { ShellStringUnquoted } from '../ShellStringUnquoted';
import { shellStringSemicolon } from '../shellStringSemicolon';
import { execFrom, sticky } from './regex-utils';
import { memoize } from './utils';

export const PLACEHOLDER = {};

export const parse = memoize(templateSpans => {
  // These are the token types our DSL can recognize. Their values won't escape
  // this function.
  const TOKEN_TEXT = 0;
  const TOKEN_QUOTE = 1;
  const TOKEN_SEMI = 2;
  const TOKEN_UNQUOTED = 3;
  const TOKEN_SPACE = 4;
  const TOKEN_REDIRECT = 5;

  const result = [];
  let placeholderCount = 0;
  let prefix = null;
  let onlyPrefixOnce = false;
  let contents = [];
  let quote = 0;
  const lastSpan = templateSpans.length - 1;
  for (let spanIndex = 0; spanIndex <= lastSpan; spanIndex++) {
    const templateSpan = templateSpans[spanIndex];
    const posEnd = templateSpan.length;
    let tokenStart = 0;
    if (spanIndex) {
      placeholderCount++;
      contents.push(PLACEHOLDER);
    }

    // For each span, we first do a recognizing pass in which we use regular
    // expressions to identify the positions of tokens in the text, and then
    // a second pass that actually splits the text into the minimum number of
    // substrings necessary.
    const recognized = []; // [type1, index1, type2, index2...]
    let firstWordBreak = -1;
    let lastWordBreak = -1;
    {
      let pos = 0, match;
      while (pos < posEnd) {
        if (quote) {
          if (
            match = execFrom(quote === CHAR_SQUO ? reQuotation1 : reQuotation2,
              templateSpan, pos)
          ) {
            recognized.push(TOKEN_TEXT, pos);
            pos += match[0].length;
          }
          if (pos < posEnd) {
            recognized.push(TOKEN_QUOTE, pos++);
            quote = 0;
          }
        } else {
          if (match = execFrom(reRedirectOrSpace, templateSpan, pos)) {
            firstWordBreak < 0 && (firstWordBreak = pos);
            lastWordBreak = pos;
            recognized.push(match[1] ? TOKEN_REDIRECT : TOKEN_SPACE, pos);
            pos += match[0].length;
          }
          if (match = execFrom(reText, templateSpan, pos)) {
            const setBreaks = match[1] != null;
            setBreaks && firstWordBreak < 0 && (firstWordBreak = pos);
            recognized.push(setBreaks ? TOKEN_UNQUOTED : TOKEN_TEXT, pos);
            pos += match[0].length;
            setBreaks && (lastWordBreak = pos);
          }
          const char = templateSpan.charCodeAt(pos);
          if (char === CHAR_SEMI) {
            firstWordBreak < 0 && (firstWordBreak = pos);
            recognized.push(TOKEN_SEMI, pos++);
            lastWordBreak = pos;
          } else if (char === CHAR_SQUO || char === CHAR_DQUO) {
            recognized.push(TOKEN_QUOTE, pos++);
            quote = char;
          }
        }
      }
    }

    // Word breaks are only important if they separate words with placeholders,
    // so we can ignore the first/last break if this is the first/last span.
    spanIndex === 0 && (firstWordBreak = -1);
    spanIndex === lastSpan && (lastWordBreak = posEnd);

    // Here begins the second pass mentioned above. This loop runs one more
    // iteration than there are tokens in recognized, because it handles tokens
    // on a one-iteration delay; hence the i <= iEnd instead of i < iEnd.
    const iEnd = recognized.length;
    for (let i = 0, type = -1; i <= iEnd; i += 2) {
      let typeNext = -1, pos;
      if (i === iEnd) {
        pos = posEnd;
      } else {
        typeNext = recognized[i];
        pos = recognized[i + 1];
        // If the next token is space or redirect, but there's another word
        // break in this span, then we can handle that token the same way we
        // would handle unquoted text because it isn't being attached to a
        // placeholder.
        typeNext >= TOKEN_SPACE
          && pos !== lastWordBreak
          && (typeNext = TOKEN_UNQUOTED);
      }
      const breakHere = pos === firstWordBreak || pos === lastWordBreak;
      if (pos && (breakHere || typeNext !== type)) {
        let value = type === TOKEN_QUOTE ? null
          : type === TOKEN_SEMI ? shellStringSemicolon
          : templateSpan.substring(tokenStart, pos);
        if (type >= TOKEN_SEMI) {
          // This branch handles semicolons, unquoted text, spaces, and
          // redirects. shellStringSemicolon is already a formatSymbol object;
          // the rest need to be wrapped.
          type === TOKEN_SEMI || (value = new ShellStringUnquoted(value));
          // We don't need to check placeholderCount here like we do below;
          // that's only relevant during the first word break of the span, and
          // because this iteration of the loop is processing the token that
          // was checked for breaks in the previous iteration, it will have
          // already been handled. For the same reason, prefix is guaranteed to
          // be null.
          if (contents.length) {
            result.push(new ShellStringText(contents, null));
            contents = [];
          }
          // Only spaces and redirects become prefixes, but not if they've been
          // rewritten to unquoted above.
          if (type >= TOKEN_SPACE) {
            prefix = value;
            onlyPrefixOnce = type === TOKEN_SPACE;
          } else {
            result.push(value);
          }
        } else {
          contents.push(value);
        }
        tokenStart = pos;
      }
      if (breakHere) {
        if (placeholderCount) {
          result.push({ contents, placeholderCount, prefix, onlyPrefixOnce });
        } else {
          // There's no prefix to handle in this branch; a prefix prior to this
          // span would mean placeholderCount > 0, and a prefix in this span
          // can't be created because spaces and redirects get rewritten to
          // unquoted before the last word break.
          contents.length && result.push(new ShellStringText(contents, null));
        }
        placeholderCount = 0; prefix = null; onlyPrefixOnce = false;
        contents = [];
      }
      type = typeNext;
    }
  }

  if (quote) {
    throw new SyntaxError(
      `String is missing a ${String.fromCharCode(quote)} character`);
  }

  return result;
});

const CHAR_SEMI = ';'.charCodeAt();
const CHAR_SQUO = "'".charCodeAt();
const CHAR_DQUO = '"'.charCodeAt();

const reQuotation1 = sticky("[^']+");
const reQuotation2 = sticky('[^"]+');
const reText = sticky('[^\\s"#$&\'();<>\\\\`|]+|([#$&()\\\\`|]+)');
const reRedirectOrSpace = sticky('(\\s*\\d*[<>]+\\s*)|\\s+');
