#!/usr/bin/env node
// =============================================================================
// CHANGELOG-PROMOTE — move `## [Unreleased]` under the version being released
// =============================================================================
// Usage:        node scripts/changelog-promote.cjs <version> [--date YYYY-MM-DD]
//               <version> is MAJOR.MINOR.PATCH, with an optional -beta.N and an optional leading v.
//               --date defaults to today (UTC). The file is `CHANGELOG.md` in the current directory.
// Exit:         0 = promoted           prints CHANGELOG_PROMOTED=<version>
//               0 = nothing to do      prints CHANGELOG_PROMOTED=already
//                   ([<version>] already has a section and Unreleased is empty)
//               1 = Unreleased is empty and no section exists for the version; the file has no
//                   `## [Unreleased]` heading or does not exist; the version is invalid;
//                   or Unreleased holds text while [<version>] already exists (never merged)
// Dependencies: Node built-ins only.
// Layer:        INTERNAL (not shipped to users).
//
// What it does: the body of `## [Unreleased]` becomes the body of a new
// `## [<version>] - <date>` heading placed right after it, and `## [Unreleased]` is left empty.
// Every other byte of the file is untouched. The release command runs it in STEP 4, inside the
// bump commit; `create-release-tag.cjs` refuses a stable tag whose heading is missing.
// =============================================================================

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILE = 'CHANGELOG.md';

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  let version = null;
  let date = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--date') date = argv[++i];
    else if (version === null) version = argv[i];
    else fail(`unexpected argument: ${argv[i]}`);
  }
  if (!version) fail('usage: node scripts/changelog-promote.cjs <version> [--date YYYY-MM-DD]');
  version = version.replace(/^v/, '');
  if (!VERSION_RE.test(version)) fail(`invalid version: ${version}`);
  if (date === null) date = new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(date)) fail(`invalid --date: ${date}`);
  return { version, date };
}

function main() {
  const { version, date } = parseArgs(process.argv.slice(2));
  const file = path.resolve(process.cwd(), FILE);
  if (!fs.existsSync(file)) fail(`${FILE} not found in ${process.cwd()}`);
  const text = fs.readFileSync(file, 'utf8');

  const heading = /^## \[Unreleased\][ \t]*\r?\n/m.exec(text);
  if (!heading) fail(`${FILE} has no "## [Unreleased]" heading`);
  const bodyStart = heading.index + heading[0].length;
  const next = /^## \[/m.exec(text.slice(bodyStart));
  const bodyEnd = next ? bodyStart + next.index : text.length;
  const body = text.slice(bodyStart, bodyEnd);

  const versionHeading = new RegExp(`^## \\[${version.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm');
  const exists = versionHeading.test(text);
  const empty = body.trim() === '';

  if (empty && exists) {
    process.stdout.write('CHANGELOG_PROMOTED=already\n');
    return;
  }
  if (empty) fail(`## [Unreleased] is empty and ${FILE} has no section for ${version} — write the release notes first`);
  if (exists) fail(`## [Unreleased] holds text and a section for ${version} already exists — refusing to merge them`);

  const eol = heading[0].endsWith('\r\n') ? '\r\n' : '\n';
  const out = text.slice(0, bodyStart) + eol + `## [${version}] - ${date}${eol}` + body + text.slice(bodyEnd);
  fs.writeFileSync(file, out);
  process.stdout.write(`CHANGELOG_PROMOTED=${version}\n`);
}

main();
