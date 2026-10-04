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
const WRAPPER_PATH = path.join(SCRIPTS, 'backlog.sh');

// The shipped backlog modules that are LOCAL-ONLY: allocation, core and
// storage runs with Node built-ins alone and must carry no process start in
// their bytes. The publication pair (backlog-git.cjs, backlog-commit.cjs) is
// the deliberate exception — native git through argument arrays IS its
// contract, asserted in backlog-publication.test.js.
const SHIPPED_MODULES = [
  'backlog-storage.cjs', 'backlog-core.cjs', 'backlog-cli.cjs', 'backlog-id.cjs',
];

const run = (args, opts = {}) =>
  execFileSync(process.execPath, [CLI_PATH, ...args], { encoding: 'utf8', ...opts });

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

  it('local reads need no Git — a plain directory is not a repository and still answers', () => {
    seeded(root, '0001B');
    expect(fs.existsSync(path.join(root, '.git'))).toBe(false);
    const result = run(['list', '--all'], { cwd: root });
    expect(result).toContain('TICKETS_TOTAL=1');
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

  it('the old wrapper+CLI chain refuses at 9999 the same way the native entry does', () => {
    // Characterization of the effective old behavior before the F4 cutover:
    // the wrapper's allocator would emit 10000B, its own `^[0-9]{4}B$` filter
    // refuses it, and the chain exits 1 with the allocation error.
    seeded(root, '9999B');
    const rec = path.join(root, 'rec.json');
    fs.writeFileSync(rec, RECORD);
    let status = 0; let stdout = '';
    try {
      execFileSync('bash', [WRAPPER_PATH, 'add'], {
        encoding: 'utf8', cwd: root, input: RECORD,
      });
      status = 0;
    } catch (e) {
      status = e.status; stdout = e.stdout;
    }
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
    const child = spawn(process.execPath, [CLI_PATH, ...args], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
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

  it('native add via file runs with an empty PATH', () => {
    fs.writeFileSync(path.join(root, 'ticket.json'), JSON.stringify({
      title: 'no path, no bash', tldr: 't', done_when: 'when',
    }));
    const result = run(['add', '--record-file', 'ticket.json'], {
      cwd: root,
      env: { ...process.env, PATH: '', BASH_ENV: '', ENV: '' },
    });
    expect(result).toContain('TICKET_ID=0001B');
  });
});
