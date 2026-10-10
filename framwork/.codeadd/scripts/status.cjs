#!/usr/bin/env node
/**
 * status.cjs — Compact development status stream (native port of status.sh).
 *
 * STEP 1 of every command reads this. It prints a flat KEY:value stream that
 * an agent parses: the current branch, the feature/hotfix context and phase,
 * recent changelogs, the pending backlog, working-tree changes, the wiki
 * staleness signal, the QA setup-receipt signal, and one recommendation.
 *
 * THE SURFACE IS THE SHELL'S, FIELD FOR FIELD. The default context, the phase
 * ladder, the epic (plan.md `### Feature N:`) and legacy epic.md header
 * resolution, the `next-id <PREFIX>` subcommand, receipt staleness and the
 * absent/malformed behaviours are all preserved. The two behaviours the plan
 * deliberately changes are recorded in the F7/F8 headers: `git`/metadata come
 * from the native siblings rather than shelling out to the `.sh` helpers, and
 * ID allocation is delegated to the one canonical core.
 *
 * ALLOCATION IS NOT HERE. `next-id <PREFIX>` validates its own named prefixes
 * (F|H|PRD|CHG|B, exit 2 on anything else) then delegates to `backlog-id.cjs`,
 * the same core `next-id.cjs` uses. `cli/tests/backlog-id.test.js` holds the
 * two entries to the same answer; the native suite holds the Node-to-Node
 * agreement. There is one allocator.
 *
 * THE BOARD LINE. The main run prints one `BOARD=<state>` line right after the
 * BRANCH line: ready | none | migration-required | branch-missing |
 * checkout-missing, from backlog-board.cjs. It resolves WITHOUT a sync and it
 * never changes the exit code, whatever the board state — twenty commands and
 * agents run this script and none of them may fail on the board. The
 * `next-id` subcommand resolves with the throttled sync and counts ticket ids
 * in the board clone; in any state but `ready` only feature directories count.
 *
 * GUARDS ARE PRESERVED: git must be on PATH and the cwd must be a git
 * repository, each exiting 1 with the shell's ERROR line. The next-id
 * subcommand deliberately runs before those guards, exactly as the shell did,
 * so it works outside a repository.
 *
 * FRONTMATTER IS BOUNDED. The setup receipt's `setup-shape` is read only
 * between the first `---` and the closing `---`, CRLF-tolerant, so a Decision
 * Log row that also names a shape can never leak into the recorded value.
 *
 * Dependencies: Node >= 22.19.0 built-ins and `git`. No bash, no WSL, and no
 * import-time I/O in the sibling modules it requires.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// The three shipped siblings are a closure: if one is missing the installation
// is broken, and the shell's existence checks reported that cleanly rather than
// throwing a stack trace. Load them defensively and surface the same kind of
// ERROR line from main().
let idc = null;
let mainBranchMod = null;
let branchMetaMod = null;
let boardMod = null;
try {
  boardMod = require('./backlog-board.cjs');
} catch (e) {
  boardMod = null;
}
try {
  idc = require('./backlog-id.cjs');
} catch (e) {
  idc = null;
}
try {
  mainBranchMod = require('./get-main-branch.cjs');
} catch (e) {
  mainBranchMod = null;
}
try {
  branchMetaMod = require('./get-branch-metadata.cjs');
} catch (e) {
  branchMetaMod = null;
}

const PREFIXES = ['F', 'H', 'PRD', 'CHG', 'B'];
const DOCS_FEATURES = path.join('docs', 'features');

/** One human-readable stderr line per canonical-core refusal. */
const REFUSAL_MESSAGE = {
  'id-exhausted': 'ERROR: ID sequence exhausted (no number above 9999)',
  'features-unreadable': 'ERROR: docs/features is unreadable',
  'backlog-unreadable': 'ERROR: the board file docs/backlog.jsonl in the board clone is unreadable',
};

// ─── Small filesystem/git helpers ────────────────────────────────────────────

/** One git invocation, argv array, explicit cwd; never a shell. */
function git(cwd, args) {
  const res = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: res.status === null || res.status === undefined ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (e) {
    return false;
  }
}

function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return '';
  }
}

