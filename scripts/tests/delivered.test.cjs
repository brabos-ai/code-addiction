'use strict';
// =============================================================================
// delivered.test.cjs — native port of framwork/.codeadd/scripts/tests/delivered.bats (F27)
// =============================================================================
// Target: framwork/.codeadd/scripts/delivered.cjs (F3, product). RED-FIRST: the
// .cjs entry does not exist yet, so every assertion below is intentionally Red
// until F3 lands. That failure IS the point.
//
// The old Bats case id is kept in the test name (`delivered#NNN`) so the tracked
// case map (scripts/tests/native-script-cases.json) can be reconciled one-to-one.
//
// CONTRACT UNDER TEST (from the shell source and delivery-index reference):
//   - exit 0 for probe results; exit 1 ONLY when the filesystem refuses a write;
//     exit 2 for caller error (bad mode/args, a record breaking a hard ban with
//     REFUSED=<ban>) or an unmet hard dependency.
//   - write appends ONE minified line and reports ENTRY/CREATED/LINES; `v` and
//     `ts` are script-generated; existing lines are never rewritten.
//   - read matches PER TERM over id/name/words/node/items[].what/items[].find
//     (never items[].at), sorts status rank -> score -> recency -> id, and cuts
//     two independent buckets (5 live, 2 dead) with NO backfill.
//   - verify reports; only --repair writes, and a repair is a NEW line.
//   - the corpus is `git ls-files --cached --others --exclude-standard` minus
//     docs/, minus the index.
//   - touched answers complete/curated from a DERIVED commit plus item anchors.
//
// RETIRED CASE: delivered#065 ("a missing node prints ERROR=node-missing") is an
// interpreter-specific failure the native migration retires — `node` IS the
// runtime, so there is no separate interpreter to be missing. See the test at
// the end: it pins the surviving contract that an unmet hard dependency is an
// `ERROR=` value, distinct from `REFUSED=`, and exits 2.
//
// Run: node --test scripts/tests/delivered.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers.cjs');
const fs = require('node:fs');
const path = require('node:path');

// --- fixture helpers ---------------------------------------------------------

function indexPath(repo) {
  return path.join(repo, 'docs', 'delivered.jsonl');
}
function src(repo, rel, content) {
  return h.write(path.join(repo, rel), content);
}
function commitAll(repo, msg) {
  h.git(repo, ['add', '-A']);
  h.git(repo, ['commit', '-q', '-m', msg || 'fixture']);
}
function validRecord(extra) {
  const rec = {
    id: '0042F',
    layer: 'product',
    by: 'done',
    status: 'live',
    name: 'login com Google',
    words: 'login google oauth token social',
    commits: ['a1b2c3d'],
    origin: 'docs/features/0042F-login-google/',
    items: [{ what: 'POST /auth/google', at: 'src/auth/google.ts', find: 'authGoogleHandler' }],
  };
  if (extra) Object.assign(rec, extra);
  return JSON.stringify(rec);
}
function validSource(repo) {
  src(repo, 'src/auth/google.ts', 'export function authGoogleHandler() { return 1; }\n');
}
function writeIndex(repo, lines) {
  h.write(indexPath(repo), lines.map((l) => l + '\n').join(''));
}
function entry(id, status, name, words, at, find, extra) {
  const o = {
    v: 1,
    ts: '2026-09-07T12:00:00Z',
    id,
    layer: 'product',
    by: 'done',
    status,
    name,
    words,
    commits: ['a1b2c3d'],
    origin: 'docs/features/' + id + '/',
    items: [{ what: 'thing', at, find }],
  };
  if (extra) Object.assign(o, extra);
  return JSON.stringify(o);
}
function record(overrides) {
  return JSON.stringify(overrides);
}
function runWrite(repo, input) {
  return h.runScript('delivered', ['write'], { cwd: repo, input });
}
function runRead(repo, args) {
  return h.runScript('delivered', ['read', ...args], { cwd: repo });
}
function runVerify(repo, args = []) {
  return h.runScript('delivered', ['verify', ...args], { cwd: repo });
}
function runTouched(repo, args) {
  return h.runScript('delivered', ['touched', ...args], { cwd: repo });
}
function kvOf(res) {
  return h.parseKV(res.stdout);
}
function jsonOf(stdout) {
  return stdout
    .split('\n')
    .filter((l) => l.startsWith('{'))
    .map((l) => JSON.parse(l));
}
function idsOf(stdout) {
  return jsonOf(stdout).map((e) => e.id);
}
function indexLines(repo) {
  return (h.read(indexPath(repo)).match(/\n/g) || []).length;
}
function firstIndexLine(repo) {
  return h.read(indexPath(repo)).split('\n')[0];
}
function lastIndexLine(repo) {
  const lines = h.read(indexPath(repo)).split('\n').filter((l, i, a) => l !== '' || i < a.length - 1);
  return lines[lines.length - 1];
}
function seedDelivery(r, id, file, find) {
  src(r.repo, file, 'const ' + find + ' = 1;\n');
  const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
  h.write(indexPath(r.repo), prev + entry(id, 'live', 'delivery ' + id, 'words ' + id, file, find) + '\n');
  commitAll(r.repo, 'squash for ' + id + ': code and index line together');
}
function withRepo(fn) {
  const r = h.makeRepo();
  try {
    return fn(r);
  } finally {
    r.cleanup();
  }
}

