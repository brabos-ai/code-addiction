'use strict';
// =============================================================================
// NATIVE PORT — task-brief (F27, target F11's framwork/.codeadd/scripts/task-brief.cjs)
// =============================================================================
// Ported from framwork/.codeadd/scripts/tests/task-brief.bats (23 cases). The
// native entry takes the same positional arguments and preserves BRIEF=/TASK=/
// SUBBULLETS=, the scratch `.gitignore` contract, exit 2 for misuse and the
// three-state KNOWN_FAILURES section.
//
// ⛔ RED IS EXPECTED: task-brief.cjs does not exist yet. Each assertion states
//    the intended contract.
//
// Run: node --test scripts/tests/task-brief.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const TASKS = 'docs/features/0003F-signup/tasks.md';
const OUT = 'docs/features/0003F-signup/_build';

const TASKS_CONTENT = `# Tasks: Signup

## Metadata

| Field | Value |
|-------|-------|
| Complexity | STANDARD |

## Requirements Coverage

- [ ] RF01 — user signs up

## TDD

- [ ] T-TEST-01 Contract test for RF01 — \`test/users.spec.ts\`
- [ ] T-TEST-02 Contract test for RN01 — \`test/rules.spec.ts\`

## Execution

- [ ] T01 Create users table migration
  - Service: database
  - Files: \`db/migrations/001_users.ts\`
  - Deps: -
  - Consumes: -
  - Produces: \`UserRepository.insert(row: NewUser): Promise<User>\`
  - Verify: \`npm run migrate\`
- [ ] T02 Implement signup endpoint
  - Service: backend
  - Files: \`src/api/users.ts\`, \`src/services/users.ts\`
  - Deps: T01
  - Consumes: \`UserRepository.insert(row: NewUser): Promise<User>\` (T01)
  - Produces: \`UsersService.create(dto: CreateUserDto): Promise<UserDto>\`
  - Verify: \`npm test -- users\`

## Acceptance Checklist

- [ ] Route \`POST /users\` returns 201 on valid signup (RF01)
- [ ] Service \`UsersService.create\` enforces unique email (RN01)

## Validation Gates

- [ ] Run \`npm run lint\` and fix failures in files touched by this work
`;

const abs = (repo, rel) => path.join(repo, rel);
const writeTasks = (repo) => h.write(abs(repo, TASKS), TASKS_CONTENT);
const briefText = (repo, res) => h.read(abs(repo, h.parseKV(res.stdout).BRIEF));

test('task-brief#001 L2.2: a task with six sub-bullets writes all six', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T02', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const kv = h.parseKV(res.stdout);
    assert.ok(kv.BRIEF, 'BRIEF=<path> is emitted');
    const brief = h.read(abs(repo, kv.BRIEF));
    assert.ok(brief.includes('T02 Implement signup endpoint'));
    assert.ok(brief.includes('Service: backend'));
    assert.ok(brief.includes('Files: `src/api/users.ts`, `src/services/users.ts`'));
    assert.ok(brief.includes('Deps: T01'));
    assert.ok(brief.includes('Consumes: `UserRepository.insert(row: NewUser): Promise<User>` (T01)'));
    assert.ok(brief.includes('Produces: `UsersService.create(dto: CreateUserDto): Promise<UserDto>`'));
    assert.ok(brief.includes('Verify: `npm test -- users`'));
    assert.equal(kv.SUBBULLETS, '6');
  } finally {
    cleanup();
  }
});

test('task-brief#002 L2.2: the brief carries ONLY its own task — the neighbour never leaks in', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T02', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = briefText(repo, res);
    assert.equal(brief.includes('T01 Create users table migration'), false);
    assert.equal(brief.includes('Service: database'), false);
    assert.equal(brief.includes('npm run migrate'), false);
  } finally {
    cleanup();
  }
});

test('task-brief#003 L2.2: OUT_DIR is created with a .gitignore containing *', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(fs.existsSync(abs(repo, OUT)), true, 'OUT_DIR is created');
    assert.equal(h.read(abs(repo, path.join(OUT, '.gitignore'))).trim(), '*');
  } finally {
    cleanup();
  }
});

test('task-brief#004 L2.2: the self-ignoring _build/ keeps the brief out of git status (F4)', () => {
  const { repo, git, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    git('add', '-A');
    git('commit', '-qm', 'tasks');
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const status = git('status', '--porcelain');
    assert.equal(status.stdout.trim(), '', 'briefs and the .gitignore never reach a commit');
  } finally {
    cleanup();
  }
});

test('task-brief#005 an existing .gitignore is left alone, never overwritten', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    h.write(abs(repo, path.join(OUT, '.gitignore')), '*\n!keep-me.md\n');
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(h.read(abs(repo, path.join(OUT, '.gitignore'))).includes('keep-me.md'));
  } finally {
    cleanup();
  }
});

test('task-brief#006 a nested OUT_DIR that does not exist is created', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const deep = 'docs/features/0003F-signup/subfeatures/SF01-auth/_build';
    const res = h.runScript('task-brief', [TASKS, 'T01', deep], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(fs.existsSync(abs(repo, deep)), true);
    assert.equal(fs.existsSync(abs(repo, path.join(deep, '.gitignore'))), true);
  } finally {
    cleanup();
  }
});

