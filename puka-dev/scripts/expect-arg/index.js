#!/usr/bin/env node

const fs = require('fs');

const [tag, file, actual, exitCode] = process.argv.slice(2);

const expected = file === '-' ? readStdin() : fs.readFileSync(file, 'utf8');
if (expected === actual) {
  console.error('ok', tag);
} else {
  console.error('fail', tag, JSON.stringify(actual));
}

if (exitCode) {
  process.exitCode = +exitCode;
}

function readStdin() {
  const bufferSize = 0x400;
  const buffer = new Buffer(bufferSize);
  const result = [];
  let n;
  while (n = fs.readSync(process.stdin.fd, buffer, 0, bufferSize)) {
    result.push(buffer.toString('utf8', 0, n));
  }
  return result.join('');
}
