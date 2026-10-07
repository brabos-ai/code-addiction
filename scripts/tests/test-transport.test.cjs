'use strict';
// =============================================================================
// test-transport.test.cjs — pack() must never hand tar a path through `-f`.
//
// GNU tar reads `C:` in `-f C:/x.tar` as a remote host ("C"). pack() therefore
// writes the archive to stdout (`-f -`) into a file it opened itself.
//
// pack() runs in a child process so the tar argv can be recorded: the child
// wraps child_process.spawnSync before test-transport.cjs is required.
//
// Run: node --test scripts/tests/test-transport.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const TRANSPORT = path.resolve(__dirname, '..', 'test-transport.cjs');

const CHILD = `
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

    const res = spawnSync(process.execPath, ['-e', CHILD, TRANSPORT, root, target, scratch], { cwd: work, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } });
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
