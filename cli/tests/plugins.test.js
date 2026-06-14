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

/**
 * Scaffold an installed-project tree: manifest + provider command files with
 * markers + the plugin asset source tree (fragments + skills).
 */
function scaffoldProject(cwd, { providers, pluginName, sectionsByCommand, skills }) {
  fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '1.0.0', providers, plugins: {}, hashes: {} }, null, 2),
  );

  // Provider command dirs (claude/cursor use commands/; codex/antigrav have no commandsSubdir)
  const subdir = { claude: 'commands', cursor: 'commands' };
  for (const cmd of Object.keys(sectionsByCommand)) {
    const markers = sectionsByCommand[cmd]
      .map((s) => `<!-- plugin:${pluginName}:${s} -->\n<!-- /plugin:${pluginName}:${s} -->`)
      .join('\n');
    for (const prov of providers) {
      if (!subdir[prov]) continue;
      const dir = path.join(cwd, `.${prov}`, subdir[prov]);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${cmd}.md`), `# ${cmd}\n\n${markers}\n`);
    }
  }

  // Plugin fragment source: .codeadd/plugins/{name}/fragments/{cmd}.md
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

  // -------------------------------------------------------------------------
  // loadCatalog
  // -------------------------------------------------------------------------
  describe('loadCatalog', () => {
    it('reads from CODEADD_PLUGINS_CATALOG and filters $schema-doc', () => {
      writeCatalog(catDir, {
        '$schema-doc': { description: 'doc' },
        demo: { type: 'mcp', description: 'demo', detect: 'true' },
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

  // -------------------------------------------------------------------------
  // validate (hard gate)
  // -------------------------------------------------------------------------
  describe('validate', () => {
    it('returns true when the detect probe exits 0', () => {
      expect(validate({ detect: 'true' })).toBe(true);
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

  // -------------------------------------------------------------------------
  // enablePlugin
  // -------------------------------------------------------------------------
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

    it('injects fragments across providers and activates skills', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'true', injects: ['add.new'], skills: ['gx-skill'] },
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
        expect(fs.existsSync(path.join(cwd, `.${prov}`, 'skills', 'gx-skill', 'SKILL.md'))).toBe(true);
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: true });
    });

    it('records hashes for modified command files', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'true', injects: ['add.new'], skills: [] },
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

  // -------------------------------------------------------------------------
  // disablePlugin (round-trip)
  // -------------------------------------------------------------------------
  describe('disablePlugin', () => {
    it('removes injections and skills, keeps markers, flips manifest', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'true', injects: ['add.new'], skills: ['gx-skill'] },
      });
      scaffoldProject(cwd, {
        providers: ['claude', 'cursor'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: ['gx-skill'],
      });
      enablePlugin(cwd, 'gx');

      const result = disablePlugin(cwd, 'gx');
      expect(result.modified).toBe(2);
      expect(result.skills).toBe(2);

      for (const prov of ['claude', 'cursor']) {
        const cmd = fs.readFileSync(path.join(cwd, `.${prov}`, 'commands', 'add.new.md'), 'utf8');
        expect(cmd).not.toContain('EXPLORE-CONTENT');
        expect(cmd).toContain(`<!-- plugin:gx:explore -->`); // marker survives
        expect(fs.existsSync(path.join(cwd, `.${prov}`, 'skills', 'gx-skill'))).toBe(false);
      }

      const manifest = JSON.parse(fs.readFileSync(path.join(cwd, '.codeadd', 'manifest.json'), 'utf8'));
      expect(manifest.plugins.gx).toEqual({ enabled: false });
    });
  });

  // -------------------------------------------------------------------------
  // applyEnabledPlugins
  // -------------------------------------------------------------------------
  describe('applyEnabledPlugins', () => {
    it('re-applies only enabled plugins from the manifest', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'g', detect: 'true', injects: ['add.new'], skills: [] },
      });
      scaffoldProject(cwd, {
        providers: ['claude'],
        pluginName: 'gx',
        sectionsByCommand: { 'add.new': ['explore'] },
        skills: [],
      });
      // mark gx enabled in manifest without injecting yet
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

  // -------------------------------------------------------------------------
  // getPluginStates
  // -------------------------------------------------------------------------
  describe('getPluginStates', () => {
    it('lists catalog plugins with enabled defaulting to false', () => {
      writeCatalog(catDir, {
        gx: { type: 'mcp', description: 'graph nav', detect: 'true' },
      });
      scaffoldProject(cwd, { providers: ['claude'], pluginName: 'gx', sectionsByCommand: {}, skills: [] });
      const states = getPluginStates(cwd);
      expect(states).toEqual([{ name: 'gx', description: 'graph nav', enabled: false }]);
    });
  });
});
