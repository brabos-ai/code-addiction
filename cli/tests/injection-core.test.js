import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  escapeRegex,
  parseFragmentSections,
  injectSections,
  removeSections,
  readManifest,
  saveManifest,
  calculateHash,
  recalculateHashes,
  getAgentFragments,
  injectAgentFragments,
  removeAgentFragments,
} from '../src/injection-core.js';

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b*c+')).toBe('a\\.b\\*c\\+');
  });

  it('escapes dots in plugin/feature names', () => {
    expect(escapeRegex('add.new')).toBe('add\\.new');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeRegex('plain')).toBe('plain');
  });
});

// ---------------------------------------------------------------------------
// parseFragmentSections
// ---------------------------------------------------------------------------

describe('parseFragmentSections', () => {
  it('parses a single section', () => {
    const sections = parseFragmentSections('<!-- section:a -->\nbody\n<!-- /section:a -->');
    expect(sections.get('a')).toBe('body\n');
  });

  it('parses multiple sections', () => {
    const frag = '<!-- section:a -->\nA\n<!-- /section:a -->\n<!-- section:b -->\nB\n<!-- /section:b -->';
    const sections = parseFragmentSections(frag);
    expect([...sections.keys()]).toEqual(['a', 'b']);
    expect(sections.get('b')).toBe('B\n');
  });

  it('returns empty map when no sections', () => {
    expect(parseFragmentSections('no markers here').size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// injectSections
// ---------------------------------------------------------------------------

describe('injectSections', () => {
  const sections = new Map([['explore', 'INJECTED\n']]);

  it('injects into matching namespaced markers', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\n<!-- /plugin:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).toContain('INJECTED');
    expect(out).toContain('<!-- plugin:gitnexus:explore -->');
    expect(out).toContain('<!-- /plugin:gitnexus:explore -->');
  });

  it('uses the namespace argument (feature vs plugin are distinct)', () => {
    const cmd = '<!-- feature:gitnexus:explore -->\n<!-- /feature:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).not.toContain('INJECTED'); // wrong namespace → no injection
  });

  it('replaces previously injected content (idempotent re-enable)', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\nOLD\n<!-- /plugin:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).toContain('INJECTED');
    expect(out).not.toContain('OLD');
  });

  it('escapes dotted names in markers', () => {
    const cmd = '<!-- plugin:add.new:explore -->\n<!-- /plugin:add.new:explore -->';
    const out = injectSections(cmd, 'plugin', 'add.new', sections);
    expect(out).toContain('INJECTED');
  });
});

// ---------------------------------------------------------------------------
// removeSections
// ---------------------------------------------------------------------------

describe('removeSections', () => {
  it('removes injected content but keeps markers', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\nINJECTED\n<!-- /plugin:gitnexus:explore -->';
    const out = removeSections(cmd, 'plugin', 'gitnexus');
    expect(out).not.toContain('INJECTED');
    expect(out).toContain('<!-- plugin:gitnexus:explore -->');
    expect(out).toContain('<!-- /plugin:gitnexus:explore -->');
  });

  it('only removes the matching namespace', () => {
    const cmd = '<!-- feature:tdd:gate -->\nKEEP\n<!-- /feature:tdd:gate -->';
    const out = removeSections(cmd, 'plugin', 'tdd');
    expect(out).toContain('KEEP'); // feature namespace untouched by plugin removal
  });

  it('removes multiple sections of the same plugin', () => {
    const cmd =
      '<!-- plugin:g:a -->\nAA\n<!-- /plugin:g:a -->\n<!-- plugin:g:b -->\nBB\n<!-- /plugin:g:b -->';
    const out = removeSections(cmd, 'plugin', 'g');
    expect(out).not.toContain('AA');
    expect(out).not.toContain('BB');
  });
});

// ---------------------------------------------------------------------------
// manifest / hash IO
// ---------------------------------------------------------------------------