// --- L1.1 — write appends one line and reports it ---------------------------

test('delivered#001 L1.1: write accepts a valid record, appends one line, prints ENTRY/CREATED/LINES', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.ENTRY, '0042F');
    assert.equal(kv.CREATED, 'true');
    assert.equal(kv.LINES, '1');
    assert.equal(fs.existsSync(indexPath(r.repo)), true);
    assert.equal(indexLines(r.repo), 1);
  }));

test('delivered#002 L1.1: the written line is minified — one JSON object, no pretty printing', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 0, res.output);
    assert.equal(indexLines(r.repo), 1);
    const line = firstIndexLine(r.repo);
    assert.equal(line.startsWith('{'), true);
    assert.equal(line.endsWith('}'), true);
    assert.equal(h.read(indexPath(r.repo)).split('\n').filter(Boolean).length, 1);
  }));

test('delivered#003 L1.1: the script generates v and ts — the caller supplies neither', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 0, res.output);
    const line = JSON.parse(firstIndexLine(r.repo));
    assert.equal(line.v, 1);
    assert.match(line.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  }));

test('delivered#004 L1.1: a second write reports CREATED=false and LINES=2', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const first = runWrite(r.repo, validRecord());
    assert.equal(first.status, 0, first.output);
    const second = runWrite(r.repo, validRecord());
    assert.equal(second.status, 0, second.output);
    const kv = kvOf(second);
    assert.equal(kv.CREATED, 'false');
    assert.equal(kv.LINES, '2');
  }));

test('delivered#005 L1.1: an existing line is never rewritten — append only', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const first = runWrite(r.repo, validRecord());
    assert.equal(first.status, 0, first.output);
    const before = firstIndexLine(r.repo);
    const second = runWrite(r.repo, validRecord());
    assert.equal(second.status, 0, second.output);
    assert.equal(firstIndexLine(r.repo), before);
  }));

// --- L1.2 — read: matched fields, ordering, cap -----------------------------

test('delivered#006 L1.2: read matches on name, words, id, items[].what and items[].find', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    runWrite(r.repo, validRecord());
    for (const q of ['login com Google', 'oauth', '0042F', 'POST /auth/google', 'authGoogleHandler']) {
      const res = runRead(r.repo, [q]);
      assert.equal(res.status, 0, res.output);
      assert.equal(idsOf(res.stdout).includes('0042F'), true, 'query ' + q + ' did not match');
    }
  }));

test('delivered#007 L1.2: the query is case-insensitive — Google finds google', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    runWrite(r.repo, validRecord());
    const res = runRead(r.repo, ['GOOGLE']);
    assert.equal(res.status, 0, res.output);
    assert.equal(idsOf(res.stdout).includes('0042F'), true);
  }));

test('delivered#008 L1.2: find stays byte-exact and case-sensitive even though the query is not', () =>
  withRepo((r) => {
    src(r.repo, 'src/a.ts', 'const AUTHGOOGLEHANDLER = 1;\n');
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-absent/);
  }));

test('delivered#009 L1.2: two terms in the opposite order still match', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'alpha beta omega', 'zzz', 'src/live.ts', 'liveThing')]);
    const res = runRead(r.repo, ['omega alpha', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(idsOf(res.stdout).includes('0001F'), true);
  }));

test('delivered#010 L1.2: two terms drawn from different fields match', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'alpha', 'zzz omega', 'src/live.ts', 'liveThing')]);
    const res = runRead(r.repo, ['alpha omega', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(idsOf(res.stdout).includes('0001F'), true);
  }));

test('delivered#011 L1.2: an entry hitting every term outranks one hitting a single term', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'alpha', 'zzz', 'src/live.ts', 'liveThing'),
      entry('0009F', 'live', 'alpha', 'zzz beta yyy gamma', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['alpha beta gamma', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(idsOf(res.stdout)[0], '0009F');
  }));

test('delivered#012 L1.2: an entry matching no term at all is absent from both buckets', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'alpha', 'zzz', 'src/live.ts', 'liveThing')]);
    const res = runRead(r.repo, ['qqqq wwww', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED_LIVE, '0');
    assert.equal(kv.MATCHED_DEAD, '0');
    assert.equal(jsonOf(res.stdout).length, 0);
  }));

test('delivered#013 L1.2: items[].at stays out of the haystack even under per-term matching', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'alpha', 'zzz', 'src/uniquepathmarker.ts', 'liveThing')]);
    const res = runRead(r.repo, ['uniquepathmarker', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED_LIVE, '0');
    assert.equal(kv.MATCHED_DEAD, '0');
  }));

