'use strict';
// =============================================================================
// NATIVE TEST HARNESS (native-test-harness-v1, F1)
// =============================================================================
// Built-ins-only helpers shared by every scripts/tests/*.test.cjs suite. It
// exists so a native script test does ONE thing: arrange a fixture, run the
// Node entry with an explicit argv array and cwd, and assert on the recorded
// observation.
//
// WHY A HARNESS AT ALL: the Bats suites each re-derived a temp git repo and a
// `run bash <script>` call. Porting 546 cases is unreasonable if every port
// re-invents that. One helper means one place to fix Windows path handling,
// one place that clears the injected NODE_OPTIONS debugger, and one place that
// can prove it works without Bash.
//
// ⛔ BUILT-INS ONLY. This module is loaded by shipped-adjacent tests and by the
//    root runner; it must never grow a dependency, and it must never spawn a
//    shell. Every process goes through process.execPath with an argv array.
//
// ⛔ IT DOES NOT EXECUTE BASH. `runBash` is deliberately absent: a test that
//    needs a shell to prove a native route is a test proving the wrong thing.
//    F27's negative control asserts this module cannot be talked into it.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'framwork', '.codeadd', 'scripts');
const ROOT_SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts');
const CASE_MAP_PATH = path.join(__dirname, 'native-script-cases.json');

/** Every child of the harness runs with a deterministic environment. */
function cleanEnv(overrides = {}) {
  return {
    ...process.env,
    // The VS Code JavaScript debugger injects a bootloader here; it prints
    // "Debugger listening…" onto stdout and breaks any test that reads it.
    NODE_OPTIONS: '',
    // git must not try to refresh an index in a temp/copied repository.
    GIT_OPTIONAL_LOCKS: '0',
    ...overrides,
  };
}

/** A fresh temp directory. Caller removes it with rmrf(). */
function mkTmp(prefix = 'codeadd-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Remove a tree, ignoring absence. Never touches anything outside `dir`. */
function rmrf(dir) {
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
}

/**
 * Run a Node entry with an explicit argv and cwd. NEVER shell:true — the whole
 * point of the migration is that a Node process is reached without a shell.
 * Returns a frozen observation: { status, stdout, stderr, output, signal }.
 */
function runNode(args, { cwd = REPO_ROOT, env = {}, input, timeout } = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: cleanEnv(env),
    input,
    shell: false,
    encoding: 'utf8',
    timeout,
  });
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  return Object.freeze({
    status: result.status,
    signal: result.signal ?? null,
    stdout,
    stderr,
    output: stdout + stderr,
    error: result.error ?? null,
  });
}

/** Run a shipped entry: framwork/.codeadd/scripts/<name>.cjs */
function runScript(name, args = [], opts = {}) {
  return runNode([path.join(SCRIPTS_DIR, `${name}.cjs`), ...args], opts);
}

/** Run a root entry: scripts/<name>.cjs */
function runRootScript(name, args = [], opts = {}) {
  return runNode([path.join(ROOT_SCRIPTS_DIR, `${name}.cjs`), ...args], opts);
}

/** Run an arbitrary repo-relative Node file. */
function runFile(relPath, args = [], opts = {}) {
  return runNode([path.join(REPO_ROOT, relPath), ...args], opts);
}

/** Run git, argv array, explicit cwd. */
function git(cwd, args, opts = {}) {
  const result = spawnSync('git', args, {
    cwd,
    env: cleanEnv(opts.env),
    shell: false,
    encoding: 'utf8',
  });
  return Object.freeze({
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    output: (result.stdout ?? '') + (result.stderr ?? ''),
  });
}

/**
 * A throwaway git repository on `main` with one empty commit — the fixture on
 * which every git-aware script test runs. Returns `{ dir, repo, git, cleanup }`
 * where `repo.git(...)` is bound to the repo root.
 */
function makeRepo({ branch = 'main', prefix = 'codeadd-repo-' } = {}) {
  const base = mkTmp(prefix);
  const repo = path.join(base, 'repo');
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ['init', `--initial-branch=${branch}`, '-q']);
  git(repo, ['config', 'user.email', 'test@test.com']);
  git(repo, ['config', 'user.name', 'Test']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  git(repo, ['commit', '--allow-empty', '-m', 'init', '-q']);
  return {
    base,
    repo,
    git: (...args) => git(repo, args),
    cleanup: () => rmrf(base),
  };
}

/** Write a file, creating parents. */
function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

/** Read a file as utf8. */
function read(p) {
  return fs.readFileSync(p, 'utf8');
}

/** Read a JSONL file into an array of parsed objects, skipping blank lines. */
function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return read(p)
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (err) {
        throw new Error(`${p}:${i + 1} is not JSON: ${err.message}`);
      }
    });
}

/**
 * Parse the KEY=VALUE contract a script prints. Lines starting with `{` are
 * JSONL entries, not keys, and are ignored; the last occurrence of a key wins,
 * matching how the shipped consumers read the stream.
 */
function parseKV(stdout) {
  const out = {};
  for (const raw of String(stdout).split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line === '' || line.startsWith('{')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    out[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return out;
}

/** Strip ANSI colour codes so output assertions do not depend on a TTY. */
function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return String(s).replace(/\u001b\[[0-9;]*m/g, '');
}

// --- The tracked case map ---------------------------------------------------

let _caseMap = null;

/** Load scripts/tests/native-script-cases.json (cached). */
function loadCaseMap() {
  if (_caseMap === null) {
    _caseMap = JSON.parse(fs.readFileSync(CASE_MAP_PATH, 'utf8'));
  }
  return _caseMap;
}

/** The map entry for one script name, or undefined. */
function scriptEntry(name) {
  return loadCaseMap().scripts.find((s) => s.name === name);
}

/** Every case id in the map, across every script. */
function allCaseIds() {
  return loadCaseMap().scripts.flatMap((s) => s.cases.map((c) => c.id));
}

/** Scripts that still have no dedicated suite and therefore need characterization. */
function missingSuiteNames() {
  return loadCaseMap().scripts.filter((s) => !s.hasDedicatedSuite).map((s) => s.name);
}

module.exports = {
  REPO_ROOT,
  SCRIPTS_DIR,
  ROOT_SCRIPTS_DIR,
  CASE_MAP_PATH,
  cleanEnv,
  mkTmp,
  rmrf,
  runNode,
  runScript,
  runRootScript,
  runFile,
  git,
  makeRepo,
  write,
  read,
  readJsonl,
  parseKV,
  stripAnsi,
  loadCaseMap,
  scriptEntry,
  allCaseIds,
  missingSuiteNames,
};
