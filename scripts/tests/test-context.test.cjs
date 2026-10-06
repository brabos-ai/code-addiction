const { test } = require('node:test');
const assert = require('node:assert/strict');
const context = require('../test-context.cjs');
test('all local platforms require docker and native overrides refuse', () => {
  for (const platform of ['linux', 'darwin', 'win32']) assert.equal(context.resolveRunner({ platform, env: {} }).runner, 'docker');
  assert.throws(() => context.resolveRunner({ platform: 'linux', env: { CODEADD_TESTS_RUNNER: 'native' } }), /native/);
});
test('receipt binds canonical outer request and exact deterministic leaves', () => {
  const env = { CODEADD_TESTS_CONTEXT: 'container', CODEADD_TESTS_SELECTION: 'framework', CODEADD_TESTS_LEAF: 'cli' };
  const receipt = { v: 1, context: 'container', selection: 'framework', leaves: ['cli', 'scripts', 'package'] };
  for (const leaf of ['cli', 'package']) assert.equal(context.refusal({ platform: 'linux', env: { ...env, CODEADD_TESTS_LEAF: leaf }, selection: 'framework', leaf, receipt }), null);
  assert.match(context.refusal({ platform: 'linux', env, selection: 'all', receipt }), /selection/);
  assert.match(context.refusal({ platform: 'linux', env, selection: 'framework', leaf: 'board', receipt }), /leaf/);
  assert.match(context.refusal({ platform: 'linux', env, selection: 'framework', receipt: { ...receipt, leaves: ['cli', 'board'] } }), /leaves/);
  const all = { ...receipt, selection: 'all', leaves: ['cli', 'scripts', 'package', 'board', 'board-e2e'] };
  for (const leaf of ['board', 'board-e2e']) assert.equal(context.refusal({ platform: 'linux', env: { ...env, CODEADD_TESTS_SELECTION: 'all', CODEADD_TESTS_LEAF: leaf }, selection: 'all', leaf, receipt: all }), null);
  assert.equal(context.canonicalSuite('vitest'), 'cli'); assert.equal(context.canonicalSuite('bats'), 'scripts');
});
test('generic flags, absent or malformed receipts and incomplete CI refuse', () => {
  for (const env of [{ CI: 'true' }, { CODEADD_TESTS_COPY: '1' }, { GITHUB_ACTIONS: 'true', CI: 'true' }, { CODEADD_TESTS_CONTEXT: 'container' }, { CODEADD_TESTS_CONTEXT: 'unknown' }]) assert.ok(context.refusal({ platform: 'linux', env, selection: 'cli', receipt: null }));
  const env = { CODEADD_TESTS_CONTEXT: 'github-actions', GITHUB_ACTIONS: 'true', CI: 'true' };
  assert.equal(context.refusal({ platform: 'linux', env, selection: 'cli' }), null);
  assert.ok(context.refusal({ platform: 'win32', env, selection: 'cli' }));
  assert.ok(context.refusal({ platform: 'linux', env: { ...env, CI: undefined }, selection: 'cli' }));
  const containerEnv = { CODEADD_TESTS_CONTEXT: 'container', CODEADD_TESTS_SELECTION: 'cli', CODEADD_TESTS_LEAF: 'cli', CI: 'true', GITHUB_ACTIONS: 'true' };
  const receipt = { v: 1, context: 'container', selection: 'cli', leaves: ['cli'] };
  assert.equal(context.refusal({ platform: 'linux', env: containerEnv, selection: 'cli', leaf: 'cli', receipt }), null);
  assert.ok(context.refusal({ platform: 'linux', env: { ...containerEnv, CODEADD_TESTS_CONTEXT: 'github-actions', GITHUB_ACTIONS: undefined }, selection: 'cli', receipt }));
});
