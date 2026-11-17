import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { parseFragmentSections } from '../src/injection-core.js';

const require = createRequire(import.meta.url);
const { extractSlots } = require('../../scripts/build.js');

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
const EXCLUDED_AGENTS = ['feature-history-agent', 'git-history-agent', 'readback-agent'];
// readback-agent replaced doc-reviewer-agent here when that agent was deleted (plan 0076).
// It belongs on this list for a stronger reason than its predecessor: its `tools: Glob, Read`
// allowlist IS the doc-set boundary the whole skill depends on. A code-graph tool would let
// the cold reader repair a gap from outside the docs and report a comprehension the document
// never delivered — which is the one way to make the readback worthless.

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

  it('injects exactly the seven target commands', () => {
    // Title kept for the test-loss guard; the list now holds eight commands.
    // add-build joined when its main session was seen calling gitnexus with no guidance at all.
    // add-review joined with plan 2026-11-16T205432-PLAN--gitnexus-integration (detect_changes over the diff).
    expect(catalogEntry().injects.sort()).toEqual(['add-build', 'add-diagnose', 'add-done', 'add-hotfix', 'add-new', 'add-plan', 'add-review', 'add-wiki']);
  });

  it('ships the add--gitnexus skill', () => {
    expect(catalogEntry().skills).toContain('add--gitnexus');
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

describe('gitnexus fragments carry the repo rule themselves', () => {
  // With more than one repo indexed, every gitnexus call without `repo` fails. The protocol lives in
  // add--gitnexus, but a session that never loads that skill never sees it — so each fragment states
  // the rule inside an injected section, where it actually reaches the command or agent.
  const fragments = [
    ...fs.readdirSync(path.join(PLUGIN_DIR, 'fragments')).filter((f) => f.endsWith('.md')),
    ...fs.readdirSync(path.join(PLUGIN_DIR, 'fragments', 'agents')).filter((f) => f.endsWith('.md')).map((f) => `agents/${f}`),
  ];

  it('covers the sixteen fragments', () => {
    // Title kept for the test-loss guard; the count is now seventeen.
    // 16 -> 17: fragments/add-review.md (plan 2026-11-16T205432-PLAN--gitnexus-integration, F4).
    expect(fragments.length).toBe(17);
  });

  for (const rel of fragments) {
    it(`${rel} states list_repos and the repo parameter inside an injected section`, () => {
      const sections = parseFragmentSections(fs.readFileSync(path.join(PLUGIN_DIR, 'fragments', rel), 'utf8'));
      const carrying = [...sections.values()].filter((body) => body.includes('list_repos') && body.includes('`repo`'));
      expect(carrying.length, `${rel} has no section stating the repo rule`).toBeGreaterThan(0);
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

  it('targets exactly the nine code-navigating MCP-reachable agents', () => {
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
        'ux-flow-agent',
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
      const pts = extractSlots(src, t.agent, 'agent', () => '').flatMap((slot) => slot.members.map((m) => ({ ...m, resource: slot.resource, anchor: slot.anchor }))).filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
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
      const pts = extractSlots(src, cmd, 'command', () => '').flatMap((slot) => slot.members.map((m) => ({ ...m, resource: slot.resource, anchor: slot.anchor }))).filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
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

  it('add--gitnexus dispatches to the native gitnexus-* skills', () => {
    const content = fs.readFileSync(path.join(PLUGIN_DIR, 'skills', 'add--gitnexus', 'SKILL.md'), 'utf8');
    for (const native of ['gitnexus-exploring', 'gitnexus-impact-analysis', 'gitnexus-debugging']) {
      expect(content, `add--gitnexus should reference ${native}`).toContain(native);
    }
  });
});

// ─── plan 2026-11-16T205432-PLAN--gitnexus-integration — L1.3 to L1.9 ───
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const FRAG = (name) => (fs.existsSync(path.join(PLUGIN_DIR, 'fragments', name)) ? read(PLUGIN_DIR, 'fragments', name) : '');
const SKILL_TEXT = () => read(PLUGIN_DIR, 'skills', 'add--gitnexus', 'SKILL.md');
const BRIDGED = ['add-plan', 'add-hotfix', 'add-diagnose', 'add-review'];
const SIX_SKILLS = ['gitnexus-exploring', 'gitnexus-impact-analysis', 'gitnexus-debugging', 'gitnexus-refactoring', 'gitnexus-guide', 'gitnexus-cli'];

describe('gitnexus freshness and the bridge (L1.3, L1.5)', () => {
  for (const cmd of BRIDGED) {
    it(`${cmd} fragment has a graph-fresh section with the exact commands`, () => {
      const sections = parseFragmentSections(FRAG(`${cmd}.md`));
      const body = sections.get('graph-fresh');
      expect(body, `${cmd}.md has no graph-fresh section`).toBeDefined();
      for (const needle of ['gitnexus status --json', 'stale', 'up-to-date', 'gitnexus analyze --skip-agents-md']) {
        expect(body, `${cmd} graph-fresh lacks ${needle}`).toContain(needle);
      }
    });

    it(`${cmd} fragment carries the bridge, the paging rule and uses add--knowledge-discovery`, () => {
      const text = FRAG(`${cmd}.md`);
      const sections = [...parseFragmentSections(text).values()];
      expect(sections.some((b) => b.includes('GRAPH question') && b.includes('add--knowledge-discovery') && b.includes('summaryOnly'))).toBe(true);
      const uses = text.match(/<!-- uses:[\s\S]*?-->/)?.[0] ?? '';
      expect(uses).toContain('skill: add--knowledge-discovery');
    });
  }
});

describe('gitnexus freshness slot order (L1.4)', () => {
  const where = {
    'add-plan': 'STEP add-plan.context',
    'add-hotfix': 'STEP add-hotfix.context',
    'add-diagnose': 'STEP add-diagnose.context',
    'add-review': 'STEP add-review.bootstrap',
  };
  const dispatchesInjected = (line, agents) => !line.startsWith('|') && agents.some((a) => line.includes(`@${a}`) && (/DISPATCH/i.test(line) || /\*\*Agent:\*\*/.test(line)));

  for (const cmd of BRIDGED) {
    it(`${cmd}: graph-fresh sits in ${where[cmd]}, before every other gitnexus marker and agent dispatch`, () => {
      const src = read(COMMANDS_DIR, `${cmd}.md`);
      const open = src.indexOf('<!-- slot:gitnexus.graph-fresh');
      expect(open, `${cmd} has no gitnexus.graph-fresh slot`).toBeGreaterThan(-1);
      const stepStart = src.indexOf(`## ${where[cmd]}`);
      expect(stepStart, `no ${where[cmd]} heading`).toBeGreaterThan(-1);
      const nextStep = src.indexOf('\n## STEP', stepStart + 5);
      expect(open).toBeGreaterThan(stepStart);
      expect(open).toBeLessThan(nextStep === -1 ? Infinity : nextStep);

      const others = [...src.matchAll(/<!-- plugin:gitnexus:(?!graph-fresh)/g)].map((m) => m.index);
      for (const o of others) expect(open, `${cmd}: another gitnexus marker precedes graph-fresh`).toBeLessThan(o);

      const agents = catalogEntry().agents.map((t) => t.agent);
      let offset = 0;
      for (const line of src.split('\n')) {
        if (dispatchesInjected(line, agents)) expect(open, `${cmd}: ${line.trim().slice(0, 60)} precedes graph-fresh`).toBeLessThan(offset);
        offset += line.length + 1;
      }
    });
  }
});

describe('add--gitnexus skill reading rules (L1.6)', () => {
  it('has Freshness and Small answers headings and the vocabulary', () => {
    const t = SKILL_TEXT();
    expect(t).toMatch(/^#+ .*Freshness/m);
    expect(t).toMatch(/^#+ .*Small answers/m);
    for (const w of ['summaryOnly', 'limit', 'offset', 'maxTokens', 'detect_changes']) expect(t).toContain(w);
  });

  it('names only the six skills `analyze --skip-agents-md` installs', () => {
    const t = SKILL_TEXT();
    expect(t).not.toContain('gitnexus-pr-review');
    const names = new Set(t.match(/gitnexus-[a-z-]+/g) ?? []);
    for (const n of names) expect(SIX_SKILLS, `${n} is not a standard skill`).toContain(n);
  });
});

describe('detect_changes over the diff (L1.7)', () => {
  const files = { review: FRAG('add-review.md'), reviewer: FRAG('agents/reviewer-agent.md') };
  for (const [k, text] of Object.entries(files)) {
    it(`${k} fragment names detect_changes, compare, base_ref, get-main-branch.cjs and GRAPH_IMPACT`, () => {
      for (const w of ['detect_changes', 'compare', 'base_ref', 'get-main-branch.cjs', 'GRAPH_IMPACT']) expect(text, w).toContain(w);
      for (const l of text.split('\n').filter((x) => /scope:\s*"all"|`all`/.test(x))) expect(l, 'all may only appear as a warning').toMatch(/never|do not/i);
    });
  }
  it('the reviewer fragment never tells the agent to run analyze or status', () => {
    const lines = files.reviewer.split('\n').filter((l) => /gitnexus (analyze|status)/.test(l));
    for (const l of lines) expect(l, 'only a prohibition may mention them').toMatch(/never|do not|don't/i);
  });
});

describe('no hooks, no AGENTS.md writes in any instruction (L1.8)', () => {
  const surfaces = () => {
    const out = [];
    const walk = (d) => {
      for (const f of fs.readdirSync(d, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(d, f.name));
        else out.push([path.relative(ROOT, path.join(d, f.name)), read(d, f.name)]);
      }
    };
    walk(PLUGIN_DIR);
    out.push(['plugins.json#gitnexus', JSON.stringify(catalogEntry())]);
    out.push(['add-setup.md', read(COMMANDS_DIR, 'add-setup.md')]);
    return out;
  };
  it('every `gitnexus analyze` carries --skip-agents-md; every `gitnexus setup` line forbids it', () => {
    for (const [name, text] of surfaces()) {
      for (const m of text.matchAll(/gitnexus analyze(?!\s+--skip-agents-md)/g)) {
        // a bare mention is only legal in a sentence that forbids it (the reviewer fragment)
        const line = text.slice(text.lastIndexOf('\n', m.index) + 1, text.indexOf('\n', m.index) === -1 ? undefined : text.indexOf('\n', m.index));
        expect(line, `${name}: bare gitnexus analyze`).toMatch(/never|do not/i);
      }
      const textLines = text.replace(/\\n/g, '\n').split('\n');
      for (const l of textLines) if (l.includes('gitnexus setup')) expect(l, `${name}: ${l}`).toMatch(/do not|never/i);
    }
  });
});

describe('license shown before enabling (L1.9)', () => {
  it('hints state PolyForm Noncommercial and the manual setup', () => {
    const e = catalogEntry();
    expect(e.postEnableHint).toContain('PolyForm Noncommercial');
    expect(e.installHint).toContain('PolyForm Noncommercial');
    for (const w of ['mcp add gitnexus', 'gitnexus analyze --skip-agents-md', '.claude/skills']) expect(e.postEnableHint).toContain(w);
    expect(e.postEnableHint).toContain('grep');
    expect(e.installHint).toContain('npm install -g gitnexus');
  });
  it('add-setup offer row states the license', () => {
    const row = read(COMMANDS_DIR, 'add-setup.md').split('\n').find((l) => l.startsWith('|') && l.includes('gitnexus'));
    expect(row).toContain('PolyForm Noncommercial');
  });
  it('reviewer fragment has the graph section with the repo rule', () => {
    const body = parseFragmentSections(FRAG('agents/reviewer-agent.md')).get('graph');
    expect(body).toContain('list_repos');
  });
});
