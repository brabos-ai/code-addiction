'use strict';
// =============================================================================
// scripts/create-release-tag.cjs — native characterization (F27 red → F21 green)
// =============================================================================
// Characterizes `scripts/create-release-tag.sh` (read in full) against the
// intended native entry `scripts/create-release-tag.cjs`. The shell entry takes
// NO arguments, reads `cli/package.json` from the current repository, and:
//
//   1. reads the version, builds TAG = `v<version>`
//   2. validates TAG against `^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$` and
//      exits 1 on any other shape
//   3. gates on `cli/package-lock.json` carrying the same version — the CI
//      package smoke test enforces this only AFTER the tag is pushed, so the
//      gate must fire before any tag is touched (exit 1)
//   4. fetches remote tags, deletes a stale local tag of the same name
//   5. deletes a stale remote tag of the same name
//   6. creates an ANNOTATED tag: message from the release-notes file when one
//      exists, otherwise `Release <tag>`
//   7. pushes the tag to origin
//
// PORTABLE NOTES CONVENTION (the plan's `/tmp` translation): notes live at
//   <os.tmpdir()>/release-notes-<tag>.md
// with the legacy absolute `/tmp/release-notes-<tag>.md` path retained as an
// adapter. On Windows those differ (`%TEMP%` vs `C:\tmp`); on POSIX they are
// the same directory, so one assertion covers both.
//
// ⛔ NO REAL REMOTE. Every fixture is a disposable local bare repository. The
//    child's git is pinned with GIT_DIR/GIT_WORK_TREE so no cwd bug can reach
//    this checkout's origin, and every notes fixture is removed afterwards.
//
// ⛔ RED TODAY: scripts/create-release-tag.cjs does not exist yet (F21).
//
// Run: node --test scripts/tests/create-release-tag.test.cjs

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const h = require('./helpers.cjs');

// --- fixtures ---------------------------------------------------------------

function pinnedEnv(repo) {
  return {
    GIT_DIR: path.join(repo, '.git'),
    GIT_WORK_TREE: repo,
  };
}

/** A throwaway repo on `main` with a bare `origin` carrying `main`. */
function makeRemoteRepo() {
  const r = h.makeRepo({ prefix: 'codeadd-tag-' });
  const remote = path.join(r.base, 'origin.git');
  h.git(r.base, ['init', '--bare', '--initial-branch=main', '-q', remote]);
  r.git('remote', 'add', 'origin', remote);
  r.git('push', '-q', '-u', 'origin', 'main');
  return { ...r, remote };
}

/** Write the two CLI version files the tag entry reads. */
function writeVersion(repo, version, lockVersion = version) {
  h.write(
    path.join(repo, 'cli', 'package.json'),
    `${JSON.stringify({ name: 'code-addiction', version }, null, 2)}\n`,
  );
  h.write(
    path.join(repo, 'cli', 'package-lock.json'),
    `${JSON.stringify({ name: 'code-addiction', version: lockVersion, lockfileVersion: 3 }, null, 2)}\n`,
  );
}

function notesPath(version, { legacy = false } = {}) {
  const dir = legacy ? path.resolve('/tmp') : os.tmpdir();
  return path.join(dir, `release-notes-v${version}.md`);
}

function writeNotes(version, body, opts) {
  const p = notesPath(version, opts);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
  return p;
}

function cleanupNotes(version) {
  for (const legacy of [false, true]) {
    fs.rmSync(notesPath(version, { legacy }), { force: true });
  }
}

function runTag(repo) {
  return h.runRootScript('create-release-tag', [], { cwd: repo, env: pinnedEnv(repo) });
}

function tagType(repo, tag) {
  const res = repo.git('cat-file', '-t', tag);
  return res.status === 0 ? res.stdout.trim() : null;
}

function tagMessage(repo, tag) {
  const res = repo.git('for-each-ref', '--format=%(contents)', `refs/tags/${tag}`);
  return res.stdout;
}

/** The peeled commit a remote annotated tag points at, or null. */
function remoteTagPeeled(remote, tag) {
  const res = h.git(path.dirname(remote), ['ls-remote', '--tags', remote, `refs/tags/${tag}*`]);
  const line = res.stdout
    .split('\n')
    .find((l) => l.endsWith(`refs/tags/${tag}^{}`));
  return line ? line.split('\t')[0] : null;
}

// --- version / tag ----------------------------------------------------------

test('reads the version from cli/package.json and creates an annotated v<version> tag', () => {
  const r = makeRemoteRepo();
  try {
    writeVersion(r.repo, '4.5.6');
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.equal(tagType(r, 'v4.5.6'), 'tag', 'the tag must be annotated');
    assert.equal(
      r.git('rev-parse', 'v4.5.6^{commit}').stdout.trim(),
      r.git('rev-parse', 'HEAD').stdout.trim(),
      'the tag points at the checked-out commit',
    );
  } finally {
    cleanupNotes('4.5.6');
    r.cleanup();
  }
});

