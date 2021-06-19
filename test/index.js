const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')

spawk.preventUnmatched()
t.beforeEach(() => {
  spawk.clean()
})

t.test('can run a child process', async (t) => {
  const command = 'echo'
  const args = ['hello world']
  const options = {
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
  const interceptor = spawk.spawn(command, args, options)
    .stdout(output)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command,
    args,
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  t.match(child, {
    cmd: command,
    args,
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
  const options = {
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

  const interceptor = spawk.spawn(command, args, options)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command,
    args,
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  t.match(child, {
    cmd: command,
    args,
    code: 0,
    signal: undefined,
    stdout: null,
    stderr: null,
    ...extra,
  }, 'result has all expected properties')
})
