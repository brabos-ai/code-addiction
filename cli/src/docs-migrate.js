import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readManifest } from './injection-core.js';
import { MIGRATIONS, readFrontmatter, sectionBody, dropRetiredQaKeys } from './migrations.js';
import { resolveSelected } from './providers.js';
import { loadDocsRoot, loadDocsBranch, loadDocsGuard } from './docs-root.js';

/**
 * `codeadd docs migrate [--dry-run]` — the one place that knows where Code Addiction
 * outputs used to live, and the only exemption from the zero-legacy rule (with its
 * test and its fixtures). It is optional and never runs on its own: `update` does not
 * reach it, because it is not registered in `MIGRATIONS`.
 *
 * What it does, in order:
 *   1. it prepares the docs worktree (no worktree, no change at all), then the former migration 0005 — the QA config and receipt move into
 *      `.codeadd/settings.json` (it needs the old paths, so it runs before the move);
 *   2. it prepares the docs worktree, then COPIES every legacy output into it — the
 *      mapped folders below plus whatever the docs-guard rules recognise elsewhere;
 *   3. it re-runs the content repairs 0002 and 0003 over the new root (idempotent);
 *   4. ONE commit on `codeadd-docs`, with the trailer `Migrated-From: <code HEAD sha>`
 *      (no history is preserved: it is a fresh commit);
 *   5. on the code side it `git rm`s and stages the moved paths for the user to review.
 *      It NEVER commits or pushes the code side, and never pushes the docs branch.
 *
 * It MOVES, then it STAMPS what it can prove and REPORTS the rest. A moved legacy document
 * (schema 0) gets `schema: <DOC_SCHEMA_VERSION>` only when every deterministic check passes:
 * frontmatter present; `type` in the schema index; `id` matching that type's prefix rule;
 * `created`/`updated` ISO dates; `related`/`tags` present (an absent one is added as `[]`);
 * a `## TL;DR`; a qa-validation with `judged-contract`, `judged-tree` and evidence; a
 * feature-design with a `provenance: sha256:` value. Every other document is listed in
 * `.codeadd/docs/migration-report.md` with one closed reason. A provenance hash is NEVER
 * computed or written. Bringing the rest to the current format is the printed prompt's job,
 * run by the user's own agent. It spawns nothing but `git`.
 *
 * Output: `MIGRATED=moved:<n>` | `MIGRATED=already` | `MIGRATED=nothing`; after moved or already,
 * `DOCS_LEGACY=<n>` (documents with no schema, counted by the installed resolver) and — when n is
 * above zero — the prompt template, printed between `--- AGENT PROMPT ---` and
 * `--- END AGENT PROMPT ---`. The prompt also prints when `NEEDS_UPDATE` or `DOCS_UNSTAMPED` is above zero,
 * whatever the outcome; `--dry-run` prints none.
 *
 * EVERY run — moved, already, nothing and `--dry-run` (worded "would") — also ends its keys with a
 * human summary between `--- MIGRATION SUMMARY ---` and `--- END MIGRATION SUMMARY ---`: files moved
 * (0 included), the reason when 0, the `delivered.jsonl` state and `DOCS_LEGACY`. The `KEY=` lines
 * stay exactly as they were, for bots.
 */

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
 * A retired QA key — in the legacy file or already in the tracked `qa` section — is dropped by
 * the helper `migrations.js` owns, so it never reaches the tracked file and its value is never
 * printed. Nothing is written to a local file.
 *
 * @param {{cwd: string, providers: {dest: string}[]}} ctx
 * @returns {{changes: string[], notes: string[], warnings: string[]}}
 */
