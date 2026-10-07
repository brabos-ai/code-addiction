import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Execution policy supersedes native defaults; retain isolation/Git/sidecar/argv/failure proof.
const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '../..');
const runner = require_('../../scripts/run-tests.js');
const context = require_('../../scripts/test-context.cjs');
const transport = require_('../../scripts/test-transport.cjs');
const worker = require_('../../scripts/test-worker.cjs');

describe('canonical dispatch and authorization', () => {
  it('all local platforms choose Docker; native override and unknown contexts refuse', () => {
    for (const platform of ['linux', 'darwin', 'win32']) expect(runner.resolveRunner({ platform, env: {} }).runner).toBe('docker');
    expect(() => runner.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'native' } })).toThrow(/native/);
    expect(() => runner.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_CONTEXT: 'unknown' } })).toThrow();
  });
  it('canonicalizes legacy aliases, scopes groups and rejects unsupported filters', () => {
    expect(runner.parseArgs(['vitest', 'mcp'])).toEqual({ suite: 'cli', mode: 'run', extra: ['mcp'] });
    expect(runner.parseArgs(['bats', 'scripts/tests/delivered.test.cjs']).suite).toBe('scripts');
    expect(context.leavesFor('framework')).toEqual(['cli', 'scripts', 'package']);
    expect(context.leavesFor('all')).toEqual(['cli', 'scripts', 'package', 'board', 'board-e2e']);
    for (const selection of ['all', 'framework', 'package']) expect(() => runner.parseArgs([selection, 'filter'])).toThrow(/filter/);
  });
  it('container setup admits CLI in framework and package in framework, not unrelated leaves', () => {
    const receipt = { v: 1, context: 'container', selection: 'framework', leaves: context.leavesFor('framework') };
    for (const leaf of ['cli', 'package']) {
      const env = { CODEADD_TESTS_CONTEXT: 'container', CODEADD_TESTS_SELECTION: 'framework', CODEADD_TESTS_LEAF: leaf };
      expect(context.refusal({ platform: 'linux', env, selection: 'framework', leaf, receipt })).toBeNull();
      expect(context.refusal({ platform: 'linux', env, selection: 'all', leaf, receipt })).not.toBeNull();
    }
  });
  it('CLI-local entrypoints use the dispatcher and retain CLI scope', () => {
    const scripts = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli/package.json'))).scripts;
    expect(scripts.test).toBe('node ../scripts/run-tests.js cli');
    expect(scripts['test:watch']).toBe('node ../scripts/run-tests.js cli --watch');
    expect(scripts['test:coverage']).toBe('node ../scripts/run-tests.js cli --coverage');
    expect(scripts['test:package']).toBe('node ../scripts/run-tests.js package');
  });
  it('direct package smoke refuses generic flags before packing', () => {
    const env = { ...process.env, NODE_OPTIONS: '', CI: 'true', CODEADD_TESTS_COPY: '1', CODEADD_TESTS_CONTEXT: '', CODEADD_TESTS_SELECTION: '', CODEADD_TESTS_LEAF: '' };
    const result = spawnSync(process.execPath, [path.join(ROOT, 'cli/tests/package-smoke.mjs')], { env, encoding: 'utf8' });
    expect(result.status).toBe(2); expect(result.stderr).toMatch(/REFUSED/); expect(result.stdout).not.toMatch(/PASS/);
  });
});

