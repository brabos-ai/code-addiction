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
 *   4. the two-phase QA preflight contract (absorbed into add.review) + shared probe script
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
  it('enable injects both gated commands, disable restores byte-identically', () => {
    // Plan 0070: add.test was absorbed, so e2e-dispatch and qa-fix now share
    // add.build as their host.
    const targets = ['add.plan', 'add.build'].map((n) =>
      path.join(tmp, '.claude', 'commands', `${n}.md`),
    );
    const before = Object.fromEntries(targets.map((f) => [f, snapshot(f)]));

    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(modified).toBeGreaterThan(0);

    expect(snapshot(targets[0])).toContain('STEP 10.0'); // QA-Spec step landed in add.plan
    expect(snapshot(targets[1])).toContain('E2E Spec Authoring'); // e2e-dispatch landed in add.build
    expect(snapshot(targets[1])).toContain('QA-Routed Correction'); // qa-fix landed in add.build
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

  it('built add.build carries the E2E OFF-state notice with the exact remedy', () => {
    // Migrated from add.test with the section it describes. It must sit in the
    // UNGATED base body: a notice nested in the block it reports on cannot
    // render when that block was not injected.
    const build = builtCommand('add.build');
    expect(build).toContain(REMEDY);
    expect(build).toMatch(/E2E spec authoring is disabled/i);
  });

  it('built add.build carries the test-generation OFF-state notice', () => {
    const build = builtCommand('add.build');
    expect(build).toContain('codeadd features enable tdd-pipeline');
    expect(build).toMatch(/test generation is disabled/i);
  });
});

