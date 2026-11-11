import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { installDocsRoot } from './helpers/brownfield-fixture.js';

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

import {
  MIGRATIONS,
  LEGACY_ORPHANS,
  allMigrationIds,
  pendingMigrations,
  runMigrations,
  migrate,
  retireBoard,
} from '../src/migrations.js';

let tmpDir;

/** Minimal installed project: .codeadd plus the given provider dests. */
function seedProject(dests = ['.claude', '.opencode']) {
  fs.mkdirSync(path.join(tmpDir, '.codeadd'), { recursive: true });
  installDocsRoot(tmpDir);
  return dests.map((dest, i) => ({ key: `p${i}`, dest }));
}

function writeManifestFile(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readManifestFile(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
}

/** Plant the legacy orphan under .codeadd and every provider dest. */
function plantOrphan(dests) {
  const planted = [];
  for (const base of ['.codeadd', ...dests]) {
    const full = path.join(tmpDir, base, LEGACY_ORPHANS[0]);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '// orphan');
    planted.push(full);
  }
  return planted;
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-migrations-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// L1 — Unit
// ---------------------------------------------------------------------------

describe('pendingMigrations (L1.2)', () => {
  it('returns every registry id when the ledger is absent', () => {
    expect(pendingMigrations(undefined).map((m) => m.id)).toEqual(allMigrationIds());
  });

  it('returns every registry id when the ledger is empty', () => {
    expect(pendingMigrations([]).map((m) => m.id)).toEqual(allMigrationIds());
  });

  it('returns every registry id when the ledger is an unknown shape', () => {
    for (const junk of [null, 'nope', 42, {}]) {
      expect(pendingMigrations(junk).map((m) => m.id)).toEqual(allMigrationIds());
    }
  });

  it('returns nothing when every id is already recorded', () => {
    expect(pendingMigrations(allMigrationIds())).toEqual([]);
  });

  it('ignores unknown ids in the ledger without dropping real pending ones', () => {
    expect(pendingMigrations(['9999-not-a-migration']).map((m) => m.id)).toEqual(allMigrationIds());
  });
});

describe('execution order (L1.3)', () => {
  it('follows id order regardless of registry array order', () => {
    const shuffled = [
      { id: '0003-c', description: 'c', run: () => ({}) },
      { id: '0001-a', description: 'a', run: () => ({}) },
      { id: '0002-b', description: 'b', run: () => ({}) },
    ];
    const ran = [];
    const registry = shuffled.map((m) => ({ ...m, run: () => { ran.push(m.id); return {}; } }));
    runMigrations({ cwd: tmpDir, providers: [] }, [], { registry });
    expect(ran).toEqual(['0001-a', '0002-b', '0003-c']);
  });
});

describe('dry run (L1.4)', () => {
  it('reports the same pending set and writes nothing to disk', () => {
    const providers = seedProject();
    const planted = plantOrphan(providers.map((p) => p.dest));

    const result = runMigrations({ cwd: tmpDir, providers }, [], { dryRun: true });

    expect(result.pending).toEqual(allMigrationIds());
    expect(result.applied).toEqual([]);
    for (const file of planted) expect(fs.existsSync(file)).toBe(true);
  });
});

describe('failure isolation (L1.5)', () => {
  it('reports a throwing migration as failed, does not record it, and keeps going', () => {
    const ran = [];
    const registry = [
      { id: '0001-boom', description: 'throws', run: () => { throw new Error('boom'); } },
      { id: '0002-ok', description: 'fine', run: () => { ran.push('0002-ok'); return {}; } },
    ];

    const result = runMigrations({ cwd: tmpDir, providers: [] }, [], { registry });

    expect(result.failed.map((f) => f.id)).toEqual(['0001-boom']);
    expect(result.applied).toEqual(['0002-ok']);
    expect(result.applied).not.toContain('0001-boom');
    expect(ran).toEqual(['0002-ok']);
  });

  it('never throws out of runMigrations even when every migration throws', () => {
    const registry = [{ id: '0001-boom', description: 'x', run: () => { throw new Error('boom'); } }];
    expect(() => runMigrations({ cwd: tmpDir, providers: [] }, [], { registry })).not.toThrow();
  });
});

describe('0001-prune-legacy-orphans (L1.6, L1.7)', () => {
  it('removes the legacy orphan from .codeadd and from each provider dir', () => {
    const providers = seedProject(['.claude', '.opencode', '.cursor']);
    const planted = plantOrphan(providers.map((p) => p.dest));

    const result = runMigrations({ cwd: tmpDir, providers }, []);

    for (const file of planted) expect(fs.existsSync(file)).toBe(false);
    expect(result.applied).toContain('0001-prune-legacy-orphans');
  });

  it('is a no-op that still records as applied when the file is already absent', () => {
    const providers = seedProject();
    const result = runMigrations({ cwd: tmpDir, providers }, []);
    expect(result.applied).toContain('0001-prune-legacy-orphans');
    expect(result.failed).toEqual([]);
  });

  it('performs work only on the first pass (L1.7)', () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));

    const first = runMigrations({ cwd: tmpDir, providers }, []);
    const second = runMigrations({ cwd: tmpDir, providers }, first.applied);

    expect(first.changes.length).toBeGreaterThan(0);
    expect(second.applied).toEqual([]);
    expect(second.changes).toEqual([]);
  });

  it('targets an explicit path list, never a glob', () => {
    expect(Array.isArray(LEGACY_ORPHANS)).toBe(true);
    for (const p of LEGACY_ORPHANS) {
      expect(p).not.toMatch(/[*?[\]]/);
    }
  });

  it('leaves neighbouring files in the same directory untouched', () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));
    const neighbour = path.join(tmpDir, '.claude', 'skills', 'add-skill-creator', 'SKILL.md');
    fs.writeFileSync(neighbour, '# keep me');

    runMigrations({ cwd: tmpDir, providers }, []);

    expect(fs.existsSync(neighbour)).toBe(true);
  });
});

