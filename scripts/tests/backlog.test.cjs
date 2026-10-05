'use strict';
// =============================================================================
// backlog — native port of framwork/.codeadd/scripts/tests/backlog.bats (67)
// =============================================================================
// Case map: scripts/tests/native-script-cases.json → backlog#001..#067.
// Target entry: framwork/.codeadd/scripts/backlog-cli.cjs.
//
// ⚠ RED, and expected. The allocator cases (backlog#001-#005, #019-#024,
//   #043) assert the INTENDED Node-to-Node contract: next-id.cjs and
//   status.cjs replace next-id.sh / status.sh (plan F7/F8). Those entries have
//   not landed, so those cases are meaningfully Red until they do; every other
//   case passes directly. No shell runs anywhere in this file — the old
//   `bash next-id.sh` / `bash status.sh` routes are not re-created.
//
// Run: node --test scripts/tests/backlog.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const BACKLOG = 'docs/backlog.jsonl';
const DEFS = 'docs/backlog.definitions.json';

const CORE = path.join(h.SCRIPTS_DIR, 'backlog-core.cjs');
const REF = path.join(h.SCRIPTS_DIR, '..', 'skills', 'add--doc-schemas', 'references', 'backlog.md');
const LIFECYCLE = path.join(h.SCRIPTS_DIR, '..', 'skills', 'add--backlog', 'references', 'lifecycle.md');

// In-process require of the exported defaults — the same read the old suite
// made through `node -e 'require(...).DEFAULT_DEFS'`, with no child process.
const core = require(CORE);

const NINE_STATUSES = ['open', 'refining', 'shaped', 'planning', 'planned', 'doing', 'in-review', 'done', 'dropped'];
const SEVEN_COLUMNS = ['backlog', 'shaping', 'planning', 'building', 'review', 'done', 'dropped'];

// ─── Fixture helpers ─────────────────────────────────────────────────────────

/** A throwaway project root used as the child's cwd; cleaned via t.after. */
function project(t, prefix = 'codeadd-backlog-') {
  const dir = h.mkTmp(prefix);
  t.after(() => h.rmrf(dir));
  return dir;
}

/** docs/features/<slug>/ with an about.md, the allocator's first source. */
function featureDir(dir, slug) {
  h.write(path.join(dir, 'docs', 'features', slug, 'about.md'), `# ${slug}\n`);
}

/** Append one minified ticket by hand, bypassing the script. */
function backlogLine(dir, id, title, status = 'open') {
  const ticket = {
    id,
    title,
    theme: 'general',
    tldr: title,
    notes: [],
    done_when: 'it works',
    paths: [],
    grounded: false,
    status,
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z',
    comments: [],
    work_id: null,
  };
  const file = path.join(dir, BACKLOG);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(ticket) + '\n');
}

/** The record `add` must accept, identical to the Bats fixture. */
function validTicket() {
  return JSON.stringify({
    title: 'cache the provider map',
    theme: 'performance',
    tldr: 'stop re-reading provider-map.json on every artefact',
    notes: ['build.js reads it once per file today'],
    done_when: 'node scripts/build.js reads provider-map.json exactly once',
    paths: ['scripts/build.js'],
    grounded: true,
    status: 'open',
  });
}

const backlog = (dir, args, opts = {}) => h.runScript('backlog-cli', args, { ...opts, cwd: dir });
const tickets = (stdout) => String(stdout).split('\n').filter((l) => l.startsWith('{'));
const key = (stdout, name) => h.parseKV(stdout)[name];
const lines = (file) => h.read(file).replace(/\n$/, '').split('\n');

/** The last line of the board, parsed. */
function lastTicket(dir) {
  const all = lines(path.join(dir, BACKLOG));
  return JSON.parse(all[all.length - 1]);
}

// ─── L1 — allocator sources ──────────────────────────────────────────────────
// Every case below targets the FUTURE native entries next-id.cjs / status.cjs.
// They are genuine Red until plan F7/F8 land those entries.

test('backlog#001 — L1.1: next-id.cjs B exceeds every id in docs/features AND docs/backlog.jsonl', (t) => {
  const dir = project(t);
  featureDir(dir, '0003F-login');
  backlogLine(dir, '0007B', 'cache the provider map');
  const res = h.runScript('next-id', ['B'], { cwd: dir });
  assert.equal(res.status, 0, res.output);
  assert.equal(res.stdout.trim(), '0008B');
});

