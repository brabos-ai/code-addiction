#!/usr/bin/env node
/**
 * init.cjs — Project initialization snapshot, compact for agents.
 *
 * Native port of init.sh (v3 - Centralized Metadata). Prints the same
 * KEY:VALUE block, in the same order, with the same meaning:
 *
 *   GIT:branch=<name> type=<type> main=<main> uncommitted=<n>
 *   FEATURES:count=<n> next=<NNNNT>
 *   CURRENT:<slug> docs=[about.md,plan.md,...]      (when on a work branch)
 *   ARCH:AGENTS.md | ARCH:none
 *   LEGACY_CONTEXT:<a,b,c>                          (only when any exists)
 *   STACK:<nestjs,express,...>                      (only when package.json)
 *   MODULES:<a,b,...>                               (only when modules dir)
 *   RECENT_CHANGELOGS:                              (only when changelogs)
 *     <id>|<summary>
 *   CHANGELOGS_PATH:docs/features/{[0-9][0-9][0-9][0-9][A-Z]-*}/changelog.md
 *
 * READ-ONLY WITH RESPECT TO GIT. This entry never creates, checks out or
 * mutates a branch, ref, the index or the working tree. The only filesystem
 * mutation is `mkdir -p docs/features`, exactly as the shell did.
 *
 * DELEGATION. Branch detection is `get-branch-metadata.cjs`, main-branch
 * detection is `get-main-branch.cjs` and the next id comes from the one
 * canonical allocator `backlog-id.cjs` (through the same `calculate` core
 * that `next-id.cjs` renders). The old shell also re-checked that its helper
 * files existed and were executable; a sibling `require` fails loudly on a
 * missing helper, which is the native route to the same guarantee.
 *
 * Exit codes (preserved):
 *   0 — snapshot printed
 *   1 — git is not installed / not a git repository
 *   2 — no verifiable main branch
 *
 * Dependencies: Node built-ins only, plus the sibling helpers; git on PATH.
 * No bash, no WSL, no shell, no stdin.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { discoverMainBranch } = require('./get-main-branch.cjs');
const { currentBranch, branchMetadata } = require('./get-branch-metadata.cjs');
const idc = require('./backlog-id.cjs');

const DOCS_DIR = 'docs/features';

// The one context file, then the legacy files a stale root may still carry.
const LEGACY_CONTEXT_FILES = ['CLAUDE.md', '.claude/CLAUDE.md', 'GEMINI.md'];

// Ordered exactly as the shell grepped for them.
const STACK_MARKERS = [
  ['@nestjs', 'nestjs'],
  ['express', 'express'],
  ['"react"', 'react'],
  ['kysely', 'kysely'],
  ['prisma', 'prisma'],
  ['bullmq', 'bullmq'],
];

// The per-feature docs init reports, in the shell's fixed order.
const FEATURE_DOCS = [
  'about.md',
  'discovery.md',
  'design.md',
  'plan.md',
  'changelog.md',
  'hotfix.md',
  'related.md',
];

// Same immediate-basename anchor the allocator uses: `[NNNN][L]-<slug>`.
const FEATURE_DIR_RE = /^[0-9]{4}[A-Z]-/;

/** One git invocation, shell-free; a spawn failure is a non-zero status. */
function git(cwd, args) {
  const res = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: res.status === null || res.status === undefined ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

/** `command -v git`: a version probe that succeeds only when git is runnable. */
function gitAvailable() {
  const res = spawnSync('git', ['--version'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });
  return !res.error && res.status === 0;
}

/**
 * The value as bash `eval` would assign it: get-branch-metadata.cjs renders
 * `BRANCH_NAME='(detached)'` so a shell can eval it, and eval strips the
 * single quotes. Every other rendered value is unquoted.
 */
function evalValue(value) {
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}

/** The feature directories under docs/features, `[NNNN][L]-*`, sorted. */
function featureDirs(docsAbs) {
  let entries;
  try {
    entries = fs.readdirSync(docsAbs, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory() && FEATURE_DIR_RE.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

/** The ordered feature docs present in a feature directory. */
function presentDocs(workDirAbs) {
  return FEATURE_DOCS.filter((name) => fs.existsSync(path.join(workDirAbs, name)));
}

/**
 * The changelogs under docs/features at depth 2, newest first, capped at five
 * — what `find -maxdepth 2 -name changelog.md | xargs ls -t | head -5` gave.
 */
function recentChangelogs(docsAbs) {
  let dirs;
  try {
    dirs = fs.readdirSync(docsAbs, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  const found = [];
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(docsAbs, entry.name, 'changelog.md');
    if (!fs.existsSync(candidate)) continue;
    let stat;
    try {
      stat = fs.statSync(candidate);
    } catch (e) {
      continue;
    }
    found.push({ file: candidate, mtimeMs: stat.mtimeMs });
  }
  found.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return found.slice(0, 5).map((f) => f.file);
}

/**
 * The summary the shell's awk extracted: the first content line after a
 * `## Resumo`/`## Summary` H2 that is neither empty nor a heading, blockquote
 * or bracket line, trimmed and capped at 120 chars. Falls back to the first
 * `# ` title, capped at 80 chars.
 */
function extractSummary(content) {
  const lines = content.split(/\r?\n/);
  let found = false;
  for (const line of lines) {
    if (/^## Resumo/.test(line) || /^## Summary/.test(line)) {
      found = true;
      continue;
    }
    if (!found) continue;
    if (line.trim() === '') continue;
    const first = line[0];
    if (first === '#' || first === '>' || first === '[') continue;
    return line.replace(/^\s+|\s+$/g, '').slice(0, 120);
  }
  for (const line of lines) {
    if (line.startsWith('# ')) return line.slice(2).trim().slice(0, 80);
  }
  return '';
}

/**
 * Build the full snapshot as an array of output lines. Pure with respect to
 * git; the caller owns writing and the exit code. `main` is the pre-resolved
 * main-branch probe: the entry checks it before any filesystem mutation, so
 * `docs/features` is never created on a fatal path.
 */
function snapshot(cwd = process.cwd(), main = discoverMainBranch(cwd)) {
  const lines = [];

  const meta = branchMetadata(currentBranch(cwd));
  const branchName = evalValue(meta.BRANCH_NAME);

  const status = git(cwd, ['status', '--porcelain']);
  const uncommitted = status.stdout.split(/\r?\n/).filter((l) => l.length > 0).length;

  lines.push(
    `GIT:branch=${branchName} type=${meta.BRANCH_TYPE} main=${main.ok ? main.branch : ''} ` +
      `uncommitted=${uncommitted}`,
  );

  const docsAbs = path.join(cwd, DOCS_DIR);
  fs.mkdirSync(docsAbs, { recursive: true });
  const dirs = featureDirs(docsAbs);

  const allocated = idc.calculate(cwd, 'F', { allowOverflow: true });
  const next = allocated.ok ? allocated.id : '0001F';
  lines.push(`FEATURES:count=${dirs.length} next=${next}`);

  const featureId = meta.FEATURE_SLUG;
  let workDirAbs = '';
  if (featureId !== '') {
    workDirAbs = path.join(docsAbs, featureId);
    lines.push(`CURRENT:${featureId} docs=[${presentDocs(workDirAbs).join(',')}]`);
  }

  lines.push(fs.existsSync(path.join(cwd, 'AGENTS.md')) ? 'ARCH:AGENTS.md' : 'ARCH:none');

  const legacy = LEGACY_CONTEXT_FILES.filter((f) => fs.existsSync(path.join(cwd, f)));
  if (legacy.length > 0) lines.push(`LEGACY_CONTEXT:${legacy.join(',')}`);

  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = fs.readFileSync(pkgPath, 'utf8');
    const stack = STACK_MARKERS.filter(([marker]) => pkg.includes(marker)).map(([, name]) => name);
    if (stack.length > 0) lines.push(`STACK:${stack.join(',')}`);
  }

  const modulesAbs = path.join(cwd, 'apps/backend/src/api/modules');
  if (fs.existsSync(modulesAbs) && fs.statSync(modulesAbs).isDirectory()) {
    const modules = fs.readdirSync(modulesAbs).sort();
    if (modules.length > 0) lines.push(`MODULES:${modules.join(',')}`);
  }

  const changelogs = recentChangelogs(docsAbs);
  if (changelogs.length > 0) {
    lines.push('RECENT_CHANGELOGS:');
    for (const file of changelogs) {
      const normalized = file.split(path.sep).join('/');
      const match = normalized.match(/[0-9]{4}[A-Z]-[^/]+/);
      if (!match) continue;
      const summary = extractSummary(fs.readFileSync(file, 'utf8'));
      if (summary !== '') lines.push(`  ${match[0]}|${summary}`);
    }
    lines.push('CHANGELOGS_PATH:docs/features/{[0-9][0-9][0-9][0-9][A-Z]-*}/changelog.md');
  }

  if (meta.BRANCH_TYPE === 'main') {
    lines.push('REC:create feature branch with /add-feature');
  } else if (featureId !== '') {
    lines.push(
      fs.existsSync(workDirAbs)
        ? `REC:continue work on ${featureId}`
        : `REC:create docs for ${featureId}`,
    );
  }

  return { lines, main };
}

function main() {
  if (!gitAvailable()) {
    process.stderr.write('ERROR: git is not installed or not in PATH\n');
    return 1;
  }

  // A missing main reference is fatal in the shell (`set -e` on the helper
  // substitution); the helper's own exit code is preserved. Checked before
  // snapshot so the fatal path performs no filesystem mutation.
  const cwd = process.cwd();
  const main = discoverMainBranch(cwd);
  if (!main.ok) {
    if (main.reason === 'not-a-git-repo') {
      process.stderr.write('ERROR: current directory is not a git repository.\n');
      return 1;
    }
    process.stderr.write('ERROR: no main branch found (main/master absent locally and remotely).\n');
    return 2;
  }

  const probe = snapshot(cwd, main);
  process.stdout.write(`${probe.lines.join('\n')}\n`);
  return 0;
}

module.exports = {
  DOCS_DIR,
  FEATURE_DOCS,
  git,
  evalValue,
  featureDirs,
  presentDocs,
  recentChangelogs,
  extractSummary,
  snapshot,
  main,
};

if (require.main === module) {
  process.exitCode = main();
}
