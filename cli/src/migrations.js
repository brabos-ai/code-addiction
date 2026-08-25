import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, log } from '@clack/prompts';
import { readManifest, saveManifest } from './injection-core.js';
import { resolveSelected } from './providers.js';

/**
 * Files that releases up to v0.7.1 shipped and v0.7.2+ does not.
 *
 * EXPLICIT PATHS ONLY — never a glob. A pattern would be shorter and would
 * still pass the tests, and would also delete files nobody authorised. Each
 * entry is resolved against `.codeadd/` and against every installed provider
 * dir, and is relative to those roots.
 */
export const LEGACY_ORPHANS = ['skills/add-skill-creator/render-graphs.js'];

/**
 * Remove the legacy orphans from every root this project installed into.
 *
 * This exists because the declarative manifest diff cannot reach them. A
 * project that ran `install` (rather than `update`) had its `manifest.files`
 * overwritten with the new list, so a file dropped by that release is on disk
 * and absent from the record — invisible to every future diff, forever. The
 * install-path prune fixes that going forward; it cannot see backwards.
 *
 * @param {{cwd: string, providers: {dest: string}[]}} ctx
 * @returns {{changes: string[]}}
 */
function pruneLegacyOrphans(ctx) {
  const roots = ['.codeadd', ...ctx.providers.map((p) => p.dest)];
  const changes = [];

  for (const root of roots) {
    for (const rel of LEGACY_ORPHANS) {
      const full = path.join(ctx.cwd, root, rel);
      if (!fs.existsSync(full)) continue;
      fs.unlinkSync(full);
      changes.push(`${root}/${rel}`);
    }
  }

  return { changes };
}

/**
 * The ordered migration registry.
 *
 * A migration is `{ id, description, run(ctx) }` where ctx is `{ cwd, providers }`.
 * `run` must be idempotent: it is recorded once, but a project whose ledger was
 * lost will run it again, and that must be harmless.
 */
export const MIGRATIONS = [
  {
    id: '0001-prune-legacy-orphans',
    description: 'Remove files shipped up to v0.7.1 that no later release ships',
    run: pruneLegacyOrphans,
  },
];

/**
 * Every known migration id, sorted. Callers stamp this into a fresh install's
 * manifest so a pristine project never runs the back-catalogue.
 * @returns {string[]}
 */
export function allMigrationIds(registry = MIGRATIONS) {
  return registry.map((m) => m.id).sort();
}

/**
 * Migrations not yet recorded in the ledger, in id order.
 *
 * An absent, empty or malformed ledger all mean the same thing — nothing has
 * been applied — because a project predating this mechanism carries no field
 * at all, and a corrupted one must not silently skip repairs.
 *
 * @param {string[] | unknown} applied
 * @returns {{id: string, description: string, run: Function}[]}
 */
export function pendingMigrations(applied, registry = MIGRATIONS) {
  const ledger = new Set(Array.isArray(applied) ? applied : []);
  return [...registry].sort((a, b) => a.id.localeCompare(b.id)).filter((m) => !ledger.has(m.id));
}

/**
 * Run every pending migration in id order.
 *
 * NEVER THROWS. A migration that fails is reported and left out of the ledger
 * so the next run retries it, and the remaining migrations still run — an
 * update must not break because a repair did.
 *
 * @param {{cwd: string, providers: {dest: string}[]}} ctx
 * @param {string[]} applied  the current ledger
 * @param {{dryRun?: boolean, registry?: object[]}} [options]
 * @returns {{pending: string[], applied: string[], failed: {id: string, error: string}[], changes: string[]}}
 */
export function runMigrations(ctx, applied, options = {}) {
  const { dryRun = false, registry = MIGRATIONS } = options;
  const pending = pendingMigrations(applied, registry);
  const result = { pending: pending.map((m) => m.id), applied: [], failed: [], changes: [] };

  if (dryRun) return result;

  for (const migration of pending) {
    try {
      const outcome = migration.run({ cwd: ctx.cwd, providers: ctx.providers }) || {};
      result.applied.push(migration.id);
      result.changes.push(...(outcome.changes ?? []));
    } catch (err) {
      result.failed.push({ id: migration.id, error: err.message });
    }
  }

  return result;
}

/**
 * `codeadd migrate` — the manual driver.
 *
 * Required, not a convenience: `update` returns early when the project is
 * already on the latest version, so a project that needs a repair but no new
 * files has no other vehicle.
 */
export async function migrate(cwd, args = [], scope = 'project') {
  const manifest = readManifest(cwd);
  if (!manifest) {
    throw new Error('No ADD installation found. Run `npx codeadd install` first.');
  }

  const listOnly = args.includes('--list');
  const dryRun = args.includes('--dry-run');

  intro('ADD CLI - Migrate');

  const ledger = Array.isArray(manifest.migrations) ? manifest.migrations : [];
  const providers = resolveSelected(manifest.providers ?? [], manifest.scope ?? scope);
  const pending = pendingMigrations(ledger);

  if (listOnly) {
    for (const id of ledger) log.info(`applied  ${id}`);
    for (const m of pending) log.warn(`pending  ${m.id} — ${m.description}`);
    if (!ledger.length && !pending.length) log.info('No migrations defined.');
    outro('Done.');
    return;
  }

  if (pending.length === 0) {
    log.info('Nothing pending.');
    outro('Done.');
    return;
  }

  const result = runMigrations({ cwd, providers }, ledger, { dryRun });

  if (dryRun) {
    for (const id of result.pending) log.info(`would run  ${id}`);
    outro('Dry run — nothing written.');
    return;
  }

  for (const change of result.changes) log.success(`removed ${change}`);
  for (const failure of result.failed) log.warn(`${failure.id} failed: ${failure.error}`);

  if (result.applied.length > 0) {
    // Read-modify-write the whole object so no sibling field is dropped.
    const current = readManifest(cwd) ?? manifest;
    current.migrations = [...ledger, ...result.applied].sort();
    saveManifest(cwd, current);
    log.success(`Applied ${result.applied.length} migration(s).`);
  }

  outro('Done.');
}
