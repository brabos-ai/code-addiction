#!/usr/bin/env node
/**
 * run-bats.js — run the bats suite on whichever runner this platform can use.
 *
 * Usage:
 *   node scripts/run-bats.js            pick the runner, run the suite, forward its exit code
 *   npm run test:scripts -- <file>…     run only those files, on the same runner
 *
 * Environment:
 *   CODEADD_BATS_RUNNER=native|docker   force a runner, overriding the platform
 *   CODEADD_BATS_JOBS=<n>               parallel jobs in the container (default 4)
 *
 * Exit codes: the bats run's own, forwarded unchanged. 2 when Windows has no
 * reachable Docker daemon, which is a refusal to run rather than a test result.
 *
 * Why this exists: bats spends its time forking, and process creation under Git
 * Bash on Windows costs far more than on Linux. The same 386 tests take about
 * 69 minutes there and 63 seconds on CI. Worse, the Windows run DISAGREES with
 * CI — qa-preflight.bats fails there and nowhere else, because a node_modules
 * above TMPDIR resolves a package the test asserts is absent. A container fixes
 * both at once: about half a minute, and the same answer CI gives.
 *
 * Architecture:
 *   resolveRunner  → override, then platform, then whether the daemon answered
 *   imageTag       → the Dockerfile's own hash, so an edit rebuilds the image
 *   buildCommand   → one shell string per runner; the native one is what npm ran before
 *   exitCodeFrom   → the child's status, never coerced to 0
 *   main           → probe, announce, ensure the image, run, forward
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCKERFILE = path.join(REPO_ROOT, 'scripts', 'bats.Dockerfile');

const IMAGE_PREFIX = 'codeadd-bats';
const DEFAULT_JOBS = 4;

const BATS_GLOB = 'framwork/.codeadd/scripts/tests/*.bats';

/**
 * The command `package.json` -> test:scripts held before this wrapper existed.
 * The CI job runs that script, so on any platform where bats is already fast
 * this string is reproduced exactly — same glob, same shell expansion, same
 * everything. Changing it changes what CI does.
 *
 * Built from BATS_GLOB rather than written out again: the two runners must
 * point at the same files, and a second literal is a second thing to edit.
 */
const NATIVE_COMMAND = `npx bats ${BATS_GLOB}`;

/**
 * Named here rather than assembled at the call site, because it is asserted.
 * Windows without Docker must not fall back to the native path: that path is
 * both the 69-minute one and the one with the false qa-preflight failure, so a
 * silent fallback would read as a hang and then report a failure that is not
 * real.
 */
const DOCKER_MISSING_MESSAGE = [
  'The Docker daemon did not answer, and bats on Windows without it takes about 69 minutes.',
  'Refusing to run rather than appearing to hang.',
  '',
  '  Start Docker Desktop, or',
  '  set CODEADD_BATS_RUNNER=native to run the slow native path anyway, or',
  '  push the branch and read the verdict from CI, which owns it regardless.',
].join('\n');

/** The image tag is the Dockerfile's own hash, so editing it rebuilds. */
function imageTag(dockerfileText) {
  const digest = createHash('sha256').update(dockerfileText).digest('hex');
  return `${IMAGE_PREFIX}:${digest.slice(0, 12)}`;
}

/** A positive integer from the environment, or the default. */
function jobsFrom(env) {
  const raw = env.CODEADD_BATS_JOBS;
  if (raw === undefined) return DEFAULT_JOBS;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_JOBS;
}

/** Override first, then platform, then whether the daemon answered. */
function resolveRunner({ platform, env, dockerAvailable }) {
  const forced = env.CODEADD_BATS_RUNNER;
  if (forced === 'native') {
    return { runner: 'native', reason: 'CODEADD_BATS_RUNNER=native overrode the platform' };
  }
  if (forced === 'docker') {
    return { runner: 'docker', reason: 'CODEADD_BATS_RUNNER=docker overrode the platform' };
  }
  if (forced !== undefined) {
    throw new Error(`CODEADD_BATS_RUNNER must be "native" or "docker", got "${forced}"`);
  }

  if (platform !== 'win32') {
    return { runner: 'native', reason: `${platform} runs bats natively in about a minute` };
  }
  if (dockerAvailable) {
    return { runner: 'docker', reason: 'Windows, and the Docker daemon answered' };
  }
  return { runner: 'unavailable', reason: 'Windows, and the Docker daemon did not answer' };
}

/**
 * A spawn spec per runner. The two runners genuinely need different shapes and
 * collapsing them into one string does not survive Windows.
 *
 * The native branch goes through a shell with the whole command as one string,
 * because that is exactly what npm does with a `scripts` entry — same glob,
 * same expansion, same everything CI gets.
 *
 * The container branch must NOT go through the outer shell. On Windows that
 * shell is cmd.exe, which does not understand the single quotes wrapping the
 * inner `bash -c` command and splits it mid-string; bash then receives an
 * unterminated argument and dies with "unexpected EOF". Passing argv directly
 * hands the inner command to docker as one element, with no outer shell to
 * re-parse it. The glob still expands, inside the image, where bash reads it.
 */
