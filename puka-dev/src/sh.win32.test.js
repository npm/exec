import test from 'ava';
import { Formatter } from './Formatter';
import { sh } from './sh';
import { unquoted } from './unquoted';

// This file is for tests that exercise behaviors specific to win32.

Formatter.default = Formatter.for('win32');

test("translate semicolon to ampersand", t => {
  t.expect(sh`foo; bar`, "to be", 'foo& bar');
});

test("protect characters special on Windows only", t => {
  t.expect(sh`script %PATH%`, "to be", 'script ^^^%PATH^^^%');
  t.expect(sh`script "%PATH%"`, "to be", 'script ^^^"^^^%PATH^^^%^^^"');
});

test("pipes add carets on the right", t =>
  t.expect(sh`foo | bar ${'"'}`,
    "to be", 'foo | bar ^^^^^^^"\\^^^^^^^"^^^^^^^"'));

test("pipes add carets on the left", t =>
  t.expect(sh`foo ${'"'} | bar`,
    "to be", 'foo ^^^^^^^"\\^^^^^^^"^^^^^^^" | bar'));

test("more pipes add more carets", t =>
  t.expect(sh`foo | (bar | baz ${'"'})`,
    "to be",
    'foo | (bar | baz ^^^^^^^^^^^^^^^"\\^^^^^^^^^^^^^^^"^^^^^^^^^^^^^^^")'));

test("unquoted pipes count", t =>
  t.expect(sh`foo ${unquoted('|')} bar ${'"'}`,
    "to be", 'foo | bar ^^^^^^^"\\^^^^^^^"^^^^^^^"'));

test("careted pipes don't count", t =>
  t.expect(sh`foo ${unquoted('^|')} bar ${'"'}`,
    "to be", 'foo ^| bar ^^^"\\^^^"^^^"'));

test("quoted pipes don't count", t =>
  t.expect(sh`foo ${unquoted('"> | <"')} bar ${'"'}`,
    "to be", 'foo "> | <" bar ^^^"\\^^^"^^^"'));

test("sequence operators don't count", t =>
  t.expect(sh`foo || bar ${'"'}`,
    "to be", 'foo || bar ^^^"\\^^^"^^^"'));

test("unmatched parentheses don't ruin everything", t =>
  t.expect(sh`foo | bar); baz ${'"'}`,
    "to be", 'foo | bar)& baz ^^^"\\^^^"^^^"'));

test("redirects count", t =>
  t.expect(sh`foo | (bar > ${'%'} | baz)`,
    "to be", 'foo | (bar > ^^^^^^^% | baz)'));

test("redirecting stderr to stdout isn't a sequence operator", t =>
  t.expect(sh`foo % 2>&1 | bar`,
    "to be", 'foo ^^^^^^^% 2>&1 | bar'));

test("quoted paths don't get carets", t =>
  t.expect(sh`"C:\\Program Files\\example\\example.bat" %`,
    "to be", '"C:\\Program Files\\example\\example.bat" ^^^%'));

test("paths that need escaping get carets", t =>
  t.expect(sh`C:\\example%\\example.bat %`,
    "to be", 'C:\\example^%\\example.bat ^^^%'));

test("quoted paths that need escaping get carets", t =>
  t.expect(sh`"C:\\Program Files\\example%\\example.bat" %`,
    "to be", '^"C:\\Program^ Files\\example^%\\example.bat^" ^^^%'));

test("placeholder paths that need escaping get carets", t =>
  t.expect(sh`${'C:\\example%\\example.bat'} %`,
    "to be", 'C:\\example^%\\example.bat ^^^%'));

test("placeholder arguments don't affect argument escaping", t =>
  t.expect(sh`foo % ${'%'} %`,
    "to be", 'foo ^^^% ^^^% ^^^%'));

test("placeholder word parts don't affect argument escaping", t =>
  t.expect(sh`foo%${['x', 'y']}% %${'z'}%`,
    "to be", 'foo^%x^% foo^^^%y^^^% ^^^%z^^^%'));

test("placeholder pipes do affect argument escaping", t =>
  t.expect(sh`foo % ${unquoted('|')} %`,
    "to be", 'foo ^^^^^^^% | ^^^%'));

test("placeholder redirects do affect argument escaping", t =>
  t.expect(sh`foo % ${unquoted('>')} %`,
    "to be", 'foo ^^^% > ^%'));

test("placeholder redirects, multiple outputs, and argument escaping", t =>
  t.expect(sh`foo % ${unquoted('>')}${['%', '%%']} %`,
    "to be", 'foo ^^^% >^% >^%^% ^^^%'));

test("redirects that start the command and paths that need escaping", t =>
  t.expect(sh`> % C:\\example%\\example.bat %`,
    "to be", '> ^% C:\\example^%\\example.bat ^^^%'));

test("redirects to placeholders that start the command", t =>
  t.expect(sh`> ${'%'} C:\\example%\\example.bat %`,
    "to be", '> ^% C:\\example^%\\example.bat ^^^%'));

test("placeholder redirects that start the command", t =>
  t.expect(sh`${unquoted('>')} % C:\\example%\\example.bat %`,
    "to be", '> ^% C:\\example^%\\example.bat ^^^%'));

test("placeholder partial redirects that start the command", t =>
  t.expect(sh`${unquoted('> foo')}% C:\\example%\\example.bat %`,
    "to be", '> foo^% C:\\example^%\\example.bat ^^^%'));

test("placeholder completed redirects that start the command", t =>
  t.expect(sh`${unquoted('> foo')} C:\\example%\\example.bat %`,
    "to be", '> foo C:\\example^%\\example.bat ^^^%'));

test("placeholder completed redirects with command", t =>
  t.expect(sh`${unquoted('> foo script')} C:\\example%\\example.bat`,
    "to be", '> foo script C:\\example^^^%\\example.bat'));

test("initial redirect stderr to stdout", t =>
  t.expect(sh`2>&1 C:\\example%\\example.bat %`,
    "to be", '2>&1 C:\\example^%\\example.bat ^^^%'));

test("initial redirect stdout to stderr", t =>
  t.expect(sh`>& 2 C:\\example%\\example.bat %`,
    "to be", '>& 2 C:\\example^%\\example.bat ^^^%'));

test("internal redirect stdout to stderr", t =>
  t.expect(sh`C:\\example%\\example.bat 1>&2 %`,
    "to be", 'C:\\example^%\\example.bat 1>&2 ^^^%'));
