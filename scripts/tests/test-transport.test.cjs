const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

// pack() must never hand tar a path through `-f`: GNU tar reads `C:` in `-f C:/x.tar` as a remote
// host ("C"), so pack() writes the archive to stdout (`-f -`) into a file it opened itself.
// pack() runs in a child process so the tar argv can be recorded: the child wraps
// child_process.spawnSync before test-transport.cjs is required.
const TRANSPORT = path.resolve(__dirname, '..', 'test-transport.cjs');

const PACK_CHILD = `
const cp = require('node:child_process');
const real = cp.spawnSync;
const seen = [];
cp.spawnSync = (file, args, options) => { if (file === 'tar') seen.push(args); return real(file, args, options); };
const { pack } = require(process.argv[1]);
const [root, target, scratch] = process.argv.slice(2);
pack(root, ['a.txt'], target, scratch);
process.stdout.write(JSON.stringify(seen));
`;

test('pack writes the archive without passing the target to tar -f', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'transport-pack-'));
  try {
    const root = path.join(tmp, 'root'); const scratch = path.join(tmp, 'scratch'); const work = path.join(tmp, 'work');
    for (const dir of [root, scratch, work]) fs.mkdirSync(dir);
    fs.writeFileSync(path.join(root, 'a.txt'), 'hello');
    // A folder named `C:` makes the target look like a drive path to tar; Windows cannot create one,
    // so there the target is a real absolute drive path instead.
    let target;
    if (process.platform === 'win32') target = path.join(work, 'tree.tar');
    else { fs.mkdirSync(path.join(work, 'C:')); target = 'C:/tree.tar'; }

    const res = spawnSync(process.execPath, ['-e', PACK_CHILD, TRANSPORT, root, target, scratch], { cwd: work, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });
    assert.equal(res.status, 0, `pack exited ${res.status}\n${res.stderr}`);

    const archive = path.resolve(work, target);
    const head = fs.readFileSync(archive).subarray(257, 262).toString('latin1');
    assert.equal(head, 'ustar');

    const calls = JSON.parse(res.stdout);
    assert.equal(calls.length, 1);
    const args = calls[0];
    assert.equal(args[args.indexOf('-f') + 1], '-');
    for (const arg of args) {
      assert.ok(!path.isAbsolute(arg) && !/^[A-Za-z]:/.test(arg), `tar argument looks like a path: ${arg}`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
