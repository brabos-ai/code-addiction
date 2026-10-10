'use strict';
// =============================================================================
// status.test.cjs — native port of framwork/.codeadd/scripts/tests/status.bats
// (57 cases, status#001…#057). Target entry:
// framwork/.codeadd/scripts/status.cjs.
//
// Plus characterization of the `status next-id <PREFIX>` subcommand and the
// NEXT_ID_AGREE invariant (status.cjs reimplements next-id.sh and the two must
// return the same string for the same tree), now compared Node-to-Node.
//
// Run: node --test scripts/tests/status.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const h = require('./helpers.cjs');

function has(res, needle) {
  assert.ok(
    res.output.includes(needle),
    `expected output to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

function hasNot(res, needle) {
  assert.ok(
    !res.output.includes(needle),
    `expected output NOT to include ${JSON.stringify(needle)}\n--- status ${res.status} ---\n${res.output}`,
  );
}

/** A throwaway repo on main, cleaned up when the test ends. */
function repo(t, opts) {
  const r = h.makeRepo({ prefix: 'codeadd-status-', ...opts });
  t.after(r.cleanup);
  return r;
}

const status = (r, args = []) => h.runScript('status', args, { cwd: r.repo });
const writeIn = (r, rel, content) => h.write(path.join(r.repo, rel), content);
const mkdirIn = (r, rel) => fs.mkdirSync(path.join(r.repo, rel), { recursive: true });
const onBranch = (r, name) => r.git('checkout', '-b', name, '-q');
const featurePath = (...parts) => path.join('docs', 'features', ...parts);

// ─── Branch detection ───────────────────────────────────────────────

test('status#001 outputs BRANCH with type main', (t) => {
  const r = repo(t);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:main TYPE:main MAIN:main');
});

test('status#002 detects feature branch', (t) => {
  const r = repo(t);
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'TYPE:feature');
});

test('status#003 detects fix branch', (t) => {
  const r = repo(t);
  onBranch(r, 'fix/0001H-bugfix');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'TYPE:fix');
});

test('status#004 detects docs branch', (t) => {
  const r = repo(t);
  onBranch(r, 'docs/0001D-readme');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'TYPE:docs');
});

// ─── Phase detection ────────────────────────────────────────────────

test('status#005 phase=created when feature dir exists but is empty', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:created');
});

test('status#006 phase=documented when about.md has real content', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'about.md'), '# Feature 0001F\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:documented');
});

test('status#007 phase=planned quando plan.md existe', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'plan.md'), '# Plan\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:planned');
});

test('status#008 phase=done quando changelog.md existe', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'changelog.md'), '# Changelog\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:done');
});

// ─── Feature docs listing ───────────────────────────────────────────

test('status#009 lists existing feature docs', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'about.md'), 'a\n');
  writeIn(r, featurePath('0001F-test', 'plan.md'), 'p\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'DOCS:about.md,plan.md');
});

// ─── Recommendations ────────────────────────────────────────────────

test('status#010 recommends /add-new when on main', (t) => {
  const r = repo(t);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'REC:/add-new to start');
});

test('status#011 recommends /add-review or /add-done on a completed feature', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'changelog.md'), '# Changelog\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'TYPE:feature');
  has(res, 'REC:/add-review or /add-done');
});

test('status#012 recommends /add-done on a hotfix branch', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001H-urgent', 'about.md'), '# Hotfix\n');
  onBranch(r, 'hotfix/0001H-urgent');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'TYPE:hotfix');
  has(res, 'REC:/add-done');
  hasNot(res, '/add-review');
});

test('status#013 recommends /add-build when phase=planned', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'plan.md'), '# Plan\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'REC:/add-build to implement');
});

// ─── Git status ──────────────────────────────────────────────────────

test('status#014 shows GIT status when there are modified files', (t) => {
  const r = repo(t);
  writeIn(r, 'test.txt', 'new file\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'GIT:');
});

// ─── Feature not found ──────────────────────────────────────────────

test('status#015 reports feature dir not found when docs do not exist', (t) => {
  const r = repo(t);
  onBranch(r, 'feature/9999F-missing');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'FEATURE:9999F-missing PHASE:none');
  has(res, 'not found');
});

// ─── Exit clean ─────────────────────────────────────────────────────

test('status#016 always exits with 0', (t) => {
  const r = repo(t);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:main TYPE:main MAIN:main');
});

// ─── Phase extended ──────────────────────────────────────────────────

test('status#017 phase=designed quando design.md existe', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'design.md'), '# Design\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:designed');
});

test('status#018 HAS_DESIGN:true when feature-level design.md exists', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'design.md'), '# Design\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_DESIGN:true');
});

test('status#019 HAS_DESIGN:true and PHASE:designed when only a subfeature has design.md', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'subfeatures', 'SF01-x', 'design.md'), '# Design\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_DESIGN:true');
  has(res, 'PHASE:designed');
  has(res, 'DOCS:design.md');
});

test('status#020 HAS_DESIGN:false when no design.md exists at feature or subfeature level', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'about.md'), '# About\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_DESIGN:false');
});

test('status#021 phase=discovering when discovery.md exists without Summary for Planning', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-test', 'discovery.md'), '# Discovery - work in progress\n');
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:discovering');
});

test('status#022 phase=discovered when discovery.md contains "## Summary for Planning"', (t) => {
  const r = repo(t);
  writeIn(
    r,
    featurePath('0001F-test', 'discovery.md'),
    '# Discovery\n\n## Summary for Planning\n{"key":"value"}\n',
  );
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PHASE:discovered');
});

// ─── iterations.jsonl ────────────────────────────────────────────────

test('status#023 shows ITERATIONS when iterations.jsonl exists with entries', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'iterations.jsonl'),
    '{"ts":"2026-01-01","type":"fix","slug":"btn","what":"fix button"}\n' +
      '{"ts":"2026-01-02","type":"add","slug":"form","what":"add form"}\n' +
      '{"ts":"2026-01-03","type":"enhance","slug":"modal","what":"improve modal"}\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'ITERATIONS:3');
  has(res, 'LAST_ITERS:');
  has(res, 'ITERATIONS_FILE:');
});

// ─── Epic from plan.md ───────────────────────────────────────────────

test('status#024 detects epic when plan.md has "### Feature N:" sections', (t) => {
  const r = repo(t);
  writeIn(
    r,
    featurePath('0001F-test', 'plan.md'),
    '# Plan\n\n## Epic: auth-system\n\n### Feature 1: Login\n### Feature 2: Signup\n### Feature 3: Logout\n',
  );
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'EPIC:auth-system');
  has(res, 'FEATURES:0/3');
  has(res, 'NEXT:1');
});

test('status#025 epic: shows all_complete when all features are complete', (t) => {
  const r = repo(t);
  writeIn(
    r,
    featurePath('0001F-test', 'plan.md'),
    '# Plan\n\n### Feature 1: Login\n### Feature 2: Signup\n',
  );
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'iterations.jsonl'),
    '{"ts":"2026-01-01","type":"add","slug":"feature-1-complete","what":"done"}\n' +
      '{"ts":"2026-01-02","type":"add","slug":"feature-2-complete","what":"done"}\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'STATUS:all_complete');
});

// ─── epic.md (PRD0032) ───────────────────────────────────────────────

test('status#026 detects epic.md and reports subfeature progress', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| SF01 | Login | done |\n| SF02 | Signup | in_progress |\n| SF03 | Logout | pending |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_EPIC:true');
  has(res, 'EPIC_PROGRESS:1/3');
  has(res, 'EPIC_CURRENT_SF:SF02');
});

test('status#027 reports subfeature progress with padded/aligned columns', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| SF01 | Login  | done        |\n' +
      '| SF02 | Signup | in_progress |\n' +
      '| SF03 | Logout | pending     |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'EPIC_PROGRESS:1/3');
  has(res, 'EPIC_CURRENT_SF:SF02');
});

// L1.1/#028 and L1.2/#029 — the blind spots behind header-name resolution.
function writeEpicBlindspot(r, mode) {
  const dir = featurePath('0001F-test');
  mkdirIn(r, dir);
  const lines = ['# Epic', '', '| SF | Name | Status | Notes |', '|----|------|--------|-------|', '| SF01 | Alpha | done | — |'];
  lines.push(
    mode === 'notes-done'
      ? '| SF02 | Beta | pending | done |'
      : '| SF02 | done | pending | — |',
  );
  writeIn(r, path.join(dir, 'epic.md'), lines.join('\n') + '\n');
}

test('status#028 L1.1 blind spot: a Notes cell reading done must not count the row as done', (t) => {
  const r = repo(t);
  onBranch(r, 'feature/0001F-test');
  writeEpicBlindspot(r, 'notes-done');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_EPIC:true');
  has(res, 'EPIC_PROGRESS:1/2');
  has(res, 'EPIC_CURRENT_SF:SF02');
});

test('status#029 L1.2 blind spot: a subfeature NAMED done must not count the row as done', (t) => {
  const r = repo(t);
  onBranch(r, 'feature/0001F-test');
  writeEpicBlindspot(r, 'name-done');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'EPIC_PROGRESS:1/2');
  has(res, 'EPIC_CURRENT_SF:SF02');
});

test('status#030 L1.3: status and id resolved by header name, id column NOT first', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| Name | SF | Status |\n|------|----|--------|\n| Alpha | SF01 | done |\n| Beta | SF02 | pending |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'EPIC_PROGRESS:1/2');
  has(res, 'EPIC_CURRENT_SF:SF02');
});

test('status#031 L1.3b: in_progress still wins over pending under header resolution', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| Name | SF | Status | Notes |\n' +
      '|------|----|--------|-------|\n' +
      '| Alpha | SF01 | done | — |\n' +
      '| Beta | SF02 | pending | — |\n' +
      '| Gamma | SF03 | in_progress | — |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'EPIC_PROGRESS:1/3');
  has(res, 'EPIC_CURRENT_SF:SF03');
});

test('status#032 L1.4 legacy guard: a pre-schema epic.md with NO header still reads as today', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| SF01 | Alpha | build alpha | done | 0001F-test-SF01-done |\n' +
      '| SF02 | Beta | build beta | pending |\n' +
      '| SF03 | Gamma | build gamma | in_progress |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_EPIC:true');
  has(res, 'EPIC_PROGRESS:1/3');
  has(res, 'EPIC_CURRENT_SF:SF03');
});

test('status#033 L1.5: the emitted keys are unchanged on a well-formed epic', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'epic.md'),
    '| SF | Name | Objective | Status | Checkpoint |\n' +
      '|----|------|-----------|--------|------------|\n' +
      '| SF01 | Alpha | build alpha | done | 0001F-test-SF01-done |\n' +
      '| SF02 | Beta | build beta | pending | — |\n',
  );
  r.git('tag', 'checkpoint/0001F-test-SF01-done');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_EPIC:true');
  has(res, 'EPIC_PROGRESS:1/2');
  has(res, 'EPIC_CURRENT_SF:SF02');
  has(res, 'LAST_CHECKPOINT:checkpoint/0001F-test-SF01-done');
});

// ─── tasks.md ────────────────────────────────────────────────────────

test('status#034 shows tasks.md progress when present (no epic)', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  writeIn(
    r,
    featurePath('0001F-test', 'tasks.md'),
    '| 1.1 | Task one | ✅ |\n| 1.2 | Task two | ✅ |\n| 1.3 | Task three | pending |\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'HAS_TASKS:true');
  has(res, 'TASKS_PROGRESS:2/3');
});

// ─── Summaries ───────────────────────────────────────────────────────

test('status#035 shows ABOUT_SUMMARY when about.md has ## Summary section with JSON', (t) => {
  const r = repo(t);
  writeIn(
    r,
    featurePath('0001F-test', 'about.md'),
    '# About 0001F\n\n## Summary\n{"purpose":"test feature","scope":"minimal"}\n',
  );
  onBranch(r, 'feature/0001F-test');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'ABOUT_SUMMARY:');
  has(res, '{"purpose":"test feature","scope":"minimal"}');
});

// ─── RECENT_CHANGELOGS ───────────────────────────────────────────────

test('status#036 shows RECENT_CHANGELOGS when there are completed features', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0001F-login', 'changelog.md'), '# 0001F Login\n\n## Summary\nUser authentication implemented\n');
  writeIn(r, featurePath('0002F-signup', 'changelog.md'), '# 0002F Signup\n\n## Summary\nUser registration flow\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'RECENT_CHANGELOGS:');
  has(res, '0001F-login');
});

// ─── Git checkpoint tag ──────────────────────────────────────────────

test('status#037 shows LAST_CHECKPOINT when checkpoint tag exists', (t) => {
  const r = repo(t);
  mkdirIn(r, featurePath('0001F-test'));
  onBranch(r, 'feature/0001F-test');
  r.git('tag', 'checkpoint/0001F-test-v1-done');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'LAST_CHECKPOINT:checkpoint/0001F-test-v1-done');
});

// ─── PENDING backlog ─────────────────────────────────────────────────

test('status#038 PENDING: lists a feature with docs but no branch and no changelog', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0005F-pending', 'about.md'), '# About\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PENDING:0005F-pending PHASE:documented');
});

test('status#039 PENDING: excludes a feature that already has a local branch', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0005F-pending', 'about.md'), '# About\n');
  r.git('branch', 'feature/0005F-pending');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:main TYPE:main MAIN:main');
  hasNot(res, 'PENDING:0005F-pending');
});

test('status#040 PENDING: still lists a feature when only an unrelated branch exists', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0005F-pending', 'about.md'), '# About\n');
  r.git('branch', 'feature/9999F-unrelated');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'PENDING:0005F-pending');
});

test('status#041 PENDING: excludes a feature that already has changelog.md', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0006F-done', 'about.md'), '# About\n');
  writeIn(r, featurePath('0006F-done', 'changelog.md'), '# Changelog\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'BRANCH:main TYPE:main MAIN:main');
  hasNot(res, 'PENDING:0006F-done');
});

test('status#042 PENDING: REC recommends /add-build for the first pending feature on main', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0005F-pending', 'about.md'), '# About\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, '/add-build 0005F');
});

// ─── WIKI block ──────────────────────────────────────────────────────

test('status#043 WIKI: absent when .codeadd/wiki/index.md does not exist', (t) => {
  const r = repo(t);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:absent');
  has(res, 'WIKI_HINT:Run /add-wiki to generate the knowledge base');
});

test('status#044 WIKI: present with 0 stale changes when sha == HEAD', (t) => {
  const r = repo(t);
  writeIn(r, '.codeadd/wiki/index.md', '# Wiki\n');
  const head = r.git('rev-parse', 'HEAD').stdout.trim();
  writeIn(r, '.codeadd/wiki/.meta.json', `{"updatedAt":"2026-07-15","command":"/add-wiki","gitHead":"${head}"}\n`);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:present');
  has(res, 'WIKI_COMMIT:');
  has(res, 'WIKI_STALE_COUNT:0');
  hasNot(res, 'WIKI_HINT:');
});

test('status#045 WIKI: present with N stale changes when sha is behind HEAD', (t) => {
  const r = repo(t);
  writeIn(r, '.codeadd/wiki/index.md', '# Wiki\n');
  const old = r.git('rev-parse', 'HEAD').stdout.trim();
  writeIn(r, '.codeadd/wiki/.meta.json', `{"updatedAt":"2026-07-15","command":"/add-wiki","gitHead":"${old}"}\n`);
  r.git('add', '.codeadd/wiki/index.md', '.codeadd/wiki/.meta.json');
  r.git('commit', '-m', 'add wiki', '-q');
  writeIn(r, 'file1.txt', 'change1\n');
  writeIn(r, 'file2.txt', 'change2\n');
  r.git('add', 'file1.txt', 'file2.txt');
  r.git('commit', '-m', 'two changes', '-q');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:present');
  assert.match(res.output, /WIKI_STALE_COUNT:[1-9]/);
  has(res, 'WIKI_HINT:Wiki may be stale (');
  has(res, '/add-wiki update');
});

test('status#046 WIKI: unresolvable sha (garbage .meta.json) yields unknown + unreachable hint', (t) => {
  const r = repo(t);
  writeIn(r, '.codeadd/wiki/index.md', '# Wiki\n');
  writeIn(r, '.codeadd/wiki/.meta.json', 'not valid json {{{\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:present');
  has(res, 'WIKI_STALE_COUNT:unknown');
  has(res, 'WIKI_HINT:Wiki stamp unreachable — consider /add-wiki update');
});

test('status#047 WIKI: missing .meta.json yields unknown + unreachable hint', (t) => {
  const r = repo(t);
  writeIn(r, '.codeadd/wiki/index.md', '# Wiki\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:present');
  has(res, 'WIKI_STALE_COUNT:unknown');
  has(res, 'WIKI_HINT:Wiki stamp unreachable — consider /add-wiki update');
});

test('status#048 WIKI: unreachable sha (well-formed but nonexistent commit) yields unknown + unreachable hint', (t) => {
  const r = repo(t);
  writeIn(r, '.codeadd/wiki/index.md', '# Wiki\n');
  writeIn(
    r,
    '.codeadd/wiki/.meta.json',
    '{"updatedAt":"2026-07-15","command":"/add-wiki","gitHead":"0000000000000000000000000000000000dead"}\n',
  );
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'WIKI:present');
  has(res, 'WIKI_STALE_COUNT:unknown');
  has(res, 'WIKI_HINT:Wiki stamp unreachable — consider /add-wiki update');
});

// ─── SETUP CONTRACT (materialized-state staleness) ───────────────────

function mkReceipt(r, shape, crlf = false) {
  const nl = crlf ? '\r\n' : '\n';
  const body =
    `---${nl}type: setup-receipt${nl}setup-shape: ${shape}${nl}---${nl}${nl}` +
    `## Decision Log${nl}${nl}| d | setup-shape: sha256:deadbeefdeadbeef | x |${nl}`;
  writeIn(r, path.join('docs', 'qa', 'qa-setup.md'), body);
}

function mkSidecar(r, shape) {
  const body =
    '{\n  "version": 1,\n  "contracts": {\n    "add-qa-setup": {\n' +
    `      "shape": "${shape}",\n` +
    '      "paths": [\n        { "path": "a", "owner": "setup" }\n      ]\n    }\n  }\n}\n';
  writeIn(r, path.join('.codeadd', 'contracts.json'), body);
}

test('status#049 SETUP_QA: absent when no QA state exists', (t) => {
  const r = repo(t);
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA:absent');
});

test('status#050 SETUP_QA: stale when config.json exists without a receipt', (t) => {
  const r = repo(t);
  writeIn(r, path.join('docs', 'qa', 'config.json'), '{}\n');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA:stale');
  has(res, 'SETUP_QA_STALE:yes');
  has(res, 'SETUP_QA_HINT:');
  has(res, '/add-qa-setup');
  hasNot(res, 'SETUP_QA:unreceipted');
});

test('status#051 SETUP_QA: stale from the qa-project skill alone, for EVERY provider dest', (t) => {
  const r = repo(t);
  const dests = ['.claude', '.agents', '.agent', '.cursor', '.opencode'];
  for (const d of dests) {
    for (const other of dests) {
      fs.rmSync(path.join(r.repo, other), { recursive: true, force: true });
    }
    writeIn(r, path.join(d, 'skills', 'qa-project', 'SKILL.md'), 'x\n');
    const res = status(r);
    assert.equal(res.status, 0, `provider dest ${d}`);
    has(res, 'SETUP_QA:stale');
  }
});

test('status#052 SETUP_QA: current when recorded shape equals shipped', (t) => {
  const r = repo(t);
  mkReceipt(r, 'sha256:aaaaaaaaaaaaaaaa');
  mkSidecar(r, 'sha256:aaaaaaaaaaaaaaaa');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA:present');
  hasNot(res, 'SETUP_QA_STALE');
  hasNot(res, 'SETUP_QA_CONTRACT');
  hasNot(res, 'SETUP_QA_BEHIND');
});

test('status#053 SETUP_QA: stale when recorded shape differs from shipped', (t) => {
  const r = repo(t);
  mkReceipt(r, 'sha256:aaaaaaaaaaaaaaaa');
  mkSidecar(r, 'sha256:bbbbbbbbbbbbbbbb');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA_STALE:yes');
  has(res, 'SETUP_QA_HINT:');
  has(res, '/add-qa-setup');
  hasNot(res, 'SETUP_QA_BEHIND');
});

test('status#054 SETUP_QA: a malformed setup-shape is stale, never guessed current', (t) => {
  const r = repo(t);
  writeIn(r, path.join('docs', 'qa', 'qa-setup.md'), '---\nsetup-shape: v1\n---\n');
  mkSidecar(r, 'sha256:aaaaaaaaaaaaaaaa');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA_STALE:yes');
  hasNot(res, 'SETUP_QA_CONTRACT');
});

test('status#055 SETUP_QA: pre-contracts install stays silent (no sidecar, no hint)', (t) => {
  const r = repo(t);
  mkReceipt(r, 'sha256:aaaaaaaaaaaaaaaa');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA:present');
  hasNot(res, 'SETUP_QA_HINT');
  hasNot(res, 'SETUP_QA_STALE');
});

test('status#056 SETUP_QA: a CRLF receipt is read, not degraded to unreadable', (t) => {
  const r = repo(t);
  mkReceipt(r, 'sha256:aaaaaaaaaaaaaaaa', true);
  mkSidecar(r, 'sha256:bbbbbbbbbbbbbbbb');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA_STALE:yes');
});

test('status#057 SETUP_QA: the Decision Log body never leaks into the recorded value', (t) => {
  const r = repo(t);
  mkReceipt(r, 'sha256:aaaaaaaaaaaaaaaa');
  mkSidecar(r, 'sha256:aaaaaaaaaaaaaaaa');
  const res = status(r);
  assert.equal(res.status, 0);
  has(res, 'SETUP_QA:present');
  hasNot(res, 'SETUP_QA_STALE');
  hasNot(res, 'deadbeef');
});

// ─── next-id <PREFIX> subcommand (reimplements next-id.sh) ───────────

test('status next-id: allocates the next id for a single-letter prefix', (t) => {
  const r = repo(t);
  const res = status(r, ['next-id', 'F']);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0001F');
});

test('status next-id: accepts the named prefix PRD', (t) => {
  const r = repo(t);
  const res = status(r, ['next-id', 'PRD']);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), '0001PRD');
});

