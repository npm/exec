// we use the set of knownSignals to this node process as a starting point
const { signals: knownSignals } = require('os').constants

// this is an array of signals that we will NOT attach listeners for
const ignoredSignals = [
  // cannot be trapped
  'SIGKILL',
  'SIGSTOP',
  // no SIGTERM in Windows, but it is defined, ignore for coverage so we don't
  // have to mess with process.platform in tests
  ...(/* istanbul ignore next */
    process.platform === 'win32'
      ? ['SIGTERM']
      : []
  ),

  // can only be caught in some cases, best to not bother
  'SIGABRT',
  'SIGIOT', // synonym of SIGABRT

  // undefined behavior, unsafe to trap
  'SIGBUS',
  'SIGFPE',
  'SIGILL',
  'SIGSEGV',

  // reserved for node's debugger
  'SIGPROF',
  'SIGUSR1',

  // libuv documentation states these are used by NPTL pthreads and watchers
  // will lead to unpredictable behaviors. they do not appear to be present in
  // the constants, but it seems best to explicitly ignore them just in case
  // that changes
  ...(/* istanbul ignore next */
    process.platform === 'linux'
      ? ['SIGRT0', 'SIGRT1']
      : []
  ),
]

// and the end result is a set of all signals supported by the current platform
// that we do not purposely ignore
const signals = Object.keys(knownSignals).reduce((signals, signal) => {
  if (!ignoredSignals.includes(signal))
    signals.push(signal)

  return signals
}, [])

module.exports = signals