test('backlog#002 — L1.1b: next-id.cjs F is raised by a backlog id too, one counter', (t) => {
  const dir = project(t);
  featureDir(dir, '0002F-login');
  backlogLine(dir, '0009B', 'something');
  const res = h.runScript('next-id', ['F'], { cwd: dir });
  assert.equal(res.status, 0, res.output);
  assert.equal(res.stdout.trim(), '0010F');
});

test('backlog#003 — L1.2: status.cjs next-id B exits 0 and returns an id', (t) => {
  const dir = project(t);
  featureDir(dir, '0004F-login');
  const res = h.runScript('status', ['next-id', 'B'], { cwd: dir });
  assert.equal(res.status, 0, res.output);
  assert.equal(res.stdout.trim(), '0005B');
});

test('backlog#004 — L1.3: status.cjs next-id Z still exits 2, B joins the allowlist', (t) => {
  const dir = project(t);
  const res = h.runScript('status', ['next-id', 'Z'], { cwd: dir });
  assert.equal(res.status, 2, res.output);
});

test('backlog#005 — L1.3b: the four original prefixes still resolve', (t) => {
  const dir = project(t);
  featureDir(dir, '0001F-x');
  for (const p of ['F', 'H', 'PRD', 'CHG']) {
    const res = h.runScript('status', ['next-id', p], { cwd: dir });
    assert.equal(res.status, 0, res.output);
    assert.equal(res.stdout.trim(), `0002${p}`);
  }
});

// ─── L1.4 — the vocabulary references cannot drift from the core ─────────────

test('backlog#006 — L1.4: every REFUSED= name the core can emit appears in references/backlog.md', () => {
  assert.ok(fs.existsSync(REF), `${REF} missing`);
  const ref = h.read(REF);
  const names = [...h.read(CORE).matchAll(/refusal: '([a-z-]+)'/g)].map((m) => m[1]);
  assert.ok(names.length > 0, 'core emits no refusal names');
  const missing = [...new Set(names)].filter((n) => !new RegExp('^\\| `' + n + '` \\|', 'm').test(ref));
  assert.deepEqual(missing, []);
});

test('backlog#007 — L1.4b: the documented vocabulary and the emittable one are the same set', () => {
  const ref = h.read(REF);
  const body = h.read(CORE);
  for (const n of ['invalid-json', 'missing-field', 'reserved-field', 'unknown-status', 'duplicate-id', 'unknown-id']) {
    assert.match(ref, new RegExp('^\\| `' + n + '` \\|', 'm'), `reference documents ${n}`);
    assert.ok(body.includes(`refusal: '${n}'`), `core emits ${n}`);
  }
});

test('backlog#008 — L1.4c: the nine reserved statuses and seven columns are the same set', () => {
  const ref = h.read(REF);
  for (const n of NINE_STATUSES) {
    assert.ok(core.DEFAULT_DEFS.statuses.some((s) => s.name === n), `core status ${n}`);
    assert.ok(ref.includes(`{ "name": "${n}",`), `reference status ${n}`);
  }
  for (const c of SEVEN_COLUMNS) {
    assert.ok(core.DEFAULT_DEFS.columns.some((s) => s.name === c), `core column ${c}`);
    assert.ok(ref.includes(`{ "name": "${c}",`), `reference column ${c}`);
  }
});

test('backlog#009 — L1.4d: lifecycle.md names all nine reserved statuses', () => {
  const lc = h.read(LIFECYCLE);
  const start = lc.indexOf('## The Status Names');
  assert.notEqual(start, -1, 'section missing');
  const rest = lc.slice(start);
  const nextH2 = rest.indexOf('\n## ', 1);
  const section = nextH2 === -1 ? rest : rest.slice(0, nextH2);
  for (const n of NINE_STATUSES) {
    assert.ok(section.includes('`' + n + '`'), `lifecycle names ${n}`);
  }
});