test('delivered#014 L1.2: results are pre-sorted live then changed then superseded then gone', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    src(r.repo, 'src/chg.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0004F', 'gone', 'q gone', 'q gone', 'src/gone.ts', 'goneThing'),
      entry('0003F', 'superseded', 'q superseded', 'q superseded', 'src/sup.ts', 'supThing', { superseded_by: '0009F' }),
      entry('0002F', 'changed', 'q changed', 'q changed', 'src/moved.ts', 'changedThing'),
      entry('0001F', 'live', 'q live', 'q live', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.deepEqual(idsOf(res.stdout), ['0001F', '0002F', '0003F', '0004F']);
  }));

test('delivered#015 L1.2: dead entries get their own reserved slots, not the leftovers of one cut', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'q live', 'q live', 'src/live.ts', 'liveThing'),
      entry('0004F', 'gone', 'q gone', 'q gone', 'src/gone.ts', 'goneThing'),
    ]);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.match(res.output, /"id":"0004F"/);
    assert.equal(jsonOf(res.stdout).length, 2);
    assert.equal(kv.MATCHED_LIVE, '1');
    assert.equal(kv.MATCHED_DEAD, '1');
    assert.equal(kv.RETURNED_DEAD, '1');
  }));

test('delivered#016 L1.2: the read returns five live and two dead, and counts each bucket', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 12; i++) lines.push(entry('L' + i, 'live', 'q entry ' + i, 'q entry', 'src/live.ts', 'liveThing'));
    for (let i = 1; i <= 3; i++) lines.push(entry('D' + i, 'gone', 'q dead ' + i, 'q dead', 'src/gone.ts', 'goneThing'));
    writeIndex(r.repo, lines);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED_LIVE, '12');
    assert.equal(kv.MATCHED_DEAD, '3');
    assert.equal(kv.RETURNED_LIVE, '5');
    assert.equal(kv.RETURNED_DEAD, '2');
    assert.equal(jsonOf(res.stdout).length, 7);
  }));

test('delivered#017 L1.2: --limit sets the live cap and leaves the dead cap alone', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 12; i++) lines.push(entry('L' + i, 'live', 'q entry ' + i, 'q entry', 'src/live.ts', 'liveThing'));
    for (let i = 1; i <= 3; i++) lines.push(entry('D' + i, 'gone', 'q dead ' + i, 'q dead', 'src/gone.ts', 'goneThing'));
    writeIndex(r.repo, lines);
    const res = runRead(r.repo, ['q', '--no-verify', '--limit', '1']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.RETURNED_LIVE, '1');
    assert.equal(kv.RETURNED_DEAD, '2');
    assert.equal(jsonOf(res.stdout).length, 3);
  }));

test('delivered#018 L1.2: unused dead slots are never backfilled with live entries', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 12; i++) lines.push(entry('L' + i, 'live', 'q entry ' + i, 'q entry', 'src/live.ts', 'liveThing'));
    writeIndex(r.repo, lines);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.RETURNED_LIVE, '5');
    assert.equal(kv.RETURNED_DEAD, '0');
    assert.equal(jsonOf(res.stdout).length, 5);
  }));

test('delivered#019 L1.2: --layer filters', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'q product', 'q product', 'src/live.ts', 'liveThing'),
      record({
        v: 1, ts: '2026-09-07T12:00:00Z', id: 'plan-x', layer: 'internal', by: 'done',
        status: 'live', name: 'q internal', words: 'q internal', commits: ['a1b2c3d'],
        origin: 'docs/plans/plan-x.md', items: [{ what: 't', at: 'src/live.ts', find: 'liveThing' }],
      }),
    ]);
    const res = runRead(r.repo, ['q', '--no-verify', '--layer', 'product']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout).length, 1);
    assert.equal(idsOf(res.stdout)[0], '0001F');
  }));

// --- L1.3 — last line wins --------------------------------------------------

test('delivered#020 L1.3: two lines for one id — read returns only the later one', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'first name', 'q alpha', 'src/live.ts', 'liveThing'),
      entry('0001F', 'live', 'second name', 'q alpha', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout).length, 1);
    assert.match(res.output, /second name/);
    assert.doesNotMatch(res.output, /first name/);
  }));

// --- L1.4 — a corrupt line is skipped and reported, never fatal -------------

test('delivered#021 L1.4: a corrupt line mid-file is skipped, reported by number, others returned', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'q one', 'q one', 'src/live.ts', 'liveThing'),
      '{not json at all',
      entry('0003F', 'live', 'q three', 'q three', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout).length, 2);
    assert.equal(kvOf(res).SKIPPED_LINES, '2');
  }));

// --- L1.5 — verify reports; only --repair writes ----------------------------

test('delivered#022 L1.5: verify without --repair leaves the file byte-identical', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    const before = h.read(indexPath(r.repo));
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0002F=changed/);
    assert.match(res.output, /REPAIRED=0/);
    assert.equal(h.read(indexPath(r.repo)), before);
  }));

test('delivered#023 L1.5: verify accepts a single id and reports only that entry', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'q one', 'q one', 'src/live.ts', 'liveThing'),
      entry('0002F', 'live', 'q two', 'q two', 'src/live.ts', 'liveThing'),
    ]);
    const res = runVerify(r.repo, ['0001F']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0001F=/);
    assert.doesNotMatch(res.output, /0002F=/);
  }));

