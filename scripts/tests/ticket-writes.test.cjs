'use strict';
// The board-write rules and the test-loss gate, as text in the workbench sources. Static reads only —
// nothing here writes in the checkout.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const PLAN_AUTHORING = 'workbench/skills/add-plan-authoring/SKILL.md';
const BUILD = 'workbench/skills/add-framework--build/SKILL.md';
const DONE = 'workbench/skills/add-framework--done/SKILL.md';

// The text from one heading to the next heading of the same or a higher level.
const section = (text, heading) => {
  const level = heading.match(/^#+/)[0].length;
  const start = text.indexOf(`${heading}\n`);
  assert.ok(start >= 0, `missing heading ${heading}`);
  const rest = text.slice(start + heading.length);
  const next = rest.search(new RegExp(`^#{1,${level}} `, 'm'));
  return next < 0 ? rest : rest.slice(0, next);
};
const flat = s => s.replace(/\s+/g, ' ');

test('The Ticket: in-review no longer waits on a PR, and a do-not-push never skips a board write', () => {
  const ticket = flat(section(read(PLAN_AUTHORING), '## The Ticket'));
  assert.ok(!ticket.includes('only when a PR was opened or already existed'));
  assert.match(ticket, /do not push/i);
  assert.match(ticket, /never skips a board write/i);
  assert.match(ticket, /whatever STEP 9 answered/);
});

test('build STEP 10 drops the "No writes nothing" rule and STEP 5.1 points at the do-not-push rule', () => {
  const build = read(BUILD);
  assert.ok(!flat(build).includes('"No" writes nothing'));
  assert.ok(!flat(build).includes("STEP 9's answer skipped it"));
  assert.match(flat(section(build, '### 5.1 The Ledger, First')), /do not push/i);
  assert.match(flat(section(build, '## STEP 10: Completion')), /every F-block/);
});

test('build STEP 9 and done STEP 2 both run the test-loss guard and stop on GUARD=fail', () => {
  for (const [file, heading] of [[BUILD, '## STEP 9: Publish [STOP]'], [DONE, '## STEP 2: Gates [HARD STOP]']]) {
    const body = section(read(file), heading);
    assert.ok(body.includes('test-loss-guard.cjs'), `${file}: script`);
    assert.ok(body.includes('GUARD=fail'), `${file}: GUARD=fail`);
    assert.ok(body.includes('git fetch origin main'), `${file}: fetch`);
  }
  assert.ok(section(read(DONE), '## STEP 9: Completion').includes('NOTED_TEST'));
  assert.ok(section(read(BUILD), '## STEP 10: Completion').includes('NOTED_TEST'));
});

test('done keeps its 2.x section names', () => {
  const done = read(DONE);
  for (const h of ['### 2.2 The ledger gate', '### 2.3 CI', '### 2.4 The Recovery Path', '### 2.5 The Resume Path']) {
    assert.ok(done.includes(h), h);
  }
});
