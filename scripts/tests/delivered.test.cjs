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
//   - the corpus is `git ls-files --cached --others --exclude-standard`; the docs
//     root (and so the index) is a separate worktree, not part of the code tree.
//   - touched answers complete/curated from the entry's recorded `code_sha`
//     plus item anchors; an entry without `code_sha` answers curated only.
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
const { DOCS_ROOT, DOCS_LAYOUT } = require(path.join(h.SCRIPTS_DIR, 'docs-root.cjs'));

// --- fixture helpers ---------------------------------------------------------

function docsDir(repo) {
  return path.join(repo, ...DOCS_ROOT.split('/'));
}
function indexPath(repo) {
  return path.join(docsDir(repo), DOCS_LAYOUT.delivered);
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
    origin: DOCS_ROOT + '/features/0042F-login-google/',
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
    origin: DOCS_ROOT + '/features/' + id + '/',
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
  // The docs root is a worktree of another branch in a real project; here a
  // plain directory the code repository excludes locally, as `docs-branch
  // prepare` does.
  fs.mkdirSync(docsDir(r.repo), { recursive: true });
  h.write(path.join(r.repo, '.git', 'info', 'exclude'), DOCS_ROOT + '\n');
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
    for (const qry of ['login com Google', 'oauth', '0042F', 'POST /auth/google', 'authGoogleHandler']) {
      const res = runRead(r.repo, [qry]);
      assert.equal(res.status, 0, res.output);
      assert.equal(idsOf(res.stdout).includes('0042F'), true, 'query ' + qry + ' did not match');
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
    assert.equal(kv.MATCHED, '0');
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
    assert.equal(kv.MATCHED, '0');
  }));

test('delivered#014 L1.2: results are pre-sorted live then changed then superseded then gone', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    src(r.repo, 'src/chg.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0004F', 'gone', 'qry gone', 'qry gone', 'src/gone.ts', 'goneThing'),
      entry('0003F', 'superseded', 'qry superseded', 'qry superseded', 'src/sup.ts', 'supThing', { superseded_by: '0009F' }),
      entry('0002F', 'changed', 'qry changed', 'qry changed', 'src/moved.ts', 'changedThing'),
      entry('0001F', 'live', 'qry live', 'qry live', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['qry', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.deepEqual(idsOf(res.stdout), ['0001F', '0002F', '0003F', '0004F']);
  }));

test('delivered#015 L1.2: a dead entry competes on relevance and is returned when it is among the best', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'qry live', 'qry live', 'src/live.ts', 'liveThing'),
      entry('0004F', 'gone', 'qry gone', 'qry gone', 'src/gone.ts', 'goneThing'),
    ]);
    const res = runRead(r.repo, ['qry', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.match(res.output, /"id":"0004F"/);
    assert.equal(jsonOf(res.stdout).length, 2);
    assert.equal(kv.MATCHED, '2');
    assert.equal(kv.RETURNED, '2');
  }));

test('delivered#016 L1.2: the read returns five rows by default, and counts how many matched', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 12; i++) lines.push(entry('L' + i, 'live', 'qry entry ' + i, 'qry entry', 'src/live.ts', 'liveThing'));
    for (let i = 1; i <= 3; i++) lines.push(entry('D' + i, 'gone', 'qry dead ' + i, 'qry dead', 'src/gone.ts', 'goneThing'));
    writeIndex(r.repo, lines);
    const res = runRead(r.repo, ['qry', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED, '15');
    assert.equal(kv.RETURNED, '5');
    assert.equal(kv.STOP, 'limit');
    assert.equal(kv.NEXT_OFFSET, '5');
    assert.equal(jsonOf(res.stdout).length, 5);
  }));

