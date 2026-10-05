#!/usr/bin/env node
// =============================================================================
// CREATE-RELEASE-TAG — annotate and publish v<version> from cli/package.json
// =============================================================================
// Usage:        node scripts/create-release-tag.cjs      (no arguments)
// Exit:         0 = the annotated tag was created and pushed
//               1 = invalid version, lockfile out of sync, or a git step failed
// Dependencies: Node built-ins and git. No shell, no Bash.
// Layer:        INTERNAL (not shipped to users).
//
// -----------------------------------------------------------------------------
// WHAT IT DOES — the order is the contract
// -----------------------------------------------------------------------------
//  1. reads the version from `cli/package.json`, builds TAG = `v<version>`
//  2. validates TAG against `^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$`  (exit 1)
//  3. gates on `cli/package-lock.json` carrying the same version (exit 1)
//  4. fetches remote tags
//  5. deletes a stale local tag of the same name
//  6. deletes a stale remote tag of the same name
//  7. creates an ANNOTATED tag: message from the release-notes file when one
//     exists, otherwise `Release <tag>`
//  8. pushes the tag to origin
//
// Steps 2 and 3 fire BEFORE any tag is touched: the CI package smoke test only
// enforces the lockfile sync AFTER the tag is pushed (the v0.8.0 lesson).
//
// -----------------------------------------------------------------------------
// PORTABLE NOTES CONVENTION (the `/tmp` translation)
// -----------------------------------------------------------------------------
// Release notes live at:
//     <os.tmpdir()>/release-notes-<tag>.md
// The legacy absolute `/tmp/release-notes-<tag>.md` path is retained as an
// adapter: it is checked only when the portable path is absent. On POSIX the
// two are the same directory; on Windows they differ (`%TEMP%` vs `C:\tmp`).
//
// ⛔ NO REAL REMOTE. Tests pin a disposable local bare `origin`; this script
//    never special-cases an environment and must never be pointed at the user's
//    real release remote by its own code.
// =============================================================================

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RED = '\u001b[0;31m';
const GREEN = '\u001b[0;32m';
const YELLOW = '\u001b[1;33m';
const BLUE = '\u001b[0;34m';
const NC = '\u001b[0m';

const BUNDLE = '========================================';
const TAG_RE = /^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$/;
const RELEASES_URL = 'https://github.com/brabos-ai/code-addiction/releases/tag/';

const PACKAGE_JSON = path.join('cli', 'package.json');
const PACKAGE_LOCK = path.join('cli', 'package-lock.json');

