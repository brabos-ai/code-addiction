#!/usr/bin/env node
/**
 * run-tests.js — run a test suite on whichever runner this platform can use.
 *
 * Usage:
 *   node scripts/run-tests.js vitest [filter…]   the cli vitest suite (npm test at the root)
 *   node scripts/run-tests.js bats   [file…]     the bats suite (npm run test:scripts)
 *   node scripts/run-tests.js all                both, vitest first (npm run test:all)
 *
 * Environment:
 *   CODEADD_TESTS_RUNNER=native|docker   force a runner, overriding the platform
 *   CODEADD_TESTS_JOBS=<n>               bats parallel jobs, on both runners (default 4)
 *
 * Exit codes: the suite's own, forwarded unchanged; for `all`, the first
 * non-zero of the two. 2 when Windows has no reachable Docker daemon, when the
 * image cannot be built, when the tree cannot be packed or unpacked, when the
 * container's cli dependencies are missing, or on a usage error — each a
 * refusal to run rather than a test result.
 *
 * Why this exists: both suites spend their time creating processes — bats forks
 * constantly, and a dozen vitest files spawn node — and process creation under
 * Windows costs far more than on Linux. The same 386 bats tests take about 69
 * minutes there and about a minute on CI, and the Windows run has disagreed
 * with CI (qa-preflight.bats fails there and nowhere else). A Linux container
 * fixes both at once, for both suites.
 *
 * Three things the container does not take from the host, each for a reason:
 *
 *   The checkout itself is COPIED in, as a tarball extracted onto the
 *   container's filesystem, never bind-mounted. Docker Desktop's Windows bind
 *   mount is slow enough at reading many small files that vitest files walking
 *   the tree time out at 5000ms through it.
 *
 *   cli/node_modules comes from the image. On Windows the host's copy holds
 *   Windows builds of vitest's native bindings, which do not load on Linux.
 *
 *   `.git` is bind-mounted, because git reads a handful of files. A worktree's
 *   `.git` names a host path the container cannot follow, so it is remapped.
 *
 * Images left by the bats-only runner this one replaced are tagged
 * `codeadd-bats:<hash>`. Nothing builds or removes them any more, so a machine
 * that ran it keeps them until pruned by hand: list them with
 * `docker image ls codeadd-bats`, remove them with `docker image rm <id>`.
 *
 * The native runner works on a copy too, in a temp directory removed on exit.
 * The suite's globalSetup rebuilds framwork/ output and its sidecars, and a run
 * must never rewrite the checkout it was started from. Both runners set
 * CODEADD_TESTS_COPY=1, and cli/tests/helpers/global-setup.js refuses to run
 * without it outside CI — so a bare `npx vitest` in cli/ stops instead of
 * writing the real tree.
 *
 * Architecture:
 *   parseArgs      → the suite, then the arguments that follow it
 *   resolveRunner  → override, then platform, then whether the daemon answered
 *   imageTag       → a hash of the Dockerfile and the two cli package files
 *   worktreeGit    → maps a git worktree's host-path `.git` into the container
 *   buildCommands  → the spawn specs for a suite on a runner
 *   combineExitCodes / exitCodeFrom → never coerce a failure to 0
 *   main           → probe, announce, ensure the image, pack, run, forward
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createHash } = require('crypto');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCKERFILE = path.join(REPO_ROOT, 'scripts', 'tests.Dockerfile');
const CLI_PACKAGE = path.join(REPO_ROOT, 'cli', 'package.json');
const CLI_LOCK = path.join(REPO_ROOT, 'cli', 'package-lock.json');

const IMAGE_PREFIX = 'codeadd-tests';
const DEFAULT_JOBS = 4;
const SUITES = ['vitest', 'bats', 'all'];

const BATS_GLOB = 'framwork/.codeadd/scripts/tests/*.bats';

/** Where the image installs the cli dependencies. The tree copy never overwrites it. */
const CONTAINER_MODULES = '/code/cli/node_modules';

/** Where the tarball of the checkout is mounted inside the container. */
const CONTAINER_TREE = '/src/tree.tar';

/**
 * What the tarball leaves out. `.git` is mounted instead; cli/node_modules
 * comes from the image; worktrees are other checkouts entirely. The root
 * node_modules IS packed — it carries the pinned bats the suite runs.
 */
const TREE_EXCLUDES = ['./.git', './.worktrees', './.claude/worktrees', './cli/node_modules', './web/node_modules'];

