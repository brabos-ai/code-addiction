const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('CI explicitly authorizes Linux workers and does not use native overrides', () => {
  const text = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.doesNotMatch(text, /CODEADD_TESTS_RUNNER:\s*native/);
  assert.match(text, /CODEADD_TESTS_CONTEXT: github-actions/);
  assert.ok(text.includes('CODEADD_TESTS_SELECTION: framework'));
  // 0075B F11: the board and board-e2e jobs and the board files guard step are gone.
  assert.doesNotMatch(text, /CODEADD_TESTS_SELECTION: board/);
  assert.doesNotMatch(text, /^  board(-e2e)?:/m);
  assert.doesNotMatch(text, /board-files-guard/);
});

