import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * scripts/run-tests.js — one runner for both suites
 * (plan 2026-09-21T001942-PLAN--parallel-tests-in-one-container, whose Bats
 * transport plan 2026-10-05T152826-PLAN--native-node-framework-scripts replaced).
 *
 * The runner selects the suite and the platform, then spawns the right command:
 * the cli suite through `npm --prefix cli test`, the root scripts suite through
 * Node's own built-in test runner over `scripts/tests/*.test.cjs`. Native is the
 * default on every platform, Windows included; the Docker transport survives as
 * an explicit `CODEADD_TESTS_RUNNER=docker` opt-in for reproducing a Linux run.
 *
 * Cases here that must never be relaxed:
 *
 *   L1.2 — the native scripts command is compared CHARACTER BY CHARACTER against
 *   what `npm run test:scripts` executes. The `bats` selector is a legacy alias
 *   that folds into `scripts` and never starts Bats.
 *
 *   L1.3 — an unusable runner override, a missing suite and `all` with arguments
 *   are REFUSED with a named reason, never a silent fallback that reads as a
 *   hang and then lies.
 *
 *   L1.6 — the optional image installs no Bats and no GNU parallel. The scripts
 *   suite runs on the container's own Node, so no fork-per-case runner is needed.
 */

const require_ = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUNNER_PATH = path.join(REPO_ROOT, 'scripts', 'run-tests.js');
const DOCKERFILE_PATH = path.join(REPO_ROOT, 'scripts', 'tests.Dockerfile');

/** The default selection the native scripts suite runs, mirroring the runner's own constant. */
const SCRIPTS_GLOB = 'scripts/tests/*.test.cjs';

function loadRunner() {
  return require_(RUNNER_PATH);
}

/** The inner `bash -c` string of a docker spec. */
function innerOf(spec) {
  expect(spec.args[spec.args.length - 2]).toBe('-c');
  return spec.args[spec.args.length - 1];
}