test('delivered#017 L1.2: --limit sets how many rows come back, and 21 is a usage error', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 30; i++) lines.push(entry('L' + i, 'live', 'qry entry ' + i, 'qry entry', 'src/live.ts', 'liveThing'));
    writeIndex(r.repo, lines);
    const one = runRead(r.repo, ['qry', '--no-verify', '--limit', '1']);
    assert.equal(one.status, 0, one.output);
    assert.equal(kvOf(one).RETURNED, '1');
    assert.equal(jsonOf(one.stdout).length, 1);
    const max = runRead(r.repo, ['qry', '--no-verify', '--limit', '20']);
    assert.equal(kvOf(max).RETURNED, '20');
    const over = runRead(r.repo, ['qry', '--no-verify', '--limit', '21']);
    assert.equal(over.status, 2, over.output);
  }));

test('delivered#018 L1.2: --offset continues the ranked list and a bad --offset is a usage error', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 8; i++) lines.push(entry('L' + i, 'live', 'qry entry ' + i, 'qry entry', 'src/live.ts', 'liveThing'));
    writeIndex(r.repo, lines);
    const first = runRead(r.repo, ['qry', '--no-verify']);
    const second = runRead(r.repo, ['qry', '--no-verify', '--offset', '5']);
    assert.equal(second.status, 0, second.output);
    assert.equal(kvOf(second).OFFSET, '5');
    assert.equal(kvOf(second).RETURNED, '3');
    assert.equal(kvOf(second).STOP, 'end');
    assert.equal(kvOf(second).NEXT_OFFSET, '');
    assert.equal(new Set([...idsOf(first.stdout), ...idsOf(second.stdout)]).size, 8);
    assert.equal(runRead(r.repo, ['qry', '--offset', '1.5']).status, 2);
    assert.equal(runRead(r.repo, ['qry', '--offset', '-1']).status, 2);
  }));

test('delivered#019 L1.2: --layer filters', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'qry product', 'qry product', 'src/live.ts', 'liveThing'),
      record({
        v: 1, ts: '2026-09-07T12:00:00Z', id: 'plan-x', layer: 'internal', by: 'done',
        status: 'live', name: 'qry internal', words: 'qry internal', commits: ['a1b2c3d'],
        origin: DOCS_ROOT + '/deliveries/plan-x/', items: [{ what: 't', at: 'src/live.ts', find: 'liveThing' }],
      }),
    ]);
    const res = runRead(r.repo, ['qry', '--no-verify', '--layer', 'product']);
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
      entry('0001F', 'live', 'first name', 'qry alpha', 'src/live.ts', 'liveThing'),
      entry('0001F', 'live', 'second name', 'qry alpha', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['qry', '--no-verify']);
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
      entry('0001F', 'live', 'qry one', 'qry one', 'src/live.ts', 'liveThing'),
      '{not json at all',
      entry('0003F', 'live', 'qry three', 'qry three', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['qry', '--no-verify']);
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

test('delivered#031 L1.8: an item anchored under the docs root is refused', () =>
  withRepo((r) => {
    src(r.repo, DOCS_ROOT + '/notes.md', 'the docsAnchor lives here\n');
    commitAll(r.repo);
    const res = runWrite(r.repo, record({
      id: '0042F', layer: 'product', by: 'done', status: 'live', name: 'n', words: 'w',
      commits: ['a1b2c3d'], origin: 'o',
      items: [{ what: 'w', at: DOCS_ROOT + '/notes.md', find: 'docsAnchor' }],
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

test('delivered#045 L1.14: a superseded line anchored under the docs root is still refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0099F', 'live', 'new', 'new', 'src/auth/google.ts', 'authGoogleHandler')]);
    const res = runWrite(r.repo, supersededRecord('authGoogleHandler', '0099F', DOCS_ROOT + '/x.md'));
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
    writeIndex(r.repo, [entry('0001F', 'live', 'qry', 'qry', 'src/live.ts', 'liveThing')]);
    fs.rmSync(path.join(r.repo, 'src', 'live.ts'), { force: true });
    commitAll(r.repo);
    const res = runRead(r.repo, ['qry', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].status, 'live');
  }));

test('delivered#058 L1.12: the same read WITHOUT --no-verify reports the truth', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'qry', 'qry', 'src/live.ts', 'liveThing')]);
    fs.rmSync(path.join(r.repo, 'src', 'live.ts'), { force: true });
    commitAll(r.repo);
    const res = runRead(r.repo, ['qry']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].status, 'gone');
  }));

