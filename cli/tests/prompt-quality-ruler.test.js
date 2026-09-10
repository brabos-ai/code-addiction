import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-10T173216 — prompt quality ruler.
 * Level L3 of the plan's Validation Matrix: the content assertions.
 *
 * Every assertion here is written RED against the pre-plan tree: the ruler
 * section does not exist, `building-commands` still carries `## Validation
 * Checklist`, `prompt-review-agent.md` is not on disk, the build's STEP 3 still
 * embeds an eleven-line copy of the checklist, its STEP 7 still hardcodes
 * "four" in eight places, the plan command has no STEP 3.4, the review
 * discipline's reader table has two rows, and `add-framework-development` still
 * imposes a word limit in two places.
 *
 * Three assertions PASS on the pre-plan tree by design, and each is marked
 * `guard`. They pin properties the plan must PRESERVE — the build's ten STEPs
 * and its "exactly once" rule, the two existing reader counts, and the
 * frontmatter of the two agents this plan must not touch. A matrix that is RED
 * everywhere has no guard against collateral damage.
 *
 * L3.3 was written as a fourth guard and came back RED: `building-commands`
 * already carries "Maximum ~15 words per item" in its Rules Section format. A
 * size criterion inside the very skill the ruler lives in contradicts the
 * ruler's own prohibition, and F2 forbids any numeric limit in this file, so
 * the line goes with the checklist it sat beside.
 *
 * L1 (build.js clean, cli suite green) and L2 (the graph queries) are run by the
 * build per F-block and recorded in the ledger. They cannot live here: the
 * artefact graph is a gitignored sidecar, so a CI checkout has no graph to query
 * until `build.js` has run.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const P = {
  ruler: path.join(ROOT, '.claude', 'skills', 'building-commands', 'SKILL.md'),
  agent: path.join(ROOT, '.claude', 'agents', 'prompt-review-agent.md'),
  discipline: path.join(ROOT, '.claude', 'skills', 'add-review-discipline', 'SKILL.md'),
  build: path.join(ROOT, '.claude', 'commands', 'add-framework--build.md'),
  planCmd: path.join(ROOT, '.claude', 'commands', 'add-framework--plan.md'),
  internalLayer: path.join(ROOT, '.claude', 'skills', 'add-framework-internal-layer', 'SKILL.md'),
  productLayer: path.join(ROOT, '.claude', 'skills', 'add-framework-product-layer', 'SKILL.md'),
  devSkill: path.join(ROOT, '.claude', 'skills', 'add-framework-development', 'SKILL.md'),
  claudeMd: path.join(ROOT, 'CLAUDE.md'),
  readback: path.join(ROOT, '.claude', 'agents', 'plan-readback-agent.md'),
  reviewer: path.join(ROOT, '.claude', 'agents', 'plan-review-agent.md'),
};

const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, 'utf8') : '');

/** The frontmatter block only. Bodies also contain these words as prose. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

/** Everything after the frontmatter. */
function body(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
}

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

/** The fenced STEP map at the top of a command. */
function stepMap(text) {
  return text.match(/\*\*STEPS IN ORDER:\*\*\s*```?[\s\S]*?```/)?.[0] ?? '';
}

/** The STEP numbers the map declares, in order. */
function stepNumbers(text) {
  return [...stepMap(text).matchAll(/^STEP (\d+):/gm)].map((m) => Number(m[1]));
}