/** `wc -l`: the number of newline bytes, exactly. */
function countNewlines(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === '\n') n++;
  return n;
}

/** Repo-relative paths in the shell's forward-slash form. */
function posix(rel) {
  return rel.split(path.sep).join('/');
}

/** `grep -q '^PATTERN'` over the whole file. */
function hasLine(file, re) {
  return re.test(read(file));
}

// ─── Feature-doc helpers ─────────────────────────────────────────────────────

/**
 * HAS_DESIGN: a feature-level design.md OR a design.md under any immediate
 * `subfeatures/SF*` directory, exactly the shell's two probes.
 */
function hasDesign(featureDir) {
  if (isFile(path.join(featureDir, 'design.md'))) return true;
  const sfRoot = path.join(featureDir, 'subfeatures');
  if (!isDir(sfRoot)) return false;
  let entries;
  try {
    entries = fs.readdirSync(sfRoot);
  } catch (e) {
    return false;
  }
  for (const name of entries) {
    if (name.startsWith('SF') && isFile(path.join(sfRoot, name, 'design.md'))) return true;
  }
  return false;
}

/** The phase ladder, shared by the current feature and the pending backlog. */
function currentFeaturePhase(featureDir, hasDesignNow) {
  if (isFile(path.join(featureDir, 'changelog.md'))) return 'done';
  if (isFile(path.join(featureDir, 'plan.md'))) return 'planned';
  if (hasDesignNow) return 'designed';
  if (isFile(path.join(featureDir, 'discovery.md'))) {
    return hasLine(path.join(featureDir, 'discovery.md'), /^## Summary for Planning/m)
      ? 'discovered'
      : 'discovering';
  }
  if (isFile(path.join(featureDir, 'about.md'))) {
    return read(path.join(featureDir, 'about.md')).includes('[Clear description')
      ? 'created'
      : 'documented';
  }
  return 'created';
}

/**
 * `grep -A1 '^## Summary' FILE | grep '^{' | head -1`: the first line that
 * immediately follows a `## Summary` heading and starts with `{`.
 */
function summaryAfter(file) {
  const lines = read(file).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## Summary') && lines[i + 1] && lines[i + 1].startsWith('{')) {
      return lines[i + 1];
    }
  }
  return '';
}

/**
 * The last `## Updates` entry, transformed exactly as the shell pipeline did:
 * strip the surrounding `[` `]`, split on `},{`, and prefix the final field
 * with `{`. The `!= "{"` guard is preserved.
 */
function lastUpdate(file) {
  const lines = read(file).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('## Updates')) continue;
    const next = lines[i + 1];
    if (!next || !next.startsWith('[{')) continue;
    let body = next;
    if (body.startsWith('[')) body = body.slice(1);
    if (body.endsWith(']')) body = body.slice(0, -1);
    const fields = body.split('},{');
    const result = '{' + fields[fields.length - 1];
    return result === '{' ? '' : result;
  }
  return '';
}

/**
 * The epic.md Subfeatures table, resolved by HEADER NAME exactly as
 * converge-gates.sh gate 3 and the shell status do. A header counts only when
 * it names BOTH a status and an sf/id column; the header resets at every table
 * boundary; rows are found through the RESOLVED id column. `in_progress` wins
 * over `pending` for the current subfeature.
 */
function parseEpicTable(content) {
  const lines = content.split('\n');
  let header = false;
  let statusidx = 0;
  let ididx = 0;
  let total = 0;
  let done = 0;
  let inprog = '';
  let pend = '';
  let anyheader = false;

  for (const line of lines) {
    if (!line.startsWith('|')) {
      header = false;
      statusidx = 0;
      ididx = 0;
      continue;
    }
    const cells = line.split('|');

    if (!header) {
      let s_i = 0;
      let i_i = 0;
      // awk fields are 1-based with $1 the empty text before the leading `|`;
      // the JS split index is one lower, so awk's i=2 — the first named cell —
      // is cells[1].
      for (let i = 1; i < cells.length; i++) {
        const cell = cells[i].trim().toLowerCase();
        if (cell === 'status') s_i = i;
        if (cell === 'sf' || cell === 'id') i_i = i;
      }
      if (s_i && i_i) {
        statusidx = s_i;
        ididx = i_i;
        header = true;
        anyheader = true;
      }
      continue;
    }

    const id = (cells[ididx] || '').trim();
    if (!/^SF[0-9]+$/.test(id)) continue;
    const st = (cells[statusidx] || '').trim().toLowerCase();
    total++;
    if (st === 'done') done++;
    else if (st === 'in_progress') {
      if (inprog === '') inprog = id;
    } else if (st === 'pending') {
      if (pend === '') pend = id;
    }
  }

  return { mode: anyheader ? 'HEADER' : 'NOHEADER', total, done, inprog, pend };
}

