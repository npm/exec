import babel from '@rollup/plugin-babel';
import cleanup from 'rollup-plugin-cleanup';

export default {
  input: 'src/index.js',
  format: 'cjs',
  plugins: [
    babel({
      babelHelpers: 'bundled',
      plugins: [
        ['@babel/transform-modules-commonjs', false],
        './babel-plugin-comment-shift.js',
      ],
    }),
    cleanup({
      comments: /^(?:(?!eslint-)[^])*$/,
    }),
  ],
};
