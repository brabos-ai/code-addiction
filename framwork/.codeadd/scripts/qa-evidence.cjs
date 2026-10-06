#!/usr/bin/env node
/**
 * qa-evidence.cjs — QA evidence lifecycle.
 *
 * Allocates, inspects, validates and promotes QA run evidence. Native port of
 * qa-evidence.sh (F13); the shipped shell entry stays as the baseline
 * comparison until F20 retires it.
 *
 * Modes:
 *   scopes|working-baseline <feature-dir>
 *   next <scope-dir>
 *   previous <scope-dir> <run-NNN>
 *   validate|promote <feature-dir> <baseline>
 *   ensure-ignore <project-root>
 *
 * Preserved contract:
 *   - every resolved directory is a real path; a symlinked scope, tests dir,
 *     run dir, report, final root/snapshot or .gitignore is refused;
 *   - a scope must stay inside its feature and a run inside its tests dir;
 *   - promotion is gated on a validation whose baseline equals the current
 *     working evidence, checks every immutable final snapshot before copying
 *     any scope, and is an idempotent no-op on an identical retry;
 *   - validate prints SOURCE=/REPORT=/STATUS=/BASELINE=; promote prints
 *     ACTION=/SCOPE=/FINAL=/FINAL_REPORT= plus the report metadata;
 *   - usage is exit 2, a domain failure is STATUS=ERROR/ERROR=<message> exit 1.
 *
 * Built-ins only. No shell.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** A domain failure: printed as STATUS=ERROR/ERROR=<message>, exit 1. */
class FailError extends Error {}

function fail(message) {
  throw new FailError(message);
}

function write(line) {
  process.stdout.write(line + '\n');
}

function usage() {
  process.stdout.write(
    [
      'Usage: node .codeadd/scripts/qa-evidence.cjs scopes|working-baseline <feature-dir>',
      '       node .codeadd/scripts/qa-evidence.cjs next <scope-dir>',
      '       node .codeadd/scripts/qa-evidence.cjs previous <scope-dir> <run-NNN>',
      '       node .codeadd/scripts/qa-evidence.cjs validate|promote <feature-dir> <baseline>',
      '       node .codeadd/scripts/qa-evidence.cjs ensure-ignore <project-root>',
    ].join('\n') + '\n',
  );
  process.exitCode = 2;
}

// --- filesystem predicates ---------------------------------------------------

function isSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** `[ -d ]` semantics: follows symlinks. */
function isDirectory(p) {
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

/** `(cd p && pwd -P)`: realpath, must be a directory. */
function resolveDir(p) {
  let resolved;
  try {
    resolved = fs.realpathSync(p);
  } catch {
    return null;
  }
  return isDirectory(resolved) ? resolved : null;
}

function requireDir(p) {
  const resolved = resolveDir(p);
  if (resolved === null) fail(`Directory not found: ${p}`);
  return resolved;
}

/** True when `child` is `parent` or lives under it (real paths). */
function isWithin(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function requireContainedDir(p, parent, label) {
  if (isSymlink(p)) fail(`${label} must not be a symlink: ${p}`);
  const resolved = requireDir(p);
  if (!isWithin(resolved, parent)) fail(`${label} escapes its parent: ${resolved}`);
  return resolved;
}

/** Refuse a symlink anywhere in the tree, following none. */
function rejectTreeSymlinks(root) {
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const p = path.join(current, entry.name);
      if (entry.isSymbolicLink()) fail(`QA evidence contains a symlink: ${p}`);
      if (entry.isDirectory()) stack.push(p);
    }
  }
}

// --- scope/run discovery -----------------------------------------------------

function scopeKey(scopeDir) {
  const name = path.basename(scopeDir);
  const match = /^(SF[0-9][0-9])-/.exec(name);
  return match ? match[1] : 'feature';
}

