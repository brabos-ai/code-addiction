import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { log } from '@clack/prompts';
import { loadDocsBranch, loadDocsRoot } from './docs-root.js';

/**
 * The CLI's side of the docs worktree: prepare it after an install or update, and
 * release it before anything under `.codeadd/` is touched. Every operation goes
 * through the INSTALLED docs-branch module — one implementation, no CLI copy.
 *
 * `codeadd-docs` is never deleted here, locally or on the remote: the branch is the
 * user's record, and removing the worktree only removes a checkout of it.
 */

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

/** True when the docs module has been installed in this target (an older install has none). */
function hasDocsModule(cwd) {
  return fs.existsSync(path.join(cwd, '.codeadd', 'scripts', 'docs-branch.cjs'));
}

/**
 * Prepare the docs worktree through the installed script. Never throws: a project
 * that cannot have one (no remote, offline) reports `missing` with its reason.
 * @returns {{status: string, reason?: string}}
 */
export function prepareDocsWorktree(cwd) {
  try {
    if (!hasDocsModule(cwd)) return { status: 'missing', reason: 'docs-branch.cjs is not installed' };
    const r = loadDocsBranch(cwd).prepareDocs(cwd);
    return { status: r.status, reason: r.reason };
  } catch (err) {
    return { status: 'missing', reason: err.message };
  }
}

/**
 * Commit the docs worktree, then remove it (and prune). A worktree that is a LINK
 * (a code worktree) only loses the link — the target is the primary checkout's.
 * A docs worktree that cannot be committed blocks removal with an explicit error:
 * it holds the only copy of uncommitted docs.
 * @returns {{released: boolean, reason?: string}}
 */
export function releaseDocsWorktree(cwd) {
  if (!hasDocsModule(cwd)) return { released: false, reason: 'no docs module installed' };
  const { docsRoot, DOCS_ROOT } = loadDocsRoot(cwd);
  const root = docsRoot(cwd);
  let st;
  try {
    st = fs.lstatSync(root);
  } catch {
    return { released: false, reason: 'no docs worktree' };
  }
  if (st.isSymbolicLink()) {
    fs.rmSync(root, { force: true });
    return { released: true };
  }
  if (!fs.existsSync(path.join(root, '.git'))) return { released: false, reason: `${DOCS_ROOT} is not a worktree` };

  const commit = loadDocsBranch(cwd).commitDocs(cwd, 'docs: save before the install changes this project');
  if (commit.status === 'failed') {
    throw new Error(
      `${DOCS_ROOT} holds changes that could not be committed (${commit.reason || 'unknown'}). ` +
        'Commit or move them by hand, then run the command again — nothing was removed.',
    );
  }
  const dirty = git(root, ['status', '--porcelain']);
  if (!dirty.ok || dirty.out) {
    throw new Error(`${DOCS_ROOT} still has uncommitted changes after the commit — nothing was removed.`);
  }
  const removed = git(cwd, ['worktree', 'remove', '--force', root]);
  if (!removed.ok) {
    throw new Error(`Could not remove the docs worktree: ${removed.err.split('\n')[0]}`);
  }
  git(cwd, ['worktree', 'prune']);
  return { released: true };
}

/** Say what prepare did, in one line; a `missing` result is information, never an error. */
export function reportDocsWorktree(result) {
  if (result.status === 'missing' && /is not installed/.test(result.reason || '')) return; // an older payload: nothing to prepare yet
  if (result.status === 'missing') {
    log.warn(`DOCS=missing${result.reason ? ` (${result.reason})` : ''} — Code Addiction writes its outputs there; connect a remote and run /add-setup or any command to prepare it.`);
  } else {
    log.success(`DOCS=${result.status}`);
  }
}
