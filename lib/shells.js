const { basename } = require('path')

// known and explicitly accounted for shells
// 'escapeStyle' is the string we will pass to puka's ShellString.toString()
// 'args' are the necessary command line args to run a script as a string
const shells = {
  // windows specific
  cmd: { escapeStyle: 'win32', args: ['/d', '/s', '/c'] },
  // posix compatible
  sh: { escapeStyle: 'sh', args: ['-c'] },
  bash: { escapeStyle: 'sh', args: ['-c'] },
  fish: { escapeStyle: 'sh', args: ['-c'] },
  zsh: { escapeStyle: 'sh', args: ['-c'] },
}

// given a scriptShell, determine the appropriate escaping style and return it
const lookup = (shell) => {
  const bin = basename(shell).toLowerCase()
  const found = Object.keys(shells).find((name) => {
    // exact match
    if (name === bin) {
      return true
    }

    // if we don't have an exact match, split the bin into its name and its
    // extension so we can compare that way
    // we use lastIndexOf because cmd.nope.exe should not be identified as cmd
    const binName = bin.slice(0, bin.lastIndexOf('.'))
    // if the name matches, and the extension is '.exe' we have a match
    if (name === binName) {
      return bin.slice(bin.lastIndexOf('.')) === '.exe'
    }

    return false
  })

  if (!found) {
    // TODO when we can make this a breaking change, throw an error here
    // instead of returning a default so we can be very clear when a shell
    // probably won't work correctly
    // TODO log a warning
    return shells.sh // this is our default
  }

  return shells[found]
}

module.exports = {
  lookup,
  shells,
}