function listScopes(featureDir) {
  const rows = [{ key: 'feature', scope: featureDir }];
  const seen = new Set(['feature']);
  const subRoot = path.join(featureDir, 'subfeatures');
  let names = [];
  try {
    names = fs.readdirSync(subRoot).sort();
  } catch {
    names = [];
  }
  for (const name of names) {
    if (!/^SF[0-9][0-9]-/.test(name)) continue;
    const sub = path.join(subRoot, name);
    if (!isDirectory(sub)) continue;
    const key = scopeKey(sub);
    if (seen.has(key)) fail(`Duplicate QA scope key under feature: ${key}`);
    seen.add(key);
    const resolved = requireContainedDir(sub, featureDir, 'QA scope');
    rows.push({ key, scope: resolved });
  }
  return rows;
}

function runDirs(scopeDir, store) {
  const tests = path.join(scopeDir, '_tests');
  const root = store === 'final' ? path.join(tests, 'final') : tests;
  if (isSymlink(tests)) fail(`QA tests directory must not be a symlink: ${tests}`);
  if (isSymlink(root)) fail(`QA evidence store must not be a symlink: ${root}`);
  let names = [];
  try {
    names = fs.readdirSync(root).sort();
  } catch {
    return [];
  }
  const dirs = [];
  for (const name of names) {
    if (!/^run-[0-9][0-9][0-9]$/.test(name)) continue;
    const dir = path.join(root, name);
    if (!isDirectory(dir)) continue;
    if (isSymlink(dir)) fail(`QA run directory must not be a symlink: ${dir}`);
    dirs.push(dir);
  }
  return dirs;
}

function highestId(scopeDir, stores) {
  let max = 0;
  for (const store of stores) {
    for (const dir of runDirs(scopeDir, store)) {
      const value = Number.parseInt(path.basename(dir).slice('run-'.length), 10);
      if (value > max) max = value;
    }
  }
  return String(max).padStart(3, '0');
}

// --- baselines ---------------------------------------------------------------

function workingBaseline(featureDir) {
  const entries = [];
  for (const { key, scope } of listScopes(featureDir)) {
    const id = highestId(scope, ['working']);
    if (id !== '000') entries.push(`${key}:run-${id}`);
  }
  if (entries.length === 0) return 'none';
  entries.sort();
  return entries.join(',');
}

