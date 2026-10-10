/**
 * backlog-cli.test.js — CLI tests for the Node local adapter (L2).
 *
 * Covers the entry-layer matrix over disposable roots: the seven modes'
 * positional grammar and exit codes, native allocation when BACKLOG_NEW_ID
 * is absent, the legacy allocation path when the metadata is supplied, the
 * `--record-file` channel (authoritative over stdin, read in the caller's
 * cwd, never hanging on an open pipe), caller errors for missing/repeated
 * options, option-looking target IDs and search text keeping their literal
 * meaning, unreadable records, the full-board exhaustion refusal, and the
 * no-shell/no-Bash proofs. Core behavior itself (refusal precedence,
 * damaged rows, timestamps, formatting) belongs to backlog-core.test.js.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
const CLI_PATH = path.join(SCRIPTS, 'backlog-cli.cjs');

// The shipped backlog modules that are LOCAL-ONLY: allocation, core and
// storage runs with Node built-ins alone and must carry no process start in
// their bytes. The publication pair (backlog-git.cjs, backlog-commit.cjs) is
// the deliberate exception — native git through argument arrays IS its
// contract, asserted in backlog-publication.test.js.
const SHIPPED_MODULES = [
  'backlog-storage.cjs', 'backlog-core.cjs', 'backlog-cli.cjs', 'backlog-id.cjs',
];

const COMMIT_PATH = path.join(SCRIPTS, 'backlog-commit.cjs');
const WRITE_MODES = new Set(['add', 'update', 'comment', 'move', 'remove']);

// The CLI only reads; every write goes through the one publication entry. Each
// test root is BOTH the code repository and the board clone: it is git-inited
// on first use and CODEADD_BOARD_DIR points at it, so no remote is involved and
// every sync reports SYNC=degraded. The route itself is covered in
// backlog-publication.test.js.
const entryOf = (args) => (WRITE_MODES.has(args[0]) ? COMMIT_PATH : CLI_PATH);

const asBoard = (opts = {}) => {
  const cwd = opts.cwd;
  if (cwd && !fs.existsSync(path.join(cwd, '.git'))) {
    execFileSync('git', ['init', '-q'], { cwd });
  }
  return { ...opts, env: { ...(opts.env || process.env), CODEADD_BOARD_DIR: cwd } };
};

const run = (args, opts = {}) =>
  execFileSync(process.execPath, [entryOf(args), ...args], { encoding: 'utf8', ...asBoard(opts) });

const fail = (args, opts = {}) => {
  try {
    run(args, opts);
    return { status: 0, stdout: '' };
  } catch (e) {
    return { status: e.status, stdout: e.stdout, stderr: e.stderr };
  }
};

const seeded = (root, ids) => {
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  const rows = (Array.isArray(ids) ? ids : [ids])
    .map((id) => JSON.stringify({
      id, title: `t-${id}`, theme: '', labels: [], tldr: 't', notes: [], done_when: 't',
      paths: [], grounded: false, status: 'open',
      created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
      comments: [], feature: null, work_id: null,
    }));
  fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), rows.join('\n') + '\n');
};

const RECORD = JSON.stringify({ title: 'capture the thing', tldr: 'tl', done_when: 'when' });
const OTHER_TITLE = 'the stdin title that must not win';

describe('backlog-cli — the exit-code contract (unchanged)', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('exits 2 on bad mode', () => {
    const r = fail(['bogus'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=bad-mode');
  });

  it('exits 2 on missing id for update', () => {
    const r = fail(['update'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=missing-id');
  });

  it('exits 0 on list and returns KEY=VALUE format', () => {
    const result = run(['list'], { cwd: root });
    expect(result).toContain('BACKLOG_PRESENT=');
    expect(result).toContain('TICKETS_TOTAL=');
    expect(result).toContain('TICKETS_RETURNED=');
  });

  it('exits 2 on unknown-id refusal', () => {
    const r = fail(['update', '0000B'], { input: JSON.stringify({ title: 'Nope' }), cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('REFUSED=unknown-id');
  });

  it('a plain directory with no board config reads as no board, and never opens its docs', () => {
    seeded(root, '0001B');
    expect(fs.existsSync(path.join(root, '.git'))).toBe(false);
    const result = execFileSync(process.execPath, [CLI_PATH, 'list', '--all'], {
      encoding: 'utf8', cwd: root, env: { ...process.env, CODEADD_BOARD_DIR: '' },
    });
    expect(result).toContain('BACKLOG_PRESENT=no');
    expect(result).toContain('TICKETS_TOTAL=0');
  });
});

describe('backlog-cli — allocation: legacy metadata, native, exhaustion', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('allocates natively on an absent board with no metadata supplied', () => {
    const result = run(['add'], { input: RECORD, cwd: root });
    expect(result).toContain('TICKET_ID=0001B');
    expect(fs.existsSync(path.join(root, 'docs', 'backlog.jsonl'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs', 'backlog.definitions.json'))).toBe(true);
  });

  it('allocates past the board max natively — the metadata path is not required', () => {
    seeded(root, '0007B');
    const result = run(['add'], { input: RECORD, cwd: root });
    expect(result).toContain('TICKET_ID=0008B');
  });

  it('keeps the legacy path: valid BACKLOG_NEW_ID metadata is used as-is', () => {
    const env = { ...process.env, BACKLOG_NEW_ID: '0041B' };
    const result = run(['add'], { input: RECORD, env, cwd: root });
    expect(result).toContain('TICKET_ID=0041B');
  });

  it('explicitly-supplied EMPTY metadata fails with the current allocation error', () => {
    const env = { ...process.env, BACKLOG_NEW_ID: '' };
    const r = fail(['add'], { input: RECORD, env, cwd: root });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('ERROR=id-allocation-failed');
  });

  it('explicitly-supplied MALFORMED metadata fails with the current allocation error', () => {
    const env = { ...process.env, BACKLOG_NEW_ID: '0041F' };
    const r = fail(['add'], { input: RECORD, env, cwd: root });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('ERROR=id-allocation-failed');
  });

  it('a full board refuses with the allocation error and never emits a five-digit id', () => {
    seeded(root, '9999B');
    const r = fail(['add'], { input: RECORD, cwd: root });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('ERROR=id-allocation-failed');
    expect(run(['list', '--all'], { cwd: root })).not.toMatch(/"id":"[0-9]{5}/);
  });

  it('allocation exhaustion has the same result through stdin and record-file', () => {
    seeded(root, '9999B');
    const rec = path.join(root, 'rec.json');
    fs.writeFileSync(rec, RECORD);
    const { status, stdout } = fail(['add'], { cwd: root, input: RECORD });
    const native = fail(['add', '--record-file', 'rec.json'], { cwd: root });
    expect(native.status).toBe(status);
    expect(status).toBe(1);
    expect(stdout).toContain('ERROR=id-allocation-failed');
    expect(native.stdout).toContain('ERROR=id-allocation-failed');
  });
});

describe('backlog-cli — the record-file channel', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  const readFileRecord = (body, name = 'ticket.json') => {
    fs.writeFileSync(path.join(root, name), body);
    return name;
  };
  const fileRecord = () => JSON.stringify({
    title: 'the file title, which wins', tldr: 'from file', done_when: 'when',
  });
  const stdinRecord = () => JSON.stringify({
    title: OTHER_TITLE, tldr: 'from stdin', done_when: 'when',
  });
  const lastTitle = (root) => {
    const lines = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8').trim().split('\n');
    return JSON.parse(lines[lines.length - 1]).title;
  };

  it('add via file: the file is read and stdin is never consumed — closed stdin still writes', () => {
    const name = readFileRecord(fileRecord());
    const result = run(['add', '--record-file', name], { cwd: root, input: '' });
    expect(result).toContain('TICKET_ID=0001B');
    expect(lastTitle(root)).toBe('the file title, which wins');
  });

  it('add via file: a NONEMPTY stdin loses to the file', () => {
    const name = readFileRecord(fileRecord());
    const result = run(['add', '--record-file', name], { cwd: root, input: stdinRecord() });
    expect(result).toContain('TICKET_ID=0001B');
    expect(lastTitle(root)).toBe('the file title, which wins');
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8'))
      .not.toContain(OTHER_TITLE);
  });

  it('update via file rewrites only its own line; every other line is byte-identical', () => {
    seeded(root, ['0001B', '0002B', '0003B']);
    const board = path.join(root, 'docs', 'backlog.jsonl');
    const before = fs.readFileSync(board, 'utf8').trim().split('\n');
    const patch = path.join(root, 'patch.json');
    fs.writeFileSync(patch, JSON.stringify({ title: 'second, revised' }));

    const result = run(['update', '0002B', '--record-file', 'patch.json'], { cwd: root, input: '' });
    expect(result).toContain('TICKET_ID=0002B');

    const after = fs.readFileSync(board, 'utf8').trim().split('\n');
    expect(after).toHaveLength(3);
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(after[1]).not.toBe(before[1]);
    expect(JSON.parse(after[1]).title).toBe('second, revised');
  });

  it('titles with spaces and Unicode round-trip through the file unchanged', () => {
    const title = 'caché — provider map ✨ three words';
    const name = readFileRecord(JSON.stringify({ title, tldr: 'tl', done_when: 'when' }), 'ré.sumé.json');
    const result = run(['add', '--record-file', name], { cwd: root, input: '' });
    expect(result).toContain('TICKET_ID=0001B');
    expect(lastTitle(root)).toBe(title);
    const listed = run(['search', 'caché'], { cwd: root });
    expect(listed).toContain('TICKETS_RETURNED=1');
  });

  it('a relative record path resolves against the caller cwd, not the module location', () => {
    fs.mkdirSync(path.join(root, 'deep', 'deeper'), { recursive: true });
    fs.writeFileSync(path.join(root, 'deep', 'deeper', 'ticket.json'), fileRecord());
    const result = run(['add', '--record-file', 'deep/deeper/ticket.json'], { cwd: root, input: '' });
    expect(result).toContain('TICKET_ID=0001B');
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(true);
  });

  it('an option-looking update target keeps its literal meaning', () => {
    seeded(root, '0001B');
    const r = fail(['update', '--failure'], { input: JSON.stringify({ title: 'x' }), cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('REFUSED=unknown-id');
  });

  it('an option-looking search text keeps its literal meaning', () => {
    seeded(root, '0001B');
    const result = run(['search', '--term'], { cwd: root });
    expect(result).toContain('TICKETS_RETURNED=0');
    expect(result).not.toContain('ERROR=missing-query');
  });

  it('the record-file spelling in the target position stays a literal ID', () => {
    seeded(root, '0001B');
    const a = readFileRecord(fileRecord(), 'literal.json');
    const r = fail(['update', '--record-file', '--record-file', a], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('REFUSED=unknown-id');
  });

  it('a record-file pair must be trailing after the target', () => {
    seeded(root, '0001B');
    const a = readFileRecord(fileRecord(), 'nontrailing.json');
    const r = fail(['update', '0001B', '--record-file', a, '--surplus'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=bad-argument');
  });

  it('a repeated --record-file is a caller error', () => {
    seeded(root, '0001B');
    const a = readFileRecord(fileRecord(), 'a.json');
    readFileRecord(stdinRecord(), 'b.json');
    const r = fail(['update', '0001B', '--record-file', a, '--record-file', 'b.json'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=bad-argument');
  });

  it('a --record-file with a missing value is a caller error', () => {
    seeded(root, '0001B');
    const r = fail(['update', '0001B', '--record-file'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=bad-argument');
  });

  it('in a record mode a surplus unknown option is ignored, as the grammar always did', () => {
    seeded(root, '0001B');
    const a = readFileRecord(fileRecord(), 'a.json');
    const result = run(['update', '0001B', '--spectacular', '--record-file', a], { cwd: root });
    expect(result).toContain('TICKET_ID=0001B');
  });
});

describe('backlog-cli — unreadable records fail before allocation or persistence', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('a MISSING file exits 1 with ERROR=record-read-failed and creates no board', () => {
    const r = fail(['add', '--record-file', 'no-such-file.json'], { cwd: root });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('ERROR=record-read-failed');
    expect(r.stdout).not.toContain('TICKET_ID');
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(false);
  });

  it('a DIRECTORY at the record path fails the same way', () => {
    fs.mkdirSync(path.join(root, 'dir-as-record'));
    const r = fail(['add', '--record-file', 'dir-as-record'], { cwd: root });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('ERROR=record-read-failed');
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(false);
  });

  it('a failed record read burns no allocation — the next add starts at 0001B', () => {
    fail(['add', '--record-file', 'no-such-file.json'], { cwd: root });
    const result = run(['add'], { input: RECORD, cwd: root });
    expect(result).toContain('TICKET_ID=0001B');
  });
});

describe('backlog-cli — an open stdin pipe is never read by the paths that must not', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  /** Spawns the CLI with a stdin pipe that never sends a byte and never
   *  closes; fails if the child is still alive after the guard, which is
   *  what a stdin read would produce. */
  const mustExitWithoutStdin = (args, setupFiles) => new Promise((resolve, reject) => {
    if (setupFiles) setupFiles();
    const child = spawn(process.execPath, [entryOf(args), ...args], { ...asBoard({ cwd: root }), stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    const guard = setTimeout(() => {
      child.kill();
      reject(new Error(`still alive after 3000ms — it consumed stdin. args: ${args.join(' ')}`));
    }, 3000);
    child.on('exit', (code) => { clearTimeout(guard); resolve({ code, out }); });
  });

  it('a record-file add completes even though stdin stays open forever', async () => {
    const { code, out } = await mustExitWithoutStdin(
      ['add', '--record-file', 'ticket.json'],
      () => fs.writeFileSync(path.join(root, 'ticket.json'),
        JSON.stringify({ title: 'from file', tldr: 't', done_when: 'when' })),
    );
    expect(code).toBe(0);
    expect(out).toContain('TICKET_ID=0001B');
  });

  it('list never reads stdin, though stdin stays open forever', async () => {
    seeded(root, '0001B');
    const { code, out } = await mustExitWithoutStdin(['list', '--all']);
    expect(code).toBe(0);
    expect(out).toContain('TICKETS_TOTAL=1');
  });

  it('move never reads stdin, though stdin stays open forever', async () => {
    seeded(root, ['0001B', '0002B']);
    const { code } = await mustExitWithoutStdin(['move', '0002B', '--top']);
    expect(code).toBe(0);
  });
});