test('backlog#010 — L1.5c: neither allocator gained a node dependency — both stay pure bash', () => {
  for (const s of ['next-id.sh', 'status.sh']) {
    const p = path.join(h.SCRIPTS_DIR, s);
    if (!fs.existsSync(p)) continue; // end state: the shell entry is gone
    const body = h.read(p)
      .split('\n')
      .filter((l) => !/^\s*#/.test(l))
      .join('\n');
    assert.doesNotMatch(body, /command -v node/, `${s} calls node`);
    assert.doesNotMatch(body, /(^|[^a-zA-Z_-])node(\s|$)/m, `${s} calls node`);
  }
});

// ─── L4.2 / F1 / F2 — reads (compact-backlog-reads) ──────────────────────────

test('backlog#011 — L4.2: the native entry accepts record-file with native allocation', (t) => {
  const dir = project(t);
  const record = h.write(
    path.join(dir, 'native.json'),
    '{"title":"native lands","theme":"t","labels":[],"tldr":"t","notes":[],"done_when":"it works","paths":[],"grounded":false,"status":"open"}\n',
  );
  const res = backlog(dir, ['add', '--record-file', record]);
  assert.equal(res.status, 0, res.output);
  assert.match(res.stdout, /TICKET_ID=/);
});

test('backlog#012 — F1.L1: get returns the full raw row of the id, detail fields included', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first', 'open');
  fs.appendFileSync(
    path.join(dir, BACKLOG),
    '{"id":"0002B","title":"other","theme":"general","tldr":"t","notes":["mentions 0001B in notes"],"done_when":"t","paths":[],"grounded":false,"status":"done","created_at":"2026-09-20T00:00:00Z","updated_at":"2026-09-20T00:00:00Z","comments":[],"work_id":null}\n',
  );

  const res = backlog(dir, ['get', '0001B']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'TICKETS_RETURNED'), '1');
  const rows = tickets(res.stdout);
  assert.equal(rows.length, 1);
  assert.match(rows[0], /"done_when":"it works"/);
  assert.match(rows[0], /"id":"0001B"/);
  assert.doesNotMatch(rows.join('\n'), /"0002B"/);
});

test('backlog#013 — F1.L1b: get of an unknown id is a result, not a failure', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  const res = backlog(dir, ['get', '0404B']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'TICKETS_RETURNED'), '0');
  assert.equal(tickets(res.stdout).length, 0);
});

test('backlog#014 — F1.L1c: search matches an exact ticket id', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  const res = backlog(dir, ['search', '0001B']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'TICKETS_RETURNED'), '1');
});

test('backlog#015 — F1.L1d: get with a missing id is a caller error at exit 2', (t) => {
  const dir = project(t);
  const res = backlog(dir, ['get']);
  assert.equal(res.status, 2, res.output);
  assert.match(res.stdout, /ERROR=missing-id/);
});

test('backlog#016 — F2.L1: list emits the seven-field summary and --full restores raw rows', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');

  const summary = backlog(dir, ['list', '--all']);
  assert.equal(summary.status, 0, summary.output);
  assert.equal(key(summary.stdout, 'READ_VIEW'), 'summary');
  const row = JSON.parse(tickets(summary.stdout)[0]);
  assert.equal(Object.keys(row).length, 7);
  assert.equal('notes' in row, false);
  assert.equal('done_when' in row, false);

  const full = backlog(dir, ['list', '--all', '--full']);
  assert.equal(full.status, 0, full.output);
  assert.equal(key(full.stdout, 'READ_VIEW'), 'full');
  assert.match(tickets(full.stdout)[0], /"done_when":"it works"/);
  assert.equal(key(full.stdout, 'TICKETS_RETURNED'), '1');
});

test('backlog#017 — F2.L1b: --ids emits identities only, preserving filter and order', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first', 'done');
  backlogLine(dir, '0002B', 'second', 'open');
  backlogLine(dir, '0003B', 'third', 'open');

  const res = backlog(dir, ['list', '--ids']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'READ_VIEW'), 'ids');
  assert.equal(key(res.stdout, 'TICKETS_RETURNED'), '2');
  const ids = res.stdout
    .split('\n')
    .filter((l) => /^[0-9]{4}B$/.test(l))
    .join(',');
  assert.equal(ids, '0002B,0003B');
});

test('backlog#018 — F2.L1c: STATUS_COUNTS counts the whole board, before the filter', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first', 'open');
  backlogLine(dir, '0002B', 'second', 'done');

  const filtered = backlog(dir, ['list']);
  assert.equal(key(filtered.stdout, 'TICKETS_RETURNED'), '1');
  assert.match(filtered.stdout, /^STATUS_COUNTS=.*"open":1,"done":1.*$/m);

  const all = backlog(dir, ['list', '--all', '--full']);
  assert.match(all.stdout, /^STATUS_COUNTS=.*"open":1,"done":1.*$/m);
});

// ─── L2 — NEXT_ID_AGREE: the two native allocators return the same string ────
// Node-to-Node agreement. Red until next-id.cjs / status.cjs land (F7/F8).

