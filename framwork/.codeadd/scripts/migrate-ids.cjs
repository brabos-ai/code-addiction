/**
 * migrate-ids.cjs — Migrate the old work-id directory format to the unified
 * `docs/features/<NNNN><L>-slug` layout.
 *
 * Old: docs/features/F0001-slug/  docs/hotfixes/H0002-slug/  …
 * New: docs/features/0001F-slug/  docs/features/0002H-slug/ …
 *
 * F17 audit outcome: PRESERVED, not retired. `migrate-ids.sh` has no dedicated
 * Bats suite, so F1 recorded it `audit-deferred`; the plan required mode
 * characterization rather than an exemption. This entry is the behavioural
 * port — every mode, the rename, the reference rewrite, the empty type-dir
 * cleanup, the missing-input and unknown-mode exits. The shell origin is not
 * removed here; F20 owns retirement after caller cutover (F18).
 *
 * CONTRACT (verbatim from the shell):
 *   node .codeadd/scripts/migrate-ids.cjs              # dry-run (default)
 *   node .codeadd/scripts/migrate-ids.cjs --apply      # execute migration
 *   node .codeadd/scripts/migrate-ids.cjs --validate   # verify post-migration
 *
 *   --dry-run  reports the moves and the rewritten references without
 *              touching the tree; conflicts raise an error and set the exit.
 *   --apply    renames each old dir, rewrites every `old-name` reference found
 *              under docs/, then removes hotfixes/refactors/chores when empty.
 *   --validate fails when any old-format dir remains or `docs/features` is
 *              missing; dangling references and leftover type dirs only warn.
 *
 * Exit code equals the accumulated error count (0 on success), except the
 * explicit `exit 1` paths: missing docs/, missing docs/features for --validate,
 * and an unknown mode (which prints usage).
 *
 * Paths are emitted POSIX-style (`docs/features/F0001-auth`) on every
 * platform, matching the shell's output and the tests' assertions.
 *
 * Dependencies: Node built-ins only. No shell, no git.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DOCS_BASE = 'docs';
const TARGET_DIR = 'docs/features';
const TYPE_SUBDIRS = ['hotfixes', 'refactors', 'chores'];

const USAGE = `Usage: node .codeadd/scripts/migrate-ids.cjs [--dry-run|--apply|--validate]

  --dry-run   (default) Show what would change
  --apply     Execute the migration
  --validate  Verify post-migration integrity
`;

let errors = 0;
let changes = 0;

function info(msg) { process.stdout.write(`[INFO] ${msg}\n`); }
function ok(msg) { process.stdout.write(`[OK] ${msg}\n`); }
function warn(msg) { process.stdout.write(`[WARN] ${msg}\n`); }
function error(msg) { process.stdout.write(`[ERROR] ${msg}\n`); errors += 1; }
function move(from, to) {
  process.stdout.write(`  ${from} -> ${to}\n`);
  changes += 1;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

/** Immediate child directory names of `p` whose basename matches `re`. */
function childDirs(p, re) {
  let entries;
  try {
    entries = fs.readdirSync(p, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && re.test(e.name))
    .map((e) => `${p}/${e.name}`);
}

/**
 * Every old-format directory, deduplicated and sorted exactly as the shell's
 * `find … | sort -u`. Searches the known type subdirs (plus a nested
 * `docs/docs`, as the shell does) and the `docs` root at depth 1.
 */
function collectOldDirs() {
  const found = new Set();
  for (const sub of ['features', 'hotfixes', 'refactors', 'chores', 'docs']) {
    const base = `${DOCS_BASE}/${sub}`;
    if (!isDir(base)) continue;
    for (const dir of childDirs(base, /^[A-Z][0-9]{4}-/)) found.add(dir);
  }
  for (const dir of childDirs(DOCS_BASE, /^[A-Z][0-9]{4}-/)) found.add(dir);
  return [...found].sort();
}

/** `docs/hotfixes/H0002-crash` -> `docs/features/0002H-crash`. */
function convertPath(oldPath) {
  const dirname = path.posix.basename(oldPath);
  const letter = dirname.charAt(0);
  const number = dirname.slice(1, 5);
  const slug = dirname.slice(5);
  return `${TARGET_DIR}/${number}${letter}${slug}`;
}

function baseName(p) {
  return path.posix.basename(p);
}

function walkFiles(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walkFiles(p, out);
    else if (entry.isFile()) out.push(p);
  }
}

/** Files under docs/ whose text contains `oldName`, sorted. */
function filesReferencing(oldName) {
  const all = [];
  walkFiles(DOCS_BASE, all);
  const hits = [];
  for (const file of all) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }
    if (content.includes(oldName)) hits.push(file);
  }
  return hits;
}

/** Rewrite or report references to an old id, depending on the mode. */
function updateReferences(oldName, newName, apply) {
  for (const file of filesReferencing(oldName)) {
    if (apply) {
      const content = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(file, content.split(oldName).join(newName));
      info(`  Updated references in ${file}`);
    } else {
      info(`  Would update references in ${file}`);
    }
  }
}