test('delivered#059 L1.12: a verifying read never writes — the file stays byte-identical', () =>
  withRepo((r) => {
    src(r.repo, 'src/moved.ts', 'const changedThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0002F', 'live', 'qry', 'qry', 'src/old.ts', 'changedThing')]);
    const before = h.read(indexPath(r.repo));
    const res = runRead(r.repo, ['qry']);
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
    // The index path is a directory, so the append is refused by the filesystem.
    fs.mkdirSync(indexPath(r.repo), { recursive: true });
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
    assert.equal(kv.MATCHED, '0');
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
    require('node:fs').mkdirSync(`${r.repo}/src/auth2`, { recursive: true });
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
    assert.match(res.output, /MATCHED=1/);
    assert.equal(idsOf(res.stdout)[0], 'E1');
  }));

test('delivered#073 L4.2: a query in no entry\'s text and no entry\'s node still returns nothing', () =>
  withRepo((r) => {
    src(r.repo, 'a.md', 'marker_gamma lives here\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('E1', 'live', 'a delivery', 'unrelated words only', 'a.md', 'marker_gamma', { node: 'internal/command/add-framework--done' })]);
    const res = runRead(r.repo, ['roadmap']);
    assert.equal(res.status, 0, res.output);
    assert.match(res.output, /MATCHED=0/);
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
//
// The delivery's commit is RECORDED in the entry as `code_sha`; the index lives
// on another branch, so no history of it can be walked. An entry without
// `code_sha` yields no `complete` answer — never a guess.

function headSha(repo) {
  return h.git(repo, ['rev-parse', 'HEAD']).stdout.trim();
}
function codeEntry(id, file, find, sha, extra) {
  return entry(id, 'live', 'delivery ' + id, 'words ' + id, file, find, Object.assign({ code_sha: sha, pr: null }, extra));
}
function seedCodeDelivery(r, id, file, find) {
  src(r.repo, file, 'const ' + find + ' = 1;\n');
  commitAll(r.repo, 'code for ' + id);
  const prev = fs.existsSync(indexPath(r.repo)) ? h.read(indexPath(r.repo)) : '';
  h.write(indexPath(r.repo), prev + codeEntry(id, file, find, headSha(r.repo)) + '\n');
}

test('delivered#075 L1.1: touched returns the delivery whose recorded code_sha changed the path', () =>
  withRepo((r) => {
    seedCodeDelivery(r, 'D1', 'src/one.ts', 'markerOne');
    const res = runTouched(r.repo, ['src/one.ts']);
    assert.equal(res.status, 0, res.output);
    const first = jsonOf(res.stdout)[0];
    assert.equal(first.id, 'D1');
    assert.equal(first.answer, 'complete');
    assert.equal(first.commit, headSha(r.repo));
    assert.equal(kvOf(res).CURATED_ONLY, '0');
  }));

test('delivered#076 L1.2: an entry whose at names the path but whose code_sha does not comes back curated', () =>
  withRepo((r) => {
    seedCodeDelivery(r, 'D2', 'src/two.ts', 'markerTwo');
    src(r.repo, 'src/other.ts', 'const markerOther = 1;\n');
    commitAll(r.repo, 'a later file the D2 commit never saw');
    const prev = h.read(indexPath(r.repo));
    h.write(indexPath(r.repo), prev + codeEntry('D3', 'src/other.ts', 'markerOther', h.git(r.repo, ['rev-parse', 'HEAD~1']).stdout.trim()) + '\n');
    const res = runTouched(r.repo, ['src/other.ts']);
    assert.equal(res.status, 0, res.output);
    const hit = jsonOf(res.stdout).find((e) => e.id === 'D3');
    assert.ok(hit, res.output);
    assert.equal(hit.answer, 'curated');
  }));

test('delivered#077 L1.3: the LAST line for an id supplies the code_sha (a stamped line wins)', () =>
  withRepo((r) => {
    seedCodeDelivery(r, 'D4', 'src/four.ts', 'markerFour');
    const sha = headSha(r.repo);
    const prev = h.read(indexPath(r.repo));
    const bare = entry('D4', 'live', 'delivery D4 recorded', 'words D4', 'src/four.ts', 'markerFour');
    h.write(indexPath(r.repo), prev.replace(/\n*$/, '\n') + bare + '\n' + codeEntry('D4', 'src/four.ts', 'markerFour', sha) + '\n');
    const res = runTouched(r.repo, ['src/four.ts']);
    assert.equal(res.status, 0, res.output);
    assert.equal(jsonOf(res.stdout)[0].commit, sha);
  }));

test('delivered#078 L1.4: an entry with no code_sha answers curated, never complete', () =>
  withRepo((r) => {
    src(r.repo, 'src/five.ts', 'const markerFive = 1;\n');
    commitAll(r.repo, 'source, committed alone');
    h.write(indexPath(r.repo), entry('D5', 'live', 'delivery D5', 'words D5', 'src/five.ts', 'markerFive') + '\n');
    const res = runTouched(r.repo, ['src/five.ts']);
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).TOUCHED_COMPLETE, '0');
    assert.equal(jsonOf(res.stdout)[0].answer, 'curated');
    assert.equal(kvOf(res).CURATED_ONLY, '1');
  }));

test('delivered#079 L1.5: CURATED_ONLY counts every entry that could not answer from its code_sha', () =>
  withRepo((r) => {
    src(r.repo, 'src/six.ts', 'const markerSix = 1;\n');
    src(r.repo, 'src/seven.ts', 'const markerSeven = 1;\n');
    commitAll(r.repo, 'both sources');
    h.write(indexPath(r.repo),
      entry('D6', 'live', 'delivery D6', 'words D6', 'src/six.ts', 'markerSix') + '\n'
      + entry('D7', 'live', 'delivery D7', 'words D7', 'src/seven.ts', 'markerSeven') + '\n');
    const res = runTouched(r.repo, ['src/six.ts', 'src/seven.ts']);
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).CURATED_ONLY, '2');
  }));

