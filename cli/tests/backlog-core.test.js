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
import { executeBacklog, DEFAULT_DEFS } from '../../framwork/.codeadd/scripts/backlog-core.cjs';

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

  it('DEFAULT_DEFS has nine statuses', () => {
    expect(DEFAULT_DEFS.statuses).toHaveLength(9);
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
