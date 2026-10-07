#!/usr/bin/env node
// =============================================================================
// SMOKE-TEST — end-to-end check of the delivery-loop mechanics
// =============================================================================
// Usage:        node scripts/smoke-test.cjs
// Exit:         0 = every scenario passed · 1 = at least one failed
// Dependencies: Node built-ins and git. No network. No shell, no Bash.
// Scope:        INTERNAL layer (not shipped to users). Validates the scripts
//               and the shell mechanics the pipeline prescribes, through the
//               NATIVE Node entries.
//
// -----------------------------------------------------------------------------
// WHY THIS FILE EXISTS — read this before changing anything below
// -----------------------------------------------------------------------------
// The bats suites under framwork/.codeadd/scripts/tests/ are UNIT tests. They
// call one script with one fixture and assert one output. That is the right
// shape for a gate's decision table, and it is structurally blind to a whole
// class of defect: the SEAM between pieces.
//
// This file exists because a suite of 54 green unit tests missed three real
// bugs that a single run against a throwaway git repo found in minutes:
//
//   1. `git push --follow-tags` pushes ANNOTATED tags only. The checkpoint tag
//      was lightweight, so it silently never reached the remote — the exact
//      failure the instruction was written to prevent, since a local-only tag
//      is invisible to a fresh-clone resume. No unit test creates a remote.
//
//   2. `git add` fails the WHOLE invocation on the first non-matching pathspec
//      (exit 128, nothing staged). The checkpoint staged four paths in one
//      command, and on an epic one of them does not exist — so the epic.md row
//      flip never reached the commit that the next step then tagged. No unit
//      test runs `git add`.
//
//   3. Gate 4 reported `missing` on every healthy epic, because an epic keeps
//      its plan.md at SUBFEATURE level and the gate read the feature root. No
//      unit test built a realistic epic tree with plans where they really live.
//
// This is the NATIVE port of `scripts/smoke-test.sh`. Every scenario is named
// for the defect it guards. If you delete one, you are re-opening that bug.
//
// -----------------------------------------------------------------------------
// WHAT THIS CAN AND CANNOT PROVE — do not overstate it
// -----------------------------------------------------------------------------
// CAN:    the mechanics the commands prescribe, executed for real — staging,
//         commit, tag, push, and the two native readers of epic.md agreeing on
//         the same tree.
//
// CANNOT: whether an AI coordinator FOLLOWS an instruction. Commands like
//         /add-build are prose an agent reads; there is no harness that
//         executes them. This file tests the mechanics those instructions
//         prescribe, never the obedience of the reader.
//
// -----------------------------------------------------------------------------
// FOR AN LLM PICKING THIS UP LATER
// -----------------------------------------------------------------------------
// - Every scenario is self-contained: it builds its own repo under a temp dir
//   and never touches the working tree you are in. Safe to run at any time.
// - Add a scenario when a defect escapes the unit suites because it lives in a
//   seam — several files, a git operation, or a real directory layout. Do NOT
//   add one for a decision table; that belongs in a .bats file or a native case
//   next to the script it tests.
// - Name the scenario after the defect, not after the function. `S2` reads as
//   "the tag reaches the remote", which is what a future reader needs to know.
// - Keep it dependency-free. It runs before/without npm install by design.
// =============================================================================

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SCRIPTS = path.join(REPO_ROOT, 'framwork', '.codeadd', 'scripts');
const CONVERGE_GATES = path.join(SCRIPTS, 'converge-gates.cjs');
const STATUS = path.join(SCRIPTS, 'status.cjs');

const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-smoke-'));
let PASS = 0;
let FAIL = 0;

process.on('exit', () => fs.rmSync(WORK, { recursive: true, force: true }));

// ─── Observation helpers ─────────────────────────────────────────────────────

/** Every child runs with a deterministic environment and never a shell. */
function childEnv() {
  return { ...process.env, NODE_OPTIONS: '', GIT_OPTIONAL_LOCKS: '0' };
}

