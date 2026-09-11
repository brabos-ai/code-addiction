import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-10T203053 — close-out hardening.
 * Level L3 of the plan's Validation Matrix: the content assertions.
 *
 * Written RED against the pre-plan tree. On that tree gate 2.1 carries three
 * rows and no condition block, STEP 8 states its "no durable copy → do not rm"
 * rule with no command that evaluates it, STEP 4 and `/add-framework--build`
 * STEP 8 each declare their own date-only changelog pattern, the top-of-file
 * prohibitions block heads its five `⛔ DO NOT` lines with a bare `ALWAYS:`,
 * the ledger's line schema is restated at STEP 1.3 and STEP 2.2 without ever
 * naming `add-build-ledger`, `## Rules` repeats three rules its STEP bodies
 * already state, and `CLAUDE.md` does not say who owns the changelog filename.
 *
 * Four assertions PASS on the pre-plan tree and each is marked `guard`. They
 * pin what the six edits to one command must NOT lose: its nine STEPs, the
 * recovery path, the ledger gate's two phrases a sibling suite fixes by literal
 * text, the bare `ALWAYS:` inside `## Rules` that ruler item 3 mandates, the
 * text-only handoff, and the absence of any size budget. A matrix that is RED
 * everywhere has no guard against collateral damage.
 *
 * L1 (build.js clean, the cli suite green, the bats file green) and L2 (the
 * graph queries) are run by the build per F-block and recorded in the ledger.
 * They cannot live here: the artefact graph is a gitignored sidecar, so a CI
 * checkout has no graph to query until `build.js` has run.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const P = {
  done: path.join(ROOT, '.claude', 'commands', 'add-framework--done.md'),
  build: path.join(ROOT, '.claude', 'commands', 'add-framework--build.md'),
  authoring: path.join(ROOT, '.claude', 'skills', 'add-plan-authoring', 'SKILL.md'),
  claudeMd: path.join(ROOT, 'CLAUDE.md'),
};

const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, 'utf8') : '');

/** The `<!-- uses: -->` block, or '' when the artefact declares none. */
function uses(text) {
  return text.match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
}

/**
 * The body of a `## <title>` section, up to the next `## ` heading.
 * Located by title so a renumbering cannot silently move it.
 */