describe('L1 — the runner\'s decisions', () => {
  it('L1.1: CODEADD_TESTS_RUNNER overrides; native is the default on every platform', () => {
    const r = loadRunner();

    // No override: native everywhere, Windows included, with a reason that names the platform.
    expect(r.resolveRunner({ platform: 'linux', env: {} }).runner).toBe('native');
    expect(r.resolveRunner({ platform: 'win32', env: {} }).runner).toBe('native');
    expect(r.resolveRunner({ platform: 'win32', env: {} }).reason).toMatch(/Windows/i);

    // The override wins in both directions.
    expect(r.resolveRunner({ platform: 'win32', env: { CODEADD_TESTS_RUNNER: 'native' } }).runner)
      .toBe('native');
    expect(r.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'docker' } }).runner)
      .toBe('docker');

    // An unusable value is a refusal, not a guess.
    expect(() => r.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'podman' } }))
      .toThrow(/CODEADD_TESTS_RUNNER/);

    // The old names are gone, not aliased: an old override does not select Docker on Windows.
    expect(r.resolveRunner({ platform: 'win32', env: { CODEADD_BATS_RUNNER: 'docker' } }).runner)
      .toBe('native');
  });

  it('L1.2: the native scripts command is exactly what `npm run test:scripts` executes; `bats` folds into it', () => {
    const r = loadRunner();
    const expected = `node --test ${SCRIPTS_GLOB}`;

    const [spec] = r.buildCommands({ suite: 'scripts', runner: 'native', repoRoot: REPO_ROOT, platform: 'linux' });
    expect(spec.display).toBe(expected);
    expect(spec.file).toBe(expected);
    expect(spec.shell).toBe(true);

    // The legacy selector is an alias, not a second command: same bytes, one suite.
    const [legacy] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: REPO_ROOT, platform: 'linux' });
    expect(legacy.file).toBe(expected);
    expect(legacy.file).not.toMatch(/bats/);
  });

  it('L1.3: an unusable runner override and `all` with arguments are refused with a named reason', () => {
    const r = loadRunner();
    expect(() => r.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'podman' } }))
      .toThrow(/"native" or "docker"/);
    expect(() => r.buildCommands({ suite: 'all', runner: 'native', repoRoot: 'C:/repo', extra: ['x'] }))
      .toThrow(/all/);
  });

  it('L1.4: the image tag hashes the Dockerfile and both cli package files; one changed byte in any changes it', () => {
    const r = loadRunner();
    const inputs = { dockerfile: 'FROM node:22\n', pkg: '{"a":1}\n', lock: '{"b":2}\n' };
    const tag = r.imageTag(inputs);
    expect(tag).toMatch(/^codeadd-tests:[0-9a-f]{12}$/);

    for (const key of Object.keys(inputs)) {
      expect(r.imageTag({ ...inputs, [key]: `${inputs[key]} ` }), key).not.toBe(tag);
    }
    // Moving a byte from one input to the next must not collide.
    expect(r.imageTag({ dockerfile: 'ab', pkg: 'c', lock: '' }))
      .not.toBe(r.imageTag({ dockerfile: 'a', pkg: 'bc', lock: '' }));
  });

  it('L1.5: the container gets a COPY of the checkout, never a bind mount of it, and clears NODE_OPTIONS', () => {
    const r = loadRunner();
    const [spec] = r.buildCommands({
      suite: 'vitest',
      runner: 'docker',
      repoRoot: 'C:\\github\\xmaiconx\\code-addiction',
      tag: 'codeadd-tests:abcdef012345',
      treeTar: 'C:\\Temp\\run\\tree.tar',
    });

    expect(spec.file).toBe('docker');
    expect(spec.shell).toBe(false);
    expect(spec.args.join(' ')).not.toContain('\\');

    // Docker Desktop's Windows bind mount is too slow for vitest walking the
    // tree, so the checkout arrives as a tarball and is extracted inside.
    const mounts = spec.args.filter((_, i) => spec.args[i - 1] === '-v');
    expect(mounts).not.toContain('C:/github/xmaiconx/code-addiction:/code');
    expect(mounts).toContain(`C:/Temp/run/tree.tar:${r.CONTAINER_TREE}:ro`);
    // Only git stays mounted.
    expect(mounts).toContain('C:/github/xmaiconx/code-addiction/.git:/code/.git:ro');
    expect(spec.args).toContain('GIT_OPTIONAL_LOCKS=0');

    const eIdx = spec.args.indexOf('-e');
    expect(spec.args[eIdx + 1]).toBe('NODE_OPTIONS=');

    const inner = innerOf(spec);
    expect(inner.startsWith(`tar -x --no-same-owner -f ${r.CONTAINER_TREE} -C /code || exit 2;`)).toBe(true);
    // The dependency check comes before vitest and is a refusal, not a red suite.
    expect(inner).toContain('cli/node_modules/.bin/vitest');
    expect(inner.lastIndexOf('exit 2')).toBeLessThan(inner.indexOf('./node_modules/.bin/vitest run'));
  });

  it('L1.5b: the tarball leaves out .git, worktrees and every node_modules; only the image supplies cli deps', () => {
    const r = loadRunner();
    const args = r.tarArgs();
    expect(args.slice(0, 3)).toEqual(['-c', '-f', '-']);
    expect(args[args.length - 1]).toBe('.');
    for (const ex of ['./.git', './.worktrees', './.claude/worktrees', './node_modules', './cli/node_modules']) {
      expect(args).toContain(`--exclude=${ex}`);
    }
    // No node_modules is packed: the image carries vitest's Linux deps, and the
    // built-ins-only scripts suite needs none, so dropping the root copy is safe.
    expect(args).toContain('--exclude=./node_modules');
  });

  it('L1.6: the image installs git and jq, runs npm ci for cli/, and installs neither GNU parallel nor Bats nor a git identity', () => {
    const text = fs.readFileSync(DOCKERFILE_PATH, 'utf8');

    expect(text).toMatch(/FROM node:22-bookworm-slim/);
    for (const pkg of ['git', 'jq']) {
      expect(text).toMatch(new RegExp(`\\b${pkg}\\b`));
    }
    expect(text).toMatch(/COPY cli\/package\.json cli\/package-lock\.json/);
    expect(text).toMatch(/RUN npm ci/);

    const installLines = text.split('\n').filter((l) => /apt-get install/.test(l) || /^\s+\S+ \\$/.test(l));
    expect(installLines.join('\n')).not.toMatch(/\bbats\b/);
    expect(installLines.join('\n')).not.toMatch(/\bparallel\b/);
    expect(text).not.toMatch(/git config --global/);
    expect(text).toMatch(/#.*bats/i);
    expect(text).toMatch(/#.*git identity|#.*git config/i);
  });

  it('L1.7: `all` runs vitest then the native scripts suite, runs scripts even when vitest failed, and fails when either failed', () => {
    const r = loadRunner();

    // Native: two specs, combined by the runner.
    const native = r.buildCommands({ suite: 'all', runner: 'native', repoRoot: REPO_ROOT, platform: 'linux' });
    expect(native).toHaveLength(2);
    expect(native[0].display).toBe('npm --prefix cli test');
    expect(native[1].display).toBe(`node --test ${SCRIPTS_GLOB}`);

    expect(r.combineExitCodes([0, 0])).toBe(0);
    expect(r.combineExitCodes([1, 0])).toBe(1);
    expect(r.combineExitCodes([0, 3])).toBe(3);
    expect(r.combineExitCodes([2, 1])).toBe(2);

    // Docker: one container start, both suites, the combination done in bash.
    const docker = r.buildCommands({ suite: 'all', runner: 'docker', repoRoot: 'C:/repo', tag: 'codeadd-tests:x', treeTar: 'C:/t/tree.tar' });
    expect(docker).toHaveLength(1);
    const inner = innerOf(docker[0]);
    expect(inner.indexOf('vitest run')).toBeLessThan(inner.indexOf('node --test'));
    // The scripts suite is not chained with && after vitest, so a vitest failure does not skip it.
    expect(inner).not.toMatch(/vitest run[^;]*&&[^;]*node --test/);
  });

  it('L1.8: a non-zero child exit is forwarded unchanged, and a signalled child is not success', () => {
    const r = loadRunner();
    expect(r.exitCodeFrom({ status: 0, signal: null })).toBe(0);
    expect(r.exitCodeFrom({ status: 17, signal: null })).toBe(17);
    expect(r.exitCodeFrom({ status: null, signal: 'SIGTERM' })).not.toBe(0);
  });

  it('L1.9: node:test flags forward ahead of paths, and a positional argument replaces the default glob', () => {
    const r = loadRunner();

    expect(r.SCRIPTS_TEST_GLOB).toBe(SCRIPTS_GLOB);
    expect(r.scriptsArgs([])).toBe(SCRIPTS_GLOB);
    expect(r.scriptsArgs(['--test-name-pattern=foo'])).toBe(`--test-name-pattern=foo ${SCRIPTS_GLOB}`);
    expect(r.scriptsArgs(['scripts/tests/delivered.test.cjs'])).toBe('scripts/tests/delivered.test.cjs');
    expect(r.scriptsArgs(['--test-name-pattern=foo', 'scripts/tests/delivered.test.cjs']))
      .toBe('--test-name-pattern=foo scripts/tests/delivered.test.cjs');
    expect(r.scriptsArgs(['scripts/tests/a.test.cjs', 'scripts/tests/b.test.cjs']))
      .toBe('scripts/tests/a.test.cjs scripts/tests/b.test.cjs');
  });

  it('L1.10: extra arguments replace the scripts glob and filter vitest, on both runners', () => {
    const r = loadRunner();
    const one = 'scripts/tests/delivered.test.cjs';

    const [nb] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: 'C:/repo', extra: [one] });
    expect(nb.file).toContain(one);
    expect(nb.file).not.toContain('*');

    const [db] = r.buildCommands({ suite: 'bats', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', treeTar: 'C:/t/tree.tar', extra: [one] });
    expect(innerOf(db)).toContain(one);
    expect(innerOf(db)).not.toContain('*');

    const [nv] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', extra: ['mcp-engine'] });
    expect(nv.file).toMatch(/mcp-engine$/);
    const [dv] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', treeTar: 'C:/t/tree.tar', extra: ['mcp-engine'] });
    expect(innerOf(dv)).toMatch(/vitest run mcp-engine\)$/);

    expect(() => r.buildCommands({ suite: 'all', runner: 'native', repoRoot: 'C:/repo', extra: [one] }))
      .toThrow(/all/);
  });

  it('L1.11: the suite argument is required and validated; the legacy `bats` name canonicalises to `scripts`', () => {
    const r = loadRunner();
    expect(r.parseArgs(['vitest'])).toEqual({ suite: 'vitest', extra: [] });
    expect(r.parseArgs(['scripts'])).toEqual({ suite: 'scripts', extra: [] });
    expect(r.parseArgs(['bats', 'a.test.cjs'])).toEqual({ suite: 'scripts', extra: ['a.test.cjs'] });
    expect(() => r.parseArgs([])).toThrow(/vitest\|scripts\|bats\|all/);
    expect(() => r.parseArgs(['unit'])).toThrow(/vitest\|scripts\|bats\|all/);
  });

  it('L1.13: a worktree\'s host-path .git is mapped into the container; an ordinary checkout is left alone', () => {
    const r = loadRunner();
    const base = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'run-tests-wt-'));
    try {
      const common = path.join(base, 'main', '.git');
      const admin = path.join(common, 'worktrees', 'feat-x');
      const wt = path.join(base, 'wt');
      fs.mkdirSync(admin, { recursive: true });
      fs.mkdirSync(wt);
      fs.writeFileSync(path.join(admin, 'commondir'), '../..\n');
      fs.writeFileSync(path.join(wt, '.git'), `gitdir: ${admin}\n`);

      const mapped = r.worktreeGit(wt);
      expect(mapped.commonDir).toBe(common);
      expect(mapped.gitFile).toBe('gitdir: /gitcommon/worktrees/feat-x\n');

      // An ordinary checkout's .git is a directory the repository mount carries.
      expect(r.worktreeGit(path.join(base, 'main'))).toBeNull();

      const [spec] = r.buildCommands({
        suite: 'vitest', runner: 'docker', repoRoot: 'C:\\repo', tag: 'x',
        gitMount: { commonDir: 'C:\\repo\\.git', gitFilePath: 'C:\\tmp\\dotgit' },
      });
      expect(spec.args).toContain('C:/repo/.git:/gitcommon:ro');
      expect(spec.args).toContain('C:/tmp/dotgit:/code/.git:ro');
      // A worktree does not also mount its own .git file, which names a host path.
      expect(spec.args).not.toContain('C:/repo/.git:/code/.git:ro');

      const [plain] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:\\repo', tag: 'x' });
      expect(plain.args.join(' ')).not.toContain('/gitcommon');
      expect(plain.args).toContain('C:/repo/.git:/code/.git:ro');
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it('L1.14: the native Windows override keeps vitest serial; everywhere else it runs the projects as configured', () => {
    const r = loadRunner();
    const [win] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', platform: 'win32' });
    expect(win.file).toBe('npm --prefix cli test -- --no-file-parallelism --testTimeout=30000');

    const [winFiltered] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', platform: 'win32', extra: ['mcp'] });
    expect(winFiltered.file).toBe('npm --prefix cli test -- --no-file-parallelism --testTimeout=30000 mcp');

    // CI's path: Linux, native, parallel projects untouched.
    const [linux] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: '/repo', platform: 'linux' });
    expect(linux.file).toBe('npm --prefix cli test');

    // The container is Linux too, whatever the host.
    const [docker] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', platform: 'win32' });
    expect(innerOf(docker)).not.toContain('no-file-parallelism');
  });

  it('L1.12: the scripts selection is written once, so the native and Docker runs cannot point at different files', () => {
    const r = loadRunner();
    expect(r.SCRIPTS_TEST_GLOB).toBe(SCRIPTS_GLOB);

    const [native] = r.buildCommands({ suite: 'scripts', runner: 'native', repoRoot: REPO_ROOT, platform: 'linux' });
    expect(native.file).toContain(r.SCRIPTS_TEST_GLOB);

    const [docker] = r.buildCommands({ suite: 'scripts', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', treeTar: 'C:/t/tree.tar' });
    expect(innerOf(docker)).toContain(r.SCRIPTS_TEST_GLOB);
  });

  it('L1.15: the native copy keeps .git and cli/node_modules, and drops worktrees', () => {
    const r = loadRunner();
    const root = path.join(os.tmpdir(), 'repo');
    const keep = r.nativeCopyFilter(root);
    for (const p of ['.git', '.git/HEAD', 'cli/node_modules/.bin', 'framwork/.codeadd', '.claudeish', 'web/src']) {
      expect(keep(path.join(root, ...p.split('/'))), p).toBe(true);
    }
    for (const p of ['.worktrees', '.worktrees/x/y', '.claude/worktrees/z', 'web/node_modules/a']) {
      expect(keep(path.join(root, ...p.split('/'))), p).toBe(false);
    }
  });

  it('L1.16: the native copy lands in the destination and leaves the source untouched', () => {
    const r = loadRunner();
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-src-'));
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'run-tests-dest-')), 'tree');
    try {
      fs.mkdirSync(path.join(src, '.git'));
      fs.writeFileSync(path.join(src, '.git', 'HEAD'), 'ref: refs/heads/main\n');
      fs.mkdirSync(path.join(src, '.worktrees', 'w'), { recursive: true });
      fs.writeFileSync(path.join(src, 'a.md'), 'a');
      r.copyCheckout(src, dest);
      fs.writeFileSync(path.join(dest, 'a.md'), 'changed in the copy');

      expect(fs.readFileSync(path.join(dest, '.git', 'HEAD'), 'utf8')).toContain('refs/heads/main');
      expect(fs.existsSync(path.join(dest, '.worktrees'))).toBe(false);
      expect(fs.readFileSync(path.join(src, 'a.md'), 'utf8')).toBe('a');
    } finally {
      fs.rmSync(src, { recursive: true, force: true });
      fs.rmSync(path.dirname(dest), { recursive: true, force: true });
    }
  });

  it('L1.17: both runners mark the run as a copy, with the marker global-setup reads', async () => {
    const r = loadRunner();
    const { COPY_MARKER } = await import('./helpers/global-setup.js');
    expect(r.COPY_MARKER).toBe(COPY_MARKER);

    const [docker] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', platform: 'win32' });
    expect(docker.args).toContain(`${COPY_MARKER}=1`);

    // The native specs carry no env of their own; main() sets it on the spawn.
    const source = fs.readFileSync(RUNNER_PATH, 'utf8');
    expect(source).toMatch(/\[COPY_MARKER\]: '1'/);
    expect(source).toMatch(/cwd, env: childEnv/);
  });
});