test('delivered#080 L1.6: a path no delivery touched returns both blocks empty, exit 0', () =>
  withRepo((r) => {
    seedCodeDelivery(r, 'D8', 'src/eight.ts', 'markerEight');
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

test('delivered#082 L1.7b: a code_sha git cannot resolve degrades to curated, never to an error', () =>
  withRepo((r) => {
    src(r.repo, 'src/nine.ts', 'const markerNine = 1;\n');
    commitAll(r.repo, 'source only');
    h.write(indexPath(r.repo), codeEntry('D9', 'src/nine.ts', 'markerNine', '0123456789abcdef0123456789abcdef01234567') + '\n');
    const res = runTouched(r.repo, ['src/nine.ts']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.TOUCHED_CURATED, '1');
    assert.equal(kv.CURATED_ONLY, '1');
    assert.equal(jsonOf(res.stdout)[0].answer, 'curated');
  }));

test('delivered#083 L1.7c: a delivery landed by a MERGE commit answers complete with the recorded merge sha', () =>
  withRepo((r) => {
    src(r.repo, 'src/base.ts', 'const markerBase = 1;\n');
    commitAll(r.repo, 'base');
    const trunk = h.git(r.repo, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
    h.git(r.repo, ['checkout', '-q', '-b', 'feat']);
    src(r.repo, 'src/ten.ts', 'const markerTen = 1;\n');
    commitAll(r.repo, 'F1: code');
    src(r.repo, 'src/ten-b.ts', 'const markerTenB = 1;\n');
    commitAll(r.repo, 'F2: code');
    h.git(r.repo, ['checkout', '-q', trunk]);
    h.git(r.repo, ['merge', '-q', '--no-ff', 'feat', '-m', 'Merge pull request: D10']);
    const merge = headSha(r.repo);
    h.write(indexPath(r.repo), codeEntry('D10', 'src/ten.ts', 'markerTen', merge) + '\n');
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

// --- code_sha / pr: the two fields the close-out records ---------------------

test('delivered#085 L1.11: write accepts code_sha and pr, keeps v at 1, and persists both', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const sha = headSha(r.repo);
    const res = runWrite(r.repo, validRecord({ code_sha: sha, pr: 77 }));
    assert.equal(res.status, 0, res.output);
    const line = JSON.parse(firstIndexLine(r.repo));
    assert.equal(line.v, 1);
    assert.equal(line.code_sha, sha);
    assert.equal(line.pr, 77);
  }));

test('delivered#086 L1.11: pr may be null, and a malformed code_sha or pr is refused', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const ok = runWrite(r.repo, validRecord({ code_sha: headSha(r.repo), pr: null }));
    assert.equal(ok.status, 0, ok.output);
    assert.equal(JSON.parse(lastIndexLine(r.repo)).pr, null);
    const badSha = runWrite(r.repo, validRecord({ code_sha: 'not-a-sha' }));
    assert.equal(badSha.status, 2, badSha.output);
    assert.match(badSha.output, /REFUSED=bad-code-sha/);
    const badPr = runWrite(r.repo, validRecord({ code_sha: headSha(r.repo), pr: 'x' }));
    assert.equal(badPr.status, 2, badPr.output);
    assert.match(badPr.output, /REFUSED=bad-pr/);
  }));

test('delivered#087 L1.12: stamp appends a NEW line carrying code_sha and pr; the recorded line is untouched', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    assert.equal(runWrite(r.repo, validRecord()).status, 0);
    const before = firstIndexLine(r.repo);
    const sha = headSha(r.repo);
    const res = h.runScript('delivered', ['stamp', '0042F', '--code-sha', sha, '--pr', '12'], { cwd: r.repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).ENTRY, '0042F');
    assert.equal(indexLines(r.repo), 2);
    assert.equal(firstIndexLine(r.repo), before);
    const last = JSON.parse(lastIndexLine(r.repo));
    assert.equal(last.v, 1);
    assert.equal(last.code_sha, sha);
    assert.equal(last.pr, 12);
    assert.equal(last.name, 'login com Google');
    const touched = jsonOf(runTouched(r.repo, ['src/auth/google.ts']).stdout)[0];
    assert.equal(touched.answer, 'complete');
  }));

test('delivered#088 L1.12: stamp on an id the index does not hold is an error, and writes nothing', () =>
  withRepo((r) => {
    commitAll(r.repo);
    const res = h.runScript('delivered', ['stamp', '0042F', '--code-sha', 'abc1234'], { cwd: r.repo });
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /ERROR=entry-absent/);
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
  }));