describe('scenario 4 — QA preflight contract + shared probe script', () => {
  it('qa-preflight.sh exists in the source scripts dir', () => {
    expect(fs.existsSync(path.join(CODEADD, 'scripts', 'qa-preflight.sh'))).toBe(true);
  });

  // Plan 0070: the preflight contract was absorbed into add.review's base body,
  // self-gating on the add.qa-setup receipt rather than on a feature flag.
  it('built add.review invokes the shared probe script and declares block/degrade phases', () => {
    const review = builtCommand('add.review');
    expect(review).toContain('.codeadd/scripts/qa-preflight.sh');
    expect(review).toContain('Phase A');
    expect(review).toContain('Phase B');
    expect(review).toContain('degrade');
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
    const targets = ['add.plan', 'add.build'].map((n) =>
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

  it('add.design is not a shipped command', () => {
    const src = path.join(ROOT, 'framwork', '.codeadd', 'commands', 'add.design.md');
    expect(fs.existsSync(src)).toBe(false);
    const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));
    expect(map.commands['add.design']).toBeUndefined();
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
    // Plan 0070: the section moved host from add.test to add.build.
    const fragment = fs.readFileSync(
      path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
      'utf8',
    );
    expect(fragment).toContain('computed-styles');

    // Confirm it actually lands in a real installed project via the same
    // enable path scenario 1 exercises (byte-for-byte injected content).
    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(modified).toBeGreaterThan(0);
    const injected = snapshot(path.join(tmp, '.claude', 'commands', 'add.build.md'));
    expect(injected).toContain('computed-styles');
    disableFeature(tmp, 'qa-pipeline');
  });

  it('Design Contract dimensions table ships in add-ux-design/design-contract.md, indexed from SKILL.md', () => {
    const contract = builtSkill('add-ux-design', 'design-contract.md');
    expect(contract).toContain('Verified by');
    expect(contract).toContain('## Design Contract Dimensions');
    expect(contract).toContain('## Layout Tree Notation');
    // Progressive disclosure: the dispatcher indexes, it does not restate.
    const uxDesignSkill = builtSkill('add-ux-design');
    expect(uxDesignSkill).toContain('design-contract.md');
    expect(uxDesignSkill).not.toContain('## Design Contract Dimensions');
  });

  it('critique rubric ships as its own reference file, indexed from SKILL.md', () => {
    const rubric = builtSkill('add-ux-design', 'critique-rubric.md');
    expect(rubric).toMatch(/Binds the CRITIC only/i);
    expect(rubric).toMatch(/empty critique/i);
    // Structural invariant, not a reworded-prose pin (L6): the rubric's numbered
    // item list lives in the reference file and nowhere else. SKILL.md keeps only
    // a one-line index pointing at it.
    const skill = builtSkill('add-ux-design');
    expect(skill).toMatch(/critique-rubric\.md/);
    expect(rubric).toMatch(/^\s*\|?\s*1[.|]/m);
    expect(skill).not.toMatch(/adversarial pass/i);
  });
});

describe('scenario 7 — dual-judge QA validation (plan 0059)', () => {
  const builtAgent = (name) =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'agents', `${name}.md`), 'utf8');
  const builtSkill = (name, file = 'SKILL.md') =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'skills', name, file), 'utf8');
  const sidecar = () =>
    JSON.parse(fs.readFileSync(path.join(CODEADD, 'injection-points.json'), 'utf8'));

  it('built add.review dispatches @ux-agent ∥ @qa-agent and resolves run-NNN before capture', () => {
    // Plan 0070: absorbed into add.review as STEP 9 (evidence) + STEP 10 (judgement).
    const review = builtCommand('add.review');
    expect(review).toContain('@ux-agent');
    expect(review).toContain('@qa-agent');
    expect(review).toMatch(/PARALLEL, WAIT-ALL/);
    expect(review).toMatch(/Resolve `run-NNN` FIRST/i);
  });

  it('built qa-agent is read-only, memory-free, and cites the taxonomy rather than copying it', () => {
    const qaAgent = builtAgent('qa-agent');
    expect(qaAgent).not.toMatch(/^memory:/m);
    expect(qaAgent).toMatch(/^disallowedTools:.*Write.*Edit/m);
    expect(qaAgent.toLowerCase()).toContain('root cause');
    // Canonical taxonomy lives in the skill; the agent must not restate it.
    expect(qaAgent).not.toContain('missing-implementation');
    expect(builtSkill('add-qa')).toContain('missing-implementation');
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

  it('built add-qa skill documents the axis split + taxonomy, no stale N-axis wording', () => {
    const skill = builtSkill('add-qa');
    expect(skill).toMatch(/Axis ownership/i);
    expect(skill).toContain('Root-cause Taxonomy');
    expect(skill).not.toMatch(/\d-axis|dual-axis/i);
  });

  // Coordinator-only content lives in a reference file the judges never load.
  it('merge rules live in add-qa/references/coordinator.md, not in the judge-loaded SKILL.md', () => {
    const coordinator = builtSkill('add-qa', path.join('references', 'coordinator.md'));
    expect(coordinator).toContain('## Merge Rules');
    expect(builtSkill('add-qa')).not.toContain('## Merge Rules');
  });

  // Pins the plugin:playwright:drive anchor text on both resources so the STEP 4
  // restructure (or any future edit to the adjacent prose) can never silently
  // move the injection point — an anchor rename would fail this immediately.
  it('the playwright:drive anchor text stays pinned on add.review and qa-agent', () => {
    const pts = sidecar().points.filter(
      (p) => p.namespace === 'plugin' && p.name === 'playwright' && p.section === 'drive',
    );
    const qaAgentPt = pts.find((p) => p.resource.name === 'qa-agent');
    const addQaPt = pts.find((p) => p.resource.name === 'add.review');
    expect(qaAgentPt.anchor.text).toBe(
      'By default you judge from the persisted evidence (read-PNG mode). If the Playwright plugin is enabled, the live-driving playbook below is injected and you may additionally drive the app.',
    );
    expect(addQaPt.anchor.text).toBe('**WAIT-ALL before 10.2.**');
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

  it('built add-qa coordinator reference carries the routing rules + capability validation, no confidence field', () => {
    const coordinator = builtSkill('add-qa', path.join('references', 'coordinator.md'));
    expect(coordinator).toContain('## Fix Routing');
    expect(coordinator).toMatch(/Routing rules/i);
    expect(coordinator).toContain('Capability validation');
    expect(coordinator).toContain('contract-inadequate');
    expect(coordinator).toMatch(/no confidence score/i);
    // The judges are told not to emit routes — the routing RULES must not ride
    // along in the skill they preload. (The report template legitimately keeps
    // the `## Fix Routing` heading: it names a section of the output document.)
    const skill = builtSkill('add-qa');
    expect(skill).not.toMatch(/Routing rules/i);
    // Assert the RULE CONTENT is absent, not the words (M7). The old guard was
    // case-SENSITIVE on a phrase that had leaked back in lowercase, so it stayed
    // green while the duplication lived. Naming a topic in the "lives elsewhere"
    // pointer at :73 is legitimate; spelling out the agent→target mappings is not.
    expect(skill).not.toMatch(/@e2e-agent\s*(?:→|->|may only be routed to)\s*`?test-file/i);
    expect(skill).not.toMatch(/@ux-agent\s*(?:→|->|may only be routed to)\s*`?design-spec/i);
    // ...and the pointer to the canonical home must be present.
    expect(skill).toMatch(/references\/coordinator\.md/);
  });

  it('add.review cites the canonical axis table and merge rules instead of restating them', () => {
    const review = builtCommand('add.review');
    // Structural, not formatting-pinned: no axis-ownership row may be restated here,
    // whatever the cell spacing. (L5 — the old guard matched one exact rendering.)
    expect(review).not.toMatch(/^\|\s*(Failure forensics|UX quality|Functional delivery|Accessibility|Responsiveness)\s*\|/mi);
    expect(review).toMatch(/Axis ownership/i);
    expect(review).toMatch(/references\/coordinator\.md|coordinator\.md/);
  });

  it('built add.review derives routes and unions them into one Fix Routing table', () => {
    const review = builtCommand('add.review');
    expect(review).toMatch(/Derive routes/i);
    expect(review).toContain('judged-contract');
    expect(review).toContain('judged-tree');
    expect(review).toMatch(/## Fix Routing/);
    expect(review).toMatch(/union/i);
  });

  it('qa-fix fragment dispatches by route, stops with a remedy when unrouted, and injects into add.build', () => {
    const fragment = fs.readFileSync(
      path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
      'utf8',
    );
    expect(fragment).toMatch(/DISPATCH by ROUTE/);
    // No backward-compat path: an unrouted report must stop with the re-run remedy,
    // never silently degrade to severity grouping. The only surviving mention of
    // that degradation is the prohibition itself ("do NOT fall back to ...").
    expect(fragment).toMatch(/STOP with the remedy/i);
    expect(fragment).toMatch(/do NOT fall back to severity grouping/i);
    expect(fragment).not.toMatch(/Legacy fallback/i);

    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(modified).toBeGreaterThan(0);
    const injected = snapshot(path.join(tmp, '.claude', 'commands', 'add.build.md'));
    expect(injected).toMatch(/DISPATCH by ROUTE/);
    disableFeature(tmp, 'qa-pipeline');
  });

  it('built add.build Agent Roster lists every dispatchable agent', () => {
    const build = builtCommand('add.build');
    const roster = build.slice(build.indexOf('Agent Roster'));
    for (const agent of ['@e2e-agent', '@ux-agent', '@test-agent', '@fix-agent']) {
      expect(roster, agent).toContain(agent);
    }
  });

  it('plugins.json keeps playwright.agents = [qa-agent] (ux-agent never live-drives)', () => {
    const plugins = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'cli', 'src', 'plugins.json'), 'utf8'),
    );
    const pw = plugins.playwright ?? plugins.plugins?.playwright;
    expect(pw.agents.map((a) => a.agent)).toEqual(['qa-agent']);
  });
});