describe('backlog-cli — the get mode (F1)', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-get-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('get prints the full raw row: notes, paths and done_when included', () => {
    seeded(root, '0001B');
    const result = run(['get', '0001B'], { cwd: root });
    expect(result).toContain('TICKETS_RETURNED=1');
    expect(result).toContain('"notes":[]');
    expect(result).toContain('"done_when":"t"');
    expect(result).toContain('"paths":[]');
  });

  it('get with a missing id is ERROR=missing-id, exit 2', () => {
    const r = fail(['get'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=missing-id');
  });

  it('get of an unknown id is a successful read with zero results, exit 0', () => {
    seeded(root, '0001B');
    const before = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8');
    const result = run(['get', '0404B'], { cwd: root });
    expect(result).toContain('TICKETS_RETURNED=0');
    expect(result).not.toContain('REFUSED=');
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toBe(before);
  });

  it('get on an absent board is a successful read and creates nothing', () => {
    const result = run(['get', '0001B'], { cwd: root });
    expect(result).toContain('BACKLOG_PRESENT=no');
    expect(result).toContain('TICKETS_RETURNED=0');
    expect(fs.existsSync(path.join(root, 'docs'))).toBe(false);
  });

  it('get rejects surplus arguments with ERROR=bad-argument, exit 2', () => {
    seeded(root, '0001B');
    const r = fail(['get', '0001B', 'extra'], { cwd: root });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain('ERROR=bad-argument');
  });

  it('an option-looking get target keeps its literal meaning', () => {
    seeded(root, '0001B');
    const result = run(['get', '--record-file'], { cwd: root });
    expect(result).toContain('TICKETS_RETURNED=0');
    expect(result).not.toContain('ERROR=');
  });

  it('get never reads stdin, though stdin stays open forever', async () => {
    seeded(root, '0001B');
    let out = '';
    let settled = false;
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [CLI_PATH, 'get', '0001B'], { ...asBoard({ cwd: root }), stdio: ['pipe', 'pipe', 'pipe'] });
      child.stdout.on('data', (d) => { out += d.toString(); });
      const guard = setTimeout(() => { child.kill(); reject(new Error('still alive — it consumed stdin')); }, 3000);
      child.on('exit', (code) => { clearTimeout(guard); settled = true; resolve({ code, out }); });
    });
    expect(settled).toBe(true);
    expect(out).toContain('TICKETS_RETURNED=1');
  });

  it('get allocates nothing: the definitions file is never seeded by a read', () => {
    seeded(root, '0001B');
    run(['get', '0001B'], { cwd: root });
    expect(fs.existsSync(path.join(root, 'docs', 'backlog.definitions.json'))).toBe(false);
  });
});

