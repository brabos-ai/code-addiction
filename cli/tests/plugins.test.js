import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadCatalog,
  validate,
  enablePlugin,
  disablePlugin,
  applyEnabledPlugins,
  applyEnabledPluginsDetailed,
  removePluginSkillsFor,
  getPluginStates,
} from '../src/plugins.js';
import { resolveSelected } from '../src/providers.js';
import { captureBaselines } from '../src/injection-core.js';

/**
 * Point CODEADD_PLUGINS_CATALOG at a temp catalog file so the plugin module
 * reads a controlled catalog instead of the baked-in one.
 */
function writeCatalog(dir, catalog) {
  const p = path.join(dir, 'plugins.json');
  fs.writeFileSync(p, JSON.stringify(catalog, null, 2));
  process.env.CODEADD_PLUGINS_CATALOG = p;
  return p;
}

const cmdAnchor = (cmd, s) => `<<${cmd}:${s}>>`;
const agentAnchor = (agent, s) => `<<${agent}:${s}>>`;

/**
 * Scaffold an installed-project tree: manifest + marker-free provider command
 * files + a build-emitted sidecar (injection-points.json) + plugin asset tree
 * (fragments + skills + per-agent fragments).
 */
function scaffoldProject(cwd, { providers, pluginName, sectionsByCommand, skills, agentsByName }) {
  fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '1.0.0', providers, plugins: {}, hashes: {} }, null, 2),
  );

  const points = [];

  // Marker-free provider command files (claude/cursor use commands/).
  const subdir = { claude: 'commands', cursor: 'commands' };
  for (const cmd of Object.keys(sectionsByCommand)) {
    const anchors = sectionsByCommand[cmd].map((s) => `${cmdAnchor(cmd, s)}\n`).join('\n');
    for (const prov of providers) {
      if (!subdir[prov]) continue;
      const dir = path.join(cwd, `.${prov}`, subdir[prov]);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${cmd}.md`), `# ${cmd}\n\n${anchors}\n## End\n`);
    }
    for (const s of sectionsByCommand[cmd]) {
      points.push({
        namespace: 'plugin', name: pluginName, section: s,
        resource: { name: cmd, kind: 'command' },
        anchor: { text: cmdAnchor(cmd, s), ordinal: 1, position: 'after', next: null },
      });
    }
  }

  // Plugin command fragments: .codeadd/plugins/{name}/fragments/{cmd}.md
  const fragDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments');
  fs.mkdirSync(fragDir, { recursive: true });
  for (const cmd of Object.keys(sectionsByCommand)) {
    const body = sectionsByCommand[cmd]
      .map((s) => `<!-- section:${s} -->\n${s.toUpperCase()}-CONTENT\n<!-- /section:${s} -->`)
      .join('\n');
    fs.writeFileSync(path.join(fragDir, `${cmd}.md`), body + '\n');
  }

  // Plugin skill source: .codeadd/plugins/{name}/skills/{skill}/SKILL.md
  for (const skill of skills ?? []) {
    const skillDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'skills', skill);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: ${skill}\ndescription: d\n---\nbody\n`);
  }

  // Marker-free agent files (only claude exposes agents) + per-agent fragments.
  if (agentsByName) {
    const aFragDir = path.join(cwd, '.codeadd', 'plugins', pluginName, 'fragments', 'agents');
    fs.mkdirSync(aFragDir, { recursive: true });
    for (const [agent, sects] of Object.entries(agentsByName)) {
      const anchors = sects.map((s) => `${agentAnchor(agent, s)}\n`).join('\n');
      if (providers.includes('claude')) {
        const dir = path.join(cwd, '.claude', 'agents');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${agent}.md`), `---\nname: ${agent}\n---\n\nbody\n\n${anchors}`);
      }
      const body = sects
        .map((s) => `<!-- section:${s} -->\n${s.toUpperCase()}-AGENT-CONTENT\n<!-- /section:${s} -->`)
        .join('\n');
      fs.writeFileSync(path.join(aFragDir, `${agent}.md`), body + '\n');
      for (const s of sects) {
        points.push({
          namespace: 'plugin', name: pluginName, section: s,
          resource: { name: agent, kind: 'agent' },
          anchor: { text: agentAnchor(agent, s), ordinal: 1, position: 'after', next: null },
        });
      }
    }
  }

  const slots = points.map((p) => ({
    id: `${p.name}.${p.section}`,
    fallback: '',
    members: [{ namespace: p.namespace, name: p.name, section: p.section }],
    resource: p.resource,
    anchor: p.anchor,
  }));
  fs.writeFileSync(path.join(cwd, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 2, slots, points }, null, 2));
  captureBaselines(cwd);
  for (const dest of ['.claude', '.cursor', '.opencode']) {
    const cmdDir = path.join(cwd, dest, 'commands');
    if (!fs.existsSync(cmdDir)) continue;
    for (const name of fs.readdirSync(cmdDir)) {
      const base = path.join(cwd, '.codeadd', 'baselines', dest.slice(1), 'commands', name);
      fs.mkdirSync(path.dirname(base), { recursive: true });
      fs.copyFileSync(path.join(cmdDir, name), base);
    }
    const agentDir = path.join(cwd, dest, 'agents');
    if (!fs.existsSync(agentDir)) continue;
    for (const name of fs.readdirSync(agentDir)) {
      const base = path.join(cwd, '.codeadd', 'baselines', dest.slice(1), 'agents', name);
      fs.mkdirSync(path.dirname(base), { recursive: true });
      fs.copyFileSync(path.join(agentDir, name), base);
    }
  }
}

