import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * scripts/run-bats.js — the platform-detecting bats runner
 * (plan 2026-09-10T230600-PLAN--fast-local-bats).
 *
 * The bats suite takes about 69 minutes on Windows and 63 seconds on Linux CI,
 * and the Windows run disagrees with CI on `qa-preflight.bats` because a
 * node_modules above TMPDIR resolves a package the test asserts is absent. The
 * wrapper routes the same suite into a Linux container on Windows and leaves
 * every other platform running exactly what it runs today.
 *
 * Three cases here are load-bearing and must never be relaxed:
 *
 *   L1.1 / L4.1 — the non-win32 command string is compared CHARACTER BY
 *   CHARACTER against the literal the repository shipped in `test:scripts`
 *   before this plan. That string is what the CI job runs. If the wrapper
 *   reshapes it — different glob, split argv, an added flag — CI's behaviour
 *   changed, and this suite is the only place that would notice.
 *
 *   L1.3 — Windows without Docker must ERROR. The tempting fallback is the
 *   native path, and that path is both the 69-minute one and the one with the
 *   false failure. A silent fallback reads as a hang and then lies.
 *
 *   L3.2 — the Dockerfile must NOT install bats. Debian bookworm ships 1.8.2
 *   and this repository pins 1.13.0; the container runs the pinned copy out of
 *   the mounted node_modules. An apt-installed bats would put the local gate on
 *   a different binary than the one governing the merge, which is the exact
 *   class of divergence this plan exists to close.
 */

const require_ = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRAPPER_PATH = path.join(REPO_ROOT, 'scripts', 'run-bats.js');
const DOCKERFILE_PATH = path.join(REPO_ROOT, 'scripts', 'bats.Dockerfile');

/**
 * The value `package.json` -> scripts.test:scripts held before F4, copied here
 * verbatim. It is the CI job's command, so it is the contract the native branch
 * must reproduce. Never "fix" this constant to match the wrapper.
 */
const SHIPPED_NATIVE_COMMAND = 'npx bats framwork/.codeadd/scripts/tests/*.bats';

function loadWrapper() {
  return require_(WRAPPER_PATH);
}

