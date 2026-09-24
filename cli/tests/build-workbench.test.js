/**
 * build-workbench.test.js — the workbench build entry point.
 *
 * The workbench is the framework's OWN pipeline: source at `workbench/`, built
 * into `.claude/`, `.opencode/`, `.agents/` and `.codex/` at the repository root.
 * Its output is gitignored, which is exactly why it needs a suite — a break there
 * is invisible locally and invisible in review.
 *
 * L2 and L3 never read the repository's own provider trees: whether
 * those exist depends on who ran the build before the test, and `release.yml`
 * never does. They build the real entry point into a temp copy instead, so the
 * verdict is the same on every machine and in every workflow.
 *
 * What this file deliberately does NOT re-assert: anything `build.test.js`
 * already covers about the shared transformation. `build-workbench.js` imports
 * `buildResources`, `resolveResourcePaths`, `stripHtmlComments`, `TRANSFORMERS`
 * and `AGENT_DIALECTS` rather than copying them, so testing them twice would
 * pin one behaviour in two places and let them drift apart in the reader's head.
 * These assertions are about the WIRING: the registry, the source root, the
 * output tree, and the two things the workbench does differently.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'workbench');
const MAP = JSON.parse(fs.readFileSync(path.join(SRC, 'provider-map.json'), 'utf8'));

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

/**
 * The workbench built into a temp copy of the three things the build reads —
 * `workbench/` and the two scripts — by the real entry point. build.js resolves
 * its root from its own location, so the output lands in the copy and the
 * repository is never touched. Built once per file, on first use, so L1 and L4
 * pay nothing.
 */
