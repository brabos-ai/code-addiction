import { describe, it, expect, afterEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Brainstorm greenfield (ticket 0064B) — the validation matrix L1 of plan
 * `docs/plans/2026-10-24T190124-PLAN--brainstorm-greenfield.md`.
 *
 * RED FIRST. Every non-GUARD assertion (L1.1-L1.10) was confirmed FAILING
 * against the tree before F2 landed, and is driven GREEN by F2-F9. A test
 * written after the fix proves nothing.
 *
 * GUARD assertions (they pass before the edits and must keep passing):
 *   - L1.11 the shape of add-brainstorm.md (no numeric STEP, same STEP ids,
 *           same slot count, the approval options)
 *   - L1.12 0062B is merged (the Stack Conventions format and the decided-row
 *           rule exist). A failure here is a hard stop, not a RED to drive GREEN
 *   - L1.13 add--project-scaffolding is not re-added
 *   - L1.14 the three status.cjs behaviours the greenfield tolerance relies on
 *
 * It reads `framwork/.codeadd/` source and `web/src/pages/docs.astro`, never
 * the build output. The status.cjs cases run in temp directories under the OS
 * temp dir, removed in afterEach; nothing is written in the checkout.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (p) => fs.readFileSync(p, 'utf8');

const BRAINSTORM = read(path.join(CODEADD, 'commands', 'add-brainstorm.md'));
const ECOSYSTEM = read(path.join(CODEADD, 'skills', 'add--ecosystem', 'SKILL.md'));
const EN_TS = path.join(ROOT, 'web', 'src', 'i18n', 'en.ts');
// The docs copy is the page followed by the EN strings module (copy moved there in 0069B).
const DOCS_ASTRO = read(path.join(ROOT, 'web', 'src', 'pages', 'docs.astro')) + (fs.existsSync(EN_TS) ? read(EN_TS) : '');
const APPROVAL_FALLBACK = read(path.join(CODEADD, 'fallbacks', 'agent-mode.add-brainstorm.approval-ask.md'));
const SPINE = read(path.join(CODEADD, 'skills', 'add--architecture-discovery', 'spine-analyzer.md'));
const WIKI_MAINT = read(path.join(CODEADD, 'skills', 'add--wiki-maintenance', 'SKILL.md'));

const LINES = BRAINSTORM.split('\n');

/** Text from the heading line to the next heading of the same or a higher level (matched at line start). */
function section(headingStart) {
  const start = LINES.findIndex((l) => l.startsWith(headingStart));
  if (start < 0) return '';
  const level = LINES[start].match(/^#+/)[0].length;
  let end = LINES.length;
  for (let i = start + 1; i < LINES.length; i++) {
    const m = LINES[i].match(/^(#+) /);
    if (m && m[1].length <= level) { end = i; break; }
  }
  return LINES.slice(start, end).join('\n');
}

/** The row of a markdown table whose first cell starts with `prefix`. */
const row = (text, prefix) => text.split('\n').find((l) => l.startsWith(prefix)) || '';

describe('brainstorm greenfield — L1 source guard', () => {
  it('L1.1 the explore line of the STEP index names the greenfield foundations', () => {
    const line = LINES.find((l) => l.startsWith('STEP add-brainstorm.explore:')) || '';
    expect(line).toContain('(+ greenfield foundations when GREENFIELD=yes)');
  });

  it('L1.2 the uses block declares the four skills, /add-wiki and migrate-context-files.cjs', () => {
    const uses = BRAINSTORM.slice(BRAINSTORM.indexOf('<!-- uses:'), BRAINSTORM.indexOf('-->'));
    for (const r of [
      '- skill: add--backend-architecture (conditional)',
      '- skill: add--frontend-architecture (conditional)',
      '- skill: add--agents-md-style (conditional)',
      '- skill: add--architecture-discovery (conditional)',
      '- command: /add-wiki',
      '- script: migrate-context-files.cjs',
    ]) expect(uses).toContain(r);
  });

  it('L1.3 the hard-gate heading no longer says only two files, and a row names the four foundation files', () => {
    expect(BRAINSTORM).not.toContain('Two files may be written, and only these two');
    const r = BRAINSTORM.split('\n').find((l) => l.startsWith('|')
      && l.includes('conventions.md') && l.includes('index.md')
      && l.includes('.meta.json') && l.includes('AGENTS.md'));
    expect(r).toBeTruthy();
  });

  it('L1.4 load-context carries the trigger, the tolerance and keeps the knowledge-discovery reads', () => {
    const s = section('## STEP add-brainstorm.load-context');
    for (const t of [
      'GREENFIELD',
      'git ls-files --cached --others --exclude-standard',
      'not a git repository',
      'no main branch found',
      'no git history yet',
      'add--knowledge-discovery',
      'about.md',
    ]) expect(s).toContain(t);
  });

  it('L1.5 classify carries the greenfield path line verbatim', () => {
    expect(section('## STEP add-brainstorm.classify')).toContain(
      'Path: architectural (greenfield): stack foundations first, then full exploration.');
  });

  it('L1.6 the greenfield-foundations sub-step sits between draft-objective-first and sections-close', () => {
    const idx = (h) => LINES.findIndex((l) => l.startsWith(h));
    const a = idx('### STEP add-brainstorm.draft-objective-first');
    const g = idx('### STEP add-brainstorm.greenfield-foundations');
    const b = idx('### STEP add-brainstorm.sections-close');
    expect(g).toBeGreaterThan(a);
    expect(b).toBeGreaterThan(g);
    const s = section('### STEP add-brainstorm.greenfield-foundations');
    for (const t of [
      'GREENFIELD=yes', 'Tenancy', 'Validation', 'ORM',
      '{{skill:add--backend-architecture/SKILL.md}}',
      '{{skill:add--frontend-architecture/SKILL.md}}',
      'Over-Engineering Signals', 'Over-engineering signals',
      'Stop kind — deciding',
    ]) expect(s).toContain(t);
  });

  it('L1.7 approval names conventions.md under Keep discussing; write-intent-file writes the foundations before the intent file', () => {
    const approval = section('### STEP add-brainstorm.approval');
    const keep = approval.slice(approval.indexOf('IF THE ANSWER IS "Keep discussing"'));
    expect(keep).toContain('conventions.md');
    const w = section('### STEP add-brainstorm.write-intent-file');
    for (const t of [
      '## Stack Conventions', 'decided', 'BRN-', 'migrate-context-files.cjs',
      'codeadd-wiki', 'codeadd-style', 'codeadd-shell',
      'brainstorm-greenfield', 'INSTRUCTIONS.md', 'git init',
    ]) expect(w).toContain(t);
    const firstConv = w.indexOf('conventions.md');
    const intentLine = w.indexOf('Write `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md`');
    expect(firstConv).toBeGreaterThanOrEqual(0);
    expect(intentLine).toBeGreaterThan(firstConv);
  });

  it('L1.8 the report tells the user to make a first commit', () => {
    expect(section('### STEP add-brainstorm.report')).toContain('first commit');
  });

  it('L1.9 the ecosystem map lists the greenfield behaviour and the Used By cells', () => {
    const cmd = row(ECOSYSTEM, '| add-brainstorm |');
    for (const t of [
      'decides stack foundations on an empty repo',
      'add--agents-md-style', 'add--architecture-discovery',
      'add--backend-architecture', 'add--frontend-architecture',
    ]) expect(cmd).toContain(t);
    for (const name of ['add--agents-md-style', 'add--architecture-discovery',
      'add--backend-architecture', 'add--frontend-architecture']) {
      const r = row(ECOSYSTEM, `| ${name} |`);
      const usedBy = r.split('|').filter((c) => c.trim()).pop();
      expect(usedBy).toContain('add-brainstorm');
    }
  });

  it('L1.10 docs.astro describes the greenfield behaviour', () => {
    expect(DOCS_ASTRO).toContain('decides stack foundations on an empty repo');
  });

  // ---- GUARD assertions: pass before the edits and must keep passing ----

  it('L1.11 GUARD — the command keeps its shape', () => {
    expect(LINES.filter((l) => /\bSTEP \d/.test(l))).toEqual([]);
    const ids = [
      'load-context', 'classify', 'explore', 'draft-objective-first', 'sections-close',
      'bring-outside-in', 'converge', 'callers', 'summary-approval', 'write-doc',
      'self-review', 'run-self-review', 'validation-gate', 'handoff', 'report',
      'approval', 'write-intent-file', 'route',
    ];
    for (const id of ids) expect(BRAINSTORM).toContain(`STEP add-brainstorm.${id}`);
    // The slot count recorded before this plan: no slot is added or moved. 15 -> 9: the six board
    // slots left with the board feature (0075B, F2).
    expect(LINES.filter((l) => l.includes('<!-- slot:')).length).toBe(9);
    // The option names live in the command and in the approval-ask slot fallback it renders by default.
    const surface = BRAINSTORM + APPROVAL_FALLBACK;
    for (const t of ['Approve, I confirm each stage', 'Approve, deliver automatically',
      'Keep discussing', 'Make code changes to application files']) expect(surface).toContain(t);
  });

  it('L1.12 GUARD — 0062B is merged: the Stack Conventions format and the decided-row rule exist', () => {
    expect(SPINE).toContain('| Convention | Value | Where / enforcement | Evidence | Source |');
    expect(SPINE).toContain('decided');
    expect(SPINE).toContain('drift:');
    expect(WIKI_MAINT).toContain('decided');
    expect(WIKI_MAINT).toContain('drift:');
  });

  it('L1.13 GUARD — add--project-scaffolding is not re-added', () => {
    expect(BRAINSTORM).not.toContain('add--project-scaffolding');
  });
});

describe('brainstorm greenfield — L1.14 GUARD: status.cjs behaviours the tolerance relies on', () => {
  const STATUS = path.join(CODEADD, 'scripts', 'status.cjs');
  const dirs = [];
  const tmp = () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'greenfield-'));
    dirs.push(d);
    return d;
  };
  const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  const status = (cwd) => spawnSync(process.execPath, [STATUS], {
    cwd, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' },
  });

  afterEach(() => {
    while (dirs.length) fs.rmSync(dirs.pop(), { recursive: true, force: true });
  });

  it('(a) a plain directory exits 1 with "not a git repository"', () => {
    const r = status(tmp());
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('ERROR:not a git repository');
  });

  it('(b) git init on main with no commit exits 2 with "no main branch found"', () => {
    const d = tmp();
    git(d, 'init', '-b', 'main');
    const r = status(d);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('ERROR:no main branch found');
  });

  it('(c) one commit plus the wiki index and a .meta.json without gitHead prints WIKI:present', () => {
    const d = tmp();
    git(d, 'init', '-b', 'main');
    fs.mkdirSync(path.join(d, '.codeadd', 'wiki'), { recursive: true });
    fs.writeFileSync(path.join(d, '.codeadd', 'wiki', 'index.md'), '# Wiki\n');
    fs.writeFileSync(path.join(d, '.codeadd', 'wiki', '.meta.json'),
      '{"updatedAt":"2026-10-24T00:00:00Z","command":"brainstorm-greenfield"}');
    git(d, 'add', '-A');
    git(d, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-m', 'first');
    const r = status(d);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('WIKI:present');
    expect(r.stdout).toContain('WIKI_STALE_COUNT:unknown');
  });
});
