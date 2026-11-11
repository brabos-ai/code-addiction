import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { makeDocsProject, git, SCRIPTS, DOCS_SCRIPTS } from './helpers/docs-project.js';

const mocks = vi.hoisted(() => ({
  getLatestTag: vi.fn(),
  getLatestPrerelease: vi.fn(),
  downloadReleaseAsset: vi.fn(),
}));
vi.mock('../src/github.js', () => ({
  getLatestTag: mocks.getLatestTag,
  getLatestPrerelease: mocks.getLatestPrerelease,
  downloadReleaseAsset: mocks.downloadReleaseAsset,
}));
vi.mock('../src/prompt.js', () => ({
  promptProviders: vi.fn(),
  promptConfirm: vi.fn(),
  promptExistingInstall: vi.fn(),
  promptModify: vi.fn(),
  promptApplyDiff: vi.fn(),
}));
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { success: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

import { log } from '@clack/prompts';
import { update } from '../src/updater.js';
import { uninstall } from '../src/uninstaller.js';
import { prepareDocsWorktree, releaseDocsWorktree } from '../src/docs-worktree.js';
import { writeGitignoreBlock, getInstalledDirs } from '../src/gitignore.js';

/** A release payload carrying the docs scripts, as the real ZIP does. */
function zipWithDocsScripts() {
  const zip = new AdmZip();
  for (const f of DOCS_SCRIPTS) zip.addFile(`framwork/.codeadd/scripts/${f}`, fs.readFileSync(path.join(SCRIPTS, f)));
  return zip.toBuffer();
}

function writeManifest(repo, extra = {}) {
  fs.mkdirSync(path.join(repo, '.codeadd'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '1.0.0', source: 'release', ref: null, providers: [], files: [], scope: 'project', ...extra }),
  );
}

let p;
beforeEach(() => {
  mocks.getLatestTag.mockReset();
  mocks.downloadReleaseAsset.mockReset();
  vi.clearAllMocks();
});
afterEach(() => p && p.cleanup());

