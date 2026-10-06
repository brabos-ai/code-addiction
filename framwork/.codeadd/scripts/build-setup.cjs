#!/usr/bin/env node
/**
 * build-setup.cjs — Create-or-checkout the branch a feature's about.md decided.
 *
 * Native port of build-setup.sh. Given a feature id or slug it resolves the
 * feature directory, reads (or derives) the branch, validates it, and then
 * creates or checks out that branch — in the working tree or in a worktree.
 *
 * Usage:
 *   node .codeadd/scripts/build-setup.cjs <FEATURE_ID|FEATURE_SLUG> [--worktree]
 *
 * Output (parseable, last non-hint line):
 *   BRANCH:<name> STATE:created|existing|current MODE:in-place|worktree [DERIVED:true] [WORKTREE:<path>]
 *
 * Exit codes (preserved):
 *   0 — success
 *   2 — feature dir not found / ambiguous / missing argument
 *   3 — invalid branch: format or slug != dirname (Hard Invariant)
 *   4 — no verifiable main branch
 *   5 — dirty tracked working tree (in-place mode, and only when a checkout will
 *       happen — already on the target branch is a resumed build and passes)
 *
 * MUTATION GUARDS. In-place mode refuses a working tree with tracked
 * modifications before it checks anything out; a tree that is already on the
 * target branch is left alone. Worktree mode skips that guard (it never
 * disturbs the current checkout) and copies untracked feature docs into the
 * new worktree, because `worktree add` does not follow them.
 *
 * Dependencies: Node built-ins only, git on PATH, and the sibling
 * get-main-branch.cjs / get-branch-metadata.cjs helpers. No shell.
 */

'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { discoverMainBranch } = require('./get-main-branch.cjs');
const { currentBranch } = require('./get-branch-metadata.cjs');

const FEATURES_DIR = 'docs/features';

// The legacy ID-letter → branch type map.
const TYPE_BY_LETTER = {
  F: 'feature',
  H: 'hotfix',
  R: 'refactor',
  C: 'chore',
  D: 'docs',
  P: 'perf',
  T: 'test',
};

const ID_ARG_RE = /^[0-9]{4}[A-Z]$/;
const BRANCH_RE = /^[a-z]+\/[0-9]{4}[A-Z]-[a-z0-9-]+$/;
const DIR_LETTER_RE = /^[0-9]{4}([A-Z])/;

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

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

