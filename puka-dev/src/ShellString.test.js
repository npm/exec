import test from 'ava';
import { ShellString } from './ShellString';
import { unquoted } from './unquoted';

const { sh } = ShellString;

test("empty string", t => {
  t.expect(sh``.toString('linux'), "to be empty");
});

test("quotation on non-win32", t => {
  const nice = 'world';
  t.expect(sh`hello ${nice}`.toString('linux'),
    "to be", 'hello world');
  const ugly = "don't go";
  t.expect(sh`hello ${ugly}`.toString('linux'),
    "to be", "hello 'don'\\''t go'");
  t.expect(sh`hello ${''}`.toString('linux'), "to be", "hello ''");
  t.expect(sh`open "Alice's file.txt" -a 'Notepad'`.toString('linux'),
    "to be", "open 'Alice'\\''s file.txt' -a 'Notepad'");
});

test("quotation on win32", t => {
  const nice = 'world';
  t.expect(sh`hello ${nice}`.toString('win32'),
    "to be", 'hello world');
  const ugly = '"human"';
  t.expect(sh`hello ${ugly}`.toString('win32'),
    "to be", 'hello ^^^"\\^^^"human\\^^^"^^^"');
});

test("no closing double quote", t =>
  t.expect(() => sh`hello "world`,
    "to throw", new SyntaxError('String is missing a " character')));

test("no closing single quote", t =>
  t.expect(() => sh`hello 'world`,
    "to throw", new SyntaxError("String is missing a ' character")));

test("don't absorb prefix into quotes", t =>
  t.expect(sh`--x="y z"`.toString('linux'),
    "to be", "--x='y z'"));

test("absorb prefix into interpolation", t =>
  t.expect(sh`--x=${'y z'}`.toString('linux'),
    "to be", "'--x=y z'"));

test("don't absorb prefix into unquoted", t =>
  t.expect(sh`--w=${'x y'}${unquoted(' z')}`.toString('linux'),
    "to be", "'--w=x y' z"));

test("don't absorb suffix into quotes", t =>
  t.expect(sh`"My Program".exe`.toString('win32'),
    "to be", '"My Program".exe'));

test("absorb suffix into interpolation", t =>
  t.expect(sh`${'My Program'}.exe`.toString('win32'),
    "to be", '"My Program.exe"'));

test("literal redirects", t =>
  t.expect(sh`foo < bar > baz`.toString('linux'),
    "to be", "foo < bar > baz"));

test("don't absorb redirect", t =>
  t.expect(sh`script <${'file name'}`.toString('win32'),
    "to be", 'script <"file name"'));

test("redirect stderr to stdout", t => {
  t.expect(sh`script 2>&1 | more`.toString('linux'),
    "to be", 'script 2>&1 | more');
  t.expect(sh`script 2>&1 | more`.toString('win32'),
    "to be", 'script 2>&1 | more');
});

test("don't absorb pipe", t => {
  t.expect(sh`script ${'file name'}|next-script`.toString('win32'),
    "to be", 'script "file name"|next-script');
  t.expect(sh`script stuff|${['next', 'script']}`.toString('win32'),
    "to be", 'script stuff|next script');
  t.expect(sh`script ${'file name'}|${'next script'}`.toString('win32'),
    "to be", 'script "file name"|"next script"');
  t.expect(sh`script stuff|do-${['next', 'my script']}`.toString('win32'),
    "to be", 'script stuff|do-next "do-my script"');
});

test("immediate quote", t =>
  t.expect(sh`"quoted"`.toString('linux'),
    "to be", "'quoted'"));

test("interpolation inside quotes", t =>
  t.expect(sh`"quoted ${'spaced string'}"`.toString('linux'),
    "to be", "'quoted spaced string'"));

test("unquoted", t =>
  t.expect(sh`script ${unquoted('>')} file`.toString('linux'),
    "to be", 'script > file'));

test("unquoted inside quotes", t =>
  t.expect(sh`"${unquoted('x x')}"`.toString('win32'), "to be", '"x x"'));

test("substring", t => {
  const cmdA = sh`script foo`;
  const cmdB = sh`script bar`;
  t.expect(sh`${cmdA} | ${cmdB}`.toString('linux'),
    "to be", 'script foo | script bar');
});

