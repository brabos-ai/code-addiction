'use strict';
// =============================================================================
// MIGRATION ACCEPTANCE — final runtime and case-transfer guards
// =============================================================================
// ⛔ THESE ASSERTIONS ARE MEANT TO FAIL TODAY. F1 writes them so the end state
//    is a test, not a promise, and records them as intentional Red in the
//    ledger. They turn Green only as F20/F21/F22/F30/F31 land. They are NOT
//    F1's passing gate — that is harness.test.cjs.
//
// F27 completes this file with the inventory/case-accounting/final-state
// assertions, the no-Bash guard/negative control and the native Git/npm
// transport assertions. F1 seeds those three areas; each is marked below.
//
// Run: node --test scripts/tests/migration-acceptance.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const SHIPPED = path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'scripts');
const PRODUCT_TESTS = path.join(SHIPPED, 'tests');
const ACTIVE_ROOTS = [
  path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'commands'),
  path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'skills'),
  path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'agents'),
  path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'fragments'),
  path.join(h.REPO_ROOT, 'framwork', '.codeadd', 'plugins'),
  path.join(h.REPO_ROOT, 'workbench'),
];

test('CASE TRANSFER: every baseline case resolves to an existing native test ID', () => {
  const map = h.loadCaseMap();
  for (const script of map.scripts) {
    const text = h.read(path.join(h.REPO_ROOT, script.nativeTest));
    for (const entry of script.cases) {
      const declaration = new RegExp('\\btest\\(\\s*[\\x27\\x22\\x60]' + entry.nativeCaseId + '\\b');
      assert.match(text, declaration, `${entry.id} has no native test declaration in ${script.nativeTest}`);
    }
  }
});

/** Recursively collect files under `root` matching `pred`. */
function walk(root, pred, out = []) {
  if (!fs.existsSync(root)) return out;
  const stat = fs.statSync(root);
  if (stat.isFile()) {
    if (pred(root)) out.push(root);
    return out;
  }
  for (const entry of fs.readdirSync(root)) walk(path.join(root, entry), pred, out);
  return out;
}

// --- inventory / final-state -------------------------------------------------

test('END STATE: no shipped .sh source remains (F20)', () => {
  const shells = fs.existsSync(SHIPPED)
    ? fs.readdirSync(SHIPPED).filter((f) => f.endsWith('.sh'))
    : [];
  assert.deepEqual(shells, [], 'shipped shell entries still present');
});

test('END STATE: no root .sh entry remains (F21/F30)', () => {
  const shells = fs.readdirSync(h.ROOT_SCRIPTS_DIR).filter((f) => f.endsWith('.sh'));
  assert.deepEqual(shells, [], 'root shell entries still present');
});

test('END STATE: the product Bats/helper transport is gone (F31)', () => {
  const bats = fs.existsSync(PRODUCT_TESTS)
    ? fs.readdirSync(PRODUCT_TESTS).filter((f) => f.endsWith('.bats'))
    : [];
  assert.deepEqual(bats, [], 'product Bats suites still present');
  assert.equal(fs.existsSync(path.join(PRODUCT_TESTS, 'run-tests.sh')), false, 'run-tests.sh present');
  assert.equal(fs.existsSync(path.join(PRODUCT_TESTS, 'test_helper')), false, 'test_helper present');
});

test('END STATE: root test:scripts no longer routes through Bats (F22)', () => {
  const pkg = JSON.parse(h.read(path.join(h.REPO_ROOT, 'package.json')));
  assert.doesNotMatch(String(pkg.scripts['test:scripts']), /bats|run-tests\.js bats/i);
});

// --- no-Bash guard / negative control (seed; F27 completes) ------------------

test('END STATE: no active source invokes bash .codeadd/scripts/*.sh (F18/F19/F20)', () => {
  // The ticket's own guard is `grep -rn "bash .codeadd/scripts"` — an EXECUTION,
  // never a bare mention. A legacy clean-up instruction that names
  // `pattern-search.sh` in order to delete it is not an invocation, so the
  // pattern requires a shell interpreter before the path.
  const pattern = /\b(?:bash|sh)\s+(?:framwork\/)?\.codeadd\/scripts\/[a-z0-9-]+\.sh/;
  const offenders = [];
  for (const root of ACTIVE_ROOTS) {
    for (const file of walk(root, (f) => /\.(md|js|cjs|mjs)$/.test(f))) {
      const text = h.read(file);
      for (const line of text.split('\n')) {
        if (pattern.test(line)) offenders.push(`${path.relative(h.REPO_ROOT, file)}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(offenders, [], 'active shell invocations remain');
});

test('NEGATIVE CONTROL: the harness refuses to run a shell route', () => {
  // Proves the guard is real: point runNode at a shell script and it fails,
  // because there is no shell:true path in the harness to reach for.
  const dir = h.mkTmp('codeadd-neg-');
  try {
    h.write(path.join(dir, 'probe.sh'), '#!/bin/bash\necho reached\n');
    const res = h.runNode([path.join(dir, 'probe.sh')]);
    assert.notEqual(res.status, 0, 'a .sh must not run through runNode');
    assert.doesNotMatch(res.stdout, /reached/);
  } finally {
    h.rmrf(dir);
  }
});
