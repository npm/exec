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
