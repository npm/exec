import { formatSymbol, preformatSymbol } from './symbols';

/**
 * Represents a contiguous span of text that will not be quoted.
 * @ignore
 */
export class ShellStringUnquoted {
  constructor(value) {
    this.value = value;
  }

  [formatSymbol]() {
    return this.value;
  }

  [preformatSymbol](context) {
    context.read(this.value);
  }
}
