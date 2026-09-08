import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-08T121115 — Plain Language Rule.
 * Red-Green Validation Matrix (F7), levels L1 through L5.
 *
 * Every level here was written RED against the pre-plan tree, except the ones
 * labelled REGRESSION GUARD below. A guard passes today by design; counting one
 * as proof of new work is the gap the plan's Reviewer Handoff tells the reviewer
 * to hunt, so the distinction is kept in the test names themselves.
 *
 * L4.5 (build.js clean) and L4.6 (cli suite green) are not asserted here — they
 * are commands, run in STEP 5 and recorded in the ledger. Spawning a full build
 * from inside a unit suite would make every other level wait on it.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const SKILLS = path.join(CODEADD, 'skills');
const COMMANDS = path.join(CODEADD, 'commands');

const read = (p) => fs.readFileSync(p, 'utf8');

const CLAUDE_MD_STYLE = read(path.join(SKILLS, 'add-claude-md-style', 'SKILL.md'));
const DOC_SCHEMAS = read(path.join(SKILLS, 'add-doc-schemas', 'SKILL.md'));
const TOKEN_EFFICIENCY = read(path.join(SKILLS, 'add-token-efficiency', 'SKILL.md'));
const WIKI_MAINTENANCE = read(path.join(SKILLS, 'add-wiki-maintenance', 'SKILL.md'));
const ADD_WIKI = read(path.join(COMMANDS, 'add.wiki.md'));

const STYLE_START = '[//]: # (codeadd-style:start)';
const STYLE_END = '[//]: # (codeadd-style:end)';
const WIKI_START = '[//]: # (codeadd-wiki:start)';
const WIKI_END = '[//]: # (codeadd-wiki:end)';

/**
 * Pull one managed block out of a source file, from its start marker through its
 * end marker inclusive. Matches on a whole line so the marker names quoted in
 * surrounding prose (both files discuss these markers) never open the range.
 */
function extractBlock(source, startMarker, endMarker) {
  const lines = source.split('\n').map((l) => l.replace(/\s+$/, ''));
  const from = lines.indexOf(startMarker);
  if (from === -1) return null;
  const to = lines.indexOf(endMarker, from);
  if (to === -1) return null;
  return lines.slice(from, to + 1);
}

/**
 * The H2/H3 section named, up to the next heading at the same or higher level.
 *
 * FENCE-AWARE, and that is load-bearing rather than tidy. Both files embed fenced
 * templates that carry their own H2s — `## Project Knowledge Base` inside the block
 * template, `## ROLE` inside add.wiki's agent prompt. A naive `^## ` scan stops at the
 * first of those and silently returns a fragment, so every assertion below it would
 * pass by measuring nothing. This is the same trap the framework already documents for
 * the `## Materializes` contract block.
 */
