#!/usr/bin/env node
'use strict';
/**
 * no-bash-guard.js — shadow `bash` at the framework/test subprocess boundary,
 * and prove that a Bash attempt is rejected.
 *
 * Usage:
 *   node scripts/no-bash-guard.js                     install the rejector and
 *                                                     print its directory
 *   node scripts/no-bash-guard.js --probe             NEGATIVE CONTROL: attempt
 *                                                     Bash; exit 0 only when it
 *                                                     was rejected
 *   node scripts/no-bash-guard.js --run <cmd…>        run <cmd> with the rejector
 *                                                     first on the child PATH
 *   node scripts/no-bash-guard.js --dir <path>        use <path> for the shim
 *
 * Exit codes: the child's own for `--run`; 0 rejected / installed; 1 the
 * negative control saw Bash RUN; 2 a usage error.
 *
 * WHY THIS EXISTS. The hosted runners all ship Bash, so a suite that quietly
 * fell back to it would still pass — the fallback the native migration removed
 * would be invisible. This installs a `bash` earlier on the child PATH that
 * prints one line and exits 127. A framework or test that reaches for Bash by
 * name then fails loudly, and `--probe` is the assertion that the shadow works.
 *
 * WHY `--run` AND NOT GITHUB_PATH. Prepending the shim to the JOB PATH would
 * also shadow `bash` for the runner's own `run:` step shell, which on Linux and
 * macOS is `bash` — every later step would fail. `--run` prefixes PATH for the
 * child only, so the step shell is already running and untouched while `npm
 * test` and everything it spawns sees the rejector.
 *
 * WHY GIT AND NPM STILL WORK. Only `bash` is shadowed, never `sh` and never any
 * other binary:
 *
 *   • npm runs a script through `sh` on POSIX and `cmd.exe` on Windows. Neither
 *     resolves `bash`, so installs, `npm test` and `npm run test:scripts` are
 *     untouched.
 *   • git executes its internal helpers with `sh`; a hook with an absolute
 *     shebang such as `#!/bin/sh` is resolved by the kernel/OS, not PATH.
 *   • The native test harness spawns `process.execPath` and `git` with
 *     `shell: false` and an explicit argv, so it never consults `bash` at all.
 *
 * The PATH shadow covers shell-based name resolution. A Node preload also
 * rejects Bash at child_process boundaries, including shell:false on Windows
 * and absolute Bash executable paths. The preload propagates across children
 * that clear debugger NODE_OPTIONS. Git and npm remain available.
 *
 * WHERE IT LIVES. Installed as CI steps in `.github/workflows/ci.yml` before
 * `npm test` and `npm run test:scripts`, for all six platform × Node jobs. The
 * same script runs locally: `node scripts/no-bash-guard.js --probe` then
 * `node scripts/no-bash-guard.js --run npm run test:scripts`.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REJECT_MESSAGE = 'Bash is rejected in this framework/test boundary; use Node.';
const EXIT_REFUSED = 127;
const DEFAULT_DIR = path.join(os.tmpdir(), 'codeadd-no-bash');

/** Create the rejector for this platform. Returns the shim directory. */
function installShim(dir) {
  fs.mkdirSync(dir, { recursive: true });
  if (process.platform === 'win32') {
    // `cmd.exe` resolves `bash` to `bash.cmd` in a PATH directory ahead of Git
    // for Windows' `bash.exe`, so a shell-based Bash attempt is rejected.
    fs.writeFileSync(
      path.join(dir, 'bash.cmd'),
      `@echo off\r\necho ${REJECT_MESSAGE} 1>&2\r\nexit /b ${EXIT_REFUSED}\r\n`,
    );
  } else {
    // A real executable earlier on PATH: POSIX name resolution finds it before
    // the system bash.
    const shim = path.join(dir, 'bash');
    fs.writeFileSync(shim, `#!/bin/sh\necho "${REJECT_MESSAGE}" >&2\nexit ${EXIT_REFUSED}\n`);
    fs.chmodSync(shim, 0o755);
  }
  return dir;
}

