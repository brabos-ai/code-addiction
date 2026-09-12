import { describe, it, expect, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * CLAUDE.md inventory block (plan 2026-09-08T234054-PLAN--claude-md-inventory-block).
 *
 * `CLAUDE.md` is loaded into every session, and until now two skills held a
 * standing licence to write prose into it on every build. That licence is what
 * grew the file to 4212 words before commit 47321fd cut it back. The replacement
 * is a managed block a script owns end to end, so the file's inventory section
 * tracks the framework instead of a human's editing habits.
 *
 * Three cases here are load-bearing and must never be relaxed:
 *
 *   L1.3 — `fragments` and `plugins` list the OWNING DIRECTORY, never their files.
 *   `add.plan.md` exists three times on disk (fragments/qa-pipeline/,
 *   fragments/tdd-pipeline/, plugins/gitnexus/fragments/). A flat filename array
 *   silently collapses or duplicates them, and the block would then disagree with
 *   the tree it claims to describe.
 *
 *   L1.6 — `sidecars` comes from the SIDECARS constant in scripts/build.js, never
 *   from a disk glob. All three sidecar files are gitignored, so a glob finds
 *   nothing on a fresh checkout and reports staleness that does not exist. That is
 *   a false negative in the one direction a check like this must never produce.
 *
 *   L1.7 — absent or malformed markers are a hard error, never a silent no-op and
 *   never an append. The product-layer convention appends because a user's
 *   CLAUDE.md is arbitrary; this file is under our control and the block belongs
 *   inside `## Project Anatomy`. Appending would put it somewhere else and look
 *   like success.
 */

const require = createRequire(import.meta.url);
const {
  MARK_START,
  MARK_END,
  collectInventory,
  renderBlock,
  spliceBlock,
  writeBlock,
  checkBlock,
} = require('../../scripts/inventory.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(ROOT, 'scripts', 'inventory.js');
const { SIDECARS } = require('../../scripts/build.js');

const TMP_DIRS = [];

function tmpDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  TMP_DIRS.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of TMP_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

function write(file, body = 'x') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, body);
}

/**
 * A .codeadd tree small enough to assert byte-for-byte, and shaped to carry every
 * trap the real one carries: the `add` / `add.init` sort order, the
 * `add.plan` / `add.plan-to-ready` sort order, and `add.plan.md` living under
 * three different fragment/plugin owners at once.
 */
function fixtureCodeadd() {
  // `<root>/framwork/.codeadd`, mirroring the real repository — that is the layout
  // `--root` resolves against, so a flatter fixture would only exercise the unit
  // functions and let a broken CLI path through.
  const dir = path.join(tmpDir('inventory-fx-'), 'framwork', '.codeadd');
  write(path.join(dir, 'commands', 'add.md'));
  write(path.join(dir, 'commands', 'add.init.md'));
  write(path.join(dir, 'commands', 'add.plan-to-ready.md'));
  write(path.join(dir, 'commands', 'add.plan.md'));
  write(path.join(dir, 'skills', 'add-qa', 'SKILL.md'));
  write(path.join(dir, 'skills', 'add-qa-spec', 'SKILL.md'));
  fs.mkdirSync(path.join(dir, 'skills', 'not-a-skill'), { recursive: true });
  write(path.join(dir, 'agents', 'qa-agent.md'));
  write(path.join(dir, 'agents', 'ux-agent.md'));
  write(path.join(dir, 'scripts', 'done.sh'));
  write(path.join(dir, 'scripts', 'status.sh'));
  write(path.join(dir, 'scripts', 'tests', 'done.bats'));
  write(path.join(dir, 'templates', 'hotfix.md'));
  write(path.join(dir, 'fragments', 'qa-pipeline', 'add.plan.md'));
  write(path.join(dir, 'fragments', 'tdd-pipeline', 'add.plan.md'));
  write(path.join(dir, 'plugins', 'gitnexus', 'fragments', 'add.plan.md'));
  write(path.join(dir, 'plugins', 'gitnexus', 'skills', 'add-gitnexus', 'SKILL.md'));
  write(path.join(dir, 'plugins', 'playwright', 'fragments', 'add.review.md'));
  write(path.join(dir, 'transforms', 'gemini', 'commands.md'));
  return dir;
}

