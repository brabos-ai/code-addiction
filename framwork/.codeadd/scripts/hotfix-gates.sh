#!/bin/bash
# HOTFIX-GATES
# Deterministic repository-state contracts for /add.diagnose, /add.hotfix and /add.done.
#
# Usage:
#   bash .codeadd/scripts/hotfix-gates.sh diagnosis-baseline
#   bash .codeadd/scripts/hotfix-gates.sh diagnosis-check <report>
#   bash .codeadd/scripts/hotfix-gates.sh snapshot-wave <path-hex-file>
#   bash .codeadd/scripts/hotfix-gates.sh diff-wave <snapshot> <package>
#   bash .codeadd/scripts/hotfix-gates.sh review-manifest <hotfix-dir> [--tree <commit>]
#   bash .codeadd/scripts/hotfix-gates.sh review-fingerprint <hotfix-dir> [--tree <commit>]
#   bash .codeadd/scripts/hotfix-gates.sh review-validate <hotfix-dir> [--tree <commit>]
#
# Dependencies: bash, git, node >= 18 (guaranteed by the CLI). No npm package.
# Output: KEY=VALUE lines and delimited tab-separated records documented per mode below.
# Exit: 0 completed successfully; 1 git/filesystem failure; 2 misuse or malformed input.
#       diagnosis-check also returns 3 when diagnosed-commit is unavailable.
#       diff-wave also returns 3 when no correction changed.
#       review-validate also returns 3 when the delivery gate is not current and passed.

set -u

if [ "$#" -lt 1 ]; then
  echo "Usage: hotfix-gates.sh <mode> [arguments]" >&2
  exit 2
fi

node - "$@" <<'NODE'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

class ExitError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const [mode, ...args] = process.argv.slice(2);
const repo = process.cwd();

function fail(code, message) {
  throw new ExitError(code, message);
}