describe('allMigrationIds (L1.8)', () => {
  it('matches the registry exactly', () => {
    expect(allMigrationIds()).toEqual(MIGRATIONS.map((m) => m.id));
  });

  it('is sorted, so ledger order never depends on array order', () => {
    expect(allMigrationIds()).toEqual([...allMigrationIds()].sort());
  });

  it('has no duplicate ids', () => {
    expect(new Set(allMigrationIds()).size).toBe(allMigrationIds().length);
  });
});

describe('ctx contract (L1.9)', () => {
  it('passes exactly { cwd, providers } to each migration', () => {
    let seen = null;
    const registry = [{ id: '0001-x', description: 'x', run: (ctx) => { seen = ctx; return {}; } }];
    const providers = seedProject();

    runMigrations({ cwd: tmpDir, providers }, [], { registry });

    expect(Object.keys(seen).sort()).toEqual(['cwd', 'providers']);
    expect(seen.cwd).toBe(tmpDir);
    expect(seen.providers).toBe(providers);
  });
});

// ---------------------------------------------------------------------------
// L2.9 / L2.10 — the manual command path
// ---------------------------------------------------------------------------

describe('migrate command (L2.9, L2.10)', () => {
  it('--list reports without mutating the manifest (L2.9)', async () => {
    const providers = seedProject();
    plantOrphan(providers.map((p) => p.dest));
    writeManifestFile(tmpDir, { version: '0.7.2', providers: [], files: [] });
    const before = fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8');

    await migrate(tmpDir, ['--list']);

    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')).toBe(before);
  });

  it('--dry-run leaves the orphan and the ledger alone', async () => {
    const providers = seedProject();
    const planted = plantOrphan(providers.map((p) => p.dest));
    writeManifestFile(tmpDir, { version: '0.7.2', providers: [], files: [] });

    await migrate(tmpDir, ['--dry-run']);

    for (const f of planted) expect(fs.existsSync(f)).toBe(true);
    expect(readManifestFile(tmpDir).migrations ?? []).toEqual([]);
  });

  it('runs pending migrations on a project already at the latest version (L2.10)', async () => {
    const providers = seedProject(['.claude']);
    const planted = plantOrphan(['.claude']);
    // Version matches the newest release: `update` would early-return here.
    writeManifestFile(tmpDir, { version: '0.7.2', providers: ['claude'], files: [] });

    await migrate(tmpDir, []);

    for (const f of planted) expect(fs.existsSync(f)).toBe(false);
    expect(readManifestFile(tmpDir).migrations).toContain('0001-prune-legacy-orphans');
    void providers;
  });

  it('records the ledger without dropping other manifest fields', async () => {
    seedProject(['.claude']);
    writeManifestFile(tmpDir, {
      version: '0.7.2',
      providers: ['claude'],
      files: ['a'],
      features: { 'tdd-pipeline': true },
      plugins: { gitnexus: true },
    });

    await migrate(tmpDir, []);

    const m = readManifestFile(tmpDir);
    expect(m.features).toEqual({ 'tdd-pipeline': true });
    expect(m.plugins).toEqual({ gitnexus: true });
    expect(m.files).toEqual(['a']);
  });

  it('refuses to run when no installation exists', async () => {
    await expect(migrate(tmpDir, [])).rejects.toThrow(/no add installation/i);
  });
});