function buildCommand({ runner, repoRoot, tag, jobs, extra = [] }) {
  // `npm run test:scripts -- <file>` replaces the glob, so the per-file run the
  // close-out documents still works. Appending instead would run the whole
  // suite AND the named file, which is the opposite of what anyone wants.
  const target = extra.length > 0 ? extra.join(' ') : BATS_GLOB;

  if (runner === 'native') {
    const command = `npx bats ${target}`;
    return { file: command, args: [], shell: true, display: command };
  }

  // Docker Desktop takes a forward-slashed Windows path. A backslashed one is
  // read as a named volume, which mounts an empty directory and fails with
  // every test file missing rather than with a mount error.
  const mount = `${repoRoot.replace(/\\/g, '/')}:/code`;

  // bats refuses the parallelize flags below --jobs 2: "The flag
  // --no-parallelize-across-files requires at least --jobs 2". One job is the
  // documented way to repeat a run serially, so it gets the plain invocation
  // rather than an error.
  const parallel = jobs > 1 ? `-j ${jobs} --no-parallelize-within-files ` : '';
  const inner = `./node_modules/.bin/bats ${parallel}${target}`;
  const args = ['run', '--rm', '-v', mount, '-w', '/code', tag, 'bash', '-c', inner];

  return { file: 'docker', args, shell: false, display: `docker ${args.join(' ')}` };
}

/** What to announce before spending a minute of someone's time. */
function announcement({ runner, reason }) {
  return `bats runner: ${runner} — ${reason}`;
}

/**
 * The child's own status. A child killed by a signal reports status null, and
 * coercing that to 0 would turn an interrupted suite into a pass.
 */
function exitCodeFrom(result) {
  if (result.error) return 1;
  if (typeof result.status === 'number') return result.status;
  return 1;
}

/** Does the daemon answer? `docker version` asks the server; `--version` does not. */
function probeDocker() {
  const probe = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    stdio: 'ignore',
  });
  return !probe.error && probe.status === 0;
}

/** Build the image only when its tag is absent. Orphaned tags are left alone. */
function ensureImage(tag, dockerfileText) {
  const present = spawnSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' });
  if (!present.error && present.status === 0) return true;

  process.stdout.write(`Building ${tag} (first run for this Dockerfile)\n`);
  // An empty build context: the Dockerfile has no COPY, and sending the repo
  // would drag node_modules across the file bridge for nothing.
  const built = spawnSync('docker', ['build', '-t', tag, '-'], {
    input: dockerfileText,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  return !built.error && built.status === 0;
}

function main() {
  const env = process.env;
  const platform = process.platform;

  // Probe only where the answer is consulted. An explicit override decides on
  // its own, so probing under one spends a daemon round-trip on a value
  // resolveRunner never reads.
  const needsProbe = platform === 'win32' && env.CODEADD_BATS_RUNNER === undefined;

  let runner;
  let reason;
  try {
    ({ runner, reason } = resolveRunner({
      platform,
      env,
      dockerAvailable: needsProbe ? probeDocker() : false,
    }));
  } catch (err) {
    // An unrecognised override is misuse, not a failing suite. Exit 1 here
    // would mean "the tests failed" under this file's own exit-code contract.
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }

  if (runner === 'unavailable') {
    process.stderr.write(`${DOCKER_MISSING_MESSAGE}\n`);
    process.exit(2);
  }

  process.stdout.write(`${announcement({ runner, reason })}\n`);

  let tag = null;
  if (runner === 'docker') {
    const dockerfileText = fs.readFileSync(DOCKERFILE, 'utf8');
    tag = imageTag(dockerfileText);
    if (!ensureImage(tag, dockerfileText)) {
      process.stderr.write(`Could not build ${tag}. See the output above.\n`);
      process.exit(2);
    }
  }

  const spec = buildCommand({
    runner,
    repoRoot: REPO_ROOT,
    tag,
    jobs: jobsFrom(env),
    extra: process.argv.slice(2),
  });

  const result = spawnSync(spec.file, spec.args, {
    shell: spec.shell,
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  process.exit(exitCodeFrom(result));
}

module.exports = {
  IMAGE_PREFIX,
  DEFAULT_JOBS,
  NATIVE_COMMAND,
  BATS_GLOB,
  DOCKER_MISSING_MESSAGE,
  imageTag,
  jobsFrom,
  resolveRunner,
  buildCommand,
  announcement,
  exitCodeFrom,
};

if (require.main === module) main();
