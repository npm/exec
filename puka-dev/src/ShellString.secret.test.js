import test from 'ava';
import { ShellString } from './ShellString';
import { formatSymbol, preformatSymbol } from './symbols';

// Even if you can, that doesn't mean you should... but let's make sure you can.

const { sh } = ShellString;

const devNull = {
  [formatSymbol](formatter) {
    return formatter.platform === 'win32' ? 'NUL' : '/dev/null';
  }
};

class NativeExecutable {
  constructor(ss) {
    this.shellString = ss;
  }

  [formatSymbol](formatter, context) {
    return this.shellString[formatSymbol](formatter, context);
  }

  [preformatSymbol](context) {
    const savedScope = context.currentScope;
    context.enterScope();
    this.shellString[preformatSymbol](context);
    context.currentScope.depthDelta--;
    context.currentScope.isNative = true;
    context.currentScope = savedScope;
  }
}

const exe = ss => new NativeExecutable(ss);

test("can redirect to a platform-appropriate /dev/null", t => {
  const cmd = sh`script > ${devNull}`;
  t.expect(cmd.toString('linux'),
    "to be", 'script > /dev/null');
  t.expect(cmd.toString('win32'),
    "to be", 'script > NUL');
});

test("can workaround batch escaping for piping to non-batch commands", t => {
  const args = ['%test%'];
  const cmd = sh`script | ${exe(sh`node ${args}`)} | script`;
  t.expect(cmd.toString('linux'),
    "to be", 'script | node %test% | script');
  t.expect(cmd.toString('win32'),
    "to be", 'script | node ^%test^% | script');
});
