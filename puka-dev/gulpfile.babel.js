import fs from 'fs';
import path from 'path';
import util from 'util';
import documentation from 'documentation';
import gulp from 'gulp';
import transform from 'gulp-transform';
import yaml from 'js-yaml';
import _ from 'lodash';
import inject from 'mdast-util-inject';
import merge from 'merge-stream';
import remark from 'remark';
import toc from 'remark-toc';
import rollup from 'rollup-stream';
import source from 'vinyl-source-stream';
import rollupConfig from './rollup.config';

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

const packageFields = `name version description keywords homepage bugs license \
author contributors bin man directories repository dependencies \
peerDependencies bundledDependencies bundleDependencies optionalDependencies \
engines os cpu`.split(' ');

const dist = () =>
  merge(
    rollup(rollupConfig).pipe(source('index.js')),
    gulp.src('package.json').pipe(transform('utf8', contents =>
      JSON.stringify(_.pick(JSON.parse(contents), packageFields), null, 2))),
    gulp.src(['README.md', 'LICENSE.txt']),
  ).pipe(gulp.dest('dist'));

const readme = async () => {
  const options = yaml.load(await readFile('documentation.yml', 'utf8'));
  const comments = await documentation.build('src/index.js', options);
  const docs = await documentation.formats.remark(comments, options);
  const readme = await remark()
    .use(documentationPlugin, { docs })
    .use(toc, { heading: 'Contents', maxDepth: 4, tight: true })
    .use(stripComments)
    .process(await readFile('README.md'));
  return writeFile('README.md', readme.contents);
};

const index = async () => {
  const dir = 'src';
  const fileCandidates = (await readdir(dir))
    .filter(f => f.endsWith('.js')
      && f !== 'index.js'
      && !f.endsWith('.test.js'));
  const files =
    (await Promise.all(
      fileCandidates.map(f =>
        stat(path.join(dir, f)).then(s => !s.isDirectory() && f))
    )).filter(Boolean);
  return writeFile(path.join(dir, 'index.js'),
    files.map(f => `export * from './${f.slice(0, -3)}';\n`).join(''));
};

const documentationPlugin = options => (targetAst, file, next) => {
  if (!inject('API Documentation', targetAst, JSON.parse(options.docs))) {
    return next(new Error('API Documentation header not found'));
  }
  next();
};

const stripComments = () => (targetAst, file, next) => {
  let i = 0;
  while (i < targetAst.children.length) {
    const child = targetAst.children[i];
    let match;
    if (child.type === 'html' && (match = /^<!--[^]*?-->/.exec(child.value))
      && match[0].length === child.value.length
    ) {
      targetAst.children.splice(i, 1);
      continue;
    }
    i++;
  }
  next();
};

const taskDist = gulp.series(index, readme, dist);
const taskReadme = gulp.series(index, readme);
export {
  taskDist as dist,
  taskReadme as readme,
  index,
};