test('delivered#089 L1.13: with no docs root, write is a named error and read is an empty answer', () => {
  const r = h.makeRepo();
  try {
    validSource(r.repo);
    commitAll(r.repo);
    const w = runWrite(r.repo, validRecord());
    assert.equal(w.status, 2, w.output);
    assert.match(w.output, /ERROR=docs-root-missing/);
    const rd = runRead(r.repo, ['login']);
    assert.equal(rd.status, 0, rd.output);
    assert.equal(kvOf(rd).MATCHED, '0');
  } finally {
    r.cleanup();
  }
});

// --- performHistoryRead: the exact-node question, off the text ranker ----------

test('delivered#090 F3: performHistoryRead returns an entry carrying the node even when no text names it', () =>
  withRepo((r) => {
    src(r.repo, 'a.txt', 'alphaFind\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('0001F', 'live', 'unrelated wording', 'nothing here', 'a.txt', 'alphaFind', { node: 'product/command/add-done' }),
      entry('0002F', 'live', 'add-done mentioned in text only', 'add-done', 'a.txt', 'alphaFind'),
      entry('0003F', 'superseded', 'older', 'older', 'a.txt', 'alphaFind', { node: 'product/command/add-done', superseded_by: '0001F' }),
    ]);
    const core = require(path.join(h.SCRIPTS_DIR, 'delivery-index-core.cjs'));
    const ctx = core.createContext({ root: r.repo });
    const out = core.performHistoryRead(ctx, { node: 'product/command/add-done', limit: 50 });
    assert.deepEqual(out.entries.map((e) => e.id), ['0001F', '0003F']);
    assert.equal(out.matchedLive, 1);
    assert.equal(out.matchedDead, 1);
    assert.equal(out.returnedLive, 1);
    assert.equal(out.returnedDead, 1);
    assert.equal(out.liveCap, 50);
    assert.equal(out.deadCap, core.DEAD_CAP);
    assert.deepEqual(out.skipped, []);
  }));