function section(source, heading) {
  const level = heading.match(/^#+/)[0].length;
  const lines = source.split('\n');
  const from = lines.findIndex((l) => l.trim() === heading);
  if (from === -1) return null;
  const stop = new RegExp(`^#{1,${level}} `);
  let fenced = false;
  for (let i = from + 1; i < lines.length; i += 1) {
    if (/^\s*```/.test(lines[i])) fenced = !fenced;
    else if (!fenced && stop.test(lines[i])) return lines.slice(from, i).join('\n');
  }
  return lines.slice(from).join('\n');
}

/**
 * Every artefact name the build knows about, taken from disk rather than from a
 * hardcoded list so a later rename cannot leave this assertion checking ghosts.
 * Bare single-word names (`add`) are dropped: they collide with ordinary English
 * and would fail the block for containing the word "add".
 */
function artefactNames() {
  const names = [
    ...fs.readdirSync(COMMANDS).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)),
    ...fs.readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name),
    ...fs.readdirSync(path.join(CODEADD, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)),
  ];
  return names.filter((n) => /[.\-]/.test(n) && n.length >= 5);
}

describe('L1 — Writing Style block content contract (add-claude-md-style)', () => {
  it('L1.1 — the managed-block subsection exists under Section Templates', () => {
    const templates = section(CLAUDE_MD_STYLE, '## Section Templates');
    expect(templates).not.toBeNull();
    expect(templates).toContain('### Writing Style (managed block)');
  });

  it('L1.2 — the block exists and fits the 14-line cap, markers included', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block, 'codeadd-style markers not found in add-claude-md-style').not.toBeNull();
    expect(block.length).toBeLessThanOrEqual(14);
  });

  it('L1.3 — all seven contract elements are present and separately identifiable', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block).not.toBeNull();
    const text = block.join('\n');

    // 1 — the rule: describe the thing directly, do not substitute a figure of speech
    expect(text).toMatch(/describe the action[^.]*directly/i);
    expect(text).toMatch(/figure of speech/i);
    // 2 — its reach
    for (const surface of ['chat', 'docs', 'commit messages', 'code comments', 'identifiers']) {
      expect(text.toLowerCase(), `reach is missing "${surface}"`).toContain(surface);
    }
    // 3 — language independence
    expect(text).toMatch(/not to the language of this rule|every output language/i);
    // 4 — the carve-out
    expect(text).toMatch(/literal names of their concepts/i);
    // 5 — the self-test, phrased as a question about naming
    expect(text).toMatch(/name the action, or name something the action resembles\?/i);
    // 6 — exactly one bad-to-good pair, marked with an arrow
    expect(text.match(/→/g) ?? [], 'the block must carry exactly one bad-to-good pair').toHaveLength(1);
    // 7 — the explicit statement that this is not a word list
    expect(text).toMatch(/not a list of banned words/i);
  });

  it('L1.4 — the carve-out names at least three kept technical terms', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block).not.toBeNull();
    const text = block.join('\n').toLowerCase();
    const kept = ['branch', 'tree', 'cache', 'pipeline', 'parent', 'orphan', 'handler', 'race'];
    expect(kept.filter((t) => text.includes(t)).length).toBeGreaterThanOrEqual(3);
  });

  it('L1.5 — the block carries no build-time resource variable', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block).not.toBeNull();
    expect(block.join('\n')).not.toContain('{{');
  });

  it('L1.6 — the block carries no HTML comment', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block).not.toBeNull();
    expect(block.join('\n')).not.toContain('<!--');
  });

  it('L1.7 — the block names no framework artefact', () => {
    const block = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    expect(block).not.toBeNull();
    const text = block.join('\n');
    const named = artefactNames().filter((n) => text.includes(n));
    expect(named, `block names framework artefacts: ${named.join(', ')}`).toHaveLength(0);
  });

  it('L1.8 — the budget line accounts for both managed blocks as one combined total', () => {
    const formatRules = section(CLAUDE_MD_STYLE, '## Format Rules');
    expect(formatRules).not.toBeNull();
    const budget = formatRules.split('\n').find((l) => l.includes('80-150'));
    expect(budget, 'the 80-150 budget line is gone').toBeTruthy();
    expect(budget).toMatch(/managed blocks/i);
    expect(budget, 'the combined total of both blocks must be stated').toContain('31');
    expect(budget, 'the stale ~15 figure must be gone').not.toContain('~15');
  });

  it('L1.9 — the validation checklist covers the new block and keeps the old one', () => {
    const checklist = section(CLAUDE_MD_STYLE, '## Validation Checklist');
    expect(checklist).not.toBeNull();
    expect(checklist).toContain('codeadd-style:start');
    expect(checklist, 'the pre-existing wiki checklist item must survive').toContain('codeadd-wiki:start');
  });
});

describe('L2 — no drift between the skill template and the command prompt', () => {
  it('L2.1 — REGRESSION GUARD: the Project Knowledge Base block is identical in both files', () => {
    const inSkill = extractBlock(CLAUDE_MD_STYLE, WIKI_START, WIKI_END);
    const inCommand = extractBlock(ADD_WIKI, WIKI_START, WIKI_END);
    expect(inSkill).not.toBeNull();
    expect(inCommand).not.toBeNull();
    expect(inSkill).toEqual(inCommand);
  });

  it('L2.2 — the Writing Style block is identical in both files', () => {
    const inSkill = extractBlock(CLAUDE_MD_STYLE, STYLE_START, STYLE_END);
    const inCommand = extractBlock(ADD_WIKI, STYLE_START, STYLE_END);
    expect(inSkill, 'block missing from add-claude-md-style').not.toBeNull();
    expect(inCommand, 'block missing from add.wiki').not.toBeNull();
    expect(inSkill).toEqual(inCommand);
  });

  /**
   * Asserted on a STANDALONE LINE, not on any occurrence. add-claude-md-style
   * quotes `<!-- codeadd-wiki:start -->` mid-sentence to explain why that form is
   * banned; forbidding the string outright would forbid documenting the rule.
   * What must never exist is a line that IS an HTML-comment marker, because that
   * is the one the build would strip.
   */
  it('L2.3 — REGRESSION GUARD: neither marker is ever used as an HTML comment', () => {
    const markerLine = /^<!--\s*codeadd-(style|wiki):(start|end)\s*-->$/;
    for (const [name, source] of [['add-claude-md-style', CLAUDE_MD_STYLE], ['add.wiki', ADD_WIKI]]) {
      const offenders = source.split('\n').map((l) => l.trim()).filter((l) => markerLine.test(l));
      expect(offenders, `${name} uses an HTML-comment marker: ${offenders.join(', ')}`).toHaveLength(0);
    }
  });
});

describe('L3 — add.wiki wiring', () => {
  it('L3.1 — STEP 6 tasks the agent with the block, verbatim and replace-or-append', () => {
    const step6 = section(ADD_WIKI, '## STEP 6: Update CLAUDE.md');
    expect(step6).not.toBeNull();
    expect(step6).toMatch(/\d+\.\s+\*\*Writing Style managed block\*\*/);
    expect(step6).toContain(STYLE_START);
    expect(step6).toMatch(/REPLACE/);
    expect(step6).toMatch(/APPEND/);
    expect(step6).toMatch(/do not paraphrase/i);
  });

  it('L3.2 — STEP 6 reports what happened to the block', () => {
    const step6 = section(ADD_WIKI, '## STEP 6: Update CLAUDE.md');
    expect(step6).toContain('WRITING_STYLE_BLOCK');
  });

  it('L3.3 — STEP 7 verifies both marker pairs in all three context files', () => {
    const step7 = section(ADD_WIKI, '## STEP 7: Copy Context Files to Other Engines');
    expect(step7).not.toBeNull();
    expect(step7).toContain('codeadd-style:start');
    expect(step7).toContain('codeadd-wiki:start');
    for (const f of ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md']) {
      expect(step7).toContain(f);
    }
  });

  it('L3.4 — update mode reaches the managed blocks without regenerating the derived sections', () => {
    const modes = section(ADD_WIKI, '## Invocation Modes');
    expect(modes).not.toBeNull();
    expect(modes, 'update mode must run the managed-block part of STEP 6').toMatch(/STEP 6/);
    expect(modes, 'update mode must run STEP 7').toMatch(/STEP 7/);
    expect(modes, 'update mode must not regenerate the Architecture Contract').not.toContain('Architecture Contract');
    expect(modes, 'update mode must not regenerate the Technical Spec').not.toContain('Technical Spec');
  });

  it('L3.5 — REGRESSION GUARD: add-wiki-maintenance still refuses CLAUDE.md', () => {
    expect(WIKI_MAINTENANCE).toMatch(/never touches CLAUDE\.md/i);
  });
});

describe('L4 — the canonical rule', () => {
  it('L4.1 — add-doc-schemas Voice carries the rule, its reach, the language clause and the carve-out', () => {
    const voice = section(DOC_SCHEMAS, '### Voice');
    expect(voice).not.toBeNull();
    expect(voice).toMatch(/figurative language/i);
    expect(voice).toMatch(/figure of speech/i);
    expect(voice.toLowerCase()).toContain('code comments');
    expect(voice.toLowerCase()).toContain('identifiers');
    expect(voice, 'the rule must bind the output language, not only its own').toMatch(
      /binds the writing, not the language of the writing/i,
    );
    expect(voice).toMatch(/literal names of their concepts/i);
    expect(voice, 'the rule must forbid being turned into a word list').toMatch(/not a list of banned words/i);
  });

  it('L4.2 — REGRESSION GUARD: the four pre-existing Voice bullets survive', () => {
    const voice = section(DOC_SCHEMAS, '### Voice');
    for (const lead of [
      '**Extractive only.**',
      '**Clarity on what and why.**',
      '**No aspirational language.**',
      '**No marketing copy, no superlatives, no unverified claims.**',
    ]) {
      expect(voice, `Voice lost: ${lead}`).toContain(lead);
    }
  });

  it('L4.3 — REGRESSION GUARD: no numeric advisory is introduced on agent output', () => {
    const universal = section(DOC_SCHEMAS, '## Universal Rules');
    expect(universal).not.toBeNull();
    expect(universal).not.toMatch(/[<≤]\s*\d+\s*(words|chars|characters|lines)\b/i);
  });

  it('L4.4 — add-token-efficiency routes voice questions away and keeps no copy of the rule', () => {
    const whenNot = section(TOKEN_EFFICIENCY, '## When NOT to use');
    expect(whenNot).not.toBeNull();
    expect(whenNot).toMatch(/figurative|voice/i);
    expect(whenNot).toContain('add-doc-schemas');
    expect(
      TOKEN_EFFICIENCY,
      'add-token-efficiency must not carry a second copy of the rule — it routes only',
    ).not.toMatch(/literal names of their concepts/i);
  });
});