export function migrateQaSettings(ctx) {
  const configPath = path.join(ctx.cwd, QA_OLD_CONFIG);
  const receiptPath = path.join(ctx.cwd, QA_OLD_RECEIPT);
  const hasConfig = fs.existsSync(configPath);
  const hasReceipt = fs.existsSync(receiptPath);
  if (!hasConfig && !hasReceipt) return { changes: [], notes: ['no QA setup to migrate'], warnings: [] };

  const changes = [];
  const notes = [];
  const warnings = [];

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

  // A retired key never reaches the tracked file: drop it from what is merged and from what is kept.
  const droppedIncoming = dropRetiredQaKeys(incoming);
  const droppedExisting = dropRetiredQaKeys(existingQa);
  const droppedAny = droppedIncoming.dropped || droppedExisting.dropped;
  const keptIncoming = { ...(droppedIncoming.qa ?? {}) };
  const keptQa = droppedExisting.qa ?? {};

  // --- write ------------------------------------------------------------------------
  if (existingQa) {
    // Merge without overwriting: the user's section wins, and the old files stay.
    const merged = { ...keptQa };
    for (const [key, value] of Object.entries(keptIncoming)) {
      if (!Object.prototype.hasOwnProperty.call(merged, key)) merged[key] = value;
    }
    settings.qa = merged;
    notes.push(`.codeadd/settings.json already has a qa section; merged the keys it lacked and kept ${QA_OLD_CONFIG} and ${QA_OLD_RECEIPT} for you to review`);
  } else {
    settings.qa = keptIncoming;
  }
  const ordered = { schema: settings.schema ?? 1, ...settings };
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  changes.push('wrote the qa section of .codeadd/settings.json');

  if (droppedAny) {
    notes.push('a retired QA key was dropped from the qa section; rerun /add-qa-setup to generate the project seed');
  }

  if (existingQa) return { changes, notes, warnings };

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
  return { changes, notes, warnings };
}


// ---------------------------------------------------------------------------
// The legacy layout — known HERE and nowhere else
// ---------------------------------------------------------------------------

const OLD_ROOT = 'docs';
const OLD_DECISIONS = '.codeadd/project/decisions.jsonl';

// [old sub-folder, new sub-folder] — moved wholesale. `audit` and `audits` both exist in
// the wild; there is one `audits` now (R8).
const DIR_MAP = [
  ['brainstorm', 'brainstorm'],
  ['diagnose', 'diagnose'],
  ['audit', 'audits'],
  ['audits', 'audits'],
  ['health-checks', 'health-checks'],
  ['qa', 'qa'],
  ['hotfixes', 'hotfixes'],
  ['analysis', 'analysis'],
  ['product', 'product'],
];
// Top-level files of the old root.
const FILE_MAP = [
  ['delivered.jsonl', 'delivered.jsonl'],
  ['design-system.md', 'design-system.md'],
  ['code-quality-review.md', 'code-quality-review.md'],
];
const FEATURE_FOLDER_RE = /^[0-9]{4}[A-Z]-/;

// ---------------------------------------------------------------------------
// The stale-reference scan — code that still names a moved path (decision 3)
// ---------------------------------------------------------------------------

const SCAN_SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage']);
const SCAN_MAX_BYTES = 1024 * 1024;
const SCAN_MAX_LISTED = 500;
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The needle for every legacy path, derived from the constants this file already owns — a
 * second list would drift. A path under the new root (`.codeadd/docs/…`) never matches.
 */
function staleReferenceRe() {
  const names = [
    ...DIR_MAP.map(([oldSub]) => `${OLD_ROOT}/${oldSub}`),
    `${OLD_ROOT}/features`,
    `${OLD_ROOT}/changelog`,
    ...FILE_MAP.map(([oldName]) => `${OLD_ROOT}/${oldName}`),
    QA_OLD_CONFIG,
    QA_OLD_RECEIPT,
    OLD_DECISIONS,
  ];
  const alternatives = [...new Set(names)].sort((a, b) => b.length - a.length).map(escapeRe).join('|');
  return new RegExp(`(?<![A-Za-z0-9_.-])(?<!\\.codeadd/)(?:${alternatives})(?![A-Za-z0-9_-])`);
}

/**
 * Every line, outside the docs root, that still names a moved path — `{ file, line }`. READ ONLY:
 * this never writes a file, and the code is not this command's to rewrite. `skip` holds the files
 * the move is about to take (a dry run has not taken them yet).
 */
