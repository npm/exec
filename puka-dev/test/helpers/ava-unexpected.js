import unexpected from 'unexpected';
import avaTest from 'ava/lib/test';
import { Assertions, AssertionError } from 'ava/lib/assert';

let expect = unexpected;

export const setUnexpected = instance => expect = instance;

const testsFor = new WeakMap();
let assertionsPrototype;
if (Assertions) {
  const ogCEC = avaTest.prototype.createExecutionContext;
  avaTest.prototype.createExecutionContext = function () {
    const result = ogCEC.call(this);
    testsFor.set(result, this);
    return result;
  };
  assertionsPrototype = Assertions.prototype;
} else {
  assertionsPrototype =
    Object.getPrototypeOf(avaTest.prototype.createExecutionContext());
}

assertionsPrototype.expect = function __$AVA_UNEXPECTED_EXPECT$__(...args) {
  const onFail = origErr => {
    let { stack } = origErr;
    const prefix = 'UnexpectedError: ' + origErr.message;
    if (stack.startsWith(prefix)) {
      stack = stack.substring(prefix.length);
    }
    let cutoff = stack.indexOf('__$AVA_UNEXPECTED_EXPECT$__');
    if (cutoff < 0) {
      cutoff = stack.indexOf('ExecutionContext.t [as expect]');
    }
    if (cutoff >= 0) {
      stack = stack.substring(0, stack.lastIndexOf('\n', cutoff))
        + stack.substring(stack.indexOf('\n', cutoff));
    }
    const err = new AssertionError({
      assertion: 'fail',
      message: origErr.getErrorMessage
        ? origErr.getErrorMessage({ format: 'ansi' }).toString()
        : origErr.message,
      savedError: origErr,
      stack,
      actualStack: stack,
    });
    (this._test || testsFor.get(this)).addFailedAssertion(err);
  };
  let expectation;
  try {
    expectation = expect(...args);
  } catch (origErr) {
    onFail(origErr);
    return;
  }
  if (expectation.isFulfilled()) {
    if (expectation.isRejected()) {
      onFail(expectation.reason());
    } else {
      this.pass();
    }
  } else {
    return expectation.then(() => this.pass(), onFail);
  }
};
