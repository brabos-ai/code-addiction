'use strict';
// ============================================
// CONVERGE-GATES (native)
// Deterministic, read-only probe for the five /add-done convergence gates
// ============================================
// Usage: node .codeadd/scripts/converge-gates.cjs <FEATURE_DIR> [SFxx]
// Dependencies: node:fs, node:path, ./qa-evidence.cjs (built-ins only). No shell.
// Output: KEY=VALUE lines. Gate statuses: ok | missing | broken | not-probed,
//         plus `skipped` on gate 2 only — a pass, counted in GATES_OK.
//         REVIEW_SOURCE=build|review|none says which verdict gate 1 read:
//         the `Final review:` line /add-build writes to the scoped
//         build-ledger.md, or the highest review-NNN.md. Most recent wins —
//         a review numbered ABOVE the one the line names decides; otherwise
//         the line does. The line's grammar is exactly
//           Final review: passed|ruled N|blocked N (after review-NNN)
//         followed, on `blocked`, by one `Blocker suggestion: <id> — <command>`
//         line per open blocker, which GATE_REVIEW_DETAIL carries.
//         QA_FEATURE_STATE is the RAW manifest value (true|false|unset|no-manifest);
//         the calling command applies default semantics — the defaults registry
//         lives in the CLI (cli/src/features.js) and is not duplicated here.
// Exit: always 0 — this is a diagnosis, never a gate. Exit 2 only on CLI misuse.
//
// WHY THIS SCRIPT EXISTS: /add-build's Checkpoint Sequence and /add-done STEP 4
// used to evaluate the same five gates as prose, each in its own words. A
// coordinator graded its own work, reported CONVERGED, and /add-done rejected
// the tree a second later. One script now backs both verdicts so they cannot
// drift apart.
//
// READ-ONLY IS LOAD-BEARING: this runs inside a step that forbids side effects.
// It never writes, and it never calls the evidence `promote` operation.

const fs = require('node:fs');
const path = require('node:path');

const evidence = require('./qa-evidence.cjs');

// Single source of the manifest feature key. cli/src/features.js owns the
// registry; this mirrors qa-preflight so a rename has one line per script.
const QA_FEATURE_KEY = 'qa-pipeline';

let GATES_OK = 0;
function pass() {
  GATES_OK += 1;
}

function emit(line) {
  process.stdout.write(String(line) + '\n');
}

