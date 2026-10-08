'use strict';
// The `codeadd-result` block: the validator against fixtures, the reference that documents it, the
// add-final-report section that owns the emission rule, and the stop-rule line each add-framework--*
// artefact carries. Static reads only — nothing here writes in the checkout.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { RESULT_KEYS, STATUSES, extractBlocks, validateResultBlock } = require('./result-block-schema.cjs');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const REFERENCE = 'workbench/skills/add-final-report/references/result-block.md';
const SKILL = 'workbench/skills/add-final-report/SKILL.md';
const STOP_RULE = 'On any STOP, load `add-final-report` and run `node scripts/output-mode.js`; when the mode is not `prose`, emit the result block with `status` and `reason` set.';

const block = obj => '```codeadd-result\n' + JSON.stringify(obj, null, 2) + '\n```';
const base = {
  v: 1, status: 'done', stage: 'add-framework--build', branch: 'feat/x', commits: ['a1b2c3d'],
  tests: { before: { passed: 10, failed: 0, skipped: 0 }, after: { passed: 12, failed: 0, skipped: 0 } },
  pr: { number: 7, url: 'https://github.com/o/r/pull/7' }, ci: 'success',
  ticket: { id: '0028B', status: 'in-review', sha: 'abc1234', pushed: true },
  next_step: '/add-framework--done docs/plans/x.md', needs_approval: false, reason: null,
};
const valid = {
  done: base,
  stopped: { ...base, status: 'stopped', pr: null, ci: null, ticket: null, tests: null, reason: 'gate 2.2: F3 has no complete line' },
  'needs-approval': { ...base, status: 'needs-approval', needs_approval: true, reason: 'waiting on the push approval' },
  failed: { ...base, status: 'failed', commits: [], branch: null, next_step: null, reason: 'build.js exited 1' },
};

test('every valid fixture passes, one per status', () => {
  assert.deepEqual(Object.keys(valid), STATUSES);
  for (const [status, obj] of Object.entries(valid)) {
    const r = validateResultBlock(block(obj));
    assert.deepEqual(r, { ok: true, reasons: [] }, status);
  }
});

test('null stands in for unknown, including the nullable members', () => {
  const allNull = { ...base, branch: null, tests: { before: null, after: null }, pr: null, ci: null, ticket: { id: '0028B', status: 'doing', sha: null, pushed: false }, next_step: null };
  assert.equal(validateResultBlock(block(allNull)).ok, true);
});

test('invalid fixtures fail with a named reason', () => {
  const { branch, ...noBranch } = base;
  const cases = [
    ['missing key', block(noBranch), /missing key branch/],
    ['extra key', block({ ...base, extra: 1 }), /extra key extra/],
    ['v: 2', block({ ...base, v: 2 }), /v must be 1/],
    ['unknown status', block({ ...base, status: 'ok' }), /status is not one of/],
    ['needs_approval mismatch', block({ ...valid['needs-approval'], needs_approval: false }), /exactly when status is needs-approval/],
    ['needs_approval on done', block({ ...base, needs_approval: true }), /exactly when status is needs-approval/],
    ['reason null on stopped', block({ ...valid.stopped, reason: null }), /reason must be non-null/],
    ['reason null on failed', block({ ...valid.failed, reason: null }), /reason must be non-null/],
    ['bad ci', block({ ...base, ci: 'green' }), /ci is not one of/],
    ['bad tests shape', block({ ...base, tests: { before: { passed: 1 }, after: null } }), /tests must be/],
    ['bad pr shape', block({ ...base, pr: { number: 7 } }), /pr must be/],
    ['bad ticket shape', block({ ...base, ticket: { id: '0028B' } }), /ticket must be/],
    ['commits not strings', block({ ...base, commits: [1] }), /commits must be/],
    ['wrong fence', block(base).replace('codeadd-result', 'json'), /found 0/],
    ['two fences', block(base) + '\n\n' + block(base), /found 2/],
    ['not json', '```codeadd-result\n{nope\n```', /not valid JSON/],
    ['array body', '```codeadd-result\n[]\n```', /not a JSON object/],
  ];
  for (const [name, text, want] of cases) {
    const r = validateResultBlock(text);
    assert.equal(r.ok, false, name);
    assert.match(r.reasons.join(' | '), want, name);
  }
});

test('the reference field table names exactly RESULT_KEYS, in order', () => {
  const ref = read(REFERENCE);
  const table = ref.split('\n').filter(l => /^\| `[a-z_]+` \|/.test(l)).map(l => l.match(/^\| `([a-z_]+)` \|/)[1]);
  assert.deepEqual(table, RESULT_KEYS);
});

