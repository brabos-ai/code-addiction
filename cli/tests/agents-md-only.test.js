import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-21T002449-PLAN--agents-md-only-context-file — L3, the repo-wide gate.
 *
 * AGENTS.md is the only context file the framework writes and reads, in a user's
 * project and in this repository. CLAUDE.md is not an artefact-graph node, so no
 * build gate sees a reader still naming it — this test is what does.
 *
 * The search is for the legacy FILENAMES and the old skill name. It is not for
 * the bare string `claude-md`: plan basenames written before this change carry it
 * (`...-PLAN--claude-md-inventory-block`), and a historical citation is correct.
 *
 * The allowlist holds only the files whose job is the legacy files themselves —
 * the migration, its detection, the writers that run it, the check that flags a
 * leftover, and the test that asserts add.wiki names them. Each entry says why.
 * A new entry that merely READS the context file under its old name is the defect
 * this test exists to catch; fix the file instead of listing it.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SELF = path.relative(ROOT, import.meta.filename).split(path.sep).join('/');

const LEGACY = /CLAUDE\.md|GEMINI\.md|add-claude-md-style/;

const SCAN = [
  'framwork/.codeadd',
  'framwork/provider-map.json',
  'workbench',
  'scripts',
  'cli/src',
  'cli/tests',
  'mcp',
];

/** Build-emitted, gitignored sidecars: generated from the sources this test already scans. */
const SIDECARS = new Set([
  'framwork/.codeadd/artefact-graph.json',
  'framwork/.codeadd/injection-points.json',
  'framwork/.codeadd/contracts.json',
]);

const ALLOWED = {
  'framwork/.codeadd/scripts/migrate-context-files.sh': 'the migration itself — it names every legacy file it folds in',
  'framwork/.codeadd/scripts/tests/migrate-context-files.bats': 'the migration suite — its fixtures are legacy files',
  'framwork/.codeadd/scripts/init.sh': 'emits LEGACY_CONTEXT, so it tests for each legacy file',
  'framwork/.codeadd/scripts/tests/init.bats': 'the LEGACY_CONTEXT fixtures',
  'framwork/.codeadd/skills/add-agents-md-style/SKILL.md': 'owns the Migration section and explains why a legacy file hides AGENTS.md',
  'framwork/.codeadd/commands/add.wiki.md': 'STEP 6.1 runs the migration and STEP 7 checks no legacy file is left',
  'framwork/.codeadd/skills/add-health-check/documentation-analyzer.md': 'finding DOC-008 flags a leftover legacy file',
  'cli/tests/plain-language-rule.test.js': 'asserts add.wiki names the legacy files only to check they are gone',
};

function walk(rel, out) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return out;
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    out.push(rel);
    return out;
  }
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    walk(`${rel}/${entry.name}`, out);
  }
  return out;
}

describe('L3 — AGENTS.md is the only context file', () => {
  it('L3.1 nothing outside the allowlist names CLAUDE.md, GEMINI.md or the old style skill', () => {
    const files = SCAN.flatMap((rel) => walk(rel, []))
      .filter((rel) => rel !== SELF && !SIDECARS.has(rel));
    expect(files.length, 'the scan found nothing — the paths are wrong').toBeGreaterThan(100);

    const offenders = files.filter((rel) => {
      if (ALLOWED[rel]) return false;
      return LEGACY.test(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    });
    expect(offenders, `still naming a legacy context file: ${offenders.join(', ')}`).toEqual([]);
  });

  it('L3.1 every allowlisted file exists and still names a legacy file — no stale entry', () => {
    for (const rel of Object.keys(ALLOWED)) {
      const full = path.join(ROOT, rel);
      expect(fs.existsSync(full), `${rel} is allowlisted but gone`).toBe(true);
      expect(LEGACY.test(fs.readFileSync(full, 'utf8')), `${rel} no longer needs its entry`).toBe(true);
    }
  });

  it('L3.2 this repository carries AGENTS.md with the inventory block, and no CLAUDE.md', () => {
    expect(fs.existsSync(path.join(ROOT, 'CLAUDE.md'))).toBe(false);
    const agents = path.join(ROOT, 'AGENTS.md');
    expect(fs.existsSync(agents)).toBe(true);
    const text = fs.readFileSync(agents, 'utf8');
    expect(text).toContain('codeadd-inventory:start');
    expect(text).toContain('codeadd-inventory:end');
  });
});