export function scanStaleReferences(cwd, skip = new Set()) {
  const listed = spawnSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (listed.status !== 0) return [];
  const re = staleReferenceRe();
  const hits = [];
  for (const rel of listed.stdout.split('\0').filter(Boolean)) {
    if (skip.has(rel) || rel.startsWith('.codeadd/docs/')) continue;
    if (rel.split('/').some((seg) => SCAN_SKIP_DIRS.has(seg))) continue;
    const full = path.join(cwd, rel);
    let buf;
    try {
      const stat = fs.statSync(full);
      if (!stat.isFile() || stat.size > SCAN_MAX_BYTES) continue;
      buf = fs.readFileSync(full);
    } catch {
      continue;
    }
    if (buf.subarray(0, 8000).includes(0)) continue;
    const lines = buf.toString('utf8').split('\n');
    for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) hits.push({ file: rel, line: i + 1 });
  }
  return hits;
}

const posix = (p) => p.split(path.sep).join('/');

function gitRun(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * Every legacy output in the code checkout, as `{ from, to }` — `from` relative to the
 * project, `to` relative to the docs root. Nothing outside the mapped places moves: a
 * user's own file in the old root stays where it is.
 */
export function collectLegacy(cwd) {
  const hits = [];
  const oldRoot = path.join(cwd, OLD_ROOT);
  const add = (abs, to) => hits.push({ from: posix(path.relative(cwd, abs)), to });

  const featuresDir = path.join(oldRoot, 'features');
  if (fs.existsSync(featuresDir)) {
    for (const e of fs.readdirSync(featuresDir, { withFileTypes: true })) {
      if (!e.isDirectory() || !FEATURE_FOLDER_RE.test(e.name)) continue;
      for (const f of walkFiles(path.join(featuresDir, e.name))) {
        add(f, `features/${posix(path.relative(featuresDir, f))}`);
      }
    }
  }
  for (const [oldSub, newSub] of DIR_MAP) {
    const base = path.join(oldRoot, oldSub);
    for (const f of walkFiles(base)) add(f, `${newSub}/${posix(path.relative(base, f))}`);
  }
  // changelog: only the files Code Addiction wrote (typed `changelog` or CHG-named)
  const changelogDir = path.join(oldRoot, 'changelog');
  for (const f of walkFiles(changelogDir)) {
    if (!f.endsWith('.md')) continue;
    const text = fs.readFileSync(f, 'utf8');
    const fm = readFrontmatter(text);
    // `NNNNCHG.md` is a changelog name some projects wrote, with or without frontmatter.
    if ((fm && fm.type === 'changelog') || /^CHG[0-9]+\.md$/.test(path.basename(f)) || /^[0-9]{4}CHG\.md$/.test(path.basename(f))) {
      add(f, `changelog/${posix(path.relative(changelogDir, f))}`);
    }
  }
  for (const [oldName, newName] of FILE_MAP) {
    const f = path.join(oldRoot, oldName);
    if (fs.existsSync(f)) add(f, newName);
  }
  const decisions = path.join(cwd, ...OLD_DECISIONS.split('/'));
  if (fs.existsSync(decisions)) add(decisions, 'decisions.jsonl');
  return hits;
}



// ---------------------------------------------------------------------------
// The move
// ---------------------------------------------------------------------------

const say = (line) => process.stdout.write(`${line}\n`);

/** Copy one legacy file into the docs root. Returns 'copied' | 'same' | 'merged' | 'conflict'. */
function copyOne(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    return 'copied';
  }
  const a = fs.readFileSync(src);
  const b = fs.readFileSync(dest);
  if (a.equals(b)) return 'same';
  if (dest.endsWith('.jsonl')) {
    const have = new Set(b.toString('utf8').split('\n').filter(Boolean));
    const extra = a.toString('utf8').split('\n').filter((l) => l && !have.has(l));
    if (extra.length) fs.appendFileSync(dest, (b.length && !b.toString('utf8').endsWith('\n') ? '\n' : '') + extra.join('\n') + '\n');
    return 'merged';
  }
  return 'conflict';
}