/** A CLAUDE.md with the markers in place and an empty block between them. */
function fixtureClaudeMd(body = '') {
  const file = path.join(tmpDir('inventory-md-'), 'CLAUDE.md');
  write(file, `# Project\n\n## Project Anatomy\n\n${MARK_START}\n${body}${MARK_END}\n\n## Pipeline\n`);
  return file;
}

const EXPECTED_BLOCK = [
  '{"commands":["add","add.init","add.plan","add.plan-to-ready"]}',
  '{"skills":["add-qa","add-qa-spec"]}',
  '{"agents":["qa","ux"]}',
  '{"scripts":["done.sh","status.sh"]}',
  '{"templates":["hotfix"],"fragments":["qa-pipeline","tdd-pipeline"],'
    + '"plugins":["gitnexus","playwright"],"transforms":["gemini/commands.md"],'
    + `"sidecars":${JSON.stringify([...SIDECARS].sort())}}`,
].join('\n');

describe('L1.1 renderBlock — byte-for-byte against a known tree', () => {
  it('emits exactly five lines, one JSON object each', () => {
    const block = renderBlock(collectInventory(fixtureCodeadd()));
    expect(block).toBe(EXPECTED_BLOCK);
    expect(block.split('\n')).toHaveLength(5);
  });

  it('carries all nine group keys and nothing else', () => {
    const inv = collectInventory(fixtureCodeadd());
    expect(Object.keys(inv).sort()).toEqual([
      'agents', 'commands', 'fragments', 'plugins',
      'scripts', 'sidecars', 'skills', 'templates', 'transforms',
    ]);
  });

  it('omits a skills/ directory that carries no SKILL.md', () => {
    // Node identity is "what the build can transform", never directory position.
    expect(collectInventory(fixtureCodeadd()).skills).not.toContain('not-a-skill');
  });

  it('omits scripts/tests/ — a .bats suite is not an invocable artefact', () => {
    expect(collectInventory(fixtureCodeadd()).scripts).not.toContain('tests');
  });
});

describe('L1.2 sorting is by NAME, never by filename', () => {
  it('puts `add` before `add.init`', () => {
    const { commands } = collectInventory(fixtureCodeadd());
    expect(commands.indexOf('add')).toBeLessThan(commands.indexOf('add.init'));
  });

  it('puts `add.plan` before `add.plan-to-ready`', () => {
    // Sorting the FILENAMES reverses this, because '-' (45) sorts before '.' (46).
    const { commands } = collectInventory(fixtureCodeadd());
    expect(commands.indexOf('add.plan')).toBeLessThan(commands.indexOf('add.plan-to-ready'));
  });
});

describe('L1.3 no group contains a duplicate entry', () => {
  it('lists fragments and plugins by owning directory, not by file', () => {
    const inv = collectInventory(fixtureCodeadd());
    expect(inv.fragments).toEqual(['qa-pipeline', 'tdd-pipeline']);
    expect(inv.plugins).toEqual(['gitnexus', 'playwright']);
  });

  it('has no duplicate in any group, on a tree where add.plan.md exists three times', () => {
    const inv = collectInventory(fixtureCodeadd());
    for (const [group, items] of Object.entries(inv)) {
      expect(new Set(items).size, `duplicate in ${group}`).toBe(items.length);
    }
  });
});

describe('L1.4 writeBlock is idempotent', () => {
  it('leaves the file byte-identical on a second run, and reports no change', () => {
    const codeadd = fixtureCodeadd();
    const md = fixtureClaudeMd();

    expect(writeBlock(md, codeadd).changed).toBe(true);
    const first = fs.readFileSync(md, 'utf8');

    expect(writeBlock(md, codeadd).changed).toBe(false);
    expect(fs.readFileSync(md, 'utf8')).toBe(first);
  });

  it('replaces the block in place, never appending a second one', () => {
    const codeadd = fixtureCodeadd();
    const md = fixtureClaudeMd('{"commands":["stale"]}\n');
    writeBlock(md, codeadd);
    const out = fs.readFileSync(md, 'utf8');

    expect(out.split(MARK_START)).toHaveLength(2);
    expect(out.split(MARK_END)).toHaveLength(2);
    expect(out).not.toContain('stale');
    expect(out).toContain('## Pipeline');
  });
});

