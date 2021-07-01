import test from 'ava';
import * as gen from 'chance-generators';
import unexpected from 'unexpected';
import unexpectedCheck from 'unexpected-check';
import { setUnexpected } from '../../test/helpers/ava-unexpected';
import { BitSet } from './BitSet';

const expect = unexpected.clone()
  .use(unexpectedCheck);

expect.addAssertion("<number> to <number> <assertion>",
  (expect, from, to) => {
    expect.errorMode = 'bubble';
    for (let i = from; i < to; i++) {
      expect.shift(i);
    }
  });

expect.addAssertion("<array> to be equal", (expect, [l, r]) =>
  expect(l, "to be", r));

setUnexpected(expect);

const bitSetEquivalentToSet = values => {
  const a = new BitSet();
  const b = new Set();
  for (const value of values) {
    a.add(value);
    b.add(value);
  }
  expect(0, "to", 100,
    "when passed as parameter to", i => [a.has(i), b.has(i)],
    "to be equal");
};

test("BitSet is equivalent to Set", t =>
  t.expect(bitSetEquivalentToSet, "to be valid for all",
    gen.array(gen.natural({ max: 89 }))));