/** One git invocation, argv array, explicit cwd. No shell. */
function git(cwd, args) {
  const res = spawnSync('git', args, {
    cwd,
    env: childEnv(),
    shell: false,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  return { status: res.status === null || res.status === undefined ? 1 : res.status, stdout, stderr, output: stdout + stderr };
}

/** One native entry, argv array, explicit cwd. No shell, no Bash bridge. */
function runNode(file, args, cwd) {
  const res = spawnSync(process.execPath, [file, ...args], {
    cwd,
    env: childEnv(),
    shell: false,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  return { status: res.status === null || res.status === undefined ? 1 : res.status, stdout, stderr, output: stdout + stderr };
}

/** The KEY=VALUE contract a script prints: JSONL lines ignored, last value wins. */
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

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function head(title) {
  process.stdout.write(`\n${title}\n`);
}

function ok(name) {
  PASS += 1;
  process.stdout.write(`  PASS  ${name}\n`);
}

function bad(name, detail) {
  FAIL += 1;
  process.stdout.write(`  FAIL  ${name}\n`);
  if (detail !== undefined && detail !== '') process.stdout.write(`        ${detail}\n`);
}

// ─── Fixtures (mirror build_epic / new_repo in smoke-test.sh) ────────────────

function coverageTable(id, requirement, covered) {
  return [
    '| ID | Requirement | Covered? |',
    '|----|-------------|----------|',
    `| ${id} | ${requirement} | ${covered} |`,
    '',
  ].join('\n');
}

/**
 * A realistic epic tree, where /add-plan really puts things: epic.md at the
 * feature root, plan.md and tasks.md inside each subfeature. Returns its
 * feature dir relative to the repo root.
 */
function buildEpic(repo, id, sfStatus, covered) {
  const fd = `docs/features/${id}`;
  const abs = (...parts) => path.join(repo, ...parts);
  writeFile(abs(fd, 'epic.md'), [
    '# Epic',
    '',
    '| SF | Name | Objective | Status | checkpoint |',
    '|----|------|-----------|--------|-----------|',
    `| SF01 | Alpha | a | done | ${id}-SF01-done |`,
    `| SF02 | Beta | b | ${sfStatus} | |`,
    '',
  ].join('\n'));
  writeFile(abs(fd, 'subfeatures', 'SF01-alpha', 'plan.md'), coverageTable('RF01', 'alpha thing', 'YES'));
  writeFile(abs(fd, 'subfeatures', 'SF02-beta', 'plan.md'), coverageTable('RF02', 'beta thing', covered));
  writeFile(
    abs(fd, 'subfeatures', 'SF02-beta', 'tasks.md'),
    '# Tasks\n\n## Acceptance Checklist\n- [x] one\n* [x] two\n',
  );
  writeFile(abs(fd, 'review-001.md'), [
    '# Review',
    '',
    '> **QA baseline:** none',
    '',
    '| Gate | Status | Details |',
    '|---|---|---|',
    '| **Overall** | **PASSED** | 6/6 gates PASSED |',
    '',
    '## Fix Routing',
    'none',
    '',
  ].join('\n'));
  return fd;
}

/** A throwaway repository on `main`, with the loose checkout settings the shell set. */
function newRepo(name) {
  const dir = path.join(WORK, name);
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q', '--initial-branch=main']);
  git(dir, ['config', 'user.email', 'smoke@test']);
  git(dir, ['config', 'user.name', 'Smoke']);
  git(dir, ['config', 'core.autocrlf', 'false']); // keep the output free of CRLF warnings
  return dir;
}

/** Flip SF02 Beta to done in epic.md, exactly as a checkpoint would. */
function flipSf02ToDone(repo, fd) {
  const file = path.join(repo, fd, 'epic.md');
  writeFile(file, fs.readFileSync(file, 'utf8').replace('| SF02 | Beta | b | pending |', '| SF02 | Beta | b | done |'));
}

/** Stage a pathspec and return how many entries it added. */
function stagedCount(repo, rel) {
  return git(repo, ['diff', '--cached', '--name-only', '--', rel])
    .stdout.split('\n')
    .map((s) => s.trim())
    .filter(Boolean).length;
}

/** The ref names a bare remote advertises. */
function remoteRefs(remote) {
  return git(path.dirname(remote), ['ls-remote', remote])
    .stdout.split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t')[1]);
}

/** Resolve a single-trailing-`*` path against a real directory listing. */
function resolveGlob(repo, rel) {
  if (!rel.includes('*')) return fs.existsSync(path.join(repo, rel)) ? [rel] : [];
  const dir = path.dirname(rel);
  const prefix = path.basename(rel).replace('*', '');
  const abs = path.join(repo, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((name) => name.startsWith(prefix))
    .map((name) => path.join(dir, name));
}

// =============================================================================
// S1 — the checkpoint stages epic.md even when a declared path is absent
// Guards: the multi-pathspec `git add` that aborted the whole invocation and
// silently lost the epic.md row flip, while the commit and tag still happened.
// =============================================================================
function s1() {
  head('S1 — the checkpoint stages epic.md even when a declared path is absent');
  const repo = newRepo('s1');
  const fd = buildEpic(repo, '0099F-smoke', 'pending', 'YES');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'seed']);

  // The BROKEN form: one add, four pathspecs, one of them absent on an epic.
  git(repo, ['add', '-A', '--', '.', ':(exclude)docs/features/*']);
  const broken = git(repo, [
    'add', '-A', '--',
    `${fd}/subfeatures/SF02-*`,
    `${fd}/epic.md`,
    `${fd}/review-001.md`,
    `${fd}/_tests/run-001/`,
  ]);
  if (broken.status === 0) {
    bad('the old single-add form still fails, and still loses epic.md (the defect reproduces)');
  } else if (stagedCount(repo, `${fd}/epic.md`) === 0) {
    ok('the old single-add form still fails, and still loses epic.md (the defect reproduces)');
  } else {
    bad('the old form staged epic.md — this scenario no longer reproduces the defect it guards');
  }
  git(repo, ['reset', '-q']);

  // The FIXED form: one add per path, absent paths skipped, present-path failure fatal.
  flipSf02ToDone(repo, fd);
  git(repo, ['add', '-A', '--', '.', ':(exclude)docs/features/*']);
  let rc = 0;
  for (const rel of [
    `${fd}/subfeatures/SF02-*`,
    `${fd}/epic.md`,
    `${fd}/review-001.md`,
    `${fd}/_tests/run-001/`,
  ]) {
    for (const p of resolveGlob(repo, rel)) {
      if (git(repo, ['add', '-A', '--', p]).status !== 0) rc = 1;
    }
  }
  if (rc !== 0) bad('the guarded loop failed on a path that exists');
  if (stagedCount(repo, `${fd}/epic.md`) === 1) {
    ok('the guarded loop stages epic.md and skips the absent path');
  } else {
    bad('the guarded loop did not stage epic.md');
  }
}

// =============================================================================
// S2 — the checkpoint tag reaches the remote
// Guards: `git push --follow-tags` silently skipping a LIGHTWEIGHT tag, leaving
// the checkpoint invisible to a fresh clone with no error reported anywhere.
// =============================================================================
function s2() {
  head('S2 — the checkpoint tag reaches the remote');
  const repo = newRepo('s2');
  const fd = buildEpic(repo, '0099F-smoke', 'pending', 'YES');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'seed']);

  const remote = path.join(WORK, 's2-remote.git');
  git(WORK, ['init', '--bare', '--initial-branch=main', '-q', remote]);
  git(repo, ['remote', 'add', 'origin', remote]);
  git(repo, ['push', '-q', '-u', 'origin', 'main']);

  git(repo, ['tag', 'checkpoint/lightweight-probe']);
  git(repo, ['push', '-q', 'origin', 'main', '--follow-tags']);
  if (!remoteRefs(remote).some((ref) => ref && ref.includes('lightweight-probe'))) {
    ok('--follow-tags still skips a lightweight tag (the trap this guards is real)');
  } else {
    bad('--follow-tags pushed a lightweight tag — git behaviour changed; revisit the tag step');
  }

  git(repo, ['tag', '-a', 'checkpoint/0099F-smoke-SF02-done', '-m', 'checkpoint']);
  git(repo, ['push', '-q', 'origin', 'main', 'checkpoint/0099F-smoke-SF02-done']);
  if (remoteRefs(remote).some((ref) => ref && ref.includes('SF02-done'))) {
    ok('an annotated tag pushed BY NAME reaches the remote');
  } else {
    bad('the checkpoint tag did not reach the remote');
  }
  void fd;
}

// =============================================================================
// S3 — the epic.md row flip is INSIDE the commit the tag points at
// Guards: a checkpoint whose commit does not carry the status change, so the
// next invocation re-runs a subfeature that is already done.
// =============================================================================
function s3() {
  head('S3 — the epic.md row flip is INSIDE the commit the tag points at');
  const repo = newRepo('s3');
  const fd = buildEpic(repo, '0099F-smoke', 'pending', 'YES');
  flipSf02ToDone(repo, fd);
  git(repo, ['add', '-A']);
  git(repo, [
    'commit', '-q', '-m',
    [
      'feat(0099F-smoke-SF02): checkpoint',
      '',
      'GATE_REVIEW=ok',
      'GATE_QA_BASELINE=ok',
      'GATE_EPIC=ok',
      'GATE_COVERAGE=ok',
      'GATE_LEDGER=ok',
      'GATES_OK=5/5',
    ].join('\n'),
  ]);

  if (/epic\.md/.test(git(repo, ['show', '--stat', '--name-only', 'HEAD']).stdout)) {
    ok('epic.md is part of the checkpoint commit');
  } else {
    bad('epic.md is not in the checkpoint commit');
  }
  if (/\| SF02 \| Beta \| b \| done \|/.test(git(repo, ['show', `HEAD:${fd}/epic.md`]).stdout)) {
    ok("the row reads done in that commit's own tree, not only in the working tree");
  } else {
    bad('the row does not read done inside the commit');
  }
  const grepped = git(repo, ['log', '--grep=GATES_OK', '--oneline']).stdout.trim().split('\n').filter(Boolean);
  if (grepped.length >= 1) {
    ok('git log --grep=GATES_OK reconstructs the checkpoint from git alone');
  } else {
    bad('the gate receipt is not greppable from the commit message');
  }
}

// =============================================================================
// S4 — converge-gates passes a well-formed subfeature-scoped tree
// Guards: a gate that reads a path where the artefact does not live. Gate 4 once
// returned `missing` on every scoped run because it read the feature-level
// plan.md, which an epic does not have.
// =============================================================================
function s4() {
  head('S4 — converge-gates passes a well-formed subfeature-scoped tree');
  const repo = newRepo('s4');
  const fd = buildEpic(repo, '0098F-scoped', 'done', 'YES');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'seed']);

  const out = runNode(CONVERGE_GATES, [fd, 'SF02'], repo);
  const kv = parseKV(out.stdout);
  if (kv.GATE_COVERAGE === 'ok') {
    ok('gate 4 finds the SUBFEATURE plan.md on a scoped run');
  } else {
    bad('gate 4 did not find the subfeature plan', (out.stdout.match(/GATE_COVERAGE=.*/) || [''])[0]);
  }
  if (kv.GATE_EPIC === 'ok') {
    ok('gate 3 accepts a complete acceptance checklist on a scoped run');
  } else {
    bad('gate 3 rejected a complete scoped subfeature');
  }
}

