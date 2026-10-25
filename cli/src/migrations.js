import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
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
    // THE BOUNDARY IS A TERMINATOR FOLLOWED BY ANY WHITESPACE, newline
    // included. Matching '. ' alone swallows every earlier sentence of a
    // paragraph that wraps — which an extractive document always does — and the
    // reason then carries three sentences and names the wrong document.
    const boundary = [...before.matchAll(/[.!?]\s/g)].pop();
    const start = Math.max(
      boundary ? boundary.index + boundary[0].length : 0,
      before.lastIndexOf('\n\n') + 2,
      0,
    );
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

/** The ids a `## Relations` section points at, whatever the type. */
function parseRelationsOf(content) {
  const body = sectionBody(content, 'Relations');
  return { relations: [...body.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].trim()) };
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
  const harvest = { docRefs: 0, related: 0, followUps: 0, superseded: 0 };
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

  // ⛔ NOT `endsWith('-about')`. That was a SECOND suffix test, invisible to the
  //    artefact graph because this file is not an artefact, and it survived the
  //    rename: against renamed documents it matched nothing and the harvest
  //    became a permanent silent no-op — in the lost-ledger case this file
  //    handles explicitly, on a project that had already migrated.
  const WORK_ITEM_TYPES = new Set(['feature', 'hotfix', ...Object.keys(RETIRED_TYPE_NAMES)]);
  const isWorkItem = (r) => WORK_ITEM_TYPES.has(String(r.frontmatter.type));
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

    // Sources that live in an attachment, attributed to this work item.
    //
    // BOTH LAYOUTS, per design decision 30. A sibling in the same directory
    // belongs to this item; so does an attachment anywhere that names this item
    // in its own `## Relations` or `related:` — which is how a
    // `docs/changelog/CHG[NNNN].md` reaches the work item it delivered, having
    // no *-about sibling of its own.
    const dir = path.dirname(item.full);
    const belongsToItem = (sibling) => {
      if (path.dirname(sibling.full) === dir) return true;
      const { relations } = parseRelationsOf(sibling.content);
      if (relations.some((r) => r === id)) return true;
      const related = sibling.frontmatter.related;
      return Array.isArray(related) && related.some((r) => String(r).trim() === id);
    };
    for (const sibling of eligible) {
      if (sibling === item || isWorkItem(sibling) || !belongsToItem(sibling)) continue;

      const followUps = sectionBody(sibling.content, 'Follow-ups');
      if (followUps) {
        for (const line of followUps.split('\n')) {
          for (const ref of docRefsWithReason(line)) {
            add(HARVEST_TYPES.followUp, ref.id, ref.why, 'followUps');
          }
        }
      }

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
/**
 * The type names a document carried before the type registry existed.
 *
 * ⛔ THIS IS THE ONLY PLACE A RETIRED NAME SURVIVES, and it survives as a
 *    MIGRATION INPUT, never as something a reader consults. `mcp/types.mjs`
 *    declares what a type is; this map declares what a type WAS, for exactly
 *    one pass over a project written before the rename.
 */
const RETIRED_TYPE_NAMES = {
  'feature-about': 'feature',
  'hotfix-about': 'hotfix',
};

/**
 * The id a wiki page answered by before identity was declared.
 *
 * `mcp/corpora.mjs` derived this from the path and no longer does — identity is
 * a declared `id:`. The transform lives here because this migration is its only
 * remaining user; `cli/tests/mcp-document-model.test.js` L3.2 pins the two
 * together by asserting no query result changes after 0003 runs.
 */
function wikiIdFromPath(relPath) {
  const posix = relPath.replace(/\\/g, '/');
  const marker = '.codeadd/wiki/';
  const after = posix.slice(posix.indexOf(marker) + marker.length);
  return `wiki/${after.replace(/\.md$/, '')}`;
}

/**
 * Rewrite the retired type names, and write each wiki page the id it already
 * answered by.
 *
 * ⛔ TARGETED LINE SUBSTITUTION, NEVER A YAML ROUND-TRIP. Parsing the
 *    frontmatter and re-serialising it would leave every body byte-identical
 *    and still reorder keys, drop comments and renormalise quotes on every
 *    other field — passing the body check while rewriting the user's file. Only
 *    the `type:` line is replaced, and `id:` is inserted as one new line.
 *
 * Additive and non-destructive like 0002: it never deletes a file, never
 * commits, and reports every document it could not read instead of skipping it.
 */
function retireAboutSuffix(ctx) {
  const changes = [];
  const notes = [];
  const failed = [];

  const roots = [path.join(ctx.cwd, 'docs'), path.join(ctx.cwd, '.codeadd', 'wiki')];
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) files.push(full);
    }
  };
  for (const r of roots) walk(r);

  let renamed = 0;
  let identified = 0;

  for (const full of files.sort()) {
    const rel = path.relative(ctx.cwd, full).replace(/\\/g, '/');
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch (err) {
      failed.push({ path: rel, error: err.message });
      continue;
    }

    const frontmatter = readFrontmatter(content);
    if (!frontmatter) {
      // A `---` opener that does not parse is REPORTED, never passed over. A
      // document codeadd cannot read is the one most likely to need the rename.
      if (/^---\s*$/.test((content.split('\n')[0] ?? '').trim())) {
        failed.push({ path: rel, error: 'frontmatter present but unreadable' });
      }
      continue;
    }

    let next = content;
    const type = frontmatter.type ? String(frontmatter.type) : null;

    if (type && RETIRED_TYPE_NAMES[type]) {
      next = next.replace(new RegExp(`^type: ${type}[ \t]*$`, 'm'), `type: ${RETIRED_TYPE_NAMES[type]}`);
      renamed += 1;
      changes.push(`${rel}: type ${type} -> ${RETIRED_TYPE_NAMES[type]}`);
    }

    if (rel.includes('.codeadd/wiki/') && type && !frontmatter.id) {
      const id = wikiIdFromPath(rel);
      // Inserted directly after the opening `---`, so every existing key keeps
      // its line, its order and its spelling.
      next = next.replace(/^---\r?\n/, (m) => `${m}id: ${id}\n`);
      identified += 1;
      changes.push(`${rel}: id ${id} written from its path`);
    }

    if (next !== content) fs.writeFileSync(full, next, 'utf8');
  }

  if (renamed) notes.push(`renamed ${renamed} retired type value(s)`);
  if (identified) notes.push(`wrote ${identified} wiki page id(s) from their path`);
  for (const f of failed) notes.push(`could not read ${f.path}: ${f.error}`);

  return { changes, notes, failed };
}

