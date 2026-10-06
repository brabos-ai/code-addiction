/**
 * migrate-context-files.cjs — fold legacy context files into AGENTS.md
 *
 * AGENTS.md is the only context file the framework writes and reads. Claude
 * Code reads it only when no CLAUDE.md exists in the working directory or
 * above, and Antigravity lets GEMINI.md override it, so a leftover legacy file
 * hides or overrides AGENTS.md. This entry removes them without losing a line.
 *
 * Usage:
 *   node .codeadd/scripts/migrate-context-files.cjs     # run at the project root
 *
 * Candidates, in this order: CLAUDE.md, .claude/CLAUDE.md, GEMINI.md
 *   AGENTS.md absent     -> the candidate becomes AGENTS.md verbatim
 *   already contained    -> nothing is carried
 *   otherwise            -> appended whole under "## Migrated from <file>"
 * The candidate is deleted only after AGENTS.md was written. "Contained"
 * compares the whole candidate, CRLF -> LF and trailing newlines trimmed, as a
 * substring of AGENTS.md under the same normalisation. CLAUDE.local.md is
 * personal and never touched — it is only reported, because it also hides
 * AGENTS.md from Claude Code.
 *
 * Output (one line per fact):
 *   MIGRATED:<file>:created|duplicate|appended
 *   LEGACY_LOCAL:CLAUDE.local.md
 *   CONTEXT_MIGRATION:none            (no candidate was found)
 *
 * Exit codes:
 *   0  done (including nothing to do)
 *   1  I/O error — candidates migrated before the failure stay migrated; a
 *      re-run completes the rest
 *
 * Mutation boundary: writes AGENTS.md in the working directory and deletes only
 * the candidates it successfully folded in. CLAUDE.local.md is never read for
 * migration nor removed. Node built-ins only; no shell, no external process.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TARGET = 'AGENTS.md';
const CANDIDATES = ['CLAUDE.md', '.claude/CLAUDE.md', 'GEMINI.md'];
const PERSONAL = 'CLAUDE.local.md';

/** CR stripper plus trailing-newline trim — the shell's `tr -d '\r'` under `$(...)`. */
function normalise(text) {
  return text.replace(/\r/g, '').replace(/\n+$/, '');
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Write through a sibling temp file and rename, so a failure never half-writes TARGET. */
function writeAtomic(target, content) {
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmp, content);
    fs.renameSync(tmp, target);
  } catch (err) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* the temp file is best-effort cleanup, the original error is what matters */
    }
    throw err;
  }
}

/** Fold one candidate into AGENTS.md; returns created | duplicate | appended. */
function migrate(root, candidate) {
  const target = path.join(root, TARGET);
  const candidatePath = path.join(root, candidate);
  let outcome;

  if (!isFile(target)) {
    writeAtomic(target, fs.readFileSync(candidatePath));
    outcome = 'created';
  } else {
    const targetText = normalise(fs.readFileSync(target, 'utf8'));
    const fileText = normalise(fs.readFileSync(candidatePath, 'utf8'));
    if (targetText.includes(fileText)) {
      outcome = 'duplicate';
    } else {
      writeAtomic(target, `${targetText}\n\n## Migrated from ${candidate}\n\n${fileText}\n`);
      outcome = 'appended';
    }
  }

  fs.rmSync(candidatePath, { force: true });
  return outcome;
}

/**
 * Run the migration in `root`. Prints one line per fact and returns the exit
 * code. Stops at the first failure, leaving candidates already folded in
 * migrated and the failed candidate untouched for a re-run.
 */
function run(root = process.cwd()) {
  let found = false;

  for (const candidate of CANDIDATES) {
    if (!isFile(path.join(root, candidate))) continue;
    found = true;

    let outcome;
    try {
      outcome = migrate(root, candidate);
    } catch {
      process.stderr.write(`ERROR: could not migrate ${candidate} into ${TARGET}\n`);
      return 1;
    }
    process.stdout.write(`MIGRATED:${candidate}:${outcome}\n`);
  }

  if (isFile(path.join(root, PERSONAL))) {
    process.stdout.write(`LEGACY_LOCAL:${PERSONAL}\n`);
  }
  if (!found) {
    process.stdout.write('CONTEXT_MIGRATION:none\n');
  }

  return 0;
}

if (require.main === module) {
  process.exitCode = run(process.cwd());
}

module.exports = { run, migrate, normalise, TARGET, CANDIDATES, PERSONAL };