// =============================================================================
// S5 — an epic-wide run aggregates coverage from the subfeature plans
// Guards: GATES_OK reading 2/5 on a perfectly healthy epic because the gate
// looked only at the feature root.
// =============================================================================
function s5() {
  head('S5 — an epic-wide run aggregates coverage from the subfeature plans');
  const repo = newRepo('s5');
  const fd = buildEpic(repo, '0097F-epic', 'done', 'YES');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'seed']);

  const out = runNode(CONVERGE_GATES, [fd], repo);
  if (parseKV(out.stdout).GATE_COVERAGE === 'ok') {
    ok('epic-wide coverage aggregates the SF plans');
  } else {
    bad('epic-wide coverage did not aggregate', (out.stdout.match(/GATE_COVERAGE=.*/) || [''])[0]);
  }

  const repoB = newRepo('s5b');
  const fdB = buildEpic(repoB, '0097F-uncov', 'done', 'NO');
  git(repoB, ['add', '-A']);
  git(repoB, ['commit', '-qm', 'seed']);
  const outB = runNode(CONVERGE_GATES, [fdB], repoB);
  if (parseKV(outB.stdout).GATE_COVERAGE === 'broken') {
    ok('an uncovered requirement in ANY subfeature plan is reported');
  } else {
    bad('an uncovered requirement was missed');
  }
}