describe('isolation and preserved regressions', () => {
  it('host dependencies and nested worktrees are excluded; copied files cannot rewrite host', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-copy-'));
    try {
      fs.mkdirSync(path.join(root, 'cli/node_modules'), { recursive: true });
      fs.writeFileSync(path.join(root, 'cli/node_modules/host'), 'host');
      fs.mkdirSync(path.join(root, 'other/.git'), { recursive: true });
      fs.writeFileSync(path.join(root, 'a'), 'source');
      expect([...transport.snapshot(root).keys()]).toEqual(['a']);
      const dest = path.join(root, 'copy'); fs.copyFileSync(path.join(root, 'a'), dest); fs.writeFileSync(dest, 'changed');
      expect(fs.readFileSync(path.join(root, 'a'), 'utf8')).toBe('source');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  it('maps worktree Git and mounts all metadata read-only', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-git-'));
    try {
      const common = path.join(root, 'main/.git'); const admin = path.join(common, 'worktrees/feature'); const wt = path.join(root, 'wt');
      fs.mkdirSync(admin, { recursive: true }); fs.mkdirSync(wt);
      fs.writeFileSync(path.join(admin, 'commondir'), '../..'); fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${admin}\n`);
      expect(transport.worktreeGit(wt)).toEqual({ commonDir: common, gitFile: 'gitdir: /gitcommon/worktrees/feature\n' });
      expect(transport.gitMounts(wt, root).filter((_, i) => i % 2)).toEqual([`${common}:/gitcommon:ro`, `${root}/dotgit:/code/.git:ro`]);
      expect(transport.worktreeGit(path.join(root, 'main'))).toBeNull();
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  it('preserves argv boundaries, Node flags before files and first failure', () => {
    const extra = ['file with space', '--testNamePattern', "a'; touch bad; #"];
    expect(worker.toolSpec({ leaf: 'cli', root: ROOT, extra }).args.slice(-3)).toEqual(extra);
    expect(worker.scriptArgs(['scripts/tests/a.test.cjs', '--test-name-pattern', 'spaced pattern'], ROOT)).toEqual(['--test', '--test-name-pattern', 'spaced pattern', 'scripts/tests/a.test.cjs']);
    expect(runner.combineExitCodes([0, 17, 3])).toBe(17); expect(runner.exitCodeFrom({ status: null, signal: 'SIGINT' })).not.toBe(0);
  });
  it('image owns dependencies/browser and hashes manifests; no Bats or global Git identity', () => {
    const text = fs.readFileSync(path.join(ROOT, 'scripts/tests.Dockerfile'), 'utf8');
    expect(text).toMatch(/COPY cli\/package.json/); expect(text).toMatch(/COPY board\/package.json/);
    expect(text).toMatch(/install --with-deps chromium/); expect(text).not.toMatch(/git config --global/);
    expect(transport.INPUTS).toHaveLength(6);
    expect(transport.imageTag({ a: 'ab', b: 'c' })).not.toBe(transport.imageTag({ a: 'a', b: 'bc' }));
  });
  it('guidance preserves the sidecar guard and reports unavailable evidence without native recipes', () => {
    const product = fs.readFileSync(path.join(ROOT, 'workbench/skills/add-framework-product-layer/SKILL.md'), 'utf8');
    const done = fs.readFileSync(path.join(ROOT, 'workbench/skills/add-framework--done/SKILL.md'), 'utf8');
    expect(product).toContain('npm test          # at the repository root');
    expect(product).toContain('two projects'); expect(product).toContain('A test changed a build sidecar in the real tree');
    expect(product).toContain('npm run test:cli --'); expect(product).toMatch(/three-part/);
    expect(done).toMatch(/REFUSAL to run/); expect(done).toContain('npm run test:all');
    expect(done).not.toMatch(/CODEADD_TESTS_RUNNER/); expect(done).toMatch(/one machine/); expect(done).toMatch(/one Node version/); expect(done).toMatch(/qa-preflight/);
  });
  it('AGENTS has one concise runner pointer and inventory remains current', () => {
    const text = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
    const mentions = text.split('\n').filter(line => line.includes('scripts/run-tests.js'));
    expect(mentions).toHaveLength(1); expect(mentions[0].length).toBeLessThan(200);
    expect(spawnSync(process.execPath, [path.join(ROOT, 'scripts/inventory.js'), '--check'], { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } }).status).toBe(0);
  });
});