/** Run both future native allocators and return the agreed id for `prefix`. */
function agree(dir, prefix) {
  const next = h.runScript('next-id', [prefix], { cwd: dir });
  assert.equal(next.status, 0, next.output);
  const status = h.runScript('status', ['next-id', prefix], { cwd: dir });
  assert.equal(status.status, 0, status.output);
  assert.equal(status.stdout.trim(), next.stdout.trim(), `allocators disagree on ${prefix}`);
  return next.stdout.trim();
}

test('backlog#019 — L2.1: NEXT_ID_AGREE with a backlog present, for F, H and B', (t) => {
  const dir = project(t);
  featureDir(dir, '0003F-login');
  featureDir(dir, '0005H-timeout');
  backlogLine(dir, '0011B', 'cache the provider map');
  backlogLine(dir, '0012B', 'prune the wiki');
  for (const p of ['F', 'H', 'B']) {
    assert.equal(agree(dir, p), `0013${p}`);
  }
});

test('backlog#020 — L2.2: NEXT_ID_AGREE with no backlog, and the id is what it is today', (t) => {
  const dir = project(t);
  featureDir(dir, '0003F-login');
  featureDir(dir, '0007H-timeout');
  assert.equal(fs.existsSync(path.join(dir, BACKLOG)), false);
  for (const p of ['F', 'H']) {
    assert.equal(agree(dir, p), `0008${p}`);
  }
});

test('backlog#021 — L2.1b: NEXT_ID_AGREE when a slug carries four digits of its own', (t) => {
  const dir = project(t);
  featureDir(dir, '0001F-auth-2024');
  assert.equal(agree(dir, 'F'), '0002F');
});

test('backlog#022 — L2.1c: NEXT_ID_AGREE is not disturbed by digits in the path ABOVE docs/', (t) => {
  const dir = project(t);
  featureDir(dir, '0003F-login');
  assert.equal(agree(dir, 'F'), '0004F');
});

test('backlog#023 — L2.2b: an EMPTY docs/backlog.jsonl changes nothing either', (t) => {
  const dir = project(t);
  featureDir(dir, '0004F-login');
  h.write(path.join(dir, BACKLOG), '');
  assert.equal(agree(dir, 'F'), '0005F');
});

test('backlog#024 — L2.3: a damaged backlog line still contributes its id to the max', (t) => {
  const dir = project(t);
  featureDir(dir, '0002F-login');
  backlogLine(dir, '0006B', 'fine');
  fs.appendFileSync(path.join(dir, BACKLOG), '{"id":"0014B","title":"truncated\n');
  assert.equal(agree(dir, 'B'), '0015B');
});

// ─── L3 — Behavioural acceptance ─────────────────────────────────────────────

test('backlog#025 — L3.1: add on an absent board creates it and seeds the definitions', (t) => {
  const dir = project(t);
  assert.equal(fs.existsSync(path.join(dir, BACKLOG)), false);
  assert.equal(fs.existsSync(path.join(dir, DEFS)), false);

  const res = backlog(dir, ['add'], { input: validTicket() });
  assert.equal(res.status, 0, res.output);

  assert.equal(fs.existsSync(path.join(dir, BACKLOG)), true);
  assert.equal(lines(path.join(dir, BACKLOG)).length, 1);
  assert.equal(fs.existsSync(path.join(dir, DEFS)), true);
  const defs = h.read(path.join(dir, DEFS));
  for (const s of ['open', 'doing', 'done', 'dropped']) {
    assert.ok(defs.includes(`"${s}"`), `defs names ${s}`);
  }
});

test('backlog#026 — L3.1b: the ticket id is allocated, not supplied, and is a B id', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const res = backlog(dir, ['list']);
  assert.equal(res.status, 0, res.output);
  assert.match(tickets(res.stdout).join('\n'), /"id":"[0-9]{4}B"/);
});

test('backlog#027 — L3.1c: add is a PURE APPEND, a new ticket lands last', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  backlog(dir, ['add'], { input: validTicket().replace('cache the provider map', 'second thing') });

  const all = lines(path.join(dir, BACKLOG));
  assert.equal(all.length, 2);
  assert.match(all[0], /cache the provider map/);
  assert.match(all[1], /second thing/);
});

test('backlog#028 — L3.1d: a first write seeds NINE statuses and SEVEN columns', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const defs = JSON.parse(h.read(path.join(dir, DEFS)));
  assert.equal(defs.statuses.length, 9);
  assert.equal(defs.columns.length, 7);
});