describe('L1.5 checkBlock and the --check exit codes', () => {
  it('reports current after a write', () => {
    const codeadd = fixtureCodeadd();
    const md = fixtureClaudeMd();
    writeBlock(md, codeadd);
    expect(checkBlock(md, codeadd).current).toBe(true);
  });

  it('reports stale when the block does not match the tree', () => {
    const codeadd = fixtureCodeadd();
    const md = fixtureClaudeMd('{"commands":["stale"]}\n');
    expect(checkBlock(md, codeadd).current).toBe(false);
  });

  it('exits 0 on a current block and 2 on a stale one', () => {
    const codeadd = fixtureCodeadd();
    const root = path.resolve(codeadd, '..', '..');

    const md = path.join(root, 'CLAUDE.md');
    fs.copyFileSync(fixtureClaudeMd(), md);
    writeBlock(md, codeadd);
    expect(() => execFileSync('node', [SCRIPT, '--check', '--root', root])).not.toThrow();

    fs.writeFileSync(md, fs.readFileSync(md, 'utf8').replace('"add"', '"gone"'));
    let code = 0;
    try {
      execFileSync('node', [SCRIPT, '--check', '--root', root], { stdio: 'pipe' });
    } catch (e) {
      code = e.status;
    }
    // 2, never 1 — scripts/graph.js sets exitCode 2 on every failure path.
    expect(code).toBe(2);
  });
});

describe('L1.6 sidecars come from the constant, never from disk', () => {
  it('lists all three sidecars on a tree where none of the files exist', () => {
    const codeadd = fixtureCodeadd();
    for (const name of SIDECARS) {
      expect(fs.existsSync(path.join(codeadd, name))).toBe(false);
    }
    expect(collectInventory(codeadd).sidecars).toEqual([...SIDECARS].sort());
  });

  it('passes --check on a tree with no sidecar file present', () => {
    const codeadd = fixtureCodeadd();
    const md = fixtureClaudeMd();
    writeBlock(md, codeadd);
    expect(checkBlock(md, codeadd).current).toBe(true);
  });
});

describe('L1.7 absent or malformed markers are a hard error', () => {
  it('throws rather than appending when both markers are missing', () => {
    const file = path.join(tmpDir('inventory-md-'), 'CLAUDE.md');
    write(file, '# Project\n\n## Project Anatomy\n\nno markers here\n');
    const before = fs.readFileSync(file, 'utf8');

    expect(() => writeBlock(file, fixtureCodeadd())).toThrow(/codeadd-inventory:start/);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });

  it('throws when the end marker is missing', () => {
    const file = path.join(tmpDir('inventory-md-'), 'CLAUDE.md');
    write(file, `# Project\n\n${MARK_START}\n{"commands":[]}\n`);
    expect(() => writeBlock(file, fixtureCodeadd())).toThrow(/codeadd-inventory:end/);
  });

  it('throws when the end marker precedes the start marker', () => {
    const file = path.join(tmpDir('inventory-md-'), 'CLAUDE.md');
    write(file, `# Project\n\n${MARK_END}\n{"commands":[]}\n${MARK_START}\n`);
    expect(() => writeBlock(file, fixtureCodeadd())).toThrow();
  });

  it('exits 2 rather than 0 when the markers are absent', () => {
    const codeadd = fixtureCodeadd();
    const root = path.dirname(codeadd);
    write(path.join(root, 'CLAUDE.md'), '# Project\n\nno markers\n');

    let code = 0;
    try {
      execFileSync('node', [SCRIPT, '--check', '--root', root], { stdio: 'pipe' });
    } catch (e) {
      code = e.status;
    }
    expect(code).toBe(2);
  });

  it('spliceBlock never appends — a marker-less document comes back untouched or throws', () => {
    expect(() => spliceBlock('# Project\n\nnothing\n', '{"commands":[]}')).toThrow();
  });
});

