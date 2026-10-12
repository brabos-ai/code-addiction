'use strict';
// The internal build creates its own feature branch when it starts on main, instead of asking.
// A static read of the skill source — nothing here writes in the checkout.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const SKILL = fs.readFileSync(path.join(root, 'workbench/skills/add-framework--build/SKILL.md'), 'utf8');
const step13 = SKILL.slice(SKILL.indexOf('### 1.3'), SKILL.indexOf('## STEP 2'));

test('STEP 1.3 creates the branch on main as feat/<slug> from the plan slug', () => {
  assert.ok(step13.includes('`main`'), 'names main');
  assert.ok(step13.includes('feat/<slug>'), 'feat/<slug>');
  assert.match(step13, /PLAN--/, 'the plan slug comes after PLAN--');
  assert.match(step13, /never ask/, 'never asks');
});

test('STEP 9 no longer says the skill never creates a branch, and keeps the push guards', () => {
  assert.ok(!SKILL.includes('never creates a branch'), 'never creates a branch');
  assert.match(SKILL, /IF THE CURRENT BRANCH IS main:/);
  assert.match(SKILL, /IF THE BRANCH HAS NO PR AND THE USER HAS NOT ANSWERED/);
});