test('delivered#024 L1.5: a declared superseded entry is never recomputed', () =>
  withRepo((r) => {
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0003F', 'superseded', 'q', 'q', 'src/gone.ts', 'supThing', { superseded_by: '0009F' })]);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0003F=superseded/);
  }));

// --- L1.6 / L1.7 — the corpus rule, in both directions ----------------------

test('delivered#025 L1.6: a stale copy in a gitignored directory does NOT keep an item alive', () =>
  withRepo((r) => {
    src(r.repo, '.gitignore', 'build/\n');
    validSource(r.repo);
    commitAll(r.repo);
    runWrite(r.repo, validRecord());
    fs.rmSync(path.join(r.repo, 'src', 'auth', 'google.ts'), { force: true });
    src(r.repo, 'build/google.ts', 'export function authGoogleHandler() { return 1; }\n');
    commitAll(r.repo);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0042F=gone/);
  }));

test('delivered#026 L1.7: an uncommitted source file is NOT garbage — the anchor resolves live', () =>
  withRepo((r) => {
    commitAll(r.repo);
    validSource(r.repo); // deliberately NOT committed
    const w = runWrite(r.repo, validRecord());
    assert.equal(w.status, 0, w.output);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0042F=live/);
  }));

// --- L1.8 — the hard bans, one per run, each with its REFUSED name ----------

test('delivered#027 L1.8: an item with no find is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o', items: [{ what: 'w', at: 'src/auth/google.ts' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=missing-field/);
  }));

test('delivered#028 L1.8: a find containing whitespace is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'POST /auth/google' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-whitespace/);
  }));

test('delivered#029 L1.8: six items are accepted — there is no ceiling', () =>
  withRepo((r) => {
    src(r.repo, 'src/x.ts', 'a1 a2 a3 a4 a5 a6\n');
    commitAll(r.repo);
    const items = [];
    for (let i = 1; i <= 6; i++) items.push({ what: 'w', at: 'src/x.ts', find: 'a' + i });
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o', items,
    }));
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /ENTRY=0042F/);
  }));

test('delivered#030 L1.8: zero items are refused', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o', items: [],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=no-items/);
  }));

test('delivered#031 L1.8: an item anchored into docs/ is refused', () =>
  withRepo((r) => {
    src(r.repo, 'docs/notes.md', 'the docsAnchor lives here\n');
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'docs/notes.md', find: 'docsAnchor' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=item-in-docs/);
  }));

test('delivered#032 L1.8: an item anchored into an ignored path is refused', () =>
  withRepo((r) => {
    src(r.repo, '.gitignore', 'generated/\n');
    src(r.repo, 'generated/client.ts', 'export const generatedClient = 1;\n');
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'generated/client.ts', find: 'generatedClient' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=item-ignored/);
  }));

test('delivered#033 L1.8: a status outside the four values is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'shipped', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'authGoogleHandler' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=bad-status/);
  }));

test('delivered#034 L1.8: superseded without superseded_by is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'superseded', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'authGoogleHandler' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=superseded-without-by/);
  }));

test('delivered#035 L1.8: an entry with no commits is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: [], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'authGoogleHandler' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=no-commits/);
  }));

test('delivered#036 L1.8: a find absent from the corpus is refused (ban 3)', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'neverAppearsAnywhere' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-absent/);
  }));

test('delivered#037 L1.8: input that is not JSON is refused as caller error', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = runWrite(r.repo, 'not a record');
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=invalid-json/);
  }));

test('delivered#038 L1.8: a refused write creates no index and appends nothing', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, 'not a record');
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=invalid-json/);
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

// --- L1.14 — a superseded line is declared, not anchored --------------------

function supersededRecord(find, supersededBy, at) {
  return record({
    id: '0042F', layer: 'product', by: 'human', status: 'superseded', superseded_by: supersededBy,
    name: 'n', words: 'w', commits: ['a1b2c3d'], origin: 'o',
    items: [{ what: 'w', at: at || 'src/auth/google.ts', find }],
  });
}

test('delivered#039 L1.14: a superseded line whose anchor is gone is accepted', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('neverAppearsAnywhere', '0099F'));
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).ENTRY, '0042F');
    assert.equal(indexLines(r.repo), 2);
  }));

test('delivered#040 L1.14: a superseded line whose find matches more than 20 files is accepted, with no LOOSE flag', () =>
  withRepo((r) => {
    for (let i = 1; i <= 25; i++) src(r.repo, 'src/f' + i + '.ts', 'const user = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/f1.ts', 'user')]);
    const res = runWrite(r.repo, supersededRecord('user', '0099F'));
    assert.equal(res.status, 0, res.output);
    assert.doesNotMatch(res.output, /LOOSE=/);
  }));

test('delivered#041 L1.14: superseded_by naming no indexed id is refused and appends nothing', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('authGoogleHandler', '9999X'));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=superseded-by-unknown/);
    assert.equal(indexLines(r.repo), 1);
  }));