// ---------------------------------------------------------------------------
// L3 — Behavioural acceptance
// ---------------------------------------------------------------------------

describe('behavioural acceptance (L3)', () => {
  it('L3.1 — cleans an orphan that is on disk but absent from manifest.files', async () => {
    seedProject(['.claude', '.opencode']);
    const planted = plantOrphan(['.claude', '.opencode']);
    // The install-path blind spot: on disk, invisible to any manifest diff.
    writeManifestFile(tmpDir, {
      version: '0.7.2',
      providers: ['claude', 'opencode'],
      files: ['.codeadd/scripts/status.sh'],
    });

    await migrate(tmpDir, []);

    for (const f of planted) expect(fs.existsSync(f)).toBe(false);
    expect(readManifestFile(tmpDir).migrations).toContain('0001-prune-legacy-orphans');
  });

  it('L3.2 — re-running reports nothing pending and touches no file', async () => {
    seedProject(['.claude']);
    writeManifestFile(tmpDir, { version: '0.7.2', providers: ['claude'], files: [] });
    await migrate(tmpDir, []);

    const keeper = path.join(tmpDir, '.claude', 'keep.md');
    fs.mkdirSync(path.dirname(keeper), { recursive: true });
    fs.writeFileSync(keeper, 'x');
    const snapshot = readManifestFile(tmpDir);

    await migrate(tmpDir, []);

    expect(fs.existsSync(keeper)).toBe(true);
    expect(readManifestFile(tmpDir).migrations).toEqual(snapshot.migrations);
  });
});

// ---------------------------------------------------------------------------
// 0006-retire-board (0075B) — the board feature is gone; the user's board data is not touched
// ---------------------------------------------------------------------------

