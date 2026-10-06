const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const transport = require('../test-transport.cjs');
test('snapshot excludes deps/generated/nested checkouts and tracks edits, additions and deletions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-source-'));
  try {
    fs.mkdirSync(path.join(root, 'nested/.git'), { recursive: true });
    fs.writeFileSync(path.join(root, 'nested/private'), 'private');
    fs.mkdirSync(path.join(root, 'cli/node_modules'), { recursive: true });
    fs.writeFileSync(path.join(root, 'cli/node_modules/private'), 'host');
    fs.writeFileSync(path.join(root, 'a'), 'one');
    const before = transport.snapshot(root);
    assert.deepEqual([...before.keys()], ['a']);
    fs.writeFileSync(path.join(root, 'a'), 'two'); fs.writeFileSync(path.join(root, 'b'), 'new');
    const changed = transport.diffSnapshots(before, transport.snapshot(root));
    assert.deepEqual(changed.changed.sort(), ['a', 'b']);
    fs.unlinkSync(path.join(root, 'a'));
    assert.deepEqual(transport.diffSnapshots(before, transport.snapshot(root)).deleted, ['a']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('cache hashes every named manifest and image input; export error preserves failures', () => {
  const input = { dockerfile: 'x', 'package.json': 'a', 'package-lock.json': 'b', 'cli/package.json': 'c', 'cli/package-lock.json': 'd', 'board/package.json': 'e', 'board/package-lock.json': 'f' };
  for (const key of Object.keys(input)) assert.notEqual(transport.imageTag(input), transport.imageTag({ ...input, [key]: input[key] + '!' }));
  assert.equal(transport.exportStatus(17, true), 17); assert.equal(transport.exportStatus(0, true), 2);
});
test('missing Docker refuses with no native substitute; worktree Git metadata is remapped read-only', () => {
  const root = path.resolve(__dirname, '../..');
  const child = require('node:child_process').spawnSync(process.execPath, [path.join(root, 'scripts/run-tests.js'), 'cli'], { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '', CODEADD_TESTS_CONTEXT: '', CODEADD_TESTS_RUNNER: '', PATH: '/nonexistent' } });
  assert.equal(child.status, 2); assert.match(child.stderr, /docker.*unavailable/); assert.doesNotMatch(child.stdout, /RUN.*vitest/);
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'git-map-'));
  try {
    const common = path.join(base, 'main/.git'); const admin = path.join(common, 'worktrees/feature'); const checkout = path.join(base, 'checkout');
    fs.mkdirSync(admin, { recursive: true }); fs.mkdirSync(checkout);
    fs.writeFileSync(path.join(admin, 'commondir'), '../..'); fs.writeFileSync(path.join(checkout, '.git'), `gitdir: ${admin}\n`);
    const mapped = transport.worktreeGit(checkout);
    assert.equal(mapped.commonDir, common); assert.equal(mapped.gitFile, 'gitdir: /gitcommon/worktrees/feature\n');
    const mounts = transport.gitMounts(checkout, base); assert.ok(mounts.every((value, index) => index % 2 === 0 ? value === '-v' : value.endsWith(':ro')));
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});