describe('L2 the real repository', () => {
  const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
  const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');

  it('L2.1 counts agree with provider-map.json', () => {
    const map = require(path.join(ROOT, 'framwork', 'provider-map.json'));
    const inv = collectInventory(CODEADD);
    expect(inv.commands).toHaveLength(Object.keys(map.commands).length);
    expect(inv.skills).toHaveLength(Object.keys(map.skills).length);
    expect(inv.agents).toHaveLength(Object.keys(map.agents).length);
  });

  it('L2.2 CLAUDE.md carries exactly one marker pair, in order, inside Project Anatomy', () => {
    const md = fs.readFileSync(CLAUDE_MD, 'utf8');
    expect(md.split(MARK_START)).toHaveLength(2);
    expect(md.split(MARK_END)).toHaveLength(2);
    expect(md.indexOf(MARK_START)).toBeLessThan(md.indexOf(MARK_END));
    expect(md.indexOf('## Project Anatomy')).toBeLessThan(md.indexOf(MARK_START));
    expect(md.indexOf(MARK_END)).toBeLessThan(md.indexOf('## Pipeline'));
  });

  it('L2.3 CLAUDE.md no longer carries the hand-maintained count rows', () => {
    const md = fs.readFileSync(CLAUDE_MD, 'utf8');
    // Target the COUNT column, not the row label. The Internal Layer keeps a
    // legitimate `| Type | Path |` table whose rows are also labelled Commands,
    // Skills and Agents — matching on the label alone condemns the wrong table.
    expect(md).not.toMatch(/\|\s*Count\s*\|/);
    expect(md).not.toMatch(/^\|\s*(Commands|Skills|Agents)\s*\|[^|]*\|\s*\d+\s*\|/m);
  });

  it('L2.4 the block on disk is current', () => {
    expect(checkBlock(CLAUDE_MD, CODEADD).current).toBe(true);
  });
});