function parseBaseline(raw) {
  const normalized = String(raw)
    .replace(/\s*·\s*/g, ',')
    .replace(/\s*;\s*/g, ',')
    .trim();
  if (normalized === 'none') return [{ key: 'none', run: 'none' }];
  if (normalized === '') fail('Baseline is empty');

  const seen = new Set();
  const out = [];
  for (const rawItem of normalized.split(',')) {
    const item = rawItem.trim();
    const match = /^(feature|SF[0-9][0-9]):(run-[0-9][0-9][0-9])$/.exec(item);
    if (!match) fail(`Malformed baseline entry: ${item}`);
    const key = match[1];
    const run = match[2];
    if (seen.has(key)) fail(`Duplicate baseline scope: ${key}`);
    seen.add(key);
    out.push({ key, run });
  }
  out.sort((a, b) => {
    const x = `${a.key}|${a.run}`;
    const y = `${b.key}|${b.run}`;
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return out;
}

function scopeForKey(featureDir, wanted) {
  for (const { key, scope } of listScopes(featureDir)) {
    if (key === wanted) return scope;
  }
  return null;
}

// --- report validation -------------------------------------------------------

const REPORT_SECTIONS = [
  'TOC',
  'TL;DR',
  'Summary',
  'Coverage',
  'Functional delivery',
  'Findings',
  'Responsiveness',
  'Accessibility',
  'Fix Routing',
  'Clean screens',
  'Not covered / caveats',
];

const SEVERITIES = ['Blocker', 'Major', 'Minor', 'Polish'];

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The third pipe-field of the row whose label field equals `field`. */
function severityCount(reportText, field) {
  for (const line of reportText.split('\n')) {
    const parts = line.split('|');
    if (parts.length < 3) continue;
    if (parts[1].trim() === field) return parts[2].replace(/\s/g, '');
  }
  return null;
}

function validateReport(source, run, featureDir) {
  const nnn = run.slice('run-'.length);
  const report = path.join(source, `qa-validation-${nnn}.md`);

  const featureName = path.basename(featureDir);
  const idMatch = /^([0-9][0-9][0-9][0-9][A-Z])-/.exec(featureName);
  if (!idMatch) fail(`Cannot derive feature ID from: ${featureDir}`);
  const featureId = idMatch[1];

  if (!isFile(report)) fail(`Missing source report: ${report}`);
  if (isSymlink(report)) fail(`QA report must not be a symlink: ${report}`);

  const text = fs.readFileSync(report, 'utf8');
  const lines = text.split('\n');
  if (lines[0] !== '---') fail(`Schema-invalid report missing frontmatter: ${report}`);

  let endIdx = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (/^---\s*$/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) fail(`Schema-invalid report has unclosed frontmatter: ${report}`);

  const front = lines.slice(1, endIdx);
  const hasLine = (re) => front.some((line) => re.test(line));

  if (!hasLine(new RegExp(`^id:\\s*${escapeRe(featureId)}-qa-validation-${nnn}\\s*$`))) {
    fail(`Source/report number mismatch: ${report}`);
  }
  if (!hasLine(/^type:\s*qa-validation\s*$/)) fail(`Invalid qa-validation type: ${report}`);
  if (!hasLine(/^created:\s*[0-9]{4}-[0-9]{2}-[0-9]{2}\s*$/)) {
    fail(`Schema-invalid report field created: ${report}`);
  }
  if (!hasLine(new RegExp(`^feature:\\s*${escapeRe(featureId)}\\s*$`))) {
    fail(`Schema-invalid report field feature: ${report}`);
  }
  for (const field of ['scope', 'method', 'viewports']) {
    if (!hasLine(new RegExp(`^${field}:\\s*\\S.*$`))) {
      fail(`Schema-invalid report field ${field}: ${report}`);
    }
  }
  if (!hasLine(/^specs:\s*\{.*about:.*design:.*\}\s*$/)) {
    fail(`Schema-invalid report field specs: ${report}`);
  }
  if (!hasLine(/^judged-contract:\s*sha256:[0-9a-f]+\s*$/)) {
    fail(`Schema-invalid report field judged-contract: ${report}`);
  }
  for (const section of REPORT_SECTIONS) {
    const re = new RegExp(`^## ${escapeRe(section)}(?=[\\s(]|$)`, 'im');
    if (!re.test(text)) fail(`Schema-invalid report missing ${section}: ${report}`);
  }
  for (const field of SEVERITIES) {
    const count = severityCount(text, field);
    if (count === null || !/^[0-9]+$/.test(count)) {
      fail(`Schema-invalid ${field} severity count: ${report}`);
    }
  }
  return report;
}

function writeReportMetadata(report) {
  const text = fs.readFileSync(report, 'utf8');
  const createdLine = text.split('\n').find((line) => /^created:\s*/.test(line));
  const created = createdLine ? createdLine.replace(/^created:\s*/, '') : '';
  write(`REPORT_CREATED=${created}`);
  for (const field of SEVERITIES) {
    const count = severityCount(text, field);
    write(`${field.toUpperCase()}_COUNT=${count === null ? '' : count}`);
  }
}

// --- validate / promote ------------------------------------------------------

function validateBaseline(featureDir, raw) {
  const parsed = parseBaseline(raw);
  const isNone = parsed.length === 1 && parsed[0].key === 'none';
  const expected = isNone ? 'none' : parsed.map((p) => `${p.key}:${p.run}`).join(',');
  const current = workingBaseline(featureDir);
  if (expected !== current) {
    fail(
      `Review baseline differs from current working evidence (baseline=${expected} current=${current})`,
    );
  }

  const out = [];
  if (current === 'none') {
    out.push('STATUS=OK', 'BASELINE=none');
    return out.join('\n') + '\n';
  }

  for (const { key, run } of parsed) {
    const scope = scopeForKey(featureDir, key);
    if (scope === null) fail(`Baseline scope not found under feature: ${key}`);
    if (!isWithin(scope, featureDir)) fail(`Scope escapes feature directory: ${scope}`);
    const testsDir = requireContainedDir(path.join(scope, '_tests'), scope, 'QA tests directory');
    const source = requireContainedDir(path.join(testsDir, run), testsDir, 'Baseline source');
    rejectTreeSymlinks(source);
    const report = validateReport(source, run, featureDir);
    out.push(`SOURCE=${source}`, `REPORT=${report}`);
  }
  out.push('STATUS=OK', `BASELINE=${current}`);
  return out.join('\n') + '\n';
}

function treesEqual(a, b) {
  const sa = fs.statSync(a);
  const sb = fs.statSync(b);
  if (sa.isDirectory() !== sb.isDirectory()) return false;
  if (!sa.isDirectory()) {
    if (sa.size !== sb.size) return false;
    return fs.readFileSync(a).equals(fs.readFileSync(b));
  }
  const ea = fs.readdirSync(a).sort();
  const eb = fs.readdirSync(b).sort();
  if (ea.length !== eb.length) return false;
  for (let i = 0; i < ea.length; i += 1) {
    if (ea[i] !== eb[i]) return false;
    if (!treesEqual(path.join(a, ea[i]), path.join(b, eb[i]))) return false;
  }
  return true;
}

/** `cp -a src/. dest/`: copy the tree contents into an existing directory. */
function copyTree(src, dest) {
  const st = fs.lstatSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyTree(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.copyFileSync(src, dest);
  fs.chmodSync(dest, st.mode & 0o777);
}

function rmrf(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* best effort, matching the shell cleanup */
  }
}

function promoteBaseline(featureDir, raw) {
  const validation = validateBaseline(featureDir, raw);
  process.stdout.write(validation);
  if (workingBaseline(featureDir) === 'none') return;
  const parsed = parseBaseline(raw);

  // Check every immutable destination before copying the first scope. A
  // conflict must never leave a newly promoted subset behind.
  for (const { key, run } of parsed) {
    const scope = scopeForKey(featureDir, key);
    if (scope === null) fail(`Baseline scope not found under feature: ${key}`);
    const testsDir = requireContainedDir(path.join(scope, '_tests'), scope, 'QA tests directory');
    const source = requireContainedDir(path.join(testsDir, run), testsDir, 'Baseline source');
    rejectTreeSymlinks(source);
    let finalRoot = path.join(testsDir, 'final');
    if (fs.existsSync(finalRoot)) {
      finalRoot = requireContainedDir(finalRoot, testsDir, 'Final evidence root');
    }
    const destination = path.join(finalRoot, run);
    if (fs.existsSync(destination)) {
      requireContainedDir(destination, finalRoot, 'Final snapshot');
      rejectTreeSymlinks(destination);
      if (!treesEqual(source, destination)) {
        fail(`Immutable final snapshot conflict: ${destination}`);
      }
    }
  }

  for (const { key, run } of parsed) {
    const scope = scopeForKey(featureDir, key);
    if (scope === null) fail(`Baseline scope not found under feature: ${key}`);
    const testsDir = requireContainedDir(path.join(scope, '_tests'), scope, 'QA tests directory');
    const source = requireContainedDir(path.join(testsDir, run), testsDir, 'Baseline source');
    let finalRoot = path.join(testsDir, 'final');
    if (isSymlink(finalRoot)) fail(`Final evidence root must not be a symlink: ${finalRoot}`);
    fs.mkdirSync(finalRoot, { recursive: true });
    finalRoot = requireContainedDir(finalRoot, testsDir, 'Final evidence root');
    const destination = path.join(finalRoot, run);
    const report = path.join(destination, `qa-validation-${run.slice('run-'.length)}.md`);

    let action;
    if (isDirectory(destination)) {
      requireContainedDir(destination, finalRoot, 'Final snapshot');
      rejectTreeSymlinks(destination);
      if (!treesEqual(source, destination)) {
        fail(`Immutable final snapshot conflict: ${destination}`);
      }
      action = 'noop';
    } else {
      if (fs.existsSync(destination)) {
        fail(`Final snapshot path is not a directory: ${destination}`);
      }
      let temp = fs.mkdtempSync(path.join(finalRoot, `.run-${run.slice('run-'.length)}.`));
      temp = requireContainedDir(temp, finalRoot, 'Temporary final snapshot');
      try {
        copyTree(source, temp);
      } catch {
        rmrf(temp);
        fail(`Failed to copy baseline source: ${source}`);
      }
      fs.renameSync(temp, destination);
      action = 'promoted';
    }

    write(`ACTION=${action}`);
    write(`SCOPE=${key}`);
    write(`FINAL=${destination}`);
    write(`FINAL_REPORT=${report}`);
    writeReportMetadata(report);
  }
}

// --- ensure-ignore -----------------------------------------------------------

const IGNORE_START = '# ADD QA evidence - managed by add-qa-setup';
const IGNORE_LEGACY = '# ADD QA evidence - managed by add.qa-setup';
const IGNORE_END = '# END ADD QA evidence';
const IGNORE_LINE = 'docs/features/**/_tests/run-*/';

/** awk-style records: newline separated, no phantom record for a trailing \n. */
function awkRecords(content) {
  if (content === '') return [];
  const records = content.split('\n');
  if (records[records.length - 1] === '') records.pop();
  return records;
}

function ensureIgnore(projectRoot) {
  const file = path.join(projectRoot, '.gitignore');
  if (isSymlink(file)) fail(`.gitignore must not be a symlink: ${file}`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, '');

  const raw = fs.readFileSync(file, 'utf8');
  const starts = raw
    .split('\n')
    .filter((line) => line === IGNORE_START || line === IGNORE_LEGACY).length;
  const ends = raw.split('\n').filter((line) => line === IGNORE_END).length;
  if (starts !== ends) fail('Malformed QA evidence block in .gitignore');

  const normalized = raw.replace(
    /# ADD QA evidence - managed by add\.qa-setup/g,
    IGNORE_START,
  );
  const out = [];
  let inserted = false;
  let skipping = false;
  for (const rawLine of awkRecords(normalized)) {
    const line = rawLine.replace(/\r$/, '');
    if (line === IGNORE_START) {
      if (!inserted) {
        out.push(IGNORE_START, IGNORE_LINE, IGNORE_END);
        inserted = true;
      }
      skipping = true;
      continue;
    }
    if (skipping && line === IGNORE_END) {
      skipping = false;
      continue;
    }
    if (!skipping) out.push(line);
  }
  if (!inserted) {
    if (out.length > 0) out.push('');
    out.push(IGNORE_START, IGNORE_LINE, IGNORE_END);
  }
  fs.writeFileSync(file, out.join('\n') + '\n');
  write('STATUS=OK');
  write(`GITIGNORE=${file}`);
}

// --- entry -------------------------------------------------------------------

async function main(argv) {
  const operation = argv[0] || '';

  switch (operation) {
    case 'scopes': {
      if (argv.length !== 2) return usage();
      const featureDir = requireDir(argv[1]);
      for (const { key, scope } of listScopes(featureDir)) {
        write(`SCOPE=${key}`);
        write(`SCOPE_DIR=${scope}`);
      }
      return undefined;
    }
    case 'next': {
      if (argv.length !== 2) return usage();
      const scopeDir = requireDir(argv[1]);
      const current = highestId(scopeDir, ['working', 'final']);
      if (current === '999') fail(`QA run limit reached at run-999 for scope: ${scopeDir}`);
      const next = String(Number.parseInt(current, 10) + 1).padStart(3, '0');
      write(`RUN_ID=run-${next}`);
      write(`RUN_NUMBER=${next}`);
      return undefined;
    }
    case 'previous': {
      if (argv.length !== 3) return usage();
      const scopeDir = requireDir(argv[1]);
      const runMatch = /^run-([0-9][0-9][0-9])$/.exec(argv[2]);
      if (!runMatch) fail(`Malformed run ID: ${argv[2]}`);
      const target = Number.parseInt(runMatch[1], 10);

      const values = new Set();
      for (const store of ['working', 'final']) {
        for (const dir of runDirs(scopeDir, store)) {
          values.add(Number.parseInt(path.basename(dir).slice('run-'.length), 10));
        }
      }
      let previous = 0;
      for (const value of values) {
        if (value < target && value > previous) previous = value;
      }

      if (previous === 0) {
        write('PREVIOUS=none');
        return undefined;
      }

      const previousId = String(previous).padStart(3, '0');
      const working = path.join(
        scopeDir,
        '_tests',
        `run-${previousId}`,
        `qa-validation-${previousId}.md`,
      );
      const final = path.join(
        scopeDir,
        '_tests',
        'final',
        `run-${previousId}`,
        `qa-validation-${previousId}.md`,
      );
      let featureDir;
      if (/^SF[0-9][0-9]-/.test(path.basename(scopeDir))) {
        featureDir = requireDir(path.join(scopeDir, '..', '..'));
      } else {
        featureDir = scopeDir;
      }
      let report;
      if (isFile(working)) report = working;
      else if (isFile(final)) report = final;
      else fail(`Immediate predecessor run-${previousId} has no report`);

      const testsDir = requireContainedDir(
        path.join(scopeDir, '_tests'),
        scopeDir,
        'QA tests directory',
      );
      const source = requireContainedDir(
        path.dirname(report),
        testsDir,
        'Previous run source',
      );
      rejectTreeSymlinks(source);
      report = validateReport(source, `run-${previousId}`, featureDir);
      write(`PREVIOUS=run-${previousId}`);
      write(`PREVIOUS_REPORT=${report}`);
      return undefined;
    }
    case 'working-baseline': {
      if (argv.length !== 2) return usage();
      const featureDir = requireDir(argv[1]);
      write(`BASELINE=${workingBaseline(featureDir)}`);
      return undefined;
    }
    case 'validate': {
      if (argv.length !== 3) return usage();
      const featureDir = requireDir(argv[1]);
      process.stdout.write(validateBaseline(featureDir, argv[2]));
      return undefined;
    }
    case 'promote': {
      if (argv.length !== 3) return usage();
      const featureDir = requireDir(argv[1]);
      promoteBaseline(featureDir, argv[2]);
      return undefined;
    }
    case 'ensure-ignore': {
      if (argv.length !== 2) return usage();
      ensureIgnore(requireDir(argv[1]));
      return undefined;
    }
    default:
      return usage();
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    () => {},
    (err) => {
      if (err instanceof FailError) {
        process.stdout.write('STATUS=ERROR\n');
        process.stdout.write(`ERROR=${err.message}\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write('STATUS=ERROR\n');
      process.stdout.write(`ERROR=${err && err.message ? err.message : String(err)}\n`);
      process.exitCode = 1;
    },
  );
}

module.exports = {
  FailError,
  listScopes,
  runDirs,
  highestId,
  workingBaseline,
  parseBaseline,
  scopeForKey,
  validateReport,
  validateBaseline,
  promoteBaseline,
  ensureIgnore,
};
