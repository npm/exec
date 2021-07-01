export const isObject = any => any === Object(any);

export function memoize(f) {
  const cache = new WeakMap();
  return arg => {
    let result = cache.get(arg);
    if (result === void 0) {
      result = f(arg);
      cache.set(arg, result);
    }
    return result;
  };
}
