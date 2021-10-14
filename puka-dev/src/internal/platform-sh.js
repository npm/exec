export const quoteForSh =
  (text, forceQuote) => text.length
    ? forceQuote || shMetaChars.test(text)
      ? `'${text.replace(/'/g, "'\\''")}'`
        .replace(/^(?:'')+(?!$)/, '')
        .replace(/\\'''/g, "\\'")
      : text
    : "''";

export const shMetaChars = /[\t\n\r "#$&'()*;<>?\\`|~]/;
