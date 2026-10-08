'use strict';
// Resolver for the workbench output mode (scripts/output-mode.js).
// Every case runs against a temp --root, so nothing is written in the checkout.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repo = path.resolve(__dirname, '..', '..');
const script = path.join(repo, 'scripts', 'output-mode.js');

function run({ env = {}, settings, root } = {}) {
  const dir = root || fs.mkdtempSync(path.join(os.tmpdir(), 'output-mode-'));
  if (settings !== undefined) {
    fs.mkdirSync(path.join(dir, 'workbench'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'workbench', 'settings.json'), settings);
  }
  const childEnv = { ...process.env, NODE_OPTIONS: '' };
  delete childEnv.CODEADD_OUTPUT;
  Object.assign(childEnv, env);
  const r = spawnSync(process.execPath, [script, '--root', dir], { env: childEnv, encoding: 'utf8' });
  if (!root) fs.rmSync(dir, { recursive: true, force: true });
  return { status: r.status, lines: r.stdout.split('\n').filter(Boolean), stdout: r.stdout, stderr: r.stderr };
}

test('no env and no file resolves to prose', () => {
  const r = run();
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=prose']);
});

test('settings file decides when the env is unset', () => {
  const r = run({ settings: '{"output":{"mode":"json"}}' });
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=json']);
});

test('env beats the settings file', () => {
  const r = run({ env: { CODEADD_OUTPUT: 'both' }, settings: '{"output":{"mode":"json"}}' });
  assert.deepEqual(r.lines, ['OUTPUT_MODE=both']);
});

test('invalid env is skipped with a warning and the file is read next', () => {
  const r = run({ env: { CODEADD_OUTPUT: 'xml' }, settings: '{"output":{"mode":"json"}}' });
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=json', 'OUTPUT_MODE_WARNING=env:xml']);
});

test('both sources invalid resolves to prose with two warnings', () => {
  const r = run({ env: { CODEADD_OUTPUT: 'xml' }, settings: '{"output":{"mode":"yaml"}}' });
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=prose', 'OUTPUT_MODE_WARNING=env:xml', 'OUTPUT_MODE_WARNING=settings:yaml']);
});

test('unparseable settings file is an invalid source, not a crash', () => {
  const r = run({ settings: '{not json' });
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=prose', 'OUTPUT_MODE_WARNING=settings:unparseable']);
});

test('settings file without output.mode resolves to prose with no warning', () => {
  for (const settings of ['{}', '{"output":{}}', '{"other":1}']) {
    const r = run({ settings });
    assert.equal(r.status, 0);
    assert.deepEqual(r.lines, ['OUTPUT_MODE=prose'], settings);
  }
});

test('stdout carries only KEY=VALUE lines and stderr stays empty', () => {
  for (const args of [{}, { env: { CODEADD_OUTPUT: 'zzz' } }, { settings: '{oops' }]) {
    const r = run(args);
    assert.equal(r.status, 0);
    for (const line of r.lines) assert.match(line, /^OUTPUT_MODE(_WARNING)?=\S*$/);
    assert.equal(r.stderr, '');
  }
});

test('the tracked workbench/settings.json resolves to prose', () => {
  const r = run({ root: repo });
  assert.equal(r.status, 0);
  assert.deepEqual(r.lines, ['OUTPUT_MODE=prose']);
});

test('resolve() is pure and exported', () => {
  const { resolve } = require(script);
  assert.deepEqual(resolve({ env: {}, settingsText: undefined }), { mode: 'prose', warnings: [] });
  assert.deepEqual(resolve({ env: { CODEADD_OUTPUT: 'both' } }), { mode: 'both', warnings: [] });
  assert.deepEqual(resolve({ env: {}, settingsText: '{"output":{"mode":"json"}}' }), { mode: 'json', warnings: [] });
  assert.deepEqual(resolve({ env: { CODEADD_OUTPUT: 'x' }, settingsText: 'nope' }).warnings, ['env:x', 'settings:unparseable']);
});