function doDryRun() {
  process.stdout.write('\n');
  info('=== DRY-RUN: Showing what would change ===');
  process.stdout.write('\n');

  if (!isDir(DOCS_BASE)) {
    error('docs/ directory not found. Run from project root.');
    return 1;
  }

  const oldDirs = collectOldDirs();
  if (oldDirs.length === 0) {
    ok('No old-format directories found. Nothing to migrate.');
    return 0;
  }

  info('Directories to rename:');
  for (const oldDir of oldDirs) {
    const newDir = convertPath(oldDir);
    move(oldDir, newDir);
    updateReferences(baseName(oldDir), baseName(newDir), false);
    if (isDir(newDir)) error(`CONFLICT: ${newDir} already exists!`);
  }

  process.stdout.write('\n');
  info(`Summary: ${changes} directories would be renamed, ${errors} errors`);
  if (errors > 0) error('Fix conflicts before running --apply');
  else ok('Safe to run: node .codeadd/scripts/migrate-ids.cjs --apply');
  return errors;
}

function doApply() {
  process.stdout.write('\n');
  info('=== APPLYING MIGRATION ===');
  process.stdout.write('\n');

  if (!isDir(DOCS_BASE)) {
    error('docs/ directory not found. Run from project root.');
    return 1;
  }

  const oldDirs = collectOldDirs();
  if (oldDirs.length === 0) {
    ok('No old-format directories found. Nothing to migrate.');
    return 0;
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  for (const oldDir of oldDirs) {
    const newDir = convertPath(oldDir);
    if (isDir(newDir)) {
      error(`CONFLICT: ${newDir} already exists! Skipping ${oldDir}`);
      continue;
    }

    fs.renameSync(oldDir, newDir);
    ok(`Renamed: ${baseName(oldDir)} -> ${baseName(newDir)}`);

    updateReferences(baseName(oldDir), baseName(newDir), true);
    changes += 1;
  }

  for (const subdir of TYPE_SUBDIRS) {
    const p = `${DOCS_BASE}/${subdir}`;
    if (!isDir(p)) continue;
    const remaining = childDirs(p, /./).length;
    if (remaining === 0) {
      try {
        fs.rmdirSync(p);
        ok(`Removed empty directory: ${p}`);
      } catch (e) {
        // Non-empty for a reason other than a child directory: leave it.
      }
    } else {
      warn(`${p} still has ${remaining} items, not removing`);
    }
  }

  process.stdout.write('\n');
  info(`Migration complete: ${changes} directories renamed, ${errors} errors`);
  if (errors === 0) ok('Run: node .codeadd/scripts/migrate-ids.cjs --validate');
  return errors;
}

/** `path:line:content` rows still matching the old id shape, minus PRD noise. */
function danglingReferences() {
  const all = [];
  walkFiles(DOCS_BASE, all);
  const matches = [];
  for (const file of all) {
    if (!file.endsWith('.md') && !file.endsWith('.jsonl')) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/[^0-9][FHRCDE][0-9]{4}-/.test(line)) continue;
      if (/(PRD[0-9]|prd\/)/.test(line)) continue;
      matches.push(`${file}:${i + 1}:${line}`);
    }
  }
  return matches;
}

function doValidate() {
  process.stdout.write('\n');
  info('=== VALIDATING MIGRATION ===');
  process.stdout.write('\n');

  if (!isDir(TARGET_DIR)) {
    error(`${TARGET_DIR} not found`);
    return 1;
  }

  const oldRemaining = collectOldDirs();
  if (oldRemaining.length > 0) {
    error('Old-format directories still exist:');
    for (const d of oldRemaining) process.stdout.write(`  ${d}\n`);
  } else {
    ok('No old-format directories remain');
  }

  const newDirs = childDirs(TARGET_DIR, /^[0-9]{4}[A-Z]-/).sort();
  if (newDirs.length > 0) {
    ok('New-format directories found:');
    for (const d of newDirs) process.stdout.write(`  ${baseName(d)}\n`);
  } else {
    warn(`No new-format directories found in ${TARGET_DIR}`);
  }

  const oldRefs = danglingReferences();
  if (oldRefs.length > 0) {
    warn('Possible old-format references found:');
    for (const row of oldRefs.slice(0, 20)) process.stdout.write(row + '\n');
  } else {
    ok('No old-format references found in docs');
  }

  for (const subdir of TYPE_SUBDIRS) {
    const p = `${DOCS_BASE}/${subdir}`;
    if (isDir(p)) warn(`${p} still exists (can be removed if empty)`);
  }

  process.stdout.write('\n');
  // The closing summary reports the count; it is not itself an issue. The
  // shell's `log_error` here incremented ERRORS a second time (exit 2 for one
  // remaining old dir); the F27 characterization asserts exit 1, so the
  // summary line is emitted without counting.
  if (errors === 0) ok('Validation passed!');
  else process.stdout.write(`[ERROR] Validation found ${errors} issues\n`);
  return errors;
}

function main(argv) {
  const first = argv[0];
  const mode = first === undefined || first === '' ? '--dry-run' : first;

  let code;
  if (mode === '--dry-run') code = doDryRun();
  else if (mode === '--apply') code = doApply();
  else if (mode === '--validate') code = doValidate();
  else {
    process.stdout.write(USAGE);
    process.exit(1);
  }
  process.exit(code);
}

main(process.argv.slice(2));
