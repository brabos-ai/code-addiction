/**
 * End-state guard for the board removal (plan 2026-10-29T223023-PLAN--remove-board, ticket 0075B).
 *
 * The framework no longer ships a backlog board. Five assertions pin that end state. Each one is
 * committed skipped, with the F-block that makes it true in the title; that F-block removes the
 * `.skip` first, watches it fail, implements, and watches it pass. No skip survives the plan.
 *
 * History is never scanned: docs/changelog/ and docs/deliveries/ keep their old text on purpose.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FRAMEWORK = path.join(ROOT, 'framwork');
const SOURCE = path.join(FRAMEWORK, '.codeadd');
const PROVIDER_MAP = path.join(FRAMEWORK, 'provider-map.json');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** The source tree plus every provider output directory the build writes. */
function shippedRoots() {
  const map = JSON.parse(fs.readFileSync(PROVIDER_MAP, 'utf8'));
  const dirs = new Set([SOURCE]);
  for (const provider of Object.values(map.providers)) {
    for (const key of ['dir', 'agentsDir']) {
      if (provider[key]) dirs.add(path.join(ROOT, provider[key]));
    }
  }
  return [...dirs];
}

function commandFiles() {
  const dir = path.join(SOURCE, 'commands');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));
}

describe('board removed', () => {
  it.skip('F8: no shipped file names backlog-commit, backlog-cli or board.json', () => {
    const needle = /backlog-commit|backlog-cli|board\.json/;
    const hits = [];
    for (const root of shippedRoots()) {
      for (const file of walk(root)) {
        // The build sidecars are regenerated from the source on every build; they follow it.
        if (/\.(png|jpg|gif|zip)$/i.test(file)) continue;
        if (needle.test(fs.readFileSync(file, 'utf8'))) hits.push(path.relative(ROOT, file));
      }
    }
    expect(hits).toEqual([]);
  });

  it('F2: the board fragments directory does not exist', () => {
    expect(fs.existsSync(path.join(SOURCE, 'fragments', 'board'))).toBe(false);
  });

  it('F2: no command carries a board slot or a board feature marker', () => {
    const hits = commandFiles().filter((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return text.includes('<!-- slot:board.') || text.includes('<!-- feature:board:');
    });
    expect(hits.map((f) => path.basename(f))).toEqual([]);
  });

  it('F2: FEATURES has no board key', async () => {
    const { FEATURES } = await import('../src/features.js');
    expect(Object.keys(FEATURES)).not.toContain('board');
  });

  it.skip('F5: provider-map names no add--backlog and no board-init', () => {
    const text = fs.readFileSync(PROVIDER_MAP, 'utf8');
    expect(text).not.toContain('add--backlog');
    expect(text).not.toContain('board-init');
  });
});