test('delivered#042 L1.14: with no index at all, superseded_by resolves nothing and is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, supersededRecord('authGoogleHandler', '0099F'));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=superseded-by-unknown/);
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

test('delivered#043 L1.14: a superseded line still gets the shape checks — whitespace in find is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('two words', '0099F'));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-whitespace/);
  }));

test('delivered#044 L1.14: a superseded line anchored into a path ignored since it was written is accepted', () =>
  withRepo((r) => {
    src(r.repo, '.gitignore', 'generated/\n');
    src(r.repo, 'generated/client.ts', 'export const generatedClient = 1;\n');
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('generatedClient', '0099F', 'generated/client.ts'));
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).ENTRY, '0042F');
  }));

test('delivered#045 L1.14: a superseded line anchored into docs/ is still refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('authGoogleHandler', '0099F', 'docs/x.md'));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=item-in-docs/);
  }));

test('delivered#046 L1.14: a changed line whose anchor is gone is still refused (ban 3)', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'changed', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/auth/google.ts', find: 'neverAppearsAnywhere' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-absent/);
  }));

// --- L1.9 — the over-match thresholds ---------------------------------------

test('delivered#047 L1.9: a find matching more than 20 files is refused', () =>
  withRepo((r) => {
    for (let i = 1; i <= 25; i++) src(r.repo, 'src/f' + i + '.ts', 'const user = 1;\n');
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: 'src/f1.ts', find: 'user' }],
    }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=find-over-matched/);
  }));

test('delivered#048 L1.9: 1-5 files is accepted silently — no LOOSE flag', () =>
  withRepo((r) => {
    for (let i = 1; i <= 3; i++) src(r.repo, 'src/f' + i + '.ts', 'const authGoogleHandler = 1;\n');
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 0, res.output);
    assert.doesNotMatch(res.output, /LOOSE=/);
  }));

test('delivered#049 L1.9: 6-20 files is accepted and flagged LOOSE for the preview', () =>
  withRepo((r) => {
    for (let i = 1; i <= 9; i++) src(r.repo, 'src/f' + i + '.ts', 'const authGoogleHandler = 1;\n');
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /LOOSE=authGoogleHandler/);
  }));

// --- L1.10 / L1.11 — repair only on a unique match --------------------------

test('delivered#050 L1.10: find absent from at, present in exactly one other file, is changed', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0002F=changed/);
  }));

test('delivered#051 L1.10: --repair rewrites at to the unique match, as a NEW line', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /REPAIRED=1/);
    assert.equal(indexLines(r.repo), 2);
    assert.match(firstIndexLine(r.repo), /"at":"src\/old\.ts"/);
    const last = lastIndexLine(r.repo);
    assert.match(last, /"at":"src\/moved\.ts"/);
    assert.match(last, /"by":"verify"/);
    assert.match(last, /"status":"changed"/);
  }));

test('delivered#052 L1.11: three other matches means changed with at UNCHANGED even under --repair', () =>
  withRepo((r) => {
    src(r.repo, 'src/a.ts', 'const changedThing = 1;\n');
    src(r.repo, 'src/b.ts', 'const changedThing = 2;\n');
    src(r.repo, 'src/c.ts', 'const changedThing = 3;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0002F=changed/);
    assert.match(res.output, /REPAIRED=0/);
    assert.equal(indexLines(r.repo), 1);
  }));

test('delivered#053 L1.11: repair is idempotent — a second run finds nothing to repair', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    runVerify(r.repo, ['--repair']);
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /REPAIRED=0/);
    assert.equal(indexLines(r.repo), 2);
  }));

// --- Status aggregation -----------------------------------------------------

const multiItem = (id, items) => record({
  v: 1, ts: '2026-09-07T12:00:00Z', id, layer: 'product', by: 'done', status: 'live',
  name: 'q', words: 'q', commits: ['a1b2c3d'], origin: 'o', items,
});

test('delivered#054 aggregation: ALL items gone makes the entry gone', () =>
  withRepo((r) => {
    commitAll(r.repo);
    writeIndex(r.repo, [multiItem('0005F', [
      { what: 'a', at: 'src/x.ts', find: 'aaaGone' },
      { what: 'b', at: 'src/y.ts', find: 'bbbGone' },
    ])]);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0005F=gone/);
  }));

test('delivered#055 aggregation: ONE gone among live items makes the entry changed, NEVER gone', () =>
  withRepo((r) => {
    src(r.repo, 'src/x.ts', 'const aaaLive = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [multiItem('0006F', [
      { what: 'a', at: 'src/x.ts', find: 'aaaLive' },
      { what: 'b', at: 'src/y.ts', find: 'bbbGone' },
    ])]);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0006F=changed/);
  }));

test('delivered#056 aggregation: every item resolving at its own at makes the entry live', () =>
  withRepo((r) => {
    src(r.repo, 'src/x.ts', 'const aaaLive = 1;\n');
    src(r.repo, 'src/y.ts', 'const bbbLive = 2;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [multiItem('0007F', [
      { what: 'a', at: 'src/x.ts', find: 'aaaLive' },
      { what: 'b', at: 'src/y.ts', find: 'bbbLive' },
    ])]);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /0007F=live/);
  }));

