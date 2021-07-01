import test from 'ava';
import { quoteForCmd } from './quoteForCmd';

test("throw on line breaks", t => {
  t.expect(() => quoteForCmd('Hello\rworld'),
    "to throw", new Error("Line breaks can't be quoted on Windows"));
  t.expect(() => quoteForCmd('Hello\nworld'),
    "to throw", new Error("Line breaks can't be quoted on Windows"));
});

test("quote conservatively", t => {
  t.expect(quoteForCmd('no-quotation-needed'),
    "to be", 'no-quotation-needed');
  t.expect(quoteForCmd('quotation needed'),
    "to be", '"quotation needed"');
  t.expect(quoteForCmd('"caret" quotation needed'),
    "to be", '^"\\^"caret\\^"^ quotation^ needed^"');
});

test("quote aggressively", t => {
  t.expect(quoteForCmd('no-quotation-needed', true),
    "to be", '"no-quotation-needed"');
});