/** First `SF[0-9]+` on a row carrying the given literal status cell. */
function firstSfWithStatus(rows, status) {
  const re = new RegExp('\\|[ \\t]*' + status + '[ \\t]*\\|');
  for (const row of rows) {
    if (re.test(row)) {
      const m = /SF[0-9]+/.exec(row);
      if (m) return m[0];
    }
  }
  return '';
}

/** TASK rows `| N.N ...` and how many carry a check mark. */
function taskProgress(file) {
  const rows = read(file)
    .split('\n')
    .filter((l) => /^\| [0-9]+\.[0-9]+/.test(l));
  return { total: rows.length, done: rows.filter((l) => l.includes('✅')).length };
}

/** The first sorted immediate `subfeatures/<SF>-*` directory. */
function findSubfeatureDir(featureDir, sf) {
  const root = path.join(featureDir, 'subfeatures');
  if (!isDir(root)) return '';
  let entries;
  try {
    entries = fs.readdirSync(root);
  } catch (e) {
    return '';
  }
  const matches = entries.filter((n) => n.startsWith(sf + '-')).sort();
  for (const name of matches) {
    const full = path.join(root, name);
    if (isDir(full)) return full;
  }
  return '';
}

// ─── Changelog helpers ───────────────────────────────────────────────────────

/** Every changelog.md under docs/features, newest mtime first, capped at 5. */
function recentChangelogs(featuresDir) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === 'changelog.md') {
        let mtime = 0;
        try {
          mtime = fs.statSync(full).mtimeMs;
        } catch (e) {
          mtime = 0;
        }
        found.push({ full, mtime });
      }
    }
  };
  walk(featuresDir);
  found.sort((a, b) => b.mtime - a.mtime);
  return found.slice(0, 5).map((f) => f.full);
}

/** The shell awk: first non-heading, non-quote, non-empty body line. */
function changelogSummary(file) {
  const lines = read(file).split('\n');
  let found = false;
  for (const line of lines) {
    if (/^## Resumo/.test(line) || /^## Summary/.test(line) || /^## TL;DR/.test(line)) {
      found = true;
      continue;
    }
    if (found && line !== '' && !'#>['.includes(line.charAt(0)) && line.trim() !== '') {
      return line.replace(/^[ \t]+|[ \t]+$/g, '');
    }
  }
  return '';
}

/** Fallback summary: the first `# ` heading, stripped. */
function firstHeading(file) {
  for (const line of read(file).split('\n')) {
    if (line.startsWith('# ')) return line.slice(2);
  }
  return '';
}

// ─── Setup-receipt helpers ───────────────────────────────────────────────────

/**
 * The recorded `setup-shape` from the receipt FRONTMATTER only: between the
 * first `---` line and the closing `---`. CRLF-tolerant; the first match wins.
 */
function recordedSetupShape(content) {
  const lines = content.split('\n').map((l) => l.replace(/\r$/, ''));
  if (!/^---$/.test(lines[0] || '')) return '';
  for (let i = 1; i < lines.length; i++) {
    if (/^---$/.test(lines[i])) break;
    const m = /^setup-shape:[ \t]*sha256:([0-9a-f]+)[ \t]*$/.exec(lines[i]);
    if (m) return 'sha256:' + m[1];
  }
  return '';
}

/** The shipped shape from contracts.json, found after the `add-qa-setup` key. */
function shippedSetupShape(content) {
  let seen = false;
  for (const line of content.split('\n')) {
    if (/"add-qa-setup"[ \t]*:/.test(line)) seen = true;
    if (!seen) continue;
    const m = /"shape"[ \t]*:[ \t]*"(sha256:[0-9a-f]+)"/.exec(line);
    if (m) return m[1];
  }
  return '';
}