// --- L1.12 — --no-verify opens no source file -------------------------------

test('delivered#057 L1.12: --no-verify returns the stored status and opens no source file', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'q', 'q', 'src/live.ts', 'liveThing')]);
    fs.rmSync(path.join(r.repo, 'src', 'live.ts'), { force: true });
    commitAll(r.repo);
    const res = runRead(r.repo, ['q', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].status, 'live');
  }));

test('delivered#058 L1.12: the same read WITHOUT --no-verify reports the truth', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'q', 'q', 'src/live.ts', 'liveThing')]);
    fs.rmSync(path.join(r.repo, 'src', 'live.ts'), { force: true });
    commitAll(r.repo);
    const res = runRead(r.repo, ['q']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].status, 'gone');
  }));

test('delivered#059 L1.12: a verifying read never writes — the file stays byte-identical', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'q', 'q', 'src/old.ts', 'changedThing')]);
    const before = h.read(indexPath(r.repo));
    const res = runRead(r.repo, ['q']);
    assert.equal(res.status, 0, res.output);
    assert.equal(h.read(indexPath(r.repo)), before);
  }));

// --- L1.13 — misuse and a refused write -------------------------------------

test('delivered#060 L1.13: a bad mode exits 2', () =>
  withRepo((r) => {
    const res = h.runScript('delivered', ['frobnicate'], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
  }));

test('delivered#061 L1.13: no arguments exits 2', () =>
  withRepo((r) => {
    const res = h.runScript('delivered', [], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
  }));

test('delivered#062 L1.13: read without a query exits 2', () =>
  withRepo((r) => {
    const res = h.runScript('delivered', ['read'], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
  }));

test('delivered#063 L1.13: an unknown flag exits 2', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = h.runScript('delivered', ['read', 'q', '--sort-by-vibes'], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
  }));

test('delivered#064 L1.13: a write the filesystem refuses exits 1, never 0', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    // `docs` is a regular file, so the index directory cannot be created.
    fs.rmSync(path.join(r.repo, 'docs'), { recursive: true, force: true });
    src(r.repo, 'docs', 'not a directory\n');
    const res = runWrite(r.repo, validRecord());
    assert.equal(res.status, 1, res.output);
    assert.equal(kvOf(res).ERROR, 'cannot-write-index');
    assert.doesNotMatch(res.output, /ENTRY=/);
  }));

// --- retired case + surviving hard-dependency distinction -------------------
//
// delivered#065 in the Bats suite asserted `ERROR=node-missing` via a PATH shim
// with no node on it. That failure is interpreter-specific and is retired by the
// native migration: the entry IS a Node program launched by process.execPath, so
// there is no separate `node` to be missing. What survives — and what this test
// pins — is the caller-visible distinction the case existed to protect: an
// unmet hard dependency prints an `ERROR=` value and exits 2, never `REFUSED=`.
// Run outside any git repository, the surviving hard dependency (git, for the
// corpus) is the one that fires.

test('delivered#065 (retired node-missing): an unmet hard dependency is ERROR=, exit 2, distinct from REFUSED=', () =>
  withRepo((r) => {
    const outside = h.mkTmp('codeadd-nonrepo-');
    try {
      const res = h.runScript('delivered', ['read', 'q'], { cwd: outside });
      assert.equal(res.status, 2, res.output);
      assert.equal(kvOf(res).ERROR, 'not-a-git-repository');
      assert.doesNotMatch(res.output, /REFUSED=/);
    } finally {
      h.rmrf(outside);
    }
  }));

// --- Absence is a no-op, never an error -------------------------------------

test('delivered#066 an absent index makes read a no-op with a note, exit 0', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = runRead(r.repo, ['anything']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED_LIVE, '0');
    assert.equal(kv.MATCHED_DEAD, '0');
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

test('delivered#067 an absent index makes verify a no-op, exit 0, and scaffolds nothing', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = runVerify(r.repo);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /REPAIRED=0/);
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

// --- `node` — the optional join field ---------------------------------------

test('delivered#068 node: an ENTRY-level node round-trips through write', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord({ node: 'product/skill/add-doc-schemas' }));
    assert.equal(res.status, 0, res.output);
    assert.match(firstIndexLine(r.repo), /"node":"product\/skill\/add-doc-schemas"/);
  }));

test('delivered#069 node: an ITEM-level node is normalised away — the item is {what, at, find}', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const rec = JSON.parse(validRecord());
    rec.items[0].node = 'product/skill/add-doc-schemas';
    const res = runWrite(r.repo, JSON.stringify(rec));
    assert.equal(res.status, 0, res.output);
    assert.doesNotMatch(firstIndexLine(r.repo), /"node"/);
  }));