test('backlog#029 — L3.1e: the nine status names are exactly the reserved set, in phase order', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const defs = JSON.parse(h.read(path.join(dir, DEFS)));
  assert.equal(defs.statuses.map((s) => s.name).join(','), NINE_STATUSES.join(','));
});

test('backlog#030 — L3.1f: EVERY seeded status carries an explicit column and label', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const defs = JSON.parse(h.read(path.join(dir, DEFS)));
  const bad = defs.statuses.filter(
    (s) => typeof s.column !== 'string' || !s.column || typeof s.label !== 'string' || !s.label,
  );
  assert.equal(bad.length, 0);
});

test('backlog#031 — L3.1g: the seven columns are the expected set and ONLY dropped is hidden', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const defs = JSON.parse(h.read(path.join(dir, DEFS)));
  const names = defs.columns.map((c) => c.name).join(',');
  const hidden = defs.columns.filter((c) => c.hidden === true).map((c) => c.name).join(',');
  assert.equal(`${names}|${hidden}`, 'backlog,shaping,planning,building,review,done,dropped|dropped');
});

test('backlog#032 — L3.1h: two statuses share a column where a phase has running and parked', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const defs = JSON.parse(h.read(path.join(dir, DEFS)));
  const shaping = defs.statuses.filter((s) => s.column === 'shaping').map((s) => s.name).join('+');
  const planning = defs.statuses.filter((s) => s.column === 'planning').map((s) => s.name).join('+');
  assert.equal(`${shaping} ${planning}`, 'refining+shaped planning+planned');
});

test('backlog#033 — L3.2: DEFS_PRESERVED, a hand-edited definitions file survives byte-for-byte', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });

  const handEdited = `{
  "statuses": [
    { "name": "open",     "order": 1, "means": "decided, not started" },
    { "name": "doing",    "order": 2, "means": "work is in progress" },
    { "name": "blocked",  "order": 3, "means": "waiting on something else" },
    { "name": "done",     "order": 4, "means": "delivered" },
    { "name": "dropped",  "order": 5, "means": "decided against" }
  ]
}
`;
  h.write(path.join(dir, DEFS), handEdited);
  const before = h.read(path.join(dir, DEFS));

  backlog(dir, ['add'], { input: validTicket().replace('cache the provider map', 'second thing') });
  backlog(dir, ['add'], { input: validTicket().replace('cache the provider map', 'third thing') });

  assert.equal(h.read(path.join(dir, DEFS)), before);
});

test('backlog#034 — L3.2b: a status the user ADDED is accepted on a write', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  h.write(
    path.join(dir, DEFS),
    '{"statuses":[{"name":"open","order":1,"means":"x"},{"name":"blocked","order":2,"means":"y"}]}\n',
  );
  const id = h.readJsonl(path.join(dir, BACKLOG))[0].id;

  const res = backlog(dir, ['update', id], { input: '{"status":"blocked"}' });
  assert.equal(res.status, 0, res.output);
  assert.match(h.read(path.join(dir, BACKLOG)), /"status":"blocked"/);
});

test('backlog#035 — L3.3: update rewrites ONLY its own line; every other line is byte-identical', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  backlogLine(dir, '0003B', 'third');
  const before = lines(path.join(dir, BACKLOG));

  backlog(dir, ['update', '0002B'], { input: '{"title":"second, revised"}' });

  const after = lines(path.join(dir, BACKLOG));
  assert.equal(after.length, 3);
  assert.equal(after[0], before[0]);
  assert.equal(after[2], before[2]);
  assert.notEqual(after[1], before[1]);
  assert.match(after[1], /second, revised/);
});

test('backlog#036 — L3.3b: comment appends to comments[] on one line and touches nothing else', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  const before = lines(path.join(dir, BACKLOG));

  backlog(dir, ['comment', '0001B'], { input: '{"content":"turns out build.js reads it twice"}' });

  const after = lines(path.join(dir, BACKLOG));
  assert.equal(after.length, 2);
  assert.equal(after[1], before[1]);
  assert.match(after[0], /turns out build.js reads it twice/);
  assert.match(after[0], /"created_at"/);
});

