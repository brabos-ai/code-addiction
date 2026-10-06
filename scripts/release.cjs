#!/usr/bin/env node
// =============================================================================
// RELEASE — merge main into production and publish the production branch
// =============================================================================
// Usage:        node scripts/release.cjs      (no arguments)
// Exit:         0 = production was merged and pushed
//               1 = refused (not a repository, dirty worktree) or a git step failed
// Dependencies: Node built-ins and git. No network beyond the configured origin,
//               no shell, no Bash.
// Layer:        INTERNAL (not shipped to users).
//
// -----------------------------------------------------------------------------
// WHAT IT DOES — the order is the contract
// -----------------------------------------------------------------------------
//  1. refuse outside a git repository
//  2. refuse a dirty worktree (`git diff-index --quiet HEAD --`)
//  3. remember the current branch
//  4. `git fetch origin`
//  5. `git checkout main` then `git pull origin main`
//  6. `git checkout production` (create from main when absent), pull when present
//  7. `git merge main` into production
//  8. `git push origin production`
//  9. restore the remembered branch
//
// Every transition and exit code above is preserved from `scripts/release.sh`.
// This entry creates NO tags: tag creation/push is the companion
// `scripts/create-release-tag.cjs`, exercised against disposable repositories.
//
// ⛔ NO REAL REMOTE. The tests pin a disposable local bare `origin`; this script
//    itself never special-cases an environment and must never be pointed at the
//    user's real release remote by its own code.
// =============================================================================

'use strict';

const { spawnSync } = require('node:child_process');

const RED = '\u001b[0;31m';
const GREEN = '\u001b[0;32m';
const YELLOW = '\u001b[1;33m';
const NC = '\u001b[0m';

const BUNDLE = '========================================';

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

function say(message) {
  process.stdout.write(`${message}\n`);
}

/** Run a git step that must succeed; report and fail the script otherwise. */
function must(args) {
  const res = git(args);
  if (res.status !== 0) {
    process.stderr.write(`${RED}Error: git ${args.join(' ')} failed${NC}\n`);
    if (res.stdout) process.stderr.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    process.exitCode = 1;
    return false;
  }
  return true;
}

function main() {
  say(`${GREEN}${BUNDLE}${NC}`);
  say(`${GREEN}  Release Script${NC}`);
  say(`${GREEN}${BUNDLE}${NC}`);
  say('');

  if (git(['rev-parse', '--is-inside-work-tree']).status !== 0) {
    process.stderr.write(`${RED}Error: Not a git repository${NC}\n`);
    process.exitCode = 1;
    return;
  }

  if (git(['diff-index', '--quiet', 'HEAD', '--']).status !== 0) {
    process.stderr.write(
      `${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const currentBranch = git(['branch', '--show-current']).stdout.trim();
  say(`${YELLOW}Current branch: ${currentBranch}${NC}`);

  say(`${YELLOW}Fetching latest from remote...${NC}`);
  if (!must(['fetch', 'origin'])) return;

  say(`${YELLOW}Switching to main branch...${NC}`);
  if (!must(['checkout', 'main'])) return;
  if (!must(['pull', 'origin', 'main'])) return;

  say(`${YELLOW}Switching to production branch...${NC}`);
  const hasProduction = git(['show-ref', '--verify', '--quiet', 'refs/heads/production']).status === 0;
  if (hasProduction) {
    if (!must(['checkout', 'production'])) return;
    if (!must(['pull', 'origin', 'production'])) return;
  } else {
    say(`${YELLOW}Creating production branch from main...${NC}`);
    if (!must(['checkout', '-b', 'production'])) return;
  }

  say(`${YELLOW}Merging main into production...${NC}`);
  if (!must(['merge', 'main', '-m', 'Merge main into production for release'])) return;

  say(`${YELLOW}Pushing production to remote...${NC}`);
  if (!must(['push', 'origin', 'production'])) return;

  say('');
  say(`${GREEN}${BUNDLE}${NC}`);
  say(`${GREEN}  Release completed successfully!${NC}`);
  say(`${GREEN}${BUNDLE}${NC}`);
  say('');
  say(`${YELLOW}Returning to branch: ${currentBranch}${NC}`);
  if (!must(['checkout', currentBranch])) return;

  say(`${GREEN}Done!${NC}`);
}

main();
