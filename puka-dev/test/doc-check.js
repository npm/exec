/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import test from 'ava';
import chalk from 'chalk';
import escodegen from 'escodegen';
import * as esprima from 'esprima';
import remark from 'remark';

const doc = remark.parse(fs.readFileSync('README.md', 'utf8'));
const packageContext = vm.createContext({ process, require });
vm.runInContext(
  `exports = require(${JSON.stringify(path.resolve('.'))})`,
  packageContext);
const packageExports = packageContext.exports;

// Doc examples assume Unix
if (process.platform === 'win32') {
  const { Formatter } = packageExports;
  Formatter.default = Formatter.for('sh');
}

const extractExamples = text => {
  const result = [];
  const exampleRe = /((?:.|\n)*?)\s*\/\/\s*(=>|throws )\s*([^\n]*)/g;
  exampleRe.lastIndex = 0;
  for (let match; match = exampleRe.exec(text);) {
    let progress = 0;
    try {
      const isThrowsTest = match[2] === 'throws ';
      const example = esprima.parse(match[1]);
      progress = 1;
      const { body } = example;
      const lastStatement = body[body.length - 1];
      const actual = lastStatement.expression;
      const { body: [{ expression: expected }] } = esprima.parse(match[3]);
      progress = 2;
      lastStatement.expression = isThrowsTest
        ? {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: 't',
            },
            property: {
              type: 'Identifier',
              name: 'throws',
            },
          },
          arguments: [
            {
              type: 'ArrowFunctionExpression',
              params: [],
              body: actual,
              expression: true,
            },
            expected,
          ],
        }
        : {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: 't',
            },
            property: {
              type: 'Identifier',
              name: 'deepEqual',
            },
          },
          arguments: [actual, expected],
        };
      result.push(
        escodegen.generate(example, { format: escodegen.FORMAT_MINIFY }));
    } catch (e) {
      console.error(chalk[progress ? 'gray' : 'red'](match[1]));
      progress && console.error(chalk[progress > 1 ? 'gray' : 'red'](match[2]));
      console.error(chalk.red(e));
      result.push(e);
    }
  }
  return result;
};

const examples = doc.children
  .filter(c => c.type === 'code' && c.lang === 'javascript')
  .map(c => extractExamples(c.value));

let i = 0;
for (const exampleGroup of examples) {
  const localContext = vm.createContext(Object.assign({}, packageExports));
  for (const example of exampleGroup) {
    test(`[example ${i++}]`, t => {
      if (example instanceof Error) {
        throw example;
      }
      localContext.t = t;
      t.log(example);
      vm.runInContext(example, localContext);
      t.pass();
    });
  }
}
