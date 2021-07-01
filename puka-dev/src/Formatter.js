import { preformatSymbol } from './symbols';
import { quoteForCmd, cmdMetaChars, Win32Context }
  from './internal/platform-win32';
import { quoteForSh, shMetaChars } from './internal/platform-sh';

/**
 * To get a Formatter, call `Formatter.for`.
 *
 * To create a new Formatter, pass an object to `Formatter.declare`.
 *
 * To set the global default Formatter, assign to `Formatter.default`.
 *
 * @class
 * @property {Formatter} default - The Formatter to be used when no platform
 * is provided—for example, when creating strings with `sh`.
 * @ignore
 */
export function Formatter() {}

Object.assign(Formatter, /** @lends Formatter */ {
  /**
   * Gets a Formatter that has been declared for the provided platform, or
   * the base `'sh'` formatter if there is no Formatter specific to this
   * platform, or the Formatter for the current platform if no specific platform
   * is provided.
   */
  for(platform) {
    return platform == null
      ? Formatter.default
        || (Formatter.default = Formatter.for(process.platform))
      : Formatter._registry.get(platform)
        || Formatter._registry.get('sh');
  },

  /**
   * Creates a new Formatter or mutates the properties on an existing
   * Formatter. The `platform` key on the provided properties object determines
   * when the Formatter is retrieved.
   */
  declare(props) {
    const platform = props && props.platform || 'sh';
    const existingFormatter = Formatter._registry.get(platform);
    const formatter =
      Object.assign(existingFormatter || new Formatter(), props);
    formatter.emptyString === void 0
      && (formatter.emptyString = formatter.quote('', true));
    existingFormatter || Formatter._registry.set(formatter.platform, formatter);
  },

  _registry: new Map(),

  prototype: {
    platform: 'sh',
    quote: quoteForSh,
    metaChars: shMetaChars,
    hasExtraMetaChars: false,
    statementSeparator: ';',
    createContext() {
      return defaultContext;
    }
  },
});

const defaultContext = {
  at() {},
};

Formatter.declare();

Formatter.declare({
  platform: 'win32',
  quote(text, forceQuote, opts) {
    const caretDepth = opts
      ? (opts.depth || 0) + (opts.isArgument && !opts.isNative ? 1 : 0)
      : 0;
    return quoteForCmd(text, forceQuote, caretDepth);
  },
  metaChars: cmdMetaChars,
  hasExtraMetaChars: true,
  statementSeparator: '&',
  createContext(root) {
    const context = new this.Context();
    root[preformatSymbol](context);
    return context;
  },
  Context: Win32Context,
});