test('status next-id: validates the prefix and exits 2 on an unknown one', (t) => {
  const r = repo(t);
  const res = status(r, ['next-id', 'X']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /unknown prefix 'X'/);
  assert.match(res.stderr, /valid: F, H, PRD, CHG, B/);
});

test('status next-id: an empty prefix exits 2', (t) => {
  const r = repo(t);
  const res = status(r, ['next-id']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /unknown prefix/);
});

test('NEXT_ID_AGREE: status next-id and next-id.cjs agree Node-to-Node', (t) => {
  const r = repo(t);
  writeIn(r, featurePath('0002F-docs', 'about.md'), '# about\n');
  h.write(path.join(r.repo, 'docs', 'backlog.jsonl'), '{"id":"0005B","title":"board"}\n');
  const env = { CODEADD_BOARD_DIR: r.repo };
  const viaStatus = h.runScript('status', ['next-id', 'F'], { cwd: r.repo, env });
  const viaScript = h.runScript('next-id', ['F'], { cwd: r.repo, env });
  assert.equal(viaStatus.status, 0);
  assert.equal(viaScript.status, 0);
  assert.equal(viaStatus.stdout.trim(), viaScript.stdout.trim());
  assert.equal(viaStatus.stdout.trim(), '0006F');
});

// ─── F6 — the BOARD= line, and ticket ids counted in the board clone ─────────

