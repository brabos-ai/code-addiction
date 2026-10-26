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
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
  promptFeatures: vi.fn(),
  promptProviders: vi.fn(),
  promptScope: vi.fn(),
  promptConfirm: vi.fn(),
  promptGitignore: vi.fn(),
  promptExistingInstall: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));

vi.mock('../src/prompt.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, ...mocks };
});

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() } };
});

import { FEATURES, enableFeature, disableFeature, features } from '../src/features.js';
import { modify } from '../src/modify.js';
import { install } from '../src/installer.js';
import { log } from '@clack/prompts';
import { initBoardOnEnable, setBoardInitExec } from '../src/board-init.js';
import { PROVIDERS } from '../src/providers.js';
import { treeFixture } from './helpers/tree-fixture.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SIDECAR = path.join(ROOT, 'framwork', '.codeadd', 'injection-points.json');
const CMD_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);
const BOARD_COMMANDS = ['add-brainstorm', 'add-new', 'add-plan', 'add-build', 'add-done', 'add-hotfix'];

// The END-STATE MAP. Twenty-four sections over six commands. Checkpoint 2 moved
// fourteen -- add-new's two adjacent sites were merged into one, which is why
// the plan's fifteen became fourteen -- and checkpoint 3 added ten: the five new
// writes' sections, add-new's board-write permission, and add-hotfix's four.
const MAP = {
  'add-brainstorm': ['ticket-frontmatter', 'ticket-intent', 'ticket-refining', 'ticket-report', 'ticket-resolve', 'ticket-shaped'],
  'add-new': ['ticket-board-write', 'ticket-intent-field', 'ticket-shaped', 'ticket-skeleton'],
  'add-plan': ['ticket-done-when', 'ticket-planned', 'ticket-read'],
  'add-build': ['deferred-minors', 'ticket-attention', 'ticket-doing', 'ticket-in-review', 'ticket-metadata'],
  'add-done': ['ticket-carry', 'ticket-close', 'ticket-report'],
  'add-hotfix': ['ticket-doing', 'ticket-frontmatter', 'ticket-report', 'ticket-resolve'],
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
    expect(boardPoints()).toHaveLength(25);
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
  it('no built product command names add--backlog or a backlog entry or a ticket write', () => {
    const offenders = [];
    for (const prov of CMD_PROVIDERS) {
      for (const name of BOARD_COMMANDS) {
        const file = builtCommand(prov, name);
        if (!fs.existsSync(file)) continue;
        const body = fs.readFileSync(file, 'utf8');
        for (const needle of [
          'add--backlog', 'backlog-commit.cjs', 'backlog-cli.cjs', 'ticket:',
        ]) {
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

  it('reversed enable order, board included, produces identical files', () => {
    const order = ['board', 'tdd-pipeline', 'qa-pipeline', 'docs-pruning'];
    for (const f of order) enableFeature(tmp, f);
    const first = snapshotAll(tmp);
    expect(Object.keys(first).length).toBeGreaterThan(0);

    for (const f of order) disableFeature(tmp, f);
    for (const f of [...order].reverse()) enableFeature(tmp, f);
    expect(snapshotAll(tmp)).toEqual(first);
  });
});

// ---------------------------------------------------------------------------
// 0070B -- enabling the feature creates the board (cli/src/board-init.js)
// ---------------------------------------------------------------------------

const BOARD_JSON = path.join('.codeadd', 'board.json');
const SCRIPT_REL = path.join('.codeadd', 'scripts', 'board-init.cjs');
const OK_RESULT = { status: 0, stdout: 'BOARD=created\nCODE_CHANGES=staged\nSTAGED=.codeadd/board.json\nNext: commit .codeadd/board.json so the team shares the board.\n' };

/** A bare project dir with a stub script in place; the exec is always injected. */
function stubProject(t, { scope, script = true, boardJson = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'board-init-cli-'));
  t.cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, '.codeadd', 'scripts'), { recursive: true });
  if (script) fs.writeFileSync(path.join(dir, SCRIPT_REL), '// stub\n');
  if (boardJson) fs.writeFileSync(path.join(dir, BOARD_JSON), '{}');
  if (scope) fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify({ version: '0.0.0', scope, providers: [], features: {}, plugins: {}, hashes: {} }));
  return dir;
}

