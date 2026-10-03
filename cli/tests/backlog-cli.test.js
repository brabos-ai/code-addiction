/**
 * backlog-cli.test.js — CLI/wrapper tests for the Node CLI adapter.
 *
 * Tests the CLI's positional grammar, stdin consumption, stdout/stderr
 * rendering, and exit codes.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CLI_PATH = path.resolve(__dirname, '../../framwork/.codeadd/scripts/backlog-cli.cjs');

describe('backlog-cli', () => {
  it('exits 2 on bad mode', () => {
    try {
      execFileSync('node', [CLI_PATH, 'bogus'], { encoding: 'utf8' });
      expect.unreachable();
    } catch (e) {
      expect(e.status).toBe(2);
      expect(e.stdout).toContain('ERROR=bad-mode');
    }
  });

  it('exits 2 on missing id for update', () => {
    try {
      execFileSync('node', [CLI_PATH, 'update'], { encoding: 'utf8' });
      expect.unreachable();
    } catch (e) {
      expect(e.status).toBe(2);
      expect(e.stdout).toContain('ERROR=missing-id');
    }
  });

  it('exits 1 on add without BACKLOG_NEW_ID', () => {
    try {
      execFileSync('node', [CLI_PATH, 'add'], {
        input: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' }),
        encoding: 'utf8'
      });
      expect.unreachable();
    } catch (e) {
      expect(e.status).toBe(1);
      expect(e.stdout).toContain('ERROR=id-allocation-failed');
    }
  });

  it('exits 0 on successful add with BACKLOG_NEW_ID', () => {
    // CLI resolves root from SCRIPT_DIR, so we use the current project
    // Use a unique ID based on timestamp to avoid collision
    const id = String(Date.now()).slice(-4) + 'B';
    const result = execFileSync('node', [CLI_PATH, 'add'], {
      input: JSON.stringify({ title: 'Test', tldr: 'TLDR', done_when: 'Done' }),
      encoding: 'utf8',
      env: { ...process.env, BACKLOG_NEW_ID: id }
    });
    expect(result).toContain(`TICKET_ID=${id}`);
  });

  it('exits 0 on list and returns KEY=VALUE format', () => {
    const result = execFileSync('node', [CLI_PATH, 'list'], {
      encoding: 'utf8'
    });
    expect(result).toContain('BACKLOG_PRESENT=');
    expect(result).toContain('TICKETS_TOTAL=');
    expect(result).toContain('TICKETS_RETURNED=');
  });

  it('exits 2 on unknown-id refusal', () => {
    try {
      execFileSync('node', [CLI_PATH, 'update', '0000B'], {
        input: JSON.stringify({ title: 'Nope' }),
        encoding: 'utf8'
      });
      expect.unreachable();
    } catch (e) {
      expect(e.status).toBe(2);
      expect(e.stdout).toContain('REFUSED=unknown-id');
    }
  });
});
