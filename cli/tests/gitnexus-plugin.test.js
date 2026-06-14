import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { parseFragmentSections } from '../src/injection-core.js';

const require = createRequire(import.meta.url);
const { extractInjectionPoints } = require('../../scripts/build.js');

/**
 * Structural consistency of the gitnexus plugin (Phase 2 + 3 of plan 0032).
 * The plugin only functions if catalog ⟷ fragments ⟷ command markers ⟷ skills
 * are all wired consistently. This locks that wiring.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CATALOG = path.join(ROOT, 'cli', 'src', 'plugins.json');
const PLUGIN_DIR = path.join(ROOT, 'framwork', '.codeadd', 'plugins', 'gitnexus');
const COMMANDS_DIR = path.join(ROOT, 'framwork', '.codeadd', 'commands');
const AGENTS_DIR = path.join(ROOT, 'framwork', '.codeadd', 'agents');

// Agents intentionally NOT injected (MCP-blocked allowlists or non-code purpose).
const EXCLUDED_AGENTS = ['feature-history-agent', 'git-history-agent', 'doc-reviewer-agent'];

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

  it('injects exactly the five target commands', () => {
    expect(catalogEntry().injects.sort()).toEqual(['add.diagnose', 'add.done', 'add.hotfix', 'add.new', 'add.plan']);
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

describe('gitnexus agent injection targets', () => {
  const entry = catalogEntry();

  it('declares an agents target list with the per-agent schema shape', () => {
    expect(Array.isArray(entry.agents)).toBe(true);
    expect(entry.agents.length).toBeGreaterThan(0);
    for (const t of entry.agents) {
      expect(t, 'each agent target needs { agent, sections }').toHaveProperty('agent');
      expect(Array.isArray(t.sections)).toBe(true);
      expect(t.sections.length).toBeGreaterThan(0);
    }
  });

  it('targets exactly the eight code-navigating MCP-reachable agents', () => {
    expect(entry.agents.map((t) => t.agent).sort()).toEqual(
      [
        'architecture-agent',
        'backend-agent',
        'database-agent',
        'discovery-agent',
        'frontend-agent',
        'reviewer-agent',
        'system-design-agent',
        'ux-agent',
      ],
    );
  });

  for (const t of entry?.agents ?? []) {
    it(`fragment for ${t.agent} exists and its sections match plugin markers in the agent source`, () => {
      const fragPath = path.join(PLUGIN_DIR, 'fragments', 'agents', `${t.agent}.md`);
      expect(fs.existsSync(fragPath), `missing fragment agents/${t.agent}.md`).toBe(true);

      const sections = parseFragmentSections(fs.readFileSync(fragPath, 'utf8'));
      expect(sections.size, `fragment ${t.agent}.md has no <!-- section:NAME --> blocks`).toBeGreaterThan(0);
      expect([...sections.keys()].sort()).toEqual([...t.sections].sort());

      const agentSrc = fs.readFileSync(path.join(AGENTS_DIR, `${t.agent}.md`), 'utf8');
      for (const section of sections.keys()) {
        expect(agentSrc, `${t.agent}.md missing open marker for ${section}`)
          .toContain(`<!-- plugin:gitnexus:${section} -->`);
        expect(agentSrc, `${t.agent}.md missing close marker for ${section}`)
          .toContain(`<!-- /plugin:gitnexus:${section} -->`);
      }
    });
  }

  for (const excluded of EXCLUDED_AGENTS) {
    it(`excluded agent ${excluded} carries no gitnexus marker and no fragment`, () => {
      const agentSrc = fs.readFileSync(path.join(AGENTS_DIR, `${excluded}.md`), 'utf8');
      expect(agentSrc, `${excluded} must not be injected`).not.toContain('plugin:gitnexus:');
      expect(fs.existsSync(path.join(PLUGIN_DIR, 'fragments', 'agents', `${excluded}.md`))).toBe(false);
    });
  }
});

describe('gitnexus marker-free build (sidecar carries the anchors)', () => {
  const entry = catalogEntry();

  for (const t of entry?.agents ?? []) {
    it(`agent ${t.agent} source resolves to plugin:gitnexus injection points with variable-free anchors`, () => {
      const src = fs.readFileSync(path.join(AGENTS_DIR, `${t.agent}.md`), 'utf8');
      const pts = extractInjectionPoints(src, t.agent, 'agent').filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
      expect(pts.map((p) => p.section).sort()).toEqual([...t.sections].sort());
      for (const p of pts) {
        expect(p.resource).toEqual({ name: t.agent, kind: 'agent' });
        expect(p.anchor.text).not.toContain('<!--'); // anchor is prose, never a marker
        expect(p.anchor.text).not.toMatch(/\{\{(?:cmd|skill|addpath):/); // no per-provider variable
      }
    });
  }

  for (const cmd of entry?.injects ?? []) {
    it(`command ${cmd} source resolves to plugin:gitnexus injection points`, () => {
      const src = fs.readFileSync(path.join(COMMANDS_DIR, `${cmd}.md`), 'utf8');
      const pts = extractInjectionPoints(src, cmd, 'command').filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
      expect(pts.length).toBeGreaterThan(0);
      for (const p of pts) expect(p.resource).toEqual({ name: cmd, kind: 'command' });
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