describe('board-init (CLI helper) -- 0070B', () => {
  const t = { cleanups: [] };
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => {
    setBoardInitExec(null);
    for (const fn of t.cleanups.splice(0)) fn();
  });

  it('spawns once, with the project as cwd, when board.json is absent', () => {
    const dir = stubProject(t);
    const exec = vi.fn(() => OK_RESULT);
    initBoardOnEnable(dir, 'board', { scope: 'project', exec });
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec.mock.calls[0][0].cwd).toBe(dir);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('BOARD=created'));
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('does not spawn when board.json exists', () => {
    const dir = stubProject(t, { boardJson: true });
    const exec = vi.fn(() => OK_RESULT);
    initBoardOnEnable(dir, 'board', { scope: 'project', exec });
    expect(exec).not.toHaveBeenCalled();
  });

  it('does not spawn in global scope', () => {
    const dir = stubProject(t);
    const exec = vi.fn(() => OK_RESULT);
    initBoardOnEnable(dir, 'board', { scope: 'global', exec });
    expect(exec).not.toHaveBeenCalled();
  });

  it('does not spawn for any other feature name', () => {
    const dir = stubProject(t);
    const exec = vi.fn(() => OK_RESULT);
    for (const name of Object.keys(FEATURES).filter((n) => n !== 'board')) {
      initBoardOnEnable(dir, name, { scope: 'project', exec });
    }
    expect(exec).not.toHaveBeenCalled();
  });

  it('reads the scope from the manifest when none is passed', () => {
    const dir = stubProject(t, { scope: 'global' });
    const exec = vi.fn(() => OK_RESULT);
    initBoardOnEnable(dir, 'board', { exec });
    expect(exec).not.toHaveBeenCalled();
  });

  it.each([
    ['an ERROR= result', () => ({ status: 1, stdout: 'ERROR=no-remote\nThis project has no origin.\n' }), /ERROR=no-remote/],
    ['a non-zero exit', () => ({ status: 3, stdout: '' }), /board-init\.cjs/],
    ['a thrown spawn error', () => { throw new Error('spawn failed'); }, /board-init\.cjs/],
  ])('%s gives exactly one warning and the enable still returns', (_name, exec, pattern) => {
    const dir = stubProject(t);
    expect(() => initBoardOnEnable(dir, 'board', { scope: 'project', exec })).not.toThrow();
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn.mock.calls[0][0]).toMatch(pattern);
    expect(log.warn.mock.calls[0][0]).toContain('node .codeadd/scripts/board-init.cjs');
    expect(log.warn.mock.calls[0][0]).not.toContain('\n');
  });

  it('a missing script gives exactly one warning and no spawn', () => {
    const dir = stubProject(t, { script: false });
    const exec = vi.fn(() => OK_RESULT);
    initBoardOnEnable(dir, 'board', { scope: 'project', exec });
    expect(exec).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledTimes(1);
  });
});

