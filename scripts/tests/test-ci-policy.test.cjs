const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('CI explicitly authorizes Linux workers and does not use native overrides', () => {
  const text = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.doesNotMatch(text, /CODEADD_TESTS_RUNNER:\s*native/);
  assert.match(text, /CODEADD_TESTS_CONTEXT: github-actions/);
  for (const suite of ['framework', 'board', 'board-e2e']) assert.ok(text.includes(`CODEADD_TESTS_SELECTION: ${suite}`));
});
