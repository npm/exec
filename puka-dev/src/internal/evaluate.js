import { ShellStringText } from '../ShellStringText';
import { ShellStringUnquoted } from '../ShellStringUnquoted';
import { formatSymbol } from '../symbols';
import { BitSet } from './BitSet';
import { PLACEHOLDER } from './parse';
import { isObject } from './utils';

export function evaluate(template, values) {
  values = values.map(toStringishArray);
  const children = [];
  let valuesStart = 0;
  for (let i = 0, iMax = template.length; i < iMax; i++) {
    const word = template[i];
    if (formatSymbol in word) {
      children.push(word);
      continue;
    }
    const { contents, placeholderCount, prefix, onlyPrefixOnce } = word;
    const kMax = contents.length;
    const valuesEnd = valuesStart + placeholderCount;
    const tuples = cartesianProduct(values, valuesStart, valuesEnd);
    valuesStart = valuesEnd;
    for (let j = 0, jMax = tuples.length; j < jMax; j++) {
      const needSpace = j > 0;
      const tuple = tuples[j];
      (needSpace || prefix) && children.push(
        needSpace && (onlyPrefixOnce || !prefix) ? unquotedSpace : prefix);
      let interpolatedContents = [];
      let untested = null;
      let quoting = false;
      let tupleIndex = 0;
      for (let k = 0; k < kMax; k++) {
        const content = contents[k];
        if (content === PLACEHOLDER) {
          const value = tuple[tupleIndex++];
          if (quoting) {
            interpolatedContents.push(value);
          } else {
            if (isObject(value) && formatSymbol in value) {
              if (interpolatedContents.length) {
                children.push(
                  new ShellStringText(interpolatedContents, untested));
                interpolatedContents = [];
                untested = null;
              }
              children.push(value);
            } else {
              (untested || (untested = new BitSet()))
                .add(interpolatedContents.length);
              interpolatedContents.push(value);
            }
          }
        } else {
          interpolatedContents.push(content);
          content === null && (quoting = !quoting);
        }
      }
      if (interpolatedContents.length) {
        children.push(new ShellStringText(interpolatedContents, untested));
      }
    }
  }
  return children;
}

const primToStringish = value => value == null ? '' + value : value;

function toStringishArray(value) {
  let array;
  switch (true) {
  default:
    if (isObject(value)) {
      if (Array.isArray(value)) {
        array = value; break;
      }
      if (Symbol.iterator in value) {
        array = Array.from(value); break;
      }
    }
    array = [value];
  }
  return array.map(primToStringish);
}

function cartesianProduct(arrs, start, end) {
  const size = end - start;
  let resultLength = 1;
  for (let i = start; i < end; i++) {
    resultLength *= arrs[i].length;
  }
  if (resultLength > 1e6) {
    throw new RangeError("Far too many elements to interpolate");
  }
  const result = new Array(resultLength);
  const indices = new Array(size).fill(0);
  for (let i = 0; i < resultLength; i++) {
    const value = result[i] = new Array(size);
    for (let j = 0; j < size; j++) {
      value[j] = arrs[j + start][indices[j]];
    }
    for (let j = size - 1; j >= 0; j--) {
      if (++indices[j] < arrs[j + start].length) break;
      indices[j] = 0;
    }
  }
  return result;
}

const unquotedSpace = new ShellStringUnquoted(' ');