describe('scenario 10 — QA evidence lifecycle (plan 0061)', () => {
  const builtSkill = (name, file = 'SKILL.md') =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'skills', name, file), 'utf8');

  it('ships the deterministic evidence lifecycle script', () => {
    expect(fs.existsSync(path.join(CODEADD, 'scripts', 'qa-evidence.sh'))).toBe(true);
  });

  it('the absorbed QA allocates and resolves predecessors through qa-evidence.sh', () => {
    const review = builtCommand('add.review');
    expect(review).toContain('.codeadd/scripts/qa-evidence.sh next');
    expect(review).toContain('.codeadd/scripts/qa-evidence.sh previous');
    expect(review).toMatch(/working plus final evidence/i);
    expect(review).toMatch(/NEVER write a new audit under `_tests\/final\/`/i);
  });

  it('the QA skill and schema distinguish working evidence from immutable final evidence', () => {
    const qa = builtSkill('add-qa');
    const schema = builtSkill('add-doc-schemas', path.join('references', 'review.md'));
    expect(qa).toContain('_tests/final/run-NNN/');
    expect(qa).toMatch(/not a pass certificate/i);
    expect(schema).toContain('_tests/final/run-NNN/');
  });

  it('QA-fix refuses final-only evidence as a live fix queue', () => {
    const fragment = fs.readFileSync(
      path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
      'utf8',
    );
    // Plan 0070: the fix queue is now the review's `## Fix Routing` table, and
    // the final/working distinction is stated where the rows are read.
    expect(fragment).toMatch(/never a live fix queue/i);
    expect(fragment).toMatch(/Do NOT read `_tests\/final\/`/i);
  });

  it('review captures the working baseline and done promotes it before changelog and merge', () => {
    const review = builtCommand('add.review');
    const done = builtCommand('add.done');
    expect(review).toContain('.codeadd/scripts/qa-evidence.sh working-baseline');
    const promote = done.indexOf('## STEP 5: Validate and Promote Reviewed QA Evidence');
    const changelog = done.indexOf('## STEP 6: Generate Changelog and Documentation');
    const merge = done.indexOf('## STEP 8: Execute Merge');
    expect(promote).toBeGreaterThan(-1);
    expect(changelog).toBeGreaterThan(promote);
    expect(merge).toBeGreaterThan(changelog);
    // Promotion is add.done's alone. The review may NAME it in a prohibition;
    // what it must never do is invoke it, so match the invocation form.
    expect(review).not.toMatch(/bash .*qa-evidence\.sh promote/);
    expect(review).toMatch(/NEVER invoke\s+`qa-evidence\.sh promote`/);
    expect(done).toContain('.codeadd/scripts/qa-evidence.sh validate');
    expect(done).toContain('.codeadd/scripts/qa-evidence.sh promote');
    expect(done).toMatch(/DO NOT USE: Write to create `changelog\.md`/);
    expect(done).toMatch(/DO NOT USE: Bash for `done\.sh --merge`/);
    // Plan 0070: with the review read-only, REVIEW_TREE_AFTER equals
    // REVIEW_TREE_BEFORE by construction, so the whole "corrections invalidated
    // the QA evidence" category is structurally unreachable. It was REMOVED,
    // not handled — assert its absence so it cannot creep back.
    expect(review).not.toContain('QA_BASELINE_INVALIDATED');
    expect(review).toMatch(/structurally unreachable/i);
    // The self-check that keeps it that way: a review that moved the tree it
    // judged is a contract violation, not a recoverable state.
    expect(review).toMatch(/REVIEW_TREE_AFTER != REVIEW_TREE_BEFORE/);
    expect(done).toMatch(/new AND existing changelogs/i);
    expect(done).toMatch(/upsert one `## QA Evidence` section/i);
  });
});

