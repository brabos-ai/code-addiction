'use strict';
// scripts/test-loss-guard.cjs on throwaway git repositories. Each case builds a repository in a temp
// directory, commits a base on `main`, branches, and removes the temp directory at the end.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { makeRepo, write, runRootScript } = require('./helpers.cjs');

const F = 't/a.test.cjs';
const src = names => names.map(n => `test('${n}', () => {});`).join('\n') + '\n';

// A repository whose `main` holds `files`, with `feat` checked out one commit later.
function fixture(files) {
  const r = makeRepo();
  for (const [rel, body] of Object.entries(files)) write(path.join(r.repo, rel), body);
  r.git('add', '-A');
  r.git('commit', '-q', '-m', 'base');
  r.git('switch', '-q', '-c', 'feat');
  return r;
}
function commit(r, msg, ...trailers) {
  r.git('add', '-A');
  const args = ['commit', '-q', '--allow-empty', '-m', msg];
  for (const t of trailers) args.push('-m', t);
  const res = r.git(...args);
  assert.equal(res.status, 0, res.output);
}
const guard = (r, args = []) => {
  const out = runRootScript('test-loss-guard', args, { cwd: r.repo });
  const lines = out.stdout.split(/\r?\n/).filter(Boolean);
  const kv = key => (lines.find(l => l.startsWith(`${key}=`)) || '').slice(key.length + 1);
  const all = key => lines.filter(l => l.startsWith(`${key}=`)).map(l => l.slice(key.length + 1));
  return { out, kv, all };
};
const withRepo = (files, fn) => {
  const r = fixture(files);
  try { fn(r); } finally { r.cleanup(); }
};

test('1. no test file changed passes', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    commit(r, 'empty');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('LOST'), '0');
    assert.equal(g.out.status, 0);
  });
});

test('2. a deleted test fails and is named', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    write(path.join(r.repo, F), src(['b']));
    commit(r, 'drop a');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'fail');
    assert.equal(g.kv('LOST'), '1');
    assert.deepEqual(g.all('LOST_TEST'), [`${F}::a`]);
    assert.equal(g.out.status, 1);
  });
});

test('3. a Test-Removed trailer covers the loss', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    write(path.join(r.repo, F), src(['b']));
    commit(r, 'drop a', `Test-Removed: ${F}::a — replaced by b`);
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('NOTED'), '1');
    assert.deepEqual(g.all('NOTED_TEST'), [`${F}::a`]);
    assert.equal(g.out.status, 0);
  });
});

test('4. a deleted file needs the ::* trailer', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    r.git('rm', '-q', F);
    commit(r, 'drop file');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'fail');
    assert.deepEqual(g.all('LOST_TEST').sort(), [`${F}::a`, `${F}::b`]);
    commit(r, 'note', `Test-Removed: ${F}::* — suite retired`);
    const noted = guard(r);
    assert.equal(noted.kv('GUARD'), 'pass');
    assert.equal(noted.kv('NOTED'), '2');
  });
});

test('5. a renamed file with the same tests passes', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    r.git('mv', F, 't/b.test.cjs');
    commit(r, 'rename');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('LOST'), '0');
  });
});

test('6. a test moved verbatim to another file is MOVED, not lost', () => {
  withRepo({ [F]: src(['a', 'b']), 't/c.test.cjs': src(['c']) }, r => {
    write(path.join(r.repo, F), src(['b']));
    write(path.join(r.repo, 't/c.test.cjs'), src(['c', 'a']));
    commit(r, 'move a');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('MOVED'), '1');
    assert.equal(g.kv('LOST'), '0');
  });
});

test('7. a test main gained after the branch point is not a loss', () => {
  const r = fixture({ [F]: src(['a']) });
  try {
    commit(r, 'on feat');
    r.git('switch', '-q', 'main');
    write(path.join(r.repo, 't/new.test.cjs'), src(['n']));
    commit(r, 'main gains n');
    r.git('switch', '-q', 'feat');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('LOST'), '0');
  } finally { r.cleanup(); }
});

test('8. skip is not a loss; a duplicated name losing a copy is', () => {
  withRepo({ [F]: src(['a']) }, r => {
    write(path.join(r.repo, F), "test.skip('a', () => {});\n");
    commit(r, 'skip a');
    assert.equal(guard(r).kv('GUARD'), 'pass');
  });
  withRepo({ [F]: src(['a', 'a']) }, r => {
    write(path.join(r.repo, F), src(['a']));
    commit(r, 'one copy gone');
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'fail');
    assert.equal(g.kv('LOST'), '1');
  });
});

test('9. template literals, multi-line calls, .each and quote style', () => {
  const body = "test(`tpl name`, () => {});\ntest(\n  'split',\n  () => {},\n);\nit.each(X)('%s name', () => {});\ntest('q', () => {});\n";
  withRepo({ [F]: body }, r => {
    commit(r, 'empty');
    const g = guard(r);
    assert.equal(g.kv('TESTS_BASE'), '4');
    assert.equal(g.kv('TESTS_HEAD'), '4');
    write(path.join(r.repo, F), body.replace("test('q'", 'test("q"'));
    commit(r, 'quote style');
    assert.equal(guard(r).kv('GUARD'), 'pass');
    write(path.join(r.repo, F), body.replace(/it\.each[^\n]*\n/, ''));
    commit(r, 'drop each');
    assert.deepEqual(guard(r).all('LOST_TEST'), [`${F}::%s name`]);
  });
});

test('10. an uncommitted deletion is never read', () => {
  withRepo({ [F]: src(['a', 'b']) }, r => {
    write(path.join(r.repo, F), src(['b']));
    const g = guard(r);
    assert.equal(g.kv('GUARD'), 'pass');
    assert.equal(g.kv('LOST'), '0');
  });
});

test('11. an unknown ref is a caller error', () => {
  withRepo({ [F]: src(['a']) }, r => {
    const g = guard(r, ['--base', 'no-such-ref']);
    assert.equal(g.out.status, 2);
  });
});