/** `git show-ref --verify --quiet refs/heads/<branch>`. */
function refExists(cwd, branch) {
  return git(cwd, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0;
}

/** Whether `.worktrees/<dirname>` is already a registered worktree. */
function worktreeRegistered(cwd, dirname) {
  const res = git(cwd, ['worktree', 'list', '--porcelain']);
  const escaped = dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^worktree .*/\\.worktrees/${escaped}$`);
  return res.stdout
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\\/g, '/'))
    .some((line) => re.test(line));
}

/** Ensure `.worktrees/` is gitignored — the shell appended the line if absent. */
function ensureGitignore(cwd) {
  const ignorePath = path.join(cwd, '.gitignore');
  let content = '';
  if (fs.existsSync(ignorePath)) content = fs.readFileSync(ignorePath, 'utf8');
  if (!content.includes('.worktrees/')) fs.appendFileSync(ignorePath, '.worktrees/\n');
}

function parseArgs(argv) {
  let featureArg = '';
  let worktree = false;
  for (const arg of argv) {
    if (arg === '--worktree') worktree = true;
    else featureArg = arg;
  }
  return { featureArg, worktree };
}

/**
 * Resolve the feature directory (relative, forward slashes) from an id glob or
 * an exact slug. Returns `{ ok: true, featureDir, dirname }` or
 * `{ ok: false, code }` after writing the diagnostic.
 */
function resolveFeature(cwd, featureArg) {
  const baseAbs = path.join(cwd, FEATURES_DIR);
  if (ID_ARG_RE.test(featureArg)) {
    let names = [];
    try {
      names = fs
        .readdirSync(baseAbs)
        .filter((name) => name.startsWith(`${featureArg}-`))
        .sort();
    } catch (e) {
      names = [];
    }
    if (names.length === 0) {
      process.stderr.write(
        `ERROR: no feature docs match '${featureArg}' (${FEATURES_DIR}/${featureArg}-*).\n`,
      );
      return { ok: false, code: 2 };
    }
    if (names.length > 1) {
      process.stderr.write(`ERROR: ambiguous ID '${featureArg}' matches multiple dirs:\n`);
      for (const name of names) process.stderr.write(`  ${FEATURES_DIR}/${name}\n`);
      return { ok: false, code: 2 };
    }
    return { ok: true, featureDir: `${FEATURES_DIR}/${names[0]}`, dirname: names[0] };
  }

  const featureDir = `${FEATURES_DIR}/${featureArg}`;
  if (!isDirectory(path.join(cwd, featureDir))) {
    process.stderr.write(`ERROR: feature docs not found: ${featureDir}.\n`);
    return { ok: false, code: 2 };
  }
  return { ok: true, featureDir, dirname: featureArg };
}

/** Read `branch:` from about.md frontmatter, or '' when absent. */
function readBranchFromAbout(aboutPath) {
  if (!fs.existsSync(aboutPath)) return '';
  const content = fs.readFileSync(aboutPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('branch:')) return line.slice('branch:'.length).replace(/^[ \t]*/, '');
  }
  return '';
}

/**
 * Run the entry. argv is the argument list after the node/script pair.
 *
 * @returns {number} process exit code
 */
function main(argv = process.argv.slice(2)) {
  const cwd = process.cwd();
  const { featureArg, worktree } = parseArgs(argv);

  if (featureArg === '') {
    process.stderr.write('ERROR: missing <FEATURE_ID|FEATURE_SLUG> argument.\n');
    return 2;
  }

  const resolved = resolveFeature(cwd, featureArg);
  if (!resolved.ok) return resolved.code;
  const { featureDir, dirname } = resolved;

  // --- 2. Read branch: from about.md (legacy fallback if absent) ---
  let branch = readBranchFromAbout(path.join(cwd, featureDir, 'about.md'));
  let derived = false;

  if (branch === '') {
    const match = DIR_LETTER_RE.exec(dirname);
    const type = match ? TYPE_BY_LETTER[match[1]] : undefined;
    if (!type) {
      process.stderr.write(
        `ERROR: cannot derive branch type from dir '${dirname}' (no valid ID letter).\n`,
      );
      return 3;
    }
    branch = `${type}/${dirname}`;
    derived = true;
  }

  // --- 3. Validate format + Hard Invariant (slug == dirname) ---
  if (!BRANCH_RE.test(branch)) {
    process.stderr.write(
      `ERROR: invalid branch value '${branch}' (expected [type]/[NNNN][L]-[slug]).\n`,
    );
    return 3;
  }

  const branchSlug = branch.slice(branch.indexOf('/') + 1);
  if (branchSlug !== dirname) {
    process.stderr.write(
      `ERROR: branch slug '${branchSlug}' != docs dir '${dirname}' (Hard Invariant).\n`,
    );
    return 3;
  }

  // --- 4. Resolve base (local main ref; no network) ---
  const mainProbe = discoverMainBranch(cwd);
  if (!mainProbe.ok) {
    process.stderr.write('ERROR: no verifiable main branch (main/master absent).\n');
    return 4;
  }
  const mainBranch = mainProbe.branch;

  const current = currentBranch(cwd);

  // --- 5. Dirty-tree guard (in-place mode only; untracked allowed) ---
  if (!worktree && current !== branch) {
    const status = git(cwd, ['status', '--porcelain']);
    const dirty = status.stdout
      .split(/\r?\n/)
      .filter((line) => line.length > 0 && !line.startsWith('??'));
    if (dirty.length > 0) {
      process.stderr.write('ERROR: working tree has tracked modifications (commit or stash first):\n');
      for (const line of dirty) process.stderr.write(`${line}\n`);
      return 5;
    }
  }

  // --- 6/7. Create-or-checkout (idempotent) ---
  let mode;
  let state;
  let wtPath = '';
  let wtAbs = '';

  if (!worktree) {
    mode = 'in-place';
    if (current === branch) {
      state = 'current';
    } else if (refExists(cwd, branch)) {
      const result = git(cwd, ['checkout', '-q', branch]);
      if (result.status !== 0) { process.stderr.write(result.stderr); return result.status || 1; }
      state = 'existing';
    } else {
      const result = git(cwd, ['checkout', '-q', '-b', branch, mainBranch]);
      if (result.status !== 0) { process.stderr.write(result.stderr); return result.status || 1; }
      state = 'created';
    }
  } else {
    mode = 'worktree';
    wtPath = `.worktrees/${dirname}`;

    ensureGitignore(cwd);

    if (worktreeRegistered(cwd, dirname)) {
      state = 'current';
    } else {
      if (refExists(cwd, branch)) {
        const result = git(cwd, ['worktree', 'add', '-q', wtPath, branch]);
        if (result.status !== 0) { process.stderr.write(result.stderr); return result.status || 1; }
        state = 'existing';
      } else {
        const result = git(cwd, ['worktree', 'add', '-q', '-b', branch, wtPath, mainBranch]);
        if (result.status !== 0) { process.stderr.write(result.stderr); return result.status || 1; }
        state = 'created';
      }
      // Untracked feature docs do not follow `worktree add` — copy them in.
      const destParent = path.join(cwd, wtPath, path.dirname(featureDir));
      fs.mkdirSync(destParent, { recursive: true });
      fs.cpSync(path.join(cwd, featureDir), path.join(destParent, dirname), { recursive: true });
    }

    wtAbs = path.resolve(cwd, wtPath);
  }

  // --- 8. Output ---
  let out = `BRANCH:${branch} STATE:${state} MODE:${mode}`;
  if (derived) out += ' DERIVED:true';
  if (worktree) out += ` WORKTREE:${wtAbs}`;
  process.stdout.write(`${out}\n`);

  if (worktree) {
    process.stderr.write(
      `→ Open ${wtPath} in your editor (same window — it is in-repo) and run one Claude session per worktree.\n`,
    );
  }

  return 0;
}

module.exports = {
  FEATURES_DIR,
  TYPE_BY_LETTER,
  git,
  refExists,
  worktreeRegistered,
  ensureGitignore,
  parseArgs,
  resolveFeature,
  readBranchFromAbout,
  main,
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
