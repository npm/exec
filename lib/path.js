const path = require('path')

// starting at the directory provided, split the path into segments and return
// an array containing the segment plus 'node_modules/.bin' for each. we use
// this to ensure all of our own bin directories are in the path
const getBinPaths = ({ start, top = '/' }) => {
  // we call path.normalize() on the inputs so that we'll have the correct
  // separators in place consistently in windows. if you provide windows style
  // paths in posix though, you're in for a bad time because normalize will
  // just leave it alone
  const realTop = path.normalize(top)
  let current = path.normalize(start)

  const binPaths = [
    path.join(current, 'node_modules/.bin'),
  ]

  do {
    current = path.dirname(current)
    binPaths.push(path.join(current, 'node_modules/.bin'))
  } while (current !== path.dirname(current) && realTop !== current)

  return binPaths
}

// take any PATH related environment variables and normalize them into an array
// we do this because in Windows it's typically Path, but that's not guaranteed
// and it can also come from more than one environment variable. we merge them
// together to normalize and return an array of path segments here
const normalizePath = ({ env }) => {
  const pathSegments = Object.keys(env)
    .filter((key) => key.toLowerCase() === 'path')
    .reduce((acc, key) => acc.concat(env[key].split(path.delimiter)), [])

  return pathSegments
}

// given an object with an env key, a starting directory, and a top directory
// overwrite every key whose lowercase name is 'path' with a new path built by
// combining the bin directories with all of the existing path values
const setPath = ({ env, start, top }) => {
  const fullPath = [
    ...getBinPaths({ start, top }),
    ...normalizePath({ env }),
  ].join(path.delimiter)

  // don't stomp on the currently running environment
  const result = { ...env }

  for (const key of Object.keys(result)) {
    if (key.toLowerCase() === 'path')
      env[key] = fullPath
  }

  return env
}

module.exports = {
  getBinPaths,
  normalizePath,
  setPath,
}