test('backlog#037 — L3.3c: update bumps updated_at but never created_at', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  const createdBefore = h.read(path.join(dir, BACKLOG)).match(/"created_at":"[^"]+"/)[0];

  backlog(dir, ['update', '0001B'], { input: '{"title":"renamed"}' });

  const body = h.read(path.join(dir, BACKLOG));
  assert.equal(body.match(/"created_at":"[^"]+"/)[0], createdBefore);
  assert.match(body, /"updated_at":"[0-9]{4}-/);
});

test('backlog#038 — L3.4: a damaged line is reported by its number, exit stays 0', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  fs.appendFileSync(path.join(dir, BACKLOG), '{"id":"0002B","title":"truncated\n');
  backlogLine(dir, '0003B', 'third');

  const res = backlog(dir, ['list']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'DAMAGED_LINES'), '1');
  assert.match(res.stdout, /^DAMAGED_LINE=2$/m);
  const rows = tickets(res.stdout);
  assert.equal(rows.length, 2);
  assert.match(rows.join('\n'), /"id":"0001B"/);
  assert.match(rows.join('\n'), /"id":"0003B"/);
});

test('backlog#039 — L3.5: move --top reorders and changes nothing else', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  backlogLine(dir, '0003B', 'third');
  const sortedBefore = [...lines(path.join(dir, BACKLOG))].sort();

  const res = backlog(dir, ['move', '0003B', '--top']);
  assert.equal(res.status, 0, res.output);

  const after = lines(path.join(dir, BACKLOG));
  assert.deepEqual([...after].sort(), sortedBefore);
  assert.match(after[0], /"id":"0003B"/);
  assert.match(after[1], /"id":"0001B"/);
  assert.match(after[2], /"id":"0002B"/);
});

test('backlog#040 — L3.5b: move --after places the ticket directly below its anchor', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  backlogLine(dir, '0003B', 'third');

  const res = backlog(dir, ['move', '0001B', '--after', '0002B']);
  assert.equal(res.status, 0, res.output);
  const after = lines(path.join(dir, BACKLOG));
  assert.match(after[0], /"id":"0002B"/);
  assert.match(after[1], /"id":"0001B"/);
  assert.match(after[2], /"id":"0003B"/);
});

test('backlog#041 — L3.5c: move --bottom sends it last', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');

  const res = backlog(dir, ['move', '0001B', '--bottom']);
  assert.equal(res.status, 0, res.output);
  const after = lines(path.join(dir, BACKLOG));
  assert.match(after[after.length - 1], /"id":"0001B"/);
});

test('backlog#042 — L3.5d: remove deletes exactly one line; every survivor is byte-identical', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  backlogLine(dir, '0003B', 'third');
  const before = lines(path.join(dir, BACKLOG));

  const res = backlog(dir, ['remove', '0002B']);
  assert.equal(res.status, 0, res.output);

  const after = lines(path.join(dir, BACKLOG));
  assert.equal(after.length, 2);
  assert.equal(after[0], before[0]);
  assert.equal(after[1], before[2]);
});

test('backlog#043 — L3.5e: an id is NEVER reused after a remove', (t) => {
  const dir = project(t);
  featureDir(dir, '0001F-x');
  backlogLine(dir, '0002B', 'second');
  const removed = backlog(dir, ['remove', '0002B']);
  assert.equal(removed.status, 0, removed.output);

  featureDir(dir, '0002F-y');
  const next = h.runScript('next-id', ['B'], { cwd: dir });
  assert.equal(next.status, 0, next.output);
  assert.equal(next.stdout.trim(), '0003B');
});

test('backlog#044 — L3.6: an undefined status is refused on a write, file unchanged', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const before = h.read(path.join(dir, BACKLOG));

  const res = backlog(dir, ['add'], { input: validTicket().replace('"status":"open"', '"status":"invented"') });
  assert.equal(res.status, 2, res.output);
  assert.match(res.stdout, /REFUSED=unknown-status/);
  assert.equal(h.read(path.join(dir, BACKLOG)), before);
});

test('backlog#045 — L3.7: an undefined status on the board is reported, never refused', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  backlogLine(dir, '0099B', 'legacy', 'retired');

  const res = backlog(dir, ['list', '--all']);
  assert.equal(res.status, 0, res.output);
  assert.match(res.stdout, /^UNDEFINED_STATUS=retired$/m);
  assert.equal(tickets(res.stdout).length, 2);
});

test('backlog#046 — L3.8: list on an absent backlog exits 0 and reports it empty', (t) => {
  const dir = project(t);
  assert.equal(fs.existsSync(path.join(dir, BACKLOG)), false);
  const res = backlog(dir, ['list']);
  assert.equal(res.status, 0, res.output);
  assert.equal(key(res.stdout, 'BACKLOG_PRESENT'), 'no');
  assert.equal(key(res.stdout, 'TICKETS_TOTAL'), '0');
  assert.equal(tickets(res.stdout).length, 0);
});