describe('plugins', () => {
  let cwd;
  let catDir;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'plug-cwd-'));
    catDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plug-cat-'));
  });

  afterEach(() => {
    delete process.env.CODEADD_PLUGINS_CATALOG;
    fs.rmSync(cwd, { recursive: true, force: true });
    fs.rmSync(catDir, { recursive: true, force: true });
  });

  describe('loadCatalog', () => {
    it('reads from CODEADD_PLUGINS_CATALOG and filters $schema-doc', () => {
      writeCatalog(catDir, {
        '$schema-doc': { description: 'doc' },
        demo: { type: 'mcp', description: 'demo', detect: 'node -e "process.exit(0)"' },
      });
      const catalog = loadCatalog();
      expect(catalog).toHaveProperty('demo');
      expect(catalog).not.toHaveProperty('$schema-doc');
    });

    it('returns {} when catalog file is missing', () => {
      process.env.CODEADD_PLUGINS_CATALOG = path.join(catDir, 'nope.json');
      expect(loadCatalog()).toEqual({});
    });
  });

  describe('validate', () => {
    it('returns true when the detect probe exits 0', () => {
      expect(validate({ detect: 'node -e "process.exit(0)"' })).toBe(true);
    });

    it('returns false when the detect probe exits non-zero', () => {
      expect(validate({ detect: 'false' })).toBe(false);
    });

    it('returns false when the detect command is missing', () => {
      expect(validate({ detect: 'this-binary-does-not-exist-xyz --version' })).toBe(false);
    });

    it('returns false when no detect field', () => {
      expect(validate({})).toBe(false);
    });
  });

  describe('enablePlugin', () => {
    it('hard-gates on a failing detect — no injection, not enabled', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'false', injects: ['add-new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: ['gx-skill'],
      });

      const result = enablePlugin(cwd, 'gx');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('not-detected');

      const cmd = fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add-new.md'), 'utf8');
      expect(cmd).not.toContain('EXPLORE-CONTENT');
      expect(fs.existsSync(path.join(cwd, '.claude', 'skills', 'gx-skill'))).toBe(false);
    });

    it('returns unknown reason for a plugin not in the catalog', () => {
      writeCatalog(catDir, {});
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: {}, skills: [] });
      expect(enablePlugin(cwd, 'gx')).toMatchObject({ ok: false, reason: 'unknown' });
    });

    it('injects fragments across providers (marker-free) and activates skills', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude', 'cursor'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: ['gx-skill'],
      });

      const result = enablePlugin(cwd, 'gx');
      expect(result.ok).toBe(true);
      expect(result.modified).toBe(2); // claude + cursor
      expect(result.skills).toBe(2); // gx-skill × 2 providers

      for (const prov of ['claude', 'cursor']) {
        const cmd = fs.readFileSync(path.join(cwd, `.${prov}`, 'commands', 'add-new.md'), 'utf8');
        expect(cmd).toContain('EXPLORE-CONTENT');
        expect(cmd).not.toContain('<!--'); // no markers written
        expect(fs.existsSync(path.join(cwd, `.${prov}`, 'skills', 'gx-skill', 'SKILL.md'))).toBe(true);
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: true });
    });

    it('records hashes for modified command files', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: [] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: [],
      });
      enablePlugin(cwd, 'gx');
      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.hashes['.claude/commands/add-new.md']).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('disablePlugin', () => {
    it('removes injections and skills, restores the file, flips manifest', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude', 'cursor'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: ['gx-skill'],
      });
      const before = {
        claude: fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add-new.md'), 'utf8'),
        cursor: fs.readFileSync(path.join(cwd, '.cursor', 'commands', 'add-new.md'), 'utf8'),
      };
      enablePlugin(cwd, 'gx');

      const result = disablePlugin(cwd, 'gx');
      expect(result.modified).toBe(2);
      expect(result.skills).toBe(2);

      for (const prov of ['claude', 'cursor']) {
        const cmd = fs.readFileSync(path.join(cwd, `.${prov}`, 'commands', 'add-new.md'), 'utf8');
        expect(cmd).not.toContain('EXPLORE-CONTENT');
        expect(cmd).toBe(before[prov]); // byte-identical restore
        expect(fs.existsSync(path.join(cwd, `.${prov}`, 'skills', 'gx-skill'))).toBe(false);
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: false });
    });
  });

  describe('agent injection', () => {
    it('enablePlugin injects agents alongside commands and reports a count', () => {
      writeCatalog(catDir, {
        gx: {
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: [],
        agentsByName: { 'discovery-agent': ['graph'] },
      });

      const result = enablePlugin(cwd, 'gx');
      expect(result.ok).toBe(true);
      expect(result.agents).toBe(1);

      const agent = fs.readFileSync(path.join(cwd, '.claude', 'agents', 'discovery-agent.md'), 'utf8');
      expect(agent).toContain('GRAPH-AGENT-CONTENT');
      expect(agent).not.toContain('<!--');

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.hashes['.claude/agents/discovery-agent.md']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('disablePlugin removes agent injection — byte-identical round-trip', () => {
      writeCatalog(catDir, {
        gx: {
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: [],
        agentsByName: { 'discovery-agent': ['graph'] },
      });
      const file = path.join(cwd, '.claude', 'agents', 'discovery-agent.md');
      const before = fs.readFileSync(file, 'utf8');

      enablePlugin(cwd, 'gx');
      const result = disablePlugin(cwd, 'gx');
      expect(result.agents).toBe(1);
      expect(fs.readFileSync(file, 'utf8')).toBe(before);
    });

    it('re-enable is idempotent (no drift)', () => {
      writeCatalog(catDir, {
        gx: {
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: [], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: {},
        skills: [],
        agentsByName: { 'discovery-agent': ['graph'] },
      });
      const file = path.join(cwd, '.claude', 'agents', 'discovery-agent.md');
      enablePlugin(cwd, 'gx');
      const once = fs.readFileSync(file, 'utf8');
      enablePlugin(cwd, 'gx');
      expect(fs.readFileSync(file, 'utf8')).toBe(once);
    });

    it('applyEnabledPlugins re-applies agent injection', () => {
      writeCatalog(catDir, {
        gx: {
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: [], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: {},
        skills: [],
        agentsByName: { 'discovery-agent': ['graph'] },
      });
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gx: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));

      applyEnabledPlugins(cwd);
      const agent = fs.readFileSync(path.join(cwd, '.claude', 'agents', 'discovery-agent.md'), 'utf8');
      expect(agent).toContain('GRAPH-AGENT-CONTENT');
    });
  });

  describe('applyEnabledPlugins', () => {
    it('re-applies only enabled plugins from the manifest', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: [] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add-new': ['explore'] },
        skills: [],
      });
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gx: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));

      const total = applyEnabledPlugins(cwd);
      expect(total).toBe(1);
      const cmd = fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add-new.md'), 'utf8');
      expect(cmd).toContain('EXPLORE-CONTENT');
    });

    it('returns 0 when no manifest', () => {
      writeCatalog(catDir, {});
      expect(applyEnabledPlugins(path.join(cwd, 'empty'))).toBe(0);
    });
  });

  describe('applyEnabledPluginsDetailed (L1.4)', () => {
    const enableInManifest = (name) => {
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { [name]: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));
    };

    it('lists an enabled plugin whose detect probe fails in notDetected, and keeps it enabled', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'false', injects: ['add-new'], skills: [] },
      });
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: { 'add-new': ['explore'] }, skills: [] });
      enableInManifest('gx');

      const result = applyEnabledPluginsDetailed(cwd);

      expect(result.notDetected).toEqual(['gx']);
      expect(result.modified).toBe(0);
      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: true });
    });

    it('reports a detected plugin as applied, with nothing in notDetected', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add-new'], skills: [] },
      });
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: { 'add-new': ['explore'] }, skills: [] });
      enableInManifest('gx');

      expect(applyEnabledPluginsDetailed(cwd)).toEqual({ modified: 1, notDetected: [] });
    });

    it('returns an empty result when there is no manifest', () => {
      writeCatalog(catDir, {});
      expect(applyEnabledPluginsDetailed(path.join(cwd, 'empty'))).toEqual({ modified: 0, notDetected: [] });
    });

    it('applyEnabledPlugins still returns a number', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'false', injects: [], skills: [] },
      });
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: {}, skills: [] });
      enableInManifest('gx');

      expect(typeof applyEnabledPlugins(cwd)).toBe('number');
    });
  });

  describe('removePluginSkillsFor (L1.3)', () => {
    const setup = (providers) => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: [], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, { providers, pluginName: 'gx', sectionsByCommand: {}, skills: ['gx-skill'] });
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gx: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));
      for (const p of resolveSelected(providers)) {
        const dir = path.join(cwd, p.dest, p.skillsSubdir, 'gx-skill');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'SKILL.md'), 'skill');
      }
    };
    const skillAt = (rel) => fs.existsSync(path.join(cwd, rel, 'gx-skill', 'SKILL.md'));

    it('removing codex with zcode remaining keeps the shared .agents/skills copy', () => {
      setup(['claude', 'codex', 'zcode']);

      removePluginSkillsFor(cwd, resolveSelected(['codex']), resolveSelected(['claude', 'zcode']));

      expect(skillAt('.agents/skills')).toBe(true);
      expect(skillAt('.claude/skills')).toBe(true);
    });

    it('removing zcode with codex remaining keeps the shared .agents/skills copy', () => {
      setup(['claude', 'codex', 'zcode']);

      removePluginSkillsFor(cwd, resolveSelected(['zcode']), resolveSelected(['claude', 'codex']));

      expect(skillAt('.agents/skills')).toBe(true);
    });

    it('removing cursor deletes only its own skills copy', () => {
      setup(['claude', 'cursor']);

      const removed = removePluginSkillsFor(cwd, resolveSelected(['cursor']), resolveSelected(['claude']));

      expect(removed).toBe(1);
      expect(skillAt('.cursor/skills')).toBe(false);
      expect(skillAt('.claude/skills')).toBe(true);
    });

    it('removing the only owner of .agents/skills deletes it', () => {
      setup(['claude', 'codex']);

      removePluginSkillsFor(cwd, resolveSelected(['codex']), resolveSelected(['claude']));

      expect(skillAt('.agents/skills')).toBe(false);
    });

    it('removes the legacy add-gitnexus skill from the removed provider only', () => {
      setup(['claude', 'cursor']);
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gitnexus: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));
      for (const root of ['.cursor/skills', '.claude/skills']) {
        const legacy = path.join(cwd, root, 'add-gitnexus');
        fs.mkdirSync(legacy, { recursive: true });
        fs.writeFileSync(path.join(legacy, 'SKILL.md'), 'old');
      }

      removePluginSkillsFor(cwd, resolveSelected(['cursor']), resolveSelected(['claude']));

      expect(fs.existsSync(path.join(cwd, '.cursor/skills/add-gitnexus'))).toBe(false);
      expect(fs.existsSync(path.join(cwd, '.claude/skills/add-gitnexus/SKILL.md'))).toBe(true);
    });

    it('touches nothing for a plugin that is not enabled', () => {
      setup(['claude', 'cursor']);
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gx: { enabled: false } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));

      expect(removePluginSkillsFor(cwd, resolveSelected(['cursor']), resolveSelected(['claude']))).toBe(0);
      expect(skillAt('.cursor/skills')).toBe(true);
    });
  });

  describe('getPluginStates', () => {
    it('lists catalog plugins with enabled defaulting to false', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'graph nav', detect: 'node -e "process.exit(0)"' },
      });
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: {}, skills: [] });
      const states = getPluginStates(cwd);
      expect(states).toEqual([{ name: 'gx', description: 'graph nav', enabled: false }]);
    });
  });
});

