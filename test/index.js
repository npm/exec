const inferOwner = require('infer-owner')
const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')

spawk.preventUnmatched()
t.beforeEach(() => {
  spawk.clean()
})

t.test('can run a child process', async (t) => {
  const cmd = 'echo'
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
  const interceptor = spawk.spawn(cmd, args, options)
    .stdout(output)

  const child = await exec(cmd, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command: 'echo',
    args: ['hello world'],
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  t.match(child, {
    cmd: 'echo',
    args: ['hello world'],
    code: 0,
    signal: undefined,
    stdout: '"hello world"',
    stderr: '',
    description: extra.description,
  }, 'result has all expected properties')
})

t.test('infers uid/gid based on options.cwd when running as root', async (t) => {
  const cwd = t.testdir()
  // get the owner of cwd, we'll expect this in the options passed to spawn
  const { uid, gid } = await inferOwner(cwd)

  // capture process.getuid() so we can pretend we're root
  const realGetuid = process.getuid
  process.getuid = () => {
    // put it back after the first call
    process.getuid = realGetuid
    return 0
  }

  // make sure we clean up after ourselves, just in case
  t.teardown(() => {
    process.getuid = realGetuid
  })

  const cmd = 'echo'
  const args = ['hello world']
  const options = {
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
  const interceptor = spawk.spawn(cmd, args, {
    ...options,
    uid,
    gid,
  })
    .stdout(output)

  const child = await exec(cmd, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command: 'echo',
    args: ['hello world'],
    options: {
      ...options,
      uid,
      gid,
    },
  }, 'passed the correct parameters to child_process.spawn()')

  t.match(child, {
    cmd: 'echo',
    args: ['hello world'],
    code: 0,
    signal: undefined,
    stdout: '"hello world"',
    stderr: '',
    description: extra.description,
  }, 'result has all expected properties')
})

t.test('infers uid/gid based on process.cwd() when running as root, and options.cwd is unset', async (t) => {
  // get the owner of cwd, we'll expect this in the options passed to spawn
  const { uid, gid } = await inferOwner(process.cwd())

  // capture process.getuid() so we can pretend we're root
  const realGetuid = process.getuid
  process.getuid = () => {
    // put it back after the first call
    process.getuid = realGetuid
    return 0
  }

  // make sure we clean up after ourselves, just in case
  t.teardown(() => {
    process.getuid = realGetuid
  })

  const cmd = 'echo'
  const args = ['hello world']
  const options = {
    stdioString: true,
    env: {
      HOME: '/my/home',
    },
  }

  const extra = {
    description: 'echoes "hello world"',
  }

  const output = '"hello world"'
  const interceptor = spawk.spawn(cmd, args, {
    ...options,
    uid,
    gid,
  })
    .stdout(output)

  const child = await exec(cmd, args, options, extra)
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command: 'echo',
    args: ['hello world'],
    options: {
      ...options,
      uid,
      gid,
    },
  }, 'passed the correct parameters to child_process.spawn()')

  t.match(child, {
    cmd: 'echo',
    args: ['hello world'],
    code: 0,
    signal: undefined,
    stdout: '"hello world"',
    stderr: '',
    description: extra.description,
  }, 'result has all expected properties')
})
