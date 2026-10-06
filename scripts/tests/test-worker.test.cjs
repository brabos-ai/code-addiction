const { test } = require('node:test');
const assert = require('node:assert/strict');
const worker = require('../test-worker.cjs');
test('groups run every leaf and preserve first failure, preparation is identified', async () => {
  const seen = [];
  const result = await worker.runSelection({ selection: 'all', extra: [], mode: 'run', root: require('node:path').resolve(__dirname, '../..'), authorize: () => {}, execute: async ({ leaf, preparation }) => { seen.push([leaf, preparation]); return !preparation && leaf === 'cli' ? 17 : 0; } });
  assert.equal(result, 17);
  assert.deepEqual(seen.filter(([, prep]) => !prep).map(([leaf]) => leaf), ['cli', 'scripts', 'package', 'board', 'board-e2e']);
  assert.ok(seen.some(([leaf, prep]) => leaf === 'board-e2e' && prep));
});
test('argv remains data; individual filters and group/package refusal', () => {
  const args = ['some file', '--testNamePattern', "a'; echo bad; # Ω"];
  const spec = worker.toolSpec({ leaf: 'cli', root: '/fixture', extra: args, mode: 'run' });
  assert.deepEqual(spec.args.slice(-args.length), args); assert.equal(spec.shell, false);
  for (const selection of ['all', 'framework', 'package']) assert.throws(() => worker.validateRequest({ selection, extra: ['filter'], mode: 'run' }), /filter|argument/);
  assert.throws(() => worker.validateRequest({ selection: 'board', extra: [], mode: 'watch' }), /CLI/);
});
test('scripts name filters cannot turn skipped-only result into green', () => {
  assert.equal(worker.noTestsSelected('scripts', '# tests 3\n# pass 0\n# fail 0\n# skipped 3\n'), true);
  assert.equal(worker.noTestsSelected('scripts', '# tests 3\n# pass 2\n# fail 0\n# skipped 1\n'), false);
});
test('real subprocess preserves hostile arguments and no-match CLI/scripts never pass', async () => {
  const root = require('node:path').resolve(__dirname, '../..');
  const hostile = ['space value', "a'; touch /tmp/codeadd-injection; #", 'Ω'];
  const echo = await worker.executeProcess({ file: process.execPath, args: ['-e', 'console.log(JSON.stringify(process.argv.slice(1)))', ...hostile], cwd: root }, { ...process.env, NODE_OPTIONS: '' });
  assert.equal(echo.code, 0); assert.deepEqual(JSON.parse(echo.output.trim()), hostile);
  const cli = await worker.executeProcess(worker.toolSpec({ leaf: 'cli', root, extra: ['does-not-exist-codeadd-unique'] }), { ...process.env, NODE_OPTIONS: '' });
  assert.notEqual(cli.code, 0);
  const code = await worker.runSelection({ selection: 'scripts', extra: ['--test-name-pattern=does-not-exist-codeadd-unique', 'scripts/tests/test-context.test.cjs'], root, authorize: () => {} });
  assert.notEqual(code, 0);
});