/** QA state exists on disk without a receipt. */
function setupMaterialized(cwd) {
  if (isFile(path.join(cwd, 'docs', 'qa', 'config.json'))) return true;
  for (const d of ['.claude', '.agents', '.agent', '.cursor', '.opencode']) {
    if (isFile(path.join(cwd, d, 'skills', 'qa-project', 'SKILL.md'))) return true;
  }
  return false;
}

// ─── FILES/CHANGED glob renderer (the shell awk, reproduced) ─────────────────

function globOutput(files) {
  const groups = new Map();
  const order = [];
  for (const file of files) {
    const parts = file.split('/');
    let dir;
    let name;
    if (parts.length > 1) {
      dir = parts.slice(0, -1).join('/');
      name = parts[parts.length - 1];
    } else {
      dir = '.';
      name = file;
    }
    const m = /\.[^.]+$/.exec(name);
    const ext = m ? m[0] : '';
    const base = m ? name.slice(0, m.index) : name;
    const key = dir + '|' + ext;
    if (!groups.has(key)) {
      groups.set(key, { base, count: 1, dir, ext });
      order.push(key);
    } else {
      const g = groups.get(key);
      g.count++;
      if (g.count <= 10) g.base = g.base + ',' + base;
    }
  }
  let result = '';
  for (const key of order) {
    const g = groups.get(key);
    let entry;
    if (g.count === 1) {
      entry = g.dir + '/' + g.base + g.ext;
    } else {
      const extra = g.count > 10 ? ',+' + (g.count - 10) : '';
      entry = g.dir + '/{' + g.base + extra + '}' + g.ext;
    }
    result += (result ? '|' : '') + entry;
  }
  return result;
}

/**
 * The board's state for the one BOARD= line. Resolved WITHOUT a sync, and it
 * never fails: any surprise reads as `none`, and the exit code is not touched.
 */
function boardState(cwd) {
  try {
    return boardMod ? boardMod.resolve(cwd).state : 'none';
  } catch (e) {
    return 'none';
  }
}

// ─── The entry ───────────────────────────────────────────────────────────────

/**
 * Run the entry. `argv` is the full process argv so that `argv[2]` and
 * `argv[3]` are the subcommand and its prefix, exactly as the shell read `$1`
 * and `$2`. Returns the process exit code.
 *
 * @param {string[]} [argv]
 * @returns {number}
 */