describe('F17 — the docs worktree around install, update and uninstall', () => {
  it('prepareDocsWorktree prepares it through the installed script and the branch is pushed', () => {
    p = makeDocsProject();
    const r = prepareDocsWorktree(p.repo);
    expect(r.status).toBe('created');
    expect(fs.existsSync(path.join(p.docsRoot, '.git'))).toBe(true);
    expect(git(p.bare, 'rev-parse', '--verify', 'codeadd-docs')).toMatch(/^[0-9a-f]{40}$/);
    expect(git(p.repo, 'status', '--porcelain')).toBe('');
  });

  it('without the installed script it reports missing and never throws', () => {
    p = makeDocsProject({ scripts: false });
    const r = prepareDocsWorktree(p.repo);
    expect(r.status).toBe('missing');
    expect(r.reason).toMatch(/not installed/);
  });

  it('the project ignore line already covers the worktree (gitignore.js is unchanged)', () => {
    p = makeDocsProject({ scripts: false });
    fs.writeFileSync(path.join(p.repo, '.gitignore'), '');
    writeGitignoreBlock(p.repo, getInstalledDirs(['claude']));
    const block = fs.readFileSync(path.join(p.repo, '.gitignore'), 'utf8');
    expect(block).toContain('.codeadd/*');
    fs.mkdirSync(path.join(p.repo, '.codeadd', 'docs'), { recursive: true });
    fs.writeFileSync(path.join(p.repo, '.codeadd', 'docs', 'a.md'), 'x');
    expect(git(p.repo, 'check-ignore', '.codeadd/docs/a.md')).toBe('.codeadd/docs/a.md');
  });

  it('update commits dirty docs, removes the worktree, re-prepares it, and keeps the branch', async () => {
    p = makeDocsProject();
    prepareDocsWorktree(p.repo);
    writeManifest(p.repo);
    fs.mkdirSync(path.join(p.docsRoot, 'features', '0001F-x'), { recursive: true });
    fs.writeFileSync(path.join(p.docsRoot, 'features', '0001F-x', 'about.md'), '# x\n');
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(zipWithDocsScripts());

    await update(p.repo);

    // the dirty file was committed on the docs branch, the worktree is back, nothing was lost
    expect(fs.readFileSync(path.join(p.docsRoot, 'features', '0001F-x', 'about.md'), 'utf8')).toBe('# x\n');
    expect(git(p.docsRoot, 'log', '-1', '--format=%s')).toMatch(/save before/);
    expect(git(p.docsRoot, 'status', '--porcelain')).toBe('');
    expect(git(p.repo, 'rev-parse', '--verify', 'codeadd-docs')).toMatch(/^[0-9a-f]{40}$/);
    expect(vi.mocked(log.success).mock.calls.map((c) => String(c[0]))).toContain('DOCS=ready');
  });

  it('uninstall commits dirty docs, removes the worktree and never deletes codeadd-docs', async () => {
    p = makeDocsProject();
    prepareDocsWorktree(p.repo);
    writeManifest(p.repo);
    fs.writeFileSync(path.join(p.docsRoot, 'delivered.jsonl'), '{"v":1}\n');

    await uninstall(p.repo, true, 'project');

    expect(fs.existsSync(p.docsRoot)).toBe(false);
    expect(git(p.repo, 'rev-parse', '--verify', 'codeadd-docs')).toMatch(/^[0-9a-f]{40}$/);
    expect(git(p.repo, 'show', 'codeadd-docs:delivered.jsonl')).toBe('{"v":1}');
    // the remote still holds the branch too
    expect(git(p.bare, 'rev-parse', '--verify', 'codeadd-docs')).toMatch(/^[0-9a-f]{40}$/);
  });

  it('a docs worktree that cannot be committed blocks removal with an explicit message', async () => {
    p = makeDocsProject();
    prepareDocsWorktree(p.repo);
    writeManifest(p.repo);
    fs.writeFileSync(path.join(p.docsRoot, 'a.md'), 'dirty\n');
    // hold the index lock for the whole run: the commit cannot happen
    const lock = path.resolve(p.docsRoot, git(p.docsRoot, 'rev-parse', '--git-path', 'index.lock'));
    fs.writeFileSync(lock, '');
    mocks.getLatestTag.mockResolvedValue('v2.0.0');
    mocks.downloadReleaseAsset.mockResolvedValue(zipWithDocsScripts());

    await expect(update(p.repo)).rejects.toThrow(/could not be committed/);
    expect(fs.existsSync(path.join(p.docsRoot, 'a.md'))).toBe(true);
    fs.rmSync(lock, { force: true });
  }, 30000);

  it('a code worktree\'s link is removed without touching the primary docs', () => {
    p = makeDocsProject();
    prepareDocsWorktree(p.repo);
    fs.writeFileSync(path.join(p.docsRoot, 'keep.md'), 'k');
    const wt = path.join(p.repo, '.worktrees', 'feat');
    git(p.repo, 'worktree', 'add', '-q', '-b', 'feat/x', wt);
    // the installed scripts are ignored files: build-setup copies them into a code worktree
    fs.mkdirSync(path.join(wt, '.codeadd', 'scripts'), { recursive: true });
    for (const f of DOCS_SCRIPTS) fs.copyFileSync(path.join(SCRIPTS, f), path.join(wt, '.codeadd', 'scripts', f));
    const r = prepareDocsWorktree(wt);
    expect(r.status).toBe('linked');
    expect(releaseDocsWorktree(wt).released).toBe(true);
    expect(fs.existsSync(path.join(wt, '.codeadd', 'docs'))).toBe(false);
    expect(fs.readFileSync(path.join(p.docsRoot, 'keep.md'), 'utf8')).toBe('k');
  });
});