/**
 * What the native copy leaves out. Unlike the container it KEEPS `.git` and
 * cli/node_modules: the host's own git data, and the host's native bindings.
 */
const NATIVE_COPY_EXCLUDES = ['.worktrees', '.claude/worktrees', 'web/node_modules'];

/** Set on every run that works on a copy. Its twin lives in cli/tests/helpers/global-setup.js. */
const COPY_MARKER = 'CODEADD_TESTS_COPY';

/**
 * Named here rather than assembled at the call site, because it is asserted.
 * Windows without Docker must not fall back to the native path: that path is
 * both the slow one and the one with the false qa-preflight failure, so a
 * silent fallback would read as a hang and then report a failure that is not
 * real.
 */
const DOCKER_MISSING_MESSAGE = [
  'The Docker daemon did not answer, and the test suites on Windows without it are slow and disagree with CI.',
  'Refusing to run rather than appearing to hang.',
  '',
  '  Start Docker Desktop, or',
  '  set CODEADD_TESTS_RUNNER=native to run the slow native path anyway, or',
  '  push the branch and read the verdict from CI, which owns it regardless.',
].join('\n');

const USAGE = 'usage: node scripts/run-tests.js <vitest|bats|all> [args…]';

/** The suite, then whatever follows it. Throws on a missing or unknown suite. */
function parseArgs(argv) {
  const [suite, ...extra] = argv;
  if (!SUITES.includes(suite)) throw new Error(USAGE);
  return { suite, extra };
}

/**
 * The image tag hashes all three inputs the image is built from, so a
 * dependency bump rebuilds it exactly as a Dockerfile edit does. Each input is
 * length-prefixed so a byte moving from one to the next cannot collide.
 */
function imageTag({ dockerfile, pkg, lock }) {
  const hash = createHash('sha256');
  for (const part of [dockerfile, pkg, lock]) {
    hash.update(`${Buffer.byteLength(part)}:`).update(part);
  }
  return `${IMAGE_PREFIX}:${hash.digest('hex').slice(0, 12)}`;
}

/** A positive integer from the environment, or the default. */
function jobsFrom(env) {
  const raw = env.CODEADD_TESTS_JOBS;
  if (raw === undefined) return DEFAULT_JOBS;
  const n = Number.parseInt(raw, 10);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_JOBS;
}

/** Override first, then platform, then whether the daemon answered. */
function resolveRunner({ platform, env, dockerAvailable }) {
  const forced = env.CODEADD_TESTS_RUNNER;
  if (forced === 'native') {
    return { runner: 'native', reason: 'CODEADD_TESTS_RUNNER=native overrode the platform' };
  }
  if (forced === 'docker') {
    return { runner: 'docker', reason: 'CODEADD_TESTS_RUNNER=docker overrode the platform' };
  }
  if (forced !== undefined) {
    throw new Error(`CODEADD_TESTS_RUNNER must be "native" or "docker", got "${forced}"`);
  }

  if (platform !== 'win32') {
    return { runner: 'native', reason: `${platform} runs the suites natively` };
  }
  if (dockerAvailable) {
    return { runner: 'docker', reason: 'Windows, and the Docker daemon answered' };
  }
  return { runner: 'unavailable', reason: 'Windows, and the Docker daemon did not answer' };
}

/**
 * bats refuses the parallelize flags below --jobs 2 ("The flag
 * --no-parallelize-across-files requires at least --jobs 2"), and refuses -j
 * at all without GNU parallel. One job, or no parallel, gets the plain form.
 */
function batsArgs({ jobs, parallelAvailable, extra }) {
  const target = extra.length > 0 ? extra.join(' ') : BATS_GLOB;
  const parallel = jobs > 1 && parallelAvailable ? `-j ${jobs} --no-parallelize-within-files ` : '';
  return `${parallel}${target}`;
}

function vitestArgs(extra) {
  return extra.length > 0 ? ` ${extra.join(' ')}` : '';
}

/**
 * Docker Desktop takes a forward-slashed Windows path. A backslashed one is
 * read as a named volume, which mounts an empty directory and fails with every
 * file missing rather than with a mount error.
 */
function toDockerPath(p) {
  return p.split('\\').join('/');
}

/**
 * A git worktree's `.git` is a FILE holding the host's absolute path to its
 * admin directory — `gitdir: C:/…/.git/worktrees/<name>` on Windows — which
 * means nothing inside the container, so every test that runs git fails there
 * and nowhere else. The common git directory is mounted at /gitcommon, and a
 * replacement `.git` naming the admin directory under that mount is laid over
 * /code/.git.
 *
 * Returns null for an ordinary checkout, whose `.git` is a directory.
 */
