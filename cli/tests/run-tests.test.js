import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * scripts/run-tests.js — one runner for both suites
 * (plan 2026-09-21T001942-PLAN--parallel-tests-in-one-container, which
 * generalised the bats-only runner of plan 2026-09-10T230600-PLAN--fast-local-bats).
 *
 * Both suites pay a process-creation tax on Windows that Linux does not, and
 * the Windows run has disagreed with CI more than once. The runner sends the
 * chosen suite into a Linux container on Windows and runs it natively
 * everywhere else, CI included.
 *
 * Cases here that must never be relaxed:
 *
 *   L1.2 — the native bats command is compared CHARACTER BY CHARACTER against
 *   the string CI runs. It carries `-j` on purpose now; the literal it replaced
 *   pinned CI to serial.
 *
 *   L1.3 — Windows without Docker must ERROR. The native path there is the slow
 *   one and the one with the false qa-preflight failure; a silent fallback reads
 *   as a hang and then lies.
 *
 *   L1.6 — the image installs no bats. The container runs the repository's
 *   pinned copy out of the mount, so the local gate and the merge gate grade on
 *   one binary.
 */

const require_ = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUNNER_PATH = path.join(REPO_ROOT, 'scripts', 'run-tests.js');
const DOCKERFILE_PATH = path.join(REPO_ROOT, 'scripts', 'tests.Dockerfile');

const GLOB = 'framwork/.codeadd/scripts/tests/*.bats';
/** What CI's test-scripts job runs, byte for byte, at the default four jobs. */
const CI_NATIVE_BATS = `npx bats -j 4 --no-parallelize-within-files ${GLOB}`;

function loadRunner() {
  return require_(RUNNER_PATH);
}

/** The inner `bash -c` string of a docker spec. */
function innerOf(spec) {
  expect(spec.args[spec.args.length - 2]).toBe('-c');
  return spec.args[spec.args.length - 1];
}