/** One ticket row for a board file. */
const boardRow = (id) => JSON.stringify({
  id, title: id, theme: 'general', tldr: id, notes: [], done_when: 'it works', paths: [], grounded: false,
  status: 'open', created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z', comments: [], work_id: null,
});

/** A board fixture (remote + code repo + clone path) holding the given ticket ids. */
function boardFixture(t, ids) {
  const b = h.makeBoard({ files: { 'docs/backlog.jsonl': ids.map(boardRow).join('\n') + (ids.length ? '\n' : '') } });
  t.after(b.cleanup);
  return b;
}

const boardLines = (res) => res.stdout.split('\n').filter((l) => l.startsWith('BOARD='));

test('status#058 prints exactly one BOARD= line in each of the five states and keeps exit 0', (t) => {
  // none: a repository with neither config nor board file.
  const plain = repo(t);
  let res = h.runScript('status', [], { cwd: plain.repo, env: { CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(boardLines(res), ['BOARD=none']);

  // ready.
  const ready = boardFixture(t, ['0001B']);
  res = h.runScript('status', [], { cwd: ready.repo, env: ready.env });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(boardLines(res), ['BOARD=ready']);

  // migration-required: the file in the checkout, no config.
  const old = repo(t);
  writeIn(old, 'docs/backlog.jsonl', boardRow('0001B') + '\n');
  res = h.runScript('status', [], { cwd: old.repo, env: { CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(boardLines(res), ['BOARD=migration-required']);

  // branch-missing: config names a branch the remote lacks.
  const missing = boardFixture(t, []);
  h.write(path.join(missing.repo, '.codeadd', 'board.json'), JSON.stringify({ remote: missing.bare, branch: 'nope' }));
  res = h.runScript('status', [], { cwd: missing.repo, env: missing.env });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(boardLines(res), ['BOARD=branch-missing']);

  // checkout-missing: no clone and the remote is gone.
  const offline = boardFixture(t, []);
  h.write(path.join(offline.repo, '.codeadd', 'board.json'), JSON.stringify({ remote: path.join(offline.base, 'gone.git'), branch: 'board' }));
  res = h.runScript('status', [], { cwd: offline.repo, env: offline.env });
  assert.equal(res.status, 0, res.output);
  assert.deepEqual(boardLines(res), ['BOARD=checkout-missing']);
});

test('status#059 next-id B, next-id.cjs B and init.cjs allocate past a ticket that exists only in the clone', (t) => {
  const b = boardFixture(t, ['0007B']);
  const viaStatus = h.runScript('status', ['next-id', 'B'], { cwd: b.repo, env: b.env });
  assert.equal(viaStatus.status, 0, viaStatus.output);
  assert.equal(viaStatus.stdout.trim(), '0008B');

  const viaNextId = h.runScript('next-id', ['F'], { cwd: b.repo, env: b.env });
  assert.equal(viaNextId.status, 0, viaNextId.output);
  assert.equal(viaNextId.stdout.trim(), '0008F');

  const viaInit = h.runScript('init', [], { cwd: b.repo, env: b.env });
  assert.equal(viaInit.status, 0, viaInit.output);
  assert.match(viaInit.stdout, /FEATURES:count=0 next=0008F/);
});

test('status#060 without a ready board, allocation counts feature directories only', (t) => {
  const old = repo(t);
  writeIn(old, 'docs/backlog.jsonl', boardRow('0050B') + '\n');
  mkdirIn(old, featurePath('0003F-thing'));
  const res = h.runScript('status', ['next-id', 'B'], { cwd: old.repo, env: { CODEADD_BOARD_DIR: '' } });
  assert.equal(res.status, 0, res.output);
  assert.equal(res.stdout.trim(), '0004B', 'the checkout file is never read');
});
