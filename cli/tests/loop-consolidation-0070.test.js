import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { readMap } = require('../../scripts/build.js');

import { FEATURES } from '../src/features.js';

/**
 * Plan 0070 — Development Loop Consolidation.
 * Red-Green Validation Matrix (F28), levels L1 through L7.
 *
 * Every level here was written RED against the pre-0070 tree. A level that
 * passes before its F-block lands is a level that does not bite.
 *
 * L3 (per-feature exactly-once) and L4 (combination matrix) are NOT duplicated
 * here: injection-exclusivity.integration.test.js is already data-driven off
 * FEATURES, the sidecar, the plugin catalog and PROVIDERS, so it follows the
 * rename and the new points automatically. Its hardcoded substitution total is
 * the one thing that must move, and it is asserted there.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const COMMANDS = path.join(CODEADD, 'commands');
const AGENTS = path.join(CODEADD, 'agents');
const FRAGMENTS = path.join(CODEADD, 'fragments');
const SCRIPTS = path.join(CODEADD, 'scripts');
const SKILLS = path.join(CODEADD, 'skills');
const SIDECAR = path.join(CODEADD, 'injection-points.json');
const MAP = readMap();
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'src', 'plugins.json'), 'utf8'));

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const sidecarPoints = () => JSON.parse(read(SIDECAR)).points;

function countOf(haystack, needle) {
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) !== -1) {
    n += 1;
    i += needle.length;
  }
  return n;
}

/** Providers that receive agent files, per the build registry. */
const agentProviders = () =>
  Object.entries(MAP.providers)
    .filter(([, p]) => p.agents)
    .map(([k]) => k);

/** Output root for a provider's agents — agentsDir overrides dir. */
function agentOutRoot(providerKey) {
  const p = MAP.providers[providerKey];
  return path.join(ROOT, p.agentsDir || p.dir);
}

function agentFile(providerKey, name) {
  const p = MAP.providers[providerKey];
  return path.join(agentOutRoot(providerKey), p.agents.replace('{name}', name));
}

function walkFiles(dir, extensions, visit) {
  if (!exists(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, extensions, visit);
    else if (extensions.test(entry.name)) visit(full);
  }
}

// ---------------------------------------------------------------------------
// Expected injection map after the change — 38 points, was 35.
// The build must ASSERT this map, not assume it.
// ---------------------------------------------------------------------------

const EXPECTED_MAP = [
  { namespace: 'feature', name: 'tdd-pipeline', resource: 'add.plan', count: 2 },
  { namespace: 'feature', name: 'tdd-pipeline', resource: 'add.build', count: 8 },
  { namespace: 'feature', name: 'tdd-pipeline', resource: 'add.review', count: 2 },
  { namespace: 'feature', name: 'qa-pipeline', resource: 'add.plan', count: 2 },
  { namespace: 'feature', name: 'qa-pipeline', resource: 'add.build', count: 2 },
  { namespace: 'plugin', name: 'playwright', resource: 'add.review', count: 1 },
  { namespace: 'plugin', name: 'playwright', resource: 'qa-agent', count: 1 },
];