let outDir = null;
function out() {
  if (outDir) return outDir;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-workbench-'));
  fs.cpSync(SRC, path.join(dir, 'workbench'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts'));
  for (const f of ['build.js', 'build-workbench.js']) {
    fs.copyFileSync(path.join(ROOT, 'scripts', f), path.join(dir, 'scripts', f));
  }
  const res = spawnSync(process.execPath, [path.join(dir, 'scripts', 'build-workbench.js')], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  if (res.error || res.status !== 0) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw new Error(`build-workbench.js failed (exit ${res.status})
${res.stdout}
${res.stderr}`);
  }
  outDir = dir;
  return outDir;
}
afterAll(() => {
  if (outDir) fs.rmSync(outDir, { recursive: true, force: true });
});

const built = (...p) => fs.readFileSync(path.join(out(), ...p), 'utf8');
const builtExists = (...p) => fs.existsSync(path.join(out(), ...p));

const PROVIDERS = Object.keys(MAP.providers);
const COMMANDS = Object.keys(MAP.commands);
const SKILLS = Object.keys(MAP.skills);
const AGENTS = Object.keys(MAP.agents);

/**
 * Resolve one registry pattern to the path the build writes for a provider.
 * The registry is what carries per-provider layouts — codex commands build as
 * skills and its agents live in a separate `agentsDir` — so the assertions
 * resolve the pattern instead of assuming `commands/*.md` / `agents/*.md`.
 */
const commandFile = (key, n) => `${MAP.providers[key].dir}/${MAP.providers[key].commands.replace('{name}', n)}`;
const skillFile = (key, n) => `${MAP.providers[key].dir}/${MAP.providers[key].skills.replace('{name}', n)}`;
const agentFile = (key, n) => {
  const p = MAP.providers[key];
  return `${p.agentsDir ?? p.dir}/${p.agents.replace('{name}', n)}`;
};

describe('L1 — the registry and the tree agree', () => {
  it('L1.1 every registered resource has a source file, and every source file is registered', () => {
    const onDisk = {
      commands: fs.readdirSync(path.join(SRC, 'commands')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')),
      skills: fs.readdirSync(path.join(SRC, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name),
      agents: fs.readdirSync(path.join(SRC, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')),
    };
    expect(onDisk.commands.sort()).toEqual([...COMMANDS].sort());
    expect(onDisk.skills.sort()).toEqual([...SKILLS].sort());
    expect(onDisk.agents.sort()).toEqual([...AGENTS].sort());
  });

  it('L1.2 the registry targets the repository-root provider dirs, not framwork/', () => {
    // A `dir` under framwork/ would write the workbench into the product's
    // output tree, which release.yml packages — and the workbench ships to
    // nobody. This is the assertion that keeps that true by construction. An
    // `agentsDir` carries the same risk for the providers whose agents live
    // outside their skills root, so it gets the same anchored check.
    for (const [key, p] of Object.entries(MAP.providers)) {
      expect(p.dir, key).toMatch(/^\.[a-z]+$/);
      expect(p.dir, key).not.toMatch(/framwork/);
      if (p.agentsDir) {
        expect(p.agentsDir, key).toMatch(/^\.[a-z]+$/);
        expect(p.agentsDir, key).not.toMatch(/framwork/);
      }
    }
    expect(PROVIDERS.sort()).toEqual(['claude', 'codex', 'opencode']);
  });

  it('L1.3 commands and agents carry a description; skills do not need one', () => {
    // commandStrategy.meta and agentStrategy.meta read entry.description from
    // the registry. The workbench commands carry NO frontmatter of their own —
    // they start at `# Title` — so without this the built file has an empty
    // description and the provider lists it blank.
    for (const n of COMMANDS) expect(MAP.commands[n].description, n).toBeTruthy();
    for (const n of AGENTS) expect(MAP.agents[n].description, n).toBeTruthy();
    // skillStrategy is passthrough: each SKILL.md carries its own.
    for (const n of SKILLS) {
      const fm = read('workbench', 'skills', n, 'SKILL.md').split('---')[1] ?? '';
      expect(fm, n).toMatch(/^name:/m);
      expect(fm, n).toMatch(/^description:/m);
    }
  });

  it('L1.4 nothing in the workbench is registered in the product registry', () => {
    const product = JSON.parse(read('framwork', 'provider-map.json'));
    for (const n of COMMANDS) expect(product.commands, n).not.toHaveProperty(n);
    for (const n of AGENTS) expect(product.agents, n).not.toHaveProperty(n);
    // Four skill names exist in BOTH layers on purpose — add-commit,
    // add-final-report, add-review-discipline and the ruler's neighbours. The
    // duplication is deliberate and documented, so this asserts the commands
    // and agents only.
  });
});

describe('L2 — the expected output map', () => {
  it('L2.1 every command, skill and agent lands under every provider, at its own pattern', () => {
    const missing = [];
    for (const key of PROVIDERS) {
      for (const n of COMMANDS) if (!builtExists(commandFile(key, n))) missing.push(commandFile(key, n));
      for (const n of SKILLS) if (!builtExists(skillFile(key, n))) missing.push(skillFile(key, n));
      for (const n of AGENTS) if (!builtExists(agentFile(key, n))) missing.push(agentFile(key, n));
    }
    expect(missing).toEqual([]);
  });

  it('L2.2 a skill’s sibling files travel with it', () => {
    // postWrite copies everything beside SKILL.md. references/ is the common
    // case; add-commit/evals/ is the one that proves it is not special-cased to
    // that name.
    for (const key of PROVIDERS) {
      const dir = MAP.providers[key].dir;
      expect(builtExists(dir, 'skills', 'add-plan-authoring', 'references', 'plan-template.md'), key).toBe(true);
      expect(builtExists(dir, 'skills', 'building-commands', 'references', 'agent-dispatch.md'), key).toBe(true);
      expect(builtExists(dir, 'skills', 'add-commit', 'evals', 'evals.json'), key).toBe(true);
    }
  });

  it('L2.3 a built command acquires the registry description as frontmatter', () => {
    for (const key of PROVIDERS) {
      for (const n of COMMANDS) {
        const body = built(commandFile(key, n));
        expect(body, commandFile(key, n)).toMatch(/^---\n/);
        expect(body, commandFile(key, n)).toContain(MAP.commands[n].description);
      }
    }
  });

  it('L2.4 no build-time variable survives into the output', () => {
    const leaked = [];
    for (const key of PROVIDERS) {
      const dir = MAP.providers[key].dir;
      for (const n of SKILLS) {
        const body = built(dir, 'skills', n, 'SKILL.md');
        // A variable with a NAME must be resolved. `{{skill:}}` with nothing
        // after the colon is the syntax being documented, not a reference.
        const m = body.match(/\{\{(cmd|skill|addpath):[^}\s]+\}\}/g);
        if (m) leaked.push(`${dir}/skills/${n}: ${m.join(', ')}`);
      }
    }
    expect(leaked).toEqual([]);
  });

  it('L2.5 a skill pointer resolves to the provider that is reading it', () => {
    // This is the whole reason the literals became variables: the same source
    // line has to name a different path per provider. Codex shares opencode's
    // shape for skills — one more provider carrying the same contract.
    const claude = built('.claude', 'skills', 'add-framework--build', 'SKILL.md');
    const opencode = built('.opencode', 'skills', 'add-framework--build', 'SKILL.md');
    const codex = built('.agents', 'skills', 'add-framework--build', 'SKILL.md');
    expect(claude).toContain('.claude/skills/add-build-ledger/SKILL.md');
    expect(opencode).toContain('.opencode/skills/add-build-ledger/SKILL.md');
    expect(codex).toContain('.agents/skills/add-build-ledger/SKILL.md');
    expect(claude).not.toContain('.opencode/skills/add-build-ledger');
    expect(opencode).not.toContain('.claude/skills/add-build-ledger');
    expect(codex).not.toContain('.claude/skills/add-build-ledger');
    expect(codex).not.toContain('.opencode/skills/add-build-ledger');
  });
});

describe('L3 — the agent dialect, where the workbench differs', () => {
  it('L3.1 a readonly agent declaring Bash keeps it; one that does not, does not', () => {
    // The condition is the SOURCE's tools: line. Denying bash unconditionally
    // closed framework-discovery-agent's only route to the graph where no MCP
    // is configured, while its own frontmatter said it had one.
    const withBash = built('.opencode', 'agents', 'framework-discovery-agent.md');
    expect(withBash).toContain('edit: deny');
    expect(withBash).not.toContain('bash: deny');

    const withoutBash = built('.opencode', 'agents', 'plan-readback-agent.md');
    expect(withoutBash).toContain('edit: deny');
    expect(withoutBash).toContain('bash: deny');
  });

  it('L3.2 edit: deny is unconditional on every readonly agent', () => {
    for (const n of AGENTS) {
      const src = read('workbench', 'agents', `${n}.md`);
      if (!/^readonly:\s*true/m.test(src)) continue;
      expect(built('.opencode', 'agents', `${n}.md`), n).toContain('edit: deny');
    }
  });

  it('L3.3 no comment reaches a built frontmatter', () => {
    // splitFrontmatter appends a non-`key:` line to the PREVIOUS key's block,
    // and the claude dialect pushes that block verbatim — so a `#` note inside
    // the frontmatter shipped glued onto `memory:`. Source-only notes belong in
    // an HTML comment, which stripHtmlComments removes. A provider whose agent
    // dialect emits no frontmatter (codex: TOML) contributes no lines here —
    // that is the `continue`, not a gap in the check.
    const leaked = [];
    for (const key of PROVIDERS) {
      for (const n of AGENTS) {
        const file = agentFile(key, n);
        const lines = built(file).split('\n');
        if (lines[0].trim() !== '---') continue;
        const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
        const comments = lines.slice(1, end).filter((l) => l.trim().startsWith('#'));
        if (comments.length) leaked.push(`${file}: ${comments.length}`);
      }
    }
    expect(leaked).toEqual([]);
  });
});

describe('L4 — the workbench stays out of the product', () => {
  it('L4.1 release.yml packages no workbench path', () => {
    const yml = read('.github', 'workflows', 'release.yml');
    expect(yml).not.toContain('workbench');
    expect(yml).not.toContain('build-workbench');
  });

  it('L4.2 ci.yml runs the workbench build', () => {
    // L2/L3 build into a temp copy; this step is what runs the build against the
    // real tree — the stale-output prune included — on every push.
    expect(read('.github', 'workflows', 'ci.yml')).toContain('node scripts/build-workbench.js');
  });

  it('L4.3 the installer never writes a workbench path', () => {
    for (const f of ['installer.js', 'providers.js', 'updater.js', 'uninstaller.js']) {
      expect(read('cli', 'src', f), f).not.toContain('workbench');
    }
  });

  it('L4.4 build-workbench.js copies no transformation', () => {
    // Its whole justification is that it imports. A local re-implementation of
    // any of these is the drift ENTRY_POINT_KINDS already pays for between
    // graph.js and engine.mjs, and it would be invisible until they disagreed.
    const src = read('scripts', 'build-workbench.js');
    expect(src).toMatch(/require\(['"]\.\/build\.js['"]\)/);
    for (const fn of ['buildResources', 'resolveResourcePaths', 'stripHtmlComments', 'AGENT_DIALECTS', 'pruneStaleOutputs']) {
      expect(src, fn).toContain(fn);
      expect(src, `${fn} must be imported, not defined`).not.toMatch(new RegExp(`function\\s+${fn}\\s*\\(`));
    }
  });

  it('L4.5 the graph and the MCP corpus both read the source, not the output', () => {
    // buildResources strips every <!-- uses: --> block, so a corpus pointed at
    // the built tree indexes edge-free nodes and reports a graph with no
    // relations — with no error anywhere.
    expect(read('scripts', 'build.js')).toContain("path.join(internalDir, 'workbench')");
    expect(read('mcp', 'corpora.mjs')).toContain("roots: ['framwork/.codeadd', 'workbench']");

    const graph = JSON.parse(read('framwork', '.codeadd', 'artefact-graph.json'));
    const internal = graph.nodes.filter((n) => n.layer === 'internal');
    expect(internal.length).toBeGreaterThan(0);
    for (const n of internal) expect(n.path, n.id).toMatch(/^workbench\//);
  });
});