// =============================================================================
// S6 — status and converge-gates agree about the same epic.md
// Guards: two readers of one file disagreeing about whether an epic is done.
// The blind spot: a Notes cell whose text happens to read `done`.
// =============================================================================
function s6() {
  head('S6 — status and converge-gates agree about the same epic.md');
  const repo = newRepo('s6');
  const fd = buildEpic(repo, '0096F-agree', 'pending', 'YES');
  // Poison the row the way only a string matcher would fall for.
  const file = path.join(repo, fd, 'epic.md');
  writeFile(file, fs.readFileSync(file, 'utf8').replace('| SF02 | Beta | b | pending | |', '| SF02 | Beta | b | pending | done |'));
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'seed']);
  git(repo, ['checkout', '-q', '-b', 'feature/0096F-agree']);

  const st = runNode(STATUS, [], repo);
  const cg = runNode(CONVERGE_GATES, [fd], repo);
  const prog = (st.stdout.match(/EPIC_PROGRESS:[0-9]+\/[0-9]+/) || [])[0];
  const pend = (cg.stdout.match(/EPIC_PENDING=.*/) || [])[0] || '';
  if (prog === 'EPIC_PROGRESS:1/2' && /SF02/.test(pend)) {
    ok(`both readers call SF02 pending despite a Notes cell reading done (${prog} · ${pend})`);
  } else {
    bad('the two readers disagree', `${prog} · ${pend}`);
  }
}

// ─── Runner ──────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(CONVERGE_GATES) || !fs.existsSync(STATUS)) {
    process.stderr.write(`smoke-test: native entries missing under ${SCRIPTS}\n`);
    process.exitCode = 1;
    return;
  }

  s1();
  s2();
  s3();
  s4();
  s5();
  s6();

  process.stdout.write('\n-----------------------------------------------------------\n');
  process.stdout.write(`smoke-test: ${PASS} passed, ${FAIL} failed\n`);
  if (FAIL !== 0) {
    process.stdout.write('A failure here is a SEAM defect — the unit suites will not catch it.\n');
  }
  process.exitCode = FAIL === 0 ? 0 : 1;
}

main();