// ---------------------------------------------------------------------------
// design plugin (0065B) — reads the REAL catalog and the REAL source tree.
// Writes only to os.tmpdir() dirs it deletes.
// ---------------------------------------------------------------------------
describe('design plugin (0065B)', () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const codeadd = path.join(repoRoot, 'framwork', '.codeadd');
  const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'cli', 'src', 'plugins.json'), 'utf8'));
  const read = (...p) => fs.readFileSync(path.join(codeadd, ...p), 'utf8');
  const design = () => catalog.design;

  describe('catalog shape', () => {
    it('declares the design entry with its injection targets', () => {
      const d = design();
      expect(d).toBeDefined();
      expect(d.type).toBe('skill');
      expect(d.skills).toEqual([]);
      expect(d.injects).toEqual(['add-plan']);
      expect(d.agents).toEqual([
        { agent: 'ux-flow-agent', sections: ['direction'] },
        { agent: 'ux-layout-agent', sections: ['layout'] },
        { agent: 'ux-agent', sections: ['critique'] },
      ]);
      expect(d.homepage).toBe('https://github.com/nextlevelbuilder/ui-ux-pro-max-skill');
    });

    it('gives both official install routes and the Python note in installHint', () => {
      const hint = design()?.installHint ?? '';
      for (const s of [
        '/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill',
        '/plugin install ui-ux-pro-max@ui-ux-pro-max-skill',
        'npm install -g ui-ux-pro-max-cli',
        'uipro init --ai',
        'uipro-cli',
        'Python 3',
      ]) {
        expect(hint, s).toContain(s);
      }
    });

    it('tells the user how to check Python and reload in postEnableHint', () => {
      const hint = design()?.postEnableHint ?? '';
      for (const s of ['python3 --version', 'py --version', '/reload-plugins']) {
        expect(hint, s).toContain(s);
      }
    });

    it('documents the skill type in the schema doc', () => {
      expect(catalog['$schema-doc'].fields.type).toContain("'skill'");
    });
  });

  describe('detect quoting', () => {
    it('is one node -e with no character special to sh or cmd.exe', () => {
      expect(design()?.detect ?? '').toMatch(/^node -e "[^"$`%!\\]*"$/);
    });
  });

  describe('detect matrix (real detect string)', () => {
    let proj;
    let home;
    let cacheDir;
    const mk = (root, rel, content = '# skill\n') => {
      const f = path.join(root, rel);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, content);
    };
    // Temp HOME/USERPROFILE keep the developer's own install from leaking in;
    // the cache-dir variable is removed unless the case sets it.
    const run = (cacheEnv) => {
      const env = { ...process.env, HOME: home, USERPROFILE: home };
      delete env.CLAUDE_CODE_PLUGIN_CACHE_DIR;
      if (cacheEnv) env.CLAUDE_CODE_PLUGIN_CACHE_DIR = cacheEnv;
      try {
        execSync(design().detect, { cwd: proj, env, stdio: 'ignore' });
        return 0;
      } catch (e) {
        return e.status ?? 1;
      }
    };
    const registry = (plugins) => JSON.stringify({ version: 2, plugins });
    const entry = [{ scope: 'user', installPath: '/x', version: '2.15.0' }];

    beforeEach(() => {
      proj = fs.mkdtempSync(path.join(os.tmpdir(), 'design-proj-'));
      home = fs.mkdtempSync(path.join(os.tmpdir(), 'design-home-'));
      cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-cache-'));
    });
    afterEach(() => {
      for (const d of [proj, home, cacheDir]) fs.rmSync(d, { recursive: true, force: true });
    });

    for (const root of ['.claude', '.cursor', '.agents', '.agent', '.opencode', '.zcode']) {
      it(`finds the skill in project ${root}/skills`, () => {
        mk(proj, `${root}/skills/ui-ux-pro-max/SKILL.md`);
        expect(run()).toBe(0);
      });
    }

    for (const rel of ['.claude', '.cursor', '.agents', '.zcode', '.config/opencode']) {
      it(`finds the skill in home ${rel}/skills`, () => {
        mk(home, `${rel}/skills/ui-ux-pro-max/SKILL.md`);
        expect(run()).toBe(0);
      });
    }

    it('finds a marketplace install under plugins in installed_plugins.json', () => {
      mk(home, '.claude/plugins/installed_plugins.json', registry({ 'ui-ux-pro-max@ui-ux-pro-max-skill': entry }));
      expect(run()).toBe(0);
    });

    it('finds the marketplace key at the top level too (defensive)', () => {
      mk(home, '.claude/plugins/installed_plugins.json', JSON.stringify({ 'ui-ux-pro-max@ui-ux-pro-max-skill': entry }));
      expect(run()).toBe(0);
    });

    it('reads installed_plugins.json from CLAUDE_CODE_PLUGIN_CACHE_DIR', () => {
      mk(cacheDir, 'installed_plugins.json', registry({ 'ui-ux-pro-max@ui-ux-pro-max-skill': entry }));
      expect(run(cacheDir)).toBe(0);
    });

    it('fails when nothing is installed', () => {
      expect(run()).not.toBe(0);
    });

    it('fails for a ui-ux-pro-max dir with no SKILL.md', () => {
      fs.mkdirSync(path.join(proj, '.claude', 'skills', 'ui-ux-pro-max'), { recursive: true });
      expect(run()).not.toBe(0);
    });

    it('fails when installed_plugins.json only lists another plugin', () => {
      mk(home, '.claude/plugins/installed_plugins.json', registry({ 'other@x': entry }));
      expect(run()).not.toBe(0);
    });

    it('fails, without crashing into a false 0, on a malformed installed_plugins.json', () => {
      mk(home, '.claude/plugins/installed_plugins.json', '{ not json');
      expect(run()).not.toBe(0);
    });
  });

  describe('fragment rules', () => {
    const files = {
      'add-plan': ['plugins', 'design', 'fragments', 'add-plan.md'],
      'ux-flow-agent': ['plugins', 'design', 'fragments', 'agents', 'ux-flow-agent.md'],
      'ux-layout-agent': ['plugins', 'design', 'fragments', 'agents', 'ux-layout-agent.md'],
      'ux-agent': ['plugins', 'design', 'fragments', 'agents', 'ux-agent.md'],
    };
    const text = (name) => {
      const f = path.join(codeadd, ...files[name]);
      return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
    };

    for (const name of Object.keys(files)) {
      describe(name, () => {
        it('states the precedence in order', () => {
          const line = text(name).split('\n').find((l) => l.startsWith('**Precedence:**'));
          expect(line, 'a **Precedence:** line').toBeDefined();
          const at = ['inspected', 'docs/design-system.md', 'ui-ux-pro-max', 'add--ux-design'].map((s) => line.indexOf(s));
          expect(at.every((i) => i >= 0)).toBe(true);
          expect([...at].sort((a, b) => a - b)).toEqual(at);
        });

        it('never persists, and every search carries a domain', () => {
          const t = text(name);
          expect(t.length).toBeGreaterThan(0);
          for (const l of t.split('\n')) {
            if (l.includes('--persist')) expect(l.toLowerCase(), l).toContain('never');
            if (l.includes('search.py')) expect(/--domain|--design-system/.test(l), l).toBe(true);
          }
        });

        it('soft-fails to the design core without Python', () => {
          const t = text(name);
          expect(t).toContain('python3');
          expect(t).toContain('design core');
        });
      });
    }

    it('the add-plan fragment carries the dispatch, consolidation and soft-degrade rules', () => {
      const t = text('add-plan');
      for (const s of ['DESIGN_SOURCE=ui-ux-pro-max', 'ux-consolidate', 'design-context.md', 'installPath', 'Soft-degrade']) {
        expect(t, s).toContain(s);
      }
    });
  });

  describe('slot placement in source (by text)', () => {
    // Returns the slot's start offset; asserts the exact shape: fallback, one member, nothing else.
    const slotAt = (src, section) => {
      const re = new RegExp(
        `<!-- slot:design\\.${section} fallback="fallbacks/empty\\.md" -->\\s*<!-- plugin:design:${section} -->\\s*<!-- /plugin:design:${section} -->\\s*<!-- /slot:design\\.${section} -->`,
      );
      expect(src).toMatch(re);
      expect(src.match(new RegExp(`<!-- plugin:design:${section} -->`, 'g'))).toHaveLength(1);
      return src.search(new RegExp(`<!-- slot:design\\.${section} `));
    };

    it('design.plan sits between the contract gate and the flow dispatch in add-plan', () => {
      const src = read('commands', 'add-plan.md');
      const at = slotAt(src, 'plan');
      const gate = src.indexOf('⛔ A `design.md` with no `## Design Contract`');
      const next = src.indexOf('#### STEP add-plan.dispatch-ux-flow');
      expect(gate).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(gate);
      expect(at).toBeLessThan(next);
    });

    it('design.direction follows item 6 in ux-flow-agent, outside gitnexus.graph', () => {
      const src = read('agents', 'ux-flow-agent.md');
      const at = slotAt(src, 'direction');
      const item6 = src.indexOf('6. If `HAS_FOUNDATIONS=true`');
      const write = src.indexOf('Write the inspection to temp `design-context.md`');
      expect(item6).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(item6);
      expect(at).toBeLessThan(write);
      const gx = src.indexOf('<!-- slot:gitnexus.graph ');
      const gxEnd = src.indexOf('<!-- /slot:gitnexus.graph -->');
      expect(at < gx || at > gxEnd).toBe(true);
    });

    it('design.layout follows item 6 and precedes ## Output in ux-layout-agent', () => {
      const src = read('agents', 'ux-layout-agent.md');
      const at = slotAt(src, 'layout');
      const item6 = src.indexOf('6. Emit the `## Design Contract` block');
      const out = src.indexOf('\n## Output');
      expect(item6).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(item6);
      expect(at).toBeLessThan(out);
    });

    it('design.critique follows item 2 and precedes the next ### Output in ux-agent', () => {
      const src = read('agents', 'ux-agent.md');
      const at = slotAt(src, 'critique');
      const item2 = src.indexOf('2. Adversarially hunt defects');
      const out = src.indexOf('\n### Output', item2);
      expect(item2).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(item2);
      expect(at).toBeLessThan(out);
    });
  });
});
