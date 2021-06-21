const { EventEmitter } = require('events')
const spawk = require('spawk')
const t = require('tap')

const exec = require('../lib/index.js')
const signals = require('../lib/signals.js')

// return one random signal
const randomSignal = () => {
  return signals[Math.floor(Math.random() * signals.length)]
}

// return `count` number of unique random signals
const randomSignals = (count) => {
  const result = []
  for (let i = 0; i < count; ++i) {
    let signal = randomSignal()
    while (result.includes(signal))
      signal = randomSignal()
    result.push(signal)
  }

  return result
}

// send a signal, return a promise that resolves when the parent process
// receives it. we have to do this because we have no way of knowing when
// the child receives a signal without also causing that child to exit and
// we need to be able to test multiple signals to the same child. this is
// currently a limitation of spawk, when it can tell what signals a child
// received then this can go away
const sendSignal = (emitter, signal) => {
  let resolve
  const promise = new Promise((_resolve) => {
    resolve = _resolve
  })

  emitter.once(signal, () => {
    resolve()
  })
  emitter.emit(signal, signal)

  return promise
}

// generate some parameters that will be passed to exec
const buildParameters = (name, opts = {}) => {
  const command = 'echo'
  const args = ['hello', name]
  const options = {
    cwd: '/some/dir',
    ...opts,
  }
  const extra = {
    description: `echoes "hello ${name}"`,
  }

  return { command, args, options, extra }
}

spawk.preventUnmatched()
t.beforeEach((t) => {
  spawk.clean()

  // in order to test this reliably in all platforms, we can't send actual kill
  // signals because Windows emulates this behavior behind the scenes. instead,
  // we save the methods that we care about from the real process object, then
  // replace them with methods from a per-test EventEmitter instance, allowing
  // us to reliably test that our listeners are attached and removed, to emit
  // arbitrary signals even on Windows, and to not interfere with any existing
  // real hooks that may be in place
  t.context.previous = {
    on: process.on,
    removeListener: process.removeListener,
  }

  t.context.events = new EventEmitter()
  process.on = (...args) => t.context.events.on(...args)
  process.removeListener = (...args) => t.context.events.removeListener(...args)
})

t.afterEach((t) => {
  // restore the real process methods
  process.on = t.context.previous.on
  process.removeListener = t.context.previous.removeListener
})