describe('L1 — the wrapper\'s decisions', () => {
  it('L1.1: a non-win32 platform resolves the native runner, and its command is the shipped string', () => {
    const w = loadWrapper();
    const { runner } = w.resolveRunner({ platform: 'linux', env: {}, dockerAvailable: false });
    expect(runner).toBe('native');

    const spec = w.buildCommand({ runner: 'native', repoRoot: REPO_ROOT, tag: 'unused', jobs: 4 });
    expect(spec.display).toBe(SHIPPED_NATIVE_COMMAND);
    // One string through a shell is precisely what npm does with a scripts
    // entry, which is why the glob still expands the way CI expands it.
    expect(spec.file).toBe(SHIPPED_NATIVE_COMMAND);
    expect(spec.args).toEqual([]);
    expect(spec.shell).toBe(true);
  });

  it('L1.2: win32 with Docker reachable resolves the container runner', () => {
    const w = loadWrapper();
    const { runner } = w.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: true });
    expect(runner).toBe('docker');
  });

  it('L1.3: win32 without Docker is unavailable, names the override and CI, and never falls back to native', () => {
    const w = loadWrapper();
    const { runner } = w.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: false });
    expect(runner).toBe('unavailable');
    expect(runner).not.toBe('native');

    expect(w.DOCKER_MISSING_MESSAGE).toContain('CODEADD_BATS_RUNNER=native');
    expect(w.DOCKER_MISSING_MESSAGE).toContain('CI');
  });

  it('L1.4: CODEADD_BATS_RUNNER overrides the platform choice in both directions, on both platforms', () => {
    const w = loadWrapper();

    // native forced where the platform would have chosen docker
    expect(w.resolveRunner({ platform: 'win32', env: { CODEADD_BATS_RUNNER: 'native' }, dockerAvailable: true }).runner)
      .toBe('native');
    // native forced even with no docker at all — this is the documented escape hatch
    expect(w.resolveRunner({ platform: 'win32', env: { CODEADD_BATS_RUNNER: 'native' }, dockerAvailable: false }).runner)
      .toBe('native');
    // docker forced where the platform would have chosen native
    expect(w.resolveRunner({ platform: 'linux', env: { CODEADD_BATS_RUNNER: 'docker' }, dockerAvailable: true }).runner)
      .toBe('docker');
  });

  it('L1.5: the image tag is the prefix plus 12 hex of the Dockerfile sha256, and one changed byte changes it', () => {
    const w = loadWrapper();

    const text = 'FROM node:22-bookworm-slim\n';
    const expected = `${w.IMAGE_PREFIX}:${createHash('sha256').update(text).digest('hex').slice(0, 12)}`;
    expect(w.imageTag(text)).toBe(expected);
    expect(w.imageTag(text)).toMatch(/^codeadd-bats:[0-9a-f]{12}$/);

    expect(w.imageTag(`${text} `)).not.toBe(w.imageTag(text));
  });

  it('L1.6: the announcement names the chosen runner and the reason', () => {
    const w = loadWrapper();
    const { runner, reason } = w.resolveRunner({ platform: 'win32', env: {}, dockerAvailable: true });
    const line = w.announcement({ runner, reason });

    expect(line).toContain('docker');
    expect(line).toContain(reason);
    expect(reason.length).toBeGreaterThan(0);
  });

  it('L1.7: a non-zero child exit is forwarded unchanged, and a signalled child is not reported as success', () => {
    const w = loadWrapper();

    expect(w.exitCodeFrom({ status: 0, signal: null })).toBe(0);
    expect(w.exitCodeFrom({ status: 1, signal: null })).toBe(1);
    expect(w.exitCodeFrom({ status: 17, signal: null })).toBe(17);
    // A child killed by a signal reports status null. Coercing that to 0 would
    // turn an interrupted suite into a pass.
    expect(w.exitCodeFrom({ status: null, signal: 'SIGTERM' })).not.toBe(0);
  });

  it('L1.8: CODEADD_BATS_JOBS replaces the default of 4, and an unusable value falls back to it', () => {
    const w = loadWrapper();

    expect(w.DEFAULT_JOBS).toBe(4);
    expect(w.jobsFrom({})).toBe(4);
    expect(w.jobsFrom({ CODEADD_BATS_JOBS: '1' })).toBe(1);
    expect(w.jobsFrom({ CODEADD_BATS_JOBS: '8' })).toBe(8);
    expect(w.jobsFrom({ CODEADD_BATS_JOBS: '0' })).toBe(4);
    expect(w.jobsFrom({ CODEADD_BATS_JOBS: 'four' })).toBe(4);
  });

  it('L1.9: the container spec spawns docker directly, mounts the repo, and runs the pinned bats', () => {
    const w = loadWrapper();
    const spec = w.buildCommand({
      runner: 'docker',
      repoRoot: 'C:\\github\\xmaiconx\\code-addiction',
      tag: 'codeadd-bats:abcdef012345',
      jobs: 4,
    });

    expect(spec.file).toBe('docker');

    // No outer shell, and this is the assertion that matters most on Windows.
    // There the shell would be cmd.exe, which does not understand the single
    // quotes around the inner `bash -c` command and splits it mid-string; bash
    // then dies with "unexpected EOF". Argv hands the inner command over whole.
    expect(spec.shell).toBe(false);

    // Docker Desktop takes a forward-slashed Windows path; a backslashed one is
    // parsed as a named volume and silently mounts an empty directory.
    expect(spec.args).toContain('C:/github/xmaiconx/code-addiction:/code');
    expect(spec.args.join(' ')).not.toContain('\\');

    expect(spec.args).toContain('codeadd-bats:abcdef012345');

    // The inner command is ONE argv element, so no outer parser can break it.
    const inner = spec.args[spec.args.length - 1];
    expect(spec.args[spec.args.length - 2]).toBe('-c');
    // The repository's pinned bats, never one the image installed.
    expect(inner).toContain('./node_modules/.bin/bats');
    expect(inner).toContain('-j 4');
    expect(inner).toContain('--no-parallelize-within-files');
    expect(inner).toContain('framwork/.codeadd/scripts/tests/*.bats');
  });

  it('L1.10: one job drops the parallelize flags, because bats refuses them below two', () => {
    const w = loadWrapper();
    const spec = w.buildCommand({
      runner: 'docker',
      repoRoot: 'C:/repo',
      tag: 'codeadd-bats:abcdef012345',
      jobs: 1,
    });
    const inner = spec.args[spec.args.length - 1];

    // "The flag --no-parallelize-across-files requires at least --jobs 2" is a
    // hard error, and CODEADD_BATS_JOBS=1 is the documented way to repeat a run
    // serially — so it must produce a plain invocation, not a refusal.
    expect(inner).not.toContain('--no-parallelize-within-files');
    expect(inner).not.toContain('-j ');
    expect(inner).toContain('./node_modules/.bin/bats');
    expect(inner).toContain('framwork/.codeadd/scripts/tests/*.bats');
  });

  it('L1.11: extra arguments replace the glob on both runners, so a per-file run still works', () => {
    const w = loadWrapper();
    const one = 'framwork/.codeadd/scripts/tests/delivered.bats';

    // The close-out documents per-file runs as the local habit. Dropping the
    // arguments would take that away while advertising a faster whole suite.
    const native = w.buildCommand({ runner: 'native', repoRoot: 'C:/repo', tag: 'x', jobs: 4, extra: [one] });
    expect(native.file).toBe(`npx bats ${one}`);
    expect(native.file).not.toContain('*');

    const docker = w.buildCommand({ runner: 'docker', repoRoot: 'C:/repo', tag: 'x', jobs: 4, extra: [one] });
    const inner = docker.args[docker.args.length - 1];
    expect(inner).toContain(one);
    expect(inner).not.toContain('*');

    // No arguments still means the whole suite, character-identical to CI's.
    expect(w.buildCommand({ runner: 'native', repoRoot: 'C:/repo', tag: 'x', jobs: 4 }).file)
      .toBe(SHIPPED_NATIVE_COMMAND);
  });

  it('L1.12: the glob is written once, so the two runners cannot point at different files', () => {
    const w = loadWrapper();
    expect(w.NATIVE_COMMAND).toBe(`npx bats ${w.BATS_GLOB}`);

    const source = fs.readFileSync(WRAPPER_PATH, 'utf8');
    const literals = source.match(/framwork\/\.codeadd\/scripts\/tests\/\*\.bats/g) || [];
    expect(literals).toHaveLength(1);
  });
});

