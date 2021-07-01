import * as gen from 'chance-generators';

const symbolicRanges = [
  { min: 0x01, max: 0x2F },
  { min: 0x3A, max: 0x40 },
  { min: 0x5B, max: 0x60 },
  { min: 0x7B, max: 0x7F },
];

const symbolicCodePoints = gen.weighted(
  symbolicRanges.map(r => [gen.natural(r), r.max - r.min + 1]));

const anyCharacter =
  gen.weighted([
    [symbolicCodePoints, 6],
    [gen.natural({ min: 0x01, max: 0x7F }), 1],
    [gen.natural({ min: 0x80, max: 0xD7FF }), 1],
    [gen.natural({ min: 0x100000, max: 0x10FFFD }), 1],
  ]).map(n => String.fromCodePoint(n));

export const specialStrings = [
  '\n', '\r', '\t', '\f', '\v', ' ', '"', '#', '$X', '%CD%', '!CD!', '&', "'",
  '(', ')', '*', '?', ';', '<', '>', '\\', '\\"', '^', '|', '~', '!', ':',
  '\u2029', '\\"<'];

const specialString = gen.pickone(specialStrings);

export const trickyString =
  gen.array(
    gen.weighted([[specialString, 3], [anyCharacter, 1]]),
    { max: 10 })
    .map(arr => arr.join(''));