test('delivered#091 F3: performHistoryRead honours --layer and the dead cap, and matches an item-level node', () =>
  withRepo((r) => {
    src(r.repo, 'a.txt', 'alphaFind\n');
    commitAll(r.repo);
    const items = [{ what: 'x', at: 'a.txt', find: 'alphaFind', node: 'internal/skill/foo' }];
    writeIndex(r.repo, [
      JSON.stringify({ ...JSON.parse(entry('0010F', 'live', 'n', 'w', 'a.txt', 'alphaFind')), layer: 'internal', items }),
      entry('0011F', 'gone', 'g1', 'w', 'zzz.txt', 'missingFind', { node: 'internal/skill/foo' }),
      entry('0012F', 'gone', 'g2', 'w', 'zzz.txt', 'missingFind', { node: 'internal/skill/foo' }),
      entry('0013F', 'gone', 'g3', 'w', 'zzz.txt', 'missingFind', { node: 'internal/skill/foo' }),
    ]);
    const core = require(path.join(h.SCRIPTS_DIR, 'delivery-index-core.cjs'));
    const ctx = core.createContext({ root: r.repo });
    const out = core.performHistoryRead(ctx, { node: 'internal/skill/foo', limit: 50 });
    assert.equal(out.entries.length, 3); // the live item-level hit + 2 dead (cap)
    assert.equal(out.matchedDead, 3);
    assert.equal(out.returnedDead, 2);
    const layered = core.performHistoryRead(core.createContext({ root: r.repo }), { node: 'internal/skill/foo', layer: 'internal', limit: 50 });
    assert.deepEqual(layered.entries.map((e) => e.id), ['0010F']);
  }));

// --- ranked read and get (docs-search-precision) --------------------------------

function runGet(repo, args) {
  return h.runScript('delivered', ['get', ...args], { cwd: repo });
}

test('delivered#092 F6: read emits the ranked keys and lean rows, never commits or items', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'tokens economy', 'token budget savings', 'src/live.ts', 'liveThing')]);
    const res = runRead(r.repo, ['economy tokens', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    for (const k of ['MATCHED', 'COLLAPSED', 'RETURNED', 'OFFSET', 'NEXT_OFFSET', 'STOP', 'SKIPPED_LINES']) assert.ok(k in kv, k);
    for (const k of ['MATCHED_LIVE', 'MATCHED_DEAD', 'RETURNED_LIVE', 'RETURNED_DEAD', 'LIVE_CAP', 'DEAD_CAP']) assert.ok(!(k in kv), k);
    const row = jsonOf(res.stdout)[0];
    assert.deepEqual(Object.keys(row).sort(), ['id', 'kind', 'layer', 'path', 'score', 'snippet', 'status', 'title']);
    assert.equal(row.kind, 'delivery');
    assert.equal(row.score, 1);
    assert.equal(row.title, 'tokens economy');
    assert.equal(row.path, DOCS_ROOT + '/features/0001F/');
    assert.ok(row.snippet.length > 0);
    assert.doesNotMatch(res.stdout, /"commits"|"items"/);
  }));

test('delivered#093 F6: a query of only stopwords and short terms matches nothing, never everything', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'de para tokens', 'de da para', 'src/live.ts', 'liveThing')]);
    const res = runRead(r.repo, ['de da para o', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.MATCHED, '0');
    assert.equal(kv.STOP, 'no-terms');
    assert.equal(jsonOf(res.stdout).length, 0);
  }));

