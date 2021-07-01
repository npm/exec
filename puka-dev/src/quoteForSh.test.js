import test from 'ava';
import { quoteForSh } from './quoteForSh';

test("empty string", t => {
  t.expect(quoteForSh(""), "to be", "''");
});

test("no redundant quotes", t => {
  t.expect(quoteForSh("'foo'"), "to be", "\\''foo'\\'");
});

test("quote conservatively", t => {
  t.expect(quoteForSh('no-quotation-needed'), "to be", 'no-quotation-needed');
});

test("quote aggressively", t => {
  t.expect(quoteForSh('no-quotation-needed', true),
    "to be", "'no-quotation-needed'");
});
