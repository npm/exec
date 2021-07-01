import { formatSymbol, preformatSymbol } from './symbols';

/**
 * Represents a semicolon... or an ampersand, on Windows.
 * @ignore
 */
export const shellStringSemicolon = {
  [formatSymbol](formatter) {
    return formatter.statementSeparator;
  },

  [preformatSymbol](context) {
    context.seq();
  }
};