/**
 * Lines outside every fenced code block.
 *
 * The ruler quotes its Not-expected snippets verbatim, and one of them is a
 * word limit. Quoted inside a fence it is an illustration; written in prose it
 * would be the rule. Only the second is a defect, so only prose is scanned.
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
// L3.1 - L3.4 — the ruler replaces the checklist
// ---------------------------------------------------------------------------

describe('L3.1-3.4 the ruler', () => {
  it('L3.1 building-commands carries `## The Ruler`, with eight items each showing both examples', () => {
    const text = read(P.ruler);
    expect(text).toMatch(/^## The Ruler/m);
    expect(text).not.toMatch(/^## Validation Checklist/m);

    const ruler = section(text, 'The Ruler');
    expect(ruler).not.toBeNull();

    // Items are headings, so a reader can link one and the reviewer can cite it.
    const items = [...ruler.matchAll(/^### (\d+)\./gm)].map((m) => Number(m[1]));
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    // Each item carries its pair. Two counts over the whole section would pass
    // with sixteen examples under item 1, so each item body is read on its own.
    const bodies = ruler.split(/^### \d+\./m).slice(1);
    expect(bodies).toHaveLength(8);
    bodies.forEach((b, i) => {
      expect(b, `item ${i + 1} Expected`).toMatch(/\*\*Expected\*\*/);
      expect(b, `item ${i + 1} Not expected`).toMatch(/\*\*Not expected\*\*/);
    });
  });

  it('L3.2 the old checklist subjects survive inside the ruler', () => {
    const ruler = section(read(P.ruler), 'The Ruler');
    expect(ruler).not.toBeNull();
    for (const subject of [
      /LANG header/,
      /## Spec/,
      /\bPhase\b/,
      /ALWAYS/,
      /NEVER/,
      /\{\{cmd:/,
      /intent-based/,
    ]) {
      expect(ruler, String(subject)).toMatch(subject);
    }
  });

  it('L3.3 no size criterion anywhere in the skill prose', () => {
    // RED today on "Maximum ~15 words per item". A number followed by a size
    // unit is the one form of "measurable" this delivery forbids outright, and
    // the skill that says so cannot be the skill that breaks it.
    for (const line of proseLines(read(P.ruler))) {
      expect(line, line).not.toMatch(/\b\d+\s*(words?|lines?|chars?|characters?)\b/i);
    }
  });

  it('L3.4 the Refactoring Workflow audits with the ruler, not the old checklist', () => {
    const wf = section(read(P.ruler), 'Refactoring Workflow');
    expect(wf).not.toBeNull();
    expect(wf).toMatch(/[Rr]uler/);
    expect(wf).not.toMatch(/Validation Checklist/);
  });
});

// ---------------------------------------------------------------------------
// L3.5 - L3.6 — the reviewer agent
// ---------------------------------------------------------------------------

describe('L3.5-3.6 the reviewer agent', () => {
  it('L3.5 it exists, carries the mould frontmatter, and its body states the method', () => {
    expect(exists(P.agent)).toBe(true);
    const fm = frontmatter(read(P.agent));
    expect(fm).toMatch(/^name:\s*prompt-review-agent\s*$/m);
    expect(fm).toMatch(/^model:\s*sonnet\s*$/m);
    expect(fm).toMatch(/^memory:\s*project\s*$/m);

    // No tool restriction: the MCP verbs it queries arrive with the open set,
    // exactly as plan-review-agent's frontmatter records.
    expect(fm).not.toMatch(/^tools:/m);
    expect(fm).not.toMatch(/^disallowedTools:/m);

    const b = body(read(P.agent));
    expect(b).toMatch(/READ-ONLY/);
    for (const verb of ['neighbors', 'dependencies', 'impact']) {
      expect(b, verb).toContain(verb);
    }
    for (const mode of ['audit', 'delivery']) {
      expect(b, mode).toContain(mode);
    }
    for (const verdict of ['ok', 'fix-then-ok', 'blocked']) {
      expect(b, verdict).toContain(`\`${verdict}\``);
    }
    // The MCP-unavailable rule and the never-grep rule, both load-bearing.
    expect(b).toMatch(/not verified/);
    expect(b).toMatch(/⛔ DO NOT USE: Grep|never grep|no grep fallback/i);

    // It writes nothing, and nowhere is it told to.
    expect(b).not.toMatch(/✅ DO USE: (Write|Edit)/);
    expect(b).toMatch(/writes? no file|never writes/i);
  });

  it('L3.6 its uses: block declares the skill carrying the ruler', () => {
    expect(uses(read(P.agent))).toMatch(/^- skill: building-commands$/m);
  });

  it('L3.16 confirm is a third mode, needs items, and is narrow by rule', () => {
    const b = body(read(P.agent));

    // Three modes, and `items` is what makes the third one narrow.
    expect(b).toMatch(/`audit`\s*\|\s*`delivery`\s*\|\s*`confirm`/);
    expect(b).toMatch(/`items`/);

    // A confirm with no items must refuse, never silently widen.
    const contract = section(b, 'Input Contract');
    expect(contract).toMatch(/confirm[\s\S]*?items[\s\S]*?blocked/i);
    expect(contract).toMatch(/[Dd]o NOT silently fall back|never fall back/);

    // The narrow scope, stated: the cited items plus 1 and 2 for collateral.
    const scope = section(b, '`confirm` — What It Checks');
    expect(scope, 'a section owning the narrow scope').not.toBeNull();
    expect(scope).toMatch(/items 1 and 2|item 1 and 2/);
    expect(scope).toMatch(/⛔ DO NOT: Tick the items nobody asked about/);
    expect(scope).toMatch(/pre-existing/i);

    // And it is the last pass. No third.
    expect(b).toMatch(/no third|last pass/i);
  });
});

