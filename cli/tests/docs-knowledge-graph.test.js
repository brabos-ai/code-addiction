import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-12T104012 — Docs Knowledge Graph MCP.
 * The Validation Matrix's document-format half: L1.2, L1.3, and the schema-text
 * levels of L2 and L4 that assert what `add-doc-schemas` and the two authoring
 * commands must say.
 *
 * Every level here was written RED against the pre-plan tree and confirmed
 * failing before its F-block landed. Levels that run a command rather than read
 * a file (the build, the cli suite, the migration over a fixture) live in their
 * own suites or in the ledger — spawning a full build from inside a text suite
 * would make every other level wait on it.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const SKILLS = path.join(CODEADD, 'skills');

const read = (p) => fs.readFileSync(p, 'utf8');

const DOC_SCHEMAS = read(path.join(SKILLS, 'add-doc-schemas', 'SKILL.md'));
const NEW_FEATURE = read(path.join(SKILLS, 'add-doc-schemas', 'references', 'new-feature.md'));
const HISTORY = read(path.join(SKILLS, 'add-doc-schemas', 'references', 'history.md'));
const FIX = read(path.join(SKILLS, 'add-doc-schemas', 'references', 'fix.md'));

const COMMANDS = path.join(CODEADD, 'commands');
const ADD_NEW = read(path.join(COMMANDS, 'add.new.md'));
const ADD_HOTFIX = read(path.join(COMMANDS, 'add.hotfix.md'));

/**
 * The closed vocabulary, per design decision 10. `links_to` is the honest label
 * for an edge the migration recovered without knowing its intent; the other
 * three are authored.
 */
const RELATION_TYPES = ['caused_by', 'depends_on', 'part_of', 'links_to'];

