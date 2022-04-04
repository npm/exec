const signals = require('./signals.js')

const backgroundChildren = new Set()
const foregroundChildren = new Set()
let handlersInstalled = false

// attach handlers for signals
const init = () => {
  if (handlersInstalled) {
    return
  }

  for (const signal of signals) {
    process.on(signal, handler)
  }

  handlersInstalled = true
}

// when no more children are being supervised remove the signal handlers
const cleanup = () => {
  if (foregroundChildren.size > 0 || backgroundChildren.size > 0) {
    return
  }

  for (const signal of signals) {
    process.removeListener(signal, handler)
  }

  handlersInstalled = false
}

// forward the received signal to all children
const handler = (signal) => {
  for (const child of foregroundChildren) {
    child.process.kill(signal)
  }

  // we only forward signals to background children exactly one time so we
  // remove them from our inventory here immediately after calling kill
  for (const child of backgroundChildren) {
    child.process.kill(signal)
    backgroundChildren.delete(child)
  }
}

// add a child process to the supervisor
const add = (child, isForeground) => {
  init()
  if (isForeground) {
    foregroundChildren.add(child)
  } else {
    backgroundChildren.add(child)
  }

  // stop supervising a child when it exits
  child.process.once('close', () => {
    if (isForeground) {
      foregroundChildren.delete(child)
    } else {
      backgroundChildren.delete(child)
    }
    cleanup()
  })
}

module.exports = {
  add,
}