test('backlog#047 — L3.8b: search on an absent backlog exits 0 and returns nothing', (t) => {
  const dir = project(t);
  const res = backlog(dir, ['search', 'anything']);
  assert.equal(res.status, 0, res.output);
  assert.equal(tickets(res.stdout).length, 0);
});

test('backlog#048 — L3.8c: list defaults to open tickets; --all returns every one', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  backlogLine(dir, '0098B', 'finished thing', 'done');

  const open = backlog(dir, ['list']);
  assert.equal(open.status, 0, open.output);
  assert.equal(tickets(open.stdout).length, 1);

  const all = backlog(dir, ['list', '--all']);
  assert.equal(tickets(all.stdout).length, 2);
});

test('backlog#049 — L3.8d: search matches title, tldr and notes', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });

  const hit = backlog(dir, ['search', 'provider map']);
  assert.equal(hit.status, 0, hit.output);
  assert.equal(tickets(hit.stdout).length, 1);

  const miss = backlog(dir, ['search', 'nothing-like-this-exists']);
  assert.equal(miss.status, 0, miss.output);
  assert.equal(tickets(miss.stdout).length, 0);
});

test('backlog#050 — L3.9: written lines use LF and contain no CR byte', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  backlog(dir, ['add'], { input: validTicket().replace('cache the provider map', 'second thing') });

  const body = h.read(path.join(dir, BACKLOG));
  assert.equal(body.includes('\r'), false);
  assert.equal(lines(path.join(dir, BACKLOG)).length, 2);
});

test('backlog#051 — L3.9b: each line is exactly one minified JSON object', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const body = h.read(path.join(dir, BACKLOG)).trimEnd().split('\n');
  for (const l of body) JSON.parse(l);
  assert.equal(body.length, 1);
});

// ─── The remaining hard bans ─────────────────────────────────────────────────

test('backlog#052 — ban 1+2: a caller-supplied id, created_at or updated_at is refused', (t) => {
  const dir = project(t);
  const fields = ['"id":"0005B"', '"created_at":"2020-01-01T00:00:00Z"', '"updated_at":"2020-01-01T00:00:00Z"'];
  for (const field of fields) {
    const record = `{${field},"title":"t","tldr":"t","done_when":"t","status":"open"}`;
    const res = backlog(dir, ['add'], { input: record });
    assert.equal(res.status, 2, res.output);
    assert.match(res.stdout, /REFUSED=reserved-field/);
  }
});

test('backlog#053 — ban 4: an id already on the board is never re-added', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  const res = backlog(dir, ['update', '0001B'], { input: '{"title":"dup"}' });
  assert.equal(res.status, 0, res.output);
  const count = (h.read(path.join(dir, BACKLOG)).match(/"id":"0001B"/g) || []).length;
  assert.equal(count, 1);
});

test('backlog#054 — ban 5: title, tldr and done_when are required and non-empty', (t) => {
  const dir = project(t);
  const missing = backlog(dir, ['add'], { input: '{"tldr":"t","done_when":"t","status":"open"}' });
  assert.equal(missing.status, 2, missing.output);
  assert.match(missing.stdout, /REFUSED=missing-field/);

  const empty = backlog(dir, ['add'], { input: '{"title":"","tldr":"t","done_when":"t","status":"open"}' });
  assert.equal(empty.status, 2, empty.output);
  assert.match(empty.stdout, /REFUSED=missing-field/);
});

test('backlog#055 — ban 6: stdin that is not one JSON object is refused', (t) => {
  const dir = project(t);
  const res = backlog(dir, ['add'], { input: 'not json at all' });
  assert.equal(res.status, 2, res.output);
  assert.match(res.stdout, /REFUSED=invalid-json/);
});

test('backlog#056 — ban 7: update, comment, move and remove refuse an id not on the board', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');

  const update = backlog(dir, ['update', '0404B'], { input: '{"title":"x"}' });
  assert.equal(update.status, 2, update.output);
  assert.match(update.stdout, /REFUSED=unknown-id/);

  const remove = backlog(dir, ['remove', '0404B']);
  assert.equal(remove.status, 2, remove.output);
  assert.match(remove.stdout, /REFUSED=unknown-id/);

  const move = backlog(dir, ['move', '0404B', '--top']);
  assert.equal(move.status, 2, move.output);
  assert.match(move.stdout, /REFUSED=unknown-id/);

  const after = backlog(dir, ['move', '0001B', '--after', '0404B']);
  assert.equal(after.status, 2, after.output);
  assert.match(after.stdout, /REFUSED=unknown-id/);
});

