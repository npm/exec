const spawn = require('@npmcli/promise-spawn')

const exec = async (command, args, options, extra) => {
  const child = spawn(command, args, options, extra)
  return child
}

module.exports = exec