// ---------------------------------------------------------------------------
// 0004 — an existing board definitions file gains the default statuses it lacks
// ---------------------------------------------------------------------------

/** The installed write entry, run in the project. The bound covers the 30 s lock wait, the fetch and the push. */
function defaultExec(ctx) {
  return spawnSync(process.execPath, ['.codeadd/scripts/backlog-commit.cjs', 'sync-defs'], {
    cwd: ctx.cwd,
    encoding: 'utf8',
    timeout: 120000,
  });
}

/** The KEY=VALUE lines the write entry prints; the first occurrence of a key wins. */
function parseReport(stdout) {
  const kv = {};
  for (const line of String(stdout ?? '').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq > 0 && /^[A-Z_]+$/.test(line.slice(0, eq)) && !(line.slice(0, eq) in kv)) kv[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return kv;
}

/**
 * Add the default statuses the board's definitions file lacks.
 *
 * THE BOARD IS NOT IN THE CHECKOUT, so this does not read it. It runs the
 * project's installed `backlog-commit.cjs sync-defs` — the one write route, with
 * its lock, its fetch, its commit and its push to the `board` branch — and maps
 * the report. Nothing here duplicates board resolution or git.
 *
 * Applied (silently when no board is configured): no write entry installed, no board in the
 * project, or exit 0. Everything else THROWS, so the migration stays pending and
 * the next `migrate` / `update` retries it — an unreadable definitions file or a
 * board error marked applied would hide the repair for good. `exec` is injectable
 * for tests only.
 *
 * @param {{cwd: string}} ctx
 * @param {(ctx: {cwd: string}) => {status: number|null, stdout?: string, error?: Error, signal?: string|null}} [exec]
 */
export function syncBoardDefinitions(ctx, exec = defaultExec) {
  if (!fs.existsSync(path.join(ctx.cwd, '.codeadd', 'board.json'))) {
    // Silent: most projects have no board, and a line on every `update` would be noise.
    return { changes: [], notes: [] };
  }
  if (!fs.existsSync(path.join(ctx.cwd, '.codeadd', 'scripts', 'backlog-commit.cjs'))) {
    return { changes: [], notes: ['backlog-commit.cjs not installed; nothing to sync'] };
  }

  const res = exec(ctx);
  if (res.error || res.signal) {
    throw new Error(`board definitions sync did not finish: ${res.error ? res.error.message : `killed by ${res.signal}`}`);
  }
  const kv = parseReport(res.stdout);

  if (res.status === 0) {
    const notes = [];
    const added = (kv.DEFS_ADDED ?? '').split(',').filter(Boolean);
    if (kv.DEGRADED) {
      notes.push(`board definitions were committed in the board clone but not pushed (DEGRADED=${kv.DEGRADED}); the next board write pushes them`);
    }
    if (added.length === 0) {
      notes.unshift('board definitions already hold every default status');
      return { changes: [], notes };
    }
    return { changes: [`board definitions: added ${added.join(', ')}`], notes };
  }
  if (res.status === 2 && kv.REFUSED === 'board-not-configured') {
    return { changes: [], notes: ['no board in this project'] };
  }
  const why = kv.REFUSED ? `REFUSED=${kv.REFUSED}` : kv.ERROR ? `ERROR=${kv.ERROR}` : `exit ${res.status}`;
  throw new Error(`board definitions sync failed: ${why}`);
}

// ---------------------------------------------------------------------------
// 0005 — the QA config and receipt move into .codeadd/settings.json
// ---------------------------------------------------------------------------

/**
 * The last `add-qa-setup` shape shipped before the QA state moved into
 * `.codeadd/settings.json` (v1.6.0). A receipt that recorded exactly this shape
 * was current, so the migration does the re-materialize and stamps the new one.
 */
export const PRE_SETTINGS_QA_SHAPE = 'sha256:25b937ee17628d6b';

const QA_OLD_CONFIG = 'docs/qa/config.json';
const QA_OLD_RECEIPT = 'docs/qa/qa-setup.md';
// Frontmatter keys of the markdown receipt that have no meaning as JSON fields.
const QA_RECEIPT_DROPPED = new Set(['id', 'type', 'created', 'updated', 'related', 'command']);

/** YAML reads an unquoted date as a Date; the settings file keeps ISO date strings. */
function plainJson(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(plainJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plainJson(v)]));
  }
  return value;
}