function worktreeGit(repoRoot, fsImpl = fs) {
  const dotGit = path.join(repoRoot, '.git');
  let stat;
  try {
    stat = fsImpl.statSync(dotGit);
  } catch {
    return null;
  }
  if (!stat.isFile()) return null;

  const match = /^gitdir:\s*(.+?)\s*$/m.exec(fsImpl.readFileSync(dotGit, 'utf8'));
  if (!match) return null;
  const adminDir = path.resolve(repoRoot, match[1]);
  const commonRel = fsImpl.readFileSync(path.join(adminDir, 'commondir'), 'utf8').trim();
  const commonDir = path.resolve(adminDir, commonRel);
  const adminInContainer = `/gitcommon/${path.relative(commonDir, adminDir).split(path.sep).join('/')}`;

  return { commonDir, gitFile: `gitdir: ${adminInContainer}\n` };
}

/** The git mounts, read-only: the checkout's `.git` directory, or a worktree's remap. */
function gitMountArgs({ repoRoot, gitMount }) {
  if (gitMount) {
    return [
      '-v', `${toDockerPath(gitMount.commonDir)}:/gitcommon:ro`,
      '-v', `${toDockerPath(gitMount.gitFilePath)}:/code/.git:ro`,
    ];
  }
  return ['-v', `${toDockerPath(repoRoot)}/.git:/code/.git:ro`];
}

/**
 * The spawn specs for one suite on one runner. The two runners genuinely need
 * different shapes and collapsing them into one string does not survive Windows.
 *
 * The native branch goes through a shell with the whole command as one string,
 * because that is exactly what npm does with a `scripts` entry — the glob
 * expands the way CI expands it. `all` natively is two specs, run in turn.
 *
 * The container branch must NOT go through the outer shell. On Windows that
 * shell is cmd.exe, which does not understand the quoting around the inner
 * `bash -c` command and splits it mid-string. Passing argv directly hands the
 * inner command to docker as one element. `all` in the container is one start
 * running both suites, with the exit codes combined in bash.
 */
function buildCommands({
  suite, runner, repoRoot, tag, jobs, parallelAvailable = true, extra = [], treeTar = '', gitMount = null, platform,
}) {
  if (suite === 'all' && extra.length > 0) {
    throw new Error('`all` takes no arguments — run `vitest` or `bats` alone to filter');
  }

  if (runner === 'native') {
    // Native Windows is the override's path, never the default. There the
    // parallel project still times out under load (measured: 2 of 1577 at
    // 5000ms), so it keeps the serial run it always had. It also runs on a copy
    // in %TEMP%, where first reads are slower than in a checkout (measured: the
    // tree fixture's first root() 1.5s from C:\github, 7.9s from %TEMP%, same
    // bytes), so two files' first tests pass 5000ms — hence the longer timeout.
    const windowsFlags = platform === 'win32' ? ['--no-file-parallelism', '--testTimeout=30000'] : [];
    const vitestFlags = [...windowsFlags, ...extra];
    const vitest = vitestFlags.length > 0 ? `npm --prefix cli test --${vitestArgs(vitestFlags)}` : 'npm --prefix cli test';
    const bats = `npx bats ${batsArgs({ jobs, parallelAvailable, extra })}`;
    const pick = { vitest: [vitest], bats: [bats], all: [vitest, bats] }[suite];
    return pick.map((command) => ({ file: command, args: [], shell: true, display: command }));
  }

  // --no-same-owner: extracted as root, tar would otherwise keep the host's
  // uid, and git then refuses the tree as "dubious ownership".
  const unpack = `tar -x --no-same-owner -f ${CONTAINER_TREE} -C /code`;
  // Checked before vitest starts, so missing image dependencies are a refusal
  // (exit 2) with a reason rather than a wall of module-resolution errors.
  const check =
    'test -x cli/node_modules/.bin/vitest || ' +
    `{ echo "The image has no cli dependencies at ${CONTAINER_MODULES}; rebuild it." >&2; exit 2; }`;
  const vitest = `(cd cli && ./node_modules/.bin/vitest run${vitestArgs(extra)})`;
  // The container always has GNU parallel, so the host's answer does not apply.
  const bats = `./node_modules/.bin/bats ${batsArgs({ jobs, parallelAvailable: true, extra })}`;

  const run = {
    vitest: `${check}; ${vitest}`,
    bats,
    all: `${check}; ${vitest}; v=$?; ${bats}; b=$?; if [ $v -ne 0 ]; then exit $v; fi; exit $b`,
  }[suite];
  const inner = `${unpack} || exit 2; ${run}`;

  const args = [
    'run', '--rm',
    '-v', `${toDockerPath(treeTar)}:${CONTAINER_TREE}:ro`,
    ...gitMountArgs({ repoRoot, gitMount }),
    '-e', 'NODE_OPTIONS=',
    // git would refresh the index it reads; the mount is read-only and this
    // stops git trying, so the container never writes the host's repository.
    '-e', 'GIT_OPTIONAL_LOCKS=0',
    '-e', `${COPY_MARKER}=1`,
    '-w', '/code',
    tag,
    'bash', '-c', inner,
  ];
  return [{ file: 'docker', args, shell: false, display: `docker ${args.join(' ')}` }];
}