function removeCodeSide(cwd, files) {
  const tracked = new Set(
    gitRun(cwd, ['ls-files', '-z', '--', ...files.map((f) => f.from)]).out.split('\0').filter(Boolean),
  );
  const toRm = files.filter((f) => tracked.has(f.from));
  for (let i = 0; i < toRm.length; i += 200) {
    gitRun(cwd, ['rm', '-f', '-q', '--ignore-unmatch', '--', ...toRm.slice(i, i + 200).map((f) => f.from)]);
  }
  for (const f of files) {
    fs.rmSync(path.join(cwd, f.from), { force: true });
  }
  // empty folders the move left behind
  const dirs = new Set(files.map((f) => path.dirname(path.join(cwd, f.from))));
  for (const d of [...dirs].sort((x, y) => y.length - x.length)) {
    let cur = d;
    while (cur.startsWith(path.join(cwd, OLD_ROOT)) && fs.existsSync(cur) && fs.readdirSync(cur).length === 0) {
      fs.rmdirSync(cur);
      cur = path.dirname(cur);
    }
  }
}

/** Markdown files under the docs root with no schema (or an unreadable one) — schema 0, legacy. */
function countLegacyDocs(root, docSchemaOf) {
  return walkFiles(root).filter((f) => f.endsWith('.md') && docSchemaOf(fs.readFileSync(f, 'utf8')) === 0).length;
}

// ---------------------------------------------------------------------------
// Decision 5 — stamp what the checks prove, report the rest
// ---------------------------------------------------------------------------

/**
 * The schema types of the `add--doc-schemas` Schema Index. A test pins this list to the skill's
 * table, so the two cannot drift apart unnoticed.
 */
export const STAMP_SCHEMA_TYPES = [
  'feature', 'feature-plan', 'feature-design', 'brainstorm', 'brainstorm-intent', 'epic',
  'hotfix',
  'audit-report', 'diagnose-report', 'review', 'qa-validation',
  'changelog',
  'prd',
  'setup-receipt',
];

/**
 * The id shape per type, from the skill's ID Prefixes table (`qa-validation` from its own stated
 * pattern, `<feature-id>-qa-validation-NNN`). A type with no entry needs only a non-empty `id`.
 */
export const STAMP_ID_RULES = {
  feature: /^[0-9]{4}F$/,
  hotfix: /^[0-9]{4}H$/,
  prd: /^PRD[0-9]{4}$/,
  changelog: /^CHG[0-9]{4}$/,
  'qa-validation': /^[0-9]{4}F-qa-validation-[0-9]{3}$/,
};

/** Field names read from `references/review.md` and `references/new-feature.md`; pinned by a test. */
export const STAMP_FIELDS = {
  qaValidation: ['judged-contract', 'judged-tree'],
  designHash: 'provenance',
};

export const REPORT_REASONS = [
  'non-standard-id', 'unknown-type', 'incomplete-frontmatter', 'missing-tldr',
  'qa-validation-without-evidence', 'design-without-hash',
];

const REPORT_REL = 'migration-report.md';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (v) => v instanceof Date || (typeof v === 'string' && ISO_DATE.test(v));
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Judge one legacy document. `{ stamp: true, text }` carries the stamped text; `{ stamp: false, reason }`
 * carries one reason of the closed set. The check order is the order of REPORT_REASONS' meaning: the first
 * failing check names the reason.
 */