describe('manifest + hash IO', () => {
  let cwd;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-core-'));
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('readManifest returns null when missing', () => {
    expect(readManifest(cwd)).toBeNull();
  });

  it('readManifest returns null on invalid JSON', () => {
    fs.writeFileSync(path.join(cwd, '.codeadd', 'manifest.json'), '{ not json');
    expect(readManifest(cwd)).toBeNull();
  });

  it('saveManifest then readManifest round-trips', () => {
    saveManifest(cwd, { version: '1.0.0', plugins: { x: { enabled: true } } });
    expect(readManifest(cwd)).toEqual({ version: '1.0.0', plugins: { x: { enabled: true } } });
  });

  it('calculateHash returns null for missing file', () => {
    expect(calculateHash(path.join(cwd, 'nope.txt'))).toBeNull();
  });

  it('calculateHash returns a 64-char sha256 hex', () => {
    const f = path.join(cwd, 'a.txt');
    fs.writeFileSync(f, 'content');
    expect(calculateHash(f)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('recalculateHashes records relative paths', () => {
    const f = path.join(cwd, '.claude', 'commands', 'add.new.md');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, 'x');
    const manifest = {};
    recalculateHashes(cwd, manifest, [f]);
    expect(manifest.hashes['.claude/commands/add.new.md']).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// agent injection (per-agent plugin fragments)
// ---------------------------------------------------------------------------

describe('agent injection helpers', () => {
  let cwd;

  /**
   * Scaffold an installed-project tree with agent files + per-agent plugin
   * fragments. Only providers with an agentsSubdir (claude) hold agent files.
   */
  function scaffold({ providers = ['claude'], pluginName = 'gx', agents = {} } = {}) {
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '1.0.0', providers, plugins: {}, hashes: {} }, null, 2),
    );

    // Installed agent files (claude → .claude/agents; codex → none)
    const agentSubdir = { claude: 'agents', cursor: 'agents' }; // cursor has no agentsSubdir in PROVIDERS → never written
    for (const prov of providers) {
      if (prov !== 'claude') continue; // only claude exposes agents
      const dir = path.join(cwd, `.${prov}`, 'agents');
      fs.mkdirSync(dir, { recursive: true });
      for (const [agent, sections] of Object.entries(agents)) {
        const markers = sections
          .map((s) => `<!-- plugin:${pluginName}:${s} -->\n<!-- /plugin:${pluginName}:${s} -->`)
          .join('\n');
        fs.writeFileSync(path.join(dir, `${agent}.md`), `---\nname: ${agent}\n---\n\nbody\n\n${markers}\n`);
      }
    }

    // Per-agent fragment source: .codeadd/plugins/{name}/fragments/agents/{agent}.md
    const fragDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments', 'agents');
    fs.mkdirSync(fragDir, { recursive: true });
    for (const [agent, sections] of Object.entries(agents)) {
      const body = sections
        .map((s) => `<!-- section:${s} -->\n${s.toUpperCase()}-AGENT-CONTENT\n<!-- /section:${s} -->`)
        .join('\n');
      fs.writeFileSync(path.join(fragDir, `${agent}.md`), body + '\n');
    }
  }

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-agent-'));
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('getAgentFragments reads fragments/agents/{agent}.md', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const frags = getAgentFragments(cwd, 'gx');
    expect(frags).toHaveLength(1);
    expect(frags[0].agentName).toBe('discovery-agent');
    expect(frags[0].content).toContain('GRAPH-AGENT-CONTENT');
  });

  it('getAgentFragments returns [] when the agents fragment dir is absent', () => {
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
    expect(getAgentFragments(cwd, 'gx')).toEqual([]);
  });

  it('injects fragments into matching installed agent files', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'], 'backend-agent': ['graph'] } });
    const modified = injectAgentFragments(cwd, 'gx');
    expect(modified).toHaveLength(2);
    for (const agent of ['discovery-agent', 'backend-agent']) {
      const content = fs.readFileSync(path.join(cwd, '.claude', 'agents', `${agent}.md`), 'utf8');
      expect(content).toContain('GRAPH-AGENT-CONTENT');
    }
  });

  it('skips a fragment whose agent file is not installed', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    // Add a fragment with no corresponding installed agent file
    const fragDir = path.join(cwd, '.codeadd', 'plugins', 'gx', 'fragments', 'agents');
    fs.writeFileSync(path.join(fragDir, 'ghost-agent.md'), '<!-- section:graph -->\nX\n<!-- /section:graph -->\n');
    const modified = injectAgentFragments(cwd, 'gx');
    expect(modified).toHaveLength(1); // only discovery-agent
    expect(fs.existsSync(path.join(cwd, '.claude', 'agents', 'ghost-agent.md'))).toBe(false);
  });

  it('does not write agent files for providers without an agentsSubdir', () => {
    // codex has no agentsSubdir → even if a dir existed it must be ignored
    scaffold({ providers: ['claude', 'codex'], agents: { 'discovery-agent': ['graph'] } });
    const stray = path.join(cwd, '.agents', 'agents');
    fs.mkdirSync(stray, { recursive: true });
    fs.writeFileSync(path.join(stray, 'discovery-agent.md'), '<!-- plugin:gx:graph -->\n<!-- /plugin:gx:graph -->\n');
    injectAgentFragments(cwd, 'gx');
    const codexAgent = fs.readFileSync(path.join(stray, 'discovery-agent.md'), 'utf8');
    expect(codexAgent).not.toContain('GRAPH-AGENT-CONTENT');
  });

  it('enable→disable round-trip is byte-identical', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const file = path.join(cwd, '.claude', 'agents', 'discovery-agent.md');
    const before = fs.readFileSync(file, 'utf8');

    injectAgentFragments(cwd, 'gx');
    expect(fs.readFileSync(file, 'utf8')).toContain('GRAPH-AGENT-CONTENT');

    const removed = removeAgentFragments(cwd, 'gx');
    expect(removed).toContain(file);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });

  it('removeAgentFragments keeps the markers', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    injectAgentFragments(cwd, 'gx');
    removeAgentFragments(cwd, 'gx');
    const content = fs.readFileSync(path.join(cwd, '.claude', 'agents', 'discovery-agent.md'), 'utf8');
    expect(content).toContain('<!-- plugin:gx:graph -->');
    expect(content).toContain('<!-- /plugin:gx:graph -->');
  });

  it('injectAgentFragments is a no-op when there are no agent fragments', () => {
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '1.0.0', providers: ['claude'], plugins: {}, hashes: {} }, null, 2),
    );
    expect(injectAgentFragments(cwd, 'gx')).toEqual([]);
  });
});
