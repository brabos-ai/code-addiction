'use strict';
// =============================================================================
// NATIVE PORT — log-iteration (F27). F17 resolves this entry's disposition,
// but its Bats cases must still be characterized.
// =============================================================================
// Ported from framwork/.codeadd/scripts/tests/log-iteration.bats (15 cases).
// The native entry takes <type> <slug> <what> <files> [cmd] [--feature N]
// [--epic name] and preserves the iterations.md format, the `/dev` default
// command, the 60-character `what` truncation, the feature-branch detection and
// the `ERROR:<slug>` exit-1 failures.
//
// ⛔ RED IS EXPECTED: log-iteration.cjs does not exist yet (and F17 may retire
//    it, in which case these cases move with an approved disposition).
//
// Run: node --test scripts/tests/log-iteration.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const h = require('./helpers.cjs');

const FEATURE_ID = '0001F-test';
const ITERATIONS = 'docs/features/0001F-test/iterations.md';

const abs = (repo, rel) => path.join(repo, rel);

/** The Bats fixture: a feature directory on `feature/<id>`. */
function featureRepo() {
  const { repo, git, cleanup } = h.makeRepo();
  fs.mkdirSync(abs(repo, `docs/features/${FEATURE_ID}`), { recursive: true });
  git('checkout', '-b', `feature/${FEATURE_ID}`, '-q');
  return { repo, git, cleanup };
}

const iterationsText = (repo) => h.read(abs(repo, ITERATIONS));

test('log-iteration#001 creates iterations.md and logs first iteration', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', ['fix', 'save-btn', 'fix validation', 'api/ctrl.ts'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('LOGGED:I1'));
    assert.ok(res.stdout.includes('FEATURE:0001F-test'));
    assert.equal(fs.existsSync(abs(repo, ITERATIONS)), true);
  } finally {
    cleanup();
  }
});

test('log-iteration#002 increments iteration number', () => {
  const { repo, cleanup } = featureRepo();
  try {
    h.runScript('log-iteration', ['fix', 'first', 'first fix', 'a.ts'], { cwd: repo });
    const res = h.runScript('log-iteration', ['add', 'second', 'second add', 'b.ts'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('LOGGED:I2'));
  } finally {
    cleanup();
  }
});

test('log-iteration#003 writes correct content to file', () => {
  const { repo, cleanup } = featureRepo();
  try {
    h.runScript('log-iteration', ['fix', 'save-btn', 'fix validation', 'api/ctrl.ts'], { cwd: repo });
    const content = iterationsText(repo);
    assert.ok(content.includes('## I1|'));
    assert.ok(content.includes('|/dev|fix'), 'the default command is /dev');
    assert.ok(content.includes('save-btn|fix validation|api/ctrl.ts'));
  } finally {
    cleanup();
  }
});

test('log-iteration#004 accepts custom command as 5th argument', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', ['add', 'feat', 'new feat', 'src.ts', '/hotfix'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(iterationsText(repo).includes('|/hotfix|add'));
  } finally {
    cleanup();
  }
});

test('log-iteration#005 marks feature as complete with --feature N', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', ['add', 'signup', 'feature 1', 'api.ts', '/dev', '--feature', '1'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('FEATURE_COMPLETE:1'));
    const content = iterationsText(repo);
    assert.ok(content.includes('[FEATURE 1 COMPLETE]'));
    assert.ok(content.includes('|feature:1'));
  } finally {
    cleanup();
  }
});

test('log-iteration#006 accepts --epic flag', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript(
      'log-iteration',
      ['add', 'signup', 'feature 1', 'api.ts', '/dev', '--feature', '1', '--epic', 'auth-system'],
      { cwd: repo },
    );
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('EPIC:auth-system'));
    assert.ok(iterationsText(repo).includes('|epic:auth-system'));
  } finally {
    cleanup();
  }
});

test('log-iteration#007 truncates what field at 60 characters', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const longWhat = 'This is a very long description that exceeds sixty characters limit for sure yes it does';
    const res = h.runScript('log-iteration', ['fix', 'slug', longWhat, 'f.ts'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    const entry = iterationsText(repo).split('\n').find((l) => l.startsWith('slug|'));
    assert.ok(entry, 'the slug row is present');
    const what = entry.split('|')[1];
    assert.equal(what, longWhat.slice(0, 60), 'what is cut to 60 characters, not padded');
  } finally {
    cleanup();
  }
});

test('log-iteration#008 fails without arguments', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', [], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:missing_required_args'));
  } finally {
    cleanup();
  }
});

test('log-iteration#009 fails with invalid type', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', ['invalid', 'slug', 'what', 'files'], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:invalid_type'));
  } finally {
    cleanup();
  }
});

test('log-iteration#010 fails when not on feature branch', () => {
  const { repo, git, cleanup } = featureRepo();
  try {
    git('checkout', 'main', '-q');
    const res = h.runScript('log-iteration', ['fix', 'slug', 'what', 'files'], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:not_on_feature_branch'));
  } finally {
    cleanup();
  }
});

test('log-iteration#011 fails when feature dir does not exist', () => {
  const { repo, git, cleanup } = featureRepo();
  try {
    git('checkout', '-b', 'feature/9999F-missing', '-q');
    const res = h.runScript('log-iteration', ['fix', 'slug', 'what', 'files'], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:feature_dir_not_found'));
  } finally {
    cleanup();
  }
});

test('log-iteration#012 fails with --feature without numeric value', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const res = h.runScript('log-iteration', ['fix', 'slug', 'what', 'files', '/dev', '--feature', 'abc'], { cwd: repo });
    assert.equal(res.status, 1, res.output);
    assert.ok(res.output.includes('ERROR:'));
  } finally {
    cleanup();
  }
});

test('log-iteration#013 validates all accepted types', () => {
  const { repo, cleanup } = featureRepo();
  try {
    for (const type of ['fix', 'enhance', 'refactor', 'add', 'remove', 'config']) {
      const res = h.runScript('log-iteration', [type, `slug-${type}`, 'what', 'f.ts'], { cwd: repo });
      assert.equal(res.status, 0, `${type}: ${res.output}`);
    }
  } finally {
    cleanup();
  }
});

test('log-iteration#014 works correctly when iterations.md already exists but is empty', () => {
  const { repo, cleanup } = featureRepo();
  try {
    h.write(abs(repo, ITERATIONS), '');
    const res = h.runScript('log-iteration', ['fix', 'save-btn', 'fix validation', 'api/ctrl.ts'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('LOGGED:I1'));
    assert.ok(iterationsText(repo).length > 0);
  } finally {
    cleanup();
  }
});

test('log-iteration#015 accepts UTF-8 characters in what field', () => {
  const { repo, cleanup } = featureRepo();
  try {
    const what = 'corrigir validação de e-mail e autenticação';
    const res = h.runScript('log-iteration', ['fix', 'btn', what, 'api.ts'], { cwd: repo });
    assert.equal(res.status, 0, res.output);
    assert.ok(res.stdout.includes('LOGGED:I1'));
    const content = iterationsText(repo);
    assert.ok(content.includes('btn'));
    assert.ok(content.includes(what), 'UTF-8 is cut by characters, not bytes');
  } finally {
    cleanup();
  }
});
