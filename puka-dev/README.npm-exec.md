This is (most of) the development tree for Puka. It's here to facilitate
rapid development. Once we've finalized the needed modifications, and the whole
thing has been vetted in the npm ecosystem, I'll upstream this back.

Here are a list of things to do in exec when it's time to upstream:

* Restore the dependency on puka in package.json
* Change require calls from '../puka-dev' to 'puka' in:
  * lib/index.js
  * test/index.js
  * test/privileges.js
  * test/signals.js
* Delete the entry in .github/workflows/ci.yml for testing Puka
* Delete .taprc and puka-dev, and remove them from .gitignore
