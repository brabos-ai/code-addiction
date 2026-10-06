#!/usr/bin/env node
/**
 * run-tests.js — run a test suite on the native Node runtime.
 *
 * Usage:
 *   node scripts/run-tests.js vitest [filter…]    the cli vitest suite (npm test)
 *   node scripts/run-tests.js scripts [file…]     the root native script tests (npm run test:scripts)
 *   node scripts/run-tests.js all                 both, vitest first (npm run test:all)
 *
 *   `bats` is a legacy alias for `scripts`. It runs the same node:test suite and
 *   never executes Bats, which is no longer a dependency.
 *
 * Environment:
 *   CODEADD_TESTS_RUNNER=native|docker   force a runner; the default is native
 *                                        on every platform, Windows included.
 *
 * Exit codes: the suite's own, forwarded unchanged; for `all`, the first
 * non-zero of the two. 2 when the optional Docker transport cannot build its
 * image, cannot pack the tree, finds the container's cli dependencies missing,
 * or on a usage error — each a refusal to run rather than a test result.
 *
 * Why this exists: the root scripts suite used to run under Bats, which forks a
 * process per case; on Windows that cost about 69 minutes for 386 cases, so the
 * old runner defaulted to a Linux container there and refused to run without
 * one. The suite is now Node's own built-in test runner over
 * scripts/tests/*.test.cjs, so it needs no Bats, no GNU parallel and no
 * container on any platform. Native is the default everywhere; Docker is an
 * explicit opt-in only (CODEADD_TESTS_RUNNER=docker) for reproducing a Linux
 * run, since a Windows checkout's native bindings do not load on Linux.
 *
 * Isolation: every run works on a COPY, never the checkout it started from.
 * The cli suite's globalSetup rebuilds framwork/ output and its sidecars, and a
 * run must never rewrite the developer's tree. The copy is a temp directory
 * removed on exit (native) or a tarball extracted in a throwaway container
 * (docker). Both set CODEADD_TESTS_COPY=1, the marker
 * cli/tests/helpers/global-setup.js refuses to run without outside CI. The
 * native scripts suite builds its own temp repositories, but it also reads the
 * checkout (migration acceptance, the runner's own specs) and inherits the same
 * copy so a stray write cannot reach the real sidecars.
 *
 * Three things the optional container does not take from the host, each for a
 * reason:
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
 * Architecture:
 *   parseArgs       → the suite, then the arguments that follow it
 *   canonicalSuite  → `bats` folds into `scripts`
 *   resolveRunner   → override, then native everywhere
 *   buildCommands   → the spawn specs for a suite on a runner
 *   scriptsArgs     → node --test flags, then the test paths or the default glob
 *   combineExitCodes / exitCodeFrom → never coerce a failure to 0
 *   main            → announce, isolate, run, forward
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

/** `scripts` is canonical; `bats` is the documented legacy alias for it. */
const SCRIPTS_SUITE = 'scripts';
const LEGACY_SUITE = 'bats';
const SUITES = ['vitest', SCRIPTS_SUITE, LEGACY_SUITE, 'all'];

/**
 * The files the native scripts suite runs. A glob rather than a directory:
 * Node's test runner takes a directory as a module path on this Node, and a
 * glob is what it expands into test files. Named once so both runners point at
 * the same set.
 */
const SCRIPTS_TEST_GLOB = 'scripts/tests/*.test.cjs';

/** Where the image installs the cli dependencies. The tree copy never overwrites it. */
const CONTAINER_MODULES = '/code/cli/node_modules';

/** Where the tarball of the checkout is mounted inside the container. */
const CONTAINER_TREE = '/src/tree.tar';

/**
 * What the tarball leaves out. `.git` is mounted instead; cli/node_modules
 * comes from the image; worktrees are other checkouts entirely; and no
 * node_modules is packed — the image carries vitest's Linux deps, and the
 * built-ins-only scripts suite needs none.
 */
const TREE_EXCLUDES = ['./.git', './.worktrees', './.claude/worktrees', './node_modules', './cli/node_modules', './web/node_modules', './board/node_modules', './board/dist'];

/**
 * What the native copy leaves out. Unlike the container it KEEPS `.git` and
 * cli/node_modules: the host's own git data, and the host's native bindings.
 */
const NATIVE_COPY_EXCLUDES = ['.worktrees', '.claude/worktrees', 'web/node_modules', 'board/node_modules', 'board/dist'];

/** Set on every run that works on a copy. Its twin lives in cli/tests/helpers/global-setup.js. */
const COPY_MARKER = 'CODEADD_TESTS_COPY';

const USAGE = 'usage: node scripts/run-tests.js <vitest|scripts|bats|all> [args…]';

/** `bats` is the legacy spelling of the scripts suite; everything else is itself. */
function canonicalSuite(suite) {
  return suite === LEGACY_SUITE ? SCRIPTS_SUITE : suite;
}

