import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { FEATURES, enableFeature, disableFeature } from '../src/features.js';
import { enablePlugin, disablePlugin } from '../src/plugins.js';
import { parseFragmentSections } from '../src/injection-core.js';
import { PROVIDERS } from '../src/providers.js';

/**
 * Exhaustive substitution matrix: every sidecar point, every fragment section,
 * every catalog inject/agent/skill, every provider dest. Enable = the FULL
 * fragment block lands exactly once; disable = byte-identical + block absent.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const SIDECAR = path.join(CODEADD, 'injection-points.json');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'src', 'plugins.json'), 'utf8'));
const FEATURE_NAMES = Object.keys(FEATURES);
const PLUGIN_NAMES = Object.keys(CATALOG).filter((k) => k !== '$schema-doc');
const STALE = {
  stepList: '(TDD feature)',
  dispatch: '**DISPATCH AGENT:**',
  capability: '**Capability:** read-write',
};

const CMD_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);
const SKILL_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.skillsSubdir).map(([k]) => k);
// Agent INJECTION is gated on agentInjection, not on agentsSubdir: four
// providers now receive agent files, but only Claude receives plugin agent
// fragments (Codex agents are TOML, which the markdown-anchored engine cannot
// address at all). See the agentInjection note in cli/src/providers.js.
const AGENT_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.agentInjection && p.agentsSubdir).map(([k]) => k);

let tmp;

function lf(s) {
  return s.replace(/\r\n/g, '\n');
}

function snapshot(file) {
  return fs.readFileSync(file, 'utf8');
}

function count(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n += 1;
    i += needle.length;
  }
  return n;
}

/** Exact bytes insertBlockAfterAnchor writes (trailing empty line dropped). */
function insertedBlock(body) {
  const lines = lf(body).split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

function sidecarPoints() {
  return JSON.parse(fs.readFileSync(SIDECAR, 'utf8')).points;
}

function listFragmentFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

function loadSections(filePath) {
  return parseFragmentSections(fs.readFileSync(filePath, 'utf8'));
}

function destOf(providerKey) {
  return PROVIDERS[providerKey].dest;
}

function commandPath(cwd, providerKey, name) {
  const p = PROVIDERS[providerKey];
  return path.join(cwd, p.dest, p.commandsSubdir, `${name}.md`);
}

function agentPath(cwd, providerKey, name) {
  const p = PROVIDERS[providerKey];
  return path.join(cwd, p.dest, p.agentsSubdir, `${name}.md`);
}

function skillPath(cwd, providerKey, skill) {
  const p = PROVIDERS[providerKey];
  return path.join(cwd, p.dest, p.skillsSubdir, skill, 'SKILL.md');
}

function builtCommand(providerKey, name) {
  return path.join(ROOT, 'framwork', destOf(providerKey), PROVIDERS[providerKey].commandsSubdir, `${name}.md`);
}

function builtAgent(providerKey, name) {
  return path.join(ROOT, 'framwork', destOf(providerKey), PROVIDERS[providerKey].agentsSubdir, `${name}.md`);
}

function loadFeatureMatrix() {
  const matrix = [];
  for (const feature of FEATURE_NAMES) {
    const dir = path.join(CODEADD, 'fragments', feature);
    for (const file of listFragmentFiles(dir)) {
      const command = file.replace(/\.md$/, '');
      const sections = loadSections(path.join(dir, file));
      expect(sections.size, `${feature}/${file} parsed 0 sections`).toBeGreaterThan(0);
      for (const [section, body] of sections) {
        const block = insertedBlock(body);
        expect(block.length, `${feature}/${command}:${section} empty block`).toBeGreaterThan(0);
        matrix.push({
          kind: 'command',
          namespace: 'feature',
          name: feature,
          resource: command,
          section,
          block,
        });
      }
    }
  }
  return matrix;
}

function loadPluginMatrix() {
  const matrix = [];
  for (const plugin of PLUGIN_NAMES) {
    const cmdDir = path.join(CODEADD, 'plugins', plugin, 'fragments');
    for (const file of listFragmentFiles(cmdDir)) {
      const command = file.replace(/\.md$/, '');
      const sections = loadSections(path.join(cmdDir, file));
      expect(sections.size, `${plugin}/${file} parsed 0 sections`).toBeGreaterThan(0);
      for (const [section, body] of sections) {
        const block = insertedBlock(body);
        expect(block.length, `${plugin}/${command}:${section} empty block`).toBeGreaterThan(0);
        matrix.push({
          kind: 'command',
          namespace: 'plugin',
          name: plugin,
          resource: command,
          section,
          block,
        });
      }
    }
    const agentDir = path.join(CODEADD, 'plugins', plugin, 'fragments', 'agents');
    for (const file of listFragmentFiles(agentDir)) {
      const agent = file.replace(/\.md$/, '');
      const sections = loadSections(path.join(agentDir, file));
      expect(sections.size, `${plugin}/agents/${file} parsed 0 sections`).toBeGreaterThan(0);
      for (const [section, body] of sections) {
        const block = insertedBlock(body);
        expect(block.length, `${plugin}/${agent}:${section} empty block`).toBeGreaterThan(0);
        matrix.push({
          kind: 'agent',
          namespace: 'plugin',
          name: plugin,
          resource: agent,
          section,
          block,
        });
      }
    }
  }
  return matrix;
}

function targetFiles(cwd, entry) {
  if (entry.kind === 'agent') {
    return AGENT_PROVIDERS.map((k) => agentPath(cwd, k, entry.resource)).filter(fs.existsSync);
  }
  return CMD_PROVIDERS.map((k) => commandPath(cwd, k, entry.resource)).filter(fs.existsSync);
}

function assertBlockOnce(cwd, entries, label) {
  for (const entry of entries) {
    const files = targetFiles(cwd, entry);
    expect(files.length, `${label} ${entry.name}:${entry.resource}:${entry.section} has no targets`).toBeGreaterThan(0);
    for (const file of files) {
      const n = count(lf(snapshot(file)), entry.block);
      expect(n, `${label} ${path.relative(cwd, file)} ${entry.name}:${entry.section} block-count=${n}`).toBe(1);
    }
  }
}

function assertBlockAbsent(cwd, entries, label) {
  for (const entry of entries) {
    for (const file of targetFiles(cwd, entry)) {
      expect(lf(snapshot(file)), `${label} ${path.relative(cwd, file)} still has ${entry.name}:${entry.section}`).not.toContain(entry.block);
    }
  }
}

function assertNoStale(cwd, files, label) {
  for (const file of files) {
    const text = snapshot(file);
    expect(text, `${label} ${path.relative(cwd, file)} stale step-list`).not.toContain(STALE.stepList);
    expect(text, `${label} ${path.relative(cwd, file)} stale DISPATCH AGENT`).not.toContain(STALE.dispatch);
    expect(text, `${label} ${path.relative(cwd, file)} stale Capability`).not.toContain(STALE.capability);
  }
}

function assertSkills(cwd, plugin, present) {
  for (const skill of CATALOG[plugin].skills ?? []) {
    const src = fs.readFileSync(path.join(CODEADD, 'plugins', plugin, 'skills', skill, 'SKILL.md'), 'utf8');
    for (const key of SKILL_PROVIDERS) {
      const dest = skillPath(cwd, key, skill);
      if (present) {
        expect(fs.existsSync(dest), `${plugin} skill ${skill} missing in ${key}`).toBe(true);
        expect(snapshot(dest), `${plugin} skill ${skill} drift in ${key}`).toBe(src);
      } else {
        expect(fs.existsSync(path.dirname(dest)), `${plugin} skill ${skill} leftover in ${key}`).toBe(false);
      }
    }
  }
}

function snapshotTree(files) {
  return Object.fromEntries(files.map((f) => [f, snapshot(f)]));
}

function forceDetectableCatalog() {
  const catalog = {};
  for (const name of PLUGIN_NAMES) catalog[name] = { ...CATALOG[name], detect: 'node -e "process.exit(0)"' };
  const p = path.join(tmp, 'catalog.json');
  fs.writeFileSync(p, JSON.stringify(catalog, null, 2));
  process.env.CODEADD_PLUGINS_CATALOG = p;
}

function planFiles(cwd) {
  return CMD_PROVIDERS.map((k) => commandPath(cwd, k, 'add.plan')).filter(fs.existsSync);
}

function pointKey(p) {
  return `${p.namespace}:${p.name}:${p.section}:${p.resource.kind}:${p.resource.name}`;
}

beforeEach(() => {
  warnSpy.mockClear();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-ex-'));
  for (const [, meta] of Object.entries(PROVIDERS)) {
    const src = path.join(ROOT, meta.src);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(tmp, meta.dest), { recursive: true });
  }
  fs.cpSync(CODEADD, path.join(tmp, '.codeadd'), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '0.0.0', providers: Object.keys(PROVIDERS), features: {}, plugins: {}, hashes: {} }, null, 2),
  );
  forceDetectableCatalog();
});

