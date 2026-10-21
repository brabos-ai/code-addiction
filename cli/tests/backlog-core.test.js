/**
 * backlog-core.test.js — Domain/storage tests for the canonical core.
 *
 * Tests executeBacklog with independent roots in one process.
 * No argv/stdin/stdout, no process exit, no shell/Git invocation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeBacklog, DEFAULT_DEFS, mergeDefaultStatuses } from '../../framwork/.codeadd/scripts/backlog-core.cjs';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-core-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('executeBacklog', () => {
  it('list on absent board returns empty result', () => {
    const result = executeBacklog({ root: tmpDir, mode: 'list' });
    expect(result.ok).toBe(true);
    expect(result.read).toBe(true);
    expect(result.present).toBe(false);
    expect(result.total).toBe(0);
    expect(result.returned).toBe(0);
  });

  it('add creates a ticket with allocated id', () => {
    const result = executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' })
    });
    expect(result.ok).toBe(true);
    expect(result.ticketId).toBe('0001B');

    const listResult = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(listResult.total).toBe(1);
    expect(listResult.rows[0]).toContain('0001B');
  });

  it('add refuses unknown status', () => {
    const result = executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done', status: 'bogus' })
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe('unknown-status');
  });

  it('add refuses reserved fields', () => {
    const result = executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done', id: 'hack' })
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe('reserved-field');
  });

  it('add refuses missing required fields', () => {
    const result = executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test' })
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe('missing-field');
  });

  it('update modifies a ticket', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' })
    });
    const result = executeBacklog({
      root: tmpDir,
      mode: 'update',
      targetId: '0001B',
      rawRecord: JSON.stringify({ title: 'Updated' })
    });
    expect(result.ok).toBe(true);

    const listResult = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(listResult.rows[0]).toContain('Updated');
  });

  it('comment appends to comments', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' })
    });
    const result = executeBacklog({
      root: tmpDir,
      mode: 'comment',
      targetId: '0001B',
      rawRecord: JSON.stringify({ content: 'A comment' })
    });
    expect(result.ok).toBe(true);

    const listResult = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(listResult.rows[0]).toContain('A comment');
  });

  it('remove deletes a ticket', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' })
    });
    const result = executeBacklog({ root: tmpDir, mode: 'remove', targetId: '0001B' });
    expect(result.ok).toBe(true);

    const listResult = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(listResult.total).toBe(0);
  });

  it('move reorders tickets', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'First', tldr: 'TLDR', done_when: 'Done' })
    });
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0002B',
      rawRecord: JSON.stringify({ title: 'Second', tldr: 'TLDR', done_when: 'Done' })
    });
    const result = executeBacklog({ root: tmpDir, mode: 'move', targetId: '0002B', moveDir: 'top' });
    expect(result.ok).toBe(true);

    const listResult = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(listResult.rows[0]).toContain('0002B');
  });

  it('search finds tickets by title', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Findme', tldr: 'TLDR', done_when: 'Done' })
    });
    const result = executeBacklog({ root: tmpDir, mode: 'search', query: 'findme' });
    expect(result.ok).toBe(true);
    expect(result.returned).toBe(1);
  });

  it('list with filter returns only matching status', () => {
    executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done', status: 'doing' })
    });
    const result = executeBacklog({ root: tmpDir, mode: 'list', filter: 'doing' });
    expect(result.ok).toBe(true);
    expect(result.returned).toBe(1);
  });

  it('definitions are seeded on write when absent', () => {
    const result = executeBacklog({
      root: tmpDir,
      mode: 'add',
      newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' })
    });
    expect(result.ok).toBe(true);
    expect(result.defsProvenance).toBe('seeded');

    const defsPath = path.join(tmpDir, 'docs', 'backlog.definitions.json');
    expect(fs.existsSync(defsPath)).toBe(true);
  });

  it('definitions are not seeded on read when absent', () => {
    const result = executeBacklog({ root: tmpDir, mode: 'list' });
    expect(result.ok).toBe(true);
    expect(result.defsProvenance).toBe('default');

    const defsPath = path.join(tmpDir, 'docs', 'backlog.definitions.json');
    expect(fs.existsSync(defsPath)).toBe(false);
  });

  it('invalid definitions fall back to defaults with diagnostic', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs', 'backlog.definitions.json'), 'not json', 'utf8');

    const result = executeBacklog({ root: tmpDir, mode: 'list' });
    expect(result.ok).toBe(true);
    expect(result.defsProvenance).toBe('fallback');
    expect(result.diagnostics.some(d => d.key === 'DEFS_UNREADABLE')).toBe(true);
  });

  it('damaged rows are preserved and reported', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'docs', 'backlog.jsonl'), 'not json\n{"id":"0001B","title":"Ok"}\n', 'utf8');

    const result = executeBacklog({ root: tmpDir, mode: 'list', filter: '*' });
    expect(result.ok).toBe(true);
    expect(result.total).toBe(1);
    expect(result.damaged).toEqual([1]);
  });

  it('DEFAULT_DEFS has ten statuses and eight columns, and every status sits in a column', () => {
    expect(DEFAULT_DEFS.statuses.map(s => s.name)).toEqual([
      'open', 'refining', 'shaped', 'planning', 'planned', 'doing', 'in-review', 'awaiting-release', 'done', 'dropped'
    ]);
    expect(DEFAULT_DEFS.columns.map(c => c.name)).toEqual([
      'backlog', 'shaping', 'planning', 'building', 'review', 'release', 'done', 'dropped'
    ]);
    const columns = new Set(DEFAULT_DEFS.columns.map(c => c.name));
    expect(DEFAULT_DEFS.statuses.filter(s => !columns.has(s.column))).toEqual([]);
    expect(DEFAULT_DEFS.statuses.find(s => s.name === 'awaiting-release').column).toBe('release');
  });

  it('DEFAULT_DEFS suggests five labels and ships with release_flow off', () => {
    expect(DEFAULT_DEFS.labels.map(l => l.name)).toEqual(['feature', 'bug', 'improvement', 'docs', 'chore']);
    for (const l of DEFAULT_DEFS.labels) {
      expect(typeof l.label).toBe('string');
      expect(typeof l.means).toBe('string');
    }
    expect(DEFAULT_DEFS.release_flow).toBe(false);
  });

  it('add keeps a string release and stores null without one', () => {
    const base = { title: 'Test', tldr: 'TLDR', done_when: 'Done' };
    executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: JSON.stringify({ ...base, release: 'v1.2.3' }) });
    executeBacklog({ root: tmpDir, mode: 'add', newId: '0002B', rawRecord: JSON.stringify(base) });
    const got = (id) => JSON.parse(executeBacklog({ root: tmpDir, mode: 'get', targetId: id }).rows[0]);
    expect(got('0001B').release).toBe('v1.2.3');
    expect(got('0002B').release).toBeNull();
  });

  it('a label outside the suggested list is written, never refused', () => {
    const add = executeBacklog({
      root: tmpDir, mode: 'add', newId: '0001B',
      rawRecord: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done', labels: ['not-in-the-list'] })
    });
    expect(add.ok).toBe(true);
    const upd = executeBacklog({ root: tmpDir, mode: 'update', targetId: '0001B', rawRecord: JSON.stringify({ labels: ['also-new'] }) });
    expect(upd.ok).toBe(true);
  });

  it('a ticket moves to awaiting-release, then to done with its release', () => {
    executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: JSON.stringify({ title: 'T', tldr: 'L', done_when: 'D' }) });
    const park = executeBacklog({ root: tmpDir, mode: 'update', targetId: '0001B', rawRecord: JSON.stringify({ status: 'awaiting-release' }) });
    expect(park.ok).toBe(true);
    const close = executeBacklog({ root: tmpDir, mode: 'update', targetId: '0001B', rawRecord: JSON.stringify({ release: 'v9.9.9', status: 'done' }) });
    expect(close.ok).toBe(true);
    const t = JSON.parse(executeBacklog({ root: tmpDir, mode: 'get', targetId: '0001B' }).rows[0]);
    expect(t.status).toBe('done');
    expect(t.release).toBe('v9.9.9');
  });
});

describe('executeBacklog — get, id-equality search, statusCounts (F1)', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-core-get-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const ticketJson = (id, over = {}) => JSON.stringify({
    id,
    title: `t-${id}`,
    theme: '',
    labels: [],
    tldr: `tldr-${id}`,
    notes: [],
    done_when: 'when',
    paths: [],
    grounded: false,
    status: 'open',
    created_at: '2026-09-20T00:00:00Z',
    updated_at: '2026-09-20T00:00:00Z',
    comments: [],
    feature: null,
    work_id: null,
    ...over,
  });

  const seed = (lines) => {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'backlog.jsonl'), lines.join('\n') + '\n');
  };

  it('get returns exactly the raw row of the id, never tickets that only mention it', () => {
    seed([
      ticketJson('0001B'),
      ticketJson('0002B', { notes: ['mentions 0001B in its notes'] }),
    ]);
    const boardBefore = fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8');

    const result = executeBacklog({ root, mode: 'get', targetId: '0001B' });
    expect(result.ok).toBe(true);
    expect(result.read).toBe(true);
    expect(result.returned).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toContain('tldr-0001B');
    expect(result.tickets[0].id).toBe('0001B');

    // The board is untouched: get is a read.
    expect(fs.readFileSync(path.join(root, 'docs', 'backlog.jsonl'), 'utf8')).toBe(boardBefore);
  });

  it('get of an id that is not on the board is a successful read with zero results', () => {
    seed([ticketJson('0001B')]);
    const result = executeBacklog({ root, mode: 'get', targetId: '0404B' });
    expect(result.ok).toBe(true);
    expect(result.read).toBe(true);
    expect(result.returned).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('get on an absent board is a successful read with zero results and no file created', () => {
    const readResult = executeBacklog({ root, mode: 'get', targetId: '0001B' });
    expect(readResult.ok).toBe(true);
    expect(readResult.returned).toBe(0);
    expect(readResult.rows).toHaveLength(0);
    expect(fs.existsSync(path.join(root, 'docs', 'backlog.jsonl'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs', 'backlog.definitions.json'))).toBe(false);
  });

  it('get has no status filter — done and doing tickets are reachable', () => {
    seed([
      ticketJson('0001B', { status: 'done' }),
      ticketJson('0002B', { status: 'doing' }),
    ]);
    for (const [id, status] of [['0001B', 'done'], ['0002B', 'doing']]) {
      const result = executeBacklog({ root, mode: 'get', targetId: id });
      expect(result.returned).toBe(1);
      expect(result.tickets[0].status).toBe(status);
    }
  });

  it('search matches an exact id case-insensitively, and only exactly', () => {
    seed([ticketJson('0001B', { title: 'cache the provider map', tldr: 'stop re-reading it' })]);
    expect(executeBacklog({ root, mode: 'search', query: '0001b' }).returned).toBe(1);
    expect(executeBacklog({ root, mode: 'search', query: '0001B' }).returned).toBe(1);
    // A substring of the id matches no textual field either.
    expect(executeBacklog({ root, mode: 'search', query: '001B' }).returned).toBe(0);
  });

  it('statusCounts counts the whole board before the filter, in first-occurrence order', () => {
    seed([
      ticketJson('0001B', { status: 'open' }),
      ticketJson('0002B', { status: 'done' }),
      ticketJson('0003B', { status: 'open' }),
    ]);
    const result = executeBacklog({ root, mode: 'list', filter: 'done' });
    expect(result.ok).toBe(true);
    expect(result.returned).toBe(1);
    expect(result.statusCounts).toEqual([['open', 2], ['done', 1]]);
  });

  it('statusCounts carries numeric and custom status names in first-occurrence order', () => {
    seed([
      ticketJson('0001B', { status: '10' }),
      ticketJson('0002B', { status: '2' }),
      ticketJson('0003B', { status: '10' }),
    ]);
    const result = executeBacklog({ root, mode: 'list', filter: '*' });
    expect(result.statusCounts).toEqual([['10', 2], ['2', 1]]);
  });

  it('statusCounts counts a string status the definitions no longer define, and never a damaged line', () => {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'docs', 'backlog.jsonl'),
      [
        ticketJson('0001B', { status: 'retired' }),
        '{"id":"0002B","title":"truncated', // damaged — must not be counted
        ticketJson('0003B', { status: 'open' }),
      ].join('\n') + '\n',
    );
    const result = executeBacklog({ root, mode: 'list', filter: '*' });
    expect(result.ok).toBe(true);
    expect(result.damaged).toEqual([2]);
    expect(result.undefinedStatuses).toContain('retired');
    expect(result.statusCounts).toEqual([['retired', 1], ['open', 1]]);
  });

  it('get with zero hits still carries statusCounts', () => {
    seed([ticketJson('0001B')]);
    const result = executeBacklog({ root, mode: 'get', targetId: '0404B' });
    expect(result.statusCounts).toEqual([['open', 1]]);
  });
});

// ---------------------------------------------------------------------------
// 0057B — an existing definitions file gains the default statuses it lacks
// ---------------------------------------------------------------------------

const DEFAULT_NAMES = DEFAULT_DEFS.statuses.map((s) => s.name);
const st = (name, order, column, extra = {}) => ({ name, order, column, label: name, means: `means ${name}`, ...extra });
const col = (name, order) => ({ name, order, label: name });

/** OLD5: the real case — open, doing, awaiting-release, done, dropped; release_flow on, no columns. */
const old5 = () => ({
  statuses: [st('open', 1), st('doing', 2), st('awaiting-release', 3), st('done', 4), st('dropped', 5)],
  labels: [{ name: 'feature', label: 'Feature', means: 'new' }],
  release_flow: true,
});
/** OLD4: no release_flow, with a columns array. */
const old4 = () => ({
  columns: [col('backlog', 1), col('building', 2), col('done', 3), col('dropped', 4)],
  statuses: [st('open', 1, 'backlog'), st('doing', 2, 'building'), st('done', 3, 'done'), st('dropped', 4, 'dropped')],
  labels: [],
});
/** CUSTOM: OLD4 plus a user status, a changed means and an extra key. */
const custom = () => {
  const d = old4();
  d.statuses = [
    st('open', 1, 'backlog', { color: 'red' }),
    st('doing', 2, 'building', { means: 'my own meaning' }),
    st('blocked', 3, 'building'),
    st('done', 4, 'done'),
    st('dropped', 5, 'dropped'),
  ];
  return d;
};

