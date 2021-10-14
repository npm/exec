// we grab the Formatter class from puka so we can force the escaping to be
// for the platform we want in each test
const { Formatter } = require('../puka-dev')
const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')

spawk.preventUnmatched()
t.beforeEach(() => {
  Formatter.default = Formatter.for('linux')
  spawk.clean()
})

t.afterEach(() => {
  Formatter.default = undefined
})

t.test('can run a child process', async (t) => {
  const command = 'echo'
  const args = ['hello world']
  const expectedArgs = ['-c', `echo 'hello world'`]
  const options = {
    scriptShell: 'sh',
    stdioString: true,
    cwd: '/some/dir',
    env: {
      HOME: '/my/home',
    },
  }

  const extra = {
    description: 'echoes "hello world"',
  }

  const output = '"hello world"'
  const interceptor = spawk.spawn(options.scriptShell, expectedArgs, options)
    .stdout(output)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')

  t.match(child, {
    cmd: options.scriptShell,
    args: expectedArgs,
    code: 0,
    signal: undefined,
    stdout: '"hello world"',
    stderr: '',
    ...extra,
  }, 'result has all expected properties')
})

t.test('do not end stdin on the child when it does not have one', async (t) => {
  const command = 'echo'
  const args = ['hello world']
  const expectedArgs = ['-c', `echo 'hello world'`]
  const options = {
    scriptShell: 'sh',
    stdioString: true,
    cwd: '/some/dir',
    stdio: 'inherit',
    env: {
      HOME: '/my/home',
    },
  }

  const extra = {
    description: 'echoes "hello world"',
  }

  const interceptor = spawk.spawn(options.scriptShell, expectedArgs, options)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')

  t.match(child, {
    cmd: options.scriptShell,
    args: expectedArgs,
    code: 0,
    signal: undefined,
    stdout: null,
    stderr: null,
    ...extra,
  }, 'result has all expected properties')
})