describe('0070 L1 — build-side unit', () => {
  it('L1.0 injection map totals exactly 38 points', () => {
    expect(sidecarPoints()).toHaveLength(38);
  });

  it('L1.0 injection map matches the expected per-resource breakdown', () => {
    const points = sidecarPoints();
    for (const row of EXPECTED_MAP) {
      const got = points.filter(
        (p) => p.namespace === row.namespace && p.name === row.name && p.resource.name === row.resource,
      );
      expect(got.length, `${row.namespace}:${row.name} on ${row.resource}`).toBe(row.count);
    }
  });

  it('L1.0 gitnexus contributes exactly 20 points and never targets test-agent or fix-agent', () => {
    const gitnexus = sidecarPoints().filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
    expect(gitnexus).toHaveLength(20);
    const targets = gitnexus.map((p) => p.resource.name);
    expect(targets).not.toContain('test-agent');
    expect(targets).not.toContain('fix-agent');
  });

  it('L1.0 removed commands contribute zero injection points', () => {
    const names = sidecarPoints().map((p) => p.resource.name);
    expect(names).not.toContain('add.test');
    expect(names).not.toContain('add.qa');
    expect(names).not.toContain('add.autopilot');
  });

  it('L1.1 re-keyed tdd-pipeline marker pairs stay empty (0067 guard regression)', () => {
    for (const file of ['add.plan.md', 'add.build.md', 'add.review.md']) {
      const src = read(path.join(COMMANDS, file));
      const pairs =
        src.match(/<!-- feature:tdd-pipeline:([a-z0-9-]+) -->\s*<!-- \/feature:tdd-pipeline:\1 -->/g) || [];
      const opens = src.match(/<!-- feature:tdd-pipeline:[a-z0-9-]+ -->/g) || [];
      expect(pairs.length, `${file} empty pairs`).toBe(opens.length);
    }
  });

  it('L1.1 no legacy feature:tdd: marker survives in any command source', () => {
    for (const file of fs.readdirSync(COMMANDS)) {
      expect(read(path.join(COMMANDS, file)), file).not.toMatch(/feature:tdd:/);
    }
  });

  // Two features/plugins sharing ONE anchor is legal and supported — each
  // enables independently and both blocks land after it. What must never
  // collide is the same namespace:name declaring the same section twice on one
  // resource, which would inject the same block twice.
  it('L1.2 no (namespace, name, resource, section) is declared twice', () => {
    const seen = new Set();
    for (const p of sidecarPoints()) {
      const key = `${p.namespace}:${p.name}:${p.resource.kind}:${p.resource.name}:${p.section}`;
      expect(seen.has(key), `duplicate sidecar declaration ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('L1.2 no sidecar anchor text carries a resource-path variable', () => {
    for (const p of sidecarPoints()) {
      expect(p.anchor.text).not.toMatch(/\{\{(cmd|skill|addpath):[^}]+\}\}/);
    }
  });

  it('L1.3 agent output patterns are registered for claude, cursor, opencode and codex', () => {
    const withAgents = agentProviders();
    expect(withAgents).toContain('claude');
    expect(withAgents).toContain('cursor');
    expect(withAgents).toContain('opencode');
    expect(withAgents).toContain('codex');
  });

  it('L1.3 antigrav is deliberately deferred — no agents pattern', () => {
    expect(MAP.providers.antigrav.agents).toBeUndefined();
  });

  it('L1.3 every registered agent is emitted for every agent-capable provider (fail loud, never silent)', () => {
    for (const name of Object.keys(MAP.agents)) {
      for (const provider of agentProviders()) {
        const out = agentFile(provider, name);
        expect(exists(out), `missing agent output: ${path.relative(ROOT, out)}`).toBe(true);
      }
    }
  });

  it('L1.3 each MD provider emits its own frontmatter dialect', () => {
    const sample = 'reviewer-agent';

    const claude = read(agentFile('claude', sample));
    expect(claude).toMatch(/^---\n/);
    expect(claude).toMatch(/\nname: /);

    const opencode = read(agentFile('opencode', sample));
    expect(opencode).toMatch(/\nmode: subagent\n/);

    const cursor = read(agentFile('cursor', sample));
    expect(cursor).toMatch(/\nreadonly: true\n/);
  });

  // Regression: `skills:` is a multi-line YAML list. A dialect that re-serialises
  // frontmatter from parsed scalars drops every list entry silently, and the
  // agent then loads with none of its skills.
  it('L1.3 the claude dialect preserves every source frontmatter key, lists included', () => {
    const keysOf = (text) => {
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
      if (!m) return [];
      return m[1]
        .split(/\r?\n/)
        .map((l) => (/^([A-Za-z_][\w-]*):/.exec(l) || [])[1])
        .filter(Boolean);
    };

    for (const name of Object.keys(MAP.agents)) {
      const source = read(path.join(AGENTS, `${name}.md`));
      const built = read(agentFile('claude', name));
      // `readonly` is a build-time signal consumed by the dialects, not emitted.
      const expected = keysOf(source).filter((k) => k !== 'readonly');
      const got = keysOf(built);
      for (const key of expected) {
        expect(got, `${name}: lost frontmatter key "${key}"`).toContain(key);
      }
      if (source.includes('skills:\n  - ')) {
        expect(built, `${name}: skills list flattened`).toMatch(/skills:\n {2}- /);
      }
    }
  });

  it('L1.4 every codex agent parses as TOML and carries the body in developer_instructions', () => {
    for (const name of Object.keys(MAP.agents)) {
      const out = agentFile('codex', name);
      expect(out.endsWith('.toml'), name).toBe(true);
      const toml = read(out);

      expect(toml, name).toMatch(new RegExp(`^name = "${name}"$`, 'm'));
      expect(toml, name).toMatch(/^description = "/m);
      expect(toml, name).toMatch(/^developer_instructions = """\n/m);

      // The multi-line literal must open and close exactly once. A `"""` left
      // unescaped inside the body would close it early and make the rest of the
      // file parse as garbage keys.
      expect(countOf(toml, '"""'), `${name}: unbalanced triple quotes`).toBe(2);

      const body = toml.slice(toml.indexOf('"""') + 3, toml.lastIndexOf('"""'));
      expect(body.length, name).toBeGreaterThan(100);

      // Every backslash must belong to a valid escape — an unpaired one is a
      // TOML parse error in a basic string.
      const unescaped = body.replace(/\\[\\"btnfru]/g, '');
      expect(unescaped.includes('\\'), `${name}: unpaired backslash in body`).toBe(false);

      // `description` is a single-line basic string: no raw newline may survive.
      const desc = /^description = "((?:[^"\\]|\\.)*)"$/m.exec(toml);
      expect(desc, `${name}: description is not a well-formed basic string`).not.toBeNull();
    }
  });

  it('L1.4 codex agents are emitted outside the shared .agents skills root', () => {
    const root = path.relative(ROOT, agentOutRoot('codex')).replace(/\\/g, '/');
    expect(root).not.toBe('framwork/.agents');
  });

  it('L1.5 contracts.json still declares add.qa-setup and nothing else', () => {
    const contracts = JSON.parse(read(path.join(CODEADD, 'contracts.json')));
    expect(Object.keys(contracts.contracts ?? contracts)).toEqual(['add.qa-setup']);
  });

  it('L1.6 (F3) the qa-pipeline manifest key literal appears exactly once in qa-preflight.sh', () => {
    const src = read(path.join(SCRIPTS, 'qa-preflight.sh'));
    expect(countOf(src, 'qa-pipeline')).toBe(1);
    expect(src).toMatch(/^QA_FEATURE_KEY="qa-pipeline"$/m);
  });

  it('L1.7 (F5) add-ecosystem feature table reads tdd-pipeline in the built provider copy', () => {
    const built = path.join(ROOT, 'framwork', '.claude', 'skills', 'add-ecosystem', 'SKILL.md');
    const content = read(built);
    expect(content).toMatch(/tdd-pipeline/);
    expect(content).not.toMatch(/\|\s*`tdd`\s*\|/);
  });

  it('L1.7 (F5) installer and docs copy read tdd-pipeline at source', () => {
    expect(read(path.join(ROOT, 'cli', 'src', 'installer.js'))).not.toMatch(/TDD is enabled by default/);
    expect(read(path.join(ROOT, 'web', 'src', 'pages', 'docs.astro'))).toMatch(/tdd-pipeline/);
  });
});