/** The suite, then whatever follows it. Throws on a missing or unknown suite. */
function parseArgs(argv) {
  const [suite, ...extra] = argv;
  if (!SUITES.includes(suite)) throw new Error(USAGE);
  return { suite: canonicalSuite(suite), extra };
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

/**
 * Override first, then native. Native is the default on every platform,
 * Windows included, so no daemon probe decides a normal run. The optional
 * `docker` transport is reachable only by asking for it.
 */
function resolveRunner({ platform, env }) {
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
  return {
    runner: 'native',
    reason: platform === 'win32'
      ? 'Windows runs the suites natively; Docker is not required'
      : `${platform} runs the suites natively`,
  };
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

/** The vitest filter fragment, or empty. Kept byte-for-byte with CI's command. */
function vitestArgs(extra) {
  return extra.length > 0 ? ` ${extra.join(' ')}` : '';
}

/**
 * The native scripts suite's arguments. Node's test runner wants its own flags
 * BEFORE positional paths, so `--test-name-pattern=…` is forwarded ahead of the
 * selection and any file argument replaces the default glob. With no argument,
 * every scripts/tests/*.test.cjs runs.
 */
function scriptsArgs(extra) {
  const flags = extra.filter((a) => a.startsWith('-'));
  const paths = extra.filter((a) => !a.startsWith('-'));
  const target = paths.length > 0 ? paths.join(' ') : SCRIPTS_TEST_GLOB;
  return [flags.join(' '), target].filter(Boolean).join(' ');
}

/**
 * The spawn specs for one suite on one runner. The native branch goes through a
 * shell with the whole command as one string, because that is exactly what npm
 * does with a `scripts` entry. `all` natively is two specs, run in turn.
 *
 * The container branch must NOT go through the outer shell. On Windows that
 * shell is cmd.exe, which does not understand the quoting around the inner
 * `bash -c` command and splits it mid-string. Passing argv directly hands the
 * inner command to docker as one element. `all` in the container is one start
 * running both suites, with the exit codes combined in bash.
 */
function buildCommands({ suite, runner, repoRoot, tag, extra = [], treeTar = '', gitMount = null, platform }) {
  const canonical = canonicalSuite(suite);

  if (canonical === 'all' && extra.length > 0) {
    throw new Error('`all` takes no arguments — run `vitest` or `scripts` alone to filter');
  }

  if (runner === 'native') {
    // Native Windows keeps the serial vitest run it always had: the parallel
    // project still times out under load there, and the copy's first reads are
    // slower than a checkout's, so the timeout is longer too.
    const windowsFlags = platform === 'win32' ? ['--no-file-parallelism', '--testTimeout=30000'] : [];
    const vitestFlags = [...windowsFlags, ...extra];
    const vitest = vitestFlags.length > 0 ? `npm --prefix cli test --${vitestArgs(vitestFlags)}` : 'npm --prefix cli test';
    const scripts = `node --test ${scriptsArgs(extra)}`;
    const pick = { vitest: [vitest], scripts: [scripts], all: [vitest, scripts] }[canonical];
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
  // The scripts suite is built-ins only, so the container's own node runs it
  // directly; no Bats, no GNU parallel, no extra packages.
  const scripts = `node --test ${scriptsArgs(extra)}`;

  const run = {
    vitest: `${check}; ${vitest}`,
    scripts,
    all: `${check}; ${vitest}; v=$?; ${scripts}; s=$?; if [ $v -ne 0 ]; then exit $v; fi; exit $s`,
  }[canonical];
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
    ({ runner, reason } = resolveRunner({ platform, env }));
  } catch (err) {
    // Misuse, not a failing suite. Exit 1 would mean "the tests failed" under
    // this file's own exit-code contract.
    fail(err.message);
  }

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
    process.stdout.write(`Copying the checkout to ${cwd} — the run never writes the real tree.\n`);
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
    // leave a large tarball behind on each attempt.
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

  let specs;
  try {
    specs = buildCommands({
      suite, runner, repoRoot: REPO_ROOT, tag, extra, treeTar, gitMount, platform,
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
  SCRIPTS_SUITE,
  LEGACY_SUITE,
  SUITES,
  SCRIPTS_TEST_GLOB,
  CONTAINER_MODULES,
  CONTAINER_TREE,
  TREE_EXCLUDES,
  NATIVE_COPY_EXCLUDES,
  COPY_MARKER,
  parseArgs,
  canonicalSuite,
  imageTag,
  resolveRunner,
  worktreeGit,
  buildCommands,
  scriptsArgs,
  nativeCopyFilter,
  copyCheckout,
  tarArgs,
  announcement,
  exitCodeFrom,
  combineExitCodes,
};

if (require.main === module) main();
