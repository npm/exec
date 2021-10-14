import { spawn } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import os from 'os';
import path from 'path';
import test from 'ava';
import unexpected from 'unexpected';
import unexpectedCheck from 'unexpected-check';
import unexpectedStream from 'unexpected-stream';
import { specialStrings, trickyString } from '../test/helpers/generators';
import { setUnexpected } from '../test/helpers/ava-unexpected';
import { sh } from './sh';

const expect = unexpected.clone()
  .use(unexpectedCheck)
  .use(unexpectedStream);

expect.addAssertion("<string> to output to (stdout|stderr) [satisfying] <any>",
  (expect, subject, cmp) => {
    const stream = expect.alternations[0];
    const stdio = ['pipe', 'pipe', stream === 'stderr' ? 'pipe' : 'inherit'];
    return expect(spawn(subject, { shell: true, stdio })[stream],
      "to yield output satisfying",
      "when decoded as", 'utf8',
      ...expect.flags.satisfying
        ? ["to satisfy", cmp]
        : ["to be", `${cmp}\n`]);
  });

setUnexpected(expect);

let ignoreLineBreakErrors = x => x;
if (process.platform === 'win32') {
  ignoreLineBreakErrors = testFn => t => {
    try {
      const result = testFn(t);
      return result === Object(result) && 'catch' in result
        ? result.catch(e => handler(t, e))
        : result;
    } catch (e) {
      handler(t, e);
    }
  };
  const handler = (t, e) => {
    if (e.message !== "Line breaks can't be quoted on Windows") throw e;
    t === Object(t) && 'pass' in t && t.pass();
  };
}

async function tempFile(contents, prefix, fn) {
  if (typeof prefix === 'function') {
    fn = prefix;
    prefix = '';
  }
  const fileName = 'delete-me' + prefix + Math.random().toString(16).substr(1);
  const file = path.join(os.tmpdir(), fileName);
  writeFileSync(file, contents);
  try {
    await fn(file);
  } finally {
    unlinkSync(file);
  }
}

test("empty string", t => t.expect(sh``, "to be empty"));

const argStringEqualsOutString = ignoreLineBreakErrors(arg =>
  tempFile(arg, file =>
    expect(
      sh`expect-arg 0 ${file} ${arg}`,
      "to output to stderr satisfying", allOk(1))));

test.serial("round trip [spawn]", t =>
  t.expect(argStringEqualsOutString, "to be valid for all", trickyString));

const allOk = n => expect.it(
  "when passed as parameter to", str => str.split('\n').slice(0, -1),
  "to satisfy", expect.it(
    "to have length", n)
    .and("to have items satisfying",
      "to begin with", 'ok'));

test.serial("several pipes [spawn]", t => {
  const arg = '%CD% ^_^"';
  return tempFile(arg, file => t.expect(
    sh`expect-arg 0 ${file} ${arg} \
| expect-arg 1 ${file} ${arg} \
| expect-arg 2 ${file} ${arg} \
| expect-arg 3 ${file} ${arg}`,
    "to output to stderr satisfying", allOk(4)));
});

test.serial("left-nested pipes [spawn]", t => {
  const arg = '%CD% ^_^"';
  return tempFile(arg, file => t.expect(
    sh`(((expect-arg 0 ${file} ${arg} \
| expect-arg 1 ${file} ${arg}) \
| expect-arg 2 ${file} ${arg}) \
| expect-arg 3 ${file} ${arg}) \
| expect-arg 4 ${file} ${arg}`,
    "to output to stderr satisfying", allOk(5)));
});

test.serial("right-nested pipes [spawn]", t => {
  const arg = '%CD% ^_^"';
  return tempFile(arg, file => t.expect(
    sh`expect-arg 0 ${file} ${arg} \
| (expect-arg 1 ${file} ${arg} \
| (expect-arg 2 ${file} ${arg} \
| (expect-arg 3 ${file} ${arg} \
| expect-arg 4 ${file} ${arg})))`,
    "to output to stderr satisfying", allOk(5)));
});

test.serial("pipe and redirect in [spawn]", t => {
  const arg = '%CD% ^_^';
  return tempFile('ok\n', arg, file => t.expect(
    sh`nodecat < ${file} | nodecat`,
    "to output to stdout", 'ok'));
});

test.serial("pipe and initial redirect in [spawn]", t => {
  const arg = '%CD% ^_^';
  return tempFile('ok\n', arg, file => t.expect(
    sh`< ${file} nodecat | nodecat`,
    "to output to stdout", 'ok'));
});

test.serial("pipe and redirect out [spawn]", t => {
  const arg = '%CD% ^_^';
  return tempFile('fail\n', arg, async file => {
    await t.expect(
      sh`echo-cli foo | nodecat > ${file} && echo-cli ok`,
      "to output to stdout", 'ok');
    return t.expect(readFileSync(file, 'utf8'), "to be", 'foo\n');
  });
});

test.serial("pipe and initial redirect out [spawn]", t => {
  const arg = '%CD% ^_^';
  return tempFile('fail\n', arg, async file => {
    await t.expect(
      sh`echo-cli foo | > ${file} nodecat && echo-cli ok`,
      "to output to stdout", 'ok');
    return t.expect(readFileSync(file, 'utf8'), "to be", 'foo\n');
  });
});

test.serial("many shell operators [spawn]", t => {
  const arg = '%CD% ^_^ \\"<';
  return tempFile(arg, file =>
    tempFile('foo', '%CD% ^_^', trickyFile => t.expect(
      sh`(expect-arg 0 ${file} ${arg} | expect-arg 1 ${file} "${arg}") \
| (expect-arg 2 ${file} ${arg} 1 || expect-arg 3 ${file} ${arg}) \
| expect-arg 4 ${file} ${arg} \
| ( (expect-arg 5 ${file} ${arg})) \
&& (expect-arg 6 ${file} ${arg} | \
(expect-arg 7 ${file} ${arg} | expect-arg 8 ${file} ${arg} & \
expect-arg 9 - foo < ${trickyFile} | \
expect-arg 10 ${file} ${arg}))`,
      "to output to stderr satisfying", allOk(11))));
});

// '^' forces caret escaping but not quoting, and vice versa for ' '
for (const str of ['^', ' ']) {
  test.serial(`can redirect ${JSON.stringify(str)} [spawn]`, t =>
    tempFile('foo', str, async file => {
      for (const cmd of [
        sh`expect-arg 0 - foo < ${file}`,
        sh`expect-arg 0 - foo < ${file} | nodecat`,
        sh`(expect-arg 0 - foo < ${file} | nodecat) | nodecat`,
      ]) {
        await t.expect(cmd, "to output to stderr satisfying", allOk(1));
      }
    }));
}

for (const arg of specialStrings) {
  const printableArg = JSON.stringify(arg).replace(/[^\u0000-\u007e]/g, c =>
    '\\u' + c.charCodeAt(0).toString(16));

  test.serial(`can pipe ${printableArg} [spawn]`, ignoreLineBreakErrors(t =>
    tempFile(arg, file =>
      t.expect(
        sh`expect-arg 0 ${file} ${arg} | expect-arg 1 ${file} ${arg}`,
        "to output to stderr satisfying", allOk(2)))));

  test.serial(`can concatenate ${printableArg} [spawn]`,
    ignoreLineBreakErrors(t =>
      tempFile(`${arg}-xxx`, file =>
        t.expect(
          sh`expect-arg 0 ${file} ${arg}-xxx`,
          "to output to stderr satisfying", allOk(1)))));
}