test('delivered#070 node: an entry-level node SURVIVES --repair, so the join is not lost on a move', () =>
  withRepo((r) => {
    src(r.repo, 'src/auth/google.ts', 'export function authGoogleHandler() { return 1; }\n');
    commitAll(r.repo);
    const res0 = runWrite(r.repo, validRecord({ node: 'product/skill/add-doc-schemas' }));
    assert.equal(res0.status, 0, res0.output);
    h.git(r.repo, ['mv', 'src/auth/google.ts', 'src/auth2/google.ts']);
    commitAll(r.repo, 'moved');
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /REPAIRED=1/);
    const last = lastIndexLine(r.repo);
    assert.match(last, /"by":"verify"/);
    assert.match(last, /"at":"src\/auth2\/google\.ts"/);
    assert.match(last, /"node":"product\/skill\/add-doc-schemas"/);
  }));

test('delivered#071 node: a superseded entry is never re-serialised, so superseded_by cannot be lost', () =>
  withRepo((r) => {
    src(r.repo, 'a.md', 'marker_beta lives here\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('E2', 'superseded', 'old', 'old', 'a.md', 'marker_beta', { superseded_by: 'E9' })]);
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /E2=superseded/);
    assert.match(res.output, /REPAIRED=0/);
    assert.equal(indexLines(r.repo), 1);
    const line = firstIndexLine(r.repo);
    assert.match(line, /"superseded_by":"E9"/);
    assert.match(line, /"status":"superseded"/);
  }));

// --- read by node -----------------------------------------------------------

test('delivered#072 L4.1: read finds an entry by its node when nothing else in it spells that name', () =>
  withRepo((r) => {
    src(r.repo, 'a.md', 'marker_gamma lives here\n');
    commitAll(r.repo);
    writeIndex(r.repo, [(
      entry('E1', 'live', 'a delivery', 'unrelated words only', 'a.md', 'marker_gamma', { node: 'internal/command/add-framework--done' })
    )]);
    const res = runRead(r.repo, ['add-framework--done']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MATCHED_LIVE=1/);
    assert.equal(idsOf(res.stdout)[0], 'E1');
  }));

test('delivered#073 L4.2: a query in no entry\'s text and no entry\'s node still returns nothing', () =>
  withRepo((r) => {
    src(r.repo, 'a.md', 'marker_gamma lives here\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('E1', 'live', 'a delivery', 'unrelated words only', 'a.md', 'marker_gamma', { node: 'internal/command/add-framework--done' })]);
    const res = runRead(r.repo, ['add-framework--roadmap']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MATCHED_LIVE=0/);
    assert.doesNotMatch(res.output, /"id":"E1"/);
  }));

test('delivered#074 L4.3: an entry with no node at all is still readable by its text', () =>
  withRepo((r) => {
    src(r.repo, 'a.md', 'marker_gamma lives here\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('E1', 'live', 'a delivery', 'unrelated words only', 'a.md', 'marker_gamma')]);
    const res = runRead(r.repo, ['unrelated']);
    assert.equal(res.status, 0, res.output);
    assert.equal(idsOf(res.stdout)[0], 'E1');
  }));

// --- L1 — `touched`, the path query -----------------------------------------

test('delivered#075 L1.1: touched returns the delivery whose derived commit changed the path', () =>
  withRepo((r) => {
    seedDelivery(r, 'D1', 'src/one.ts', 'markerOne');
    const res = runTouched(r.repo, ['src/one.ts']);
    assert.equal(res.status, 0, res.output);
    const first = jsonOf(res.stdout)[0];
    assert.equal(first.id, 'D1');
    assert.equal(first.answer, 'complete');
  }));

test('delivered#076 L1.2: an entry whose at names the path but whose commit does not comes back curated', () =>
  withRepo((r) => {
    seedDelivery(r, 'D2', 'src/two.ts', 'markerTwo');
    src(r.repo, 'src/other.ts', 'const markerOther = 1;\n');
    commitAll(r.repo, 'a later file the D2 commit never saw');
    const prev = h.read(indexPath(r.repo));
    h.write(indexPath(r.repo), prev + entry('D3', 'live', 'delivery D3', 'words D3', 'src/other.ts', 'markerOther') + '\n');
    h.git(r.repo, ['add', '-A']);
    h.git(r.repo, ['commit', '-q', '-m', 'index line for D3, source already committed']);
    const res = runTouched(r.repo, ['src/other.ts']);
    assert.equal(res.status, 0, res.output);
    const hit = jsonOf(res.stdout).find((e) => e.id === 'D3');
    assert.ok(hit, res.output);
    assert.equal(hit.answer, 'curated');
  }));

test('delivered#077 L1.3: the derivation finds the line\'s FIRST commit, not a later correction', () =>
  withRepo((r) => {
    seedDelivery(r, 'D4', 'src/four.ts', 'markerFour');
    const first = h.git(r.repo, ['log', '--format=%h', '-1']).stdout.trim();
    const prev = h.read(indexPath(r.repo));
    h.write(indexPath(r.repo), prev + entry('D4', 'live', 'delivery D4 corrected', 'words D4', 'src/four.ts', 'markerFour') + '\n');
    h.git(r.repo, ['add', '-A']);
    h.git(r.repo, ['commit', '-q', '-m', 'correction line for D4']);
    const res = runTouched(r.repo, ['src/four.ts']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, new RegExp(first));
  }));

test('delivered#078 L1.4: an entry whose derived commit touches only docs/ answers curated', () =>
  withRepo((r) => {
    src(r.repo, 'src/five.ts', 'const markerFive = 1;\n');
    commitAll(r.repo, 'source, committed alone');
    const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
    h.write(indexPath(r.repo), prev + entry('D5', 'live', 'delivery D5', 'words D5', 'src/five.ts', 'markerFive') + '\n');
    h.git(r.repo, ['add', 'docs']);
    h.git(r.repo, ['commit', '-q', '-m', 'chore(delivery-index): record D5 after the fact']);
    const res = runTouched(r.repo, ['src/five.ts']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].answer, 'curated');
    assert.equal(kvOf(res).CURATED_ONLY, '1');
  }));

test('delivered#079 L1.5: CURATED_ONLY counts every entry that could not answer from its commit', () =>
  withRepo((r) => {
    src(r.repo, 'src/six.ts', 'const markerSix = 1;\n');
    src(r.repo, 'src/seven.ts', 'const markerSeven = 1;\n');
    commitAll(r.repo, 'both sources');
    const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
    h.write(indexPath(r.repo), prev
      + entry('D6', 'live', 'delivery D6', 'words D6', 'src/six.ts', 'markerSix') + '\n'
      + entry('D7', 'live', 'delivery D7', 'words D7', 'src/seven.ts', 'markerSeven') + '\n');
    h.git(r.repo, ['add', 'docs']);
    h.git(r.repo, ['commit', '-q', '-m', 'chore(delivery-index): record both after the fact']);
    const res = runTouched(r.repo, ['src/six.ts', 'src/seven.ts']);
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).CURATED_ONLY, '2');
  }));

