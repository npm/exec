const inferOwner = require('infer-owner')
const spawn = require('@npmcli/promise-spawn')

const { setPath } = require('./path.js')
const supervisor = require('./supervisor.js')

const exec = async (command, args, options, extra) => {
  const cwd = options.cwd || process.cwd()

  // an object used to extend and override the user's options
  const additionalOptions = {
    cwd,
    env: setPath({
      env: options.env || process.env,
      start: cwd,
      top: options.projectRoot,
    }),
  }

  // if we're running as root, get the uid and gid from the cwd
  // and drop privileges in the child process
  const isRoot = process.getuid && process.getuid() === 0
  if (isRoot) {
    const { uid, gid } = await inferOwner(cwd)
    additionalOptions.uid = uid
    additionalOptions.gid = gid
  }

  // build the fully realized options object
  const finalOptions = {
    ...options,
    ...additionalOptions,
  }
  const child = spawn(command, args, finalOptions, extra)

  // if at least stdin is set to inherit, we consider the child to be running
  // in the foreground. this distinction is how we determine if we should
  // forward signals to the process once, or forever until it exits
  const isForeground = Array.isArray(finalOptions.stdio)
    ? finalOptions.stdio[0] === 'inherit'
    : finalOptions.stdio === 'inherit'

  // add the child to the supervisor so if the user kills the parent we forward
  // that signal to any running children
  supervisor.add(child, isForeground)

  // when stdio is 'pipe' (the default) we get a stdin stream attached to the
  // child process. in order to allow the child to continue execution, we need
  // to end that stream
  if (child.stdin)
    child.stdin.end()

  // if the child exits with a non-0 exit code or due to receiving a signal
  // this promise will reject with either a `code` or `signal` property that
  // the consumer should handle appropriately
  return child
}

module.exports = exec