describe('L3 — the documentation and registry edits', () => {
  it('L3.1: test:scripts points at the native runner, and no script invokes Bats directly', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['test:scripts']).toBe('node scripts/run-tests.js scripts');
    expect(pkg.scripts.test).toBe('node scripts/run-tests.js vitest');
    expect(pkg.scripts['test:all']).toBe('node scripts/run-tests.js all');

    const directBats = Object.entries(pkg.scripts)
      // Bats as the COMMAND — at the start or after a shell operator — never the
      // documented legacy selector passed to the runner.
      .filter(([, value]) => /(^|[&|;]\s*)(npx\s+)?bats(\s|$)/.test(value))
      .map(([name]) => name);
    expect(directBats).toEqual([]);
  });

  it('L3.2: CI routes the scripts suite through the native runner, never a direct Bats command', () => {
    const ci = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
    const job = ci.slice(ci.indexOf('test-scripts:'));
    // The job owns the selection through the runner; no step starts Bats itself.
    expect(job).toMatch(/npm run test:scripts/);
    expect(job).not.toMatch(/\bnpx bats\b/);
    expect(job).not.toMatch(/CODEADD_BATS_/);
  });

  it('L3.3: the product-layer skill gates on the runner and the two projects, and keeps the scripts-suite gate', () => {
    const skill = fs.readFileSync(
      path.join(REPO_ROOT, 'workbench', 'skills', 'add-framework-product-layer', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toMatch(/npm run test:scripts/);
    expect(skill).toMatch(/framwork\/\.codeadd\/scripts\/\*\.cjs/);
    expect(skill).toMatch(/ruling/i);
    expect(skill).toMatch(/three-part/i);
    expect(skill).toMatch(/costs?\b/i);
    expect(skill.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);

    // The vitest gate is the runner now, and the serial-or-nothing rule is gone.
    expect(skill).toContain('npm test          # at the repository root');
    expect(skill).toContain('scripts/run-tests.js');
    expect(skill).toMatch(/two projects/);
    expect(skill).toContain('A test changed a build sidecar in the real tree');
    expect(skill).not.toContain('--no-file-parallelism');
    expect(skill).not.toContain('Serial is not a preference');
    expect(skill).not.toMatch(/Serial or nothing/);
  });

  it('L3.4: the close-out drops the stale Windows figure but keeps its argument and its example', () => {
    const done = fs.readFileSync(
      path.join(REPO_ROOT, 'workbench', 'skills', 'add-framework--done', 'SKILL.md'),
      'utf8',
    );
    expect(done.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);
    expect(done).toMatch(/CODEADD_TESTS_RUNNER=native/);
    expect(done).not.toMatch(/CODEADD_BATS_/);
    // Root npm test now goes through the same runner, so its exit 2 is a refusal too.
    expect(done).toMatch(/`npm test` or `npm run test:scripts` exiting 2 or 127 is a REFUSAL to run/);
    expect(done).toMatch(/REFUSAL to run/);
    expect(done).toMatch(/one machine/i);
    expect(done).toMatch(/one Node version/i);
    expect(done).toMatch(/qa-preflight/);
  });

  it('L3.5: AGENTS.md names the runner exactly once and does not restate its mechanics', () => {
    const claude = fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8');

    expect(claude).not.toContain('run-bats');
    const mentions = claude.split('\n').filter((l) => l.includes('scripts/run-tests.js'));
    expect(mentions).toHaveLength(1);
    expect(mentions[0].length).toBeLessThan(200);

    // The generated scripts group names the .cjs entries the cutover left; a
    // stale block would still list .sh. F2 regenerated it and this pins that it
    // stayed current across the runtime blocks.
    const check = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'inventory.js'), '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(check.status, check.stderr).toBe(0);
  });
});
