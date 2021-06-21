// we use the set of knownSignals to this node process as a starting point
const { signals: knownSignals } = require('os').constants

// this is an array of signals that we will NOT attach listeners for
const ignoredSignals = [
  'SIGABRT', // seems untrappable
  'SIGBUS', // bad state
  'SIGFPE', // bad state
  'SIGILL', // bad state
  'SIGIOT', // same as SIGABRT
  'SIGKILL', // cannot be trapped
  'SIGPROF', // reserved for debugging
  'SIGUSR1', // reserved for node's debugger
  'SIGSEGV', // bad state
  'SIGSTOP', // cannot be trapped
]

// and the end result is a set of all signals supported by the current platform
// that we do not purposely ignore
const signals = Object.keys(knownSignals).reduce((signals, signal) => {
  if (!ignoredSignals.includes(signal))
    signals.push(signal)

  return signals
}, [])

module.exports = signals