describe('L3 — the documentation and registry edits', () => {
  it('L3.1: test:scripts points at the wrapper, and no second bats script exists', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['test:scripts']).toBe('node scripts/run-bats.js');

    // A script that INVOKES bats, not merely one whose path contains the word.
    // `\bbats\b` matches inside "run-bats.js", because the hyphen and the dot
    // are both word boundaries — so the naive pattern flags the wrapper itself.
    const directBats = Object.entries(pkg.scripts)
      .filter(([, value]) => /(^|[\s&|;])(npx\s+)?bats(\s|$)/.test(value))
      .map(([name]) => name);
    expect(directBats).toEqual([]);
  });

  it('L3.2: the Dockerfile installs git, jq and parallel, and neither bats nor a global git identity', () => {
    const text = fs.readFileSync(DOCKERFILE_PATH, 'utf8');

    expect(text).toMatch(/FROM node:22-bookworm-slim/);
    for (const pkg of ['git', 'jq', 'parallel']) {
      expect(text).toMatch(new RegExp(`\\b${pkg}\\b`));
    }

    // The two omissions that look like oversights and are not. Each carries a
    // comment in the file saying why, and both are asserted here so a helpful
    // future edit fails loudly.
    const installLines = text.split('\n').filter((l) => /apt-get install/.test(l) || /^\s+\S+ \\$/.test(l));
    expect(installLines.join('\n')).not.toMatch(/\bbats\b/);
    expect(text).not.toMatch(/git config --global/);
    expect(text).toMatch(/#.*bats/i);
    expect(text).toMatch(/#.*git identity|#.*git config/i);
  });

  it('L3.3: the product-layer skill carries the conditional bats gate, and the vitest gate is untouched', () => {
    const skill = fs.readFileSync(
      path.join(REPO_ROOT, '.claude', 'skills', 'add-framework-product-layer', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toMatch(/npm run test:scripts/);
    expect(skill).toMatch(/framwork\/\.codeadd\/scripts\/\*\.sh/);
    // The clause that makes the gate honest where no runner resolves, and the
    // ruling form add-build-ledger actually accepts — three parts, not two.
    expect(skill).toMatch(/ruling/i);
    expect(skill).toMatch(/three-part/i);
    expect(skill).toMatch(/costs?\b/i);

    // No timing figure here either. The whole-file read is deliberate: the
    // single-line grep that was supposed to catch this missed it, because the
    // phrase had wrapped across a line break.
    expect(skill.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);

    // Byte-for-byte survivors of the pre-existing serial-vitest gate.
    expect(skill).toContain('cd cli && npx vitest run --no-file-parallelism');
    expect(skill).toContain('**Serial is not a preference.**');
  });

  it('L3.4: the close-out drops the stale Windows figure but keeps its argument and its example', () => {
    const done = fs.readFileSync(
      path.join(REPO_ROOT, '.claude', 'commands', 'add-framework--done.md'),
      'utf8',
    );

    // The stale claim itself, matched across line breaks — a single-line read
    // is exactly how this phrase survived a sweep once already.
    expect(done.replace(/\s+/g, ' ')).not.toMatch(/over an hour/i);

    // The native path is the override's, not the default's. Without this the
    // paragraph reads as a current failure beside the claim that it passes.
    expect(done).toMatch(/CODEADD_BATS_RUNNER=native/);

    // Exit 2 from the runner is a refusal, and the local-fallback branch is the
    // one place that can mistake it for a red suite.
    expect(done).toMatch(/REFUSAL to run/);

    // The argument the stale claim was evidence for.
    expect(done).toMatch(/one machine/i);
    expect(done).toMatch(/one Node version/i);
    // The example, still true of the native Windows path the override reaches.
    expect(done).toMatch(/qa-preflight/);
  });

  it('L3.5: CLAUDE.md names the wrapper exactly once and does not restate its mechanics', () => {
    const claude = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');

    const mentions = claude.split('\n').filter((l) => l.includes('scripts/run-bats.js'));
    expect(mentions).toHaveLength(1);
    // An overview row, not a second copy of the wrapper's rules.
    expect(mentions[0].length).toBeLessThan(200);

    // The row sits outside the generated inventory block, so the generator
    // still reports the file current. Asserted rather than attested.
    const check = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'inventory.js'), '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    expect(check.status).toBe(0);
  });
});
