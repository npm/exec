// When minimum Node version becomes 6, replace calls to sticky with /.../y and
// inline execFrom.
let stickySupported = true;
try {
  new RegExp('', 'y');
} catch (e) {
  stickySupported = false;
}

export const sticky = stickySupported
  ? source => new RegExp(source, 'y')
  : source => new RegExp(`^(?:${source})`);

export const execFrom = stickySupported
  ? (re, haystack, index) => (re.lastIndex = index, re.exec(haystack))
  : (re, haystack, index) => re.exec(haystack.substr(index));
