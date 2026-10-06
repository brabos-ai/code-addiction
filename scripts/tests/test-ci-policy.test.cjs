const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('CI explicitly authorizes Linux workers and does not use native overrides', () => {
  const text = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.doesNotMatch(text, /CODEADD_TESTS_RUNNER:\s*native/);
  assert.match(text, /CODEADD_TESTS_CONTEXT: github-actions/);
  for (const suite of ['framework', 'board', 'board-e2e']) assert.ok(text.includes(`CODEADD_TESTS_SELECTION: ${suite}`));
});
test('direct board tools reject absent context before fixture mutation', () => {
  const path = require('node:path'); const { spawnSync } = require('node:child_process');
  const cwd = path.resolve('board');
  for (const tool of [['node_modules/vitest/vitest.mjs', 'run', 'execution-policy'], ['node_modules/@playwright/test/cli.js', 'test', '--list']]) {
    const result = spawnSync(process.execPath, tool, { cwd, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '', CODEADD_TESTS_CONTEXT: '', CODEADD_TESTS_SELECTION: '', CODEADD_TESTS_LEAF: '', CI: 'true', CODEADD_TESTS_COPY: '1' } });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /REFUSED|Unauthorized/);
  }
});