t.test('forwards a signal to a background process only once', async (t) => {
  const { command, args, options, extra } = buildParameters('background')
  const signal = randomSignal()
  const interceptor = spawk.spawn(command, args, options)
    .exitOnSignal(signal)

  // do not await, the child process is going to wait for our signal so it
  // won't resolve or reject until we get it
  const child = exec(command, args, options, extra)

  // calling exec should've added the signal handlers, make sure they're there
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} has only one handler after spawning`)

  // we actually ran and passed the correct parameters
  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command,
    args,
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  // send the signal, no need to wait for it since the child will reject
  sendSignal(t.context.events, signal)

  // if the parent appropriately forwarded the signal, the child will reject
  // with that signal. make sure that the error doesn't lose relevant context
  await t.rejects(child, {
    cmd: command,
    args,
    signal,
    ...extra,
  })

  // after the child has exited, the signal handlers should all be gone
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 0, `all ${signal} handlers removed`)
})

t.test('forwards a signal to multiple background children only once', async (t) => {
  // get two signals, we'll expect each child to exit on different signals
  // allowing us to kill one and be certain signal handlers are still in place
  const childSignals = randomSignals(2)

  // this promise will resolve when we want it to so we can clean up
  // the second child
  let manualResolve
  const manualExit = new Promise((_resolve) => {
    manualResolve = _resolve
  })

  // create an array of children
  const children = ['backgroundOne', 'backgroundTwo'].map((name, index) => {
    const { command, args, options, extra } = buildParameters(name)
    const signal = childSignals[index]
    const interceptor = spawk.spawn(command, args, options)
    if (index === 0)
      interceptor.exitOnSignal(signal)
    else
      interceptor.stdout(manualExit)

    const child = exec(command, args, options, extra)

    for (const signal of signals)
      t.equal(t.context.events.listenerCount(signal), 1, `${signal} has only one handler after spawning`)

    t.ok(interceptor.called, 'called child_process.spawn()')
    t.match(interceptor.calledWith, {
      command,
      args,
      options,
    })

    // the first one will reject on the first signal, the second will stay
    // running
    if (index === 0) {
      return t.rejects(child, {
        signal,
        cmd: command,
        args,
        ...extra,
      })
    } else
      return child
  })

  // send the first signal, this should cause only one child to exit
  sendSignal(t.context.events, childSignals[0])
  await children[0]

  // at this point, one child will have been killed and rejected. the second
  // child will have received the signal but _not_ been killed, since it's
  // waiting for the second signal
  t.not(children[1].killed, true, 'second child was not killed')

  // the signal handlers should be gone though, since both children already
  // had a signal forwarded to them and they're running in the background
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 0, `${signal} no longer has any handlers`)

  // now we can resolve the promise that allows the other child to exit
  setTimeout(() => {
    manualResolve('hello')
  }, 0)

  // and make sure it exited _without_ a signal
  await t.resolves(children[1], {
    signal: undefined,
    code: 0,
    stdout: 'hello',
  })
})

t.test('forwards a signal to a foreground child until it exits, stdio=inherit', async (t) => {
  const { command, args, options, extra } = buildParameters('foreground', { stdio: 'inherit' })

  // we'll send the ignoredSignal first so that we can make sure our handlers
  // stay in place afterwards, then we'll send the exitSignal to allow the
  // child to exit and make sure all of our handlers were cleaned up
  const [ignoredSignal, exitSignal] = randomSignals(2)
  const interceptor = spawk.spawn(command, args, options)
    .exitOnSignal(exitSignal)

  const child = exec(command, args, options, extra)

  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} has only one handler after spawning`)

  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command,
    args,
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  // send the ignored signal and wait to make sure we get it
  await sendSignal(t.context.events, ignoredSignal)

  // make sure the signal handlers are all still in place
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} still has one handler after forwarding`)

  // now send the exit signal
  sendSignal(t.context.events, exitSignal)

  // and wait for the promise to reject
  await t.rejects(child, {
    cmd: command,
    args,
    signal: exitSignal,
    ...extra,
  })

  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 0, `all ${signal} handlers removed`)
})

t.test('forwards a signal to a foreground child until it exits, stdio=[inherit,inherit,inherit]', async (t) => {
  const { command, args, options, extra } = buildParameters('foreground', { stdio: ['inherit', 'inherit', 'inherit'] })

  // we'll send the ignoredSignal first so that we can make sure our handlers
  // stay in place afterwards, then we'll send the exitSignal to allow the
  // child to exit and make sure all of our handlers were cleaned up
  const [ignoredSignal, exitSignal] = randomSignals(2)
  const interceptor = spawk.spawn(command, args, options)
    .exitOnSignal(exitSignal)

  const child = exec(command, args, options, extra)

  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} has only one handler after spawning`)

  t.ok(interceptor.called, 'called child_process.spawn()')
  t.match(interceptor.calledWith, {
    command,
    args,
    options,
  }, 'passed the correct parameters to child_process.spawn()')

  // send the ignored signal and wait to make sure we get it
  await sendSignal(t.context.events, ignoredSignal)

  // make sure the signal handlers are all still in place
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} still has one handler after forwarding`)

  // now send the exit signal
  sendSignal(t.context.events, exitSignal)

  // and wait for the promise to reject
  await t.rejects(child, {
    cmd: command,
    args,
    signal: exitSignal,
    ...extra,
  })

  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 0, `all ${signal} handlers removed`)
})

t.test('forwards signals to multiple foreground children until they exit', async (t) => {
  const childSignals = randomSignals(2)

  // create an array of children
  const children = ['foregroundOne', 'foregroundTwo'].map((name, index) => {
    const { command, args, options, extra } = buildParameters(name, { stdio: 'inherit' })
    // each child will exit for a different signal
    const signal = childSignals[index]
    const interceptor = spawk.spawn(command, args, options)
      .exitOnSignal(signal)

    const child = exec(command, args, options, extra)

    for (const signal of signals)
      t.equal(t.context.events.listenerCount(signal), 1, `${signal} has only one handler after spawning`)

    t.ok(interceptor.called, 'called child_process.spawn()')
    t.match(interceptor.calledWith, {
      command,
      args,
      options,
    })

    return {
      child,
      assertion: {
        signal,
        cmd: command,
        args,
        ...extra,
      },
    }
    // return t.rejects(child, {
    //   signal,
    //   cmd: command,
    //   args,
    //   ...extra,
    // })
  })

  // send the first signal, this should cause only one child to exit
  sendSignal(t.context.events, childSignals[0])
  await t.rejects(children[0].child, children[0].assertion)

  // at this point, one child will have been killed and rejected. the second
  // child will have received the signal but _not_ been killed, since it's
  // waiting for the second signal
  t.not(children[1].killed, true, 'second child was not killed')

  // the signal handlers should be gone though, since both children already
  // had a signal forwarded to them and they're running in the background
  for (const signal of signals)
    t.equal(t.context.events.listenerCount(signal), 1, `${signal} still has one handler`)

  // now we send the second signal
  sendSignal(t.context.events, childSignals[1])

  // and make sure it also rejects correctly
  return t.rejects(children[1].child, children[1].assertion)
})
