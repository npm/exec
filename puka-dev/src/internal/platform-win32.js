import { execFrom, sticky } from './regex-utils';

export function quoteForCmd(text, forceQuote, caretDepth = 0) {
  // See the below blog post for an explanation of this function and
  // quoteForWin32:
  // eslint-disable-next-line max-len
  // https://blogs.msdn.microsoft.com/twistylittlepassagesallalike/2011/04/23/everyone-quotes-command-line-arguments-the-wrong-way/
  if (!text.length) {
    return '""';
  }
  if (/[\n\r]/.test(text)) {
    throw new Error("Line breaks can't be quoted on Windows");
  }
  const caretEscape = /["%]/.test(text);
  text = quoteForWin32(
    text, forceQuote || !caretEscape && /[&()<>^|]/.test(text));
  if (caretEscape) {
    // See Win32Context for explanation of what caretDepth is for.
    do {
      text = text.replace(/[\t "%&()<>^|]/g, '^$&');
    } while (caretDepth--);
  }
  return text;
}

export const quoteForWin32 =
  (text, forceQuote) =>
    forceQuote || /[\t "]/.test(text)
      ? `"${text.replace(/\\+(?=$|")/g, '$&$&').replace(/"/g, '\\"')}"`
      : text;

export const cmdMetaChars = /[\t\n\r "%&()<>^|]/;

export class Win32Context {
  currentScope = newScope(null)
  scopesByObject = new Map()
  argDetectState = 0
  argSet = new Set()
  read(text) {
    // When cmd.exe executes a batch file, or pipes to or from one, it spawns a
    // second copy of itself to run the inner command. This necessitates
    // doubling up on carets so that escaped characters survive both cmd.exe
    // invocations. See:
    // eslint-disable-next-line max-len
    // https://stackoverflow.com/questions/8192318/why-does-delayed-expansion-fail-when-inside-a-piped-block-of-code#8194279
    // https://ss64.com/nt/syntax-redirection.html
    //
    // Parentheses can create an additional subshell, requiring additional
    // escaping... it's a mess.
    //
    // So here's what we do about it: we read all unquoted text in a shell
    // string and put it through this tiny parser that looks for pipes,
    // sequence operators (&, &&, ||), redirects, and parentheses. This can't
    // be part of the main Puka parsing, because it can be affected by
    // `unquoted(...)` values provided at evaluation time.
    //
    // Then, after associating each thing that needs to be quoted with a scope
    // (via `mark()`), and identifying whether or not it's an argument to a
    // command, we can determine the depth of caret escaping required in each
    // scope and pass it (via `Formatter::quote()`) to `quoteForCmd()`.
    //
    // See also `ShellStringText`, which holds the logic for the previous
    // paragraph.

    const { length } = text;
    for (let pos = 0, match; pos < length;) {
      while (match = execFrom(reUnimportant, text, pos)) {
        if (match[2] == null) { // (not whitespace)
          if (match[1] != null) { // (>&)
            this.argDetectState =
              this.argDetectState === 0 ? ADS_FLAG_INITIAL_REDIRECT : 0;
          } else if (this.argDetectState !== ADS_FLAG_ARGS) {
            this.argDetectState |= ADS_FLAG_WORD;
          }
        } else { // (whitespace)
          if ((this.argDetectState & ADS_FLAG_WORD) !== 0) {
            this.argDetectState = ADS_FLAG_ARGS & ~this.argDetectState >> 1;
          }
        }
        pos += match[0].length;
      }
      if (pos >= length) break;
      if (match = execFrom(reSeqOp, text, pos)) {
        this.seq();
        pos += match[0].length;
      } else {
        const char = text.charCodeAt(pos);
        if (char === CARET) {
          pos += 2;
        } else if (char === QUOTE) {
          // If you were foolish enough to leave a dangling quotation mark in
          // an unquoted span... you're likely to have bigger problems than
          // incorrect escaping. So we just do the simplest thing of looking for
          // the end quote only in this piece of text.
          pos += execFrom(reNotQuote, text, pos + 1)[0].length + 2;
        } else {
          if (char === OPEN_PAREN) {
            this.enterScope();
          } else if (char === CLOSE_PAREN) {
            this.exitScope();
          } else if (char === PIPE) {
            this.pipe();
          } else { // (char === '<' or '>')
            this.argDetectState =
              this.argDetectState === 0 ? ADS_FLAG_INITIAL_REDIRECT : 0;
          }
          pos++;
        }
      }
    }
  }
  enterScope() {
    this.currentScope = newScope(this.currentScope);
    this.argDetectState = 0;
  }
  exitScope() {
    this.currentScope = this.currentScope.parent
      || (this.currentScope.parent = newScope(null));
    this.argDetectState = ADS_FLAG_ARGS;
  }
  seq() {
    // | binds tighter than sequence operators, so the latter create new sibling
    // scopes for future |s to mutate.
    this.currentScope = newScope(this.currentScope.parent);
    this.argDetectState = 0;
  }
  pipe() {
    this.currentScope.depthDelta = 1;
    this.argDetectState = 0;
  }
  mark(obj) {
    this.scopesByObject.set(obj, this.currentScope);
    if (this.argDetectState === ADS_FLAG_ARGS) {
      this.argSet.add(obj);
    } else {
      this.argDetectState |= ADS_FLAG_WORD;
    }
  }
  at(obj) {
    const scope = this.scopesByObject.get(obj);
    return {
      depth: getDepth(scope),
      isArgument: this.argSet.has(obj),
      isNative: scope.isNative,
    };
  }
}

// These flags span the Win32Context's argument detection state machine. WORD
// is set when the context is inside a word that is not an argument (meaning it
// is either the first word in the command, or it is the object of a redirect).
// ARGS is set when the context has reached the arguments of a command.
// INITIAL_REDIRECT tracks the edge case when a redirect occurs before the
// first word of the command (if this flag is set, reaching the end of a word
// should take the state machine back to 0 instead of setting ADS_FLAG_ARGS).
const ADS_FLAG_WORD = 0x1;
const ADS_FLAG_ARGS = 0x2;
const ADS_FLAG_INITIAL_REDIRECT = 0x4;

const getDepth = scope => scope === null ? 0
  : scope.depth !== -1 ? scope.depth
  : scope.depth = getDepth(scope.parent) + scope.depthDelta;

const newScope = parent =>
  ({ parent, depthDelta: 0, depth: -1, isNative: false });

const CARET = '^'.charCodeAt();
const QUOTE = '"'.charCodeAt();
const OPEN_PAREN = '('.charCodeAt();
const CLOSE_PAREN = ')'.charCodeAt();
const PIPE = '|'.charCodeAt();

const reNotQuote = sticky('[^"]*');
const reSeqOp = sticky('&&?|\\|\\|');
const reUnimportant = sticky('(\\d*>&)|[^\\s"$&()<>^|]+|(\\s+)');
