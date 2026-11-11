#!/usr/bin/env node
/**
 * docs-branch.cjs — the git side of the docs root: prepare, commit, push.
 *
 * Every Code Addiction output lives in a git worktree of the orphan branch
 * `codeadd-docs`, checked out at `.codeadd/docs/` in the primary checkout.
 * This script is the only thing that creates, links, commits and pushes it.
 * It is plain git — no hooks, no lock system, no read-sync, no app. The root,
 * the branch name and the layout belong to the resolver module, never to this file.
 *
 * Usage (from anywhere inside the project, code worktrees included):
 *   node .codeadd/scripts/docs-branch.cjs prepare
 *       DOCS=ready    the docs worktree is already there
 *            created  the branch existed nowhere: an orphan root commit was made and pushed
 *            linked   a code worktree: `.codeadd/docs` now links to the primary checkout's
 *                     docs worktree (symlink; directory junction on Windows)
 *            missing  no remote, an unreachable remote, or a path that cannot be used —
 *                     followed by one `DOCS_REASON=<why>` line. Never an error exit
 *       When the remote already holds `codeadd-docs`, it is fetched and checked out (`ready`).
 *   node .codeadd/scripts/docs-branch.cjs commit "<message>"
 *       DOCS_COMMIT=committed | clean | failed
 *       Stages everything in the docs worktree. Retries while `index.lock` is held and
 *       falls back to a fixed identity when git has none configured.
 *   node .codeadd/scripts/docs-branch.cjs push
 *       DOCS_PUSH=pushed | rejected | offline | failed
 *       `GIT_TERMINAL_PROMPT=0`, a bounded network timeout, one fetch + rebase when the
 *       remote moved. A ruleset or protection rejection keeps the local commit and says so
 *       on a `DOCS_PUSH_NOTE=` line.
 *
 * Exit codes: prepare 0 always; commit 0 (committed|clean) or 1 (failed);
 * push 0 (pushed) or 1 (anything else); 2 on a usage error.
 *
 * Exports: prepareDocs, linkDocs, commitDocs, pushDocs — each returns an object whose
 * `status` is the value after the `=` above.
 *
 * Environment: CODEADD_DOCS_NET_TIMEOUT_MS bounds each network git call (default 20000).
 * Dependencies: Node >= 22.19.0 built-ins and git. Imports the resolver module only.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { DOCS_ROOT, DOCS_BRANCH, repoTop, docsRoot } = require('./docs-root.cjs');

const NET_TIMEOUT_MS = () => Number(process.env.CODEADD_DOCS_NET_TIMEOUT_MS) || 20000;
const FALLBACK_IDENTITY = ['-c', 'user.name=Code Addiction', '-c', 'user.email=codeadd@users.noreply.invalid'];
// The docs worktree never converts line endings, whatever the user's global config says.
const NO_CRLF = ['-c', 'core.autocrlf=false'];

// Append-only logs from two machines merge as a union of their lines instead of conflicting.
const GITATTRIBUTES = '* text=auto eol=lf\ndelivered.jsonl merge=union\ndecisions.jsonl merge=union\n';
// QA run outputs are evidence of one run, never part of the record.
const GITIGNORE = 'features/**/_tests/run-*/\n';

function git(cwd, args, opts = {}) {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout: opts.timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', ...(opts.env || {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: r.status === 0 && !r.error,
    status: r.status,
    out: (r.stdout || '').trim(),
    err: ((r.stderr || '') + (r.error ? ` ${r.error.message}` : '')).trim(),
    timedOut: !!(r.error && /ETIMEDOUT/.test(r.error.code || r.error.message || '')),
  };
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The primary checkout's toplevel when `cwd` sits in a linked worktree, else null. */
function primaryTopOf(cwd) {
  const dir = git(cwd, ['rev-parse', '--git-dir']);
  const common = git(cwd, ['rev-parse', '--git-common-dir']);
  if (!dir.ok || !common.ok) return null;
  const abs = (p) => path.resolve(cwd, p);
  if (abs(dir.out) === abs(common.out)) return null;
  const c = abs(common.out);
  return path.basename(c) === '.git' ? path.dirname(c) : null;
}

function isWorktreeDir(p) {
  return fs.existsSync(path.join(p, '.git'));
}

