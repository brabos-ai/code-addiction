'use strict';
// ============================================
// TASK-BRIEF (native)
// Extract ONE `## Execution` task's full block from a tasks.md into its own
// file, so a dispatched agent is handed a PATH instead of pasted content.
// ============================================
// Usage: node .codeadd/scripts/task-brief.cjs <TASKS_FILE> <TASK_ID> <OUT_DIR> [KNOWN_FAILURES]
// Dependencies: node:fs, node:path (built-ins only). No shell.
// Output: KEY=VALUE lines — BRIEF=<path>, TASK=<id>, SUBBULLETS=<n>.
//
// KNOWN_FAILURES is OPTIONAL and its ABSENCE is not the same as its emptiness.
// The brief always carries a `## KNOWN_FAILURES` section, reading one of three
// things, and a dispatched agent acts differently on each:
//   3 args         -> `not supplied`  — the caller does not pass the field
//   4th arg empty  -> `none observed` — the caller looked and saw no failure
//   4th arg filled -> the failures, one per line, `<test>: <area>`
// The shipped callers always pass the argument, so in practice they render the
// last two. `not supplied` exists for a caller that has not been updated — it is
// what keeps an old 3-arg invocation honest instead of silently claiming a clean
// baseline it never checked.
// It exists so a test agent can tell a failure it caused from one that was
// already red WITHOUT reaching for git to clear the tree. The tree is shared:
// sibling agents are running against it, and a `git stash` there takes their
// uncommitted work with it. The field is what makes that unnecessary.
// NOTHING here runs a baseline test suite to populate it — the caller passes
// only failures it has ALREADY observed.
// Exit:   0 on success. 2 ONLY on CLI misuse, which includes a TASK_ID that is
//         not an Execution task: an empty brief is how an agent gets dispatched
//         against nothing and reports success. 1 only on a refused write.
//
// WHAT A BLOCK IS (the add--tasks-checklist skill owns this shape):
//   - [ ] T02 Implement signup endpoint
//     - Service: backend
//     - Files: `src/api/users.ts`, `src/services/users.ts`
//     - Deps: T01
//     - Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)
//     - Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`
//     - Verify: `npm test -- users`
// All six sub-bullets travel or the brief is worthless: an agent implementing
// T02 never sees T01's code, so `Consumes` / `Produces` are the only thing
// making both tasks build against the same name.
//
// SCOPED TO `## Execution`, DELIBERATELY. `## TDD` carries `T-TEST-01`, whose id
// starts with the same letter and would match a loose scan; `## Acceptance
// Checklist` follows the last task and would be swallowed by an extractor that
// only stops at the next task line. Both are real defects this scan avoids by
// tracking the section, not just the bullet.
//
// SUBBULLETS is reported, never enforced. /add-plan STEP 11 is the gate that
// refuses a task with a missing `Consumes`; this script's job is to say what it
// found so the caller can see a thin task rather than be handed a padded one.
// ============================================

const fs = require('node:fs');

const TASK_ID_RE = /^T[0-9][0-9]*$/;
const ANY_TASK_RE = /^[ \t]*[-*][ \t]+\[.\][ \t]+/;
const SUB_BULLET_RE = /^[ \t]+[-*][ \t]+(Service|Files|Deps|Consumes|Produces|Verify)[ \t]*:/;
const SECTION_RE = /^##[ \t]+[Ee]xecution[ \t]*$/m;

const USAGE = `Usage: task-brief.cjs <TASKS_FILE> <TASK_ID> <OUT_DIR> [KNOWN_FAILURES]
  TASKS_FILE  the feature's or subfeature's tasks.md
  TASK_ID     an ## Execution task id, TNN (T-TEST-nn is not one)
  OUT_DIR     scratch dir, typically <FEATURE_DIR>/_build — created, and self-ignored
  KNOWN_FAILURES  optional; tests already red, one per line, <test>: <area>.
                  Omit it and the brief reads 'not supplied'; pass an empty
                  string and it reads 'none observed'. They are not the same.
`;

function usage() {
  process.stderr.write(USAGE);
  return 2;
}

function fail(msg) {
  process.stderr.write(`ERROR=${msg}\n`);
  return 1;
}

/** Misuse: loud ERROR, but still the CLI's exit 2. */
function misuse(msg) {
  process.stderr.write(`ERROR=${msg}\n`);
  return 2;
}