const defsFile = (root) => path.join(root, 'docs', 'backlog.definitions.json');
function seedDefs(root, defs) {
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(defsFile(root), JSON.stringify(defs, null, 2) + '\n', 'utf8');
}
const bytes = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const boardFile = (root) => path.join(root, 'docs', 'backlog.jsonl');
const addRecord = (extra = {}) => JSON.stringify({ title: 'T', tldr: 'TLDR', done_when: 'Done', ...extra });

describe('mergeDefaultStatuses (0057B)', () => {
  it('L1.1 an old 5-status file becomes the ten defaults, in default order', () => {
    const { next, added } = mergeDefaultStatuses(old5());
    expect(next.statuses.map((s) => s.name)).toEqual(DEFAULT_NAMES);
    const orders = next.statuses.map((s) => s.order);
    for (let i = 1; i < orders.length; i++) expect(orders[i]).toBeGreaterThan(orders[i - 1]);
    expect(added).toEqual(['refining', 'shaped', 'planning', 'planned', 'in-review']);
  });

  it('L1.2 a 4-status file without release_flow gets nine names, no awaiting-release, and the columns it needs', () => {
    const { next, added } = mergeDefaultStatuses(old4());
    expect(next.statuses.map((s) => s.name)).toEqual(DEFAULT_NAMES.filter((n) => n !== 'awaiting-release'));
    expect(added).not.toContain('awaiting-release');
    expect(next.columns.map((c) => c.name)).toEqual(['backlog', 'shaping', 'planning', 'building', 'review', 'done', 'dropped']);
    expect(next.columns.map((c) => c.name)).not.toContain('release');
  });

  it('a file with no columns key never gets one', () => {
    expect('columns' in mergeDefaultStatuses(old5()).next).toBe(false);
  });

  it('a non-boolean release_flow counts as off', () => {
    const d = old4();
    d.release_flow = 'true';
    expect(mergeDefaultStatuses(d).added).not.toContain('awaiting-release');
  });

  it('L1.3 is idempotent', () => {
    const once = mergeDefaultStatuses(old4()).next;
    const again = mergeDefaultStatuses(once);
    expect(again.added).toEqual([]);
    expect(again.next).toEqual(once);
  });

  it('L1.4 keeps custom entries, custom keys and the relative order of what the user wrote', () => {
    const input = custom();
    const snapshot = JSON.parse(JSON.stringify(input));
    const { next } = mergeDefaultStatuses(input);
    expect(input).toEqual(snapshot); // pure: the argument is untouched
    const byName = Object.fromEntries(next.statuses.map((s) => [s.name, s]));
    expect(byName.blocked).toBeDefined();
    expect(byName.doing.means).toBe('my own meaning');
    expect(byName.open.color).toBe('red');
    for (const old of snapshot.statuses) {
      const { order: _a, ...before } = old;
      const { order: _b, ...after } = byName[old.name];
      expect(after).toEqual(before);
    }
    const kept = next.statuses.map((s) => s.name).filter((n) => snapshot.statuses.some((o) => o.name === n));
    expect(kept).toEqual(snapshot.statuses.map((s) => s.name));
    expect(next.labels).toEqual(snapshot.labels);
  });

  it('inserts before the first existing default successor (refining lands before doing, not after awaiting-release)', () => {
    const names = mergeDefaultStatuses(old5()).next.statuses.map((s) => s.name);
    expect(names.indexOf('refining')).toBeLessThan(names.indexOf('doing'));
  });
});

