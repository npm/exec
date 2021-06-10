const inferOwner = require('infer-owner')
const spawn = require('@npmcli/promise-spawn')

const exec = async (command, args, options, extra) => {
  // an object used to extend the user provided options
  const additionalOptions = {}

  // if we're running as root, get the uid and gid from the cwd
  // and drop privileges in the child process
  const isRoot = process.getuid && process.getuid() === 0
  if (isRoot) {
    const { uid, gid } = await inferOwner(options.cwd || process.cwd())
    additionalOptions.uid = uid
    additionalOptions.gid = gid
  }

  // build the fully realized options object
  const finalOptions = {
    ...options,
    ...additionalOptions,
  }
  const child = spawn(command, args, finalOptions, extra)
  return child
}

module.exports = exec
