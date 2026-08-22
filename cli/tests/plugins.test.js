import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadCatalog,
  validate,
  enablePlugin,
  disablePlugin,
  applyEnabledPlugins,
  getPluginStates,
} from '../src/plugins.js';

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

  fs.writeFileSync(path.join(cwd, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 1, points }, null, 2));
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
        gx: { type: 'mcp', description: 'g', detect: 'false', injects: ['add.new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: ['gx-skill'],
      });

      const result = enablePlugin(cwd, 'gx');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('not-detected');

      const cmd = fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add.new.md'), 'utf8');
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
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude', 'cursor'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: ['gx-skill'],
      });

      const result = enablePlugin(cwd, 'gx');
      expect(result.ok).toBe(true);
      expect(result.modified).toBe(2); // claude + cursor
      expect(result.skills).toBe(2); // gx-skill × 2 providers

      for (const prov of ['claude', 'cursor']) {
        const cmd = fs.readFileSync(path.join(cwd, `.${prov}`, 'commands', 'add.new.md'), 'utf8');
        expect(cmd).toContain('EXPLORE-CONTENT');
        expect(cmd).not.toContain('<!--'); // no markers written
        expect(fs.existsSync(path.join(cwd, `.${prov}`, 'skills', 'gx-skill', 'SKILL.md'))).toBe(true);
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: true });
    });

    it('records hashes for modified command files', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: [] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: [],
      });
      enablePlugin(cwd, 'gx');
      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.hashes['.claude/commands/add.new.md']).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('disablePlugin', () => {
    it('removes injections and skills, restores the file, flips manifest', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude', 'cursor'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: ['gx-skill'],
      });
      const before = {
        claude: fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add.new.md'), 'utf8'),
        cursor: fs.readFileSync(path.join(cwd, '.cursor', 'commands', 'add.new.md'), 'utf8'),
      };
      enablePlugin(cwd, 'gx');

      const result = disablePlugin(cwd, 'gx');
      expect(result.modified).toBe(2);
      expect(result.skills).toBe(2);

      for (const prov of ['claude', 'cursor']) {
        const cmd = fs.readFileSync(path.join(cwd, `.${prov}`, 'commands', 'add.new.md'), 'utf8');
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
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
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
          type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: [],
          agents: [{ agent: 'discovery-agent', sections: ['graph'] }],
        },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
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
        gx: { type: 'mcp', description: 'g', detect: 'node -e "process.exit(0)"', injects: ['add.new'], skills: [] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: [],
      });
      const mp = path.join(cwd, '.codeadd', 'manifest.json');
      const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
      m.plugins = { gx: { enabled: true } };
      fs.writeFileSync(mp, JSON.stringify(m, null, 2));

      const total = applyEnabledPlugins(cwd);
      expect(total).toBe(1);
      const cmd = fs.readFileSync(path.join(cwd, '.claude', 'commands', 'add.new.md'), 'utf8');
      expect(cmd).toContain('EXPLORE-CONTENT');
    });

    it('returns 0 when no manifest', () => {
      writeCatalog(catDir, {});
      expect(applyEnabledPlugins(path.join(cwd, 'empty'))).toBe(0);
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
