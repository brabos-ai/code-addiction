import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, log } from '@clack/prompts';
import { readManifest, saveManifest } from './injection-core.js';
import { resolveSelected } from './providers.js';
import { parse as parseYaml } from 'yaml';

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
      // The verb travels with the change. The reporter is neutral by F16, so a
      // change that does not say what happened to it reads as a bare path.
      changes.push(`removed ${root}/${rel}`);
    }
  }

  return { changes };
}


// ---------------------------------------------------------------------------
// 0002 — harvest the relationships a brownfield project already wrote
// ---------------------------------------------------------------------------

/**
 * The closed vocabulary, per the document format. `links_to` is the only type
 * this migration authors from a body reference or a `related:` id: those two
 * mean "connected" and neither knows why, and writing a guessed `depends_on`
 * would be worse than admitting the gap.
 */
const HARVEST_TYPES = { docRef: 'links_to', related: 'links_to', followUp: 'links_to' };

/**
 * Frontmatter, read with a REAL YAML parser.
 *
 * `cli/src` had none before this migration, and a hand-rolled reader over
 * user-authored YAML is the shortcut that mangles somebody's multi-line value.
 * This runs unattended inside `codeadd update`, so it gets the parser.
 *
 * A file this cannot parse is SKIPPED, never guessed at and never rewritten.
 */
function readFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  try {
    const parsed = parseYaml(content.slice(content.indexOf('\n') + 1, end + 1));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** The body of one H2 section, or '' when absent. */
function sectionBody(content, heading) {
  const re = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = re.exec(content);
  if (!match) return '';
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** Every `{{doc:ID}}` in the body, with the sentence around it as its reason. */
function docRefsWithReason(content) {
  const body = content.replace(/^---[\s\S]*?\n---\n/, '');
  const out = [];
  for (const match of body.matchAll(/\{\{doc:([^}]+)\}\}/g)) {
    const before = body.slice(0, match.index);
    const start = Math.max(before.lastIndexOf('. ') + 1, before.lastIndexOf('\n\n') + 1, 0);
    const after = body.slice(match.index);
    const stop = after.search(/[.!?](\s|$)/);
    const sentence = (before.slice(start) + (stop === -1 ? after : after.slice(0, stop + 1)))
      .replace(/\s+/g, ' ')
      .replace(/^[-*\s]+/, '')
      .trim();
    out.push({ id: match[1].trim(), why: sentence || null });
  }
  return out;
}

/** Ids already declared in a `## Relations` section, so a re-run adds nothing. */
function declaredTargets(content) {
  const body = sectionBody(content, 'Relations');
  return new Set([...body.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim()));
}

/** One relation line, with its reason when the source carried one. */
function relationLine(type, id, why) {
  // The em dash is the format's separator. A `why` carrying a newline would
  // break the one-line grammar, so it is flattened rather than dropped.
  const reason = why ? ` — ${why.replace(/\s+/g, ' ').trim()}` : '';
  return `- ${type} [[${id}]]${reason}`;
}

/**
 * Append lines to `## Relations`, creating the section when it is absent.
 *
 * ⛔ ADDITIVE ONLY. It never deletes and never rewrites a line the user wrote.
 * That single rule is what makes a partial failure harmless, makes idempotency
 * trivial, and makes it safe to run unattended. The section is appended at the
 * END of the document when absent, because inserting it between two existing
 * sections would move lines somebody else wrote.
 */
function appendRelations(content, lines) {
  if (lines.length === 0) return content;
  const heading = /^## Relations\s*$/m.exec(content);
  if (!heading) {
    const tail = content.endsWith('\n') ? '' : '\n';
    return `${content}${tail}\n## Relations\n${lines.join('\n')}\n`;
  }
  const rest = content.slice(heading.index + heading[0].length);
  const next = rest.search(/^## /m);
  const sectionEnd = heading.index + heading[0].length + (next === -1 ? rest.length : next);
  const head = content.slice(0, sectionEnd).replace(/\s+$/, '');
  return `${head}\n${lines.join('\n')}\n${next === -1 ? '' : '\n'}${content.slice(sectionEnd)}`;
}

/**
 * Harvest the relationships a project already wrote, into the format that reads
 * them.
 *
 * WHAT IT SCANS, AND HOW IT TELLS ONE DOCUMENT FROM ANOTHER: it walks `docs/`
 * and reads the FRONTMATTER of each `.md` to decide what the file is. A
 * recognised `type:` key means codeadd wrote it; no `type:` key means the file
 * belongs to the user and is skipped and reported. That is the rule that
 * survives a `docs/` tree holding the user's own material beside codeadd's,
 * which is what every real installation looks like. A path glob would need an
 * exclusion list somebody maintains forever.
 *
 * Once a file is eligible, its BODY is read too — three of the five sources
 * live there. "Reads only frontmatter" governs the eligibility check, not the
 * harvest.
 *
 * THIS IS THE REGISTRY'S FIRST MIGRATION TO TOUCH USER-AUTHORED FILES, which is
 * why the glob, the type detection and the additive-only rule are stated here
 * rather than left to whoever reads this next.
 *
 * IT DOES NOT COMMIT. It leaves the working tree dirty and reports the file
 * count. Reviewing that diff is the judgement the CLI cannot make.
 *
 * @param {{cwd: string}} ctx
 */
function harvestRelations(ctx) {
  const docsRoot = path.join(ctx.cwd, 'docs');
  const changes = [];
  const notes = [];
  const unresolved = [];
  const failed = [];
  const harvest = { docRefs: 0, related: 0, followUps: 0, impactedFiles: 0, superseded: 0 };
  let skipped = 0;

  if (!fs.existsSync(docsRoot)) return { changes, notes, unresolved, harvest, skipped, failed };

  // --- pass 1: what exists, and what kind of thing each file is -------------
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) files.push(full);
    }
  };
  walk(docsRoot);

  const byId = new Map();
  const eligible = [];
  for (const full of files.sort()) {
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch (err) {
      failed.push({ path: path.relative(ctx.cwd, full), error: err.message });
      continue;
    }
    const frontmatter = readFrontmatter(content);
    if (!frontmatter || !frontmatter.type) {
      skipped += 1;
      continue;
    }
    const record = { full, rel: path.relative(ctx.cwd, full), content, frontmatter };
    eligible.push(record);
    // An id resolves against the documents ON DISK rather than through a
    // reordering rule: the legacy lists mix `F0042` with `PRD0009` and only
    // work-type letters have a suffix form. The filesystem answers it, so there
    // is no rule to get wrong.
    if (frontmatter.id && !byId.has(String(frontmatter.id))) byId.set(String(frontmatter.id), record);
  }

  const isWorkItem = (r) => String(r.frontmatter.type).endsWith('-about');
  const workItems = eligible.filter(isWorkItem);
  const nodeIds = new Set(workItems.map((r) => String(r.frontmatter.id)));

  // --- pass 2: harvest, per work item --------------------------------------
  for (const item of workItems) {
    const id = String(item.frontmatter.id);
    const already = declaredTargets(item.content);
    // ONE LINE PER TARGET, AND THE BEST SOURCE WINS RATHER THAN THE FIRST.
    // Several sources can name the same document and only some carry a reason:
    // a `related:` id knows nothing, while a Follow-up sentence is the `why`
    // the format wants. Emitting on first sight would let the poorest source
    // beat the richest purely on the order they happen to be read in.
    const candidates = new Map();

    const add = (type, targetId, why, counter) => {
      const target = String(targetId).trim();
      if (!target || target === id) return;
      if (!nodeIds.has(target)) {
        // An id resolving to no work item produces NO line and is reported.
        if (!unresolved.some((u) => u.from === id && u.id === target)) {
          unresolved.push({ from: id, id: target });
        }
        return;
      }
      harvest[counter] += 1;
      if (already.has(target)) return;
      // `superseded_by` is COUNTED AND NOT WRITTEN. It is already the status
      // edge it needs to be, in frontmatter, and the indexer reads it straight
      // from there — duplicating it into `## Relations` would put a type
      // outside the closed vocabulary into a section the schema gate rejects.
      if (type === null) return;
      const current = candidates.get(target);
      // A reason outranks no reason; otherwise the first one stands.
      const better = !current || (!current.why && why);
      if (better) candidates.set(target, { type, why });
    };

    // Sources that live in the work item's own document.
    for (const ref of docRefsWithReason(item.content)) {
      add(HARVEST_TYPES.docRef, ref.id, ref.why, 'docRefs');
    }
    const related = item.frontmatter.related;
    if (Array.isArray(related)) {
      for (const target of related) add(HARVEST_TYPES.related, target, null, 'related');
    }
    if (item.frontmatter.superseded_by) {
      add(null, item.frontmatter.superseded_by, null, 'superseded');
    }

    // Sources that live in a sibling attachment, attributed to this work item.
    const dir = path.dirname(item.full);
    for (const sibling of eligible) {
      if (sibling === item || path.dirname(sibling.full) !== dir) continue;

      const followUps = sectionBody(sibling.content, 'Follow-ups');
      if (followUps) {
        for (const line of followUps.split('\n')) {
          for (const ref of docRefsWithReason(line)) {
            add(HARVEST_TYPES.followUp, ref.id, ref.why, 'followUps');
          }
        }
      }
      // The file list is read by the INDEX, straight from this attachment, so
      // nothing is written for it here. It is counted because the migration
      // report is what tells a user the list was found.
      if (sectionBody(sibling.content, 'Impacted Files')) harvest.impactedFiles += 1;
    }

    const lines = [...candidates.entries()].map(([target, pick]) =>
      relationLine(pick.type, target, pick.why),
    );
    if (lines.length === 0) continue;
    const next = appendRelations(item.content, lines);
    if (next === item.content) continue;
    try {
      fs.writeFileSync(item.full, next, 'utf8');
      changes.push(`updated ${item.rel.replace(/\\/g, '/')} (+${lines.length} relation)`);
    } catch (err) {
      failed.push({ path: item.rel, error: err.message });
    }
  }

  // THE REPORT IS WHAT MAKES THE DIFF REVIEWABLE. Reviewing it is the judgement
  // the CLI cannot make, and a user cannot review what they were not told.
  const recovered = Object.entries(harvest)
    .filter(([, count]) => count > 0)
    .map(([source, count]) => `${source} ${count}`)
    .join(', ');
  if (recovered) notes.push(`harvested ${recovered}`);
  if (skipped > 0) {
    notes.push(`skipped ${skipped} file(s) carrying no type: key — those are yours, not codeadd's`);
  }
  for (const item of unresolved) {
    notes.push(`unresolved: ${item.from} names ${item.id}, which resolves to no work item — no line written`);
  }

  return { changes, notes, unresolved, harvest, skipped, failed };
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
  {
    id: '0002-harvest-relations',
    description: 'Harvest the relationships docs/ already carries into ## Relations — additive only, no commit',
    run: harvestRelations,
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
 * @returns {{pending: string[], applied: string[], failed: {id: string, error: string}[], changes: string[], notes: string[]}}
 */
export function runMigrations(ctx, applied, options = {}) {
  const { dryRun = false, registry = MIGRATIONS } = options;
  const pending = pendingMigrations(applied, registry);
  const result = { pending: pending.map((m) => m.id), applied: [], failed: [], changes: [], notes: [] };

  if (dryRun) return result;

  for (const migration of pending) {
    try {
      const outcome = migration.run({ cwd: ctx.cwd, providers: ctx.providers }) || {};
      result.applied.push(migration.id);
      result.changes.push(...(outcome.changes ?? []));
      // A MIGRATION'S REPORT IS NOT ITS CHANGE LIST, AND DROPPING IT IS A
      // SILENT FAILURE. `changes` says what was written; `notes` says what the
      // migration FOUND and could not act on — an id that resolves to no
      // document, a file skipped because it carries no `type:`. The harvest
      // computed all of that and it reached nobody until this line existed.
      result.notes.push(...(outcome.notes ?? []));
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

  for (const change of result.changes) log.success(`Migration: ${change}`);
  for (const note of result.notes ?? []) log.info(`Migration: ${note}`);
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
