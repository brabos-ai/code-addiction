import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    intro: vi.fn(),
    outro: vi.fn(),
    log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy },
  };
});

const require = createRequire(import.meta.url);
const { readMap } = require('../../scripts/build.js');

import { FEATURES, enableFeature, disableFeature } from '../src/features.js';

/**
 * Plan 0073 — Hotfix Delivery Review.
 * Red-Green Validation Matrix, levels L1 through L4.
 *
 * Every level here was written RED against the pre-0073 tree: the three judge
 * agents did not exist, add.hotfix was not a tdd-pipeline target, and neither
 * STEP 9 nor STEP 10 existed. A level that passes before its F-block lands is a
 * level that does not bite.
 *
 * L3 (combination matrix) and the enable/disable round-trip are NOT duplicated
 * here: injection-exclusivity.integration.test.js and
 * injection-roundtrip.integration.test.js are data-driven off FEATURES and the
 * sidecar, so they pick up add.hotfix automatically once F7 registers it. Their
 * hardcoded point total is the one thing that must move, asserted there.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const COMMANDS = path.join(CODEADD, 'commands');
const AGENTS = path.join(CODEADD, 'agents');
const FRAGMENTS = path.join(CODEADD, 'fragments');
const SKILLS = path.join(CODEADD, 'skills');
const SIDECAR = path.join(CODEADD, 'injection-points.json');
const BUILT_CLAUDE = path.join(ROOT, 'framwork', '.claude');
const MAP = readMap();

const read = (p) => fs.readFileSync(p, 'utf8');
const sidecarPoints = () => JSON.parse(read(SIDECAR)).points;

const HOTFIX_SRC = () => read(path.join(COMMANDS, 'add.hotfix.md'));
const JUDGES = ['security-agent', 'conformance-agent', 'failure-analysis-agent'];

/** Providers that receive agent files, per the build registry. */
const agentProviders = () =>
  Object.entries(MAP.providers)
    .filter(([, p]) => p.agents)
    .map(([k]) => k);

function agentOutFile(providerKey, name) {
  const p = MAP.providers[providerKey];
  const root = path.join(ROOT, p.agentsDir || p.dir);
  return path.join(root, p.agents.replace('{name}', name));
}

/**
 * Top-level `## STEP <n>:` headings in source order. Sub-numbering (`### 8.1`)
 * is deliberately excluded — the integer rule governs steps, not subtopics.
 */