test('delivered#080 L1.6: a path no delivery touched returns both blocks empty, exit 0', () =>
  withRepo((r) => {
    seedDelivery(r, 'D8', 'src/eight.ts', 'markerEight');
    const res = runTouched(r.repo, ['src/nowhere.ts']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.TOUCHED_COMPLETE, '0');
    assert.equal(kv.TOUCHED_CURATED, '0');
    assert.equal(jsonOf(res.stdout).length, 0);
    assert.equal(kv.INDEX_PRESENT, '1');
  }));

test('delivered#081 L1.7: an absent index makes touched a no-op, and says so in the output', () =>
  withRepo((r) => {
    commitAll(r.repo, 'no index at all');
    const res = runTouched(r.repo, ['src/anything.ts']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.TOUCHED_COMPLETE, '0');
    assert.equal(kv.TOUCHED_CURATED, '0');
    assert.equal(kv.INDEX_PRESENT, '0');
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

test('delivered#082 L1.7b: a history git cannot walk degrades to curated, never to an error', () =>
  withRepo((r) => {
    src(r.repo, 'src/nine.ts', 'const markerNine = 1;\n');
    commitAll(r.repo, 'source only, the index line never committed');
    const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
    h.write(indexPath(r.repo), prev + entry('D9', 'live', 'delivery D9', 'words D9', 'src/nine.ts', 'markerNine') + '\n');
    const res = runTouched(r.repo, ['src/nine.ts']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.TOUCHED_CURATED, '1');
    assert.equal(kv.CURATED_ONLY, '1');
    assert.equal(jsonOf(res.stdout)[0].answer, 'curated');
  }));

test('delivered#083 L1.7c: a delivery landed by a MERGE commit still answers complete, with the merge sha', () =>
  withRepo((r) => {
    src(r.repo, 'src/base.ts', 'const markerBase = 1;\n');
    commitAll(r.repo, 'base');
    const trunk = h.git(r.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
    h.git(r.repo, ['checkout', '-q', '-b', 'feat']);
    src(r.repo, 'src/ten.ts', 'const markerTen = 1;\n');
    commitAll(r.repo, 'F1: code');
    const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
    h.write(indexPath(r.repo), prev + entry('D10', 'live', 'delivery D10', 'words D10', 'src/ten.ts', 'markerTen') + '\n');
    h.git(r.repo, ['add', 'docs']);
    h.git(r.repo, ['commit', '-q', '-m', 'docs: index entry for D10']);
    h.git(r.repo, ['checkout', '-q', trunk]);
    h.git(r.repo, ['merge', '-q', '--no-ff', 'feat', '-m', 'Merge pull request: D10']);
    const merge = h.git(r.repo, ['log', '--format=%h', '-1']).stdout.trim();
    const res = runTouched(r.repo, ['src/ten.ts']);
    assert.equal(res.status, 0, res.output);
    const hit = jsonOf(res.stdout)[0];
    assert.equal(hit.answer, 'complete');
    assert.equal(hit.commit, merge);
    assert.equal(kvOf(res).CURATED_ONLY, '0');
  }));

test('delivered#084 L1.8: touched with no path exits 2', () =>
  withRepo((r) => {
    const res = h.runScript('delivered', ['touched'], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
  }));