/** The tar invocation that packs the checkout, run with the repo as cwd. */
function tarArgs() {
  return ['-c', '-f', '-', ...TREE_EXCLUDES.map((e) => `--exclude=${e}`), '.'];
}

/** cpSync filter for the native copy: true keeps the entry. */
function nativeCopyFilter(repoRoot) {
  return (src) => {
    const rel = path.relative(repoRoot, src).split(path.sep).join('/');
    return !NATIVE_COPY_EXCLUDES.some((e) => rel === e || rel.startsWith(`${e}/`));
  };
}

/** Copy the checkout to `dest`. verbatimSymlinks keeps node_modules/.bin links pointing inside the copy. */
function copyCheckout(repoRoot, dest) {
  fs.cpSync(repoRoot, dest, { recursive: true, filter: nativeCopyFilter(repoRoot), verbatimSymlinks: true });
}

/** What to announce before spending a minute of someone's time. */
function announcement({ suite, runner, reason }) {
  return `tests runner: ${suite} on ${runner} — ${reason}`;
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

/** The first non-zero exit, so `all` fails when either suite failed. */
function combineExitCodes(codes) {
  return codes.find((c) => c !== 0) ?? 0;
}

/** Does the daemon answer? `docker version` asks the server; `--version` does not. */
function probeDocker() {
  const probe = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'ignore' });
  return !probe.error && probe.status === 0;
}

