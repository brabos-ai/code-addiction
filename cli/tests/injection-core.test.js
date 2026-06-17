import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseFragmentSections,
  loadInjectionPoints,
  findAnchorLine,
  insertBlockAfterAnchor,
  removeBlockAfterAnchor,
  resolveResourceFiles,
  readManifest,
  saveManifest,
  calculateHash,
  recalculateHashes,
  getAgentFragments,
  injectAgentFragments,
  removeAgentFragments,
} from '../src/injection-core.js';

// ---------------------------------------------------------------------------
// parseFragmentSections
// ---------------------------------------------------------------------------

describe('parseFragmentSections', () => {
  it('parses a single section (content ends with newline)', () => {
    expect(parseFragmentSections('<!-- section:a -->\nbody\n<!-- /section:a -->').get('a')).toBe('body\n');
  });

  it('parses multiple sections preserving order', () => {
    const frag = '<!-- section:a -->\nA\n<!-- /section:a -->\n<!-- section:b -->\nB\n<!-- /section:b -->';
    const sections = parseFragmentSections(frag);
    expect([...sections.keys()]).toEqual(['a', 'b']);
  });

  it('returns empty map when no sections', () => {
    expect(parseFragmentSections('no markers here').size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// loadInjectionPoints (sidecar)
// ---------------------------------------------------------------------------

describe('loadInjectionPoints', () => {
  let cwd;
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-side-'));
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  });
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

  it('returns [] when the sidecar is absent (graceful fallback for old installs)', () => {
    expect(loadInjectionPoints(cwd)).toEqual([]);
  });

  it('returns [] on invalid JSON', () => {
    fs.writeFileSync(path.join(cwd, '.codeadd', 'injection-points.json'), '{ not json');
    expect(loadInjectionPoints(cwd)).toEqual([]);
  });

  it('returns the points array', () => {
    const points = [{ namespace: 'feature', name: 'tdd', section: 'gate', resource: { name: 'add.build', kind: 'command' }, anchor: { text: 'x', ordinal: 1, position: 'after', next: null } }];
    fs.writeFileSync(path.join(cwd, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 1, points }));
    expect(loadInjectionPoints(cwd)).toEqual(points);
  });
});

// ---------------------------------------------------------------------------
// findAnchorLine
// ---------------------------------------------------------------------------

describe('findAnchorLine', () => {
  const lines = ['# Title', '```', 'a', '```', 'b', '```', 'tail'];

  it('finds the first occurrence (ordinal 1)', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 1, position: 'after' })).toBe(1);
  });

  it('finds the 3rd occurrence of a non-unique line', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 3, position: 'after' })).toBe(5);
  });

  it('matches on trimmed content (ignores surrounding whitespace)', () => {
    expect(findAnchorLine(['  spaced  ', 'x'], { text: 'spaced', ordinal: 1, position: 'after' })).toBe(0);
  });

  it('returns -1 when the ordinal exceeds occurrences', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 9, position: 'after' })).toBe(-1);
  });

  it('returns -1 when the text is absent', () => {
    expect(findAnchorLine(lines, { text: 'nope', ordinal: 1, position: 'after' })).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// insertBlockAfterAnchor
// ---------------------------------------------------------------------------

describe('insertBlockAfterAnchor', () => {
  const anchor = { text: 'Anchor.', ordinal: 1, position: 'after', next: 'After.' };
  const base = 'Top.\nAnchor.\nAfter.\n';

  it('inserts the block immediately after the anchor line', () => {
    const out = insertBlockAfterAnchor(base, anchor, 'INJECTED\n');
    expect(out).toBe('Top.\nAnchor.\nINJECTED\nAfter.\n');
  });

  it('is idempotent — inserting an already-present block returns content unchanged', () => {
    const once = insertBlockAfterAnchor(base, anchor, 'INJECTED\n');
    const twice = insertBlockAfterAnchor(once, anchor, 'INJECTED\n');
    expect(twice).toBe(once);
  });

  it('returns null when the anchor is not found (fail-loud miss)', () => {
    expect(insertBlockAfterAnchor('No anchor here.\n', anchor, 'X\n')).toBeNull();
  });

  it('returns null when the next-line hint drifted (recorded next line gone entirely)', () => {
    const drifted = 'Top.\nAnchor.\nDIFFERENT.\n';
    expect(insertBlockAfterAnchor(drifted, anchor, 'X\n')).toBeNull();
  });

  it('inserts a second block at a SHARED anchor after a sibling block (no false drift)', () => {
    // Two different features/plugins resolve to the same anchor on the same file
    // and inject in separate calls. The first sits between the anchor and `next`;
    // the second must NOT be mistaken for prose drift and dropped.
    const featA = insertBlockAfterAnchor(base, anchor, 'FEAT_A\n');
    const featB = insertBlockAfterAnchor(featA, anchor, 'FEAT_B\n');
    expect(featB).not.toBeNull();
    expect(featB).toContain('FEAT_A');
    expect(featB).toContain('FEAT_B');
    // Both blocks removable independently → byte-identical restore regardless of order.
    const r1 = removeBlockAfterAnchor(featB, anchor, 'FEAT_B\n');
    const r2 = removeBlockAfterAnchor(r1, anchor, 'FEAT_A\n');
    expect(r2).toBe(base);
  });

  it('inserts a multi-line block and resolves the Nth-occurrence anchor', () => {
    const content = '```\na\n```\nAnchor.\nAfter.\n';
    const a = { text: '```', ordinal: 2, position: 'after', next: 'Anchor.' };
    expect(insertBlockAfterAnchor(content, a, 'L1\nL2\n')).toBe('```\na\n```\nL1\nL2\nAnchor.\nAfter.\n');
  });

  it('skips the drift check when no next hint is recorded (end-of-file marker)', () => {
    const eof = 'Top.\nAnchor.\n';
    const a = { text: 'Anchor.', ordinal: 1, position: 'after', next: null };
    expect(insertBlockAfterAnchor(eof, a, 'X\n')).toBe('Top.\nAnchor.\nX\n');
  });

  it('writes no HTML markers (marker-free injection)', () => {
    expect(insertBlockAfterAnchor(base, anchor, 'INJECTED\n')).not.toContain('<!--');
  });

  it('position "before" inserts above the anchor line', () => {
    const a = { text: 'Below.', ordinal: 1, position: 'before', next: null };
    expect(insertBlockAfterAnchor('Top.\nBelow.\n', a, 'X\n')).toBe('Top.\nX\nBelow.\n');
  });
});

// ---------------------------------------------------------------------------
// removeBlockAfterAnchor (round-trip)
// ---------------------------------------------------------------------------

describe('removeBlockAfterAnchor', () => {
  const anchor = { text: 'Anchor.', ordinal: 1, position: 'after', next: 'After.' };

  it('enable → disable is byte-identical', () => {
    const before = 'Top.\nAnchor.\nAfter.\n';
    const injected = insertBlockAfterAnchor(before, anchor, 'A\nB\n');
    expect(removeBlockAfterAnchor(injected, anchor, 'A\nB\n')).toBe(before);
  });

  it('leaves content unchanged when the block is absent', () => {
    const content = 'Top.\nAnchor.\nAfter.\n';
    expect(removeBlockAfterAnchor(content, anchor, 'NOT THERE\n')).toBe(content);
  });

  it('removes the right block when another block sits between anchor and it (interleaving)', () => {
    // anchor → [otherBlock, ourBlock]; removing ours must leave otherBlock intact
    const content = 'Anchor.\nOTHER\nOURS\nAfter.\n';
    expect(removeBlockAfterAnchor(content, anchor, 'OURS\n')).toBe('Anchor.\nOTHER\nAfter.\n');
  });
});

// ---------------------------------------------------------------------------
// resolveResourceFiles (sidecar resource → per-provider installed paths)
// ---------------------------------------------------------------------------

describe('resolveResourceFiles', () => {
  let cwd;
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-res-'));
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  });
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

  function manifest(providers) {
    fs.writeFileSync(path.join(cwd, '.codeadd', 'manifest.json'), JSON.stringify({ version: '1', providers }));
  }
  function touch(rel) {
    const f = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, 'x');
  }

  it('resolves a command to every installed provider that has a commandsSubdir', () => {
    manifest(['claude', 'cursor', 'codex']); // codex has no commandsSubdir
    touch('.claude/commands/add.new.md');
    touch('.cursor/commands/add.new.md');
    const files = resolveResourceFiles(cwd, { name: 'add.new', kind: 'command' });
    expect(files.sort()).toEqual([
      path.join(cwd, '.claude', 'commands', 'add.new.md'),
      path.join(cwd, '.cursor', 'commands', 'add.new.md'),
    ].sort());
  });

  it('resolves an agent only to providers with an agentsSubdir (claude)', () => {
    manifest(['claude', 'cursor']); // only claude has agentsSubdir
    touch('.claude/agents/backend-agent.md');
    const files = resolveResourceFiles(cwd, { name: 'backend-agent', kind: 'agent' });
    expect(files).toEqual([path.join(cwd, '.claude', 'agents', 'backend-agent.md')]);
  });

  it('omits paths whose file does not exist', () => {
    manifest(['claude']);
    expect(resolveResourceFiles(cwd, { name: 'ghost', kind: 'command' })).toEqual([]);
  });

  it('resolves under the global dest when manifest.scope is global', () => {
    // OpenCode: project dest .opencode, global dest .config/opencode.
    fs.writeFileSync(
      path.join(cwd, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '1', providers: ['opencode'], scope: 'global' }),
    );
    touch('.config/opencode/commands/add.new.md');
    const files = resolveResourceFiles(cwd, { name: 'add.new', kind: 'command' });
    expect(files).toEqual([path.join(cwd, '.config', 'opencode', 'commands', 'add.new.md')]);
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
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

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
// agent injection (sidecar-driven, marker-free)
// ---------------------------------------------------------------------------

describe('agent injection (sidecar-driven)', () => {
  let cwd;

  /**
   * Scaffold installed agent files (marker-free) + a sidecar describing the
   * injection points + per-agent fragments. Mirrors the real install shape.
   */
  function scaffold({ providers = ['claude'], pluginName = 'gx', agents = {} } = {}) {
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '1.0.0', providers, plugins: {}, hashes: {} }, null, 2),
    );

    const points = [];
    for (const prov of providers) {
      if (prov !== 'claude') continue; // only claude exposes agents
      const dir = path.join(cwd, `.${prov}`, 'agents');
      fs.mkdirSync(dir, { recursive: true });
      for (const [agent] of Object.entries(agents)) {
        // marker-free body with a stable anchor line
        fs.writeFileSync(path.join(dir, `${agent}.md`), `---\nname: ${agent}\n---\n\n${agent} body anchor.\n`);
      }
    }

    const fragDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments', 'agents');
    fs.mkdirSync(fragDir, { recursive: true });
    for (const [agent, sections] of Object.entries(agents)) {
      const body = sections
        .map((s) => `<!-- section:${s} -->\n${s.toUpperCase()}-AGENT-CONTENT\n<!-- /section:${s} -->`)
        .join('\n');
      fs.writeFileSync(path.join(fragDir, `${agent}.md`), body + '\n');
      for (const s of sections) {
        points.push({
          namespace: 'plugin', name: pluginName, section: s,
          resource: { name: agent, kind: 'agent' },
          anchor: { text: `${agent} body anchor.`, ordinal: 1, position: 'after', next: null },
        });
      }
    }
    fs.writeFileSync(path.join(cwd, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 1, points }, null, 2));
  }

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-agent-'));
  });
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

  it('getAgentFragments reads fragments/agents/{agent}.md', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const frags = getAgentFragments(cwd, 'gx');
    expect(frags).toHaveLength(1);
    expect(frags[0].agentName).toBe('discovery-agent');
    expect(frags[0].content).toContain('GRAPH-AGENT-CONTENT');
  });

  it('injects fragment content at the sidecar anchor (marker-free)', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'], 'backend-agent': ['graph'] } });
    const modified = injectAgentFragments(cwd, 'gx');
    expect(modified).toHaveLength(2);
    for (const agent of ['discovery-agent', 'backend-agent']) {
      const content = fs.readFileSync(path.join(cwd, '.claude', 'agents', `${agent}.md`), 'utf8');
      expect(content).toContain('GRAPH-AGENT-CONTENT');
      expect(content).not.toContain('<!--'); // no markers written
    }
  });

  it('skips a fragment whose agent has no sidecar point / no installed file', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const fragDir = path.join(cwd, '.codeadd', 'plugins', 'gx', 'fragments', 'agents');
    fs.writeFileSync(path.join(fragDir, 'ghost-agent.md'), '<!-- section:graph -->\nX\n<!-- /section:graph -->\n');
    const modified = injectAgentFragments(cwd, 'gx');
    expect(modified).toHaveLength(1);
    expect(fs.existsSync(path.join(cwd, '.claude', 'agents', 'ghost-agent.md'))).toBe(false);
  });

  it('does not write agent files for providers without an agentsSubdir', () => {
    scaffold({ providers: ['claude', 'codex'], agents: { 'discovery-agent': ['graph'] } });
    const stray = path.join(cwd, '.agents', 'agents');
    fs.mkdirSync(stray, { recursive: true });
    fs.writeFileSync(path.join(stray, 'discovery-agent.md'), 'discovery-agent body anchor.\n');
    injectAgentFragments(cwd, 'gx');
    expect(fs.readFileSync(path.join(stray, 'discovery-agent.md'), 'utf8')).not.toContain('GRAPH-AGENT-CONTENT');
  });

  it('enable → disable round-trip is byte-identical', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const file = path.join(cwd, '.claude', 'agents', 'discovery-agent.md');
    const before = fs.readFileSync(file, 'utf8');

    injectAgentFragments(cwd, 'gx');
    expect(fs.readFileSync(file, 'utf8')).toContain('GRAPH-AGENT-CONTENT');

    const removed = removeAgentFragments(cwd, 'gx');
    expect(removed).toContain(file);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });

  it('re-injecting is idempotent (no drift)', () => {
    scaffold({ agents: { 'discovery-agent': ['graph'] } });
    const file = path.join(cwd, '.claude', 'agents', 'discovery-agent.md');
    injectAgentFragments(cwd, 'gx');
    const once = fs.readFileSync(file, 'utf8');
    injectAgentFragments(cwd, 'gx');
    expect(fs.readFileSync(file, 'utf8')).toBe(once);
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