// The umbrella review v01 found three seams the plans never covered: @ux-agent was
// routed to a mode it refused to perform, and two commands resolved design.md at
// feature level only — silently skipping the Design Contract on epics, which is
// exactly where this umbrella exists to enforce it.
describe('scenario 9 — umbrella review v01 fixes', () => {
  const builtAgent = (name) =>
    fs.readFileSync(path.join(BUILT_CLAUDE, 'agents', `${name}.md`), 'utf8');

  it('ux-agent defines a Fix Mode with the design.md amendment trail', () => {
    const uxAgent = builtAgent('ux-agent');
    expect(uxAgent).toMatch(/## Fix Mode/);
    expect(uxAgent).toMatch(/design-spec/);
    // The trail is what stops a green-under-amended-contract flip reading as a fix.
    expect(uxAgent).toMatch(/## Design Review/);
    expect(uxAgent).toMatch(/run-NNN/);
    // Write scope is explicit rather than a blanket read-only claim.
    expect(uxAgent).toMatch(/Write scope/i);
  });

  it('ux-agent still refuses fixes inside a review dispatch', () => {
    const reviewSection = builtAgent('ux-agent').match(
      /## Review Mode[\s\S]*?(?=## Fix Mode)/,
    )[0];
    expect(reviewSection).toMatch(/READ-ONLY/);
    expect(reviewSection).toMatch(/Refuse/i);
  });

  it('add.review, add.plan-to-ready and add.build resolve design.md at subfeature scope', () => {
    // Assert the CITATION, not the prose (L7): the authority is the schema's
    // Location rule. Pinning the parenthetical here would test-lock the exact
    // wording Q18 asked to single-source.
    for (const name of ['add.review', 'add.plan-to-ready', 'add.build']) {
      expect(builtCommand(name)).toMatch(/new-feature\.md/);
      expect(builtCommand(name)).toMatch(/feature-design/);
    }
  });

  it('add.plan-to-ready points at add.plan and add.new, never at a removed command', () => {
    const loop = builtCommand('add.plan-to-ready');
    expect(loop).toMatch(/add\.plan/);
    expect(loop).not.toMatch(/\/add\.design/);
    expect(loop).not.toMatch(/\/add\.(qa|test|autopilot)(?![\w-])/);
  });

  it('add.plan GATES table declares the design gates it enforces at 8.1', () => {
    const plan = builtCommand('add.plan');
    const gates = plan.slice(plan.indexOf('## GATES'), plan.indexOf('## INVARIANT'));
    expect(gates).toContain('design_gate');
    expect(gates).toContain('design_validated');
  });

  it('the tdd:step9 injection anchor is unique prose, not a bare code fence', () => {
    const point = JSON.parse(
      fs.readFileSync(path.join(CODEADD, 'injection-points.json'), 'utf8'),
    ).points.find((p) => p.section === 'step9');
    expect(point.anchor.text).not.toBe('```');
    expect(point.anchor.ordinal).toBe(1);
  });
});
