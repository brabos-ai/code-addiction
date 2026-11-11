/**
 * docs-root.cjs — THE single owner of the Code Addiction docs root.
 *
 * Every output a command writes (features, brainstorm, diagnose, audits, health
 * checks, the delivery index, the decisions log, ...) lives under one root: a
 * git worktree of the orphan branch `codeadd-docs`, checked out at
 * `.codeadd/docs/` in the primary checkout. This module is the only place that
 * declares the root, the branch, the layout and the doc format version. A second
 * copy anywhere is how two scripts come to disagree about where a doc lives.
 *
 * Exports:
 *   DOCS_ROOT           '.codeadd/docs'  (posix, relative to the repo toplevel)
 *   DOCS_BRANCH         'codeadd-docs'
 *   DOCS_LAYOUT         output kind -> sub-path, plus `types` (frontmatter
 *                       `type:` -> the sub-path docs-guard files it under; `null`
 *                       means the document is not a docs-branch output)
 *   DOC_SCHEMA_VERSION  the doc format version (1). Bumped only when the doc
 *                       format changes — independent of the package version
 *   docSchemaOf(text)   the integer `schema:` of a markdown file's YAML
 *                       frontmatter, or 0 (legacy) when there is no frontmatter,
 *                       no `schema:` key or a non-integer value. The one place
 *                       that decides "legacy"
 *   repoTop(cwd)        the checkout toplevel (git), or cwd outside a repo
 *   docsRoot(cwd)       absolute docs root, existence NOT checked
 *   docsPath(cwd, ...segments)
 *                       absolute path under the docs root. Throws one explicit
 *                       error — code DOCS_ROOT_MISSING — when the root is absent.
 *                       There is never a second location to fall back to
 *   toPosix(p)          backslashes to forward slashes (Windows path semantics)
 *
 * Dependencies: Node built-ins only; git for repoTop. No argv, no stdout, no exit.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DOCS_ROOT = '.codeadd/docs';
const DOCS_BRANCH = 'codeadd-docs';
const DOC_SCHEMA_VERSION = 1;

const DOCS_LAYOUT = Object.freeze({
  features: 'features',
  brainstorm: 'brainstorm',
  diagnose: 'diagnose',
  audits: 'audits',
  healthChecks: 'health-checks',
  qa: 'qa',
  hotfixes: 'hotfixes',
  changelog: 'changelog',
  analysis: 'analysis',
  product: 'product',
  delivered: 'delivered.jsonl',
  decisions: 'decisions.jsonl',
  designSystem: 'design-system.md',
  codeQualityReview: 'code-quality-review.md',
  // The sub-folder tree migrate-ids reads: every doc type that lives in a
  // feature folder resolves to the features directory.
  featureFolder: 'features',
  // frontmatter `type:` -> sub-path. Kept equal to the registry in
  // mcp/types.mjs by a test: `mcp/` cannot be imported from a shipped script.
  types: Object.freeze({
    feature: 'features',
    hotfix: 'features',
    prd: 'features',
    brainstorm: 'brainstorm',
    'brainstorm-intent': 'brainstorm',
    'audit-report': 'audits',
    'diagnose-report': 'diagnose',
    'setup-receipt': 'qa',
    'feature-plan': 'features',
    'feature-design': 'features',
    epic: 'features',
    review: 'features',
    'qa-validation': 'features',
    changelog: 'changelog',
    // Feature-folder files: placed by the folder rule, never alone (null = no place of their own).
    iterations: null,
    'build-ledger': null,
    tasks: null,
    'health-check': 'health-checks',
    // A sub-path ending in `.md` names the file itself, not a folder.
    'design-system': 'design-system.md',
    'code-quality-review': 'code-quality-review.md',
    // Wiki pages describe the code at a commit; they stay in the code branch.
    tutorial: null,
    'how-to': null,
    reference: null,
    explanation: null,
  }),
});

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

function repoTop(cwd) {
  try {
    const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const top = out.trim();
    if (top) {
      const resolved = path.resolve(top);
      // From inside the docs worktree git answers with ITS toplevel; the project is two levels up.
      const suffix = path.join(...DOCS_ROOT.split('/'));
      return resolved.endsWith(path.sep + suffix) ? resolved.slice(0, -(suffix.length + 1)) : resolved;
    }
  } catch {
    // not a repository: the caller's directory is the project
  }
  return path.resolve(cwd);
}

function docsRoot(cwd) {
  return path.join(repoTop(cwd), ...DOCS_ROOT.split('/'));
}

function docsPath(cwd, ...segments) {
  const root = docsRoot(cwd);
  let ok = false;
  try {
    ok = fs.statSync(root).isDirectory();
  } catch {
    ok = false;
  }
  if (!ok) {
    const err = new Error('DOCS_ROOT_MISSING: run .codeadd/scripts/docs-branch.cjs prepare');
    err.code = 'DOCS_ROOT_MISSING';
    throw err;
  }
  return path.join(root, ...segments.flatMap((s) => toPosix(s).split('/').filter(Boolean)));
}

/** Integer `schema:` of a markdown file's frontmatter; 0 = legacy. */
function docSchemaOf(text) {
  const src = String(text == null ? '' : text).replace(/^﻿/, '');
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(src);
  if (!m) return 0;
  const line = /^schema:[ \t]*(.*?)[ \t]*\r?$/m.exec(m[1]);
  if (!line) return 0;
  const value = line[1].replace(/^(['"])(.*)\1$/, '$2');
  return /^[0-9]+$/.test(value) ? parseInt(value, 10) : 0;
}

module.exports = {
  DOCS_ROOT,
  DOCS_BRANCH,
  DOCS_LAYOUT,
  DOC_SCHEMA_VERSION,
  docSchemaOf,
  repoTop,
  docsRoot,
  docsPath,
  toPosix,
};
