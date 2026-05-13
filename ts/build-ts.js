// build-ts.js - run tsc, tolerating type errors in the vendored malsync code.
//
// The malsync submodule is a browser-extension codebase compiled with its own
// toolchain; a few of its files carry type errors under our tsconfig (e.g.
// general.ts assigns a Promise-union to a boolean). Those must not fail the
// build, but errors in OUR code (bridge/ts/src) still do.
const { execSync } = require('child_process');

let out = '';
try {
  execSync('node node_modules/typescript/bin/tsc', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('tsc: OK');
} catch (e) {
  out = (e.stdout || '') + (e.stderr || '');
  const errors = out.split('\n').filter((l) => l.includes('error TS'));
  const own = errors.filter((l) => !l.includes('vendor/malsync'));
  if (own.length > 0) {
    process.stderr.write(out);
    process.exit(1);
  }
  console.log(`tsc: ${errors.length} type error(s) in vendored malsync code ignored`);
}