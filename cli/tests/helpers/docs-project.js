import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
export const SCRIPTS = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
export const DOCS_SCRIPTS = ['docs-root.cjs', 'docs-branch.cjs', 'docs-guard.cjs'];

export const git = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();

/**
 * An installed project with a REAL separate bare remote. The docs scripts are copied
 * into `.codeadd/scripts/` from their one source, as an install would write them.
 * Returns { base, bare, repo, docsRoot, cleanup }.
 */
export function makeDocsProject({ remote = true, scripts = true } = {}) {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'docs-project-')));
  const bare = path.join(base, 'remote.git');
  const repo = path.join(base, 'repo');
  fs.mkdirSync(repo);
  if (remote) git(base, 'init', '--bare', '-q', '--initial-branch=main', bare);
  git(repo, 'init', '-q', '--initial-branch=main');
  git(repo, 'config', 'user.email', 't@t.t');
  git(repo, 'config', 'user.name', 'T');
  git(repo, 'config', 'commit.gpgsign', 'false');
  if (remote) git(repo, 'remote', 'add', 'origin', bare);
  if (scripts) {
    const dest = path.join(repo, '.codeadd', 'scripts');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of DOCS_SCRIPTS) fs.copyFileSync(path.join(SCRIPTS, f), path.join(dest, f));
  }
  fs.writeFileSync(path.join(repo, '.gitignore'), '.codeadd/*\n');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  if (remote) git(repo, 'push', '-q', '-u', 'origin', 'main');
  const docsRoot = path.join(repo, '.codeadd', 'docs');
  return { base, bare, repo, docsRoot, cleanup: () => fs.rmSync(base, { recursive: true, force: true }) };
}