test('the reference carries one valid example per status, plus the rules', () => {
  const ref = read(REFERENCE);
  const bodies = extractBlocks(ref);
  assert.equal(bodies.length, STATUSES.length);
  const seen = bodies.map(b => { const t = '```codeadd-result\n' + b + '\n```'; assert.equal(validateResultBlock(t).ok, true, t); return JSON.parse(b).status; });
  assert.deepEqual([...seen].sort(), [...STATUSES].sort());
  assert.match(ref, /every key is always present/i);
  assert.match(ref, /`null` for unknown/);
  assert.match(ref, /`needs_approval` is `true` exactly when `status` is `needs-approval`/);
  assert.match(ref, /`stage` is never empty\. `reason` is non-null and non-empty when `status` is not `done`/);
});

test('headless callers are told to allow the resolver, and this repository does', () => {
  assert.match(read(REFERENCE), /## Headless callers[\s\S]*Bash\(node scripts\/output-mode\.js\)[\s\S]*falls to `prose`/);
  const settings = JSON.parse(read('.claude/settings.json'));
  assert.ok(settings.permissions.allow.includes('Bash(node scripts/output-mode.js)'));
});

test('add-final-report states the prose-mode stop and leaves the status meanings to the reference', () => {
  const skill = read(SKILL);
  assert.match(skill, /\| `prose` \|[^\n]*A mid-run STOP prints exactly what it printed before/);
  assert.doesNotMatch(skill, /`stopped` at a gate or hard stop/);
  assert.match(skill, /`references\/result-block\.md` states what each means/);
});

test('add-final-report owns the emission rule and points at the reference without copying the table', () => {
  const skill = read(SKILL);
  assert.match(skill, /^## The Result Block$/m);
  const section = skill.split(/^## The Result Block$/m)[1].split(/^## /m)[0];
  for (const needle of ['scripts/output-mode.js', 'references/result-block.md', '`prose`', '`json`', '`both`', STOP_RULE]) assert.ok(section.includes(needle), needle);
  assert.match(section, /falls? to `prose`/);
  assert.match(section, /never shown|is not shown/);
  assert.doesNotMatch(skill, /^\| `needs_approval` \|/m);
  const position = skill.split('**Position:**')[1].split('\n\n')[0];
  assert.match(position, /`both`/);
  assert.match(position, /last thing printed/);
  assert.match(position, /`json`/);
  assert.match(position, /`next_step`/);
});

// Derived from disk, so a future add-framework--* artefact fails here until it carries the line.
function stageArtefacts() {
  const out = [];
  for (const d of fs.readdirSync(path.join(root, 'workbench', 'skills'))) if (d.startsWith('add-framework--')) out.push(`workbench/skills/${d}/SKILL.md`);
  for (const f of fs.readdirSync(path.join(root, 'workbench', 'commands'))) if (f.startsWith('add-framework--') && f.endsWith('.md')) out.push(`workbench/commands/${f}`);
  return out;
}

test('no add-framework--* artefact carries the 0028B output-mode wording', () => {
  const files = stageArtefacts();
  assert.ok(files.length > 0);
  for (const name of ['brainstorm', 'plan', 'build', 'done', 'backlog', 'release', 'sync']) {
    assert.ok(files.some(f => f.includes(`add-framework--${name}`)), `missing ${name}`);
  }
  for (const f of files) {
    const text = read(f);
    for (const needle of ['output-mode.js', 'result block', '`both` mode']) assert.ok(!text.includes(needle), `${f}: ${needle}`);
  }
});

test('no add-framework--* artefact restates the field table', () => {
  for (const f of stageArtefacts()) assert.doesNotMatch(read(f), /^\| `(needs_approval|next_step)` \|/m, f);
});

test('add-final-report never forbids an early load without the STOP and early-exit exception', () => {
  const text = read(SKILL);
  const description = text.match(/^description: "(.*)"$/m)[1];
  const guard = text.match(/```\nIF THE COMMAND IS[\s\S]*?```/)[0];
  for (const [name, part] of [['description', description], ['load guard', guard]]) {
    assert.match(part, /STOP/, `${name} must name STOP`);
    assert.match(part, /early exit/i, `${name} must name the early exit`);
  }
  assert.doesNotMatch(description, /not at the first/i, 'description must not ban the early load outright');
  assert.match(guard, /✅ DO: Load this at that STOP or early exit/, 'guard must tell the agent to load at a STOP');
});
