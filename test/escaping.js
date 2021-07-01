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

async function windowsEscapingTest (t, command, args, expected) {
  const expectedArgs = ['/d', '/s', '/c', expected]
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
}

t.test('windows', async (t) => {
  const dir = t.testdir({ 'BATCH.CMD': '' }) // incidentally tests case sensitivity
  const origPath = process.env.PATH
  process.env.PATH = `${dir};${origPath}`
  t.teardown(() => process.env.PATH = origPath)
  t.test('escapes simple arguments', async (t) =>
    windowsEscapingTest(t, 'echo', ['hello world'], `echo "hello world"`))
  t.todo('escapes native pipelines', async (t) =>
    windowsEscapingTest(t, 'node something | node something else', ['"'], `node something | node something else ^^^"\\^^^"^^^"`))
  t.test('escapes batch pipelines', async (t) =>
    windowsEscapingTest(t, 'batch something | batch something else', ['"'], `batch something | batch something else ^^^^^^^"\\^^^^^^^"^^^^^^^"`))
  t.todo('escapes mixed pipelines 1', async (t) =>
    windowsEscapingTest(t, 'batch something | node something else', ['"'], `batch something | node something else ^^^"\\^^^"^^^"`))
  t.test('escapes mixed pipelines 2', async (t) =>
    windowsEscapingTest(t, 'node something | batch something else', ['"'], `node something | batch something else ^^^^^^^"\\^^^^^^^"^^^^^^^"`))
  t.todo('escapes native sequences', async (t) =>
    windowsEscapingTest(t, 'node something && node something else', ['"'], `node something && node something else ^"\\^"^"`))
  t.test('escapes batch sequences', async (t) =>
    windowsEscapingTest(t, 'batch something && batch something else', ['"'], `batch something && batch something else ^^^"\\^^^"^^^"`))
})
