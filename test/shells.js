const t = require('tap')

const shells = require('../lib/shells.js')
const names = Object.keys(shells.shells)

t.test('finds known shell', async (t) => {
  for (const name of names) {
    t.same(shells.lookup(name), shells.shells[name], `found ${name}`)
  }
})

t.test('finds known shell with .exe', async (t) => {
  for (const name of names) {
    t.same(shells.lookup(`${name}.exe`), shells.shells[name], `found ${name}.exe`)
  }
})

t.test('returns default for no match', async (t) => {
  t.same(shells.lookup('notarealshell'), shells.shells.sh, 'returns sh for default')
})