test("substring inside quotes", t => {
  const cmdA = sh`why 'would' you`;
  t.expect(sh`"${cmdA} want this"`.toString('win32'),
    "to be", '^"why^ \\^"would\\^"^ you^ want^ this^"');
});

test("concatenating special values", t => {
  t.expect(sh`boo${sh`"h o o"`}`.toString('linux'),
    "to be", "boo'h o o'");
  t.expect(sh`boo${unquoted('h o o')}`.toString('linux'),
    "to be", "booh o o");
});

test("can interpolate arrays", t =>
  t.expect(sh`cat ${["file one", "file two"]}`.toString('linux'),
    "to be", "cat 'file one' 'file two'"));

test("can quote interpolated arrays", t =>
  t.expect(sh`cat '${["file_one", "file_two"]}'`.toString('linux'),
    "to be", "cat 'file_one' 'file_two'"));

test("can handle empty arrays", t => {
  t.expect(sh`cat ${[]}`.toString('linux'), "to be", 'cat');
  t.expect(sh`cat '${[]}'`.toString('linux'), "to be", 'cat');
});

test("arrays with affixes", t => {
  t.expect(sh`script --file=${['foo', 'bar']}.txt`.toString('linux'),
    "to be", "script --file=foo.txt --file=bar.txt");
  t.expect(sh`script --file=${[]}.txt`.toString('linux'),
    "to be", "script");
});

test("multiple arrays", t => {
  t.expect(sh`cat ${[]} ${['foo', 'bar']}.${['txt', 'log']}`.toString('linux'),
    "to be", "cat foo.txt foo.log bar.txt bar.log");
  t.expect(sh`cat ${[]} ${['foo', 'bar']}.${[]}`.toString('linux'),
    "to be", "cat");
});

test("limit interpolation size", t => {
  const n = '0123456789'.split('');
  t.expect(() => sh`echo ${n}${n}${n}${n}${n}${n}${n}${n}`,
    "to throw", new RangeError("Far too many elements to interpolate"));
});

test("redirect with arrays", t => {
  t.expect(sh`script  < ${['foo', 'bar']}`.toString('linux'),
    "to be", "script  < foo  < bar");
  t.expect(sh`script >>${['foo', 'bar']}`.toString('linux'),
    "to be", "script >>foo >>bar");
  t.expect(sh`script<${['foo', 'bar']}`.toString('linux'),
    "to be", "script<foo<bar");
  t.expect(sh`script  < ${[]}`.toString('linux'),
    "to be", "script");
});

test("numbered redirects", t => {
  t.expect(sh`script 2> ${['foo', 'bar']}`.toString('linux'),
    "to be", "script 2> foo 2> bar");
  t.expect(sh`script 2 > ${['foo', 'bar']}`.toString('linux'),
    "to be", "script 2 > foo > bar");
  t.expect(sh`script2> ${['foo', 'bar']}`.toString('linux'),
    "to be", "script2> foo> bar");
});

test("spacing", t => {
  const actual0 = sh`script
    --file=${['foo', 'bar']}.txt
    --config=${'file'}
  | qux`.toString('linux');
  const expected0 = `script
    --file=foo.txt --file=bar.txt
    --config=file
  | qux`;
  t.expect(actual0, "to be", expected0);
  let actual1Unrendered;
  const actual1 = (actual1Unrendered = sh`script
    --file=${[]}.txt
    --config=${[]}
  | qux`).toString('linux');
  const expected1 = `script
  | qux`;
  t.expect(actual1, "to be", expected1);
  t.expect(actual1Unrendered.children, "to have length", 3);
});

test("valueOf", t => t.expect('' + sh`blah blah`, "to be", "blah blah"));

test("generators", t => {
  const gen = function* () {
    yield 'foo';
    yield unquoted('bar baz');
    yield 'qu ux';
  };
  t.expect(sh`script ${gen()}`.toString('linux'),
    "to be", "script foo bar baz 'qu ux'");
});

test("non-string values", t =>
  t.expect(sh`${[null, void 0, true, [], {}]}`.toString('linux'),
    "to be", "null undefined true '' '[object Object]'"));
