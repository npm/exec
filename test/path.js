const t = require('tap')

const {
  delimiter,
  normalize,
  resolve,
} = require('path')

const {
  getBinPaths,
  getGypPath,
  normalizePath,
  setPath,
} = require('../lib/path.js')

t.test('getBinPaths()', async (t) => {
  t.test('returns an array of bin directories', async (t) => {
    // no need to pass platform specific strings, the function will pass
    // input through path.normalize() taking care of that for us. that behavior
    // is reflected in the assertion at the end which are normalized
    const start = '/some/starting/directory/here'

    const bins = getBinPaths({ start })
    t.same(bins, [
      normalize('/some/starting/directory/here/node_modules/.bin'),
      normalize('/some/starting/directory/node_modules/.bin'),
      normalize('/some/starting/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      normalize('/node_modules/.bin'),
    ], 'returned the expected paths')
  })

  t.test('stops at the top directory when specified', async (t) => {
    const start = '/some/starting/directory/here'
    const top = '/some/starting'

    const bins = getBinPaths({ start, top })
    t.same(bins, [
      normalize('/some/starting/directory/here/node_modules/.bin'),
      normalize('/some/starting/directory/node_modules/.bin'),
      normalize('/some/starting/node_modules/.bin'),
    ], 'returned the expected paths')
  })

  t.test('still finishes when top is not within start', async (t) => {
    const start = '/some/starting/directory/here'
    const top = '/somewhere/else/entirely'

    const bins = getBinPaths({ start, top })
    t.same(bins, [
      normalize('/some/starting/directory/here/node_modules/.bin'),
      normalize('/some/starting/directory/node_modules/.bin'),
      normalize('/some/starting/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      normalize('/node_modules/.bin'),
    ], 'returned the expected paths')
  })
})

t.test('getGypPath()', async (t) => {
  t.test('returns the path to our own bin directory when npm_config_node_gyp is set', async (t) => {
    const env = {
      npm_config_node_gyp: 'this value does not matter, it just needs to have one',
    }
    const expected = resolve(__dirname, '../bin')
    const result = getGypPath({ env })
    t.type(result, Array, 'result is an array')
    t.equal(result.length, 1, 'result has one element')
    t.equal(result[0], expected, 'returned our bin directory')
  })

  t.test('returns an empty array when npm_config_node_gyp is not set', async (t) => {
    const env = {} // no npm_config_node_gyp
    const result = getGypPath({ env })
    t.type(result, Array, 'result is an array')
    t.equal(result.length, 0, 'result has no elements')
  })
})

t.test('normalizePath()', async (t) => {
  t.test('returns an array of paths when one env var is set', async (t) => {
    const env = {
      // normalize each segment, join together with platform specific delimiter
      PATH: ['/one', '/two', '/three'].map(normalize).join(delimiter),
    }

    const paths = normalizePath({ env })
    t.same(paths, [
      normalize('/one'),
      normalize('/two'),
      normalize('/three'),
    ], 'returned the expected paths')
  })

  t.test('merges multiple path env vars together', async (t) => {
    const env = {
      path: ['/one', '/two'].map(normalize).join(delimiter),
      Path: ['/three', '/four'].map(normalize).join(delimiter),
      PATH: ['/five', '/six'].map(normalize).join(delimiter),
    }

    const paths = normalizePath({ env })
    t.same(paths, [
      normalize('/one'),
      normalize('/two'),
      normalize('/three'),
      normalize('/four'),
      normalize('/five'),
      normalize('/six'),
    ], 'returned the expected paths')
  })
})

t.test('setPath()', async (t) => {
  t.test('sets PATH to a platform specific string, bins first', async (t) => {
    const start = '/some/directory'
    const originalPath = [
      '/one',
      '/two',
      '/three',
    ].map(normalize).join(delimiter)
    const env = {
      PATH: originalPath,
    }

    const result = setPath({ start, env })
    t.equal(env.PATH, originalPath, 'left the original env alone')
    t.equal(result.PATH, [
      normalize('/some/directory/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      normalize('/node_modules/.bin'),
      originalPath,
    ].join(delimiter), 'returned env with expected PATH, bins first')
  })

  t.test('PATH includes node-gyp shim directory when npm_config_node_gyp is set', async (t) => {
    const start = '/some/directory'
    const originalPath = [
      '/one',
      '/two',
      '/three',
    ].map(normalize).join(delimiter)
    const env = {
      npm_config_node_gyp: 'the value does not matter, it only needs to be truthy',
      PATH: originalPath,
    }

    const result = setPath({ start, env })
    t.equal(env.PATH, originalPath, 'left the original env alone')
    t.equal(result.PATH, [
      resolve(__dirname, '../bin'),
      normalize('/some/directory/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      normalize('/node_modules/.bin'),
      originalPath,
    ].join(delimiter), 'returned env with expected PATH, bins first')
  })

  t.test('sets a platform specific path string with bins and limited top', async (t) => {
    const start = '/some/directory'
    const top = '/some'
    const originalPath = [
      '/one',
      '/two',
      '/three',
    ].map(normalize).join(delimiter)
    const env = {
      PATH: originalPath,
    }

    const result = setPath({ start, top, env })
    t.equal(env.PATH, originalPath, 'left the original env alone')
    t.equal(result.PATH, [
      normalize('/some/directory/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      originalPath,
    ].join(delimiter), 'returned env with expected path, bins first')
  })

  t.test('overwrites all cases of path in the env', async (t) => {
    const start = '/some/directory'
    const originalpath = [
      '/one',
      '/two',
    ].map(normalize).join(delimiter)
    const originalPath = [
      '/three',
      '/four',
    ].map(normalize).join(delimiter)
    const originalPATH = [
      '/five',
      '/six',
    ].map(normalize).join(delimiter)
    const env = {
      FOO: 'bar',
      path: originalpath,
      Path: originalPath,
      PATH: originalPATH,
    }

    const result = setPath({ start, env })
    t.equal(env.FOO, 'bar', 'left non-path environment variable alone')
    t.equal(env.path, originalpath, 'left the original path')
    t.equal(env.Path, originalPath, 'left the original Path')
    t.equal(env.PATH, originalPATH, 'left the original PATH')
    t.equal(result.path, result.Path, 'result path and Path are equal')
    t.equal(result.Path, result.PATH, 'result Path and PATH are equal')
    t.equal(result.path, [
      normalize('/some/directory/node_modules/.bin'),
      normalize('/some/node_modules/.bin'),
      normalize('/node_modules/.bin'),
      originalpath,
      originalPath,
      originalPATH,
    ].join(delimiter), 'resulting env has expected path, bins first')
  })
})