/** The `## Decision Log` table rows, as `qa.log` entries, in file order. */
function decisionLogEntries(content) {
  const entries = [];
  for (const line of sectionBody(content, 'Decision Log').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    if (/^date$/i.test(cells[0]) || /^:?-{2,}:?$/.test(cells[0])) continue;
    entries.push({
      date: cells[0],
      item: 'qa-setup',
      decision: cells[2],
      reason: cells.slice(3).join(' | '),
      shape: cells[1],
    });
  }
  return entries;
}

function sha256Of(text) {
  return 'sha256:' + crypto.createHash('sha256').update(text).digest('hex');
}

function readJsonFile(full, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    throw new Error(`${label} is not readable JSON: ${err.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} is not a JSON object`);
  }
  return parsed;
}

/**
 * Move `docs/qa/config.json` and `docs/qa/qa-setup.md` into the `qa` section of
 * `.codeadd/settings.json` (schema: the `add--settings` skill).
 *
 * Reads and parses EVERYTHING before it writes anything, so a malformed old file
 * throws with nothing changed — the failure is reported, not recorded, and the next
 * update retries. It changes files only and never commits, like 0002.
 *
 * @param {{cwd: string, providers: {dest: string}[]}} ctx
 * @returns {{changes: string[], notes: string[]}}
 */
