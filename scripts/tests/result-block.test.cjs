'use strict';
// The result block's JSON Schema and the validator read from it, the call doc that points at the
// schema, and the 0028B output mode staying gone from every stage artefact. Static reads only —
// nothing here writes in the checkout.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SCHEMA, RESULT_KEYS, STATUSES, validateResultBlock } = require('./result-block-schema.cjs');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const SKILL = 'workbench/skills/add-final-report/SKILL.md';
const SCHEMA_FILE = 'workbench/skills/add-final-report/references/result-block.schema.json';

const text = obj => JSON.stringify(obj, null, 2);
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

test('the schema file parses, is closed, and describes every property', () => {
  const parsed = JSON.parse(read(SCHEMA_FILE));
  // the CLI rejects the 2020-12 meta-schema passed through --json-schema
  assert.ok(!('$schema' in parsed), 'schema must not carry a $schema key');
  assert.equal(parsed.title, 'codeadd result v1');
  assert.deepEqual(parsed.required, ['v', 'status', 'stage', 'branch', 'commits', 'tests', 'pr', 'ci', 'ticket', 'next_step', 'needs_approval', 'reason']);
  assert.deepEqual(Object.keys(parsed.properties), parsed.required);
  const walk = (node, where) => {
    if (!node || typeof node !== 'object' || !node.properties) return;
    assert.equal(node.additionalProperties, false, `${where}: additionalProperties`);
    for (const [key, prop] of Object.entries(node.properties)) {
      assert.ok(typeof prop.description === 'string' && prop.description, `${where}.${key}: description`);
      walk(prop, `${where}.${key}`);
    }
  };
  walk(parsed, 'root');
  assert.deepEqual(SCHEMA, parsed);
});

test('RESULT_KEYS and STATUSES come from the schema', () => {
  assert.deepEqual(RESULT_KEYS, SCHEMA.required);
  assert.deepEqual(STATUSES, SCHEMA.properties.status.enum);
  assert.deepEqual(STATUSES, ['done', 'stopped', 'needs-approval', 'failed']);
});

test('every valid fixture passes, one per status', () => {
  assert.deepEqual(Object.keys(valid), STATUSES);
  for (const [status, obj] of Object.entries(valid)) {
    const r = validateResultBlock(text(obj));
    assert.deepEqual(r, { ok: true, reasons: [] }, status);
  }
});

test('null stands in for unknown, including the nullable members', () => {
  const allNull = { ...base, branch: null, tests: { before: null, after: null }, pr: null, ci: null, ticket: { id: '0028B', status: 'doing', sha: null, pushed: false }, next_step: null };
  assert.equal(validateResultBlock(text(allNull)).ok, true);
});

test('invalid fixtures fail with a named reason', () => {
  const { branch, ...noBranch } = base;
  const cases = [
    ['missing key', text(noBranch), /missing key branch/],
    ['extra key', text({ ...base, extra: 1 }), /extra key extra/],
    ['v: 2', text({ ...base, v: 2 }), /v must be 1/],
    ['unknown status', text({ ...base, status: 'ok' }), /status is not one of/],
    ['bad ci', text({ ...base, ci: 'green' }), /ci is not one of/],
    ['bad tests shape', text({ ...base, tests: { before: { passed: 1 }, after: null } }), /tests\.before: missing key failed/],
    ['non-integer count', text({ ...base, tests: { before: { passed: 1.5, failed: 0, skipped: 0 }, after: null } }), /tests\.before\.passed must be integer/],
    ['bad pr shape', text({ ...base, pr: { number: 7 } }), /pr: missing key url/],
    ['bad ticket shape', text({ ...base, ticket: { id: '0028B' } }), /ticket: missing key status/],
    ['ticket extra key', text({ ...base, ticket: { ...base.ticket, extra: 1 } }), /ticket: extra key extra/],
    ['commits not strings', text({ ...base, commits: [1] }), /commits\[0\] must be string/],
    ['commits not an array', text({ ...base, commits: 'a1b2c3d' }), /commits must be array/],
    ['needs_approval not boolean', text({ ...base, needs_approval: 'no' }), /needs_approval must be boolean/],
    ['not json', '{nope', /not valid JSON/],
    ['array body', '[]', /not a JSON object/],
  ];
  for (const [name, body, want] of cases) {
    const r = validateResultBlock(body);
    assert.equal(r.ok, false, name);
    assert.match(r.reasons.join(' | '), want, name);
  }
});

test('the resolver and its settings file are gone, and nothing allows the resolver', () => {
  assert.ok(!fs.existsSync(path.join(root, 'scripts', 'output-mode.js')));
  assert.ok(!fs.existsSync(path.join(root, 'workbench', 'settings.json')));
  const settings = JSON.parse(read('.claude/settings.json'));
  assert.ok(!settings.permissions.allow.some(entry => entry.includes('output-mode')));
  assert.doesNotMatch(read('AGENTS.md'), /output-mode|workbench\/settings\.json/);
});

// Derived from disk, so a future add-framework--* artefact is checked without a list to update.
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

test('add-final-report is back to its last-step load rule, and building-commands says so too', () => {
  const text = read(SKILL);
  const description = text.match(/^description: "(.*)"$/m)[1];
  const guard = text.match(/```\nIF THE COMMAND IS[\s\S]*?```/)[0];
  assert.ok(description.includes('Load at the last step, not at the first.'), 'description');
  assert.doesNotMatch(guard, /early exit/i, 'guard');
  assert.doesNotMatch(text, /^## The Result Block$/m);
  assert.doesNotMatch(read('workbench/skills/building-commands/SKILL.md'), /any STOP or early exit/);
});

test('the call doc points at the schema file and says how to pass it to the CLI', () => {
  const doc = read('workbench/skills/add-final-report/references/result-block.md');
  for (const needle of ['result-block.schema.json', '--output-format json', '--json-schema', 'structured_output']) assert.ok(doc.includes(needle), needle);
  assert.match(doc, /path is not accepted/i);
  assert.ok(doc.includes("-replace '\"','\\\"'"), 'PowerShell 5.1 escape');
  assert.doesNotMatch(doc, /\| `v` \|/, 'the doc must not restate the field table');
  assert.doesNotMatch(doc, /## Headless callers/);
});

test('no markdown under workbench/ mentions the 0028B output mode', () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.md') ? [path.join(dir, e.name)] : []));
  for (const file of walk(path.join(root, 'workbench'))) {
    const body = fs.readFileSync(file, 'utf8');
    for (const needle of ['CODEADD_OUTPUT', 'output-mode.js', 'codeadd-result']) assert.ok(!body.includes(needle), `${path.relative(root, file)}: ${needle}`);
  }
});
