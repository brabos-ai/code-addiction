import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '../src/plugins.js';
import { FEATURES } from '../src/features.js';

const require = createRequire(import.meta.url);
const { readMap, extractInjectionPoints } = require('../../scripts/build.js');

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

  it('playwright plugin keeps its add.qa live-drive injection', () => {
    expect(pw.injects).toContain('add.qa');
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
  it('is registered, default off, gating plan/test/build with no provider restriction', () => {
    expect(FEATURES['qa-pipeline']).toBeDefined();
    expect(FEATURES['qa-pipeline'].default).toBe(false);
    expect(FEATURES['qa-pipeline'].commands).toEqual(['add.plan', 'add.test', 'add.build']);
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
    expect(qa(pts, 'step-list').anchor).toMatchObject({ text: '- 8.3: Frontend Specialist', position: 'after' });
    expect(qa(pts, 'qa-spec').anchor).toMatchObject({
      text: '## STEP 10: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)',
      position: 'after',
    });
  });

  it('add.test carries e2e-dispatch anchored at the end of STEP 3', () => {
    const pts = points('commands/add.test.md', 'add.test', 'command');
    expect(qa(pts, 'e2e-dispatch').anchor).toMatchObject({
      text: '| **Ready** | Proceed to STEP 4 only if all generators completed |',
      position: 'after',
    });
  });

  it('add.build carries qa-fix anchored on the STEP 5 → STEP 6 separator', () => {
    const pts = points('commands/add.build.md', 'add.build', 'command');
    const anchor = qa(pts, 'qa-fix').anchor;
    expect(anchor).toMatchObject({ text: '---', position: 'after' });
    expect(anchor.next).toMatch(/^## STEP 6/);
  });
});

describe('QA umbrella — playwright drive anchors survive reclassification', () => {
  it('add.qa command retains its plugin:playwright:drive anchor', () => {
    expect(drive(points('commands/add.qa.md', 'add.qa', 'command'))).toBeDefined();
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