function stepNumbers(src) {
  return [...src.matchAll(/^## STEP ([0-9]+)(?:-([0-9]+))?:/gm)].flatMap((m) =>
    m[2] ? [Number(m[1]), Number(m[2])] : [Number(m[1])],
  );
}

// ---------------------------------------------------------------------------
// L1 — build side
// ---------------------------------------------------------------------------

describe('0073 L1 — build side', () => {
  it('L1.2 add.hotfix carries exactly one tdd-pipeline injection point', () => {
    const pts = sidecarPoints().filter(
      (p) => p.namespace === 'feature' && p.name === 'tdd-pipeline' && p.resource.name === 'add.hotfix',
    );
    expect(pts).toHaveLength(1);
    expect(pts[0].anchor.text).not.toMatch(/\{\{(?:cmd|skill|addpath):/);
    expect(pts[0].anchor.text.length).toBeGreaterThan(0);
  });

  it('L1.2 the tdd-pipeline marker pair in add.hotfix is empty and balanced', () => {
    const src = HOTFIX_SRC();
    const opens = src.match(/<!-- feature:tdd-pipeline:[a-z0-9-]+ -->/g) || [];
    const pairs =
      src.match(/<!-- feature:tdd-pipeline:([a-z0-9-]+) -->\s*<!-- \/feature:tdd-pipeline:\1 -->/g) || [];
    expect(opens.length).toBe(1);
    expect(pairs.length).toBe(opens.length);
  });

  it('L1.3 every built provider copy of add.hotfix is marker-free', () => {
    for (const [key, p] of Object.entries(MAP.providers)) {
      if (!p.commands) continue;
      const file = path.join(ROOT, p.dir, p.commands.replace('{name}', 'add.hotfix'));
      if (!fs.existsSync(file)) continue;
      expect(read(file), `${key} add.hotfix`).not.toMatch(/<!--\s*\/?(?:feature|plugin):/);
    }
  });

  it('L1.4 the gitnexus anchor on add.hotfix is preserved byte-for-byte', () => {
    const gitnexus = sidecarPoints().filter(
      (p) => p.namespace === 'plugin' && p.name === 'gitnexus' && p.resource.name === 'add.hotfix',
    );
    expect(gitnexus).toHaveLength(1);
    // These two strings are the contract F5 must not disturb. The anchor line
    // must stay present and variable-free, and nothing may be inserted between
    // it and the marker (which would change `next`).
    expect(gitnexus[0].anchor.text).toBe('- [ ] On branch `hotfix/*`');
    expect(gitnexus[0].anchor.next).toBe('### 8.1 Consult Knowledge Base');
    expect(gitnexus[0].anchor.position).toBe('after');
  });

  it('L1.4 the anchor line survives verbatim in the source', () => {
    expect(HOTFIX_SRC()).toContain('- [ ] On branch `hotfix/*`');
  });

  it('L1.5 the three judge agents are registered in provider-map', () => {
    for (const name of JUDGES) {
      expect(Object.keys(MAP.agents), name).toContain(name);
      expect(MAP.agents[name].description, `${name} description`).toBeTruthy();
    }
  });

  it('L1.5 each judge agent is emitted for every agent-capable provider', () => {
    for (const name of JUDGES) {
      for (const provider of agentProviders()) {
        const out = agentOutFile(provider, name);
        expect(fs.existsSync(out), `${provider}/${name}`).toBe(true);
      }
    }
  });

  it('L1.5 codex emits each judge as TOML carrying the body in developer_instructions', () => {
    for (const name of JUDGES) {
      const out = agentOutFile('codex', name);
      const toml = read(out);
      expect(toml, name).toMatch(/^name = /m);
      expect(toml, name).toMatch(/developer_instructions = /);
    }
  });

  it('L1.5 read-only enforcement reaches every dialect, not only prose', () => {
    for (const name of JUDGES) {
      const src = read(path.join(AGENTS, `${name}.md`));
      // `readonly: true` is what the build translates per provider...
      expect(src, `${name} readonly flag`).toMatch(/^readonly:\s*true$/m);
      // ...but the Claude dialect passes through only model/tools/disallowedTools/
      // skills/memory, so without this the agent is writable on Claude.
      expect(src, `${name} disallowedTools`).toMatch(/^disallowedTools:.*Write.*Edit/m);
      // A judge must re-derive every verdict from the current diff.
      expect(src, `${name} must not carry memory:`).not.toMatch(/^memory:/m);

      expect(read(agentOutFile('opencode', name)), `${name} opencode`).toContain('edit: deny');
      expect(read(agentOutFile('cursor', name)), `${name} cursor`).toMatch(/^readonly: true$/m);
      expect(read(agentOutFile('claude', name)), `${name} claude`).toMatch(/^disallowedTools:/m);
    }
  });
});

// ---------------------------------------------------------------------------
// L2 — CLI feature toggle
// ---------------------------------------------------------------------------

describe('0073 L2 — tdd-pipeline reaches add.hotfix', () => {
  let tmp;

  beforeEach(() => {
    warnSpy.mockClear();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-0073-'));
    fs.cpSync(BUILT_CLAUDE, path.join(tmp, '.claude'), { recursive: true });
    fs.cpSync(CODEADD, path.join(tmp, '.codeadd'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} }, null, 2),
    );
  });

  afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const installed = () => path.join(tmp, '.claude', 'commands', 'add.hotfix.md');

  it('L2.1 the registry lists add.hotfix as a tdd-pipeline target', () => {
    expect(FEATURES['tdd-pipeline'].commands).toContain('add.hotfix');
  });

  it('L2.1 a fragment exists for add.hotfix', () => {
    expect(fs.existsSync(path.join(FRAGMENTS, 'tdd-pipeline', 'add.hotfix.md'))).toBe(true);
  });

  it('L2.2 disabled: the installed command carries no RED block', () => {
    const body = read(installed());
    expect(body).not.toMatch(/@test-agent/);
    expect(body).not.toMatch(/RED_TEST/);
  });

  it('L2.3 enabled: each fragment section lands exactly once, then disable restores bytes', () => {
    const before = read(installed());

    const { modified } = enableFeature(tmp, 'tdd-pipeline');
    expect(warnSpy).not.toHaveBeenCalled(); // no anchor miss — the anchor resolved
    expect(modified).toBeGreaterThan(0);

    const after = read(installed());
    expect(after).not.toBe(before); // the fragment actually reached this file
    expect(after).not.toContain('<!--'); // installed files stay marker-free
    expect(after).toMatch(/@test-agent/);
    expect(after).toMatch(/RED_TEST/);

    const fragment = read(path.join(FRAGMENTS, 'tdd-pipeline', 'add.hotfix.md'));
    const sections = [...fragment.matchAll(/<!-- section:([a-z0-9-]+) -->/g)].map((m) => m[1]);
    expect(sections.length).toBeGreaterThan(0);

    disableFeature(tmp, 'tdd-pipeline');
    expect(read(installed())).toBe(before); // byte-identical restore
  });
});

// ---------------------------------------------------------------------------
// L4 — behavioural acceptance on the shipped artefacts
// ---------------------------------------------------------------------------

describe('0073 L4 — behavioural acceptance', () => {
  const judgeSrc = (name) => read(path.join(AGENTS, `${name}.md`));

  it('L4.1 every judge states a pre-existing finding can never be a blocker', () => {
    for (const name of JUDGES) {
      const src = judgeSrc(name);
      expect(src, `${name} pre-existing`).toMatch(/pre-existing/i);
      expect(src, `${name} never a blocker`).toMatch(/never\s+(?:be\s+)?(?:a\s+)?blocker/i);
      expect(src, `${name} diff scope`).toMatch(/introduced by (?:this|the) (?:diff|change)/i);
    }
  });

  it('L4.2 no axis is owned by two judges', () => {
    const sec = judgeSrc('security-agent');
    const con = judgeSrc('conformance-agent');
    const fail = judgeSrc('failure-analysis-agent');
    // Each judge names the axes it must NOT judge.
    expect(sec).toMatch(/do not judge/i);
    expect(con).toMatch(/OWASP/);
    expect(con).toMatch(/do not judge/i);
    expect(fail).toMatch(/do not judge/i);
    // Only the security judge claims OWASP ownership.
    expect(sec).toMatch(/you own[^.]*OWASP/i);
    expect(con).not.toMatch(/you own[^.]*OWASP/i);
    expect(fail).not.toMatch(/you own[^.]*OWASP/i);
  });

  it('L4.3 every judge is bound to the evidence contract, and the coordinator re-reads citations', () => {
    for (const name of JUDGES) {
      const src = judgeSrc(name);
      expect(src, `${name} path:line`).toMatch(/path:line|file:line|`[^`]+:\d+`/i);
      expect(src, `${name} rule citation`).toMatch(/cite|citation/i);
      expect(src, `${name} failure path`).toMatch(/failure path|concrete/i);
    }
    // The coordinator's own check — a hallucinated citation dies here.
    expect(HOTFIX_SRC()).toMatch(/read the cited lines/i);
  });

  it('L4.4 RED is coordinator-verified and the escape is recorded', () => {
    const frag = read(path.join(FRAGMENTS, 'tdd-pipeline', 'add.hotfix.md'));
    expect(frag).toMatch(/RED_TEST: none/);
    expect(frag).toMatch(/REASON/);
    // The agent's own report field is never the proof.
    expect(frag).toMatch(/TESTS_PASSING/);
    expect(frag).toMatch(/coordinator/i);
    expect(frag).toMatch(/right reason/i);
  });

  it('L4.5 the conformance judge cannot ground a blocker on a stale wiki page', () => {
    const src = judgeSrc('conformance-agent');
    expect(src).toMatch(/git diff --name-only/);
    expect(src).toMatch(/unverifiable/i);
    expect(src).toMatch(/wiki-drift/);
    expect(src).toMatch(/add\.wiki/);
  });

  it('L4.6 the corrective pass re-verifies the build and the RED test', () => {
    const src = HOTFIX_SRC();
    const step10 = src.slice(src.indexOf('## STEP 10:'), src.indexOf('## STEP 11:'));
    expect(step10.length).toBeGreaterThan(0);
    expect(step10).toMatch(/re-?run/i);
    expect(step10).toMatch(/8\.3/); // the build verification sub-step
    expect(step10).toMatch(/GREEN/);
  });

  it('L4.7 the blast radius is retained at STEP 5 and consumed at STEP 9', () => {
    const src = HOTFIX_SRC();
    const step5 = src.slice(src.indexOf('## STEP 5:'), src.indexOf('## STEP 6:'));
    expect(step5).toMatch(/STEP 9/); // retention clause names its consumer
    // ...and the consumer names the set.
    expect(judgeSrc('failure-analysis-agent')).toMatch(/blast radius/i);
  });

  it('L4.8 STEP 10 partitions findings by disposition before presenting', () => {
    const src = HOTFIX_SRC();
    const step10 = src.slice(src.indexOf('## STEP 10:'), src.indexOf('## STEP 11:'));
    for (const d of ['introduced', 'pre-existing', 'unverifiable']) {
      expect(step10, `disposition ${d}`).toMatch(new RegExp(d, 'i'));
    }
  });

  it('L4.9 step numbering is integer and contiguous, with no orphan', () => {
    const nums = stepNumbers(HOTFIX_SRC());
    expect(nums.length).toBeGreaterThan(0);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    expect(nums[0]).toBe(1);
    expect(nums[nums.length - 1]).toBe(16);
    // contiguous: every integer from 1..16 appears exactly once
    expect(nums).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    // and no fractional STEP heading survives anywhere
    expect(HOTFIX_SRC()).not.toMatch(/^## STEP \d+\.\d+:/m);
  });

  it('L4.9 the step list and the bodies name the same steps', () => {
    const src = HOTFIX_SRC();
    const listBlock = src.slice(src.indexOf('**STEPS IN ORDER:**'), src.indexOf('**⛔ ABSOLUTE PROHIBITIONS'));
    const listed = [...listBlock.matchAll(/^STEP ([0-9]+)(?:-([0-9]+))?:/gm)].flatMap((m) =>
      m[2] ? [Number(m[1]), Number(m[2])] : [Number(m[1])],
    );
    expect(listed).toEqual(stepNumbers(src));
  });

  it('L4.10 hotfix-about declares a Review section', () => {
    const fix = read(path.join(SKILLS, 'add-doc-schemas', 'references', 'fix.md'));
    const about = fix.slice(fix.indexOf('### hotfix-about'), fix.indexOf('### hotfix-related'));
    expect(about).toMatch(/\bReview\b/);
    expect(about).toMatch(/disposition/i);
    // The evidence discipline is referenced, not restated.
    expect(fix).toMatch(/Finding & Evidence Discipline/);
  });

  it('L4.11 the ecosystem map lists all three judges and wires them to add.hotfix', () => {
    // Asserted on the built provider copy: a stale build is caught too.
    const built = path.join(BUILT_CLAUDE, 'skills', 'add-ecosystem', 'SKILL.md');
    const eco = read(built);
    for (const name of JUDGES) expect(eco, name).toContain(name);
    const hotfixRow = eco.split('\n').find((l) => l.startsWith('| add.hotfix '));
    expect(hotfixRow).toBeTruthy();
    for (const name of JUDGES) expect(hotfixRow, `${name} on add.hotfix row`).toContain(name);
  });
});
