/**
 * The board feature (plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses,
 * F18). What is specific to it, and only that.
 *
 * injection-exclusivity.integration.test.js already runs every registered
 * feature — board included, since it iterates Object.keys(FEATURES) — through
 * exactly-once, byte-identical disable, idempotent re-enable, sibling
 * isolation and reversed enable order. Repeating those here would be two
 * copies of one check. This file carries the three things nothing else
 * asserts:
 *
 *   L7.3  with the feature off — the shipped default — no product command
 *         names the backlog at all. That is the delivery's central claim.
 *   END-STATE MAP  every board section, by name, on the command it belongs to.
 *   L6.4  enable order changes no byte, not merely "everything landed".
 *
 * L6.2 (shared-anchor non-collision) has no subject for this feature: no board
 * marker shares an anchor line with another namespace, which the first test
 * below pins so that stays true or this file says otherwise.
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() } };
});

import { FEATURES, enableFeature, disableFeature } from '../src/features.js';
import { PROVIDERS } from '../src/providers.js';
import { treeFixture } from './helpers/tree-fixture.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SIDECAR = path.join(ROOT, 'framwork', '.codeadd', 'injection-points.json');
const CMD_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);
const BOARD_COMMANDS = ['add.brainstorm', 'add.new', 'add.plan', 'add.build', 'add.done', 'add.hotfix'];

// The END-STATE MAP. Fourteen sections: add.new's two adjacent sites were
// merged into one, which is why the plan's fifteen became fourteen.
const MAP = {
  'add.brainstorm': ['ticket-frontmatter', 'ticket-intent', 'ticket-refining', 'ticket-report', 'ticket-resolve', 'ticket-shaped'],
  'add.new': ['ticket-board-write', 'ticket-intent-field', 'ticket-shaped', 'ticket-skeleton'],
  'add.plan': ['ticket-done-when', 'ticket-planned', 'ticket-read'],
  'add.build': ['ticket-attention', 'ticket-doing', 'ticket-in-review', 'ticket-metadata'],
  'add.done': ['ticket-carry', 'ticket-close', 'ticket-report'],
  'add.hotfix': ['ticket-doing', 'ticket-frontmatter', 'ticket-report', 'ticket-resolve'],
};

const points = () => JSON.parse(fs.readFileSync(SIDECAR, 'utf8')).points;
const boardPoints = () => points().filter((p) => p.namespace === 'feature' && p.name === 'board');
const builtCommand = (prov, name) =>
  path.join(ROOT, 'framwork', PROVIDERS[prov].dest, PROVIDERS[prov].commandsSubdir, `${name}.md`);
const projectCommand = (cwd, prov, name) =>
  path.join(cwd, PROVIDERS[prov].dest, PROVIDERS[prov].commandsSubdir, `${name}.md`);

describe('board — the registry and the map', () => {
  it('is registered OFF, over exactly the six pipeline commands', () => {
    expect(FEATURES.board.default).toBe(false);
    expect([...FEATURES.board.commands].sort()).toEqual([...BOARD_COMMANDS].sort());
  });

  it('END-STATE MAP: every board section, by name, on the command it belongs to', () => {
    const got = {};
    for (const p of boardPoints()) {
      expect(p.resource.kind).toBe('command');
      (got[p.resource.name] = got[p.resource.name] || []).push(p.section);
    }
    for (const k of Object.keys(got)) got[k].sort();
    expect(got).toEqual(MAP);
    expect(boardPoints()).toHaveLength(24);
  });

  it('no board marker shares an anchor line with another namespace — L6.2 has no subject', () => {
    const byAnchor = new Map();
    for (const p of points()) {
      const k = `${p.resource.name}|${p.anchor.position}|${p.anchor.ordinal}|${p.anchor.text}`;
      byAnchor.set(k, [...(byAnchor.get(k) || []), `${p.namespace}:${p.name}`]);
    }
    const shared = [...byAnchor.values()].filter((v) => v.includes('feature:board') && new Set(v).size > 1);
    expect(shared).toEqual([]);
  });
});

describe('board — L7.3: off by default means no command mentions the backlog', () => {
  it('no built product command names add-backlog, backlog-commit.sh or a ticket write', () => {
    const offenders = [];
    for (const prov of CMD_PROVIDERS) {
      for (const name of BOARD_COMMANDS) {
        const file = builtCommand(prov, name);
        if (!fs.existsSync(file)) continue;
        const body = fs.readFileSync(file, 'utf8');
        for (const needle of ['add-backlog', 'backlog-commit.sh', 'ticket:']) {
          if (body.includes(needle)) offenders.push(`${prov}/${name}: ${needle}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

const fixture = treeFixture({
  prefix: 'board-feat-',
  copy: [
    ...Object.values(PROVIDERS).map((meta) => ({ src: meta.src, dest: meta.dest, optional: true })),
    { src: 'framwork/.codeadd', dest: '.codeadd' },
  ],
  manifest: {
    at: '.codeadd/manifest.json',
    data: { version: '0.0.0', providers: Object.keys(PROVIDERS), features: {}, plugins: {}, hashes: {} },
  },
});

describe('board — L6.4: enable order changes no byte', () => {
  let tmp;
  beforeEach(() => { tmp = fixture.root(); });
  afterEach(() => fixture.cleanup());
  afterAll(() => fixture.dispose());

  const snapshotAll = (cwd) => {
    const out = {};
    for (const prov of CMD_PROVIDERS) {
      for (const name of BOARD_COMMANDS) {
        const f = projectCommand(cwd, prov, name);
        if (fs.existsSync(f)) out[`${prov}/${name}`] = fs.readFileSync(f, 'utf8');
      }
    }
    return out;
  };

  // The OTHER features keep one fixed order on both sides, on purpose. Their
  // own relative order is NOT byte-stable today: tdd-pipeline and qa-pipeline
  // both anchor their step-list lines on the same line of add.plan, so the one
  // enabled second lands first. That is pre-existing, it has nothing to do with
  // this feature, and reversing the whole list here would test it instead of
  // board. What board must prove is that where IT goes in the order moves nothing.
  it('board-first and board-last produce identical files on every command it shares', () => {
    const others = ['tdd-pipeline', 'qa-pipeline', 'docs-pruning'];
    for (const f of ['board', ...others]) enableFeature(tmp, f);
    const first = snapshotAll(tmp);
    expect(Object.keys(first).length).toBeGreaterThan(0);

    for (const f of ['board', ...others]) disableFeature(tmp, f);
    for (const f of [...others, 'board']) enableFeature(tmp, f);
    expect(snapshotAll(tmp)).toEqual(first);
  });
});