describe('board-init (CLI helper) -- the four enable entry points reach it', () => {
  const bfix = treeFixture({
    prefix: 'board-init-entry-',
    copy: [
      ...Object.values(PROVIDERS).map((meta) => ({ src: meta.src, dest: meta.dest, optional: true })),
      { src: 'framwork/.codeadd', dest: '.codeadd' },
    ],
    manifest: {
      at: '.codeadd/manifest.json',
      data: { version: '0.0.0', providers: Object.keys(PROVIDERS), features: {}, plugins: {}, hashes: {} },
    },
  });
  let tmp;
  let exec;
  const realIsTTY = process.stdin.isTTY;
  beforeEach(() => {
    vi.clearAllMocks();
    tmp = bfix.root();
    exec = vi.fn(() => OK_RESULT);
    setBoardInitExec(exec);
  });
  afterEach(() => {
    setBoardInitExec(null);
    process.stdin.isTTY = realIsTTY;
    bfix.cleanup();
  });
  afterAll(() => bfix.dispose());

  const setScope = (dir, scope) => {
    const file = path.join(dir, '.codeadd', 'manifest.json');
    fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), scope }));
  };

  it('features enable board (non-interactive)', async () => {
    await features(tmp, ['enable', 'board']);
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec.mock.calls[0][0].cwd).toBe(tmp);
  });

  it('features enable board on a manifest with scope global does not spawn', async () => {
    setScope(tmp, 'global');
    await features(tmp, ['enable', 'board']);
    expect(exec).not.toHaveBeenCalled();
  });

  it('features enable <other> does not spawn', async () => {
    await features(tmp, ['enable', 'tdd-pipeline']);
    expect(exec).not.toHaveBeenCalled();
  });

  it('features (interactive menu) reaches it when board is newly ticked', async () => {
    process.stdin.isTTY = true;
    mocks.promptFeatures.mockResolvedValue(['board']);
    await features(tmp, []);
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('modify --enable-feature board', async () => {
    await modify(tmp, ['--enable-feature', 'board']);
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec.mock.calls[0][0].cwd).toBe(tmp);
  });

  it('install --enable-feature board reaches it; a plain install does not', async () => {
    const zip = new AdmZip();
    zip.addFile('framwork/.codeadd/scripts/board-init.cjs', Buffer.from('// stub\n'));
    zip.addFile('framwork/.codeadd/injection-points.json', Buffer.from('{"version":1,"points":[]}\n'));
    zip.addFile('framwork/.agents/skills/add/SKILL.md', Buffer.from('---\nname: add\n---\n'));
    mocks.getLatestTag.mockResolvedValue('v1.2.3');
    mocks.downloadReleaseAsset.mockResolvedValue(zip.toBuffer());
    mocks.promptProviders.mockResolvedValue(['codex']);
    mocks.promptGitignore.mockResolvedValue(true);
    process.stdin.isTTY = false;

    const withBoard = fs.mkdtempSync(path.join(os.tmpdir(), 'board-init-install-'));
    const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'board-init-install-'));
    try {
      await install(withBoard, { args: ['--providers', 'codex', '--enable-feature', 'board'] });
      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec.mock.calls[0][0].cwd).toBe(withBoard);
      exec.mockClear();
      await install(plain, { args: ['--providers', 'codex'] });
      expect(exec).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(withBoard, { recursive: true, force: true });
      fs.rmSync(plain, { recursive: true, force: true });
    }
  });
});

describe('board-init (CLI helper) -- one real spawn', () => {
  const rfix = treeFixture({
    prefix: 'board-init-real-',
    copy: [{ src: 'framwork/.codeadd', dest: '.codeadd' }],
    manifest: {
      at: '.codeadd/manifest.json',
      data: { version: '0.0.0', providers: [], features: {}, plugins: {}, hashes: {} },
    },
  });
  let boardDirEnv;
  let base;
  const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  beforeEach(() => {
    vi.clearAllMocks();
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'board-init-real-remote-'));
    boardDirEnv = process.env.CODEADD_BOARD_DIR;
    process.env.CODEADD_BOARD_DIR = path.join(base, 'clone');
    setBoardInitExec(null);
  });
  afterEach(() => {
    if (boardDirEnv === undefined) delete process.env.CODEADD_BOARD_DIR; else process.env.CODEADD_BOARD_DIR = boardDirEnv;
    fs.rmSync(base, { recursive: true, force: true });
    rfix.cleanup();
  });
  afterAll(() => rfix.dispose());

  it('leaves origin/board, the clone and board.json staged, with no code commit', () => {
    const bare = path.join(base, 'remote.git');
    git(base, ['init', '--bare', '-q', '--initial-branch=main', bare]);
    const proj = rfix.root();
    git(proj, ['init', '-q', '--initial-branch=main']);
    git(proj, ['config', 'user.email', 'test@test.com']);
    git(proj, ['config', 'user.name', 'Test']);
    git(proj, ['config', 'commit.gpgsign', 'false']);
    fs.writeFileSync(path.join(proj, 'code.txt'), 'code\n');
    git(proj, ['add', 'code.txt']);
    git(proj, ['commit', '-q', '-m', 'seed']);
    git(proj, ['remote', 'add', 'origin', bare]);
    git(proj, ['push', '-q', 'origin', 'main']);
    git(proj, ['remote', 'set-head', 'origin', 'main']);
    const head = git(proj, ['rev-parse', 'HEAD']).stdout;

    initBoardOnEnable(proj, 'board', { scope: 'project' });

    expect(log.warn).not.toHaveBeenCalled();
    expect(git(bare, ['rev-parse', '--verify', '--quiet', 'refs/heads/board']).status).toBe(0);
    expect(fs.existsSync(path.join(process.env.CODEADD_BOARD_DIR, '.git'))).toBe(true);
    expect(git(proj, ['diff', '--cached', '--name-only']).stdout.trim()).toBe('.codeadd/board.json');
    expect(git(proj, ['rev-parse', 'HEAD']).stdout).toBe(head);
  });
});

