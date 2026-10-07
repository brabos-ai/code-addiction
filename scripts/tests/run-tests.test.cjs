'use strict';
// =============================================================================
// scripts/run-tests.js — authorized Linux workers and the no-Bash boundary
// =============================================================================
// The NO-BASH GUARD, its negative control, and the native Git/npm transport
// assertions for the native root runner the plan builds in F22.
//
// The intended contract (plan F22/L6/L8):
//   • `npm run test:scripts` runs the root `scripts/tests/*.test.cjs` files
//     through Node's own test runner. The legacy selector may remain a native
//     alias, but it must NEVER execute Bats.
//   • Every local platform dispatches to Linux Docker without a native escape hatch.
//   • Git and npm remain real native tools — isolation must not be achieved by
//     hiding them behind a shell. The harness reaches git with `shell:false`
//     and npm through the CLI's own package scripts.
//   • A Bash attempt at the process boundary is refused: the harness exposes no
//     `runBash`, spawns no shell, and a `.sh` probe cannot execute.
//
// Run through npm run test:scripts -- scripts/tests/run-tests.test.cjs.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const RUNNER_PATH = path.join(h.ROOT_SCRIPTS_DIR, 'run-tests.js');
const runner = require(RUNNER_PATH);
const worker = require('../test-worker.cjs');
const context = require('../test-context.cjs');
const transport = require('../test-transport.cjs');

/** The native spawn specs for one suite, through the runner's own builder. */
function nativeSpecs(suite) {
  return context.leavesFor(suite).map(leaf => worker.toolSpec({ leaf, root: h.REPO_ROOT }));
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

test('the authorized CLI worker invokes Vitest directly, avoiding recursive npm dispatch', () => {
  const text = specText(nativeSpecs('vitest'));
  assert.match(text, /vitest/); assert.match(text, /cli/); assert.doesNotMatch(text, /npm/);
});

test('no native suite spawns a `.sh` route', () => {
  for (const suite of ['vitest', 'bats']) {
    const text = specText(nativeSpecs(suite));
    assert.doesNotMatch(text, /\.sh\b/, `${suite} must not route through a shell script`);
    assert.doesNotMatch(text, /\bbash\b/i, `${suite} must not route through Bash`);
  }
});

test('Docker transport uses fixed unpack shell and argv worker, never Bash', () => {
  const src = h.read(path.join(h.ROOT_SCRIPTS_DIR, 'test-transport.cjs'));
  assert.match(src, /'sh', '-c'/); assert.match(src, /test-worker\.cjs/); assert.doesNotMatch(src, /'bash'/);
});

test('script selection preserves separate option values and paths with spaces', () => {
  assert.deepEqual(worker.scriptArgs(['--test-name-pattern', 'case with spaces', 'scripts/tests/file with spaces.test.cjs'], h.REPO_ROOT),
    ['--test', '--test-name-pattern', 'case with spaces', 'scripts/tests/file with spaces.test.cjs']);
  const all = worker.scriptArgs(['--test-name-pattern', 'case with spaces'], h.REPO_ROOT);
  assert.deepEqual(all.slice(0, 3), ['--test', '--test-name-pattern', 'case with spaces']);
  assert.ok(all.slice(3).every(file => file.endsWith('.test.cjs')));
});

// --- platform resolution ----------------------------------------------------

test('Windows defaults to the Linux container and does not fall back to native', () => {
  assert.equal(typeof runner.resolveRunner, 'function', 'run-tests.js must export resolveRunner');
  const resolved = runner.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: false });
  assert.equal(resolved.runner, 'docker', 'Windows must default to the Linux container');
  assert.notEqual(resolved.runner, 'unavailable', 'a missing daemon is the transport refusing, not this choice');
});

test('native override is prohibited and Docker selection remains explicit', () => {
  assert.throws(() => runner.resolveRunner({ platform: 'win32', env: { CODEADD_TESTS_RUNNER: 'native' } }), /native/);
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

test('Bash negative control accepts only the rejector, not an unrelated spawn failure', () => {
  const guard = require('../no-bash-guard.js');
  assert.equal(guard.wasRejected({ status: 127, stderr: guard.REJECT_MESSAGE }), true);
  assert.equal(guard.wasRejected({ status: 127, stderr: 'command not found' }), false);
  assert.equal(guard.wasRejected({ status: null, error: new Error('spawn failed') }), false);
  assert.equal(guard.wasRejected({ status: 0, stderr: guard.REJECT_MESSAGE }), false);
});

test('the guard rejects direct and absolute Bash spawns while preserving native Git', () => {
  const preload = path.join(h.ROOT_SCRIPTS_DIR, 'no-bash-preload.cjs');
  const result = h.runNode(['-e', `
    const cp = require('node:child_process');
    for (const name of ['bash', 'bash.exe', '/bin/bash', 'C:\\\\Git\\\\bin\\\\bash.exe']) {
      try { cp.spawnSync(name, ['--version'], { shell: false }); process.exit(1); }
      catch (e) { if (e.code !== 'CODEADD_BASH_REFUSED') throw e; }
    }
    const nested = cp.spawnSync(process.execPath, ['-e', "try { require('node:child_process').spawnSync('bash'); process.exit(1); } catch(e) { if(e.code !== 'CODEADD_BASH_REFUSED') throw e; }"], { env: { ...process.env, NODE_OPTIONS: '' } });
    if(nested.status !== 0) process.exit(1);
    process.exit(cp.spawnSync('git', ['--version']).status);
  `], { env: { NODE_OPTIONS: `--require=${JSON.stringify(preload)}` } });
  assert.equal(result.status, 0, result.output);
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
  const src = h.read(path.join(h.ROOT_SCRIPTS_DIR, 'test-transport.cjs'));
  assert.match(src, /CODEADD_TESTS_COPY=1/); assert.ok(transport.EXCLUDES.includes('.worktrees'));
  assert.match(src, /NODE_OPTIONS:\s*''/, 'children must get a cleared NODE_OPTIONS');
});

test('native Git transport still works through the harness', () => {
  const res = h.git(h.REPO_ROOT, ['--version']);
  assert.equal(res.status, 0, res.output);
  assert.match(res.stdout, /git version/);
});
