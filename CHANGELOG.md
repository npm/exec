# Changelog

## [1.0.0](https://github.com/npm/exec/compare/v0.0.1...v1.0.0) (2022-11-12)

### ⚠️ BREAKING CHANGES

* `@npmcli/exec` is now compatible with the following semver range for node: `^14.17.0 || ^16.13.0 || >=18.0.0`

### Features

* [`60dc401`](https://github.com/npm/exec/commit/60dc401552d04402c75ff840b3212fa0a99784b6) [#34](https://github.com/npm/exec/pull/34) postinstall for dependabot template-oss PR (@lukekarrys)
* [`e4c0df1`](https://github.com/npm/exec/commit/e4c0df17bdb8a16e5a38155deb3d92fd09d7cabf) [#12](https://github.com/npm/exec/pull/12) escape arguments with puka, for #2 (#12) (@nlf)
* [`94edf9a`](https://github.com/npm/exec/commit/94edf9a39a13ffbb93c6a87219ffaf5fef95c84f) [#11](https://github.com/npm/exec/pull/11) prepend a node-gyp wrapper, closes #4 (#11) (@nlf)
* [`980a460`](https://github.com/npm/exec/commit/980a4601c0e136a373e4f9d7ca6198c60dac4374) [#10](https://github.com/npm/exec/pull/10) automatically add node_modules/.bin paths, closes #3 (#10) (@nlf)
* [`b21c421`](https://github.com/npm/exec/commit/b21c421a96d34e30fcbc68efdc8147b2804b1788) [#9](https://github.com/npm/exec/pull/9) forward signals to child processes (#9) (@nlf, @wraithgar)
* [`18dcb59`](https://github.com/npm/exec/commit/18dcb5943b63a4d8252ec1860c3fd38c7c2532a5) [#7](https://github.com/npm/exec/pull/7) infer owner from cwd when running as root (#7) (@nlf)

### Dependencies

* [`d3cc55a`](https://github.com/npm/exec/commit/d3cc55ad685353f7126e49d6988be98e71045844) [#41](https://github.com/npm/exec/pull/41) bump @npmcli/promise-spawn from 2.0.1 to 4.0.0
* [`eed9ea2`](https://github.com/npm/exec/commit/eed9ea24006f89b5111109c67cfd8393cc344310) [#18](https://github.com/npm/exec/pull/18) `@npmcli/template-oss@3.2.2` (#18)