/** Is GNU parallel on this host? bats -j refuses to run without it. */
function probeParallel() {
  const probe = spawnSync('parallel', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return !probe.error && probe.status === 0;
}

/**
 * Build the image only when its tag is absent. Orphaned tags are left alone.
 * The context is a scratch directory holding only the three inputs: the
 * Dockerfile COPYs the two package files, and sending the repository would
 * drag node_modules across the file bridge for nothing.
 */
function ensureImage(tag, inputs) {
  const present = spawnSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' });
  if (!present.error && present.status === 0) return true;

  process.stdout.write(`Building ${tag} (first run for these inputs)\n`);
  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-tests-'));
  try {
    fs.mkdirSync(path.join(context, 'cli'));
    fs.writeFileSync(path.join(context, 'Dockerfile'), inputs.dockerfile);
    fs.writeFileSync(path.join(context, 'cli', 'package.json'), inputs.pkg);
    fs.writeFileSync(path.join(context, 'cli', 'package-lock.json'), inputs.lock);
    const built = spawnSync('docker', ['build', '-t', tag, context], { stdio: 'inherit' });
    return !built.error && built.status === 0;
  } finally {
    fs.rmSync(context, { recursive: true, force: true });
  }
}

/** Pack the checkout into `file`. tar writes to stdout, so no host path reaches it. */
function packTree(file) {
  const fd = fs.openSync(file, 'w');
  try {
    const packed = spawnSync('tar', tarArgs(), { cwd: REPO_ROOT, stdio: ['ignore', fd, 'inherit'] });
    return !packed.error && packed.status === 0;
  } finally {
    fs.closeSync(fd);
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function main() {
  const env = process.env;
  const platform = process.platform;

  let suite;
  let extra;
  let runner;
  let reason;
  try {
    ({ suite, extra } = parseArgs(process.argv.slice(2)));
    // Probe only where the answer is consulted. An explicit override decides on
    // its own, so probing under one spends a daemon round-trip for nothing.
    const needsProbe = platform === 'win32' && env.CODEADD_TESTS_RUNNER === undefined;
    ({ runner, reason } = resolveRunner({
      platform,
      env,
      dockerAvailable: needsProbe ? probeDocker() : false,
    }));
  } catch (err) {
    // Misuse, not a failing suite. Exit 1 would mean "the tests failed" under
    // this file's own exit-code contract.
    fail(err.message);
  }

  if (runner === 'unavailable') fail(DOCKER_MISSING_MESSAGE);

  process.stdout.write(`${announcement({ suite, runner, reason })}\n`);

  let tag = null;
  let scratch = null;
  let treeTar = '';
  let gitMount = null;
  let cwd = REPO_ROOT;
  // Ctrl+C ends the children with the same signal; exiting here, rather than on
  // Node's default, is what lets the 'exit' cleanup below remove the copy.
  process.on('SIGINT', () => process.exit(130));
  if (runner === 'native') {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-tests-native-'));
    const dir = scratch;
    process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
    cwd = path.join(scratch, 'tree');
    process.stdout.write(`Copying the checkout to ${cwd} — the run never writes the real tree.
`);
    try {
      copyCheckout(REPO_ROOT, cwd);
    } catch (err) {
      fail(`Could not copy the checkout: ${err.message}`);
    }
  }
  if (runner === 'docker') {
    const inputs = {
      dockerfile: fs.readFileSync(DOCKERFILE, 'utf8'),
      pkg: fs.readFileSync(CLI_PACKAGE, 'utf8'),
      lock: fs.readFileSync(CLI_LOCK, 'utf8'),
    };
    tag = imageTag(inputs);
    if (!ensureImage(tag, inputs)) fail(`Could not build ${tag}. See the output above.`);

    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-tests-run-'));
    // Removed on every exit, fail() included — a failed pack would otherwise
    // leave a ~28 MB tarball behind on each attempt.
    const dir = scratch;
    process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
    treeTar = path.join(scratch, 'tree.tar');
    if (!packTree(treeTar)) fail('Could not pack the checkout with tar. See the output above.');

    let wt;
    try {
      wt = worktreeGit(REPO_ROOT);
    } catch (err) {
      fail(`Could not map this worktree's .git into the container: ${err.message}`);
    }
    if (wt) {
      const gitFilePath = path.join(scratch, 'dotgit');
      fs.writeFileSync(gitFilePath, wt.gitFile);
      gitMount = { commonDir: wt.commonDir, gitFilePath };
    }
  }

  const needsParallel = runner === 'native' && suite !== 'vitest';
  const parallelAvailable = needsParallel ? probeParallel() : true;
  if (needsParallel && !parallelAvailable) {
    process.stdout.write('GNU parallel not found on this host — bats runs serially.\n');
  }

  let specs;
  try {
    specs = buildCommands({
      suite, runner, repoRoot: REPO_ROOT, tag, jobs: jobsFrom(env), parallelAvailable, extra, treeTar, gitMount, platform,
    });
  } catch (err) {
    fail(err.message);
  }

  // A debugger bootloader in NODE_OPTIONS prints onto stdout and breaks tests
  // that read a child's output. The container clears it with -e; this clears it
  // for the native children.
  // GIT_OPTIONAL_LOCKS=0 does for the copy what the read-only mount does for
  // the container: a worktree's copied `.git` still points at the host's admin
  // directory, and git must not refresh an index there.
  const childEnv = { ...env, NODE_OPTIONS: '', GIT_OPTIONAL_LOCKS: '0', [COPY_MARKER]: '1' };
  const codes = specs.map((spec) =>
    exitCodeFrom(spawnSync(spec.file, spec.args, { shell: spec.shell, stdio: 'inherit', cwd, env: childEnv })),
  );
  process.exit(combineExitCodes(codes));
}

module.exports = {
  IMAGE_PREFIX,
  DEFAULT_JOBS,
  SUITES,
  BATS_GLOB,
  CONTAINER_MODULES,
  CONTAINER_TREE,
  TREE_EXCLUDES,
  NATIVE_COPY_EXCLUDES,
  COPY_MARKER,
  DOCKER_MISSING_MESSAGE,
  parseArgs,
  imageTag,
  jobsFrom,
  resolveRunner,
  worktreeGit,
  buildCommands,
  nativeCopyFilter,
  copyCheckout,
  tarArgs,
  announcement,
  exitCodeFrom,
  combineExitCodes,
};

if (require.main === module) main();
