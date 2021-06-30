const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')

spawk.preventUnmatched()
t.beforeEach(() => {
  spawk.clean()
})

t.test('posix', async (t) => {
  t.test('escapes arguments correctly', async (t) => {
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
})

t.test('windows', async (t) => {
  t.test('escapes simple arguments', async (t) => {
    const command = 'echo'
    const args = ['hello world']
    const expectedArgs = ['/d', '/s', '/c', `echo "hello world"`]
    const options = {
      scriptShell: 'cmd.exe',
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
})
