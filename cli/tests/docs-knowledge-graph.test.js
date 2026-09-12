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
