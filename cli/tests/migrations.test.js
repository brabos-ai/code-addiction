import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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
  syncBoardDefinitions,
} from '../src/migrations.js';

let tmpDir;

/** Minimal installed project: .codeadd plus the given provider dests. */
function seedProject(dests = ['.claude', '.opencode']) {
  fs.mkdirSync(path.join(tmpDir, '.codeadd'), { recursive: true });
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
// 0004-sync-board-definitions (0057B)
// ---------------------------------------------------------------------------

describe('0004-sync-board-definitions (0057B)', () => {
  /** A project that points at a board and holds the shipped write entry. */
  function seedBoardProject({ script = true } = {}) {
    fs.mkdirSync(path.join(tmpDir, '.codeadd', 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'board.json'), JSON.stringify({ remote: 'x', branch: 'board' }), 'utf8');
    if (script) fs.writeFileSync(path.join(tmpDir, '.codeadd', 'scripts', 'backlog-commit.cjs'), '// stub', 'utf8');
  }
  const reply = (status, stdout = '', extra = {}) => () => ({ status, stdout, stderr: '', ...extra });
  const spy = (fn) => {
    const calls = [];
    const exec = (...args) => { calls.push(args); return fn(...args); };
    return { exec, calls };
  };

  it('L2.7 is registered, after 0003, and allMigrationIds stays sorted', () => {
    expect(MIGRATIONS.map((m) => m.id)).toContain('0004-sync-board-definitions');
    const ids = allMigrationIds();
    expect(ids).toEqual([...ids].sort());
    expect(ids.indexOf('0004-sync-board-definitions')).toBeGreaterThan(ids.indexOf('0003-retire-about-suffix'));
    expect(MIGRATIONS.find((m) => m.id === '0004-sync-board-definitions').description).toMatch(/board/i);
  });

  it('exits 0 with names: one change entry naming them', () => {
    seedBoardProject();
    const out = syncBoardDefinitions({ cwd: tmpDir }, reply(0, 'ROUTE=board\nDEFS_ADDED=refining,shaped\nCOMMITTED=yes\nPUSHED=yes\n'));
    expect(out.changes).toEqual(['board definitions: added refining, shaped']);
  });

  it('exits 0 with an empty list: one note, no change', () => {
    seedBoardProject();
    const out = syncBoardDefinitions({ cwd: tmpDir }, reply(0, 'ROUTE=board\nCOMMITTED=no\n'));
    expect(out.changes ?? []).toEqual([]);
    expect(out.notes).toEqual(['board definitions already hold every default status']);
  });

  it('a DEGRADED line becomes a note that names it', () => {
    seedBoardProject();
    const out = syncBoardDefinitions({ cwd: tmpDir }, reply(0, 'DEFS_ADDED=shaped\nCOMMITTED=yes\nPUSHED=no\nDEGRADED=push-refused\n'));
    expect(out.changes).toEqual(['board definitions: added shaped']);
    expect(out.notes.join(' ')).toContain('push-refused');
  });

  it('REFUSED=board-not-configured is applied with a note', () => {
    seedBoardProject();
    const out = syncBoardDefinitions({ cwd: tmpDir }, reply(2, 'REFUSED=board-not-configured\n'));
    expect(out.notes).toEqual(['no board in this project']);
  });

  it('REFUSED=definitions-unreadable throws, so the migration stays pending', () => {
    seedBoardProject();
    expect(() => syncBoardDefinitions({ cwd: tmpDir }, reply(2, 'REFUSED=definitions-unreadable\n'))).toThrow(/definitions-unreadable/);
  });

  it('a board error throws with the ERROR= line', () => {
    seedBoardProject();
    expect(() => syncBoardDefinitions({ cwd: tmpDir }, reply(1, 'ERROR=board-checkout-missing\n'))).toThrow(/board-checkout-missing/);
  });

  it('an older script that does not know the mode throws', () => {
    seedBoardProject();
    expect(() => syncBoardDefinitions({ cwd: tmpDir }, reply(2, 'ERROR=bad-mode\n'))).toThrow(/bad-mode/);
  });

  it('a timed-out or killed spawn throws', () => {
    seedBoardProject();
    expect(() => syncBoardDefinitions({ cwd: tmpDir }, () => ({ status: null, stdout: '', error: new Error('spawnSync ETIMEDOUT') }))).toThrow();
    expect(() => syncBoardDefinitions({ cwd: tmpDir }, () => ({ status: null, stdout: '', signal: 'SIGTERM' }))).toThrow();
  });

  it('no .codeadd/board.json: applied, silent, and the spawn never happens', () => {
    seedProject();
    const { exec, calls } = spy(reply(0, ''));
    const out = syncBoardDefinitions({ cwd: tmpDir }, exec);
    expect(calls).toHaveLength(0);
    expect(out.notes).toEqual([]);
    expect(out.changes).toEqual([]);
  });

  it('a board is configured but the script is not installed: applied with a note, no spawn', () => {
    seedBoardProject({ script: false });
    const { exec, calls } = spy(reply(0, ''));
    const out = syncBoardDefinitions({ cwd: tmpDir }, exec);
    expect(calls).toHaveLength(0);
    expect(out.notes).toEqual(['backlog-commit.cjs not installed; nothing to sync']);
  });

  it('the default spawn runs the installed entry with sync-defs, in the project directory', () => {
    seedBoardProject();
    fs.writeFileSync(
      path.join(tmpDir, '.codeadd', 'scripts', 'backlog-commit.cjs'),
      "process.stdout.write('DEFS_ADDED=' + process.argv[2] + '\\n');\n",
      'utf8',
    );
    const out = syncBoardDefinitions({ cwd: tmpDir });
    expect(out.changes).toEqual(['board definitions: added sync-defs']);
  });

  it('through runMigrations a throw leaves 0004 out of applied, and a clean run records it', () => {
    seedBoardProject();
    const registry = [{ id: '0004-sync-board-definitions', description: 'x', run: (ctx) => syncBoardDefinitions(ctx, reply(2, 'REFUSED=definitions-unreadable\n')) }];
    const failed = runMigrations({ cwd: tmpDir, providers: [] }, [], { registry });
    expect(failed.applied).toEqual([]);
    expect(failed.failed.map((f) => f.id)).toEqual(['0004-sync-board-definitions']);

    const ok = [{ id: '0004-sync-board-definitions', description: 'x', run: (ctx) => syncBoardDefinitions(ctx, reply(0, 'DEFS_ADDED=shaped\n')) }];
    const done = runMigrations({ cwd: tmpDir, providers: [] }, [], { registry: ok });
    expect(done.applied).toEqual(['0004-sync-board-definitions']);
    expect(done.changes).toEqual(['board definitions: added shaped']);
  });
});
