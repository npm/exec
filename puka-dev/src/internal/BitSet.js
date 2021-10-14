export class BitSet {
  vector = new Int32Array(1);
  has(n) {
    return (this.vector[n >>> 5] & 1 << n) !== 0;
  }
  add(n) {
    const i = n >>> 5, requiredLength = i + 1;
    let { vector } = this, { length } = vector;
    if (requiredLength > length) {
      while (requiredLength > (length *= 2));
      const oldValues = vector;
      vector = new Int32Array(length);
      vector.set(oldValues);
      this.vector = vector;
    }
    vector[i] |= 1 << n;
  }
}
