#!/usr/bin/env node
/**
 * get-branch-metadata.cjs — Extract complete metadata from any branch.
 *
 * Native port of get-branch-metadata.sh. Emits the same seven KEY=VALUE lines,
 * in the same order, from a branch name given as the first argument or read
 * from git when absent:
 *
 *   BRANCH_NAME=feature/0001F-auth-system
 *   BRANCH_PREFIX=feature
 *   BRANCH_TYPE=feature
 *   COMMIT_TYPE=feat
 *   FEATURE_ID=0001F
 *   FEATURE_SLUG=0001F-auth-system
 *   DOCS_DIR=docs/features/0001F-auth-system
 *
 * Parsing is preserved: the prefix is everything before the first `/`; a
 * recognisable `[type]/[NNNN][L]-[slug]` shape sets FEATURE_ID from the first
 * `[0-9]{4}[A-Z]` in the branch and BRANCH_TYPE from the type (or, generically,
 * from the prefix); main/master report BRANCH_TYPE=main and everything else
 * BRANCH_TYPE=other. COMMIT_TYPE is derived from the prefix only when an ID
 * was found or the type is other, and maps feature→feat, otherwise the prefix
 * itself. A detached HEAD (no argument, no current branch) reports
 * BRANCH_TYPE=detached and the literal quoted name `'(detached)'`. Always
 * exits 0.
 *
 * Dependencies: Node >= 22.19.0 built-ins and git. No bash, no WSL, no stdin.
 */

'use strict';

const { spawnSync } = require('node:child_process');

const BRANCH_TYPES = ['feature', 'fix', 'hotfix', 'refactor', 'chore', 'docs', 'perf', 'test'];
const ID_PATTERN = /[0-9]{4}[A-Z]/;

/** The current branch name, or '' when HEAD is detached or git is unavailable. */
function currentBranch(cwd = process.cwd()) {
  const res = spawnSync('git', ['branch', '--show-current'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.status !== 0) return '';
  return (res.stdout || '').replace(/\r?\n$/, '');
}

/** First `[0-9]{4}[A-Z]` in the name, mirroring `grep -oE … | head -1`. */
function firstId(name) {
  const match = name.match(ID_PATTERN);
  return match ? match[0] : '';
}

/** `[type]/[NNNN][L]-[slug]` for one of the named types. */
function matchesTyped(name, type) {
  return new RegExp(`^${type}/[0-9]{4}[A-Z]-`).test(name);
}

/** The generic `[prefix]/[NNNN][L]-[slug]` shape. */
function matchesGeneric(name) {
  return /\/[0-9]{4}[A-Z]-/.test(name);
}

/** The seven metadata fields for a branch name. */
function branchMetadata(branchName) {
  const name = branchName || '';

  if (name === '') {
    return {
      BRANCH_NAME: "'(detached)'",
      BRANCH_PREFIX: '',
      BRANCH_TYPE: 'detached',
      COMMIT_TYPE: '',
      FEATURE_ID: '',
      FEATURE_SLUG: '',
      DOCS_DIR: '',
    };
  }

  const slash = name.indexOf('/');
  const prefix = slash === -1 ? name : name.slice(0, slash);

  let branchType;
  let featureId = '';
  const typed = BRANCH_TYPES.find((type) => matchesTyped(name, type));
  if (typed) {
    branchType = typed;
    featureId = firstId(name);
  } else if (matchesGeneric(name)) {
    branchType = prefix;
    featureId = firstId(name);
  } else if (name === 'main' || name === 'master') {
    branchType = 'main';
  } else {
    branchType = 'other';
  }

  let commitType = '';
  if (featureId !== '' || branchType === 'other') {
    commitType = prefix === 'feature' ? 'feat' : prefix;
  }

  let featureSlug = '';
  let docsDir = '';
  if (featureId !== '') {
    featureSlug = slash === -1 ? name : name.slice(slash + 1);
    docsDir = `docs/features/${featureSlug}`;
  }

  return {
    BRANCH_NAME: name,
    BRANCH_PREFIX: prefix,
    BRANCH_TYPE: branchType,
    COMMIT_TYPE: commitType,
    FEATURE_ID: featureId,
    FEATURE_SLUG: featureSlug,
    DOCS_DIR: docsDir,
  };
}

function render(meta) {
  return `${Object.entries(meta).map(([key, value]) => `${key}=${value}`).join('\n')}\n`;
}

function main(argv) {
  const provided = argv[0];
  const branchName = provided !== undefined && provided !== ''
    ? provided
    : currentBranch(process.cwd());
  process.stdout.write(render(branchMetadata(branchName)));
  process.exit(0);
}

module.exports = { currentBranch, branchMetadata, render };

if (require.main === module) main(process.argv.slice(2));