/** Collapse a multi-line message into one KEY=VALUE-safe line. */
function flatten(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

function usage() {
  process.stdout.write('Usage: converge-gates.sh <FEATURE_DIR> [SFxx]\n');
  process.exitCode = 2;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Read a file as lines with the shell's newline model (drop a trailing CR). */
function readLines(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.replace(/\r$/, ''));
}

/** Sorted directory names, or [] when unreadable. */
function listDir(dir) {
  try {
    return fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
}

function trimCell(value) {
  return String(value).replace(/^[ \t]+|[ \t]+$/g, '');
}

// ─── Gate 1 helpers ──────────────────────────────────────────────────────────

/**
 * The value cell that follows the cell reading `Overall`, with emphasis
 * markers removed — the verdict is a CELL, never a substring of the row.
 */
function overallCell(row) {
  const parts = row.split('|');
  for (let i = 2; i <= parts.length; i += 1) {
    const label = trimCell(parts[i - 1]).replace(/\*/g, '');
    if (label === 'Overall' && i < parts.length) {
      return trimCell(parts[i]).replace(/\*/g, '').replace(/^[ \t]+|[ \t]+$/g, '');
    }
  }
  return '';
}

// ─── Gate 3 helpers ──────────────────────────────────────────────────────────

/** Subfeature-scoped form: the status of one tasks.md's Acceptance Checklist. */
function readAcceptance(file) {
  let found = false;
  let inblock = false;
  let unchecked = 0;
  for (const line of readLines(file)) {
    if (/^##[ \t]+acceptance checklist/i.test(line)) {
      found = true;
      inblock = true;
      continue;
    }
    if (inblock && /^##[ \t]/.test(line)) inblock = false;
    if (inblock && /^[ \t]*[-*][ \t]+\[[ \t]\]/.test(line)) unchecked += 1;
  }
  return { found, unchecked };
}

/**
 * Epic-wide form: rows are found through the resolved id column, the status
 * read from the resolved status column, and a header only latches when it
 * names BOTH. A non-pipe line ends the table.
 */
function readEpicTable(lines) {
  let statusIdx = 0;
  let idIdx = 0;
  let header = false;
  let anyHeader = false;
  let pending = '';
  for (const line of lines) {
    if (!/^\|/.test(line)) {
      header = false;
      statusIdx = 0;
      idIdx = 0;
      continue;
    }
    if (!header) {
      const parts = line.split('|');
      let sI = 0;
      let iI = 0;
      for (let i = 2; i <= parts.length; i += 1) {
        const cell = trimCell(parts[i - 1]).toLowerCase();
        if (cell === 'status') sI = i;
        if (cell === 'sf' || cell === 'id') iI = i;
      }
      if (sI && iI) {
        statusIdx = sI;
        idIdx = iI;
        header = true;
        anyHeader = true;
      }
      continue;
    }
    const parts = line.split('|');
    const id = trimCell(parts[idIdx - 1] || '');
    if (/^SF[0-9]+$/.test(id)) {
      const status = trimCell(parts[statusIdx - 1] || '').toLowerCase();
      if (status !== 'done') pending += (pending ? ',' : '') + id;
    }
  }
  return { header: anyHeader, pending };
}

/** Pre-schema fallback, exactly as status.sh has always read the document. */
function epicFallback(lines) {
  const ids = [];
  for (const line of lines) {
    if (!/^\|[ \t]*SF[0-9]+/.test(line)) continue;
    if (/\|[ \t]*done[ \t]*\|/.test(line)) continue;
    const match = line.match(/^\|[ \t]*(SF[0-9]+)/);
    if (match) ids.push(match[1]);
  }
  return ids.join(',');
}

// ─── Gate 4 helpers ──────────────────────────────────────────────────────────

function isSeparator(line) {
  const parts = line.split('|');
  let only = true;
  for (let i = 2; i <= parts.length; i += 1) {
    const cell = trimCell(parts[i - 1]);
    if (cell !== '' && !/^:?-+:?$/.test(cell)) only = false;
  }
  return only;
}

/**
 * The coverage table, in both shapes that exist: the old `## Cobertura de
 * Requisitos` X-marker form and the header-named `Covered?` column form.
 * Fence-aware, and reset per file so several subfeature plans do not leak a
 * latched column index into the next.
 */
function readCoverage(files) {
  let mode = 'none';
  let uncovered = 0;
  let covIdx = 0;
  let inblock = false;
  let fence = false;
  for (const file of files) {
    covIdx = 0;
    inblock = false;
    fence = false;
    if (mode === 'column') mode = 'none';
    for (const line of readLines(file)) {
      if (/^[ \t]*```/.test(line)) {
        fence = !fence;
        continue;
      }
      if (fence) continue;
      if (/^##[ \t]+cobertura de requisitos/i.test(line)) {
        mode = 'legacy';
        inblock = true;
        continue;
      }
      if (mode === 'legacy' && /^##[ \t]/.test(line)) inblock = false;
      if (mode === 'legacy' && inblock && /^\|/.test(line) && /\|[ \t]*[Xx][ \t]*\|/.test(line)) {
        uncovered += 1;
        continue;
      }
      if (mode !== 'legacy' && /^\|/.test(line) && !covIdx) {
        const parts = line.split('|');
        for (let i = 2; i <= parts.length; i += 1) {
          const cell = trimCell(parts[i - 1]).toLowerCase().replace(/\?/g, '');
          if (cell === 'covered') {
            covIdx = i;
            mode = 'column';
          }
        }
        continue;
      }
      if (mode === 'column' && /^\|/.test(line)) {
        if (isSeparator(line)) continue;
        const parts = line.split('|');
        const value = trimCell(parts[covIdx - 1] || '').toUpperCase();
        if (value !== 'YES' && value !== 'EXCLUDED' && value !== 'N/A' && !value.includes('\u2705')) {
          uncovered += 1;
        }
      }
    }
  }
  return { mode, uncovered };
}

// ─── Gate 5 helper ───────────────────────────────────────────────────────────

/** Execution task ids only: ## TDD's T-TEST-01 fails the T+digit shape. */
function readExecIds(file) {
  const ids = [];
  let inexec = false;
  for (const line of readLines(file)) {
    if (/^##[ \t]/.test(line)) {
      inexec = /^##[ \t]+execution[ \t]*$/i.test(line);
      continue;
    }
    if (inexec && /^[ \t]*[-*][ \t]*\[[ xX!]\][ \t]*T[0-9]+/.test(line)) {
      let id = line.replace(/^[ \t]*[-*][ \t]*\[[ xX!]\][ \t]*/, '');
      id = id.replace(/[^0-9A-Za-z].*$/, '');
      ids.push(id);
    }
  }
  return ids;
}

// ─── Entry ───────────────────────────────────────────────────────────────────

function main(argv) {
  if (argv.length < 1 || argv.length > 2) return usage();
  const featureDirArg = argv[0];
  const sfArg = argv.length === 2 ? argv[1] : '';

  // A second argument that is present but not a well-formed SFxx is misuse, not
  // a silent fall-through to the epic-wide rule.
  if (argv.length === 2 && !/^SF[0-9][0-9]$/.test(sfArg)) return usage();
  if (!isDir(featureDirArg)) return usage();

  let FEATURE_DIR;
  try {
    FEATURE_DIR = fs.realpathSync(featureDirArg);
  } catch {
    return usage();
  }
  if (!isDir(FEATURE_DIR)) return usage();

  // ─── Ledger scope ──────────────────────────────────────────────────────────
  // Follows the SFxx argument exactly as gate 3 does — never guessed.
  let ledgerScopeDir = FEATURE_DIR;
  let ledgerScopeLabel = featureDirArg;
  if (sfArg) {
    const subRoot = path.join(FEATURE_DIR, 'subfeatures');
    for (const name of listDir(subRoot)) {
      if (!name.startsWith(`${sfArg}-`)) continue;
      const full = path.join(subRoot, name);
      if (!isDir(full)) continue;
      ledgerScopeDir = full;
      ledgerScopeLabel = `${featureDirArg}/subfeatures/${name}`;
    }
  }
  const ledgerTasks = path.join(ledgerScopeDir, 'tasks.md');
  const ledgerFile = path.join(ledgerScopeDir, 'build-ledger.md');

  // ─── Gate 1: review verdict ────────────────────────────────────────────────
  let reviewPath = '';
  let reviewNnn = '';
  for (const name of listDir(FEATURE_DIR)) {
    const match = /^review-([0-9]{3})\.md$/.exec(name);
    if (!match) continue;
    if (!isFile(path.join(FEATURE_DIR, name))) continue;
    reviewPath = path.join(FEATURE_DIR, name);
    reviewNnn = match[1];
  }

  const ledgerLines = isFile(ledgerFile) ? readLines(ledgerFile) : [];
  let finalLine = '';
  for (const line of ledgerLines) {
    if (line.startsWith('Final review:')) finalLine = line;
  }
  let finalNnn = '';
  if (finalLine !== '') {
    const match = finalLine.match(/\(after review-([0-9]{3})\)[ \t]*$/);
    if (match) finalNnn = match[1];
  }

  let reviewSource = 'none';
  if (finalLine !== '') {
    reviewSource = 'build';
    // Base ten: `008` is not an octal literal here.
    if (
      reviewNnn !== '' &&
      finalNnn !== '' &&
      Number.parseInt(reviewNnn, 10) > Number.parseInt(finalNnn, 10)
    ) {
      reviewSource = 'review';
    }
  } else if (reviewPath !== '') {
    reviewSource = 'review';
  }

  if (reviewSource === 'build') {
    const finalVerdict = finalLine.replace(/^Final review:[ \t]*/, '');
    if (finalNnn === '') {
      emit('GATE_REVIEW=broken');
      emit(`GATE_REVIEW_DETAIL=Malformed ledger line (no '(after review-NNN)'): ${flatten(finalLine)}`);
    } else if (/^(passed|ruled [0-9]+) \(after review-[0-9]{3}\)/.test(finalVerdict)) {
      emit('GATE_REVIEW=ok');
      emit(`GATE_REVIEW_DETAIL=Build final review: ${flatten(finalVerdict)}`);
      pass();
    } else if (/^blocked [0-9]+ \(after review-[0-9]{3}\)/.test(finalVerdict)) {
      // Only the lines after the LAST verdict line are that round's
      // suggestions; an earlier blocked round's suggestions are history.
      let suggestions = '';
      for (const line of ledgerLines) {
        if (line.startsWith('Final review:')) {
          suggestions = '';
          continue;
        }
        if (line.startsWith('Blocker suggestion:')) {
          const value = line.replace(/^Blocker suggestion:[ \t]*/, '');
          suggestions = suggestions === '' ? value : `${suggestions} | ${value}`;
        }
      }
      emit('GATE_REVIEW=broken');
      emit(
        `GATE_REVIEW_DETAIL=Build final review: ${flatten(finalVerdict)}` +
          (suggestions !== '' ? ` — suggestions: ${flatten(suggestions)}` : ''),
      );
    } else {
      emit('GATE_REVIEW=broken');
      emit(`GATE_REVIEW_DETAIL=Malformed ledger line (verdict is not passed, ruled N or blocked N): ${flatten(finalLine)}`);
    }
  } else if (reviewPath === '') {
    emit('GATE_REVIEW=missing');
    emit(`GATE_REVIEW_DETAIL=No review-NNN.md under ${featureDirArg} and no Final review: line in ${ledgerScopeLabel}/build-ledger.md`);
  } else {
    const overallRow = readLines(reviewPath).find((line) => /^\|.*\*\*Overall\*\*/.test(line)) || '';
    const cell = overallRow === '' ? '' : overallCell(overallRow);
    if (overallRow === '') {
      emit('GATE_REVIEW=broken');
      emit(`GATE_REVIEW_DETAIL=No | **Overall** | table row in ${path.basename(reviewPath)}`);
    } else if (/(^|[^A-Z])PASSED$/.test(cell) && !/NOT[ \t]+PASSED/.test(cell)) {
      emit('GATE_REVIEW=ok');
      pass();
    } else {
      emit('GATE_REVIEW=broken');
      emit(`GATE_REVIEW_DETAIL=Overall verdict cell is not PASSED: ${flatten(cell)}`);
    }
  }
  emit(`REVIEW_PATH=${reviewPath}`);
  emit(`REVIEW_SOURCE=${reviewSource}`);

  // ─── Gate 2: QA baseline ───────────────────────────────────────────────────
  // The review's `> **QA baseline:**` line, validated by the native evidence
  // module. A validation failure is translated to `broken` and never
  // propagated: that would break the exit-0 diagnosis contract on exactly the
  // cases this gate exists to catch.
  let baseline = '';
  if (reviewSource === 'build') {
    baseline = 'none';
    emit('GATE_QA_BASELINE=skipped');
    emit("GATE_QA_BASELINE_DETAIL=The build's final review decided; no review document carries a QA baseline");
    pass();
  } else if (reviewPath === '') {
    emit('GATE_QA_BASELINE=missing');
    emit('GATE_QA_BASELINE_DETAIL=No review document to read a baseline from');
  } else {
    const baselineLine = readLines(reviewPath).find((line) => /^>[ \t]*\*\*QA baseline:\*\*/.test(line)) || '';
    if (baselineLine === '') {
      emit('GATE_QA_BASELINE=missing');
      emit(`GATE_QA_BASELINE_DETAIL=No > **QA baseline:** line in ${path.basename(reviewPath)}`);
    } else {
      baseline = baselineLine
        .replace(/^>[ \t]*\*\*QA baseline:\*\*[ \t]*/, '')
        .replace(/[ \t]+$/, '');
      try {
        evidence.validateBaseline(FEATURE_DIR, baseline);
        emit('GATE_QA_BASELINE=ok');
        pass();
      } catch (error) {
        const detail = error && error.message ? error.message : String(error);
        emit('GATE_QA_BASELINE=broken');
        emit(`GATE_QA_BASELINE_DETAIL=${flatten(detail)}`);
      }
    }
  }
  emit(`BASELINE=${baseline}`);

  // ─── Gate 3: epic completeness ─────────────────────────────────────────────
  const epicMd = path.join(FEATURE_DIR, 'epic.md');
  let epicPending = '';

  if (sfArg) {
    let sfTasks = '';
    const subRoot = path.join(FEATURE_DIR, 'subfeatures');
    for (const name of listDir(subRoot)) {
      if (!name.startsWith(`${sfArg}-`)) continue;
      const candidate = path.join(subRoot, name, 'tasks.md');
      if (isFile(candidate)) sfTasks = candidate;
    }
    if (sfTasks === '') {
      emit('GATE_EPIC=broken');
      emit(`GATE_EPIC_DETAIL=No tasks.md for ${sfArg} under ${featureDirArg}/subfeatures/`);
      epicPending = sfArg;
    } else {
      const read = readAcceptance(sfTasks);
      if (!read.found) {
        emit('GATE_EPIC=broken');
        emit(`GATE_EPIC_DETAIL=${sfArg} tasks.md has no ## Acceptance Checklist section`);
        epicPending = sfArg;
      } else if (read.unchecked === 0) {
        emit('GATE_EPIC=ok');
        pass();
      } else {
        emit('GATE_EPIC=broken');
        emit(`GATE_EPIC_DETAIL=${sfArg} acceptance checklist has ${read.unchecked} unchecked item(s)`);
        epicPending = sfArg;
      }
    }
  } else if (!isFile(epicMd)) {
    // A feature with no epic.md is `ok`, NOT `not-probed`: the gate does not
    // apply, and a simple feature must never be blocked for a gate it was
    // never subject to.
    emit('GATE_EPIC=ok');
    pass();
  } else {
    const lines = readLines(epicMd);
    const read = readEpicTable(lines);
    epicPending = read.header ? read.pending : epicFallback(lines);
    if (epicPending === '') {
      emit('GATE_EPIC=ok');
      pass();
    } else {
      emit('GATE_EPIC=broken');
      emit(`GATE_EPIC_DETAIL=Subfeature(s) not done: ${epicPending}`);
    }
  }
  emit(`EPIC_PENDING=${epicPending}`);

  // ─── Gate 4: requirements coverage ─────────────────────────────────────────
  let planMd = path.join(FEATURE_DIR, 'plan.md');
  const planSet = [];
  const subFeaturesDir = path.join(FEATURE_DIR, 'subfeatures');
  if (sfArg) {
    for (const name of listDir(subFeaturesDir)) {
      if (!name.startsWith(`${sfArg}-`)) continue;
      const candidate = path.join(subFeaturesDir, name, 'plan.md');
      if (isFile(candidate)) planMd = candidate;
    }
  } else if (!isFile(planMd) && isDir(subFeaturesDir)) {
    // An epic normally has NO feature-level plan.md; its coverage is the union
    // of its subfeatures' plans.
    for (const name of listDir(subFeaturesDir)) {
      const candidate = path.join(subFeaturesDir, name, 'plan.md');
      if (isFile(candidate)) planSet.push(candidate);
    }
  }
  let coverageUncovered = '';
  if (!isFile(planMd) && planSet.length === 0) {
    emit('GATE_COVERAGE=missing');
    emit(`GATE_COVERAGE_DETAIL=No plan.md under ${featureDirArg}`);
  } else {
    const files = planSet.length > 0 ? planSet : [planMd];
    const read = readCoverage(files);
    coverageUncovered = String(read.uncovered);
    if (read.mode === 'none') {
      emit('GATE_COVERAGE=ok');
      emit('GATE_COVERAGE_DETAIL=No coverage table in plan.md; /add-plan STEP 10 owns this gate at plan time');
      coverageUncovered = '0';
      pass();
    } else if (read.uncovered === 0) {
      emit('GATE_COVERAGE=ok');
      pass();
    } else {
      emit('GATE_COVERAGE=broken');
      emit(`GATE_COVERAGE_DETAIL=${read.uncovered} requirement(s) uncovered in plan.md (${read.mode} form)`);
    }
  }
  emit(`COVERAGE_UNCOVERED=${coverageUncovered}`);

  // ─── Raw feature state ─────────────────────────────────────────────────────
  // Reported, never acted on. No gate above branches on it.
  const manifestFile = path.join(process.cwd(), '.codeadd', 'manifest.json');
  if (!isFile(manifestFile)) {
    emit('QA_FEATURE_STATE=no-manifest');
  } else {
    let state = 'unset';
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      if (manifest && manifest.features && Object.prototype.hasOwnProperty.call(manifest.features, QA_FEATURE_KEY)) {
        state = String(manifest.features[QA_FEATURE_KEY]);
      }
    } catch {
      state = 'unset';
    }
    emit(`QA_FEATURE_STATE=${state}`);
  }

  // ─── Gate 5: build ledger ──────────────────────────────────────────────────
  // Asks whether the build HAPPENED. No other gate here does. NO tasks.md is
  // `ok`, NOT `missing`: outside TASKS MODE the ledger's lines are keyed by
  // area name rather than task id, so there is nothing to cross-reference.
  if (!isFile(ledgerTasks)) {
    emit('GATE_LEDGER=ok');
    emit(`GATE_LEDGER_DETAIL=No tasks.md under ${ledgerScopeLabel}; the build ran without task ids, so its ledger lines are keyed by area and there is nothing to cross-reference`);
    pass();
  } else if (!isFile(ledgerFile)) {
    emit('GATE_LEDGER=missing');
    emit(`GATE_LEDGER_DETAIL=No build-ledger.md at ${ledgerScopeLabel}/build-ledger.md, but ${ledgerScopeLabel}/tasks.md declares Execution tasks`);
  } else {
    const execIds = readExecIds(ledgerTasks);
    const lines = readLines(ledgerFile);
    const missing = [];
    for (const tid of execIds) {
      const pattern = new RegExp(`^${tid}:[ \t]+complete`);
      if (!lines.some((line) => pattern.test(line))) missing.push(tid);
    }
    if (missing.length === 0) {
      emit('GATE_LEDGER=ok');
      emit(`GATE_LEDGER_DETAIL=${execIds.length} Execution task(s) checked, every one carries a complete line`);
      pass();
    } else {
      const total = missing.length;
      let shown = missing.slice(0, 10).join(' ');
      if (total > 10) shown = `${shown} +${total - 10} more`;
      emit('GATE_LEDGER=broken');
      emit(`GATE_LEDGER_DETAIL=Execution task(s) with no complete line in ${ledgerScopeLabel}/build-ledger.md: ${shown}`);
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  emit(`GATES_OK=${GATES_OK}/5`);
  return undefined;
}

main(process.argv.slice(2));