test('task-brief#007 the LAST task stops at ## Acceptance Checklist — the section is not swallowed', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T02', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = briefText(repo, res);
    assert.equal(brief.includes('Acceptance Checklist'), false);
    assert.equal(brief.includes('returns 201 on valid signup'), false);
    assert.equal(brief.includes('npm run lint'), false);
  } finally {
    cleanup();
  }
});

test('task-brief#008 T01 resolves to the Execution task, never to T-TEST-01 in ## TDD', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = briefText(repo, res);
    assert.ok(brief.includes('T01 Create users table migration'));
    assert.equal(brief.includes('T-TEST-01'), false);
    assert.equal(brief.includes('users.spec.ts'), false);
  } finally {
    cleanup();
  }
});

test('task-brief#009 a ticked or failed task is still extractable — the brief is not tick-gated', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    h.write(abs(repo, TASKS), TASKS_CONTENT.replace('- [ ] T01 ', '- [!] T01 '));
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = briefText(repo, res);
    assert.ok(brief.includes('T01 Create users table migration'));
    assert.ok(brief.includes('Verify: `npm run migrate`'));
  } finally {
    cleanup();
  }
});

test('task-brief#010 a CRLF tasks.md still yields all six sub-bullets', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.write(abs(repo, TASKS), TASKS_CONTENT.replace(/\n/g, '\r\n'));
    const res = h.runScript('task-brief', [TASKS, 'T02', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).SUBBULLETS, '6');
  } finally {
    cleanup();
  }
});

test('task-brief#011 a task missing sub-bullets is reported by count, not silently padded', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.write(
      abs(repo, TASKS),
      '# Tasks: Thin\n\n## Execution\n\n- [ ] T01 Thin task\n  - Service: backend\n  - Files: `src/a.ts`\n  - Verify: tests pass\n\n## Acceptance Checklist\n',
    );
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.equal(h.parseKV(res.stdout).SUBBULLETS, '3');
  } finally {
    cleanup();
  }
});

test('task-brief#012 misuse: no arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('task-brief', [], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('task-brief#013 misuse: two arguments -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('task-brief#014 misuse: TASKS_FILE does not exist -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    const res = h.runScript('task-brief', ['docs/features/nope/tasks.md', 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('task-brief#015 misuse: a malformed TASK_ID -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'task one', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('task-brief#016 misuse: a TDD id is not an Execution task id -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T-TEST-01', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test('task-brief#017 misuse: a TASK_ID absent from ## Execution -> exit 2, and no brief is written', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T99', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
    assert.equal(res.stdout.includes('BRIEF='), false, 'an absent task is misuse, not an empty brief');
    const outAbs = abs(repo, OUT);
    const entries = fs.existsSync(outAbs) ? fs.readdirSync(outAbs) : [];
    assert.equal(entries.filter((f) => f.includes('T99')).length, 0);
  } finally {
    cleanup();
  }
});

test('task-brief#018 misuse: a tasks.md with no ## Execution section -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    h.write(abs(repo, TASKS), '# Tasks\n\n## TDD\n\n- [ ] T-TEST-01 thing\n');
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});

test("task-brief#019 known-failures: three arguments still work and report 'not supplied'", () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('BRIEF='));
    const brief = h.read(abs(repo, path.join(OUT, 'T01-brief.md')));
    assert.ok(brief.includes('## KNOWN_FAILURES'));
    assert.ok(brief.includes('not supplied'));
  } finally {
    cleanup();
  }
});

test("task-brief#020 known-failures: an empty 4th argument reports 'none observed'", () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT, ''], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = h.read(abs(repo, path.join(OUT, 'T01-brief.md')));
    assert.ok(brief.includes('## KNOWN_FAILURES'));
    assert.ok(brief.includes('none observed'));
    assert.equal(brief.includes('not supplied'), false, 'empty and absent are different states');
  } finally {
    cleanup();
  }
});

test('task-brief#021 known-failures: a populated 4th argument lands verbatim in the brief', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const failures = 'receipt-extraction.spec.ts: backend\nassistant-actions.spec.ts: frontend';
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT, failures], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = h.read(abs(repo, path.join(OUT, 'T01-brief.md')));
    assert.ok(brief.includes('## KNOWN_FAILURES'));
    assert.ok(brief.includes('receipt-extraction.spec.ts: backend'));
    assert.ok(brief.includes('assistant-actions.spec.ts: frontend'));
    assert.equal(brief.includes('none observed'), false);
    assert.equal(brief.includes('not supplied'), false);
  } finally {
    cleanup();
  }
});

test('task-brief#022 known-failures: the task block still travels whole alongside the section', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT, 'some-spec.ts: backend'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const brief = h.read(abs(repo, path.join(OUT, 'T01-brief.md')));
    assert.ok(brief.includes('Consumes'));
    assert.ok(brief.includes('Produces'));
    assert.ok(res.stdout.includes('SUBBULLETS='));
  } finally {
    cleanup();
  }
});

test('task-brief#023 known-failures: a 5th argument is still CLI misuse -> exit 2', () => {
  const { repo, cleanup } = h.makeRepo();
  try {
    writeTasks(repo);
    const res = h.runScript('task-brief', [TASKS, 'T01', OUT, 'x', 'y'], { cwd: repo });
    assert.equal(res.status, 2, res.output);
  } finally {
    cleanup();
  }
});
