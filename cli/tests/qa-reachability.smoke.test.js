import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Capture the fail-loud warning channel — an anchor miss/drift must never be silent.
const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { enableFeature, disableFeature } from '../src/features.js';

/**
 * Smoke evidence for plan 0056 (QA pipeline reachability) — pins the end-to-end
 * scenarios the topic touches, on the REAL build outputs:
 *   1. qa-pipeline enable/disable round-trip (byte-identical restore)
 *   2. pre-sidecar enable no-op (silent success the setup step must detect)
 *   3. fragment self-detection notices in always-present built body text
 *   4. add.qa two-phase preflight contract + shared probe script
 *
 * Requires `node scripts/build.js` to have produced framwork/.claude +
 * framwork/.codeadd/injection-points.json (CI builds before testing).
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const BUILT_CLAUDE = path.join(ROOT, 'framwork', '.claude');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const REMEDY = 'codeadd features enable qa-pipeline';

const builtCommand = (name) =>
  fs.readFileSync(path.join(BUILT_CLAUDE, 'commands', `${name}.md`), 'utf8');

let tmp;

function snapshot(file) {
  return fs.readFileSync(file, 'utf8');
}

// A real installed project carries LF files (the release ZIP is built on CI).
// A Windows checkout with core.autocrlf=true materializes CRLF instead, which
// the LF-based injection regexes don't match — normalize the fixture so the
// suite reproduces the real installed state on any checkout config.
function normalizeLineEndings(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) normalizeLineEndings(p);
    else if (/\.(md|json)$/.test(entry.name)) {
      const raw = fs.readFileSync(p, 'utf8');
      if (raw.includes('\r\n')) fs.writeFileSync(p, raw.replaceAll('\r\n', '\n'), 'utf8');
    }
  }
}

beforeEach(() => {
  warnSpy.mockClear();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-reach-'));
  fs.cpSync(BUILT_CLAUDE, path.join(tmp, '.claude'), { recursive: true });
  fs.cpSync(CODEADD, path.join(tmp, '.codeadd'), { recursive: true });
  normalizeLineEndings(tmp);
  fs.writeFileSync(
    path.join(tmp, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} }, null, 2),
  );
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('scenario 1 — qa-pipeline enable/disable round-trip', () => {
  it('enable injects all three gated commands, disable restores byte-identically', () => {
    const targets = ['add.plan', 'add.test', 'add.build'].map((n) =>
      path.join(tmp, '.claude', 'commands', `${n}.md`),
    );
    const before = Object.fromEntries(targets.map((f) => [f, snapshot(f)]));

    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(modified).toBeGreaterThan(0);

    expect(snapshot(targets[0])).toContain('STEP 10.0'); // QA-Spec step landed in add.plan
    expect(snapshot(targets[1])).toContain('E2E Spec Authoring'); // e2e-dispatch landed in add.test
    expect(snapshot(targets[2])).toContain('QA-Fix Flow'); // qa-fix landed in add.build
    for (const f of targets) if (snapshot(f) !== before[f]) expect(snapshot(f)).not.toContain('<!--');

    disableFeature(tmp, 'qa-pipeline');
    for (const f of targets) expect(snapshot(f)).toBe(before[f]);
  });
});

describe('scenario 2 — pre-sidecar enable no-op (features.js:85)', () => {
  it('with injection-points.json absent, enable injects nothing yet marks the feature on', () => {
    fs.rmSync(path.join(tmp, '.codeadd', 'injection-points.json'));

    const { modified } = enableFeature(tmp, 'qa-pipeline');

    // Pins the exact silent-success defect the add.qa-setup gate step must
    // detect (post-enable verification). If the CLI ever starts failing loud
    // here, the command guidance must be revisited — this test will flag it.
    expect(modified).toBe(0);
    const manifest = JSON.parse(snapshot(path.join(tmp, '.codeadd', 'manifest.json')));
    expect(manifest.features['qa-pipeline']).toBe(true);
  });
});

describe('scenario 3 — fragment self-detection notices (always-present body text)', () => {
  it('built add.plan carries the OFF-state notice with the exact remedy', () => {
    expect(builtCommand('add.plan')).toContain(REMEDY);
  });

  it('built add.test carries the OFF-state notice with the exact remedy', () => {
    expect(builtCommand('add.test')).toContain(REMEDY);
  });

  it('built add.build retains its existing self-detection stop (pattern origin)', () => {
    expect(builtCommand('add.build')).toContain(REMEDY);
  });
});

describe('scenario 4 — add.qa preflight contract + shared probe script', () => {
  it('qa-preflight.sh exists in the source scripts dir', () => {
    expect(fs.existsSync(path.join(CODEADD, 'scripts', 'qa-preflight.sh'))).toBe(true);
  });

  it('built add.qa invokes the shared probe script and declares block/degrade phases', () => {
    const qa = builtCommand('add.qa');
    expect(qa).toContain('.codeadd/scripts/qa-preflight.sh');
    expect(qa).toContain('Phase A');
    expect(qa).toContain('Phase B');
    expect(qa).toContain('degrade');
  });

  it('built add.qa-setup carries the feature-gate opt-in with the exact remedy', () => {
    const setup = builtCommand('add.qa-setup');
    expect(setup).toContain(REMEDY);
    expect(setup).toContain('.codeadd/scripts/qa-preflight.sh');
  });
});

// ---------------------------------------------------------------------------
// Scenario 5 — UX agent trio ownership (plan 0057: ux-agent, ux-flow-agent,
// ux-layout-agent own the design contract; add.design is a thin dispatcher)
// ---------------------------------------------------------------------------

describe('scenario 5 — UX agent design ownership', () => {
  const mapPath = path.join(ROOT, 'framwork', 'provider-map.json');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const agentFile = (name) =>
    path.join(ROOT, 'framwork', '.claude', 'agents', `${name}.md`);

  it('built add.plan contains the 8.1 UX step and the 8.4 Frontend Specialist line', () => {
    const plan = builtCommand('add.plan');
    expect(plan).toContain('### 8.1 UX Design Specialist');
    expect(plan).toContain('- 8.4: Frontend Specialist');
  });

  it('the qa-pipeline enable/disable round-trip is still byte-identical after the anchor rename', () => {
    // Re-asserts scenario 1's invariant explicitly under this topic: the STEP
    // 8.1 renumber (plan 0057) must not have broken the anchor-based injection.
    const targets = ['add.plan', 'add.test', 'add.build'].map((n) =>
      path.join(tmp, '.claude', 'commands', `${n}.md`),
    );
    const before = Object.fromEntries(targets.map((f) => [f, snapshot(f)]));

    enableFeature(tmp, 'qa-pipeline');
    expect(warnSpy).not.toHaveBeenCalled();
    disableFeature(tmp, 'qa-pipeline');

    for (const f of targets) expect(snapshot(f)).toBe(before[f]);
  });

  it('provider-map registers ux-flow-agent and ux-layout-agent, and their built agent files exist', () => {
    expect(map.agents).toHaveProperty('ux-flow-agent');
    expect(map.agents).toHaveProperty('ux-layout-agent');
    expect(fs.existsSync(agentFile('ux-flow-agent'))).toBe(true);
    expect(fs.existsSync(agentFile('ux-layout-agent'))).toBe(true);
  });

  it('built ux-agent.md has no memory: line; built ux-flow-agent.md has memory: project', () => {
    const uxAgent = fs.readFileSync(agentFile('ux-agent'), 'utf8');
    const uxFlowAgent = fs.readFileSync(agentFile('ux-flow-agent'), 'utf8');
    expect(uxAgent).not.toMatch(/^memory:/m);
    expect(uxFlowAgent).toMatch(/^memory: project$/m);
  });

  it('built add.design has no [STOP] and no COMPLEXITY GATE (thin dispatcher, no approval gates)', () => {
    const design = builtCommand('add.design');
    expect(design).not.toContain('[STOP]');
    expect(design).not.toContain('COMPLEXITY GATE');
  });
});

// ---------------------------------------------------------------------------
// Scenario 6 — layout notation & the measurable Design Contract (plan 0058:
// layout tree replaces ASCII, ## Design Contract schema, computed-style capture)
// ---------------------------------------------------------------------------

describe('scenario 6 — layout notation & Design Contract', () => {
  const builtAgent = (name) =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'agents', `${name}.md`), 'utf8');
  const builtSkill = (name, file = 'SKILL.md') =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'skills', name, file), 'utf8');

  it('built ux-layout-agent contains "layout tree" and no "ASCII layout"', () => {
    const uxLayoutAgent = builtAgent('ux-layout-agent');
    expect(uxLayoutAgent).toContain('layout tree');
    expect(uxLayoutAgent).not.toContain('ASCII layout');
  });

  it('built new-feature.md reference file ships the exact "## Design Contract" string', () => {
    const newFeature = builtSkill('add-doc-schemas', path.join('references', 'new-feature.md'));
    expect(newFeature).toContain('## Design Contract');
  });

  it('e2e-dispatch fragment content mentions computed-styles', () => {
    const fragment = fs.readFileSync(
      path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.test.md'),
      'utf8',
    );
    expect(fragment).toContain('computed-styles');

    // Confirm it actually lands in a real installed project via the same
    // enable path scenario 1 exercises (byte-for-byte injected content).
    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(modified).toBeGreaterThan(0);
    const injected = snapshot(path.join(tmp, '.claude', 'commands', 'add.test.md'));
    expect(injected).toContain('computed-styles');
    disableFeature(tmp, 'qa-pipeline');
  });

  it('built add-ux-design skill carries the Design Contract dimensions table (Verified by header)', () => {
    const uxDesignSkill = builtSkill('add-ux-design');
    expect(uxDesignSkill).toContain('Verified by');
    expect(uxDesignSkill).toContain('## Design Contract Dimensions');
  });
});

describe('scenario 7 — dual-judge QA validation (plan 0059)', () => {
  const builtAgent = (name) =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'agents', `${name}.md`), 'utf8');
  const builtSkill = (name, file = 'SKILL.md') =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'skills', name, file), 'utf8');
  const sidecar = () =>
    JSON.parse(fs.readFileSync(path.join(CODEADD, 'injection-points.json'), 'utf8'));

  it('built add.qa dispatches @ux-agent ∥ @qa-agent and resolves run-NNN at STEP 4.1', () => {
    const qa = builtCommand('add.qa');
    expect(qa).toContain('@ux-agent');
    expect(qa).toContain('@qa-agent');
    expect(qa).toMatch(/PARALLEL, WAIT-ALL/);
    expect(qa).toMatch(/4\.1 RESOLVE run-NNN FIRST/);
  });

  it('built qa-agent carries no memory: line and a root-cause taxonomy', () => {
    const qaAgent = builtAgent('qa-agent');
    expect(qaAgent).not.toMatch(/^memory:/m);
    expect(qaAgent.toLowerCase()).toContain('root cause');
    expect(qaAgent).toContain('missing-implementation');
  });

  it('built ux-agent carries the review-mode rubric (context, not immunity) and spec-gap', () => {
    const uxAgent = builtAgent('ux-agent');
    expect(uxAgent).toContain('context, not immunity');
    expect(uxAgent).toContain('spec-gap');
  });

  it('built qa-validation schema reference declares spec-gap + unverifiable', () => {
    const review = builtSkill('add-doc-schemas', path.join('references', 'review.md'));
    expect(review).toContain('spec-gap');
    expect(review).toContain('unverifiable');
  });

  it('built add-qa skill documents the axis split + merge rules, no stale N-axis wording', () => {
    const skill = builtSkill('add-qa');
    expect(skill).toMatch(/Axis ownership/i);
    expect(skill).toContain('Root-cause Taxonomy');
    expect(skill).toContain('Merge Rules');
    expect(skill).not.toMatch(/\d-axis|dual-axis/i);
  });

  // Pins the plugin:playwright:drive anchor text on both resources so the STEP 4
  // restructure (or any future edit to the adjacent prose) can never silently
  // move the injection point — an anchor rename would fail this immediately.
  it('the playwright:drive anchor text stays pinned on add.qa and qa-agent', () => {
    const pts = sidecar().points.filter(
      (p) => p.namespace === 'plugin' && p.name === 'playwright' && p.section === 'drive',
    );
    const qaAgentPt = pts.find((p) => p.resource.name === 'qa-agent');
    const addQaPt = pts.find((p) => p.resource.name === 'add.qa');
    expect(qaAgentPt.anchor.text).toBe(
      'By default you judge from the persisted evidence (read-PNG mode). If the Playwright plugin is enabled, the live-driving playbook below is injected and you may additionally drive the app.',
    );
    expect(addQaPt.anchor.text).toBe('WAIT-ALL before STEP 5.');
  });
});

describe('scenario 8 — QA fix routing (plan 0060)', () => {
  const builtSkill = (name, file = 'SKILL.md') =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'skills', name, file), 'utf8');

  it('built qa-validation schema declares Fix Routing + judged-contract + required route', () => {
    const review = builtSkill('add-doc-schemas', path.join('references', 'review.md'));
    expect(review).toContain('Fix Routing');
    expect(review).toContain('judged-contract');
    expect(review).toContain('REQUIRED `route`');
  });

  it('built add-qa skill carries the routing rules table + capability validation, no confidence field', () => {
    const skill = builtSkill('add-qa');
    expect(skill).toContain('## Fix Routing');
    expect(skill).toMatch(/Routing rules/i);
    expect(skill).toContain('Capability validation');
    expect(skill).toContain('contract-inadequate');
    expect(skill).toMatch(/no confidence score/i);
  });

  it('built add.qa STEP 5.5 derives routes and STEP 6 reports per responsible agent', () => {
    const qa = builtCommand('add.qa');
    expect(qa).toMatch(/5\.5 Derive routes/);
    expect(qa).toContain('judged-contract');
    expect(qa).toMatch(/per responsible agent/i);
  });

  it('qa-fix fragment dispatches by route with a legacy fallback, and injects into add.build', () => {
    const fragment = fs.readFileSync(
      path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
      'utf8',
    );
    expect(fragment).toMatch(/DISPATCH by ROUTE/);
    expect(fragment).toMatch(/Legacy fallback/i);

    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(modified).toBeGreaterThan(0);
    const injected = snapshot(path.join(tmp, '.claude', 'commands', 'add.build.md'));
    expect(injected).toMatch(/DISPATCH by ROUTE/);
    disableFeature(tmp, 'qa-pipeline');
  });

  it('built add.build Named Agent Mapping lists @e2e-agent and @ux-agent', () => {
    const build = builtCommand('add.build');
    const mapping = build.slice(build.indexOf('Named Agent Mapping'));
    expect(mapping).toContain('@e2e-agent');
    expect(mapping).toContain('@ux-agent');
  });

  it('plugins.json keeps playwright.agents = [qa-agent] (ux-agent never live-drives)', () => {
    const plugins = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'cli', 'src', 'plugins.json'), 'utf8'),
    );
    const pw = plugins.playwright ?? plugins.plugins?.playwright;
    expect(pw.agents.map((a) => a.agent)).toEqual(['qa-agent']);
  });
});