function git(argv, encoding = null) {
  try {
    return execFileSync('git', argv, { cwd: repo, encoding, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim() : error.message;
    fail(1, detail || `git ${argv[0]} failed`);
  }
}

function gitMaybe(argv, encoding = null) {
  try {
    return execFileSync('git', argv, { cwd: repo, encoding, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function assertRepo() {
  if (gitMaybe(['rev-parse', '--is-inside-work-tree'], 'utf8')?.trim() !== 'true') {
    fail(1, 'Current directory is not a git work tree');
  }
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function splitZ(buffer) {
  if (!buffer || buffer.length === 0) return [];
  const values = [];
  let start = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] === 0) {
      if (i > start) values.push(buffer.subarray(start, i).toString('utf8'));
      start = i + 1;
    }
  }
  return values;
}

function pathHex(value) {
  return Buffer.from(value, 'utf8').toString('hex');
}

function fromHex(value) {
  if (!/^(?:[0-9a-f]{2})+$/.test(value)) fail(2, `Malformed path-hex: ${value}`);
  return Buffer.from(value, 'hex').toString('utf8');
}

function normalizeRel(value) {
  const rel = path.relative(repo, path.resolve(repo, value)).split(path.sep).join('/');
  if (!rel || rel === '..' || rel.startsWith('../')) fail(2, `Path is outside the repository: ${value}`);
  return rel;
}

function indexInfo(rel) {
  const output = gitMaybe(['ls-files', '-s', '-z', '--', rel]);
  if (!output || output.length === 0) return null;
  const row = splitZ(output)[0];
  const match = row.match(/^(\d{6}) ([0-9a-f]{40,64}) \d\t/);
  return match ? { mode: match[1], oid: match[2] } : null;
}

function treeInfo(tree, rel) {
  const output = gitMaybe(['ls-tree', '-z', tree, '--', rel]);
  if (!output || output.length === 0) return null;
  const row = splitZ(output)[0];
  const match = row.match(/^(\d{6}) blob ([0-9a-f]{40,64})\t/);
  return match ? { mode: match[1], oid: match[2] } : null;
}

function fsInfo(rel) {
  const absolute = path.join(repo, ...rel.split('/'));
  let stat;
  try {
    stat = fs.lstatSync(absolute);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (stat.isDirectory()) return null;
  const content = stat.isSymbolicLink()
    ? Buffer.from(fs.readlinkSync(absolute), 'utf8')
    : fs.readFileSync(absolute);
  const fileMode = stat.isSymbolicLink() ? '120000' : ((stat.mode & 0o111) ? '100755' : '100644');
  return { mode: fileMode, content, hash: sha256(content) };
}

function blobInfo(info) {
  if (!info) return null;
  const content = git(['cat-file', 'blob', info.oid]);
  return { mode: info.mode, content, hash: sha256(content) };
}

function headInfo(rel) {
  return blobInfo(treeInfo('HEAD', rel));
}

function entryFor(rel, source) {
  let info = null;
  if (source === 'index') info = blobInfo(indexInfo(rel));
  if (source === 'worktree') info = fsInfo(rel);
  if (source.startsWith('tree:')) info = blobInfo(treeInfo(source.slice(5), rel));
  if (!info) return { state: 'deleted', mode: (indexInfo(rel) || treeInfo('HEAD', rel) || {}).mode || '000000', hash: '-' };
  return { state: 'present', mode: info.mode, hash: info.hash, content: info.content };
}

function sortEntries(entries) {
  return entries.sort((a, b) => Buffer.compare(Buffer.from(a.rel), Buffer.from(b.rel)) || a.state.localeCompare(b.state));
}

function baselineEntries() {
  const entries = [];
  const seen = new Set();
  const add = (state, rel, source) => {
    const key = `${state}\0${rel}`;
    if (seen.has(key)) return;
    seen.add(key);
    const info = entryFor(rel, source);
    entries.push({ rel, state: info.state === 'deleted' ? 'deleted' : state, mode: info.mode, hash: info.hash });
  };

  for (const rel of splitZ(git(['diff', '--cached', '--name-only', '--no-renames', '-z']))) add('staged', rel, 'index');
  for (const rel of splitZ(git(['diff', '--name-only', '--no-renames', '-z']))) add('unstaged', rel, 'worktree');
  for (const rel of splitZ(git(['ls-files', '--others', '--exclude-standard', '-z']))) add('untracked', rel, 'worktree');
  return sortEntries(entries);
}

function baselineLine(entry) {
  return `${entry.state}\t${entry.mode}\t${entry.hash}\t${pathHex(entry.rel)}`;
}

function diagnosisBaseline() {
  if (args.length !== 0) fail(2, 'diagnosis-baseline takes no arguments');
  const branch = git(['branch', '--show-current'], 'utf8').trim();
  const commit = git(['rev-parse', 'HEAD'], 'utf8').trim();
  const entries = baselineEntries();
  console.log(`DIAGNOSED_BRANCH=${branch}`);
  console.log(`DIAGNOSED_COMMIT=${commit}`);
  console.log('BASELINE_BEGIN');
  if (entries.length === 0) console.log('clean');
  else entries.forEach((entry) => console.log(baselineLine(entry)));
  console.log('BASELINE_END');
}

function oneScalar(text, key, pattern) {
  const matches = [...text.matchAll(new RegExp(`^${key}:[ \\t]*(.*)$`, 'gm'))];
  if (matches.length !== 1 || !pattern.test(matches[0][1])) fail(2, `Malformed or duplicate ${key}`);
  return matches[0][1];
}

function parseHandoff(reportPath) {
  let text;
  try {
    text = fs.readFileSync(path.resolve(repo, reportPath), 'utf8');
  } catch (error) {
    fail(error.code === 'ENOENT' ? 2 : 1, `Cannot read diagnosis report: ${reportPath}`);
  }
  oneScalar(text, 'route', /^hotfix$/);
  oneScalar(text, 'accepted', /^true$/);
  const branch = oneScalar(text, 'diagnosed-branch', /^.+$/);
  const commit = oneScalar(text, 'diagnosed-commit', /^[0-9a-f]{40}$/);
  oneScalar(text, 'predicate', /^.+$/);
  oneScalar(text, 'root-cause', /^.+$/);

  const baselineMatch = text.match(/^### Working Tree Baseline\r?\n```text\r?\n([\s\S]*?)\r?\n```/m);
  if (!baselineMatch) fail(2, 'Missing Working Tree Baseline');
  const rows = baselineMatch[1] === 'clean' ? [] : baselineMatch[1].split(/\r?\n/).filter(Boolean);
  const baseline = [];
  const pairs = new Set();
  for (const row of rows) {
    const parts = row.split('\t');
    if (parts.length !== 4 || !/^(staged|unstaged|deleted|untracked)$/.test(parts[0]) ||
        !/^\d{6}$/.test(parts[1]) || !(parts[2] === '-' || /^[0-9a-f]{64}$/.test(parts[2]))) {
      fail(2, 'Malformed Working Tree Baseline row');
    }
    const rel = fromHex(parts[3]);
    const pair = `${parts[0]}\0${rel}`;
    if (pairs.has(pair)) fail(2, 'Duplicate Working Tree Baseline state/path');
    pairs.add(pair);
    baseline.push({ state: parts[0], mode: parts[1], hash: parts[2], rel });
  }

  const findingPaths = new Set();
  const findings = text.match(/^### Findings\r?\n([\s\S]*?)(?=^### |^## |(?![\s\S]))/m)?.[1] || '';
  for (const line of findings.split(/\r?\n/)) {
    if (!/^\|/.test(line) || /^\|[-: |]+$/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'ID' || cells.length < 7) continue;
    const citation = cells[3];
    const match = citation.match(/^(.*):\d+(?:-\d+)?$/);
    if (!match) fail(2, `Malformed finding citation: ${citation}`);
    findingPaths.add(match[1]);
  }
  if (findingPaths.size === 0) fail(2, 'Hotfix handoff has no findings');
  return { branch, commit, baseline, findingPaths };
}

function diagnosisCheck() {
  if (args.length !== 1) fail(2, 'diagnosis-check requires <report>');
  const handoff = parseHandoff(args[0]);
  const reportRel = normalizeRel(args[0]);
  if (!gitMaybe(['cat-file', '-e', `${handoff.commit}^{commit}`])) {
    console.log('DIAGNOSIS=delta');
    console.log('OVERLAP=present');
    console.log('DELTA_BEGIN');
    console.log('DELTA_END');
    console.log('DETAIL=diagnosed-commit is unavailable');
    process.exit(3);
  }

  const delta = [];
  const addDelta = (source, state, rel) => {
    const key = `${source}\0${state}\0${rel}`;
    if (!delta.some((item) => item.key === key)) delta.push({ key, source, state, rel });
  };
  const head = git(['rev-parse', 'HEAD'], 'utf8').trim();
  if (head !== handoff.commit) {
    for (const rel of splitZ(git(['diff', '--name-only', '--no-renames', '-z', `${handoff.commit}..${head}`])).filter((rel) => rel !== reportRel)) {
      addDelta('commit', treeInfo(head, rel) ? 'present' : 'deleted', rel);
    }
  }

  const expected = new Map(handoff.baseline.map((entry) => [`${entry.state}\0${entry.rel}`, entry]));
  const current = new Map(baselineEntries().filter((entry) => entry.rel !== reportRel).map((entry) => [`${entry.state}\0${entry.rel}`, entry]));
  for (const [key, entry] of current) {
    const before = expected.get(key);
    if (!before || before.mode !== entry.mode || before.hash !== entry.hash) addDelta('working', entry.state, entry.rel);
  }
  for (const [key, entry] of expected) {
    if (!current.has(key)) addDelta('working-removed', entry.state, entry.rel);
  }
  delta.sort((a, b) => Buffer.compare(Buffer.from(a.rel), Buffer.from(b.rel)) || a.source.localeCompare(b.source));
  const overlap = delta.some((item) => handoff.findingPaths.has(item.rel));
  console.log(`DIAGNOSIS=${delta.length ? 'delta' : 'unchanged'}`);
  console.log(`OVERLAP=${overlap ? 'present' : 'none'}`);
  console.log('DELTA_BEGIN');
  delta.forEach((item) => console.log(`${item.source}\t${item.state}\t${pathHex(item.rel)}`));
  console.log('DELTA_END');
  console.log(`DETAIL=${delta.length ? `${delta.length} post-diagnosis path state(s)` : 'repository matches diagnosis'}`);
}

function capturePath(rel) {
  const info = fsInfo(rel);
  if (!info) return { rel, state: 'deleted', mode: '000000', hash: '-', content: '' };
  return { rel, state: 'present', mode: info.mode, hash: info.hash, content: info.content.toString('base64') };
}

function snapshotWave() {
  if (args.length !== 1) fail(2, 'snapshot-wave requires <path-hex-file>');
  let rows;
  try {
    rows = fs.readFileSync(path.resolve(repo, args[0]), 'utf8').split(/\r?\n/).filter(Boolean);
  } catch (error) {
    fail(error.code === 'ENOENT' ? 2 : 1, `Cannot read path list: ${args[0]}`);
  }
  const paths = [...new Set(rows.map(fromHex))].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-hotfix-'));
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ version: 1, repo, entries: paths.map(capturePath) }));
  console.log(`SNAPSHOT=${directory}`);
  console.log(`SNAPSHOT_PATHS=${paths.length}`);
}

function diffWave() {
  if (args.length !== 2) fail(2, 'diff-wave requires <snapshot> <package>');
  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(path.join(args[0], 'manifest.json'), 'utf8'));
  } catch (error) {
    fail(error.code === 'ENOENT' || error instanceof SyntaxError ? 2 : 1, 'Malformed correction snapshot');
  }
  if (snapshot.version !== 1 || snapshot.repo !== repo || !Array.isArray(snapshot.entries)) fail(2, 'Malformed correction snapshot');
  const changes = [];
  for (const before of snapshot.entries) {
    const after = capturePath(before.rel);
    if (before.state !== after.state || before.mode !== after.mode || before.hash !== after.hash) changes.push({ before, after });
  }
  if (changes.length === 0) {
    console.log(`PACKAGE=${path.resolve(repo, args[1])}`);
    console.log('CHANGED=0');
    process.exit(3);
  }
  const lines = ['HOTFIX_CORRECTION_PACKAGE v1'];
  for (const { before, after } of changes) {
    lines.push(`PATH\t${pathHex(after.rel)}`);
    lines.push(`BEFORE\t${before.state}\t${before.mode}\t${before.hash}\t${before.content}`);
    lines.push(`AFTER\t${after.state}\t${after.mode}\t${after.hash}\t${after.content}`);
  }
  const packagePath = path.resolve(repo, args[1]);
  fs.mkdirSync(path.dirname(packagePath), { recursive: true });
  fs.writeFileSync(packagePath, `${lines.join('\n')}\n`);
  console.log(`PACKAGE=${packagePath}`);
  console.log(`CHANGED=${changes.length}`);
}

function parseReviewArgs() {
  if (args.length !== 1 && args.length !== 3) fail(2, `${mode} requires <hotfix-dir> [--tree <commit>]`);
  if (args.length === 3 && args[1] !== '--tree') fail(2, `${mode} requires <hotfix-dir> [--tree <commit>]`);
  const hotfixDir = normalizeRel(args[0]);
  const tree = args.length === 3 ? args[2] : null;
  if (tree && !gitMaybe(['cat-file', '-e', `${tree}^{commit}`])) fail(1, `Tree commit is unavailable: ${tree}`);
  return { hotfixDir, tree };
}

function excluded(rel, hotfixDir) {
  return rel === 'docs/delivered.jsonl' || rel === `${hotfixDir}/changelog.md` ||
    rel === '.codeadd/project/decisions.jsonl' || rel.startsWith('.codeadd/wiki/');
}

function deliveryPaths(hotfixDir, tree) {
  const found = new Set();
  const add = (rel) => { if (rel && !excluded(rel, hotfixDir)) found.add(rel); };
  if (tree) {
    const parent = gitMaybe(['rev-parse', `${tree}^1`], 'utf8');
    if (!parent) fail(1, `Merge/tree commit has no first parent: ${tree}`);
    splitZ(git(['diff', '--name-only', '--no-renames', '-z', `${parent.trim()}..${tree}`])).forEach(add);
  } else {
    const branch = git(['branch', '--show-current'], 'utf8').trim();
    let base = 'HEAD';
    if (branch !== 'main' && gitMaybe(['show-ref', '--verify', '--quiet', 'refs/heads/main'])) {
      base = git(['merge-base', 'HEAD', 'main'], 'utf8').trim();
    } else if (branch !== 'master' && gitMaybe(['show-ref', '--verify', '--quiet', 'refs/heads/master'])) {
      base = git(['merge-base', 'HEAD', 'master'], 'utf8').trim();
    }
    splitZ(git(['diff', '--name-only', '--no-renames', '-z', `${base}..HEAD`])).forEach(add);
    splitZ(git(['diff', '--cached', '--name-only', '--no-renames', '-z'])).forEach(add);
    splitZ(git(['diff', '--name-only', '--no-renames', '-z'])).forEach(add);
    splitZ(git(['ls-files', '--others', '--exclude-standard', '-z'])).forEach(add);
  }
  add(`${hotfixDir}/about.md`);
  add(`${hotfixDir}/iterations.jsonl`);
  return [...found].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
}

function stripCloseOutAddendum(text) {
  return text.replace(/^## Addendum: Additional Deliveries\r?\n[\s\S]*?(?=^## |(?![\s\S]))/m, '');
}

function normalizeAbout(content, aboutRel) {
  const hex = pathHex(aboutRel);
  let text = stripCloseOutAddendum(content.toString('utf8'));
  text = text.replace(/^reviewed-tree:[ \t]*.*$/m, 'reviewed-tree: <SELF>');
  text = text.replace(new RegExp(`^(present\\t\\d{6}\\t)([^\\t]+)(\\t${hex})$`, 'm'), '$1<SELF>$3');
  return Buffer.from(text, 'utf8');
}

function manifestEntries(hotfixDir, tree) {
  const aboutRel = `${hotfixDir}/about.md`;
  const paths = deliveryPaths(hotfixDir, tree);
  const entries = paths.filter((rel) => rel !== aboutRel).map((rel) => {
    const info = entryFor(rel, tree ? `tree:${tree}` : 'worktree');
    if (info.state === 'deleted') return { rel, state: 'deleted', mode: info.mode, hash: '-' };
    return { rel, state: 'present', mode: info.mode, hash: sha256(info.content) };
  });
  const about = entryFor(aboutRel, tree ? `tree:${tree}` : 'worktree');
  if (about.state === 'deleted') {
    entries.push({ rel: aboutRel, state: 'deleted', mode: about.mode, hash: '-' });
    return sortEntries(entries);
  }
  const placeholder = { rel: aboutRel, state: 'present', mode: about.mode, hash: '0'.repeat(64) };
  const canonical = sortEntries([...entries, placeholder]).map(manifestLine).join('\n');
  const current = about.content.toString('utf8');
  const receiptBlock = /(^### Reviewed Paths\r?\n```text\r?\n)[\s\S]*?(\r?\n```)/m;
  if (!receiptBlock.test(current)) fail(2, 'Missing Reviewed Paths manifest');
  const candidate = current.replace(receiptBlock, `$1${canonical}$2`);
  placeholder.hash = sha256(normalizeAbout(Buffer.from(candidate, 'utf8'), aboutRel));
  return sortEntries([...entries, placeholder]);
}

function manifestLine(entry) {
  return `${entry.state}\t${entry.mode}\t${entry.hash}\t${pathHex(entry.rel)}`;
}

function readAbout(hotfixDir, tree) {
  const rel = `${hotfixDir}/about.md`;
  const info = entryFor(rel, tree ? `tree:${tree}` : 'worktree');
  if (info.state === 'deleted') return null;
  return info.content.toString('utf8');
}

function parseReceiptManifest(text) {
  const match = text.match(/^### Reviewed Paths\r?\n```text\r?\n([\s\S]*?)\r?\n```/m);
  if (!match) fail(2, 'Missing Reviewed Paths manifest');
  const entries = [];
  const seen = new Set();
  for (const row of match[1].split(/\r?\n/).filter(Boolean)) {
    const parts = row.split('\t');
    if (parts.length !== 4 || !/^(present|deleted)$/.test(parts[0]) || !/^\d{6}$/.test(parts[1]) ||
        !(parts[2] === '-' || /^[0-9a-f]{64}$/.test(parts[2]))) fail(2, 'Malformed Reviewed Paths row');
    const rel = fromHex(parts[3]);
    if (seen.has(rel)) fail(2, 'Duplicate Reviewed Paths path');
    seen.add(rel);
    entries.push({ state: parts[0], mode: parts[1], hash: parts[2], rel });
  }
  return sortEntries(entries);
}

function compareManifest(expected, recorded) {
  if (expected.length !== recorded.length) fail(2, 'Reviewed Paths does not equal the required delivery path set');
  for (let i = 0; i < expected.length; i += 1) {
    if (manifestLine(expected[i]) !== manifestLine(recorded[i])) {
      fail(2, `Reviewed Paths mismatch: ${expected[i]?.rel || recorded[i]?.rel}`);
    }
  }
}

function fingerprintFor(hotfixDir, tree) {
  const text = readAbout(hotfixDir, tree);
  if (text === null) fail(2, 'Missing hotfix about.md');
  const expected = manifestEntries(hotfixDir, tree);
  const recorded = parseReceiptManifest(text);
  compareManifest(expected, recorded);
  return `sha256:${sha256(Buffer.from(expected.map(manifestLine).join('\n') + '\n', 'utf8'))}`;
}

function reviewManifest() {
  const { hotfixDir, tree } = parseReviewArgs();
  const entries = manifestEntries(hotfixDir, tree);
  console.log('PATHS_BEGIN');
  entries.forEach((entry) => console.log(manifestLine(entry)));
  console.log('PATHS_END');
}

function reviewFingerprint() {
  const { hotfixDir, tree } = parseReviewArgs();
  console.log(`REVIEWED_TREE=${fingerprintFor(hotfixDir, tree)}`);
}

function reviewValidate() {
  const { hotfixDir, tree } = parseReviewArgs();
  const text = readAbout(hotfixDir, tree);
  if (text === null) {
    console.log('HOTFIX_REVIEW=missing\nRECORDED=-\nCURRENT=-\nDETAIL=Missing hotfix about.md');
    process.exit(3);
  }
  let status;
  let recorded;
  try {
    status = oneScalar(text, 'status', /^(passed|blocked)$/);
    recorded = oneScalar(text, 'reviewed-tree', /^sha256:[0-9a-f]{64}$/);
    oneScalar(text, 'reviewer', /^(named|generic|inline)$/);
    oneScalar(text, 'reviewed-at', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
    oneScalar(text, 'build', /^(passed|blocked)$/);
    oneScalar(text, 'pinned-test', /^(passed|blocked|none:.+)$/);
  } catch (error) {
    if (!(error instanceof ExitError) || error.code !== 2) throw error;
    console.log('HOTFIX_REVIEW=malformed\nRECORDED=-\nCURRENT=-\nDETAIL=' + error.message);
    process.exit(3);
  }
  if (status === 'blocked') {
    console.log(`HOTFIX_REVIEW=blocked\nRECORDED=${recorded}\nCURRENT=-\nDETAIL=Receipt status is blocked`);
    process.exit(3);
  }
  const findings = text.match(/^### Findings\r?\n([\s\S]*?)(?=^### |^## |(?![\s\S]))/m)?.[1] || '';
  for (const line of findings.split(/\r?\n/)) {
    if (!/^\|/.test(line) || /^\|[-: |]+$/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells[0] === 'ID' || cells.length < 8) continue;
    if (/^(blocker|major)$/.test(cells[1]) && !((cells[5] === 'fixed' && cells[6] === 'addressed') || cells[5] === 'accepted')) {
      console.log(`HOTFIX_REVIEW=blocked\nRECORDED=${recorded}\nCURRENT=-\nDETAIL=Open ${cells[1]} finding ${cells[0]}`);
      process.exit(3);
    }
  }
  let current;
  try {
    current = fingerprintFor(hotfixDir, tree);
  } catch (error) {
    if (!(error instanceof ExitError) || error.code !== 2) throw error;
    console.log(`HOTFIX_REVIEW=stale\nRECORDED=${recorded}\nCURRENT=-\nDETAIL=${error.message}`);
    process.exit(3);
  }
  if (recorded !== current) {
    console.log(`HOTFIX_REVIEW=stale\nRECORDED=${recorded}\nCURRENT=${current}\nDETAIL=Reviewed tree fingerprint changed`);
    process.exit(3);
  }
  console.log(`HOTFIX_REVIEW=ok\nRECORDED=${recorded}\nCURRENT=${current}\nDETAIL=Passed receipt matches the reviewed tree`);
}

try {
  assertRepo();
  const handlers = {
    'diagnosis-baseline': diagnosisBaseline,
    'diagnosis-check': diagnosisCheck,
    'snapshot-wave': snapshotWave,
    'diff-wave': diffWave,
    'review-manifest': reviewManifest,
    'review-fingerprint': reviewFingerprint,
    'review-validate': reviewValidate,
  };
  if (!handlers[mode]) fail(2, `Unknown mode: ${mode}`);
  handlers[mode]();
} catch (error) {
  if (error instanceof ExitError) {
    console.error(`ERROR=${error.message}`);
    process.exit(error.code);
  }
  console.error(`ERROR=${error.message}`);
  process.exit(1);
}
NODE