afterEach(() => {
  delete process.env.CODEADD_PLUGINS_CATALOG;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('substitution completeness (catalog × fragments × sidecar × built anchors)', () => {
  it('sidecar, fragments, and catalog declare the same 39 substitutions', () => {
    const points = sidecarPoints();
    const features = loadFeatureMatrix();
    const plugins = loadPluginMatrix();
    const all = [...features, ...plugins];
    expect(points).toHaveLength(39);
    expect(all).toHaveLength(39);

    const pointKeys = new Set(points.map(pointKey));
    const fragKeys = new Set(all.map((e) => `${e.namespace}:${e.name}:${e.section}:${e.kind}:${e.resource}`));
    expect([...pointKeys].sort()).toEqual([...fragKeys].sort());
  });

  it('FEATURES registry commands match fragment files 1:1', () => {
    for (const [name, meta] of Object.entries(FEATURES)) {
      const files = listFragmentFiles(path.join(CODEADD, 'fragments', name)).map((f) => f.replace(/\.md$/, '')).sort();
      expect(files, name).toEqual([...meta.commands].sort());
    }
  });

  it('plugin catalog injects/agents/skills match fragment and skill trees 1:1', () => {
    for (const plugin of PLUGIN_NAMES) {
      const entry = CATALOG[plugin];
      const cmds = listFragmentFiles(path.join(CODEADD, 'plugins', plugin, 'fragments')).map((f) => f.replace(/\.md$/, '')).sort();
      expect(cmds, `${plugin} injects`).toEqual([...entry.injects].sort());

      const agents = listFragmentFiles(path.join(CODEADD, 'plugins', plugin, 'fragments', 'agents')).map((f) => f.replace(/\.md$/, '')).sort();
      const catalogAgents = (entry.agents ?? []).map((a) => a.agent).sort();
      expect(agents, `${plugin} agents`).toEqual(catalogAgents);

      for (const a of entry.agents ?? []) {
        const sections = [...loadSections(path.join(CODEADD, 'plugins', plugin, 'fragments', 'agents', `${a.agent}.md`)).keys()].sort();
        expect(sections, `${plugin}/${a.agent} sections`).toEqual([...a.sections].sort());
      }

      const skillDirs = fs.existsSync(path.join(CODEADD, 'plugins', plugin, 'skills'))
        ? fs.readdirSync(path.join(CODEADD, 'plugins', plugin, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
        : [];
      expect(skillDirs, `${plugin} skills`).toEqual([...(entry.skills ?? [])].sort());
    }
  });

  it('every sidecar anchor text exists in the matching built provider file', () => {
    for (const p of sidecarPoints()) {
      const files = p.resource.kind === 'agent'
        ? AGENT_PROVIDERS.map((k) => builtAgent(k, p.resource.name))
        : CMD_PROVIDERS.map((k) => builtCommand(k, p.resource.name));
      for (const file of files) {
        expect(fs.existsSync(file), `missing built ${file}`).toBe(true);
        const n = count(lf(snapshot(file)), p.anchor.text);
        expect(n, `${path.relative(ROOT, file)} missing anchor for ${pointKey(p)}`).toBeGreaterThanOrEqual(p.anchor.ordinal);
      }
    }
  });
});

describe('feature substitution on real built files', () => {
  for (const feature of FEATURE_NAMES) {
    it(`${feature}: full block exactly-once, disable byte-identical, re-enable idempotent`, () => {
      const matrix = loadFeatureMatrix().filter((e) => e.name === feature);
      expect(matrix.length).toBeGreaterThan(0);
      const files = [...new Set(matrix.flatMap((e) => targetFiles(tmp, e)))];
      const baseline = snapshotTree(files);

      const { modified } = enableFeature(tmp, feature);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(modified).toBeGreaterThan(0);
      assertBlockOnce(tmp, matrix, `${feature} enable`);
      assertNoStale(tmp, planFiles(tmp), `${feature} enable`);
      const enabled = snapshotTree(files);

      disableFeature(tmp, feature);
      for (const f of files) expect(snapshot(f)).toBe(baseline[f]);
      assertBlockAbsent(tmp, matrix, `${feature} disable`);
      assertNoStale(tmp, planFiles(tmp), `${feature} disable`);

      enableFeature(tmp, feature);
      for (const f of files) expect(snapshot(f)).toBe(enabled[f]);
    });
  }
});

describe('plugin substitution on real built files', () => {
  for (const plugin of PLUGIN_NAMES) {
    it(`${plugin}: full block exactly-once, skills byte-identical, disable restores`, () => {
      const matrix = loadPluginMatrix().filter((e) => e.name === plugin);
      expect(matrix.length).toBeGreaterThan(0);
      const files = [...new Set(matrix.flatMap((e) => targetFiles(tmp, e)))];
      const baseline = snapshotTree(files);

      const result = enablePlugin(tmp, plugin);
      expect(result.ok).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(result.modified + result.agents).toBeGreaterThan(0);
      assertBlockOnce(tmp, matrix, `${plugin} enable`);
      assertSkills(tmp, plugin, true);

      disablePlugin(tmp, plugin);
      for (const f of files) expect(snapshot(f)).toBe(baseline[f]);
      assertBlockAbsent(tmp, matrix, `${plugin} disable`);
      assertSkills(tmp, plugin, false);
    });
  }
});

describe('combined substitution and sibling isolation', () => {
  it('all 38 full blocks land exactly once when every feature and plugin is enabled', () => {
    const features = loadFeatureMatrix();
    const plugins = loadPluginMatrix();
    expect(features.length + plugins.length).toBe(39);

    for (const f of FEATURE_NAMES) enableFeature(tmp, f);
    for (const p of PLUGIN_NAMES) expect(enablePlugin(tmp, p).ok).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
    assertBlockOnce(tmp, [...features, ...plugins], 'all-on');
    assertNoStale(tmp, planFiles(tmp), 'all-on');
    for (const p of PLUGIN_NAMES) assertSkills(tmp, p, true);
  });

  it('disabling one namespace removes only its full blocks', () => {
    const features = loadFeatureMatrix();
    const plugins = loadPluginMatrix();
    for (const f of FEATURE_NAMES) enableFeature(tmp, f);
    for (const p of PLUGIN_NAMES) enablePlugin(tmp, p);

    disableFeature(tmp, 'tdd');
    assertBlockAbsent(tmp, features.filter((e) => e.name === 'tdd'), 'tdd off');
    assertBlockOnce(tmp, [...features.filter((e) => e.name !== 'tdd'), ...plugins], 'siblings after tdd off');
  });

  it('reversed enable order still lands every full block exactly once', () => {
    const all = [...loadFeatureMatrix(), ...loadPluginMatrix()];
    for (const p of [...PLUGIN_NAMES].reverse()) enablePlugin(tmp, p);
    for (const f of [...FEATURE_NAMES].reverse()) enableFeature(tmp, f);
    expect(warnSpy).not.toHaveBeenCalled();
    assertBlockOnce(tmp, all, 'reversed enable');
  });
});