/** Keep the docs root out of the code checkout's own status, whatever the project gitignores. */
function excludeDocsRoot(top) {
  const r = git(top, ['rev-parse', '--git-path', 'info/exclude']);
  if (!r.ok) return;
  const file = path.resolve(top, r.out);
  // No trailing slash: in a code worktree the root is a link, which a directory pattern misses.
  const line = `/${DOCS_ROOT}`;
  try {
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (cur.split(/\r?\n/).includes(line)) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, (cur && !cur.endsWith('\n') ? '\n' : '') + line + '\n');
  } catch {
    // best effort: the project's own ignore line normally covers it
  }
}

/**
 * Make sure the docs worktree carries the two files the branch is created with. A branch made
 * before a line existed (or edited by hand) gets it appended; the change is left for the next
 * docs commit to carry.
 */
function ensureBranchFiles(root) {
  const want = [
    ['.gitattributes', GITATTRIBUTES.split('\n').filter(Boolean)],
    ['.gitignore', GITIGNORE.split('\n').filter(Boolean)],
  ];
  for (const [name, lines] of want) {
    try {
      const file = path.join(root, name);
      const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      const have = new Set(cur.split(/\r?\n/).map((l) => l.trim()));
      const missing = lines.filter((l) => !have.has(l));
      if (missing.length) fs.appendFileSync(file, (cur && !cur.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
    } catch {
      // best effort: a read-only checkout simply keeps what it has
    }
  }
}

function commitArgs(cwd) {
  const name = git(cwd, ['config', 'user.name']);
  const email = git(cwd, ['config', 'user.email']);
  return name.ok && name.out && email.ok && email.out ? [] : FALLBACK_IDENTITY;
}

/** Run a git write command, retrying while another process holds index.lock. */
function withLockRetry(cwd, args, opts) {
  let r;
  for (let i = 0; i < 20; i++) {
    r = git(cwd, args, opts);
    if (r.ok || !/index\.lock|Unable to create .*\.lock/.test(r.err)) return r;
    sleep(150);
  }
  return r;
}

function remoteState(top) {
  const url = git(top, ['remote', 'get-url', 'origin']);
  if (!url.ok) return { remote: false, reason: 'no remote named origin' };
  const ls = git(top, ['ls-remote', '--heads', 'origin', DOCS_BRANCH], { timeout: NET_TIMEOUT_MS() });
  if (!ls.ok) return { remote: false, reason: `remote unreachable: ${firstLine(ls.err) || 'timed out'}` };
  return { remote: true, hasBranch: ls.out.split('\n').some((l) => l.trim().endsWith(`refs/heads/${DOCS_BRANCH}`)) };
}

function firstLine(s) {
  return String(s || '').split('\n').find((l) => l.trim()) || '';
}

function localBranchExists(top) {
  return git(top, ['rev-parse', '--verify', '--quiet', `refs/heads/${DOCS_BRANCH}`]).ok;
}

/** Create the docs worktree in the primary checkout. Returns { status, reason?, push? }. */
function prepareInPrimary(top) {
  const root = path.join(top, ...DOCS_ROOT.split('/'));
  if (isWorktreeDir(root)) {
    excludeDocsRoot(top);
    ensureBranchFiles(root);
    return { status: 'ready' };
  }
  if (fs.existsSync(root)) {
    // An empty leftover directory is ours to reuse; anything else is the user's.
    if (fs.readdirSync(root).length) return { status: 'missing', reason: `${DOCS_ROOT} exists and is not the docs worktree` };
    fs.rmdirSync(root);
  }
  git(top, ['worktree', 'prune']);
  const remote = remoteState(top);
  const hasLocal = localBranchExists(top);
  if (!remote.remote && !hasLocal) return { status: 'missing', reason: remote.reason };

  fs.mkdirSync(path.dirname(root), { recursive: true });
  excludeDocsRoot(top);

  if (hasLocal) {
    const add = git(top, ['worktree', 'add', root, DOCS_BRANCH]);
    if (!add.ok) return { status: 'missing', reason: `git worktree add failed: ${firstLine(add.err)}` };
    ensureBranchFiles(root);
    return { status: 'ready' };
  }
  if (remote.hasBranch) {
    const fetch = git(top, ['fetch', 'origin', `${DOCS_BRANCH}:refs/remotes/origin/${DOCS_BRANCH}`], { timeout: NET_TIMEOUT_MS() });
    if (!fetch.ok) return { status: 'missing', reason: `fetch failed: ${firstLine(fetch.err)}` };
    const add = git(top, ['worktree', 'add', '--track', '-b', DOCS_BRANCH, root, `origin/${DOCS_BRANCH}`]);
    if (!add.ok) return { status: 'missing', reason: `git worktree add failed: ${firstLine(add.err)}` };
    ensureBranchFiles(root);
    return { status: 'ready' };
  }

  // The branch exists nowhere: an orphan with one root commit.
  const head = git(top, ['rev-parse', '--verify', '--quiet', 'HEAD']);
  const add = git(top, ['worktree', 'add', '--detach', root, ...(head.ok ? ['HEAD'] : [])]);
  if (!add.ok) return { status: 'missing', reason: `git worktree add failed: ${firstLine(add.err)}` };
  const steps = [
    ['checkout', '--orphan', DOCS_BRANCH],
    ['rm', '-rf', '--quiet', '--ignore-unmatch', '.'],
  ];
  for (const s of steps) {
    const r = git(root, s);
    if (!r.ok) {
      git(top, ['worktree', 'remove', '--force', root]);
      return { status: 'missing', reason: `orphan branch setup failed: ${firstLine(r.err)}` };
    }
  }
  fs.writeFileSync(path.join(root, '.gitattributes'), GITATTRIBUTES);
  fs.writeFileSync(path.join(root, '.gitignore'), GITIGNORE);
  const c = withLockRetry(root, [...NO_CRLF, ...commitArgs(root), 'add', '-A']);
  const k = c.ok
    ? withLockRetry(root, [...NO_CRLF, ...commitArgs(root), 'commit', '-q', '--no-verify', '-m', 'chore(docs): initialize codeadd-docs'])
    : c;
  if (!k.ok) {
    git(top, ['worktree', 'remove', '--force', root]);
    return { status: 'missing', reason: `root commit failed: ${firstLine(k.err)}` };
  }
  const push = git(root, ['push', '--no-verify', '-u', 'origin', DOCS_BRANCH], { timeout: NET_TIMEOUT_MS() });
  return { status: 'created', push: push.ok ? 'pushed' : classifyPush(push) };
}

/** Link a code worktree's docs root to the primary checkout's docs worktree. */
function linkDocs(cwd, primaryTop) {
  const top = repoTop(cwd);
  const primary = primaryTop || primaryTopOf(cwd);
  if (!primary) return { status: 'missing', reason: 'not a linked worktree' };
  const target = path.join(primary, ...DOCS_ROOT.split('/'));
  const link = path.join(top, ...DOCS_ROOT.split('/'));
  if (!isWorktreeDir(target)) return { status: 'missing', reason: 'the primary checkout has no docs worktree' };
  try {
    const st = fs.lstatSync(link);
    if (st.isSymbolicLink() || isWorktreeDir(link)) return { status: 'linked' };
    if (fs.readdirSync(link).length) return { status: 'missing', reason: `${DOCS_ROOT} exists in this worktree and is not a link` };
    fs.rmdirSync(link);
  } catch {
    // absent: create it below
  }
  try {
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (e) {
    return { status: 'missing', reason: `link failed: ${e.message}` };
  }
  excludeDocsRoot(top);
  return { status: 'linked' };
}

function prepareDocs(cwd) {
  try {
    const top = repoTop(cwd);
    if (!git(top, ['rev-parse', '--git-dir']).ok) return { status: 'missing', reason: 'not a git repository' };
    const primary = primaryTopOf(top);
    if (primary) {
      const own = path.join(top, ...DOCS_ROOT.split('/'));
      if (fs.existsSync(own) && (isWorktreeDir(own) || fs.lstatSync(own).isSymbolicLink())) return { status: 'linked' };
      const p = prepareInPrimary(primary);
      if (p.status === 'missing') return p;
      return linkDocs(top, primary);
    }
    return prepareInPrimary(top);
  } catch (e) {
    return { status: 'missing', reason: e.message };
  }
}

function commitDocs(cwd, message) {
  const root = docsRoot(cwd);
  if (!isWorktreeDir(root)) return { status: 'failed', reason: 'DOCS_ROOT_MISSING: run .codeadd/scripts/docs-branch.cjs prepare' };
  const add = withLockRetry(root, [...NO_CRLF, 'add', '-A']);
  if (!add.ok) return { status: 'failed', reason: firstLine(add.err) };
  const staged = git(root, [...NO_CRLF, 'diff', '--cached', '--quiet']);
  if (staged.ok) return { status: 'clean' };
  const msg = message && String(message).trim() ? String(message) : 'docs: update';
  const c = withLockRetry(root, [...NO_CRLF, ...commitArgs(root), 'commit', '-q', '--no-verify', '-m', msg]);
  return c.ok ? { status: 'committed' } : { status: 'failed', reason: firstLine(c.err) };
}

function classifyPush(r) {
  const e = r.err || '';
  if (r.timedOut || /could not resolve host|unable to access|could not read from remote|connection (refused|timed out|reset)|network is unreachable|timed out|early eof|unable to connect|no such device/i.test(e)) {
    return 'offline';
  }
  if (/rejected|protected|denied|rule|ruleset|non-fast-forward|forbidden|permission|not allowed|refusing|hook declined/i.test(e)) return 'rejected';
  return 'failed';
}

function pushDocs(cwd) {
  const root = docsRoot(cwd);
  if (!isWorktreeDir(root)) return { status: 'failed', reason: 'DOCS_ROOT_MISSING: run .codeadd/scripts/docs-branch.cjs prepare' };
  if (!git(root, ['remote', 'get-url', 'origin']).ok) return { status: 'offline', reason: 'no remote named origin' };
  const net = { timeout: NET_TIMEOUT_MS() };
  const attempt = () => git(root, [...NO_CRLF, 'push', '--no-verify', '-u', 'origin', DOCS_BRANCH], net);
  let r = attempt();
  if (r.ok) return { status: 'pushed' };
  if (classifyPush(r) === 'offline') return { status: 'offline', reason: firstLine(r.err) };
  // The remote moved (or refused): fetch once, rebase once, push once.
  const fetch = git(root, ['fetch', 'origin', DOCS_BRANCH], net);
  if (fetch.ok) {
    const base = `origin/${DOCS_BRANCH}`;
    const rb = git(root, [...NO_CRLF, ...commitArgs(root), 'rebase', base]);
    if (!rb.ok) {
      git(root, ['rebase', '--abort']);
      return { status: 'rejected', reason: `rebase onto ${base} failed: ${firstLine(rb.err)}` };
    }
    r = attempt();
    if (r.ok) return { status: 'pushed' };
  } else if (classifyPush(fetch) === 'offline') {
    return { status: 'offline', reason: firstLine(fetch.err) };
  }
  const status = classifyPush(r);
  return {
    status,
    reason: status === 'rejected'
      ? `the remote refused ${DOCS_BRANCH}; the local commit is kept — ${firstLine(r.err)}`
      : firstLine(r.err),
  };
}

function main(argv) {
  const [cmd, ...rest] = argv;
  const cwd = process.cwd();
  if (cmd === 'prepare') {
    const r = prepareDocs(cwd);
    console.log(`DOCS=${r.status}`);
    if (r.reason) console.log(`DOCS_REASON=${r.reason}`);
    if (r.push && r.push !== 'pushed') console.log(`DOCS_PUSH=${r.push}`);
    return 0;
  }
  if (cmd === 'commit') {
    const r = commitDocs(cwd, rest.join(' '));
    console.log(`DOCS_COMMIT=${r.status}`);
    if (r.reason) console.log(`DOCS_REASON=${r.reason}`);
    return r.status === 'failed' ? 1 : 0;
  }
  if (cmd === 'push') {
    const r = pushDocs(cwd);
    console.log(`DOCS_PUSH=${r.status}`);
    if (r.reason) console.log(`DOCS_PUSH_NOTE=${r.reason}`);
    return r.status === 'pushed' ? 0 : 1;
  }
  console.error('usage: docs-branch.cjs prepare | commit "<message>" | push');
  return 2;
}

module.exports = { prepareDocs, linkDocs, commitDocs, pushDocs, primaryTopOf };

if (require.main === module) process.exitCode = main(process.argv.slice(2));