describe('L1 — the runner\'s decisions', () => {
  it('L1.1: CODEADD_TESTS_RUNNER overrides the platform in both directions; Windows with no daemon is unavailable', () => {
    const r = loadRunner();

    expect(r.resolveRunner({ platform: 'linux', env: {}, dockerAvailable: false }).runner).toBe('native');
    expect(r.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: true }).runner).toBe('docker');

    const none = r.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: false });
    expect(none.runner).toBe('unavailable');

    expect(r.resolveRunner({ platform: 'win32', env: { CODEADD_TESTS_RUNNER: 'native' }, dockerAvailable: false }).runner)
      .toBe('native');
    expect(r.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'docker' }, dockerAvailable: false }).runner)
      .toBe('docker');
    expect(() => r.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'podman' } })).toThrow(/CODEADD_TESTS_RUNNER/);

    // The old names are gone, not aliased.
    expect(r.resolveRunner({ platform: 'win32', env: { CODEADD_BATS_RUNNER: 'native' }, dockerAvailable: false }).runner)
      .toBe('unavailable');
  });

  it('L1.2: native bats at four jobs is exactly the CI string; at one job it is the plain form', () => {
    const r = loadRunner();
    const [spec] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: REPO_ROOT, jobs: 4, parallelAvailable: true });
    expect(spec.display).toBe(CI_NATIVE_BATS);
    expect(spec.file).toBe(CI_NATIVE_BATS);
    expect(spec.shell).toBe(true);

    const [serial] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: REPO_ROOT, jobs: 1, parallelAvailable: true });
    expect(serial.file).toBe(`npx bats ${GLOB}`);

    // No GNU parallel on the host means bats refuses -j; serial is the honest fallback.
    const [noParallel] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: REPO_ROOT, jobs: 4, parallelAvailable: false });
    expect(noParallel.file).toBe(`npx bats ${GLOB}`);
  });

  it('L1.3: the missing-daemon message names the override and CI', () => {
    const r = loadRunner();
    expect(r.DOCKER_MISSING_MESSAGE).toContain('CODEADD_TESTS_RUNNER=native');
    expect(r.DOCKER_MISSING_MESSAGE).toContain('CI');
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
      jobs: 4,
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

  it('L1.5b: the tarball leaves out .git, worktrees and cli/node_modules, and keeps the root node_modules', () => {
    const r = loadRunner();
    const args = r.tarArgs();
    expect(args.slice(0, 3)).toEqual(['-c', '-f', '-']);
    expect(args[args.length - 1]).toBe('.');
    for (const ex of ['./.git', './.worktrees', './.claude/worktrees', './cli/node_modules']) {
      expect(args).toContain(`--exclude=${ex}`);
    }
    // The root node_modules carries the pinned bats; excluding it would leave
    // the container with no bats at all.
    expect(args).not.toContain('--exclude=./node_modules');
  });

  it('L1.6: the Dockerfile installs git, jq and parallel, runs npm ci for cli/, and installs neither bats nor a git identity', () => {
    const text = fs.readFileSync(DOCKERFILE_PATH, 'utf8');

    expect(text).toMatch(/FROM node:22-bookworm-slim/);
    for (const pkg of ['git', 'jq', 'parallel']) {
      expect(text).toMatch(new RegExp(`\\b${pkg}\\b`));
    }
    expect(text).toMatch(/COPY cli\/package\.json cli\/package-lock\.json/);
    expect(text).toMatch(/RUN npm ci/);

    const installLines = text.split('\n').filter((l) => /apt-get install/.test(l) || /^\s+\S+ \\$/.test(l));
    expect(installLines.join('\n')).not.toMatch(/\bbats\b/);
    expect(text).not.toMatch(/git config --global/);
    expect(text).toMatch(/#.*bats/i);
    expect(text).toMatch(/#.*git identity|#.*git config/i);
  });

  it('L1.7: `all` runs vitest then bats, runs bats even when vitest failed, and fails when either failed', () => {
    const r = loadRunner();

    // Native: two specs, combined by the runner.
    const native = r.buildCommands({ suite: 'all', runner: 'native', repoRoot: REPO_ROOT, jobs: 4, parallelAvailable: true });
    expect(native).toHaveLength(2);
    expect(native[0].display).toBe('npm --prefix cli test');
    expect(native[1].display).toBe(CI_NATIVE_BATS);

    expect(r.combineExitCodes([0, 0])).toBe(0);
    expect(r.combineExitCodes([1, 0])).toBe(1);
    expect(r.combineExitCodes([0, 3])).toBe(3);
    expect(r.combineExitCodes([2, 1])).toBe(2);

    // Docker: one container start, both suites, the combination done in bash.
    const docker = r.buildCommands({ suite: 'all', runner: 'docker', repoRoot: 'C:/repo', tag: 'codeadd-tests:x', jobs: 4 });
    expect(docker).toHaveLength(1);
    const inner = innerOf(docker[0]);
    expect(inner.indexOf('vitest run')).toBeLessThan(inner.indexOf('.bin/bats'));
    // bats is not chained with && after vitest, so a vitest failure does not skip it.
    expect(inner).not.toMatch(/vitest run[^;]*&&[^;]*bats/);
  });

  it('L1.8: a non-zero child exit is forwarded unchanged, and a signalled child is not success', () => {
    const r = loadRunner();
    expect(r.exitCodeFrom({ status: 0, signal: null })).toBe(0);
    expect(r.exitCodeFrom({ status: 17, signal: null })).toBe(17);
    expect(r.exitCodeFrom({ status: null, signal: 'SIGTERM' })).not.toBe(0);
  });

  it('L1.9: CODEADD_TESTS_JOBS replaces the default of 4, and an unusable value falls back to it', () => {
    const r = loadRunner();
    expect(r.DEFAULT_JOBS).toBe(4);
    expect(r.jobsFrom({})).toBe(4);
    expect(r.jobsFrom({ CODEADD_TESTS_JOBS: '8' })).toBe(8);
    expect(r.jobsFrom({ CODEADD_TESTS_JOBS: '0' })).toBe(4);
    expect(r.jobsFrom({ CODEADD_BATS_JOBS: '8' })).toBe(4);
  });

  it('L1.10: extra arguments replace the bats glob and filter vitest, on both runners', () => {
    const r = loadRunner();
    const one = 'framwork/.codeadd/scripts/tests/delivered.bats';

    const [nb] = r.buildCommands({ suite: 'bats', runner: 'native', repoRoot: 'C:/repo', jobs: 4, parallelAvailable: true, extra: [one] });
    expect(nb.file).toContain(one);
    expect(nb.file).not.toContain('*');

    const [db] = r.buildCommands({ suite: 'bats', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', jobs: 4, extra: [one] });
    expect(innerOf(db)).toContain(one);
    expect(innerOf(db)).not.toContain('*');

    const [nv] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', jobs: 4, extra: ['mcp-engine'] });
    expect(nv.file).toMatch(/mcp-engine$/);
    const [dv] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', jobs: 4, extra: ['mcp-engine'] });
    expect(innerOf(dv)).toMatch(/vitest run mcp-engine\)$/);

    expect(() => r.buildCommands({ suite: 'all', runner: 'native', repoRoot: 'C:/repo', jobs: 4, extra: [one] }))
      .toThrow(/all/);
  });

  it('L1.11: the suite argument is required and validated', () => {
    const r = loadRunner();
    expect(r.parseArgs(['vitest'])).toEqual({ suite: 'vitest', extra: [] });
    expect(r.parseArgs(['bats', 'a.bats'])).toEqual({ suite: 'bats', extra: ['a.bats'] });
    expect(() => r.parseArgs([])).toThrow(/vitest\|bats\|all/);
    expect(() => r.parseArgs(['unit'])).toThrow(/vitest\|bats\|all/);
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
        suite: 'vitest', runner: 'docker', repoRoot: 'C:\\repo', tag: 'x', jobs: 4,
        gitMount: { commonDir: 'C:\\repo\\.git', gitFilePath: 'C:\\tmp\\dotgit' },
      });
      expect(spec.args).toContain('C:/repo/.git:/gitcommon:ro');
      expect(spec.args).toContain('C:/tmp/dotgit:/code/.git:ro');
      // A worktree does not also mount its own .git file, which names a host path.
      expect(spec.args).not.toContain('C:/repo/.git:/code/.git:ro');

      const [plain] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:\\repo', tag: 'x', jobs: 4 });
      expect(plain.args.join(' ')).not.toContain('/gitcommon');
      expect(plain.args).toContain('C:/repo/.git:/code/.git:ro');
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it('L1.14: the native Windows override keeps vitest serial; everywhere else it runs the projects as configured', () => {
    const r = loadRunner();
    const [win] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', jobs: 4, platform: 'win32' });
    expect(win.file).toBe('npm --prefix cli test -- --no-file-parallelism');

    const [winFiltered] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: 'C:/repo', jobs: 4, platform: 'win32', extra: ['mcp'] });
    expect(winFiltered.file).toBe('npm --prefix cli test -- --no-file-parallelism mcp');

    // CI's path: Linux, native, parallel projects untouched.
    const [linux] = r.buildCommands({ suite: 'vitest', runner: 'native', repoRoot: '/repo', jobs: 4, platform: 'linux' });
    expect(linux.file).toBe('npm --prefix cli test');

    // The container is Linux too, whatever the host.
    const [docker] = r.buildCommands({ suite: 'vitest', runner: 'docker', repoRoot: 'C:/repo', tag: 'x', jobs: 4, platform: 'win32' });
    expect(innerOf(docker)).not.toContain('no-file-parallelism');
  });

  it('L1.12: the glob is written once, so the two runners cannot point at different files', () => {
    const source = fs.readFileSync(RUNNER_PATH, 'utf8');
    const literals = source.match(/framwork\/\.codeadd\/scripts\/tests\/\*\.bats/g) || [];
    expect(literals).toHaveLength(1);
  });
});

describe('L3 — the documentation and registry edits', () => {
  it('L3.1: test:scripts points at the runner, and no script invokes bats directly', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['test:scripts']).toBe('node scripts/run-tests.js bats');
    expect(pkg.scripts.test).toBe('node scripts/run-tests.js vitest');
    expect(pkg.scripts['test:all']).toBe('node scripts/run-tests.js all');

    const directBats = Object.entries(pkg.scripts)
      // bats as the COMMAND — at the start or after a shell operator — not as an
      // argument to the runner, which is exactly what `run-tests.js bats` is.
      .filter(([, value]) => /(^|[&|;]\s*)(npx\s+)?bats(\s|$)/.test(value))
      .map(([name]) => name);
    expect(directBats).toEqual([]);
  });

  it('L3.3: the product-layer skill carries the conditional bats gate, and the vitest gate is untouched', () => {
    const skill = fs.readFileSync(
      path.join(REPO_ROOT, 'workbench', 'skills', 'add-framework-product-layer', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toMatch(/npm run test:scripts/);
    expect(skill).toMatch(/framwork\/\.codeadd\/scripts\/\*\.sh/);
    expect(skill).toMatch(/ruling/i);
    expect(skill).toMatch(/three-part/i);
    expect(skill).toMatch(/costs?\b/i);
    expect(skill.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);

    expect(skill).toContain('cd cli && npx vitest run --no-file-parallelism');
    expect(skill).toContain('**Serial is not a preference.**');
  });

  it('L3.4: the close-out drops the stale Windows figure but keeps its argument and its example', () => {
    const done = fs.readFileSync(
      path.join(REPO_ROOT, 'workbench', 'skills', 'add-framework--done', 'SKILL.md'),
      'utf8',
    );
    expect(done.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);
    expect(done).toMatch(/CODEADD_BATS_RUNNER=native/);
    expect(done).toMatch(/REFUSAL to run/);
    expect(done).toMatch(/one machine/i);
    expect(done).toMatch(/one Node version/i);
    expect(done).toMatch(/qa-preflight/);
  });

  it('L3.5: CLAUDE.md names the runner exactly once and does not restate its mechanics', () => {
    const claude = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');

    const mentions = claude.split('\n').filter((l) => l.includes('scripts/run-bats.js'));
    expect(mentions).toHaveLength(1);
    expect(mentions[0].length).toBeLessThan(200);

    const check = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'inventory.js'), '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(check.status).toBe(0);
  });
});