// ---------------------------------------------------------------------------
// 0070B -- no shipped text sends a user to a person for the board
// ---------------------------------------------------------------------------

describe('board-init -- shipped texts name the route, never a maintainer', () => {
  const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name === 'dist') return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

  it('no file under framwork/.codeadd, cli/src or board/src says "framework maintainer"', () => {
    const offenders = ['framwork/.codeadd', 'cli/src', 'board/src']
      .flatMap((d) => walk(path.join(ROOT, d)))
      .filter((f) => /framework maintainer/i.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(ROOT, f).replaceAll('\\', '/'));
    expect(offenders).toEqual([]);
  });

  it('add--backlog: the branch-missing row and the no-board row name board-init.cjs, migration-required names the README, uses lists the script', () => {
    const src = read('framwork/.codeadd/skills/add--backlog/SKILL.md');
    const row = (re) => src.split('\n').find((l) => re.test(l)) ?? '';
    expect(row(/^\| `ERROR=board-branch-missing` \|/)).toContain('board-init.cjs');
    expect(row(/^\| no board \(no config, no board file\) \|/)).toContain('board-init.cjs');
    expect(row(/^\| `ERROR=board-migration-required` \|/)).toContain('https://github.com/brabos-ai/code-addiction#board');
    expect(src).toMatch(/<!-- uses:[\s\S]*?- script: board-init\.cjs[\s\S]*?-->/);
  });

  it('add--ecosystem lists board-init.cjs in the script table and as a mention', () => {
    const src = read('framwork/.codeadd/skills/add--ecosystem/SKILL.md');
    expect(src).toMatch(/^\| board-init\.cjs \| add--backlog/m);
    expect(src).toContain('- mention: board-init.cjs');
  });

  it('agent-mode/board-management.md section 1 says how the board is created', () => {
    const src = read('framwork/.codeadd/agent-mode/board-management.md');
    const start = src.indexOf('## 1.');
    const end = src.indexOf('\n## 2.');
    expect(start).toBeGreaterThan(-1);
    const section = src.slice(start, end);
    expect(section).toMatch(/board-init\.cjs/);
    expect(section).toMatch(/enabling the `board` feature/i);
  });

  it('states.tsx keeps its state keys and titles, and the bodies point at the README and board-init', () => {
    const src = read('board/src/components/states.tsx');
    for (const key of ['board-migration-required', 'board-branch-missing', 'board-checkout-missing']) {
      expect(src).toContain(`'${key}'`);
    }
    expect(src).toContain('This project’s board has not been moved yet');
    expect(src).toContain('The board branch does not exist');
    expect(src).toContain('https://github.com/brabos-ai/code-addiction#board');
    expect(src).toContain('node .codeadd/scripts/board-init.cjs');
  });
});