describe('L3 the command and skill texts that held the duty', () => {
  const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

  /**
   * The body of a `## STEP n: <title>` section, located by TITLE.
   *
   * These assertions used to slice on hard-coded step numbers, and every one of
   * them broke when plan 2026-09-09T090201 inserted a readback step and a review
   * step into add-framework--build and renumbered the five below them. Nothing
   * they pin had changed — only the labels moved. Matching on the title keeps
   * them pointed at the rule instead of at its position.
   */
  function step(text, title) {
    // `\\d` and not `\d`: a template literal eats an unrecognised escape, so
    // `\d` reaches the RegExp constructor as a bare `d`.
    const start = text.search(new RegExp(`^## STEP \\d+: ${title}`, 'm'));
    if (start < 0) throw new Error(`no STEP titled ${title}`);
    const rest = text.slice(start + 1).search(/^## STEP \d+:/m);
    return rest < 0 ? text.slice(start) : text.slice(start, start + 1 + rest);
  }

  /** The body of a `### n.m <title>` sub-section, located by title. */
  function sub(text, title) {
    const start = text.search(new RegExp(`^### \\d+\\.\\d+ ${title}`, 'm'));
    if (start < 0) throw new Error(`no sub-section titled ${title}`);
    const rest = text.slice(start + 1).search(/^### \d+\.\d+ /m);
    return rest < 0 ? text.slice(start) : text.slice(start, start + 1 + rest);
  }

  it('L3.1 the close-out CI gate runs, commits AND pushes, before the clean-tree check', () => {
    const done = read('.claude', 'commands', 'add-framework--done.md');
    const list = sub(done, "CI's four commands");
    const item1 = list.slice(list.indexOf('\n1. '), list.indexOf('\n2. '));

    expect(item1).toContain('scripts/inventory.js');
    expect(item1).toMatch(/commit/i);
    expect(item1).toMatch(/push/i);
    expect(list.slice(list.indexOf('\n2. '))).toMatch(/working tree must be clean/i);
  });

  it('L3.2 add-framework-product-layer lost both CLAUDE.md sections and stopped there', () => {
    const skill = read('.claude', 'skills', 'add-framework-product-layer', 'SKILL.md');
    expect(skill).not.toContain('Project Anatomy');
    expect(skill).not.toContain('The rest of CLAUDE.md');
    // The boundary marker: the next section down must survive. It was `## Changelog`
    // until PR #43 removed that section for its own reason, so the anchor moved to
    // the one that now follows. The point is unchanged — prove the deletion stopped.
    expect(skill).toContain('## Common Rationalizations');
    expect(skill).toContain('## Rules');
  });

  it('L3.3 add-framework-internal-layer lost its CLAUDE.md table, kept the coherence check', () => {
    const skill = read('.claude', 'skills', 'add-framework-internal-layer', 'SKILL.md');
    expect(skill).not.toContain('CLAUDE.md, per changed artefact list');
    expect(skill).toContain('### Coherence, per modified artefact');
  });

  it('L3.4 add-framework--build no longer names the Project Anatomy counts', () => {
    expect(read('.claude', 'commands', 'add-framework--build.md')).not.toContain('Project Anatomy');
  });

  it('L3.5 the [product] block forbids writing CLAUDE.md and the [internal] block does not', () => {
    const build = read('.claude', 'commands', 'add-framework--build.md');
    const product = build.slice(
      build.indexOf('IF THE CURRENT F-BLOCK IS TAGGED [product]:'),
      build.indexOf('IF A PATH IS NOT COVERED'),
    );
    const internal = build.slice(
      build.indexOf('IF THE CURRENT F-BLOCK IS TAGGED [internal]:'),
      build.indexOf('IF THE CURRENT F-BLOCK IS TAGGED [product]:'),
    );
    expect(product).toContain('CLAUDE.md');
    expect(internal).not.toContain('CLAUDE.md');
  });

  it('L3.7 add-framework--build syncs the block unconditionally, as its last documented act', () => {
    const build = read('.claude', 'commands', 'add-framework--build.md');
    const step6 = step(build, 'Document');

    expect(step6).toContain('scripts/inventory.js');
    // Unconditional: the block is derived from the tree, so its correctness must
    // not hang on whether anyone chose to open a PR afterwards.
    expect(step6).toMatch(/always|unconditional|whether or not/i);
  });

  it('L3.8 the push and the PR live behind a [STOP], after the sync', () => {
    const build = read('.claude', 'commands', 'add-framework--build.md');
    const publish = step(build, 'Publish');

    expect(build).toMatch(/^## STEP \d+: Publish.*\[STOP\]/m);
    expect(publish).toContain('gh pr create');
    // Skipped when a PR already exists — asking twice on the same branch is noise.
    expect(publish).toMatch(/already exists|existing PR/i);

    // The sync must precede the push, or the PR carries a CLAUDE.md the reviewer
    // was never shown and the merge diff differs from the reviewed one.
    expect(build.indexOf('scripts/inventory.js')).toBeLessThan(build.indexOf('gh pr create'));
  });

  it('L3.9 the step header and the completion step follow the renumbering', () => {
    const build = read('.claude', 'commands', 'add-framework--build.md');
    const header = build.slice(build.indexOf('STEPS IN ORDER'), build.indexOf('**⛔ ABSOLUTE'));

    expect(header).toMatch(/STEP \d+: Publish/);
    expect(header).toMatch(/STEP \d+: Completion/);
    expect(build).toMatch(/^## STEP \d+: Completion/m);

    const step8 = step(build, 'Completion');
    expect(step8).toMatch(/inventory block/i);
    expect(step8).toMatch(/PR/);
  });

  it('L3.10 add-framework--done says its sync is the net, not the first writer', () => {
    const done = read('.claude', 'commands', 'add-framework--done.md');
    const list = sub(done, "CI's four commands");
    const item1 = list.slice(list.indexOf('\n1. '), list.indexOf('\n2. '));

    // Still runs, still commits, still pushes — but the normal outcome is now
    // "already current", because the build synced before the PR went up.
    expect(item1).toContain('scripts/inventory.js');
    expect(item1).toMatch(/already current/i);
    // It must NAME the build as the normal first writer. A loose /build/ here
    // matches `node scripts/build.js` in the fallback prose and proves nothing.
    expect(item1).toContain('/add-framework--build');
  });

  it('L3.6 the dead bootstrap script is gone, and the sweep finds no pointer left', () => {
    expect(fs.existsSync(path.join(ROOT, '.claude', 'bootstrap-framework-context.sh'))).toBe(false);

    // Scoped to `.claude/` and CLAUDE.md — the sweep add-framework-internal-layer
    // prescribes. A repo-wide grep would match this very file and could never pass.
    let hits = '';
    try {
      hits = execFileSync(
        'git',
        ['grep', '-l', 'bootstrap-framework-context', '--', '.claude/', 'CLAUDE.md'],
        { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    } catch (e) {
      // git grep exits 1 when nothing matches — that is the passing case.
      expect(e.status).toBe(1);
    }
    expect(hits.trim()).toBe('');
  });
});
