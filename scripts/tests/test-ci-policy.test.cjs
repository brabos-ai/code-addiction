const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('CI explicitly authorizes Linux workers and does not use native overrides', () => {
  const text = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  assert.doesNotMatch(text, /CODEADD_TESTS_RUNNER:\s*native/);
  assert.match(text, /CODEADD_TESTS_CONTEXT: github-actions/);
  for (const suite of ['framework', 'board', 'board-e2e']) assert.ok(text.includes(`CODEADD_TESTS_SELECTION: ${suite}`));
});

test('board job and its Playwright install step declare timeout-minutes above a normal run', () => {
  const text = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  const job = text.match(/^  board:\n([\s\S]*?)(?=^  \S|(?![\s\S]))/m)[1];
  const jobMinutes = Number(job.match(/^    timeout-minutes:\s*(\d+)/m)?.[1]);
  assert.ok(jobMinutes >= 10 && jobMinutes <= 60, `job timeout-minutes ${jobMinutes}`);
  const step = job.match(/- name: Install Playwright Chromium\n([\s\S]*?)(?=\n      - name:|(?![\s\S]))/)[1];
  const stepMinutes = Number(step.match(/timeout-minutes:\s*(\d+)/)?.[1]);
  assert.ok(stepMinutes >= 5 && stepMinutes < jobMinutes, `step timeout-minutes ${stepMinutes}`);
});
