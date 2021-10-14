import test from 'ava';
import { quoteForWin32 } from './platform-win32';

test('quoteForWin32 cases', t => {
  t.expect(quoteForWin32('hello"world'), "to be", '"hello\\"world"');
  t.expect(quoteForWin32('hello""world'), "to be", '"hello\\"\\"world"');
  t.expect(quoteForWin32('hello\\world'), "to be", 'hello\\world');
  t.expect(quoteForWin32('hello\\\\world'), "to be", 'hello\\\\world');
  t.expect(quoteForWin32('hello\\"world'), "to be", '"hello\\\\\\"world"');
  t.expect(quoteForWin32('hello\\\\"world'),
    "to be", '"hello\\\\\\\\\\"world"');
  t.expect(quoteForWin32('hello world\\'), "to be", '"hello world\\\\"');
});
