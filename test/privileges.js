const { Formatter } = require('../puka-dev')
const inferOwner = require('infer-owner')
const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')

spawk.preventUnmatched()
// we hijack process.getuid for each of these tests in order to pretend we're
// calling exec as the root user
t.beforeEach((t) => {
  spawk.clean()
  Formatter.default = Formatter.for('linux')
  t.context.getuid = process.getuid
  process.getuid = () => 0
})

t.afterEach((t) => {
  Formatter.default = undefined
  process.getuid = t.context.getuid
})

t.test('infers uid/gid based on options.cwd when running as root', async (t) => {
  const cwd = t.testdir()
  // get the owner of cwd, we'll expect this in the options passed to spawn
  const { uid, gid } = await inferOwner(cwd)

  const command = 'echo'
  const args = ['hello world']
  const expectedArgs = ['-c', `echo 'hello world'`]
  const options = {
    scriptShell: 'sh',
    stdioString: true,
    cwd,
    env: {
      HOME: '/my/home',
    },
  }

  const extra = {
    description: 'echoes "hello world"',
  }

  const output = '"hello world"'
  const interceptor = spawk.spawn(options.scriptShell, expectedArgs, {
    ...options,
    uid,
    gid,
  })
    .stdout(output)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    options: {
      ...options,
      uid,
      gid,
    },
  }, 'passed the correct parameters to child_process.spawn()')

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

t.test('infers uid/gid based on process.cwd() when running as root, and options.cwd is unset', async (t) => {
  // get the owner of cwd, we'll expect this in the options passed to spawn
  const { uid, gid } = await inferOwner(process.cwd())

  const command = 'echo'
  const args = ['hello world']
  const expectedArgs = ['-c', `echo 'hello world'`]
  const options = {
    scriptShell: 'sh',
    stdioString: true,
    env: {
      HOME: '/my/home',
    },
  }

  const extra = {
    description: 'echoes "hello world"',
  }

  const output = '"hello world"'
  const interceptor = spawk.spawn(options.scriptShell, expectedArgs, {
    ...options,
    uid,
    gid,
  })
    .stdout(output)

  const child = await exec(command, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    options: {
      ...options,
      uid,
      gid,
    },
  }, 'passed the correct parameters to child_process.spawn()')

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