/**
 * The scan. Section state (`inexec`) and block state (`intask`) are separate:
 * any other H2 closes both, a new task line closes the previous block, and a
 * line that is not an indented bullet ends the block without consuming it.
 * Trailing CR is stripped — tasks.md is authored on Windows too, and a trailing
 * CR makes every anchored match miss.
 *
 * @param {string} text - the tasks.md contents
 * @param {string} taskId - the required Execution task id (TNN only)
 * @returns {string[]} the task's block lines, CR-free, without the task bullet's
 *   neighbours; empty when the id is absent from the section.
 */
function extractBlock(text, taskId) {
  const taskre = new RegExp(`^[ \\t]*[-*][ \\t]+\\[.\\][ \\t]+${taskId}([ \\t]|$)`);
  let inexec = false;
  let intask = false;
  const block = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (/^##\s/.test(line)) {
      const hdr = line.toLowerCase().replace(/\s+$/, '');
      inexec = /^##\s+execution$/.test(hdr);
      intask = false;
      continue;
    }
    if (inexec && ANY_TASK_RE.test(line)) {
      intask = taskre.test(line);
      if (intask) block.push(line);
      continue;
    }
    if (intask) {
      if (/^[ \t]+[-*][ \t]+/.test(line)) {
        block.push(line);
        continue;
      }
      intask = false;
    }
  }
  return block;
}

/** Count the recognised sub-bullets in a block. Reported, never enforced. */
function countSubBullets(block) {
  let n = 0;
  for (const line of block) {
    if (SUB_BULLET_RE.test(line)) n += 1;
  }
  return n;
}

/**
 * Run the entry. Returns the process exit code; output goes to stdout/stderr.
 * @param {string[]} argv - arguments after the executable
 * @returns {number}
 */
function main(argv) {
  if (argv.length !== 3 && argv.length !== 4) return usage();

  const tasksFile = argv[0];
  const taskId = argv[1];
  const outDir = argv[2];

  // The argument COUNT separates states that an empty string would otherwise
  // collapse: "the coordinator looked and saw nothing" is a usable baseline,
  // "the coordinator never passed the field" is not.
  const knownFailures = argv.length === 4
    ? (argv[3] !== '' ? argv[3] : 'none observed')
    : 'not supplied';

  if (tasksFile === '' || taskId === '' || outDir === '') return usage();

  let stat;
  try {
    stat = fs.statSync(tasksFile);
  } catch {
    return usage();
  }
  if (!stat.isFile()) return usage();

  // TNN only. `T-TEST-01` is a TDD id, not an Execution task, and accepting it
  // would hand a reviewer a brief for a test line with no Files and no Verify.
  if (!TASK_ID_RE.test(taskId)) return usage();

  let text;
  try {
    text = fs.readFileSync(tasksFile, 'utf8');
  } catch {
    return usage();
  }

  // A tasks.md with no ## Execution section cannot answer this call at all. That
  // is a broken input, not an empty result, and must not read as "task absent".
  if (!SECTION_RE.test(text)) {
    return misuse(`No ## Execution section in ${tasksFile}`);
  }

  const block = extractBlock(text, taskId);

  // Not found is misuse, on purpose. Returning 0 with an empty brief is exactly
  // how a dispatch happens against nothing.
  if (block.length === 0) {
    return misuse(`No ${taskId} in the ## Execution section of ${tasksFile}`);
  }

  const subBullets = countSubBullets(block);

  try {
    fs.mkdirSync(outDir, { recursive: true });
  } catch {
    return fail(`Cannot create directory ${outDir}`);
  }

  // F4's scratch contract: the directory ignores itself, so briefs, reports and
  // diff packages never reach a commit and the installer needs no change to make
  // that true. Written only when absent — a project that edited it owns it.
  const gitignore = `${outDir}/.gitignore`;
  if (!fs.existsSync(gitignore)) {
    try {
      fs.writeFileSync(gitignore, '*\n');
    } catch {
      return fail(`Cannot write ${gitignore}`);
    }
  }

  const briefPath = `${outDir}/${taskId}-brief.md`;
  const lines = [
    `# Task brief — ${taskId}`,
    '',
    `> Source: ${tasksFile}`,
    '',
    ...block,
    '',
    '## KNOWN_FAILURES',
    '',
    knownFailures,
  ];
  try {
    fs.writeFileSync(briefPath, `${lines.join('\n')}\n`);
  } catch {
    return fail(`Cannot write ${briefPath}`);
  }

  process.stdout.write(`BRIEF=${briefPath}\n`);
  process.stdout.write(`TASK=${taskId}\n`);
  process.stdout.write(`SUBBULLETS=${subBullets || 0}\n`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { extractBlock, countSubBullets, main, USAGE };