export function migrateQaSettings(ctx) {
  const configPath = path.join(ctx.cwd, QA_OLD_CONFIG);
  const receiptPath = path.join(ctx.cwd, QA_OLD_RECEIPT);
  const hasConfig = fs.existsSync(configPath);
  const hasReceipt = fs.existsSync(receiptPath);
  if (!hasConfig && !hasReceipt) return { changes: [], notes: ['no QA setup to migrate'] };

  const changes = [];
  const notes = [];

  // --- read + parse, nothing written ------------------------------------------------
  const config = hasConfig ? readJsonFile(configPath, QA_OLD_CONFIG) : {};

  let frontmatter = {};
  let receiptText = '';
  if (hasReceipt) {
    receiptText = fs.readFileSync(receiptPath, 'utf8');
    frontmatter = readFrontmatter(receiptText);
    if (!frontmatter) throw new Error(`${QA_OLD_RECEIPT} has no readable frontmatter`);
  }

  const settingsPath = path.join(ctx.cwd, '.codeadd', 'settings.json');
  const settings = fs.existsSync(settingsPath) ? readJsonFile(settingsPath, '.codeadd/settings.json') : { schema: 1 };
  const existingQa = settings.qa && typeof settings.qa === 'object' && !Array.isArray(settings.qa) ? settings.qa : null;

  // --- build the qa section ---------------------------------------------------------
  const receiptFields = {};
  for (const [key, value] of Object.entries(plainJson(frontmatter))) {
    if (!QA_RECEIPT_DROPPED.has(key)) receiptFields[key] = value;
  }

  const recorded = typeof receiptFields['setup-shape'] === 'string' ? receiptFields['setup-shape'] : '';
  if (recorded === PRE_SETTINGS_QA_SHAPE) {
    let shipped = '';
    try {
      const contracts = readJsonFile(path.join(ctx.cwd, '.codeadd', 'contracts.json'), '.codeadd/contracts.json');
      const shape = contracts.contracts && contracts.contracts['add-qa-setup'] && contracts.contracts['add-qa-setup'].shape;
      if (typeof shape === 'string' && /^sha256:[0-9a-f]+$/.test(shape)) shipped = shape;
    } catch {
      shipped = '';
    }
    if (shipped) {
      receiptFields['setup-shape'] = shipped;
    } else {
      notes.push('.codeadd/contracts.json has no readable add-qa-setup shape; the recorded setup-shape was copied unchanged, so /add-qa-setup will flag the project STALE');
    }
  }

  // The generated qa-project skill names the old config path; rewrite it and refresh its hash.
  const materialized = Array.isArray(receiptFields.materialized) ? receiptFields.materialized : [];
  const skillRels = new Set(ctx.providers.map((p) => `${p.dest}/skills/qa-project/SKILL.md`));
  for (const entry of materialized) {
    if (entry && typeof entry.path === 'string' && /qa-project\/SKILL\.md$/.test(entry.path)) skillRels.add(entry.path);
  }
  const skillRewrites = [];
  if (!existingQa) {
    for (const rel of skillRels) {
      const full = path.join(ctx.cwd, rel);
      if (!fs.existsSync(full)) continue;
      const before = fs.readFileSync(full, 'utf8');
      const after = before
        .split(`\`${QA_OLD_CONFIG}\``).join('`.codeadd/settings.json` (`qa`)')
        .split(QA_OLD_CONFIG).join('.codeadd/settings.json');
      if (after !== before) skillRewrites.push({ rel, full, after });
    }
  }
  if (materialized.length) {
    receiptFields.materialized = materialized.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      if (entry.path === QA_OLD_CONFIG) return { path: '.codeadd/settings.json', owner: 'shared', hash: null };
      const rewrite = skillRewrites.find((r) => r.rel === entry.path);
      if (rewrite && entry.hash) return { ...entry, hash: sha256Of(rewrite.after) };
      return entry;
    });
  }

  const log = decisionLogEntries(receiptText);
  const migrationEntry = {
    date: new Date().toISOString().slice(0, 10),
    item: 'qa-setup',
    decision: 'migrated to .codeadd/settings.json',
    reason: 'migration 0005',
  };
  if (receiptFields['setup-shape']) migrationEntry.shape = receiptFields['setup-shape'];
  log.push(migrationEntry);

  const incoming = { ...config, ...receiptFields };
  if (hasReceipt) incoming.log = log;

  // --- write ------------------------------------------------------------------------
  if (existingQa) {
    // Merge without overwriting: the user's section wins, and the old files stay.
    const merged = { ...existingQa };
    for (const [key, value] of Object.entries(incoming)) {
      if (!Object.prototype.hasOwnProperty.call(merged, key)) merged[key] = value;
    }
    settings.qa = merged;
    notes.push(`.codeadd/settings.json already has a qa section; merged the keys it lacked and kept ${QA_OLD_CONFIG} and ${QA_OLD_RECEIPT} for you to review`);
  } else {
    settings.qa = incoming;
  }
  const ordered = { schema: settings.schema ?? 1, ...settings };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  changes.push('wrote the qa section of .codeadd/settings.json');

  if (existingQa) return { changes, notes };

  for (const r of skillRewrites) {
    fs.writeFileSync(r.full, r.after, 'utf8');
    changes.push(`rewrote ${r.rel}: config path now .codeadd/settings.json`);
  }
  for (const [has, rel, full] of [[hasConfig, QA_OLD_CONFIG, configPath], [hasReceipt, QA_OLD_RECEIPT, receiptPath]]) {
    if (!has) continue;
    fs.unlinkSync(full);
    changes.push(`removed ${rel}`);
  }
  const qaDir = path.join(ctx.cwd, 'docs', 'qa');
  if (fs.existsSync(qaDir) && fs.readdirSync(qaDir).length === 0) {
    fs.rmdirSync(qaDir);
    changes.push('removed docs/qa/ (empty)');
  }
  return { changes, notes };
}

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
  {
    id: '0003-retire-about-suffix',
    description: 'Rewrite the retired -about type names and write each wiki page the id it already answered by',
    run: retireAboutSuffix,
  },
  {
    id: '0004-sync-board-definitions',
    description: 'Add the default statuses an existing board definitions file lacks — writes the board branch through backlog-commit.cjs',
    run: syncBoardDefinitions,
  },
  {
    id: '0005-qa-settings',
    description: 'Move docs/qa/config.json and the qa-setup receipt into the qa section of .codeadd/settings.json — changes files only, no commit',
    run: migrateQaSettings,
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