describe('0006-retire-board (0075B)', () => {
  const BOARD_JSON = JSON.stringify({ remote: 'x', branch: 'board' });

  /** An install that had the board feature on, with its data around it. */
  function seedBoardInstall({ boardJson = true, features = { board: true, 'tdd-pipeline': true } } = {}) {
    writeManifestFile(tmpDir, { version: '1.0.0', providers: [], files: [], features });
    if (boardJson) fs.writeFileSync(path.join(tmpDir, '.codeadd', 'board.json'), BOARD_JSON, 'utf8');
  }

  it('the registry reads exactly 0001, 0002, 0003, 0006 — 0004 is gone and 0005 moved to docs migrate', () => {
    expect(MIGRATIONS.map((m) => m.id)).toEqual([
      '0001-prune-legacy-orphans',
      '0002-harvest-relations',
      '0003-retire-about-suffix',
      '0006-retire-board',
    ]);
    expect(allMigrationIds()).toEqual([...allMigrationIds()].sort());
    expect(MIGRATIONS.find((m) => m.id === '0006-retire-board').description).toMatch(/board/i);
  });

  it('a ledger that already holds 0004 gives no error and no pending entry for it', () => {
    const ledger = ['0004-sync-board-definitions', ...allMigrationIds()];
    expect(pendingMigrations(ledger).map((m) => m.id)).toEqual([]);
    const run = runMigrations({ cwd: tmpDir, providers: [] }, ledger);
    expect(run.failed).toEqual([]);
    expect(run.applied).toEqual([]);
    const partial = pendingMigrations(['0004-sync-board-definitions']);
    expect(partial.map((m) => m.id)).not.toContain('0004-sync-board-definitions');
    expect(partial.map((m) => m.id)).toContain('0006-retire-board');
  });

  it('with the flag on and board.json present: the flag goes, one note, board.json byte-identical', () => {
    seedBoardInstall();
    const out = retireBoard({ cwd: tmpDir });
    expect(readManifestFile(tmpDir).features).toEqual({ 'tdd-pipeline': true });
    expect(out.changes).toHaveLength(1);
    expect(out.notes).toHaveLength(1);
    expect(out.notes[0]).toMatch(/board was removed from the framework/);
    expect(out.notes[0]).toMatch(/untouched/);
    expect(out.notes[0]).toMatch(/board.{0,10}branch/);
    expect(out.notes[0]).toMatch(/\.codeadd\/board\.json/);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'board.json'), 'utf8')).toBe(BOARD_JSON);
  });

  it('never touches the board branch or the board clone', () => {
    seedBoardInstall();
    const git = (...args) => spawnSync('git', args, { cwd: tmpDir, encoding: 'utf8' });
    git('init', '-q', '-b', 'main');
    git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'init');
    git('branch', 'board');
    const clone = path.join(tmpDir, 'board-clone');
    fs.mkdirSync(path.join(clone, 'data'), { recursive: true });
    fs.writeFileSync(path.join(clone, 'data', 'backlog.jsonl'), '{"id":"0001B"}\n');
    const prior = process.env.CODEADD_BOARD_DIR;
    process.env.CODEADD_BOARD_DIR = clone;
    try {
      retireBoard({ cwd: tmpDir });
    } finally {
      if (prior === undefined) delete process.env.CODEADD_BOARD_DIR;
      else process.env.CODEADD_BOARD_DIR = prior;
    }
    expect(git('branch', '--list', 'board').stdout).toContain('board');
    expect(fs.readFileSync(path.join(clone, 'data', 'backlog.jsonl'), 'utf8')).toBe('{"id":"0001B"}\n');
  });

  it('with no board.json the flag goes and notes is empty', () => {
    seedBoardInstall({ boardJson: false });
    const out = retireBoard({ cwd: tmpDir });
    expect(readManifestFile(tmpDir).features).toEqual({ 'tdd-pipeline': true });
    expect(out.notes).toEqual([]);
    expect(fs.existsSync(path.join(tmpDir, '.codeadd', 'board.json'))).toBe(false);
  });

  it('a second run changes nothing', () => {
    seedBoardInstall();
    retireBoard({ cwd: tmpDir });
    const manifestAfterFirst = fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8');
    const again = retireBoard({ cwd: tmpDir });
    expect(again.changes).toEqual([]);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'utf8')).toBe(manifestAfterFirst);
    expect(fs.readFileSync(path.join(tmpDir, '.codeadd', 'board.json'), 'utf8')).toBe(BOARD_JSON);
  });

  it('a project with no manifest, or no board flag, is applied with no change', () => {
    expect(retireBoard({ cwd: tmpDir })).toEqual({ changes: [], notes: [] });
    seedBoardInstall({ boardJson: false, features: { 'tdd-pipeline': true } });
    expect(retireBoard({ cwd: tmpDir }).changes).toEqual([]);
  });

  it('through runMigrations 0006 is recorded as applied', () => {
    seedBoardInstall();
    const done = runMigrations({ cwd: tmpDir, providers: [] }, allMigrationIds().filter((id) => id !== '0006-retire-board'));
    expect(done.failed).toEqual([]);
    expect(done.applied).toEqual(['0006-retire-board']);
    expect(done.notes).toHaveLength(1);
  });
});