function judgeLegacyDoc(text, version) {
  const fm = readFrontmatter(text);
  if (!fm) return { stamp: false, reason: 'incomplete-frontmatter' };
  if (!nonEmpty(fm.type)) return { stamp: false, reason: 'incomplete-frontmatter' };
  if (!STAMP_SCHEMA_TYPES.includes(fm.type)) return { stamp: false, reason: 'unknown-type' };
  const id = fm.id === undefined || fm.id === null ? '' : String(fm.id);
  if (!nonEmpty(id)) return { stamp: false, reason: 'incomplete-frontmatter' };
  const rule = STAMP_ID_RULES[fm.type];
  if (rule && !rule.test(id)) return { stamp: false, reason: 'non-standard-id' };
  // A qa-validation report is append-only per run: `updated` is optional for it.
  if (!isIsoDate(fm.created)) return { stamp: false, reason: 'incomplete-frontmatter' };
  if (fm.type !== 'qa-validation' && !isIsoDate(fm.updated)) return { stamp: false, reason: 'incomplete-frontmatter' };
  if (fm.updated !== undefined && !isIsoDate(fm.updated)) return { stamp: false, reason: 'incomplete-frontmatter' };
  for (const key of ['related', 'tags']) {
    if (Object.prototype.hasOwnProperty.call(fm, key) && !Array.isArray(fm[key])) return { stamp: false, reason: 'incomplete-frontmatter' };
  }

  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const close = text.indexOf(`${eol}---`, 3);
  const body = text.slice(close + eol.length + 3);
  if (!/^## TL;DR[ \t]*\r?$/m.test(body)) return { stamp: false, reason: 'missing-tldr' };
  if (fm.type === 'qa-validation') {
    const hasFields = STAMP_FIELDS.qaValidation.every((k) => nonEmpty(fm[k]));
    const hasEvidence = /_tests\/|screenshots|\.png\b/.test(body);
    if (!hasFields || !hasEvidence) return { stamp: false, reason: 'qa-validation-without-evidence' };
  }
  // The hash is read, never computed: a design without one stays in the report.
  if (fm.type === 'feature-design' && !(typeof fm[STAMP_FIELDS.designHash] === 'string' && /^sha256:[0-9a-f]+$/.test(fm[STAMP_FIELDS.designHash]))) {
    return { stamp: false, reason: 'design-without-hash' };
  }

  const add = [`schema: ${version}`];
  for (const key of ['related', 'tags']) if (!Object.prototype.hasOwnProperty.call(fm, key)) add.push(`${key}: []`);
  return { stamp: true, text: `${text.slice(0, close)}${eol}${add.join(eol)}${text.slice(close)}` };
}

/** The report text: deterministic (no date, sorted), so a second run rewrites the same bytes. */
function reportText(unstamped, version) {
  const rows = [...unstamped].sort((a, b) => a.rel.localeCompare(b.rel)).map((u) => `| \`${u.rel}\` | \`${u.reason}\` |`);
  return [
    '---',
    'id: migration-report',
    'type: migration-report',
    `schema: ${version}`,
    '---',
    '',
    '# Migration report',
    '',
    '## TL;DR',
    '',
    `Documents \`codeadd docs migrate\` could not bring to schema ${version} on its own, one reason each. Fix them, then run \`codeadd docs migrate\` again to refresh this list.`,
    '',
    '| Path | Reason |',
    '|---|---|',
    ...rows,
    '',
  ].join('\n');
}

/**
 * Classify every legacy document under the docs root: stamp the ones that pass, list the rest, and
 * keep the report in step (rewritten every run, deleted when empty). Returns what changed on disk.
 */
function stampAndReport(root, docsRootMod) {
  const version = docsRootMod.DOC_SCHEMA_VERSION;
  const stamped = [];
  const unstamped = [];
  let changed = false;
  for (const file of walkFiles(root).sort()) {
    if (!file.endsWith('.md')) continue;
    const rel = posix(path.relative(root, file));
    if (rel === REPORT_REL) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (docsRootMod.docSchemaOf(text) !== 0) continue;
    const verdict = judgeLegacyDoc(text, version);
    if (verdict.stamp) {
      fs.writeFileSync(file, verdict.text);
      stamped.push(rel);
      changed = true;
    } else {
      unstamped.push({ rel, reason: verdict.reason });
    }
  }
  const reportFile = path.join(root, REPORT_REL);
  if (unstamped.length > 0) {
    const next = reportText(unstamped, version);
    if (!fs.existsSync(reportFile) || fs.readFileSync(reportFile, 'utf8') !== next) {
      fs.writeFileSync(reportFile, next);
      changed = true;
    }
  } else if (fs.existsSync(reportFile)) {
    fs.rmSync(reportFile);
    changed = true;
  }
  return { stamped, unstamped, changed, reportPath: unstamped.length > 0 ? `${docsRootMod.DOCS_ROOT}/${REPORT_REL}` : 'none' };
}

const SUMMARY_BEGIN = '--- MIGRATION SUMMARY ---';
const SUMMARY_END = '--- END MIGRATION SUMMARY ---';

/** The state of a `delivered.jsonl`: absent, already at `v: 1`, or lines that carry no `v`. */
function deliveredState(file) {
  if (!file || !fs.existsSync(file)) return 'absent';
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
  if (lines.length === 0) return 'absent';
  const without = lines.filter((l) => {
    try {
      const v = JSON.parse(l).v;
      return v === undefined || v === null;
    } catch {
      return true;
    }
  }).length;
  return without === 0 ? 'already at v: 1' : `${without} line(s) without v`;
}

/**
 * The human summary every run ends its keys with. `lines` carries anything a later step adds
 * (the references that need an update, the stamped and unstamped counts).
 */
function printSummary({ dryRun, count, reason, delivered, legacy, needsUpdate = [], lines = [] }) {
  say(SUMMARY_BEGIN);
  say(dryRun ? `files would move: ${count}` : `files moved: ${count}`);
  if (reason) say(`reason: ${reason}`);
  say(`delivered.jsonl: ${delivered}`);
  say(`DOCS_LEGACY: ${legacy}`);
  say('needs update:');
  if (needsUpdate.length === 0) say('  (no code references a moved path)');
  for (const h of needsUpdate.slice(0, SCAN_MAX_LISTED)) say(`  ${h.file}:${h.line}`);
  if (needsUpdate.length > SCAN_MAX_LISTED) say(`  ... and ${needsUpdate.length - SCAN_MAX_LISTED} more`);
  say(`NEEDS_UPDATE=${needsUpdate.length}`);
  for (const l of lines) say(l);
  say(SUMMARY_END);
}

const PROMPT_BEGIN = '--- AGENT PROMPT ---';
const PROMPT_END = '--- END AGENT PROMPT ---';

/**
 * Print the installed template verbatim between the two fixed marker lines. The template
 * file is the prompt's only home, and the build has already resolved its schema number.
 */
function printPrompt(cwd) {
  const file = path.join(cwd, '.codeadd', 'templates', 'docs-migrate-prompt.md');
  if (!fs.existsSync(file)) {
    say('DOCS_PROMPT=missing');
    return;
  }
  const text = fs.readFileSync(file, 'utf8');
  say(PROMPT_BEGIN);
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
  say(PROMPT_END);
}

/**
 * @param {string} cwd  the project (a project-scope install)
 * @param {string[]} args  `--dry-run`
 * @param {string} [scope]
 */
export async function docsMigrate(cwd, args = [], scope = 'project') {
  const dryRun = args.includes('--dry-run');
  const manifest = readManifest(cwd);
  if (!manifest || manifest.corrupted) {
    throw new Error('No ADD installation found. Run `npx codeadd install` first.');
  }
  const docsRootMod = loadDocsRoot(cwd);
  const branchMod = loadDocsBranch(cwd);
  const providers = resolveSelected(manifest.providers ?? [], manifest.scope ?? scope);

  const planned = collectLegacy(cwd);
  const root = docsRootMod.docsRoot(cwd);
  const migratedCommit = () => {
    if (!fs.existsSync(path.join(root, '.git'))) return '';
    return gitRun(root, ['log', '--grep=^Migrated-From:', '-n', '1', '--format=%H']).out;
  };
  const alreadyMigrated = () => migratedCommit() !== '';
  // The reason a run moved nothing: it was done before, or there was nothing to do.
  const zeroReason = () => {
    const sha = migratedCommit();
    return sha ? `already migrated: Migrated-From commit ${sha} on ${docsRootMod.DOCS_BRANCH}` : 'nothing to move: no legacy outputs found';
  };
  const deliveredPath = (list) => {
    const legacy = list.find((f) => f.to === 'delivered.jsonl');
    return fs.existsSync(path.join(root, 'delivered.jsonl')) ? path.join(root, 'delivered.jsonl') : legacy ? path.join(cwd, legacy.from) : null;
  };

  if (dryRun) {
    for (const f of planned) say(`WOULD_MOVE ${f.from} -> ${docsRootMod.DOCS_ROOT}/${f.to}`);
    say(planned.length ? `MIGRATED=moved:${planned.length}` : alreadyMigrated() ? 'MIGRATED=already' : 'MIGRATED=nothing');
    say('DRY_RUN=1');
    printSummary({
      dryRun: true,
      count: planned.length,
      reason: planned.length ? '' : zeroReason(),
      delivered: deliveredState(deliveredPath(planned)),
      legacy: fs.existsSync(root) ? countLegacyDocs(root, docsRootMod.docSchemaOf) : 0,
      needsUpdate: scanStaleReferences(cwd, new Set(planned.map((f) => f.from))),
    });
    return { migrated: planned.length ? 'moved' : 'nothing', count: planned.length, dryRun: true };
  }

  // 1. the docs worktree first — a project that cannot have one changes nothing
  const prepared = branchMod.prepareDocs(cwd);
  if (prepared.status === 'missing') {
    throw new Error(`The docs branch is not available (DOCS=missing${prepared.reason ? `: ${prepared.reason}` : ''}). Connect a remote, then run this again.`);
  }
  // 2. the former migration 0005 — it needs the old paths, so it runs before the copy
  const qa = migrateQaSettings({ cwd, providers });
  for (const c of qa.changes) say(`MIGRATION=${c}`);
  for (const w of qa.warnings ?? []) say(`WARNING=${w}`);
  for (const n of qa.notes ?? []) say(`NOTE=${n}`);

  const files = collectLegacy(cwd);
  const moved = [];
  for (const f of files) {
    const outcome = copyOne(path.join(cwd, f.from), path.join(root, ...f.to.split('/')));
    if (outcome === 'conflict') say(`CONFLICT ${f.from} differs from ${docsRootMod.DOCS_ROOT}/${f.to}; the code-side file was kept`);
    else moved.push(f);
  }

  // docs-guard rules over the rest of the tree (strays outside the mapped places)
  const guard = loadDocsGuard(cwd).runDocsGuard(cwd);
  const strays = guard && typeof guard.moved === 'number' ? guard.moved : 0;

  // 3. the content repairs, over the new root; both are idempotent
  for (const id of ['0002-harvest-relations', '0003-retire-about-suffix']) {
    const migration = MIGRATIONS.find((m) => m.id === id);
    if (migration) migration.run({ cwd, providers });
  }

  // 3b. stamp what the checks prove, report the rest (never invent a hash)
  const stamping = stampAndReport(root, docsRootMod);

  // 4. one commit on the docs branch, trailer carries the code base sha
  const base = gitRun(cwd, ['rev-parse', 'HEAD']).out || 'none';
  const total = moved.length + strays;
  if (total > 0 || stamping.changed) {
    const commit = branchMod.commitDocs(
      cwd,
      `docs: migrate Code Addiction outputs from the code branch\n\nMigrated-From: ${base}`,
    );
    if (commit.status === 'failed') throw new Error(`Could not commit the docs branch: ${commit.reason || 'unknown'}`);
  }

  // 5. the code side: remove and stage, never commit
  removeCodeSide(cwd, moved);

  let outcome;
  if (total > 0) {
    outcome = 'moved';
    say(`MIGRATED=moved:${total}`);
    say(`The moved files are committed on ${docsRootMod.DOCS_BRANCH} (not pushed) and staged as deleted in this checkout for you to review — nothing was committed here.`);
  } else {
    outcome = alreadyMigrated() ? 'already' : 'nothing';
    say(`MIGRATED=${outcome}`);
  }

  // The prompt for the user's own agent. This command only PRINTS it — it never runs an agent.
  const legacy = outcome === 'nothing' ? 0 : countLegacyDocs(root, docsRootMod.docSchemaOf);
  if (outcome !== 'nothing') say(`DOCS_LEGACY=${legacy}`);
  const needsUpdate = scanStaleReferences(cwd);
  printSummary({
    dryRun: false,
    count: total,
    reason: total > 0 ? '' : zeroReason(),
    delivered: deliveredState(deliveredPath([])),
    legacy,
    needsUpdate,
    lines: [
      `DOCS_STAMPED=${stamping.stamped.length}`,
      `DOCS_UNSTAMPED=${stamping.unstamped.length}`,
      `MIGRATION_REPORT=${stamping.reportPath}`,
    ],
  });
  if (legacy > 0 || needsUpdate.length > 0 || stamping.unstamped.length > 0) printPrompt(cwd);
  return { migrated: outcome, count: total, legacy };
}