describe('F1 — the document format lands in add-doc-schemas', () => {
  it('defines the ## Relations line grammar', () => {
    expect(DOC_SCHEMAS).toMatch(/^## Relations & Observations/m);
    expect(DOC_SCHEMAS).toContain('- <type> [[<id>]]');
  });

  it('declares the closed vocabulary, and nothing outside it', () => {
    const section = DOC_SCHEMAS.slice(
      DOC_SCHEMAS.indexOf('### Relation Types'),
      DOC_SCHEMAS.indexOf('### Observation Lines'),
    );
    expect(section).not.toBe('');
    for (const type of RELATION_TYPES) {
      expect(section).toContain(`\`${type}\``);
    }
    expect(section).toMatch(/closed/i);
  });

  it('defines the ## Observations line grammar', () => {
    expect(DOC_SCHEMAS).toContain('- [<category>] <text>');
    expect(DOC_SCHEMAS).toMatch(/^### Observation Lines/m);
  });

  it('adds tags: to the universal frontmatter and leaves related: alone', () => {
    expect(DOC_SCHEMAS).toMatch(/tags:\s*\[\]/);
    // `related:` stays readable as migration input — design Supersession row 13.
    expect(DOC_SCHEMAS).toContain('related: []');
    expect(DOC_SCHEMAS).toMatch(/migration input/i);
  });

  it('introduces no permalink key — id and slug already exist (decision 11)', () => {
    expect(DOC_SCHEMAS).not.toMatch(/permalink/i);
    expect(NEW_FEATURE).not.toMatch(/permalink/i);
    expect(HISTORY).not.toMatch(/permalink/i);
  });

  it('L1.2 — an unresolved ## Relations target FAILS the gate, unlike a {{doc:}} ref', () => {
    const gate = DOC_SCHEMAS.slice(DOC_SCHEMAS.indexOf('## Validation Gate Block'));
    expect(gate).toMatch(/## Relations/);
    // The existing {{doc:}} rule is a WARNING and must stay one.
    expect(gate).toMatch(/Unresolved refs = WARNING/);
    // The new rule is a FAIL, and says so next to the ids it governs.
    expect(gate).toMatch(/Relations[\s\S]{0,400}?FAIL/);
  });

  it('feature-about carries Relations and Observations in its section list', () => {
    const schema = NEW_FEATURE.slice(
      NEW_FEATURE.indexOf('### feature-about'),
      NEW_FEATURE.indexOf('### feature-plan'),
    );
    expect(schema).toContain('Relations');
    expect(schema).toContain('Observations');
    expect(schema).toMatch(/tags:/);
  });

  it('the changelog schema carries its relation to the work item it delivered', () => {
    const schema = HISTORY.slice(HISTORY.indexOf('### changelog'));
    expect(schema).toContain('## Relations');
    expect(schema).toContain('part_of');
  });
});

describe('F2 — the hotfix-related schema retires into the about.md', () => {
  it('is no longer an active schema in the category', () => {
    const header = FIX.slice(0, FIX.indexOf('## Shared Notation'));
    expect(header).toMatch(/\*\*Schemas in this category:\*\* `hotfix-about`\.$/m);
  });

  it('the Schema Index no longer offers it to a command', () => {
    const row = DOC_SCHEMAS.split('\n').find((l) => l.startsWith('| `fix` |'));
    expect(row).toBeTruthy();
    expect(row).toContain('hotfix-about');
    expect(row).not.toContain('hotfix-related');
  });

  it('records the harvest rather than deleting the schema outright', () => {
    const retired = FIX.slice(FIX.indexOf('### hotfix-related'));
    expect(retired).toMatch(/retired/i);
    // Both filled sections must name their new home — 15 of 19 real documents
    // carry an explained relationship and 18 of 19 a real file list.
    expect(retired).toMatch(/Follow-ups[\s\S]{0,300}?## Relations/);
    expect(retired).toMatch(/Impacted Files[\s\S]{0,300}?file set/);
  });

  it('stops any command writing a new related.md', () => {
    const retired = FIX.slice(FIX.indexOf('### hotfix-related'));
    expect(retired).toMatch(/DO NOT[\s\S]{0,200}?related\.md/);
    // An existing related.md is a user file and is never deleted.
    expect(retired).toMatch(/never deleted|left on disk|not deleted/i);
  });

  it('hotfix-about carries Relations, Observations and tags:', () => {
    const about = FIX.slice(FIX.indexOf('### hotfix-about'), FIX.indexOf('### hotfix-related'));
    expect(about).toContain('Relations');
    expect(about).toContain('Observations');
    expect(about).toMatch(/tags:/);
    expect(about).toContain('caused_by');
  });
});

describe('F3 — /add.new writes its relations from its own discovery result', () => {
  it('L4.8 names the section, the source and the vocabulary it may use', () => {
    const step = ADD_NEW.slice(ADD_NEW.indexOf('**Write about.md:**'), ADD_NEW.indexOf('## STEP 7'));
    expect(step).toContain('## Relations');
    expect(step).toContain('tags:');
    expect(step).toContain('depends_on');
    expect(step).toContain('part_of');
    // The source is the discovery output the command already holds.
    expect(step).toMatch(/past-features\.md|delivery index/);
  });

  it('L4.8 forbids putting the question to the user', () => {
    const step = ADD_NEW.slice(ADD_NEW.indexOf('**Write about.md:**'), ADD_NEW.indexOf('## STEP 7'));
    expect(step).toMatch(/⛔ DO NOT[\s\S]{0,200}?ask/i);
  });

  it('an epic subfeature about.md is part_of its parent', () => {
    expect(ADD_NEW).toMatch(/part_of \[\[/);
  });
});

describe('F4 — /add.hotfix routes its confirmed set into the about.md', () => {
  it('L4.2 the confirmed set reaches BOTH destinations, and neither loses it', () => {
    const synth = ADD_HOTFIX.slice(
      ADD_HOTFIX.indexOf('### 5.2 Present to user'),
      ADD_HOTFIX.indexOf('### 5.3'),
    );
    // Destination one: the about.md's Relations, typed caused_by.
    expect(synth).toContain('## Relations');
    expect(synth).toContain('caused_by');
    // Destination two: the blast radius STEP 9's failure judge reads. Unchanged.
    expect(synth).toMatch(/blast radius/);
    expect(synth).toMatch(/STEP 9/);
  });

  it('the about.md step writes the section from that set', () => {
    const step = ADD_HOTFIX.slice(
      ADD_HOTFIX.indexOf('## STEP 11: Write Hotfix about.md'),
      ADD_HOTFIX.indexOf('## STEP 12:'),
    );
    expect(step).toContain('## Relations');
    expect(step).toContain('caused_by');
    expect(step).toContain('tags:');
  });

  it('nothing writes related.md any more, anywhere in the command', () => {
    // The only surviving mention may be the prohibition itself.
    const writes = ADD_HOTFIX.split('\n').filter(
      (l) => /related\.md/.test(l) && !/DO NOT|never|no longer|retired/i.test(l),
    );
    expect(writes).toEqual([]);
    expect(ADD_HOTFIX).not.toContain('hotfix-related');
  });

  it('the step list and the bodies agree after the removal', () => {
    const listBlock = ADD_HOTFIX.slice(
      ADD_HOTFIX.indexOf('**STEPS IN ORDER:**'),
      ADD_HOTFIX.indexOf('**⛔ ABSOLUTE PROHIBITIONS'),
    );
    const listed = [...listBlock.matchAll(/^STEP ([0-9]+)(?:-([0-9]+))?:/gm)].flatMap((m) =>
      m[2] ? [Number(m[1]), Number(m[2])] : [Number(m[1])],
    );
    const bodies = [...ADD_HOTFIX.matchAll(/^## STEP ([0-9]+)(?:-([0-9]+))?:/gm)].flatMap((m) =>
      m[2] ? [Number(m[1]), Number(m[2])] : [Number(m[1])],
    );
    expect(listed).toEqual(bodies);
    expect(bodies).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });
});

describe('F5 — templates/related.md is gone', () => {
  it('L1.3 absent from the source tree', () => {
    expect(fs.existsSync(path.join(CODEADD, 'templates', 'related.md'))).toBe(false);
  });

  it('L1.3 absent from every provider output directory', () => {
    const framwork = path.join(ROOT, 'framwork');
    const strays = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'related.md') strays.push(path.relative(ROOT, full));
      }
    };
    walk(framwork);
    expect(strays).toEqual([]);
  });

  it('nothing in the shipped tree references the template', () => {
    const hits = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.md') || entry.name.endsWith('.sh')) {
          if (read(full).includes('templates/related.md')) hits.push(path.relative(ROOT, full));
        }
      }
    };
    walk(CODEADD);
    expect(hits).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// F20 — the discovery step gains a graph step, with a destination in all six
// ---------------------------------------------------------------------------

describe('F20 — add-knowledge-discovery gains the GRAPH step', () => {
  const SKILL = read(path.join(SKILLS, 'add-knowledge-discovery', 'SKILL.md'));

  it('the procedure carries a GRAPH step, right after INDEX', () => {
    expect(SKILL).toMatch(/^### 2\. GRAPH$/m);
    expect(SKILL.indexOf('### 1. INDEX')).toBeLessThan(SKILL.indexOf('### 2. GRAPH'));
    expect(SKILL.indexOf('### 2. GRAPH')).toBeLessThan(SKILL.indexOf('### 3. PRESENCE'));
  });

  it('its step numbering stays contiguous after the insertion', () => {
    const nums = [...SKILL.matchAll(/^### (\d+)\. /gm)].map((m) => Number(m[1]));
    expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    expect(SKILL).toMatch(/The 9-Step Procedure/);
  });

  it('every internal step reference points at the renumbered step', () => {
    // FRESHNESS moved from 5 to 6 when GRAPH went in at 2. A pointer left at
    // the old number resolves to the wrong step and nothing would catch it.
    const freshness = [...SKILL.matchAll(/^### (\d+)\. FRESHNESS$/gm)][0][1];
    expect(SKILL).toContain(`STEP ${freshness} (FRESHNESS)`);
    expect(SKILL).not.toContain('STEP 5 (FRESHNESS)');
  });

  it('names the command it runs, and says what comes back', () => {
    const step = SKILL.slice(SKILL.indexOf('### 2. GRAPH'), SKILL.indexOf('### 3. PRESENCE'));
    expect(step).toContain('codeadd mcp --corpus=docs');
    expect(step).toContain('RELATED_WORK');
    expect(step).toMatch(/touched_by/);
    expect(step).toMatch(/search/);
  });

  it('no-ops when the graph is unavailable, like INDEX and PRESENCE do', () => {
    const step = SKILL.slice(SKILL.indexOf('### 2. GRAPH'), SKILL.indexOf('### 3. PRESENCE'));
    expect(step).toMatch(/no-op|absent|unavailable/i);
  });

  it('the uses block declares what the step now names', () => {
    expect(SKILL).toMatch(/- mention: \/add\.done/);
  });
});

describe('F20 — all six commands name a destination for the result', () => {
  const SIX = ['add.new', 'add.plan', 'add.hotfix', 'add.brainstorm', 'add.diagnose', 'add.review'];

  it('each loads the skill and names RELATED_WORK', () => {
    for (const name of SIX) {
      const src = read(path.join(COMMANDS, `${name}.md`));
      expect(src, name).toContain('add-knowledge-discovery/SKILL.md');
      expect(src, name).toContain('RELATED_WORK');
    }
  });

  it('the destination each one names is a REAL SLOT in that same file', () => {
    // THE LEVEL THIS REPLACES TESTED THE SENTENCE, NOT THE WIRING.
    // It asked whether a command's prose names a destination. Five of the six
    // named one whose slot did not exist: add.review's dispatch payload,
    // add.plan's bootstrap template, add.diagnose's payload list, add.hotfix's
    // touched_by over files that had not changed yet, and add.new, which never
    // ran the step that produces the value at all. A prose-only level cannot
    // see any of that, so this one reads the destination instead.
    // Plain substrings, deliberately: a regex literal built through a
    // generator is one escaping mistake away from matching nothing at all.
    const SLOTS = {
      // The value must be PRODUCED before it can be routed, which is the one
      // add.new was missing entirely.
      'add.new': ['run its **INDEX step, its GRAPH step', '`RELATED_WORK` destination'],
      // add.plan is checked separately below: its slot must sit INSIDE the
      // bootstrap template, and a file-wide search finds the paragraph that
      // merely explains the slot. That is the same prose-not-wiring mistake
      // this whole level exists to stop making.
      'add.plan': ['travels the same two routes'],
      'add.hotfix': ['`RELATED_WORK` destination', "touched_by` over this branch's changed paths"],
      'add.brainstorm': ['## Candidate Directions'],
      'add.diagnose': ['**`RELATED_WORK` (STEP 1.4)**'],
      'add.review': ['**`RELATED_WORK` from STEP 2.2**'],
    };
    for (const [name, slots] of Object.entries(SLOTS)) {
      const src = read(path.join(COMMANDS, `${name}.md`));
      for (const slot of slots) {
        expect(src.includes(slot), `${name}: no slot carrying ${slot}`).toBe(true);
      }
    }
  });

  it('add.plan carries the slot INSIDE the bootstrap template, not merely near it', () => {
    // Checked against the fenced block a subagent actually receives. Asserting
    // on the whole file passes on the paragraph that describes the slot, which
    // is how the first draft of this level let the slot be deleted and stayed
    // green.
    const src = read(path.join(COMMANDS, 'add.plan.md'));
    const section = src.slice(src.indexOf('### Subagent Bootstrap'));
    const FENCE = String.fromCharCode(96, 96, 96);
    const open = section.indexOf(FENCE);
    const template = section.slice(open + FENCE.length, section.indexOf(FENCE, open + FENCE.length));
    expect(template).toContain('${TASK_DOCUMENTS}');
    expect(template).toContain('${WIKI_PAGES}');
    expect(template).toContain('${RELATED_WORK}');
  });

  it('add.plan fills its two carry-forwards independently of each other', () => {
    // The GRAPH step is standalone and reads no wiki page, so a WIKI:absent run
    // must still carry RELATED_WORK. Gating one on the other loses it.
    const src = read(path.join(COMMANDS, 'add.plan.md'));
    expect(src).toContain('travels whether or not a wiki exists');
    expect(src).toContain('Filled independently of `${WIKI_PAGES}`');
  });

  it('add.new runs INDEX and GRAPH even when the wiki is absent', () => {
    const src = read(path.join(COMMANDS, 'add.new.md'));
    const gate = src.slice(src.indexOf('IF THE WIKI IS ABSENT:'), src.indexOf('IF THE WIKI IS ABSENT:') + 400);
    expect(gate).toContain('⛔ DO NOT: Skip the INDEX and GRAPH steps');
  });

  it('add.hotfix asks for touched_by only where a file list exists', () => {
    const src = read(path.join(COMMANDS, 'add.hotfix.md'));
    const step4 = src.slice(src.indexOf('## STEP 4:'), src.indexOf('## STEP 5:'));
    const step9 = src.slice(src.indexOf('## STEP 9:'), src.indexOf('## STEP 10:'));
    // STEP 4 runs before the investigation and before the fix.
    expect(step4).toContain('`search` ONLY at this step');
    expect(step4).not.toContain('touched_by` result over the changed files');
    // STEP 9 has the diff in hand.
    expect(step9).toContain('touched_by');
  });

  it('add.hotfix runs GRAPH at its index step, where the wiki is out of bounds', () => {
    const src = read(path.join(COMMANDS, 'add.hotfix.md'));
    const step4 = src.slice(src.indexOf('## STEP 4:'), src.indexOf('## STEP 5:'));
    expect(step4).toContain('RELATED_WORK');
    expect(step4).toMatch(/INDEX/);
  });

  it('the skill records why the hotfix exemption covers GRAPH too', () => {
    const skill = read(path.join(SKILLS, 'add-knowledge-discovery', 'SKILL.md'));
    const whenNot = skill.slice(skill.indexOf('## When NOT to Use'), skill.indexOf('## The 9-Step'));
    expect(whenNot).toContain('GRAPH');
  });
});