// ---------------------------------------------------------------------------
// L3.7 - L3.9 — the two dispatchers
// ---------------------------------------------------------------------------

describe('L3.7-3.9 the dispatchers', () => {
  it('L3.7 the build delegates the ruler and names the auditor, with no literal count left', () => {
    const text = read(P.build);

    const s3 = stepBody(text, 'Load Skills');
    expect(s3).not.toMatch(/### building-commands Checklist/);
    // The load table row must reach agents, which the pre-plan row did not.
    expect(s3).toMatch(/building-commands[\s\S]*?\bagent\b/);

    const s7 = stepBody(text, 'Review');
    expect(s7).toContain('@prompt-review-agent');
    expect(s7).toContain('delivery');
    // The count is 3 + N now. Every literal form of the old four goes.
    expect(s7).not.toMatch(/\bfour\b/i);
    expect(s7).not.toMatch(/\b4 AGENTS\b/i);
    expect(s7).toMatch(/3 \+ N|3\+N/);

    expect(uses(text)).toMatch(/^- agent: prompt-review-agent$/m);
  });

  it('L3.8 guard: the build keeps ten STEPs and its once-only rule', () => {
    // Passes today. Guards F5 against a renumbering or a lost invariant.
    const text = read(P.build);
    expect(text).toMatch(/\bexactly once\b/i);
    const nums = stepNumbers(text);
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const n of nums) {
      expect(text.search(new RegExp(`^## STEP ${n}:`, 'm')), `STEP ${n} heading`)
        .toBeGreaterThan(-1);
    }
  });

  it('L3.9 the plan command audits the subject and turns failures into F-blocks', () => {
    const text = read(P.planCmd);

    const s3 = stepBody(text, 'Critical Analysis');
    expect(s3).toMatch(/^### 3\.4/m);
    expect(s3).toContain('@prompt-review-agent');
    expect(s3).toMatch(/\baudit\b/);
    // Only the subject of the request is audited, never an artefact touched in
    // passing — the distinction the questionnaire settled.
    expect(s3).toMatch(/\bsubject\b/);

    const s5 = stepBody(text, 'Generate Plan');
    expect(s5).toMatch(/❌[^\n]*F-block|F-block[^\n]*❌/);

    expect(uses(text)).toMatch(/^- agent: prompt-review-agent$/m);
  });
});

// ---------------------------------------------------------------------------
// L3.10 - L3.11 — the review discipline
// ---------------------------------------------------------------------------

describe('L3.10-3.11 the review discipline', () => {
  it('L3.10 the reader table has three readers and the third is counted', () => {
    const text = read(P.discipline);

    const rows = text.split(/\r?\n/).filter((l) => /^\|\s*`@/.test(l));
    expect(rows).toHaveLength(3);
    expect(rows.some((r) => r.includes('@prompt-review-agent'))).toBe(true);

    // A heading that counts the readers is wrong the moment a third arrives.
    expect(text).not.toMatch(/^#+.*Two Readers/m);

    // This assertion first pinned the phrase "per revision". That wording said
    // how many times without saying over what, and the count it described let
    // one artefact take two full ticks in a single delivery. L3.17 pins the
    // rule that replaced it; this one only needs the third reader to be counted
    // at all, which is the property that must never silently vanish.
    expect(section(text, 'The Counts')).toMatch(/prompt reviewer/i);
    expect(uses(text)).toMatch(/^- agent: prompt-review-agent$/m);
  });

  it('L3.17 the counts cap the prompt reviewer at one full tick plus one confirm', () => {
    const counts = section(read(P.discipline), 'The Counts');

    // Two dispatches, never three, and the second is the narrow one.
    expect(counts).toMatch(/exactly once per artefact per delivery/i);
    expect(counts).toMatch(/`confirm`/);
    expect(counts).toMatch(/no third pass/i);

    // The reason the second pass is legal at all: it is not the first repeated.
    expect(counts).toMatch(/narrow scope/i);

    // A second confirm is refused, and the adversarial reviewer gets none.
    expect(counts).toMatch(/IF A `confirm` HAS ALREADY COME BACK/);
    expect(counts).toMatch(/no confirmation pass and gets none/);

    const rules = section(read(P.discipline), 'Rules');
    expect(rules).toMatch(/Tick all eight items twice over one artefact in one delivery/);
    expect(rules).toMatch(/Dispatch a second `confirm`/);
  });

  it('L3.18 the build picks the mode from the F-block, and never loops', () => {
    const s7 = stepBody(read(P.build), 'Review');

    // The routing table: a cited ruler item means confirm, nothing means delivery.
    expect(s7).toMatch(/`confirm`/);
    expect(s7).toMatch(/`items`/);
    expect(s7).toMatch(/cites a ruler item/);

    // Both traps closed: no full re-tick, and no confirm without items.
    expect(s7).toMatch(/⛔ DO NOT: Send `mode: delivery`/);
    expect(s7).toMatch(/⛔ DO NOT: Send `confirm` without `items`/);
    expect(s7).toMatch(/⛔ DO NOT: Dispatch a third pass/);

    // And the plan side supplies what the routing reads.
    const s5 = stepBody(read(P.planCmd), 'Generate Plan');
    expect(s5).toMatch(/`mode: confirm`|mode: confirm/);
  });

  it('L3.11 guard: both existing counts survive', () => {
    // Passes today. The third reader must not displace the first two.
    const counts = section(read(P.discipline), 'The Counts');
    expect(counts).toMatch(/\bexactly once\b/i);
    expect(counts).toMatch(/\bat most twice\b|\bat most two\b/i);
  });
});

// ---------------------------------------------------------------------------
// L3.12 - L3.15 — the references, the contradiction, the map, the guards
// ---------------------------------------------------------------------------

describe('L3.12-3.15 references and guards', () => {
  it('L3.12 both layer skills point at the ruler by its name', () => {
    expect(read(P.internalLayer)).toMatch(/The Ruler/);
    const product = read(P.productLayer);
    expect(product).toMatch(/[Rr]uler/);
    expect(product).not.toMatch(/building-commands checklist/);
  });

  it('L3.13 the development skill imposes no word limit', () => {
    expect(read(P.devSkill)).not.toMatch(/max\s*10\s*words/i);
  });

  it('L3.14 CLAUDE.md points the ruler at its owner', () => {
    const details = section(read(P.claudeMd), 'Where the details live');
    expect(details).not.toBeNull();
    const row = details.split(/\r?\n/).find((l) => /^\|/.test(l) && /ruler/i.test(l));
    expect(row, 'a row naming the ruler').toBeTruthy();
    expect(row).toMatch(/building-commands/);
  });

  it('L3.15 guard: the two untouched agents keep their frontmatter', () => {
    // Passes today. This plan must not reach either file.
    const rb = frontmatter(read(P.readback));
    expect(rb).toMatch(/^tools:\s*Glob,\s*Read\s*$/m);
    expect(rb).not.toMatch(/^memory:/m);
    expect(frontmatter(read(P.reviewer))).toMatch(/^memory:\s*project\s*$/m);
  });
});
