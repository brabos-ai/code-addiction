import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard for plan 2026-10-24T184758-PLAN--agnostic-dev-skills (ticket 0063B).
//
// Reads the SOURCE files under framwork/.codeadd/, never the build output, and writes nothing.
// It pins the rule that the dev skills, the review skills and the commands and agents that cite
// them follow the project's recorded conventions (wiki `## Stack Conventions`) instead of
// imposing tenancy, DI registration, barrels or one stack's names.
//
// Written FIRST. Every assertion below was RED against the tree before F2-F15 landed, except
// the GUARD ones, which passed before the first edit and must keep passing:
//   L1.3  the three dev skills keep `## Validation Checklist`
//   L1.6  `add--frontend-development` keeps its UX Design Integration rule
//   L1.14 `add-plan.md` keeps the three-check list (first half)

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../framwork/.codeadd');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const BACKEND_DEV = 'skills/add--backend-development/SKILL.md';
const DATABASE_DEV = 'skills/add--database-development/SKILL.md';
const FRONTEND_DEV = 'skills/add--frontend-development/SKILL.md';
const DEV_SKILLS = [BACKEND_DEV, DATABASE_DEV, FRONTEND_DEV];
const CODE_REVIEW = 'skills/add--code-review/SKILL.md';
const SECURITY_AUDIT = 'skills/add--security-audit/SKILL.md';
const BACKEND_ARCH = 'skills/add--backend-architecture/SKILL.md';
const FRONTEND_ARCH = 'skills/add--frontend-architecture/SKILL.md';

const commandFiles = () =>
  fs.readdirSync(path.join(SRC, 'commands')).filter((f) => f.endsWith('.md')).map((f) => `commands/${f}`);

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