/** The environment a child runs with: the shim first on PATH. */
function guardedEnv(dir) {
  return {
    ...process.env,
    PATH: `${dir}${path.delimiter}${process.env.PATH ?? ''}`,
    CODEADD_NO_BASH_PRELOAD: path.join(__dirname, 'no-bash-preload.cjs'),
    NODE_OPTIONS: `--require=${JSON.stringify(path.join(__dirname, 'no-bash-preload.cjs'))}`,
  };
}

/**
 * The negative control. Runs `bash --version` through the platform shell (so
 * `cmd.exe`/`sh` resolve the name on PATH, exactly as a suite would) and reports
 * success only when the rejector's exit and diagnostic were both observed.
 */
function probe({ dir = DEFAULT_DIR } = {}) {
  installShim(dir);
  const result = spawnSync('bash --version', { shell: true, encoding: 'utf8', env: guardedEnv(dir) });
  const rejected = wasRejected(result);
  const direct = spawnSync(process.execPath, ['-e', `try { require('node:child_process').spawnSync('bash', ['--version'], { shell: false }); process.exit(1); } catch (e) { if (e.code !== 'CODEADD_BASH_REFUSED') throw e; console.error(e.message); process.exit(127); }`], {
    encoding: 'utf8', env: guardedEnv(dir),
  });
  if (rejected && wasRejected(direct)) {
    process.stdout.write(`NEGATIVE CONTROL: bash rejected (status ${result.status ?? 'spawn error'}).\n`);
    return true;
  }
  process.stderr.write(`NEGATIVE CONTROL FAILED: rejector not observed (status ${result.status ?? 'spawn error'}).\n`);
  return false;
}

function wasRejected(result) {
  return !result.error && result.status === EXIT_REFUSED && String(result.stderr ?? '').includes(REJECT_MESSAGE);
}

/** Run one command, as a shell command string, with the shim on its PATH. */
function runGuarded(command, { dir = DEFAULT_DIR } = {}) {
  installShim(dir);
  const result = spawnSync(command, { shell: true, stdio: 'inherit', env: guardedEnv(dir) });
  if (result.error) {
    process.stderr.write(`no-bash-guard: could not run \`${command}\`: ${result.error.message}\n`);
    return 1;
  }
  return typeof result.status === 'number' ? result.status : 1;
}

const USAGE = 'usage: node scripts/no-bash-guard.js [--probe | --run <cmd…> | --dir <path>]';

function parse(argv) {
  const opts = { probe: false, run: null, dir: DEFAULT_DIR, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--probe') opts.probe = true;
    else if (arg === '--run') {
      const rest = argv.slice(i + 1);
      if (rest.length === 0) throw new Error('--run needs a command');
      opts.run = rest.join(' ');
      break;
    } else if (arg === '--dir') {
      const value = argv[i + 1];
      if (!value) throw new Error('--dir needs a path');
      opts.dir = path.resolve(value);
      i += 1;
    } else if (arg === '-h' || arg === '--help') opts.help = true;
    else throw new Error(`unknown flag ${arg}`);
  }
  return opts;
}

function main(argv) {
  let opts;
  try {
    opts = parse(argv);
  } catch (err) {
    process.stderr.write(`${err.message}\n${USAGE}\n`);
    process.exit(2);
  }
  if (opts.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (opts.probe) {
    process.exit(probe({ dir: opts.dir }) ? 0 : 1);
  }
  if (opts.run) {
    process.exit(runGuarded(opts.run, { dir: opts.dir }));
  }
  const dir = installShim(opts.dir);
  process.stdout.write(`Bash rejector installed at ${dir}\n`);
}

module.exports = {
  REJECT_MESSAGE,
  EXIT_REFUSED,
  DEFAULT_DIR,
  installShim,
  guardedEnv,
  probe,
  wasRejected,
  runGuarded,
  parse,
};

if (require.main === module) main(process.argv.slice(2));