describe('sync-defs and the unknown-status path (0057B)', () => {
  it('L1.5 sync-defs on an OLD5 file writes the full set; the second run writes nothing', () => {
    seedDefs(tmpDir, old5());
    const first = executeBacklog({ root: tmpDir, mode: 'sync-defs' });
    expect(first.ok).toBe(true);
    expect(first.defsAdded).toEqual(['refining', 'shaped', 'planning', 'planned', 'in-review']);
    expect(JSON.parse(bytes(defsFile(tmpDir))).statuses.map((s) => s.name)).toEqual(DEFAULT_NAMES);

    const before = bytes(defsFile(tmpDir));
    const mtime = fs.statSync(defsFile(tmpDir)).mtimeMs;
    const second = executeBacklog({ root: tmpDir, mode: 'sync-defs' });
    expect(second.ok).toBe(true);
    expect(second.defsAdded).toEqual([]);
    expect(bytes(defsFile(tmpDir))).toBe(before);
    expect(fs.statSync(defsFile(tmpDir)).mtimeMs).toBe(mtime);
  });

  it('L1.6 sync-defs on an unparseable file refuses and leaves it alone; on no file it creates nothing', () => {
    fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
    fs.writeFileSync(defsFile(tmpDir), 'not json', 'utf8');
    const bad = executeBacklog({ root: tmpDir, mode: 'sync-defs' });
    expect(bad.ok).toBe(false);
    expect(bad.refusal).toBe('definitions-unreadable');
    expect(bytes(defsFile(tmpDir))).toBe('not json');

    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-core-empty-'));
    try {
      const none = executeBacklog({ root: empty, mode: 'sync-defs' });
      expect(none.ok).toBe(true);
      expect(none.defsAdded).toEqual([]);
      expect(fs.existsSync(defsFile(empty))).toBe(false);
    } finally {
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  it('L1.7 add with a missing default status merges the file, then writes the ticket', () => {
    seedDefs(tmpDir, old5());
    const result = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord({ status: 'refining' }) });
    expect(result.ok).toBe(true);
    expect(result.defsAdded.length).toBeGreaterThan(0);
    expect(JSON.parse(bytes(defsFile(tmpDir))).statuses.map((s) => s.name)).toEqual(DEFAULT_NAMES);
    expect(bytes(boardFile(tmpDir))).toContain('"status":"refining"');
  });

  it('L1.7b update to a missing default status merges the file too', () => {
    seedDefs(tmpDir, old5());
    executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord() });
    const result = executeBacklog({ root: tmpDir, mode: 'update', targetId: '0001B', rawRecord: JSON.stringify({ status: 'in-review' }) });
    expect(result.ok).toBe(true);
    expect(result.defsAdded).toEqual(['refining', 'shaped', 'planning', 'planned', 'in-review']);
  });

  it('L1.8 a status that is not a default, or awaiting-release with the flag off, is still refused and nothing changes', () => {
    seedDefs(tmpDir, old5());
    const defsBefore = bytes(defsFile(tmpDir));
    const bad = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord({ status: 'invented' }) });
    expect(bad.refusal).toBe('unknown-status');
    expect(bytes(defsFile(tmpDir))).toBe(defsBefore);
    expect(bytes(boardFile(tmpDir))).toBeNull();

    const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'backlog-core-flag-'));
    try {
      seedDefs(root2, old4());
      executeBacklog({ root: root2, mode: 'add', newId: '0001B', rawRecord: addRecord() });
      const d2 = bytes(defsFile(root2));
      const b2 = bytes(boardFile(root2));
      const r = executeBacklog({ root: root2, mode: 'update', targetId: '0001B', rawRecord: JSON.stringify({ status: 'awaiting-release' }) });
      expect(r.refusal).toBe('unknown-status');
      expect(bytes(defsFile(root2))).toBe(d2);
      expect(bytes(boardFile(root2))).toBe(b2);
    } finally {
      fs.rmSync(root2, { recursive: true, force: true });
    }
  });

  it('L1.9 a refused write leaves both files untouched even when the status was a missing default', () => {
    seedDefs(tmpDir, old5());
    const defsBefore = bytes(defsFile(tmpDir));
    const r = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord({ status: 'shaped', id: 'x' }) });
    expect(r.refusal).toBe('reserved-field');
    expect(bytes(defsFile(tmpDir))).toBe(defsBefore);
    expect(bytes(boardFile(tmpDir))).toBeNull();

    const first = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord() });
    expect(first.ok).toBe(true);
    const d2 = bytes(defsFile(tmpDir));
    const b2 = bytes(boardFile(tmpDir));
    const dup = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord({ status: 'shaped' }) });
    expect(dup.refusal).toBe('duplicate-id');
    expect(bytes(defsFile(tmpDir))).toBe(d2);
    expect(bytes(boardFile(tmpDir))).toBe(b2);
  });

  it('L1.10 release-flow on a 4-status file keeps its result: awaiting-release before done, release column before done', () => {
    seedDefs(tmpDir, old4());
    executeBacklog({ root: tmpDir, mode: 'release-flow', flag: 'on' });
    const out = JSON.parse(bytes(defsFile(tmpDir)));
    expect(out.release_flow).toBe(true);
    expect(out.statuses.map((s) => [s.name, s.order])).toEqual([
      ['open', 1], ['doing', 2], ['awaiting-release', 3], ['done', 4], ['dropped', 5],
    ]);
    expect(out.columns.map((c) => [c.name, c.order])).toEqual([
      ['backlog', 1], ['building', 2], ['release', 3], ['done', 4], ['dropped', 5],
    ]);
  });

  it('a seeded file never gets an extra write on the unknown-status path', () => {
    const r = executeBacklog({ root: tmpDir, mode: 'add', newId: '0001B', rawRecord: addRecord({ status: 'refining' }) });
    expect(r.ok).toBe(true);
    expect(r.defsAdded).toEqual([]);
  });
});