function main(argv) {
  const args = argv || process.argv;
  const cwd = process.cwd();

  // SUBCOMMAND: next-id <PREFIX> — before every git guard, as the shell had it.
  if (args[2] === 'next-id') {
    const prefix = args[3] === undefined ? '' : args[3];
    if (!PREFIXES.includes(prefix)) {
      process.stderr.write(
        `ERROR:unknown prefix '${prefix}' (valid: F, H, PRD, CHG, B)\n`,
      );
      return 2;
    }
    if (!idc) {
      process.stderr.write('ERROR:backlog-id.cjs not found or unreadable beside status.cjs\n');
      return 1;
    }
    // Ticket ids are counted in the board clone (synced, throttled); with no
    // board, only the feature directories count.
    const boardRoot = boardMod ? boardMod.allocationRoot(cwd, { sync: true }).boardRoot : null;
    const result = idc.calculate(cwd, prefix, { allowOverflow: true, boardRoot });
    if (!result.ok) {
      process.stderr.write(`${REFUSAL_MESSAGE[result.reason] || 'ERROR: id-allocation-failed'}\n`);
      return 1;
    }
    process.stdout.write(result.id + '\n');
    return 0;
  }

  // GUARDS: git on PATH, and inside a repository.
  const probe = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    process.stderr.write('ERROR:git not found in PATH\n');
    return 1;
  }
  if (git(cwd, ['rev-parse', '--git-dir']).status !== 0) {
    process.stderr.write('ERROR:not a git repository\n');
    return 1;
  }

  const mainResult = mainBranchMod ? mainBranchMod.discoverMainBranch(cwd) : null;
  if (!mainResult) {
    process.stderr.write('ERROR:get-main-branch.cjs not found or unreadable beside status.cjs\n');
    return 1;
  }
  if (!mainResult.ok) {
    if (mainResult.reason === 'not-a-git-repo') {
      process.stderr.write('ERROR:current directory is not a git repository.\n');
      return 1;
    }
    process.stderr.write('ERROR:no main branch found (main/master absent locally and remotely).\n');
    return 2;
  }
  const mainBranch = mainResult.branch;

  if (!branchMetaMod) {
    process.stderr.write('ERROR:get-branch-metadata.cjs not found or unreadable beside status.cjs\n');
    return 1;
  }
  const meta = branchMetaMod.branchMetadata(branchMetaMod.currentBranch(cwd));
  const currentBranchName = meta.BRANCH_NAME;
  const branchType = meta.BRANCH_TYPE;
  const featureId = meta.FEATURE_SLUG;
  const featureDir = meta.DOCS_DIR || path.join(DOCS_FEATURES, meta.FEATURE_SLUG);

  const out = [];
  const say = (line) => out.push(line);

  say(`BRANCH:${currentBranchName} TYPE:${branchType} MAIN:${mainBranch}`);
  say(`BOARD=${boardState(cwd)}`);

  let phase = 'none';
  let pendingFirstId = '';
  let behind = 0;

  // FEATURE — only on a branch that carries an id.
  if (featureId) {
    const absFeatureDir = path.join(cwd, featureDir);

    if (isDir(absFeatureDir)) {
      const hasDesignNow = hasDesign(absFeatureDir);

      const docsList = [];
      for (const doc of ['about.md', 'discovery.md', 'design.md', 'plan.md', 'changelog.md']) {
        if (doc === 'design.md') {
          if (hasDesignNow) docsList.push(doc);
        } else if (isFile(path.join(absFeatureDir, doc))) {
          docsList.push(doc);
        }
      }

      phase = currentFeaturePhase(absFeatureDir, hasDesignNow);

      say(`FEATURE:${featureId} PHASE:${phase} DIR:${posix(featureDir)}`);
      if (docsList.length) say(`DOCS:${docsList.join(',')}`);
      say(`HAS_DESIGN:${hasDesignNow ? 'true' : 'false'}`);

      // Iterations context — previous /add-build sessions, JSONL.
      const iterFile = path.join(absFeatureDir, 'iterations.jsonl');
      if (isFile(iterFile)) {
        const content = read(iterFile);
        const iterCount = countNewlines(content);
        if (iterCount > 0) {
          const all = content.split('\n');
          if (all[all.length - 1] === '') all.pop();
          say(`ITERATIONS:${iterCount}`);
          say(`LAST_ITERS:${all.slice(-3).join('§')}`);
          say(`ITERATIONS_FILE:${posix(path.join(featureDir, 'iterations.jsonl'))}`);
        }
      }

      // Summaries and last update from the feature docs.
      const aboutPath = path.join(absFeatureDir, 'about.md');
      if (isFile(aboutPath)) {
        const aboutSummary = summaryAfter(aboutPath);
        if (aboutSummary) say(`ABOUT_SUMMARY:${aboutSummary}`);
        const update = lastUpdate(aboutPath);
        if (update) say(`LAST_UPDATE:${update}`);
      }
      const discPath = path.join(absFeatureDir, 'discovery.md');
      if (isFile(discPath)) {
        const discSummary = summaryAfter(discPath);
        if (discSummary) say(`DISC_SUMMARY:${discSummary}`);
      }

      // EPIC from plan.md (`## Epic:` / `### Feature N:`).
      const planPath = path.join(absFeatureDir, 'plan.md');
      if (isFile(planPath)) {
        const planLines = read(planPath).split('\n');
        let epicName = '';
        const epicLine = planLines.find((l) => l.startsWith('## Epic:'));
        if (epicLine) {
          epicName = epicLine.replace(/^## Epic:[ \t]*/, '').toLowerCase().split(' ').join('-');
        }
        const totalFeatures = planLines.filter((l) => /^### Feature [0-9]+:/.test(l)).length;
        if (totalFeatures > 0) {
          let completed = 0;
          const iterFile2 = path.join(absFeatureDir, 'iterations.jsonl');
          if (isFile(iterFile2)) {
            const it = read(iterFile2);
            completed = (it.match(/"slug":"feature-[0-9]+-complete"/g) || []).length;
            if (completed === 0) {
              const slugs = new Set();
              for (const m of it.matchAll(/"slug":"(feature-[0-9]+)/g)) slugs.add(m[1]);
              completed = slugs.size;
            }
          }
          const nextFeature = completed + 1;
          if (epicName) say(`EPIC:${epicName}`);
          if (nextFeature > totalFeatures) {
            say(`FEATURES:${completed}/${totalFeatures} STATUS:all_complete`);
          } else {
            say(`FEATURES:${completed}/${totalFeatures} NEXT:${nextFeature}`);
            const nameLine = planLines.find((l) => new RegExp('^### Feature ' + nextFeature + ':').test(l));
            if (nameLine) {
              const nextName = nameLine.replace(/^### Feature [0-9]+:[ \t]*/, '');
              if (nextName) say(`NEXT_FEATURE_NAME:${nextName}`);
            }
          }
        }
      }

      // EPIC.MD — header-resolved, with the pre-schema fallback.
      const epicMdPath = path.join(absFeatureDir, 'epic.md');
      if (isFile(epicMdPath)) {
        say('HAS_EPIC:true');
        const content = read(epicMdPath);
        const parsed = parseEpicTable(content);
        let totalSf;
        let doneSf;
        let currentSf;
        if (parsed.mode !== 'HEADER') {
          const rows = content.split('\n').filter((l) => /^\| SF[0-9]+/.test(l));
          totalSf = rows.length;
          doneSf = rows.filter((l) => /\|[ \t]*done[ \t]*\|/.test(l)).length;
          currentSf = firstSfWithStatus(rows, 'in_progress') || firstSfWithStatus(rows, 'pending');
        } else {
          totalSf = parsed.total;
          doneSf = parsed.done;
          currentSf = parsed.inprog || parsed.pend;
        }
        say(`EPIC_PROGRESS:${doneSf || 0}/${totalSf || 0}`);
        if (currentSf) say(`EPIC_CURRENT_SF:${currentSf}`);

        if (currentSf) {
          const sfDir = findSubfeatureDir(absFeatureDir, currentSf);
          const tasksFile = sfDir ? path.join(sfDir, 'tasks.md') : '';
          if (tasksFile && isFile(tasksFile)) {
            const t = taskProgress(tasksFile);
            say('HAS_TASKS:true');
            say(`TASKS_PROGRESS:${t.done}/${t.total}`);
            say(`TASKS_FILE:${posix(path.relative(cwd, tasksFile))}`);
          }
        }
      } else {
        const plainTasks = path.join(absFeatureDir, 'tasks.md');
        if (isFile(plainTasks)) {
          const t = taskProgress(plainTasks);
          say('HAS_TASKS:true');
          say(`TASKS_PROGRESS:${t.done}/${t.total}`);
          say(`TASKS_FILE:${posix(path.join(featureDir, 'tasks.md'))}`);
        }
      }

      // Last checkpoint tag for this feature.
      const tags = git(
        cwd,
        ['tag', '-l', `checkpoint/${featureId}-*-done`, `checkpoint/${featureId}-done`],
      )
        .stdout.split('\n')
        .filter(Boolean)
        .sort()
        .reverse();
      if (tags.length) say(`LAST_CHECKPOINT:${tags[0]}`);
    } else {
      say(`FEATURE:${featureId} PHASE:none DIR:${posix(featureDir)} (not found)`);
    }
  }

  // RECENT_CHANGELOGS — the last five completed features, cross-feature context.
  const featuresRoot = path.join(cwd, DOCS_FEATURES);
  if (isDir(featuresRoot)) {
    const changelogs = recentChangelogs(featuresRoot);
    if (changelogs.length) {
      say('RECENT_CHANGELOGS:');
      for (const cl of changelogs) {
        const rel = posix(path.relative(cwd, cl));
        const m = /[0-9]{4}[A-Z]-[^/]+/.exec(rel);
        const feat = m ? m[0] : '';
        if (feat === featureId) continue;
        let summary = changelogSummary(cl).slice(0, 120);
        if (!summary) summary = firstHeading(cl).slice(0, 80);
        if (summary) say(`  ${feat}|${summary}`);
      }
      say('CHANGELOGS_PATH:docs/features/{[0-9][0-9][0-9][0-9][A-Z]-*}/changelog.md');
    }
  }

  // PENDING — docs exist, not built, and no branch yet.
  if (isDir(featuresRoot)) {
    const dirs = fs
      .readdirSync(featuresRoot)
      .filter((n) => /^[0-9]{4}[A-Z]-/.test(n))
      .sort();
    for (const dname of dirs) {
      const fdir = path.join(featuresRoot, dname);
      if (!isDir(fdir)) continue;
      if (!isFile(path.join(fdir, 'about.md'))) continue;
      if (isFile(path.join(fdir, 'changelog.md'))) continue;
      if (git(cwd, ['branch', '--list', `*/${dname}`]).stdout.trim() !== '') continue;

      const hd = hasDesign(fdir);
      let pendingPhase;
      if (isFile(path.join(fdir, 'plan.md'))) pendingPhase = 'planned';
      else if (hd) pendingPhase = 'designed';
      else if (isFile(path.join(fdir, 'discovery.md'))) {
        pendingPhase = hasLine(path.join(fdir, 'discovery.md'), /^## Summary for Planning/m)
          ? 'discovered'
          : 'discovering';
      } else if (read(path.join(fdir, 'about.md')).includes('[Clear description')) {
        pendingPhase = 'created';
      } else {
        pendingPhase = 'documented';
      }

      say(`PENDING:${dname} PHASE:${pendingPhase}`);
      if (!pendingFirstId) {
        const pm = /^[0-9]{4}[A-Z]/.exec(dname);
        if (pm) pendingFirstId = pm[0];
      }
    }
  }

  // GIT STATUS — only when the working tree has changes.
  const modified = countNewlines(git(cwd, ['diff', '--name-only']).stdout);
  const staged = countNewlines(git(cwd, ['diff', '--cached', '--name-only']).stdout);
  const untracked = countNewlines(git(cwd, ['ls-files', '--others', '--exclude-standard']).stdout);
  if (modified > 0 || staged > 0 || untracked > 0) {
    let gitLine = `GIT:M${modified} S${staged} U${untracked}`;
    if (branchType !== 'detached') {
      if (git(cwd, ['rev-parse', '--verify', `origin/${currentBranchName}`]).status === 0) {
        const a = git(cwd, ['rev-list', '--count', `origin/${currentBranchName}..${currentBranchName}`]);
        const b = git(cwd, ['rev-list', '--count', `${currentBranchName}..origin/${currentBranchName}`]);
        const ahead = a.status === 0 ? parseInt(a.stdout.trim(), 10) || 0 : 0;
        behind = b.status === 0 ? parseInt(b.stdout.trim(), 10) || 0 : 0;
        if (ahead !== 0) gitLine += ` AHEAD:${ahead}`;
      }
      if (behind !== 0) gitLine += ` BEHIND:${behind}`;
    }
    say(gitLine);
  }

  // FILES CHANGED — glob-like output for token efficiency, off main only.
  if (branchType !== 'main') {
    const mb = git(cwd, ['merge-base', currentBranchName, mainBranch]);
    const mergeBase = mb.status === 0 ? mb.stdout.trim() : '';
    if (mergeBase) {
      const set = new Set();
      const cmds = [
        ['diff', '--name-only', `${mergeBase}..HEAD`],
        ['diff', '--cached', '--name-only'],
        ['diff', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ];
      for (const cmd of cmds) {
        for (const f of git(cwd, cmd).stdout.split('\n')) if (f) set.add(f);
      }
      const files = [...set]
        .sort()
        .filter((f) => !f.startsWith('.') && !/^[^/]*\.md$/.test(f) && !f.startsWith('docs/'));
      if (files.length) {
        say(`FILES:${files.length}`);
        say(`CHANGED:${globOutput(files)}`);
      }
    }
  }

  // WIKI — staleness signal from .codeadd/wiki/.
  const wikiIndex = path.join(cwd, '.codeadd', 'wiki', 'index.md');
  const wikiMeta = path.join(cwd, '.codeadd', 'wiki', '.meta.json');
  if (isFile(wikiIndex)) {
    say('WIKI:present');
    let sha = '';
    if (isFile(wikiMeta)) {
      const m = /"gitHead"[ \t]*:[ \t]*"([^"]*)"/.exec(read(wikiMeta));
      if (m) sha = m[1];
    }
    if (sha !== '' && git(cwd, ['cat-file', '-e', `${sha}^{commit}`]).status === 0) {
      const rp = git(cwd, ['rev-parse', '--short', sha]);
      const short = rp.status === 0 ? rp.stdout.trim() : sha;
      say(`WIKI_COMMIT:${short}`);
      const stale = countNewlines(git(cwd, ['diff', '--name-only', `${sha}..HEAD`]).stdout);
      say(`WIKI_STALE_COUNT:${stale}`);
      if (stale > 0) {
        say(`WIKI_HINT:Wiki may be stale (${stale} source changes) — /add-wiki update`);
      }
    } else {
      say('WIKI_STALE_COUNT:unknown');
      say('WIKI_HINT:Wiki stamp unreachable — consider /add-wiki update');
    }
  } else if (isDir(path.join(cwd, '.codeadd', 'project'))) {
    const projDir = path.join(cwd, '.codeadd', 'project');
    let names = [];
    try {
      names = fs.readdirSync(projDir);
    } catch (e) {
      names = [];
    }
    const bases = names
      .filter((n) => n.endsWith('.md') && isFile(path.join(projDir, n)))
      .map((n) => n.replace(/\.md$/, ''))
      .sort();
    if (bases.length) {
      say(`PROJECT_PATTERNS:${bases.length}`);
      say(`PROJECT_DOCS:.codeadd/project/{${bases.join(',')}}.md`);
      say('PROJECT_HINT:Run /add-wiki to upgrade to the wiki knowledge base');
    }
  } else {
    say('WIKI:absent');
    say('WIKI_HINT:Run /add-wiki to generate the knowledge base');
  }

  // SETUP SHAPE — materialized-state staleness for add-qa-setup.
  const receipt = path.join(cwd, 'docs', 'qa', 'qa-setup.md');
  const sidecar = path.join(cwd, '.codeadd', 'contracts.json');
  if (isFile(receipt)) {
    say('SETUP_QA:present');
    const recorded = recordedSetupShape(read(receipt));
    const shipped = isFile(sidecar) ? shippedSetupShape(read(sidecar)) : '';
    if (recorded && shipped) {
      if (recorded !== shipped) {
        say('SETUP_QA_STALE:yes');
        say('SETUP_QA_HINT:QA setup does not match the shipped shape — /add-qa-setup');
      }
    } else if (shipped === '') {
      // Pre-contracts install — stay silent, never guess.
    } else {
      say('SETUP_QA_STALE:yes');
      say('SETUP_QA_HINT:QA receipt carries no readable setup-shape — /add-qa-setup');
    }
  } else if (setupMaterialized(cwd)) {
    say('SETUP_QA:stale');
    say('SETUP_QA_STALE:yes');
    say('SETUP_QA_HINT:QA state exists without a current receipt — /add-qa-setup');
  } else {
    say('SETUP_QA:absent');
  }

  // RECOMMENDATIONS — only when actionable.
  let recs = '';
  if (branchType === 'main') {
    recs = pendingFirstId ? `/add-build ${pendingFirstId} or /add-new to start` : '/add-new to start';
  } else if (branchType === 'hotfix') {
    recs = '/add-done';
  } else if (featureId) {
    if (!isDir(path.join(cwd, featureDir))) recs = '/add-new to setup';
    else if (phase === 'created' || phase === 'documented') recs = '/add-new to complete discovery';
    else if (phase === 'discovered' || phase === 'designed') recs = '/add-plan to create plan';
    else if (phase === 'planned') recs = '/add-build to implement';
    else if (phase === 'done') recs = '/add-review or /add-done';
  }
  if (behind !== 0) recs = recs ? `${recs} | git pull (behind)` : 'git pull (behind)';
  if (recs) say(`REC:${recs}`);

  process.stdout.write(out.join('\n') + '\n');
  return 0;
}

module.exports = { main };

if (require.main === module) {
  process.exitCode = main(process.argv);
}
