'use strict';
// =============================================================================
// scripts/run-tests.js — native root runner (F27 red → F22 green)
// =============================================================================
// The NO-BASH GUARD, its negative control, and the native Git/npm transport
// assertions for the native root runner the plan builds in F22.
//
// The intended contract (plan F22/L6/L8):
//   • `npm run test:scripts` runs the root `scripts/tests/*.test.cjs` files
//     through Node's own test runner. The legacy selector may remain a native
//     alias, but it must NEVER execute Bats.
//   • On Windows the runner defaults to the NATIVE path and does not probe or
//     require Docker. The old `resolveRunner` returned `unavailable` there.
//   • Git and npm remain real native tools — isolation must not be achieved by
//     hiding them behind a shell. The harness reaches git with `shell:false`
//     and npm through the CLI's own package scripts.
//   • A Bash attempt at the process boundary is refused: the harness exposes no
//     `runBash`, spawns no shell, and a `.sh` probe cannot execute.
//
// ⛔ RED TODAY: `test:scripts` still builds `npx bats …`, and Windows without
//    Docker still resolves to `unavailable`. Those two assertions fail on
//    purpose — they state the native contract F22 must satisfy.
//
// Run: node --test scripts/tests/run-tests.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const RUNNER_PATH = path.join(h.ROOT_SCRIPTS_DIR, 'run-tests.js');
const runner = require(RUNNER_PATH);

/** The native spawn specs for one suite, through the runner's own builder. */
function nativeSpecs(suite) {
  assert.equal(typeof runner.buildCommands, 'function', 'run-tests.js must export buildCommands');
  return runner.buildCommands({
    suite,
    runner: 'native',
    platform: 'linux',
    repoRoot: h.REPO_ROOT,
    tag: null,
    jobs: 4,
    parallelAvailable: true,
    extra: [],
  });
}

/** Everything a spec would execute, joined for pattern assertions. */
function specText(specs) {
  return specs
    .map((s) => [s.file, ...(s.args || []), s.display].filter(Boolean).join(' '))
    .join('\n');
}

// --- the native scripts suite ----------------------------------------------

test('the native scripts suite runs under node --test, never a bats binary or the product Bats tree', () => {
  const text = specText(nativeSpecs('bats'));
  assert.doesNotMatch(text, /\.bats\b/, 'the scripts suite must not name a .bats file');
  assert.doesNotMatch(
    text,
    /framwork[\\/]\.codeadd[\\/]scripts[\\/]tests/,
    'the scripts suite must not route through the product Bats transport',
  );
  assert.match(text, /--test\b|\.test\.cjs\b/, 'the scripts suite must use the Node test runner');
});

test('the native vitest suite still goes through npm (native npm transport preserved)', () => {
  const text = specText(nativeSpecs('vitest'));
  assert.match(text, /npm/, 'vitest is reached through npm, not a shell wrapper');
  assert.match(text, /cli/, 'the CLI package is the npm target');
});

test('no native suite spawns a `.sh` route', () => {
  for (const suite of ['vitest', 'bats']) {
    const text = specText(nativeSpecs(suite));
    assert.doesNotMatch(text, /\.sh\b/, `${suite} must not route through a shell script`);
    assert.doesNotMatch(text, /\bbash\b/i, `${suite} must not route through Bash`);
  }
});

// --- platform resolution ----------------------------------------------------

test('Windows resolves to the native runner without probing or requiring Docker', () => {
  assert.equal(typeof runner.resolveRunner, 'function', 'run-tests.js must export resolveRunner');
  const resolved = runner.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: false });
  assert.equal(resolved.runner, 'native', 'Windows without Docker must default to native');
  assert.notEqual(resolved.runner, 'unavailable', 'the old Docker refusal must be gone');
});

test('an explicit runner override is still honored', () => {
  assert.equal(
    runner.resolveRunner({ platform: 'win32', env: { CODEADD_TESTS_RUNNER: 'native' }, dockerAvailable: true }).runner,
    'native',
  );
  assert.equal(
    runner.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'docker' }, dockerAvailable: true }).runner,
    'docker',
  );
});

// --- no-Bash guard / negative control ---------------------------------------

test('NEGATIVE CONTROL: the native boundary cannot be talked into running Bash', () => {
  assert.equal(typeof h.runBash, 'undefined', 'the harness must expose no Bash route');
  const dir = h.mkTmp('codeadd-bash-neg-');
  try {
    const marker = path.join(dir, 'reached.txt');
    h.write(path.join(dir, 'probe.sh'), `#!/bin/bash\necho reached > "${marker}"\n`);
    const res = h.runNode([path.join(dir, 'probe.sh')]);
    assert.notEqual(res.status, 0, 'a .sh must not execute through the Node boundary');
    assert.equal(fs.existsSync(marker), false, 'the Bash body must never run');
  } finally {
    h.rmrf(dir);
  }
});

test('the shared harness never spawns a shell (shell: true is absent)', () => {
  const src = h.read(path.join(__dirname, 'helpers.cjs'));
  // Match only a real option value (`shell: true,` / `shell: true }`), not the
  // `shell:true` spelling used in the file's own explanatory comment.
  assert.doesNotMatch(src, /shell:\s*true\s*[,)}]/, 'the harness must never opt into a shell');
});

// --- failure forwarding and isolation ---------------------------------------

test('exit codes are forwarded, never coerced to zero', () => {
  assert.equal(runner.combineExitCodes([0, 4, 0]), 4, 'the first non-zero wins');
  assert.equal(runner.combineExitCodes([0, 0]), 0);
  assert.equal(runner.exitCodeFrom({ status: 7 }), 7);
  assert.equal(runner.exitCodeFrom({ status: null, error: new Error('killed') }), 1, 'a signal is a failure');
});

test('the copy-isolation marker and NODE_OPTIONS clearing are preserved', () => {
  assert.equal(runner.COPY_MARKER, 'CODEADD_TESTS_COPY');
  assert.ok(runner.NATIVE_COPY_EXCLUDES.includes('.worktrees'));
  assert.match(h.read(RUNNER_PATH), /NODE_OPTIONS:\s*''/, 'children must get a cleared NODE_OPTIONS');
});

test('native Git transport still works through the harness', () => {
  const res = h.git(h.REPO_ROOT, ['--version']);
  assert.equal(res.status, 0, res.output);
  assert.match(res.stdout, /git version/);
});
