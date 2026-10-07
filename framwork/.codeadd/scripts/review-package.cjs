'use strict';
// ============================================
// REVIEW-PACKAGE (native)
// Write the scoped diff for BASE..HEAD into ONE file, so a reviewer is
// dispatched against a PATH instead of a pasted diff.
// ============================================
// Usage: node .codeadd/scripts/review-package.cjs <BASE> <HEAD> <OUT_DIR>
// Dependencies: node:fs, node:child_process (git). Built-ins only. No shell.
// Output: KEY=VALUE lines — PACKAGE=<path>, COMMITS=<n>, FILES=<n>.
// Exit:   0 on success. 2 ONLY on CLI misuse — wrong arity, an unresolvable
//         ref, no git repository, or AN EMPTY RANGE. 1 only on a refused write.
//
// THE EMPTY RANGE IS REFUSED, AND THAT IS THE POINT. An empty package is how a
// reviewer gets dispatched against nothing and comes back "looks fine" — a
// clean verdict on work nobody looked at, which is worse than no review. The
// refusal happens BEFORE anything is written, so a failed call leaves no file a
// later step could pick up and hand to an agent anyway.
//
// "Empty" means no commits AND no textual diff. A range whose only commit is
// empty still packages: `git log` is content, and the reviewer should see that
// a task produced a marker commit and nothing else.
//
// BASE..HEAD exists at all only because /add-build now commits per task. The
// coordinator records BASE before dispatching and HEAD after the agent's
// commits land; both go in the ledger line, and this script turns that bracket
// into something a reviewer can read.
// ============================================

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const USAGE = `Usage: review-package.cjs <BASE> <HEAD> <OUT_DIR>
  BASE     any git ref — recorded before the dispatch
  HEAD     any git ref — recorded after the agent's commits landed
  OUT_DIR  scratch dir, typically <FEATURE_DIR>/_build — created, and self-ignored
`;

function usage() {
  process.stderr.write(USAGE);
  return 2;
}

function fail(msg) {
  process.stderr.write(`ERROR=${msg}\n`);
  return 1;
}

function refuse(msg) {
  process.stderr.write(`ERROR=${msg}\n`);
  return 2;
}

/** Run git, argv array, shell:false. Never a shell bridge. */
function git(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && args[0] !== 'rev-parse') {
    throw new Error(result.stderr || `git ${args[0]} failed (${result.status})`);
  }
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/** Command-substitution semantics: trim trailing newlines. */
function stripTrailingNewlines(s) {
  return String(s).replace(/\n+$/, '');
}

/**
 * Run the entry. Returns the process exit code; output goes to stdout/stderr.
 * @param {string[]} argv - arguments after the executable
 * @returns {number}
 */
function buildPackage(argv) {
  if (argv.length !== 3) return usage();

  const base = argv[0];
  const headRef = argv[1];
  const outDir = argv[2];

  if (base === '' || headRef === '' || outDir === '') return usage();

  if (git(['rev-parse', '--git-dir']).status !== 0) {
    return refuse(`Not a git repository: ${process.cwd()}`);
  }

  // Resolve both ends to commits first. `--verify --quiet` prints nothing and
  // returns non-zero on a ref that does not exist, so an emptiness check on the
  // result is the whole validation.
  const baseSha = stripTrailingNewlines(git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`]).stdout);
  if (baseSha === '') return refuse(`BASE does not resolve to a commit: ${base}`);
  const headSha = stripTrailingNewlines(git(['rev-parse', '--verify', '--quiet', `${headRef}^{commit}`]).stdout);
  if (headSha === '') return refuse(`HEAD does not resolve to a commit: ${headRef}`);

  let commits = Number.parseInt(stripTrailingNewlines(git(['rev-list', '--count', `${baseSha}..${headSha}`]).stdout), 10);
  if (!Number.isFinite(commits)) commits = 0;
  const diff = stripTrailingNewlines(git(['diff', '-U10', baseSha, headSha]).stdout);

  if (commits === 0 && diff === '') {
    return refuse(`Empty range ${base}..${headRef} — there is nothing to review`);
  }

  const filesChanged = git(['diff', '--name-only', baseSha, headSha]).stdout
    .split('\n')
    .filter((l) => l !== '').length;

  const baseShort = stripTrailingNewlines(git(['rev-parse', '--short', baseSha]).stdout);
  const headShort = stripTrailingNewlines(git(['rev-parse', '--short', headSha]).stdout);

  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch {
    return fail(`Cannot create directory ${outDir}`);
  }

  // F4's scratch contract — see task-brief.cjs. Written only when absent.
  const gitignore = `${outDir}/.gitignore`;
  if (!fs.existsSync(gitignore)) {
    try {
      fs.writeFileSync(gitignore, '*\n');
    } catch {
      return fail(`Cannot write ${gitignore}`);
    }
  }

  const packagePath = `${outDir}/review-package-${baseShort}-${headShort}.md`;

  // No fenced code blocks. A diff of a markdown file carries its own fences, and
  // any fence chosen here can be closed early by the content it is meant to hold.
  // Raw sections are unbreakable instead: no line git emits — log hashes, stat
  // lines (leading space), `diff --git`, `@@` hunks, `+`/`-`/context — can ever
  // start with `## `, so the section headings stay unambiguous.
  const log = git(['log', '--oneline', `${baseSha}..${headSha}`]).stdout;
  const stat = git(['diff', '--stat', baseSha, headSha]).stdout;
  const content = [
    `# Review package — ${baseShort}..${headShort}`,
    '',
    `> Range: \`${base}..${headRef}\` (${baseSha}..${headSha})`,
    `> Commits: ${commits} — Files changed: ${filesChanged}`,
    '',
    '## Commits (git log --oneline)',
    '',
    log,
    '## Files changed (git diff --stat)',
    '',
    stat,
    '## Diff (git diff -U10)',
    '',
    diff,
    '',
  ].join('\n');

  try {
    fs.writeFileSync(packagePath, content);
  } catch {
    return fail(`Cannot write ${packagePath}`);
  }

  process.stdout.write(`PACKAGE=${packagePath}\n`);
  process.stdout.write(`COMMITS=${commits}\n`);
  process.stdout.write(`FILES=${filesChanged || 0}\n`);
  return 0;
}

function main(argv) {
  try { return buildPackage(argv); }
  catch (error) { return fail(`Cannot build complete review package: ${error.message}`); }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { main, USAGE };