describe('0070 L2 — rename migration red-green', () => {
  it('L2.0 registry key is tdd-pipeline with a tdd alias', () => {
    expect(FEATURES['tdd-pipeline']).toBeDefined();
    expect(FEATURES.tdd).toBeUndefined();
    expect(FEATURES['tdd-pipeline'].aliases).toContain('tdd');
    expect(FEATURES['tdd-pipeline'].default).toBe(true);
  });

  it('L2.0 qa-pipeline gates plan and build only — add.test is gone', () => {
    expect(FEATURES['qa-pipeline'].commands).toEqual(['add.plan', 'add.build']);
  });

  it('L2.6 every FEATURES key has a matching fragment directory', () => {
    for (const key of Object.keys(FEATURES)) {
      expect(exists(path.join(FRAGMENTS, key)), `fragments/${key}/ missing`).toBe(true);
    }
  });

  it('L2.6 no orphaned fragment directory exists without a registry key', () => {
    for (const dir of fs.readdirSync(FRAGMENTS)) {
      expect(FEATURES[dir], `fragments/${dir}/ has no registry key`).toBeDefined();
    }
  });
});

describe('0070 L5 — removal integrity', () => {
  const REMOVED = ['add.test', 'add.qa', 'add.autopilot'];
  // /add.qa-setup is retained and must not be caught by an over-broad pattern.
  const ROUTING = /\/add\.(test|qa|autopilot)(?![\w-])/;

  it('L5.2 provider-map registers none of the removed commands', () => {
    for (const name of REMOVED) expect(MAP.commands[name], name).toBeUndefined();
  });

  it('L5.2 provider-map registers add.plan-to-ready for all five providers', () => {
    expect(MAP.commands['add.plan-to-ready']).toBeDefined();
    expect(MAP.commands['add.plan-to-ready'].providers).toBeUndefined();
  });

  it('L5.2 provider-map registers test-agent and fix-agent', () => {
    expect(MAP.agents['test-agent']).toBeDefined();
    expect(MAP.agents['fix-agent']).toBeDefined();
  });

  it('L5.0 removed command sources are deleted', () => {
    for (const name of REMOVED) {
      expect(exists(path.join(COMMANDS, `${name}.md`)), `${name}.md still present`).toBe(false);
    }
    expect(exists(path.join(FRAGMENTS, 'qa-pipeline', 'add.test.md'))).toBe(false);
  });

  it('L5.1 no source artefact routes to a removed command', () => {
    const offenders = [];
    for (const dir of [COMMANDS, AGENTS, SKILLS, SCRIPTS]) {
      walkFiles(dir, /\.(md|sh|json)$/, (full) => {
        if (ROUTING.test(read(full))) offenders.push(path.relative(ROOT, full));
      });
    }
    expect(offenders).toEqual([]);
  });

  it('L5.1 built provider outputs route to no removed command', () => {
    const offenders = [];
    for (const [key, p] of Object.entries(MAP.providers)) {
      walkFiles(path.join(ROOT, p.dir), /\.(md|toml)$/, (full) => {
        if (ROUTING.test(read(full))) offenders.push(`${key}:${path.relative(ROOT, full)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('L5.3 plugin catalog names no removed command', () => {
    const serialized = JSON.stringify(CATALOG);
    expect(serialized).not.toMatch(/"add\.qa"/);
    expect(serialized).not.toMatch(/"add\.test"/);
    expect(CATALOG.playwright.injects).toContain('add.review');
  });

  it('L5.4 add-ecosystem names only commands that exist in provider-map', () => {
    const content = read(path.join(SKILLS, 'add-ecosystem', 'SKILL.md'));
    const named = new Set((content.match(/\/add\.[a-z-]+(?![\w-])/g) || []).map((s) => s.slice(1)));
    for (const name of named) {
      expect(MAP.commands[name], `add-ecosystem names /${name}, absent from provider-map`).toBeDefined();
    }
  });

  it('L5.5 no artefact references review.md as the review output path', () => {
    // `references/review.md` is the doc-schema category FILE, not the review
    // output path — the two are unrelated names that the naive pattern conflates.
    const OUTPUT_PATH = /(?<![-\w/])review\.md/;
    const offenders = [];
    for (const dir of [COMMANDS, AGENTS, SKILLS, SCRIPTS]) {
      walkFiles(dir, /\.(md|sh|bats)$/, (full) => {
        if (OUTPUT_PATH.test(read(full))) offenders.push(path.relative(ROOT, full));
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('0070 L6 — behavioural acceptance', () => {
  const build = () => read(path.join(COMMANDS, 'add.build.md'));
  const review = () => read(path.join(COMMANDS, 'add.review.md'));

  /** Depth of feature-marker nesting at a character offset (0 = ungated base body). */
  function markerDepthAt(src, offset) {
    let depth = 0;
    for (const m of src.matchAll(/<!-- (\/?)feature:[a-z-]+:[a-z0-9-]+ -->/g)) {
      if (m.index > offset) break;
      depth += m[1] === '/' ? -1 : 1;
    }
    return depth;
  }

  it('L6.1 CORRECTION mode runs red-green, never a regeneration sweep', () => {
    const frag = read(path.join(FRAGMENTS, 'tdd-pipeline', 'add.build.md'));
    expect(frag).toMatch(/CORRECTION/);
    expect(frag).toMatch(/red-green|RED[\s\S]{0,40}GREEN/i);
    expect(frag).toMatch(/DO NOT[\s\S]{0,80}(regenerat|rewrite passing)/i);
  });

  it('L6.2 the tdd-pipeline self-check lives in the ungated base body', () => {
    const src = build();
    const notice = src.indexOf('test generation is disabled');
    expect(notice, 'self-detection notice absent from add.build base body').toBeGreaterThan(-1);
    expect(markerDepthAt(src, notice), 'notice nested inside a feature marker pair').toBe(0);
  });

  it('L6.2 the qa-pipeline E2E self-check also lives in the ungated base body', () => {
    const src = build();
    const notice = src.search(/E2E (spec )?authoring is disabled/i);
    expect(notice).toBeGreaterThan(-1);
    expect(markerDepthAt(src, notice)).toBe(0);
  });

  it('L6.3 generation sections exist and anchor at mode-independent points', () => {
    const points = sidecarPoints().filter(
      (p) => p.name === 'tdd-pipeline' && p.resource.name === 'add.build',
    );
    const sections = points.map((p) => p.section);
    for (const s of ['detect-framework', 'test-dispatch', 'coverage']) {
      expect(sections, `missing generation section ${s}`).toContain(s);
    }
  });

  it('L6.4 add.review is read-only on code', () => {
    const src = review();
    expect(src).not.toMatch(/AUTO-CORRECTION RULE/);
    expect(src).toMatch(/read-only/i);
    expect(src).not.toMatch(/QA_BASELINE_INVALIDATED/);

    const reviewer = read(path.join(AGENTS, 'reviewer-agent.md'));
    expect(reviewer).toMatch(/read-only/i);
    expect(reviewer).not.toMatch(/Files Modified/);
  });

  it('L6.5 the review writes both the per-scope qa-validation and the feature-level review-NNN', () => {
    const src = review();
    expect(src).toMatch(/qa-validation-NNN\.md/);
    expect(src).toMatch(/review-NNN\.md/);
  });

  it('L6.6 Fix Routing is a union across scopes, scope-qualified', () => {
    const src = review();
    expect(src).toMatch(/## Fix Routing/);
    expect(src).toMatch(/union/i);
    expect(src).toMatch(/Scope/);
  });

  it('L6.7 the build annex is append-only and finalizes exactly once', () => {
    const src = build();
    expect(src).toMatch(/annex/i);
    expect(src).toMatch(/append-only/i);
    expect(src).toMatch(/finalized/i);
  });

  it('L6.0 the /add.build qa argument mode is retired', () => {
    expect(build()).not.toMatch(/\/add\.build qa/);
  });

  it('L6.0 add.done reads the highest-numbered review-NNN.md', () => {
    const done = read(path.join(COMMANDS, 'add.done.md'));
    expect(done).toMatch(/review-NNN\.md/);
    expect(done).toMatch(/highest/i);
  });

  it('L6.0 the qa-validation schema carries judged-tree and a review schema entry exists', () => {
    const schema = read(path.join(SKILLS, 'add-doc-schemas', 'references', 'review.md'));
    expect(schema).toMatch(/judged-tree/);
    expect(schema).toMatch(/^### review$/m);
    expect(schema).toMatch(/status: open \| finalized/);
  });
});

describe('0070 L7 — loop acceptance', () => {
  const loopPath = path.join(COMMANDS, 'add.plan-to-ready.md');
  const loop = () => read(loopPath);

  it('L7.0 the command exists with frontmatter and an argument hint', () => {
    expect(exists(loopPath)).toBe(true);
    const src = loop();
    expect(src).toMatch(/^---\n/);
    expect(src).toMatch(/argument-hint:/);
  });

  it('L7.0 the cap is 3 per invocation, explicitly not cumulative', () => {
    const src = loop();
    expect(src).toMatch(/3 iterations|at most 3/i);
    expect(src).toMatch(/not cumulative|per invocation/i);
  });

  it('L7.1 the no-progress detector keys on (area, file, symptom) over two consecutive rounds', () => {
    const src = loop();
    expect(src).toMatch(/\(area, file, symptom\)/);
    expect(src).toMatch(/two consecutive/i);
  });

  it('L7.2 the three outcome states are distinct and never softened into one another', () => {
    const src = loop();
    for (const state of ['CONVERGED', 'CAP_REACHED', 'BLOCKED']) {
      expect(src, `missing state ${state}`).toMatch(new RegExp(state));
    }
    expect(src).toMatch(/NEVER[\s\S]{0,120}(soften|as success)/i);
  });

  it('L7.3 the dry-run convergence check never invokes qa-evidence.sh promote', () => {
    const src = loop();
    expect(src).toMatch(/dry-run/i);
    expect(src).toMatch(/4\.0[^\n]{0,6}4\.2/);
    expect(src).toMatch(/NEVER[\s\S]{0,120}promote|promote[\s\S]{0,80}never/i);
  });

  it('L7.4 the plan leg preserves id, created and type and bumps updated', () => {
    const src = loop();
    expect(src).toMatch(/`id:`/);
    expect(src).toMatch(/`created:`/);
    expect(src).toMatch(/`type:`/);
    expect(src).toMatch(/immutable/i);
    expect(src).toMatch(/`updated:`/);
  });

  it('L7.5 a subfeature-scoped run can converge with siblings pending and names them', () => {
    const src = loop();
    expect(src).toMatch(/subfeature/i);
    expect(src).toMatch(/remaining/i);
  });

  it('L7.6 depth discipline — dispatches agent rosters, never commands', () => {
    const src = loop();
    expect(src).toMatch(/depth 1/i);
    expect(src).toMatch(/never dispatch(es)? (a )?command/i);
    // The autopilot defect: an agent told to read a command file and execute it.
    expect(src).not.toMatch(/Read \{\{cmd:add\.(plan|build|review)\}\} — PRIMARY reference/);
  });

  it('L7.6 no dispatched agent is instructed to dispatch another agent', () => {
    for (const name of ['test-agent', 'fix-agent']) {
      const src = read(path.join(AGENTS, `${name}.md`));
      expect(src, name).toMatch(/leaf agent/i);
      expect(src, name).toMatch(/do NOT dispatch other agents/i);
    }
  });

  it('L7.6 fix-agent receives its attempt counter from the caller', () => {
    const src = read(path.join(AGENTS, 'fix-agent.md'));
    expect(src).toMatch(/attempt/i);
    expect(src).toMatch(/caller|coordinator/i);
  });
});
