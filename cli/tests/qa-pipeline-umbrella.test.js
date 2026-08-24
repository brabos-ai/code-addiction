import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '../src/plugins.js';
import { FEATURES } from '../src/features.js';

const require = createRequire(import.meta.url);
const {
  readMap,
  extractInjectionPoints,
  sliceContractBlock,
  CONTRACT_VARIABLE_RE,
} = require('../../scripts/build.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const readSource = (rel) => fs.readFileSync(path.join(CODEADD, rel), 'utf8');
const points = (rel, name, kind) => extractInjectionPoints(readSource(rel), name, kind);
const qa = (pts, section) =>
  pts.find((p) => p.namespace === 'feature' && p.name === 'qa-pipeline' && p.section === section);
const drive = (pts) => pts.find((p) => p.namespace === 'plugin' && p.name === 'playwright' && p.section === 'drive');

// ---------------------------------------------------------------------------
// provider-map.json registry — new skills + agent (0047/0048/0049/0050)
// ---------------------------------------------------------------------------
describe('QA umbrella — provider-map registry', () => {
  const map = readMap();

  it('registers add-qa-spec as a default skill (no provider restriction)', () => {
    expect(map.skills['add-qa-spec']).toBeDefined();
    expect(map.skills['add-qa-spec'].providers).toBeUndefined();
  });

  it('registers add-qa as a default skill after the plugin→default move', () => {
    expect(map.skills['add-qa']).toBeDefined();
    expect(map.skills['add-qa'].providers).toBeUndefined();
  });

  it('registers the e2e-agent in the agents map', () => {
    expect(map.agents['e2e-agent']).toBeDefined();
    expect(map.agents['e2e-agent'].description).toMatch(/E2E spec author/i);
  });
});

// ---------------------------------------------------------------------------
// add-qa reclassification: plugin catalog + skill relocation (0050 B1)
// ---------------------------------------------------------------------------
describe('QA umbrella — add-qa reclassification (plugin → default)', () => {
  const catalog = loadCatalog();
  const pw = catalog.playwright;

  it('playwright plugin no longer ships the add-qa skill', () => {
    expect(pw.skills).not.toContain('add-qa');
  });

  it('playwright plugin keeps its live-drive injection, retargeted to add.review', () => {
    expect(pw.injects).toContain('add.review');
    expect(pw.injects).not.toContain('add.qa');
  });

  it('playwright plugin keeps the qa-agent drive injection', () => {
    const qaAgent = pw.agents.find((a) => a.agent === 'qa-agent');
    expect(qaAgent).toBeDefined();
    expect(qaAgent.sections).toContain('drive');
  });

  it('add-qa skill source lives at the default location, not under the plugin', () => {
    expect(fs.existsSync(path.join(CODEADD, 'skills', 'add-qa', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(CODEADD, 'plugins', 'playwright', 'skills', 'add-qa', 'SKILL.md'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// qa-pipeline feature registry (0051 B3)
// ---------------------------------------------------------------------------
describe('QA umbrella — qa-pipeline feature registry', () => {
  it('is registered, default off, gating plan/build with no provider restriction', () => {
    expect(FEATURES['qa-pipeline']).toBeDefined();
    expect(FEATURES['qa-pipeline'].default).toBe(false);
    expect(FEATURES['qa-pipeline'].commands).toEqual(['add.plan', 'add.build']);
    expect(FEATURES['qa-pipeline']).not.toHaveProperty('providers');
  });
});

// ---------------------------------------------------------------------------
// Injection wiring — parsed from the real command/agent sources via the SAME
// function the build uses. Locks in the anchors 0048/0049/0051 introduced and
// proves the plugin drive anchors survived the 0050 reclassification.
// ---------------------------------------------------------------------------
describe('QA umbrella — qa-pipeline injection wiring', () => {
  it('add.plan carries step-list + qa-spec anchored on stable non-tdd lines', () => {
    const pts = points('commands/add.plan.md', 'add.plan', 'command');
    // Renumbered by plan 0057 (new 8.1 UX Design Specialist step pushed Frontend 8.3 -> 8.4).
    expect(qa(pts, 'step-list').anchor).toMatchObject({ text: '- 8.4: Frontend Specialist', position: 'after' });
    expect(qa(pts, 'qa-spec').anchor).toMatchObject({
      text: '## STEP 10: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)',
      position: 'after',
    });
  });

  // Plan 0070: add.test was absorbed into add.build. e2e-dispatch now anchors
  // AFTER the area validators return — @e2e-agent needs existing components
  // and stable selectors, and that WAIT-ALL is already in place there.
  it('add.build carries e2e-dispatch anchored after the area validators return', () => {
    const pts = points('commands/add.build.md', 'add.build', 'command');
    expect(qa(pts, 'e2e-dispatch').anchor).toMatchObject({
      text: '**CRITICAL:** Pass FILES_CREATED and FILES_MODIFIED from each implementation subagent to its validator.',
      position: 'after',
    });
  });

  it('add.build carries qa-fix anchored on the separator above the wiki step', () => {
    const pts = points('commands/add.build.md', 'add.build', 'command');
    const anchor = qa(pts, 'qa-fix').anchor;
    expect(anchor).toMatchObject({ text: '---', position: 'after' });
    expect(anchor.next).toMatch(/^## STEP 7/);
  });
});

describe('QA umbrella — playwright drive anchors survive reclassification', () => {
  // Plan 0070: add.qa was absorbed into add.review's base body; the drive
  // anchor moved with the judgement section it belongs to.
  it('add.review carries the plugin:playwright:drive anchor', () => {
    expect(drive(points('commands/add.review.md', 'add.review', 'command'))).toBeDefined();
  });

  it('qa-agent retains its plugin:playwright:drive anchor and carries no stray feature marker', () => {
    const pts = points('agents/qa-agent.md', 'qa-agent', 'agent');
    expect(drive(pts)).toBeDefined();
    expect(pts.some((p) => p.namespace === 'feature')).toBe(false);
  });

  it('e2e-agent carries NO injection marker (runner-only, no MCP)', () => {
    expect(points('agents/e2e-agent.md', 'e2e-agent', 'agent')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Setup receipt & upgrade contract (0061)
// ---------------------------------------------------------------------------
describe('setup contract (0061)', () => {
  const src = readSource('commands/add.qa-setup.md');

  it('declares a ## Materializes block carrying every materialized shape', () => {
    expect(src).toMatch(/^## Materializes[ \t]*$/m);
    const block = sliceContractBlock(src);
    for (const p of ['docs/qa/config.json', '_tests/screens.json', 'qa-project/SKILL.md', '.gitignore']) {
      expect(block).toContain(p);
    }
    expect(block).toMatch(/^shape:\s*sha256:[0-9a-f]{16}\s*$/m);
    expect(block).not.toMatch(/^version:/m);
    expect(block).not.toMatch(/^recipes:/m);
    expect(block).toContain('docs/features/**/_tests/run-*/');
  });

  it('carries no resolvable resource-path variable inside the contract block', () => {
    // The boundary MUST come from build.js's fence-aware slicer. A hand-rolled
    // `^## ` search here would end the block at the embedded template's
    // `## Conventions` and pass while a variable sat unguarded below it —
    // reproducing the exact blind spot the build gate exists to close.
    // The regex is IMPORTED, never re-rolled: a local copy would silently diverge
    // the moment the build's ban is tightened or loosened — two descriptions of
    // one rule, the drift shape this whole design rejects.
    const block = sliceContractBlock(src);
    expect(block).toContain('## Auth / Seed'); // proves we got the WHOLE block
    expect(CONTRACT_VARIABLE_RE.test(block)).toBe(false);
  });

  it('retires the FIRST_RUN file-presence proxy as a mechanism', () => {
    // The one surviving mention is the ⛔ notice that forbids reintroducing it.
    // Any second occurrence means the flag came back as an operative gate.
    const hits = src.match(/FIRST_RUN/g) || [];
    expect(hits).toHaveLength(1);
    expect(src).toMatch(/`FIRST_RUN`[^\n]*is RETIRED/);
  });

  it('declares the --migrate and --upgrade flags', () => {
    expect(src).toContain('--migrate');
    expect(src).toContain('--upgrade');
  });

  it('gates migration on a fingerprint comparison, not on first-run', () => {
    // Slice STEP 5 and assert against IT. A file-wide /fingerprint/i match would
    // pass on the prohibitions table alone, staying green even if STEP 5 were
    // reverted to the first-run proxy wholesale.
    const start = src.indexOf('## STEP 5: Detect Migration');
    expect(start).toBeGreaterThan(-1);
    const step5 = src.slice(start, src.indexOf('\n## ', start + 4));

    expect(step5).toMatch(/scan on \*\*every\*\* run/i);
    expect(step5).toContain('migration.detected'); // compares against the recorded fingerprint
    expect(step5).toMatch(/FORCE_MIGRATE/);        // the flag is the override, not the gate
    // The retired proxy may appear ONLY as the ⛔ prohibition against reusing it.
    for (const line of step5.split('\n').filter((l) => l.includes('docs/qa/config.json'))) {
      expect(line).toMatch(/⛔ Do NOT gate/);
    }
  });

  it('writes the receipt and runs the schema gate before hand-off', () => {
    const receipt = src.indexOf('## STEP 12: Write the Receipt');
    const gate = src.indexOf('## STEP 13: Validation Gate');
    const handoff = src.indexOf('## STEP 14: Hand-off');
    expect(receipt).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(receipt);
    expect(handoff).toBeGreaterThan(gate);
  });

  it('materializes a dedicated QA ignore block before migration and smoke testing', () => {
    const ignore = src.indexOf('## STEP 9: Ignore Working QA Evidence');
    const migration = src.indexOf('## STEP 10: Autonomous Migration');
    const smoke = src.indexOf('## STEP 11: Universal Smoke Test');
    expect(ignore).toBeGreaterThan(-1);
    expect(migration).toBeGreaterThan(ignore);
    expect(smoke).toBeGreaterThan(migration);
    expect(src).toContain('# ADD QA evidence - managed by add.qa-setup');
    expect(src).not.toMatch(/^!final\/$/m);
    expect(src).toContain('.codeadd/scripts/qa-evidence.sh ensure-ignore');
  });

  it('no-screens deferral still writes and validates the receipt', () => {
    const smoke = src.slice(
      src.indexOf('## STEP 11: Universal Smoke Test'),
      src.indexOf('## STEP 12: Write the Receipt'),
    );
    expect(smoke).toMatch(/DEFER only the smoke dispatch and correction loop/i);
    expect(smoke).toMatch(/continue to STEP 12/i);
    expect(smoke).not.toMatch(/skip to hand-off/i);
  });

  it('registers add-setup-contract in the provider map', () => {
    expect(readMap().skills['add-setup-contract']).toBeDefined();
  });

  it('add-setup-contract compares shapes and has no recipe/delta/backfill path', () => {
    const skill = readSource('skills/add-setup-contract/SKILL.md');
    expect(skill).toMatch(/setup-shape/);
    expect(skill).toMatch(/FIRST-RUN/);
    expect(skill).toMatch(/STALE/);
    expect(skill).not.toMatch(/`RECIPES`/);
    expect(skill).not.toMatch(/v\(N-1\)/);
    expect(skill).not.toMatch(/^## v\d/m);
  });
});