test('delivered#094 F6: a word prefix matches, a loose fragment does not', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'authGoogleHandler tokens', 'login', 'src/live.ts', 'liveThing')]);
    assert.equal(kvOf(runRead(r.repo, ['auth', '--no-verify'])).MATCHED, '1');
    assert.equal(kvOf(runRead(r.repo, ['ken', '--no-verify'])).MATCHED, '0');
  }));

test('delivered#095 F6: one row per supersession chain — the head, with the older ids it replaces', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [
      entry('A1', 'live', 'search ranking', 'ranking relevance', 'src/live.ts', 'liveThing'),
      entry('A0', 'superseded', 'search ranking old', 'ranking relevance', 'src/live.ts', 'liveThing', { superseded_by: 'A1' }),
      entry('Z1', 'live', 'other thing', 'ranking', 'src/live.ts', 'liveThing'),
    ]);
    const res = runRead(r.repo, ['ranking relevance', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const rows = jsonOf(res.stdout);
    assert.equal(rows.filter((x) => x.id === 'A0').length, 0);
    const head = rows.find((x) => x.id === 'A1');
    assert.deepEqual(head.replaces, ['A0']);
    assert.equal(kvOf(res).COLLAPSED, '1');
    assert.equal(kvOf(res).MATCHED, '2');
    const old = jsonOf(runRead(r.repo, ['old', '--no-verify']).stdout);
    assert.equal(old.length, 1);
    assert.equal(old[0].id, 'A0');
    assert.equal(old[0].status, 'superseded');
    assert.equal(old[0].superseded_by, 'A1');
  }));

test('delivered#096 F6: the budget drops whole rows from the end and every emitted row parses', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const lines = [];
    for (let i = 1; i <= 20; i++) lines.push(entry('B' + String(i).padStart(2, '0'), 'live', 'budgetword ' + 'long '.repeat(180) + i, 'budgetword', 'src/live.ts', 'liveThing'));
    writeIndex(r.repo, lines);
    const res = runRead(r.repo, ['budgetword', '--no-verify', '--limit', '20']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.STOP, 'budget');
    assert.ok(Number(kv.RETURNED) < 20 && Number(kv.RETURNED) >= 1);
    assert.equal(jsonOf(res.stdout).length, Number(kv.RETURNED));
    assert.ok(res.stdout.length <= 8000, String(res.stdout.length));
    assert.equal(kv.NEXT_OFFSET, kv.RETURNED);
  }));

test('delivered#097 F6: the snippet is about 200 characters of the field that matched', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const long = { what: 'filler '.repeat(60) + 'needleword ' + 'tail '.repeat(60), at: 'src/live.ts', find: 'liveThing' };
    writeIndex(r.repo, [JSON.stringify({ ...JSON.parse(entry('0001F', 'live', 'plain', 'plain', 'src/live.ts', 'liveThing')), items: [long] })]);
    const row = jsonOf(runRead(r.repo, ['needleword', '--no-verify']).stdout)[0];
    assert.ok(row.snippet.includes('needleword'));
    assert.ok(row.snippet.length <= 215, String(row.snippet.length));
  }));

test('delivered#098 F6: get returns the full latest record, and FOUND=0 for an unknown id', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('0001F', 'live', 'first', 'w', 'src/live.ts', 'liveThing'), entry('0001F', 'live', 'second', 'w', 'src/live.ts', 'liveThing')]);
    const res = runGet(r.repo, ['0001F']);
    assert.equal(res.status, 0, res.output);
    assert.equal(kvOf(res).FOUND, '1');
    const rec = jsonOf(res.stdout)[0];
    assert.equal(rec.name, 'second');
    assert.ok(Array.isArray(rec.commits) && Array.isArray(rec.items));
    const none = runGet(r.repo, ['NOPE']);
    assert.equal(none.status, 0, none.output);
    assert.equal(kvOf(none).FOUND, '0');
    assert.equal(jsonOf(none.stdout).length, 0);
    assert.equal(runGet(r.repo, []).status, 2);
  }));