test('pushes the created tag to origin', () => {
  const r = makeRemoteRepo();
  try {
    writeVersion(r.repo, '4.5.7');
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.equal(
      remoteTagPeeled(r.remote, 'v4.5.7'),
      r.git('rev-parse', 'HEAD').stdout.trim(),
      'the pushed tag is annotated and points at HEAD',
    );
  } finally {
    cleanupNotes('4.5.7');
    r.cleanup();
  }
});

test('refuses an invalid version format and creates no tag', () => {
  const r = makeRemoteRepo();
  try {
    writeVersion(r.repo, '1.2');
    const res = runTag(r.repo);
    assert.notEqual(res.status, 0, 'an invalid version must be refused');
    assert.match(h.stripAnsi(res.output), /invalid version format/i);
    assert.equal(tagType(r, 'v1.2'), null, 'no tag is created on refusal');
  } finally {
    cleanupNotes('1.2');
    r.cleanup();
  }
});

test('refuses a cli/package-lock.json out of sync with cli/package.json', () => {
  const r = makeRemoteRepo();
  try {
    writeVersion(r.repo, '3.3.3', '3.3.2');
    const res = runTag(r.repo);
    assert.notEqual(res.status, 0, 'a lockfile mismatch must be refused');
    assert.match(h.stripAnsi(res.output), /package-lock\.json/i);
    assert.equal(tagType(r, 'v3.3.3'), null, 'no tag is created on refusal');
  } finally {
    cleanupNotes('3.3.3');
    r.cleanup();
  }
});

// --- notes message ----------------------------------------------------------

test('uses release notes from the portable temp path as the annotated tag message', () => {
  const version = '9.1.1';
  const r = makeRemoteRepo();
  try {
    cleanupNotes(version);
    // The marker is not a `#` comment line: `git tag -F` strips comment lines
    // with its default cleanup, exactly as it does for a real notes file.
    writeNotes(version, 'PORTABLE-NOTES-MARKER\n\nwhat shipped\n');
    writeVersion(r.repo, version);
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.match(tagMessage(r, `v${version}`), /PORTABLE-NOTES-MARKER/);
  } finally {
    cleanupNotes(version);
    r.cleanup();
  }
});

test('falls back to `Release v<version>` when no release-notes file exists', () => {
  const version = '9.1.2';
  const r = makeRemoteRepo();
  try {
    cleanupNotes(version);
    writeVersion(r.repo, version);
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.match(tagMessage(r, `v${version}`), new RegExp(`Release v${version.replace(/\./g, '\\.')}`));
  } finally {
    cleanupNotes(version);
    r.cleanup();
  }
});

test('honors the legacy /tmp release-notes path as an adapter', () => {
  const version = '9.1.3';
  const r = makeRemoteRepo();
  try {
    cleanupNotes(version);
    writeNotes(version, 'LEGACY-NOTES-MARKER\n\nlegacy adapter\n', { legacy: true });
    if (path.resolve(os.tmpdir()) !== path.resolve('/tmp')) {
      assert.equal(fs.existsSync(notesPath(version)), false, 'the distinct portable path stays absent');
    }
    writeVersion(r.repo, version);
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.match(tagMessage(r, `v${version}`), /LEGACY-NOTES-MARKER/);
  } finally {
    cleanupNotes(version);
    r.cleanup();
  }
});

// --- stale-tag replacement --------------------------------------------------

test('replaces a stale local tag of the same name with a fresh annotated tag at HEAD', () => {
  const version = '9.1.4';
  const r = makeRemoteRepo();
  try {
    cleanupNotes(version);
    r.git('tag', `v${version}`); // lightweight, pointing at the seed commit
    h.write(path.join(r.repo, 'README.md'), 'moved\n');
    r.git('commit', '-q', '-am', 'moved');
    writeVersion(r.repo, version);
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.equal(tagType(r, `v${version}`), 'tag', 'the stale tag is replaced and annotated');
    assert.equal(
      r.git('rev-parse', `v${version}^{commit}`).stdout.trim(),
      r.git('rev-parse', 'HEAD').stdout.trim(),
    );
  } finally {
    cleanupNotes(version);
    r.cleanup();
  }
});

test('replaces a stale remote tag of the same name and republishes the annotated tag', () => {
  const version = '9.1.5';
  const r = makeRemoteRepo();
  try {
    cleanupNotes(version);
    r.git('tag', `v${version}`);
    r.git('push', '-q', 'origin', `v${version}`);
    h.write(path.join(r.repo, 'README.md'), 'moved\n');
    r.git('commit', '-q', '-am', 'moved');
    writeVersion(r.repo, version);
    const res = runTag(r.repo);
    assert.equal(res.status, 0, h.stripAnsi(res.output));
    assert.equal(
      remoteTagPeeled(r.remote, `v${version}`),
      r.git('rev-parse', 'HEAD').stdout.trim(),
      'the remote tag now peels to HEAD',
    );
  } finally {
    cleanupNotes(version);
    r.cleanup();
  }
});