function section(text, title) {
  const start = text.search(new RegExp(`^## ${title}`, 'm'));
  if (start < 0) return null;
  const rest = text.slice(start + 1).search(/^## /m);
  return rest < 0 ? text.slice(start) : text.slice(start, start + 1 + rest);
}

/** The body of a `## STEP n: <title>` section, located by title, not by number. */
function stepBody(text, title) {
  const start = text.search(new RegExp(`^## STEP \\d+: ${title}`, 'm'));
  if (start < 0) throw new Error(`no STEP titled ${title}`);
  const rest = text.slice(start + 1).search(/^## STEP \d+:/m);
  return rest < 0 ? text.slice(start) : text.slice(start, start + 1 + rest);
}

/**
 * The body of a `### n.m <title>` sub-step, up to the next heading of any depth.
 *
 * The end is found on `\n` + hashes rather than on `^` under the `m` flag: the
 * heading's own `###` sits at the start of the searched slice and would match
 * at offset 0, returning a one-character body.
 */
function subStep(text, number) {
  const start = text.search(new RegExp(`^### ${number.replace('.', '\\.')} `, 'm'));
  if (start < 0) return null;
  const rest = text.slice(start).search(/\n#{2,3} /);
  return rest < 0 ? text.slice(start) : text.slice(start, start + rest);
}

/** Everything before the first `## STEP` — where the prohibitions block lives. */
function head(text) {
  const at = text.search(/^## STEP /m);
  return at < 0 ? text : text.slice(0, at);
}

/** The STEP numbers the top-of-file map declares, in order. */
function mapNumbers(text) {
  return [...head(text).matchAll(/^STEP (\d+):/gm)].map((m) => Number(m[1]));
}

/**
 * The DATA rows of the first markdown table in a block — the header and the
 * `|---|` separator dropped. Every block read here carries exactly one table.
 */
function tableRows(block) {
  const lines = block.split(/\r?\n/).filter((l) => l.trim().startsWith('|'));
  const sep = lines.findIndex((l) => /^\s*\|[\s|:-]+\|\s*$/.test(l));
  return sep < 0 ? [] : lines.slice(sep + 1);
}

/** One table row's cells, trimmed, with the leading and trailing pipe dropped. */
function cells(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

/** The fenced `IF …:` condition blocks in a section. */
function conditionBlocks(text) {
  return [...text.matchAll(/```\r?\n(IF[\s\S]*?)```/g)].map((m) => m[1]);
}

/**
 * Lines outside every fenced code block.
 *
 * A command quotes shapes it forbids. Quoted inside a fence it is an
 * illustration; written in prose it would be the rule. Only prose is scanned.
 */
function proseLines(text) {
  const out = [];
  let fenced = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue; }
    if (!fenced) out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// L3.1 - L3.2 — gate 2.1 gains its fourth state
// ---------------------------------------------------------------------------

describe('L3.1-3.2 gate 2.1', () => {
  it('L3.1 the table crosses PR state with entry presence on all four combinations', () => {
    const gate = subStep(read(P.done), '2.1');
    expect(gate).not.toBeNull();

    const rows = tableRows(gate);
    expect(rows).toHaveLength(4);

    // The fourth state: the PR is still open AND an entry already exists. That
    // is where a close-out lands whenever STEP 6 commits and STEP 7's merge is
    // then refused, and it is the combination that was missing.
    const openWithEntry = rows
      .map(cells)
      .filter((c) => /open/i.test(c[0]) && /\byes\b/i.test(c[1]));
    expect(openWithEntry).toHaveLength(1);
  });

  it('L3.2 that state routes to the merge and forbids re-running the writer', () => {
    const gate = subStep(read(P.done), '2.1');

    // STEP 3 wrote the entry and STEP 6 committed the archive. Re-running
    // either is what produces a second index entry for one delivery.
    expect(gate).toMatch(/STEP 3/);
    expect(gate).toMatch(/STEP 6/);
    expect(gate).toMatch(/⛔ DO NOT/);

    // And it must say where the run resumes, not merely what it skips.
    expect(gate).toMatch(/STEP 7|merge/i);
  });
});

// ---------------------------------------------------------------------------
// L3.3 - L3.4 — STEP 8 checks what it only asserted, and hands off in text
// ---------------------------------------------------------------------------

describe('L3.3-3.4 the post-merge validation', () => {
  it('L3.3 the deletions are refused unless main actually holds the archive', () => {
    const step8 = stepBody(read(P.done), 'Cleanup');

    // The `cmp` pattern STEP 6.1 already uses before the merge, applied again
    // after it — this is the check the "no durable copy" rule always needed.
    expect(step8).toContain('git show origin/main:');
    expect(step8).toMatch(/\bcmp\b/);

    // A failing check must block the rm, not merely be reported beside it.
    const refusals = conditionBlocks(step8).filter(
      (b) => /fail/i.test(b) && /DO NOT USE: Bash to run rm/.test(b),
    );
    expect(refusals.length).toBeGreaterThan(0);
  });

  it('L3.4 the fix suggestion is printed as text, never invoked', () => {
    const text = read(P.done);
    const step8 = stepBody(text, 'Cleanup');
    const step9 = stepBody(text, 'Completion');

    expect(step8 + step9).toContain('/add-framework--plan');

    // guard: passes on the pre-plan tree, where the command does not name the
    // planning command at all. The close-out is not a planner — it prints the
    // command for the operator, the way /add-framework--brainstorm hands off.
    // Prohibition lines are excluded: forbidding an invocation is not one.
    const invocations = proseLines(text)
      .filter((l) => !/⛔|DO NOT/.test(l))
      .filter((l) => /(?:invoke|execute|dispatch|call|run)\s+`?\/add-framework--plan/i.test(l));
    expect(invocations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// L3.5 - L3.6 — one owner for the changelog filename
// ---------------------------------------------------------------------------

describe('L3.5-3.6 the changelog filename', () => {
  it('L3.5 neither command declares a pattern; both name the owner', () => {
    const done = read(P.done);
    const build = read(P.build);

    // The date-only form, in any spelling of its verb placeholder.
    expect(done).not.toMatch(/YYYY-MM-DD-</);
    expect(build).not.toMatch(/YYYY-MM-DD-</);

    expect(stepBody(done, 'Generate the Changelog')).toContain('add-plan-authoring');
    expect(stepBody(build, 'Document')).toContain('add-plan-authoring');
  });

  it('L3.6 add-plan-authoring states the format beside the plan filename', () => {
    const naming = section(read(P.authoring), 'File Naming');
    expect(naming).not.toBeNull();

    expect(naming).toContain('docs/changelog/YYYY-MM-DDTHHMMSS-');
    expect(naming).toMatch(/local time/i);
    expect(naming).toMatch(/no separators inside/i);

    // The precedent this skill already set for plans, stated for changelogs.
    expect(naming).toMatch(/keep the names|keep their names/i);
  });
});

// ---------------------------------------------------------------------------
// L3.7 - L3.9 — the three ruler items the audit failed
// ---------------------------------------------------------------------------

describe('L3.7-3.9 the ruler items', () => {
  it('L3.7 the prohibitions block qualifies its ALWAYS label (ruler item 3)', () => {
    const text = read(P.done);

    const label = head(text).match(/^ALWAYS[^\n]*$/m);
    expect(label).not.toBeNull();

    // The siblings whose block has the same job qualify it: /add-framework--plan
    // writes "ALWAYS — THIS COMMAND DOES NOT EXECUTE:" and
    // /add-framework--roadmap "ALWAYS — THIS COMMAND OWNS ONE FILE:".
    expect(label[0]).not.toBe('ALWAYS:');
    expect(label[0]).toMatch(/^ALWAYS — .+:$/);

    // guard: passes on the pre-plan tree. The `ALWAYS:` inside `## Rules` is a
    // DIFFERENT thing and stays bare — ruler item 3 mandates that pair and all
    // seven internal commands write it bare.
    expect(section(text, 'Rules')).toMatch(/^ALWAYS:$/m);
  });

  it('L3.8 the ledger schema is delegated, not restated (ruler item 5)', () => {
    const text = read(P.done);

    expect(uses(text)).toMatch(/-\s*skill:\s*add-build-ledger/);
    expect(text).toContain('add-build-ledger');

    // The line shapes, the legacy series and the ledger path all belong to the
    // skill. Two copies drift, and the drift is invisible until they disagree.
    expect(text).not.toMatch(/F<n>/);
    expect(text).not.toMatch(/S<n>/);
    expect(text).not.toContain('Ruling:');
    expect(text).not.toMatch(/--ledger\.md/);

    // guard: the GATE is this command's own and stays here in full.
    expect(text).toContain('`complete` line');
  });

  it('L3.9 Rules keeps only what no STEP body states (ruler item 7)', () => {
    const text = read(P.done);
    const rules = section(text, 'Rules');
    expect(rules).not.toBeNull();

    expect(rules).not.toMatch(/rev-parse HEAD/);
    expect(rules).not.toMatch(/Grade the delivery/i);
    expect(rules).not.toMatch(/skipped, queued, neutral or cancelled/i);

    // Each one survives where it is load-bearing — pruning is not deletion.
    const outside = text.replace(rules, '');
    expect(outside).toMatch(/rev-parse HEAD/);
    expect(outside).toMatch(/Audit the delivery here/);
    expect(outside).toMatch(/skipped, queued, neutral or cancelled/);
  });
});

// ---------------------------------------------------------------------------
// L3.10 — the map points at the owner
// ---------------------------------------------------------------------------

describe('L3.10 CLAUDE.md', () => {
  it('L3.10 Where the details live names add-plan-authoring and the changelog', () => {
    const details = section(read(P.claudeMd), 'Where the details live');
    expect(details).not.toBeNull();

    const row = tableRows(details).find((r) => /add-plan-authoring/.test(r));
    expect(row).toBeDefined();
    expect(row).toMatch(/changelog/i);
  });
});

// ---------------------------------------------------------------------------
// L3.11 - L3.12 — guards: what six edits to one file must not lose
// ---------------------------------------------------------------------------

describe('L3.11-3.12 guards', () => {
  it('L3.11 guard: the close-out keeps its nine STEPs and its pinned passages', () => {
    const text = read(P.done);

    expect(mapNumbers(text)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(text, `STEP ${n} heading`).toMatch(new RegExp(`^## STEP ${n}: `, 'm'));
    }

    // The recovery path 2.1's bottom row grants.
    expect(subStep(text, '2.4')).not.toBeNull();

    // The two phrases cli/tests/review-no-loops.test.js L3.7 fixes by literal
    // text. F6 and F9 rewrite the bodies both live in.
    expect(text).toMatch(/ledger gate/i);
    expect(text).toContain('unwritten code breaks no test');
    expect(subStep(text, '2.2')).toMatch(/STOP/);

    // The worktree self-removal rule, measured rather than assumed.
    expect(subStep(text, '8.1')).not.toBeNull();
    expect(text).toContain('git worktree remove');
  });

  it('L3.12 guard: no size budget in any of the three artefacts', () => {
    // "No item measures size. Not characters, not lines, not words."
    // A budget makes the writer contort the text to fit instead of removing
    // what has no reason to exist.
    const budget = /\b\d+\s+(?:words?|characters?|chars?|lines?|tokens?)\b/i;
    for (const [name, p] of [['done', P.done], ['build', P.build], ['authoring', P.authoring]]) {
      const offenders = proseLines(read(p)).filter((l) => budget.test(l));
      expect(offenders, `${name} states a size budget`).toEqual([]);
    }
  });
});