test('delivered#099 F6: get past the size limit cuts commits then items, says so, and still parses', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    const commits = Array.from({ length: 3000 }, (_, i) => (i + 0x1000000).toString(16));
    writeIndex(r.repo, [entry('0001F', 'live', 'big', 'w', 'src/live.ts', 'liveThing', { commits })]);
    const res = runGet(r.repo, ['0001F', '--no-verify']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.match(kv.TRUNCATED, /^commits:\d+(,items:\d+)?$/);
    const line = res.stdout.split('\n').find((l) => l.startsWith('{'));
    assert.ok(line.length <= 16000, String(line.length));
    const rec = JSON.parse(line);
    assert.ok(rec.commits.length < 3000);
    assert.equal(rec.name, 'big');
  }));

// --- no legacy `docs/...` origin in the index (docs-search-precision F8) --------

test('delivered#100 F8: write refuses an origin that still points at the retired docs/ path', () =>
  withRepo((r) => {
    validSource(r.repo);
    commitAll(r.repo);
    const res = runWrite(r.repo, validRecord({ origin: 'docs/plans/2026-01-01T000000-PLAN--x.md' }));
    assert.equal(res.status, 2, res.output);
    assert.match(res.output, /REFUSED=origin-legacy-path/);
    assert.equal(fs.existsSync(indexPath(r.repo)), false);
    const ok = runWrite(r.repo, validRecord({ origin: DOCS_ROOT + '/plans/2026-01-01T000000-PLAN--x.md' }));
    assert.equal(ok.status, 0, ok.output);
  }));

test('delivered#101 F8: verify --repair rewrites a docs/ origin as a NEW line and reports what it could not resolve', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    h.write(path.join(docsDir(r.repo), 'plans', 'present.md'), '# plan\n');
    writeIndex(r.repo, [
      entry('P1', 'live', 'present plan', 'present', 'src/live.ts', 'liveThing', { origin: 'docs/plans/present.md' }),
      entry('P2', 'live', 'missing plan', 'missing', 'src/live.ts', 'liveThing', { origin: 'docs/plans/missing.md' }),
      entry('P3', 'live', 'current plan', 'current', 'src/live.ts', 'liveThing'),
    ]);
    const before = h.read(indexPath(r.repo));
    const res = runVerify(r.repo, ['--repair']);
    assert.equal(res.status, 0, res.output);
    const kv = kvOf(res);
    assert.equal(kv.ORIGIN_REPAIRED, '2');
    assert.equal(kv.ORIGIN_UNRESOLVED, 'P2');
    assert.equal(kv.REPAIRED, '2');
    const after = h.read(indexPath(r.repo));
    assert.ok(after.startsWith(before), 'the repair appends, it never rewrites');
    const appended = after.slice(before.length).split('\n').filter(Boolean).map((l) => JSON.parse(l));
    assert.deepEqual(appended.map((e) => e.id).sort(), ['P1', 'P2']);
    assert.equal(appended.find((e) => e.id === 'P1').origin, DOCS_ROOT + '/plans/present.md');
    assert.equal(appended.every((e) => e.by === 'verify'), true);
    assert.equal(appended.every((e) => e.status === 'live'), true);
    // idempotent: nothing left to repair
    assert.equal(kvOf(runVerify(r.repo, ['--repair'])).ORIGIN_REPAIRED, '0');
  }));

test('delivered#102 F8: read and get print the current path even for an unrepaired docs/ line', () =>
  withRepo((r) => {
    src(r.repo, 'src/live.ts', 'const liveThing = 1;\n');
    commitAll(r.repo);
    writeIndex(r.repo, [entry('P1', 'live', 'legacy plan', 'legacy', 'src/live.ts', 'liveThing', { origin: 'docs/plans/legacy.md' })]);
    const row = jsonOf(runRead(r.repo, ['legacy', '--no-verify']).stdout)[0];
    assert.equal(row.path, DOCS_ROOT + '/plans/legacy.md');
    const rec = jsonOf(runGet(r.repo, ['P1', '--no-verify']).stdout)[0];
    assert.equal(rec.origin, DOCS_ROOT + '/plans/legacy.md');
    assert.match(h.read(indexPath(r.repo)), /"origin":"docs\/plans\/legacy.md"/);
  }));
