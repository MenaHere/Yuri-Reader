// pkg-debug.js - run pkg and print the error even when it is wasReported
// (bin.js exits 2 silently for reported errors, hiding the cause).
const pkg = require('@yao-pkg/pkg/lib-es5/index.js');
pkg.exec(process.argv.slice(2)).catch((e) => {
  console.error('PKG ERROR:', e && e.stack ? e.stack : e);
  process.exit(2);
});