/** One git invocation, argv array, the caller's cwd. Never a shell. */
function git(args) {
  const res = spawnSync('git', args, {
    encoding: 'utf8',
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: res.status === null || res.status === undefined ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

/** Best-effort git: a failure is tolerated (mirrors `|| true` in the shell). */
function gitSoft(args) {
  return git(args);
}

function say(message) {
  process.stdout.write(`${message}\n`);
}

/** Read the `version` field of a JSON file, or null when unreadable/absent. */
function readVersion(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch {
    return null;
  }
}

/** A blocking sleep so a stale remote ref has time to disappear before repush. */
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** The release-notes path for `tag`: portable first, legacy `/tmp` as adapter. */
function notesFileFor(tag) {
  const name = `release-notes-${tag}.md`;
  const portable = path.join(os.tmpdir(), name);
  if (fs.existsSync(portable)) return portable;
  const legacy = path.join(path.resolve('/tmp'), name);
  if (fs.existsSync(legacy)) return legacy;
  return null;
}

function main() {
  say(`${BLUE}${BUNDLE}${NC}`);
  say(`${BLUE}  Release Tag Creator${NC}`);
  say(`${BLUE}${BUNDLE}${NC}`);
  say('');

  const version = readVersion(PACKAGE_JSON);
  const tag = `v${version}`;

  say(`${YELLOW}Version from package.json: ${version}${NC}`);
  say(`${YELLOW}Tag to create: ${tag}${NC}`);
  say('');

  if (version === null || !TAG_RE.test(tag)) {
    process.stderr.write(
      `${RED}❌ Invalid version format in package.json: ${version}${NC}\n`,
    );
    process.stderr.write(`${RED}Expected format: X.Y.Z or X.Y.Z-beta.N${NC}\n`);
    process.exitCode = 1;
    return;
  }

  say(`${GREEN}✓ Version format valid${NC}`);
  say('');

  // GATE: lockfile sync, before any tag is touched.
  const lockVersion = readVersion(PACKAGE_LOCK);
  if (lockVersion !== version) {
    process.stderr.write(
      `${RED}❌ cli/package-lock.json version '${lockVersion === null ? 'missing' : lockVersion}' != cli/package.json version '${version}'${NC}\n`,
    );
    process.stderr.write(
      `${RED}   The CI package smoke test would fail only after the tag is pushed.${NC}\n`,
    );
    process.stderr.write(
      `${RED}   Fix: cd cli && npm version ${version} --no-git-tag-version, commit and push, merge to production (stable only), re-run this script.${NC}\n`,
    );
    process.exitCode = 1;
    return;
  }
  say(`${GREEN}✓ package-lock.json in sync (${lockVersion})${NC}`);
  say('');

  say(`${YELLOW}Fetching tags from remote...${NC}`);
  gitSoft(['fetch', '--tags', 'origin']);

  if (git(['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]).status === 0) {
    say(`${YELLOW}⚠ Tag ${tag} exists locally, deleting...${NC}`);
    git(['tag', '-d', tag]);
  }

  const lsRemote = gitSoft(['ls-remote', '--tags', 'origin']).stdout;
  const remoteHasTag = lsRemote
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .some((line) => line.endsWith(`refs/tags/${tag}`));
  if (remoteHasTag) {
    say(`${YELLOW}⚠ Tag ${tag} exists on remote, deleting...${NC}`);
    gitSoft(['push', 'origin', '--delete', tag]);
    sleepMs(1000);
  }

  say('');
  say(`${YELLOW}Creating annotated tag: ${tag}${NC}`);

  const notes = notesFileFor(tag);
  if (notes) {
    say(`${YELLOW}Using release notes from: ${notes}${NC}`);
    const res = git(['tag', '-a', tag, '-F', notes]);
    if (res.status !== 0) {
      process.stderr.write(`${RED}Error: git tag -a ${tag} failed${NC}\n`);
      if (res.stderr) process.stderr.write(res.stderr);
      process.exitCode = 1;
      return;
    }
  } else {
    say(`${YELLOW}No release notes file found at ${path.join(os.tmpdir(), `release-notes-${tag}.md`)}${NC}`);
    say(`${YELLOW}Creating tag with empty message...${NC}`);
    const res = git(['tag', '-a', tag, '-m', `Release ${tag}`]);
    if (res.status !== 0) {
      process.stderr.write(`${RED}Error: git tag -a ${tag} failed${NC}\n`);
      if (res.stderr) process.stderr.write(res.stderr);
      process.exitCode = 1;
      return;
    }
  }

  say('');
  say(`${YELLOW}Pushing tag to remote...${NC}`);
  const push = git(['push', 'origin', tag]);
  if (push.status !== 0) {
    process.stderr.write(`${RED}Error: git push origin ${tag} failed${NC}\n`);
    if (push.stderr) process.stderr.write(push.stderr);
    process.exitCode = 1;
    return;
  }

  say('');
  say(`${GREEN}${BUNDLE}${NC}`);
  say(`${GREEN}✓ Release tag created successfully!${NC}`);
  say(`${GREEN}${BUNDLE}${NC}`);
  say('');
  say(`${BLUE}Tag: ${tag}${NC}`);
  say(`${BLUE}Release URL: ${RELEASES_URL}${tag}${NC}`);
  say('');
  say(`${YELLOW}The CI pipeline will automatically:${NC}`);
  say(`${YELLOW}  1. Build the framework${NC}`);
  say(`${YELLOW}  2. Package ZIP archive${NC}`);
  say(`${YELLOW}  3. Create GitHub Release${NC}`);
  say(`${YELLOW}  4. Publish to npm${NC}`);
  say('');

  const log = git(['log', '-1', '--oneline', tag]);
  if (log.stdout) process.stdout.write(log.stdout);
}

main();
