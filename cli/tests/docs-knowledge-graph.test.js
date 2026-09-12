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
