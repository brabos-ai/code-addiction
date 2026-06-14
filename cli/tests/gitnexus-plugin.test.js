import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseFragmentSections } from '../src/injection-core.js';

/**
 * Structural consistency of the gitnexus plugin (Phase 2 + 3 of plan 0032).
 * The plugin only functions if catalog ⟷ fragments ⟷ command markers ⟷ skills
 * are all wired consistently. This locks that wiring.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CATALOG = path.join(ROOT, 'cli', 'src', 'plugins.json');
const PLUGIN_DIR = path.join(ROOT, 'framwork', '.codeadd', 'plugins', 'gitnexus');
const COMMANDS_DIR = path.join(ROOT, 'framwork', '.codeadd', 'commands');

function catalogEntry() {
  const raw = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  return raw.gitnexus;
}

describe('gitnexus catalog entry', () => {
  it('exists with all required schema fields', () => {
    const e = catalogEntry();
    expect(e).toBeDefined();
    for (const field of ['type', 'description', 'detect', 'homepage', 'installHint', 'postEnableHint', 'injects', 'skills']) {
      expect(e, `missing field ${field}`).toHaveProperty(field);
    }
    expect(e.type).toBe('mcp');
    expect(Array.isArray(e.injects)).toBe(true);
    expect(Array.isArray(e.skills)).toBe(true);
  });

  it('injects exactly the four target commands', () => {
    expect(catalogEntry().injects.sort()).toEqual(['add.diagnose', 'add.done', 'add.hotfix', 'add.new']);
  });

  it('ships the add-gitnexus skill', () => {
    expect(catalogEntry().skills).toContain('add-gitnexus');
  });
});

describe('gitnexus fragments ⟷ command markers', () => {
  const entry = catalogEntry();

  for (const cmd of entry?.injects ?? []) {
    it(`fragment for ${cmd} exists and its sections match plugin markers in the source command`, () => {
      const fragPath = path.join(PLUGIN_DIR, 'fragments', `${cmd}.md`);
      expect(fs.existsSync(fragPath), `missing fragment ${cmd}.md`).toBe(true);

      const sections = parseFragmentSections(fs.readFileSync(fragPath, 'utf8'));
      expect(sections.size, `fragment ${cmd}.md has no <!-- section:NAME --> blocks`).toBeGreaterThan(0);

      const cmdSource = fs.readFileSync(path.join(COMMANDS_DIR, `${cmd}.md`), 'utf8');
      for (const section of sections.keys()) {
        expect(cmdSource, `${cmd}.md missing open marker for ${section}`)
          .toContain(`<!-- plugin:gitnexus:${section} -->`);
        expect(cmdSource, `${cmd}.md missing close marker for ${section}`)
          .toContain(`<!-- /plugin:gitnexus:${section} -->`);
      }
    });
  }
});

describe('gitnexus skills', () => {
  const entry = catalogEntry();

  for (const skill of entry?.skills ?? []) {
    it(`skill ${skill} has a SKILL.md with matching name frontmatter`, () => {
      const skillPath = path.join(PLUGIN_DIR, 'skills', skill, 'SKILL.md');
      expect(fs.existsSync(skillPath), `missing skill ${skill}/SKILL.md`).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf8');
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(new RegExp(`^name:\\s*${skill}\\s*$`, 'm'));
      expect(content).toMatch(/^description:\s*.+$/m);
    });
  }

  it('add-gitnexus dispatches to the native gitnexus-* skills', () => {
    const content = fs.readFileSync(path.join(PLUGIN_DIR, 'skills', 'add-gitnexus', 'SKILL.md'), 'utf8');
    for (const native of ['gitnexus-exploring', 'gitnexus-impact-analysis', 'gitnexus-debugging']) {
      expect(content, `add-gitnexus should reference ${native}`).toContain(native);
    }
  });
});
