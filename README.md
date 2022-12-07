# `@npmcli/exec`

# THIS REPOSITORY IS DEPRECATED AND ARCHIVED, THE MODULE HERE WAS NEVER PUBLISHED. SEE @npmcli/promise-spawn


This is the module that the npm CLI team uses to run child processes, with our
use cases and conventions.

It does a few things beyond `child_process.spawn()`, namely:

- Returns a `Promise`, thanks to [@npmcli/promise-spawn](https://github.com/npm/promise-spawn)
- When running as `root`, infers a uid and gid to run as based on the current working directory
- Forwards signals to children processes, once for background processes, and until the child exits for foreground ones.
- Automatically prepends `node_modules/.bin` directories to the PATH environment variable

## Usage

```js
const exec = require('@npmcli/exec')

exec('some command', ['with', 'args'], { and: 'options' }, { also: 'extras' })
  .then((result) => {
    // do something with the result
  })
  .catch((err) => {
    // process exited via signal or non-0 exit code
  })
```