const section = (text, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return block(text, new RegExp(`^${escaped}\\s*$`), /^## /);
};

const step = (text, id) => block(text, new RegExp(`^## STEP ${id.replace('.', '\\.')}\\b`), /^## STEP /);

const firstNonBlankAfterHeading = (text, heading) => {
  const body = section(text, heading).split('\n').slice(1);
  return body.find((l) => l.trim() !== '') ?? '';
};

describe('agnostic dev skills (0063B)', () => {
  it('L1.1 no CQRS in any command', () => {
    for (const f of commandFiles()) {
      expect(read(f), f).not.toMatch(/CQRS/);
    }
  });

  it('L1.2 skills read wiki/conventions.md and never impose tenancy, DI registration or barrels', () => {
    for (const f of [...DEV_SKILLS, CODE_REVIEW, SECURITY_AUDIT]) {
      expect(read(f), f).toContain('wiki/conventions.md');
    }
    for (const f of [...DEV_SKILLS, CODE_REVIEW]) {
      expect(read(f), f).toContain('never impose tenancy, DI registration or barrels unless the project uses them');
    }
  });

  it('L1.3 GUARD: the three dev skills keep ## Validation Checklist', () => {
    for (const f of DEV_SKILLS) {
      expect(read(f), f).toMatch(/^## Validation Checklist\s*$/m);
    }
  });

  it('L1.4 every tenant-key line in the commands and agents names the Tenancy row', () => {
    const files = [
      'commands/add-review.md',
      'commands/add-plan.md',
      'commands/add-build.md',
      'agents/backend-agent.md',
      'agents/database-agent.md',
    ];
    for (const f of files) {
      const offenders = read(f).split('\n').filter((l) => /account_id|accountId|tenant_id/.test(l) && !l.includes('Tenancy'));
      expect(offenders, f).toEqual([]);
    }
  });

  it('L1.5 AGENTS.md is no longer the source of patterns or of truth in the commands', () => {
    for (const f of commandFiles()) {
      const text = read(f);
      expect(text, f).not.toContain('Use `AGENTS.md` as source of patterns');
      expect(text, f).not.toMatch(/AGENTS\.md(\*\*)? is the source of truth/);
    }
  });

  it('L1.6 GUARD: add--frontend-development keeps the UX Design Integration rule', () => {
    const text = read(FRONTEND_DEV);
    expect(text).toContain('## UX Design Integration (MANDATORY)');
    expect(text).toContain('- skill: add--ux-design/SKILL.md');
    expect(text).toContain('**RULE:** Never implement frontend without either design.md OR ux-design skill loaded.');
  });

  it('L1.7 the dev skill is loaded by its real name (add--<area>-development)', () => {
    const files = [...commandFiles(), ...fs.readdirSync(path.join(SRC, 'agents')).map((f) => `agents/${f}`)];
    for (const f of files) {
      const text = read(f);
      expect(text, f).not.toContain('add-[AREA]-development');
      expect(text, f).not.toContain('add-${AREA}-development');
    }
    const build = read('commands/add-build.md');
    expect(build.split('add--${AREA}-development').length - 1).toBe(2);
    expect(read('agents/fix-agent.md')).toContain('add--[AREA]-development');
    expect(read('agents/test-agent.md')).toContain('add--[AREA]-development');
  });

  it('L1.8 the three dev skills carry the agnostic rewrite', () => {
    const backend = read(BACKEND_DEV);
    expect(backend).toMatch(/^## Project Conventions First\s*$/m);
    expect(backend).not.toContain('MUST be registered');
    expect(backend).not.toContain('add-backend-cqrs');

    const database = read(DATABASE_DEV);
    expect(database).toMatch(/^## Barrel Exports\s*$/m);
    expect(database).not.toContain('## Barrel Exports (MANDATORY)');
    expect(database).not.toContain('Use interfaces, not classes');
    expect(database).toContain('Project Conventions First');
    expect(section(database, '## Repository Pattern')).not.toMatch(/ALWAYS filter by/);

    const frontend = read(FRONTEND_DEV);
    expect(frontend).not.toContain('Zod or equivalent');
    expect(frontend).toContain('Project Conventions First');

    expect(firstNonBlankAfterHeading(backend, '## Multi-Tenancy')).toContain('Tenancy');
    expect(firstNonBlankAfterHeading(database, '## Multi-Tenancy')).toContain('Tenancy');
  });

  it('L1.9 the review skills check IoC and tenancy only when the project uses them', () => {
    const review = read(CODE_REVIEW);
    for (const banned of ['libs/app-database', 'Kysely', 'IConfigurationService', 'Skip IoC validation']) {
      expect(review, banned).not.toContain(banned);
    }
    expect(review).toContain('### 3. IoC Configuration (CRITICAL)');
    expect(review).toContain('"ioc":15');
    expect(block(review, /^### 3\. IoC Configuration/, /^### 4\./)).toContain('N/A');

    const audit = read(SECURITY_AUDIT);
    expect(audit).not.toContain('IConfigurationService');
    expect(block(audit, /^### A01\b/, /^### A02\b/)).toContain('Tenancy');
  });

  it('L1.10 no stack names as defaults in the commands and agents', () => {
    const files = [
      'commands/add-hotfix.md',
      'commands/add-plan.md',
      'commands/add-review.md',
      'agents/ux-agent.md',
      'agents/ux-flow-agent.md',
      'agents/frontend-agent.md',
    ];
    for (const f of files) {
      expect(read(f), f).not.toMatch(/shadcn|TanStack|Zustand|React Query|Tailwind v3/);
    }
    const discover = step(read('commands/add-ux.md'), 'add-ux.discover');
    expect(discover).not.toContain('tailwind.config');
    expect(discover).not.toContain('components/ui/');
    expect(read('agents/ux-flow-agent.md')).not.toContain('Analyze tailwind config files');
  });

  it('L1.11 the architecture skills defer to recorded conventions', () => {
    expect(read(BACKEND_ARCH)).toContain('wiki/conventions.md');
    const frontend = read(FRONTEND_ARCH);
    expect(frontend).toContain('wiki/conventions.md');
    expect(frontend).toContain('if the project uses barrels');
  });

  it('L1.12 add-review has no hard-coded area paths, React patterns or layer order', () => {
    const text = read('commands/add-review.md');
    expect(text).not.toContain('React patterns');
    expect(text).not.toContain('Domain ← Repositories ← Services ← Controllers');
    expect(text).not.toContain('apps/frontend/**');
    expect(text).not.toContain('apps/backend/**');
  });

  it('L1.13 backend-agent names no fixed layer order or container', () => {
    const text = read('agents/backend-agent.md');
    expect(text).not.toContain('routes → controllers → services → repositories');
    expect(text).not.toContain('IoC containers');
    expect(text).toContain('wiki/architecture.md');
  });

  it('L1.14 add-plan keeps the three checks and drops the TypeScript wording', () => {
    const text = read('commands/add-plan.md');
    // GUARD half
    expect(text).toContain('3. Worker/DI Registration');
    expect(text).toContain('these three, and only these three');
    // RED half
    expect(text).not.toContain('TypeScript structures');
    expect(text).not.toContain('TypeScript interface');
  });

  it('L1.15 add-build area notes say barrels only if the project uses them', () => {
    const notes = step(read('commands/add-build.md'), 'add-build.area-specific-notes');
    expect(notes).toContain('barrel exports (if the project uses them)');
  });
});
