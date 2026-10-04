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