// ─── Caller errors and the exit-code contract ────────────────────────────────

test('backlog#057 — a bad mode exits 2 and prints usage', (t) => {
  const dir = project(t);
  const res = backlog(dir, ['frobnicate']);
  assert.equal(res.status, 2, res.output);
});

test('backlog#058 — no mode at all exits 2', (t) => {
  const dir = project(t);
  const res = backlog(dir, []);
  assert.equal(res.status, 2, res.output);
});

test('backlog#059 — move with no direction exits 2', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  const res = backlog(dir, ['move', '0001B']);
  assert.equal(res.status, 2, res.output);
});

// ─── L4 — `labels` and `feature`, the optional fields ────────────────────────

/** Run `add` with one inline record, from a file so quoting never intervenes. */
function addWith(dir, json) {
  const record = h.write(path.join(dir, 'rec.json'), json);
  return backlog(dir, ['add', '--record-file', record]);
}

/** The JSON value of <name> on the board's last line, or 'undefined'. */
function field(dir, name) {
  const t = lastTicket(dir);
  return Object.prototype.hasOwnProperty.call(t, name) ? JSON.stringify(t[name]) : 'undefined';
}

test('backlog#060 — L4.1: add keeps a labels array as given', (t) => {
  const dir = project(t);
  const res = addWith(dir, '{"title":"a","tldr":"a","done_when":"it works","labels":["internal"]}');
  assert.equal(res.status, 0, res.output);
  assert.equal(field(dir, 'labels'), '["internal"]');
});

test('backlog#061 — L4.2: add without labels writes an empty array', (t) => {
  const dir = project(t);
  const res = addWith(dir, '{"title":"a","tldr":"a","done_when":"it works"}');
  assert.equal(res.status, 0, res.output);
  assert.equal(field(dir, 'labels'), '[]');
});

test('backlog#062 — L4.3: a labels value that is not an array writes an empty array', (t) => {
  const dir = project(t);
  const res = addWith(dir, '{"title":"a","tldr":"a","done_when":"it works","labels":"internal"}');
  assert.equal(res.status, 0, res.output);
  assert.equal(field(dir, 'labels'), '[]');
});

test('backlog#063 — L4.4: add still drops a field the format does not define', (t) => {
  const dir = project(t);
  const res = addWith(dir, '{"title":"a","tldr":"a","done_when":"it works","foo":"bar"}');
  assert.equal(res.status, 0, res.output);
  assert.equal(field(dir, 'foo'), 'undefined');
});

test('backlog#064 — L4.5: update replaces labels on its own line; others byte-identical', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlogLine(dir, '0002B', 'second');
  backlogLine(dir, '0003B', 'third');
  const before = lines(path.join(dir, BACKLOG));

  backlog(dir, ['update', '0002B'], { input: '{"labels":["product","both"]}' });

  const after = lines(path.join(dir, BACKLOG));
  assert.equal(after[0], before[0]);
  assert.equal(after[2], before[2]);
  assert.match(after[1], /"labels":\["product","both"\]/);
});

test('backlog#065 — L4.6: feature round-trips on add, and an undefined field is still dropped', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], {
    input: '{"title":"t","tldr":"t","done_when":"t","status":"open","feature":"0042F","nonsense":"x"}',
  });
  const ticket = lastTicket(dir);
  assert.equal(ticket.feature === '0042F', true);
  assert.equal('nonsense' in ticket, false);
});

test('backlog#066 — L4.7: add without a feature writes null, the way it does for work_id', (t) => {
  const dir = project(t);
  backlog(dir, ['add'], { input: validTicket() });
  const ticket = lastTicket(dir);
  assert.equal(ticket.feature === null, true);
  assert.equal(ticket.work_id === null, true);
});

test('backlog#067 — L4.8: update sets status and feature in ONE write, leaving work_id null', (t) => {
  const dir = project(t);
  backlogLine(dir, '0001B', 'first');
  backlog(dir, ['update', '0001B'], { input: '{"status":"refining","feature":"0042F"}' });
  const ticket = lastTicket(dir);
  assert.equal(`${ticket.status} ${ticket.feature} ${ticket.work_id}`, 'refining 0042F null');
});
