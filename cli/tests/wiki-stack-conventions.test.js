import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard for plan 2026-10-24T183514-PLAN--wiki-stack-conventions (ticket 0062B).
//
// Reads the SOURCE files under framwork/.codeadd/, never the build output, and pins the
// fixed `## Stack Conventions` table contract: where detection lives, what the spine
// writes, what the coordinator gates, and what /add-wiki update keeps.
//
// Written FIRST. L1.1-L1.7 were RED against the tree before F2-F7 landed (the text did
// not exist). L1.8 and L1.9 are GUARD assertions: they passed before F2 and must keep
// passing.

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../framwork/.codeadd');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const DISCOVERY = 'skills/add--architecture-discovery';
const skill = () => read(`${DISCOVERY}/SKILL.md`);
const spine = () => read(`${DISCOVERY}/spine-analyzer.md`);
const backend = () => read(`${DISCOVERY}/backend-analyzer.md`);
const database = () => read(`${DISCOVERY}/database-analyzer.md`);
const command = () => read('commands/add-wiki.md');
const maintenance = () => read('skills/add--wiki-maintenance/SKILL.md');

const ROW_KEYS = ['Tenancy', 'DI', 'Barrels', 'Layering', 'Validation', 'ORM / data access', 'Entity language'];
const TABLE_HEADER = '| Convention | Value | Where / enforcement | Evidence | Source |';

// Text from the first line matching `startRe` up to (not including) the next line matching `endRe`.
function block(text, startRe, endRe) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => startRe.test(l));
  if (start === -1) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (endRe.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join('\n');
}

// A `## STEP add-wiki.<id>` is closed by the next `## STEP `; a `### STEP` by the next `##`/`###` STEP.
function step(id) {
  const text = command();
  const top = new RegExp(`^## STEP add-wiki\\.${id}\\b`);
  if (text.split('\n').some((l) => top.test(l))) return block(text, top, /^## STEP /);
  return block(text, new RegExp(`^### STEP add-wiki\\.${id}\\b`), /^#{2,3} STEP /);
}

describe('wiki stack conventions — L1 source guard', () => {
  it('L1.1 SKILL.md holds a Stack Convention Signals section with the seven keys and the tenancy policy markers', () => {
    const text = skill();
    const section = block(text, /^## Stack Convention Signals\s*$/, /^## /);
    expect(section, 'heading "## Stack Convention Signals" is missing').not.toBe('');
    for (const key of ROW_KEYS) expect(section, `row key ${key}`).toContain(key);
    expect(section).toContain('ENABLE ROW LEVEL SECURITY');
    expect(section).toContain('CREATE POLICY');
  });

  it('L1.2 spine-analyzer states the table contract', () => {
    const text = spine();
    expect(text).toContain('Stack Conventions');
    expect(text).toContain(TABLE_HEADER);
    let from = text.indexOf(TABLE_HEADER);
    expect(from, 'table header').toBeGreaterThan(-1);
    for (const key of ROW_KEYS) {
      const at = text.indexOf(`| ${key} |`, from);
      expect(at, `row ${key} after the previous row`).toBeGreaterThan(-1);
      from = at;
    }
    expect(text).toContain('detected');
    expect(text).toContain('decided');
    expect(text).toContain('STACK_CONVENTIONS');
    expect(text).toContain('Stack Convention Signals');
  });

  it('L1.3 spine-analyzer dropped the loose barrel example', () => {
    expect(spine()).not.toContain('every package exposes a single index.ts barrel');
  });

  it('L1.4 backend and database analyzers reference the Signals and copy none of them', () => {
    const copied = [
      'tenant_id|tenantId',
      'ENABLE ROW LEVEL SECURITY',
      'CREATE POLICY',
      'current_setting(',
      'container.(register|bind)',
    ];
    for (const [name, text] of [['backend-analyzer', backend()], ['database-analyzer', database()]]) {
      expect(text, `${name} references the Signals`).toContain('Stack Convention Signals');
      expect(text, `${name} links the table`).toContain('conventions.md#stack-conventions');
      for (const s of copied) expect(text, `${name} must not copy "${s}"`).not.toContain(s);
    }
  });

  it('L1.5 add-wiki dispatches, gates and uses the table', () => {
    const consolidate = step('consolidate');
    expect(consolidate).toContain('Stack Conventions');
    expect(consolidate).toContain('STACK_CONVENTIONS');
    // the gate checklist lives inside the hub step (a `###` child of `## STEP add-wiki.hub`)
    expect(step('hub')).toContain('### Stack Conventions');
    expect(step('determine-mode-recorded')).toContain('conventions.md');
    expect(step('spine-analyzer-new')).toContain('STACK_CONVENTIONS');
    const updater = step('dispatch-updater');
    expect(updater).toContain('Multi-tenancy:');
    expect(updater).toContain('stack-conventions');
  });

  it('L1.6 wiki-maintenance keeps the section, protects decided rows and backfills once', () => {
    const text = maintenance();
    expect(text).toContain('Stack Conventions');
    expect(text).toContain('decided');
    expect(text).toContain('drift:');
    const lines = text.split('\n');
    expect(lines.some((l) => /backfill/i.test(l) && l.includes('add-done')), 'a line naming backfill and add-done').toBe(true);
    const uses = block(text, /<!-- uses:/, /--!?>/);
    expect(uses).toContain('skill: add--architecture-discovery');
  });

  it('L1.7 the cheap pre-check cannot exit before the backfill', () => {
    const pre = block(maintenance(), /\*\*Cheap pre-check/, /^\s*$/);
    expect(pre, 'cheap pre-check paragraph').not.toBe('');
    expect(pre).toContain('Stack Conventions');
  });

  // GUARD — passed before F2, must keep passing.
  it('L1.8 GUARD backend-analyzer keeps its output token and its FORBIDDEN rule', () => {
    const text = backend();
    expect(text).toContain('{{addpath:wiki/domains/backend.md}}');
    expect(text).toContain('Sections with "Not found" or "None"');
  });

  // GUARD — passed before F2, must keep passing.
  it('L1.9 GUARD add-wiki keeps every STEP id and carries no numeric STEP text', () => {
    const text = command();
    expect(text.split('\n').filter((l) => /\bSTEP \d/.test(l))).toEqual([]);
    const ids = [
      'bootstrap', 'classify', 'explore-project', 'detect-apps', 'classify-app', 'build-dispatch-plan',
      'determine-mode-recorded', 'create-output-directory', 'brief', 'dispatch', 'common-dispatch-pattern',
      'app-specialists-specialist', 'app-generic-template', 'database-analyzer-detected',
      'code-quality-analyzer', 'spine-analyzer-new', 'consolidate', 'hub', 'budgets', 'select-domains',
      'gate', 'migration-cleanup', 'agents-md', 'run-migration', 'resolve-shell-policy', 'dispatch-updater',
      'verify', 'meta', 'report', 'handoff',
    ];
    for (const id of ids) {
      expect(new RegExp(`^#{2,3} STEP add-wiki\\.${id}\\b`, 'm').test(text), `STEP add-wiki.${id}`).toBe(true);
    }
  });
});