describe('backlog-cli — summary projection and the read flag grammar (F2)', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-f2-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  const writeBoard = (lines) => {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), lines.join('\n') + '\n');
  };
  const fullRow = (id, over = {}) => JSON.stringify({
    id,
    title: `t-${id}`,
    theme: '',
    labels: [],
    tldr: `tldr-${id}`,
    notes: ['note body', 'another'],
    done_when: 'when',
    paths: ['src/a.js'],
    grounded: false,
    status: 'open',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-10-01T12:34:56Z',
    comments: [{ content: 'commented' }],
    feature: '0042F',
    work_id: 'PLAN-1',
    ...over,
  });
  const payloadRows = (out) => out.split('\n').filter((l) => l.startsWith('{'));

  it('list emits the seven-field summary as its default, keys in the confirmed order', () => {
    writeBoard([fullRow('0001B')]);
    const out = run(['list', '--all'], { cwd: root });
    const rows = payloadRows(out);
    expect(rows).toHaveLength(1);
    const parsed = JSON.parse(rows[0]);
    expect(Object.keys(parsed)).toEqual(['id', 'status', 'title', 'tldr', 'theme', 'labels', 'updated_at']);
  });

  it('the summary carries no body fields and the nothing is persisted', () => {
    writeBoard([fullRow('0001B')]);
    const before = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8');
    const out = run(['list', '--all'], { cwd: root });
    expect(out).not.toContain('"notes"');
    expect(out).not.toContain('"done_when"');
    expect(out).not.toContain('"paths"');
    expect(out).not.toContain('"work_id"');
    expect(out).not.toContain('"created_at"');
    expect(out).toContain('"updated_at":"2026-10-01"');
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toBe(before);
  });

  it('--full returns the raw rows byte-equivalent to the file lines, with READ_VIEW=full', () => {
    writeBoard([fullRow('0001B'), fullRow('0002B', { status: 'done' })]);
    const fileLines = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8').trim().split('\n');
    const out = run(['list', '--all', '--full'], { cwd: root });
    expect(out).toContain('READ_VIEW=full');
    expect(payloadRows(out)).toEqual(fileLines);
  });

  it('--ids emits one id per line after the metadata, in board order, with READ_VIEW=ids', () => {
    writeBoard([fullRow('0001B', { status: 'done' }), fullRow('0002B')]);
    const out = run(['list', '--ids'], { cwd: root });
    // default open filter: 0002B only
    expect(out).toContain('READ_VIEW=ids');
    const payload = out.split('\n').filter((l) => l && !l.includes('=') && !l.startsWith('{'));
    expect(payload).toEqual(['0002B']);
  });

  it('the tldr preview cuts at 120 code points including the ellipsis, never a surrogate pair', () => {
    const long = 'x'.repeat(119) + '😀' + 'y'.repeat(40); // 119 + 1 + 40 = 160 code points
    writeBoard([fullRow('0001B', { tldr: long })]);
    const out = run(['list', '--all'], { cwd: root });
    const tldr = JSON.parse(payloadRows(out)[0]).tldr;
    const cps = [...tldr];
    expect(cps.length).toBeLessThanOrEqual(120);
    expect(tldr).not.toContain('y'.repeat(10));
    expect(cps[119]).toBe('…');
  });

  it('a 120-code-point tldr is not truncated; 121 is; search still matches beyond the cut', () => {
    const at120 = 'x'.repeat(120);
    const at121 = 'x'.repeat(121);
    const beyond = 's'.repeat(125) + 'marker';
    writeBoard([
      fullRow('0001B', { tldr: at120 }),
      fullRow('0002B', { tldr: at121 }),
      fullRow('0003B', { tldr: beyond }),
    ]);
    const out = run(['list', '--all'], { cwd: root });
    const tl = payloadRows(out).map((l) => JSON.parse(l).tldr);
    expect(tl[0]).toBe(at120);
    expect(tl[1]).not.toBe(at121);
    expect([...tl[1]]).toHaveLength(120);
    // match beyond position 120 survives: search reads the original text.
    const found = run(['search', 'marker'], { cwd: root });
    expect(found).toContain('TICKETS_RETURNED=1');
    expect(JSON.parse(payloadRows(found)[0]).id).toBe('0003B');
  });

  it('projection normalizations never crash and never rewrite the board', () => {
    writeBoard([
      JSON.stringify({ id: '0001B', title: 42, status: 'open', tldr: null, theme: undefined, labels: 'no', updated_at: 'not a date', notes: [] }),
      JSON.stringify({ id: '0002B', status: 'open', title: 'no dates at all', tldr: 't' }),
      fullRow('0003B'),
    ]);
    const before = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8');
    const out = run(['list', '--all'], { cwd: root });
    const rows = payloadRows(out).map((l) => JSON.parse(l));
    expect(rows[0]).toEqual({ id: '0001B', status: 'open', title: '', tldr: '', theme: '', labels: [], updated_at: null });
    expect(rows[1]).toEqual({ id: '0002B', status: 'open', title: 'no dates at all', tldr: 't', theme: '', labels: [], updated_at: null });
    expect(rows[2].updated_at).toBe('2026-10-01');
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toBe(before);
  });

  it('invalid calendar dates become null while leap dates and offset dates keep their original date', () => {
    const dates = ['2026-02-30T12:34:56Z', '2026-02-29T12:34:56Z', '2026-04-31T12:34:56Z', '2024-02-29T12:34:56Z', '2026-10-01T00:30:00+02:00'];
    writeBoard(dates.map((updated_at, i) => fullRow(`000${i + 1}B`, { updated_at })));
    const before = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8');
    const rows = payloadRows(run(['list', '--all'], { cwd: root })).map(JSON.parse);
    expect(rows.map((row) => row.updated_at)).toEqual([null, null, null, '2024-02-29', '2026-10-01']);
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toBe(before);
  });

  it('metadata: READ_VIEW accompanies all reads and STATUS_COUNTS is the whole board, in first-occurrence text order', () => {
    writeBoard([
      fullRow('0001B', { status: 'open' }),
      fullRow('0002B', { status: '10' }),
      fullRow('0003B', { status: '2' }),
      fullRow('0004B', { status: '10' }),
    ]);
    for (const [args, view] of [
      [['list', '--all'], 'summary'],
      [['list', '--all', '--full'], 'full'],
      [['list', '--ids'], 'ids'],
      [['search', 'nothing-here'], 'summary'],
      [['search', 'nothing-here', '--full'], 'full'],
      [['get', '0001B'], 'full'],
    ]) {
      const out = run(args, { cwd: root });
      expect(out).toContain(`READ_VIEW=${view}`);
      expect(out).toContain('STATUS_COUNTS={"open":1,"10":2,"2":1}');
    }
    // A filtered list still counts the whole board.
    const filtered = run(['list', '--status', 'done'], { cwd: root });
    expect(filtered).toContain('TICKETS_RETURNED=0');
    expect(filtered).toContain('STATUS_COUNTS={"open":1,"10":2,"2":1}');
    // An absent board counts nothing and presents the empty object.
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-f2-empty-'));
    try {
      const empty = run(['list', '--all'], { cwd: emptyRoot });
      expect(empty).toContain('STATUS_COUNTS={}');
      expect(empty).toContain('READ_VIEW=summary');
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
  });

  it('the list flag grammar: one filter plus one projection, in any order, nothing else', () => {
    writeBoard([fullRow('0001B')]);
    // Valid orders.
    expect(run(['list', '--full', '--all'], { cwd: root })).toContain('READ_VIEW=full');
    expect(run(['list', '--ids', '--status', 'open'], { cwd: root })).toContain('READ_VIEW=ids');
    expect(run(['list', '--status', 'open', '--full'], { cwd: root })).toContain('READ_VIEW=full');
    // Conflicts and repeats are caller errors.
    const r1 = fail(['list', '--all', '--status', 'open'], { cwd: root });
    expect(r1.stdout).toContain('ERROR=bad-argument');
    expect(r1.status).toBe(2);
    expect(fail(['list', '--full', '--ids'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['list', '--all', '--all'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['list', '--full', '--full'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    // Unknown options and surplus literals are caller errors.
    expect(fail(['list', '--spectacular'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['list', '0001B'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['list', '--record-file', 'x.json'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    // --status without a value keeps its original name.
    expect(fail(['list', '--status'], { cwd: root }).stdout).toContain('ERROR=missing-status');
    expect(fail(['list', '--status', ''], { cwd: root }).stdout).toContain('ERROR=missing-status');
    // get accepts no projection flags.
    expect(fail(['get', '0001B', '--full'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
  });

  it('the search grammar: the first argument stays a literal query; only --full may follow', () => {
    writeBoard([fullRow('0001B', { tldr: 'first words' })]);
    // An option-looking first argument is a literal query.
    expect(run(['search', '--all'], { cwd: root })).toContain('TICKETS_RETURNED=0');
    expect(run(['search', '--all'], { cwd: root })).toContain('READ_VIEW=summary');
    // Only --full may follow the query.
    expect(run(['search', 'first words', '--full'], { cwd: root })).toContain('READ_VIEW=full');
    expect(fail(['search', 'first words', '--ids'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['search', 'first words', '--record-file', 'x'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
    expect(fail(['search', 'a', 'b'], { cwd: root }).stdout).toContain('ERROR=bad-argument');
  });
});

describe('backlog-cli — no shell, no Bash, anywhere in the path', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-cli-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('every shipped backlog module carries no child_process in its bytes', () => {
    for (const name of SHIPPED_MODULES) {
      const full = path.join(SCRIPTS, name);
      if (!fs.existsSync(full)) continue; // lands with its own F-block
      const source = fs.readFileSync(full, 'utf8');
      // Strip comment blocks first: these modules EXPLAIN in their headers
      // why they spawn nothing, and an assertion that reads prose would fail
      // on the explanation of the very rule it is checking. In CommonJS a
      // process can only start through child_process, so the bare string is
      // the complete signal — `exec(` itself is a RegExp API these modules
      // legitimately use.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      expect(code, name).not.toContain('child_process');
    }
  });

  it('native list runs with an empty PATH — no bash, no shell, nothing to call', () => {
    seeded(root, '0001B');
    const result = run(['list', '--all'], {
      cwd: root,
      env: { ...process.env, PATH: '', BASH_ENV: '', ENV: '' },
    });
    expect(result).toContain('TICKETS_TOTAL=1');
  });

  it('a write needs git, and says so instead of losing the record', () => {
    fs.writeFileSync(path.join(root, 'ticket.json'), JSON.stringify({
      title: 'no path, no bash', tldr: 't', done_when: 'when',
    }));
    const r = fail(['add', '--record-file', 'ticket.json'], {
      cwd: root,
      env: { ...process.env, PATH: '', BASH_ENV: '', ENV: '' },
    });
    // The record is on disk in the clone; the commit could not be made.
    expect(r.stdout).toContain('PERSISTED=yes');
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toContain('no path, no bash');
  });
});
