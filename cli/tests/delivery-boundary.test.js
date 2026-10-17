import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-10-17T083012 — deploy out of scope.
 *
 * The plan's Validation Matrix, L1 (text assertions over the product
 * sources). Written RED against the pre-plan tree: add--tasks-checklist had
 * no Delivery Boundary section and taught `Verify: npm run migrate`,
 * add-plan.md had no pointer to it, add-new.md's "Independent flow" never
 * excluded a deploy stage, database-agent.md listed Prisma/Drizzle/Knex,
 * add-build.md and add-review.md named Kysely/Knex/Zustand/NestJS/
 * class-validator, and add--plan-review had no deploy check.
 *
 * L2 (`build.js` clean, the full suite, the test-loss guard) and L3 (a cold
 * read of the built skill, the docs lines) are run by the build per F-block
 * and recorded in the ledger.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const P = {
  tasksChecklist: path.join(CODEADD, 'skills', 'add--tasks-checklist', 'SKILL.md'),
  addPlan: path.join(CODEADD, 'commands', 'add-plan.md'),
  addNew: path.join(CODEADD, 'commands', 'add-new.md'),
  databaseAgent: path.join(CODEADD, 'agents', 'database-agent.md'),
  addBuild: path.join(CODEADD, 'commands', 'add-build.md'),
  addReview: path.join(CODEADD, 'commands', 'add-review.md'),
  loggingAndTasks: path.join(
    CODEADD, 'skills', 'add--subagent-driven-development', 'references', 'persistent-logging-and-tasks.md',
  ),
  planReview: path.join(CODEADD, 'skills', 'add--plan-review', 'SKILL.md'),
};

const read = (p) => fs.readFileSync(p, 'utf8');

/**
 * The text from `startRe` up to the first match of `endRe` after it (or the
 * end of the file). Located by text so a line shift cannot move it.
 */
function between(text, startRe, endRe) {
  const m = text.match(startRe);
  if (!m) return null;
  const from = m.index;
  const rest = text.slice(from + m[0].length);
  const e = rest.search(endRe);
  return e < 0 ? text.slice(from) : text.slice(from, from + m[0].length + e);
}

const deliveryBoundary = (text) => between(text, /^## Delivery Boundary\s*$/m, /^## (?!Delivery Boundary)/m);

describe('F1 — add--tasks-checklist owns the Delivery Boundary', () => {
  it('L1.1 has a ## Delivery Boundary H2 naming the rule, the allowed work and the fallback', () => {
    const text = read(P.tasksChecklist);
    const sec = deliveryBoundary(text);
    expect(sec, 'section ## Delivery Boundary').not.toBeNull();
    expect(sec).toMatch(/one merge/i);
    expect(sec).toMatch(/shared, staging or production/i);
    expect(sec).toMatch(/intermediate deploy/i);
    expect(sec).toMatch(/unless the user/i);
    expect(sec).toMatch(/note/i);
    expect(sec).toMatch(/local or test database/i);
    expect(sec).toMatch(/Playwright/);
    expect(sec).toMatch(/validation_gates/);
    expect(sec).toMatch(/fallback/i);
  });

  it('L1.1 sits between Canonical Structure and Section Rules', () => {
    const text = read(P.tasksChecklist);
    const canon = text.indexOf('## Canonical Structure');
    const boundary = text.indexOf('## Delivery Boundary');
    const rules = text.indexOf('## Section Rules');
    expect(canon).toBeGreaterThan(-1);
    expect(boundary).toBeGreaterThan(canon);
    expect(rules).toBeGreaterThan(boundary);
  });

  // GREEN by design: guards what must survive.
  it('L1.1 keeps the `Verify:` tier rule and the CI-tier wording', () => {
    const text = read(P.tasksChecklist);
    expect(text).toContain('`Verify:` tier rule');
    expect(text).toContain('CI-tier');
  });

  it('L1.2 the examples no longer teach npm run migrate or a bare "tests pass"', () => {
    const text = read(P.tasksChecklist);
    expect(text).not.toContain('npm run migrate');
    expect(text).not.toContain('Verify: tests pass');
    expect(text).toContain('Verify: `<migration command from AGENTS.md>` against the local test database');
    expect(text).toContain('Verify: `<validation_gates.test>` scoped to `path/a.spec.ts`');
  });

  it('L1.2 the infra service is config files only', () => {
    const text = read(P.tasksChecklist);
    const line = text.split('\n').find((l) => l.includes('Allowed services:'));
    expect(line, 'Allowed services line').toBeDefined();
    expect(line).toMatch(/config files only/i);
  });

  it('L1.2 the Verify bullet in Section Rules points to the Delivery Boundary', () => {
    const text = read(P.tasksChecklist);
    const line = text.split('\n').find((l) => l.startsWith('- `Verify`: MANDATORY'));
    expect(line, 'Verify bullet').toBeDefined();
    expect(line).toContain('Delivery Boundary');
  });

  it("L1.2 the architect template's ## RULES names the Delivery Boundary", () => {
    const text = read(P.tasksChecklist);
    const rules = between(text, /^## RULES\s*$/m, /^## OUTPUT\s*$/m);
    expect(rules, 'architect ## RULES').not.toBeNull();
    expect(rules).toContain('Delivery Boundary');
  });

  it('L1.2 the Validation Checklist has an item on deploy/migrations outside local/test', () => {
    const text = read(P.tasksChecklist);
    const list = between(text, /^## Validation Checklist\s*$/m, /^## (?!Validation Checklist)/m);
    expect(list, '## Validation Checklist').not.toBeNull();
    expect(list).toMatch(/deploy/i);
    expect(list).toMatch(/local/i);
  });
});

describe('F2 — add-plan.md points to the Delivery Boundary', () => {
  it('L1.3 STEP add-plan.tasks names the Delivery Boundary', () => {
    const text = read(P.addPlan);
    const step = between(text, /^### STEP add-plan\.tasks /m, /^### STEP /m);
    expect(step, 'STEP add-plan.tasks').not.toBeNull();
    expect(step).toContain('Delivery Boundary');
  });

  it('L1.3 the ### Migration template block says the deploy process applies the file', () => {
    const text = read(P.addPlan);
    const block = between(text, /^ {2}### Migration\s*$/m, /^ {2}### Repository/m);
    expect(block, '### Migration block').not.toBeNull();
    expect(block).toMatch(/deploy process/i);
    expect(block).toContain('/add-done');
  });

  it('L1.3 the Global Constraints example does not hard-code npm run lint', () => {
    const text = read(P.addPlan);
    const block = between(text, /^## Global Constraints\s*$/m, /^⛔ \*\*Verbatim is load-bearing/m);
    expect(block, 'Global Constraints example').not.toBeNull();
    expect(block).not.toContain('`npm run lint`');
    expect(block).toContain('validation_gates');
  });
});

describe('F3/F4 — add-new and database-agent', () => {
  it('L1.4 add-new "Independent flow" says a deploy stage is not a split', () => {
    const text = read(P.addNew);
    const line = text.split('\n').find((l) => l.startsWith('**Independent flow**'));
    expect(line, 'Independent flow line').toBeDefined();
    expect(line).toMatch(/deploy stage/i);
  });

  it('L1.4 database-agent names AGENTS.md for the migration tool and validates on local/test only', () => {
    const text = read(P.databaseAgent);
    expect(text).toContain('AGENTS.md');
    expect(text).toMatch(/local or test database/i);
    expect(text).not.toMatch(/Prisma|Drizzle|Knex/);
  });

  // GREEN by design: guards what must survive.
  it('L1.4 database-agent keeps the gitnexus slot markers', () => {
    const text = read(P.databaseAgent);
    expect(text).toContain('<!-- slot:gitnexus.graph fallback="fallbacks/empty.md" -->');
    expect(text).toContain('<!-- /slot:gitnexus.graph -->');
  });
});

describe('F5/F6/F7 — examples stop naming a stack', () => {
  const STACK = /Kysely|Knex|Zustand|NestJS|class-validator|app\.module\.ts|worker\.module\.ts/;
  // add-review.md carries two "## VALIDATION CHECKLIST" blocks (backend and frontend reviewer);
  // the plan scopes only the backend one, which opens with the **Patterns** category.
  const BACKEND_CHECKLIST = /^ {2}## VALIDATION CHECKLIST\s*\n\s*\n {2}\*\*Patterns/m;

  it('L1.5 add-build Area-Specific Notes and Skills Reference carry no stack name', () => {
    const text = read(P.addBuild);
    const notes = between(text, /^#### STEP add-build\.area-specific-notes /m, /^#### STEP add-build\.subagent-dispatch /m);
    expect(notes, 'STEP add-build.area-specific-notes').not.toBeNull();
    expect(notes).not.toMatch(STACK);
  });

  // GREEN by design: guards what must survive.
  it('L1.5 add-build keeps the MANDATORY frontend skill load and the three skill references', () => {
    const text = read(P.addBuild);
    const notes = between(text, /^#### STEP add-build\.area-specific-notes /m, /^#### STEP add-build\.subagent-dispatch /m);
    expect(notes).toContain('MANDATORY: Load skill `add--frontend-development`');
    expect(notes).toContain('add--backend-development');
    expect(notes).toContain('add--database-development');
  });

  it('L1.5 add-review VALIDATION CHECKLIST carries no stack name', () => {
    const text = read(P.addReview);
    const list = between(text, BACKEND_CHECKLIST, /^ {2}## RULES\s*$/m);
    expect(list, 'VALIDATION CHECKLIST').not.toBeNull();
    expect(list).not.toMatch(STACK);
    expect(list).not.toMatch(/npm vulnerabilities/);
  });

  // GREEN by design: guards what must survive.
  it('L1.5 add-review keeps every check category', () => {
    const text = read(P.addReview);
    const list = between(text, BACKEND_CHECKLIST, /^ {2}## RULES\s*$/m);
    expect(list, 'VALIDATION CHECKLIST').not.toBeNull();
    for (const cat of ['Patterns', 'Architecture', 'Database', 'Security', 'Code Quality', 'Error Handling']) {
      expect(list, cat).toContain(`**${cat}`);
    }
  });

  it('L1.5 persistent-logging-and-tasks example row carries no npm run migrate', () => {
    expect(read(P.loggingAndTasks)).not.toContain('npm run migrate');
  });
});

describe('F8 — add--plan-review catches a plan that deploys', () => {
  it('L1.6 the feature-plan extra mentions deploy and the shared environment', () => {
    const text = read(P.planReview);
    const extras = between(text, /^## Kind-Specific Extras\s*$/m, /^## Severity\s*$/m);
    expect(extras, '## Kind-Specific Extras').not.toBeNull();
    const line = extras.split('\n').find((l) => l.startsWith('- **`feature-plan`:**'));
    expect(line, 'feature-plan bullet').toBeDefined();
    expect(line).toMatch(/deploy/i);
    expect(line).toMatch(/shared/i);
    expect(line).toContain('Delivery Boundary');
  });

  // GREEN by design: guards what must survive.
  it('L1.6 the Dimensions section still holds exactly the nine names', () => {
    const text = read(P.planReview);
    const dims = between(text, /^## Dimensions/m, /^## Kind-Specific Extras\s*$/m);
    expect(dims, '## Dimensions').not.toBeNull();
    const rows = dims.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !l.startsWith('| Dimension'));
    expect(rows).toHaveLength(9);
  });

  // GREEN by design: guards what must survive.
  it('L1.6 the feature-plan kind still does not read about.md or tasks.md', () => {
    const text = read(P.planReview);
    expect(text).toContain('Do NOT read `about.md`, `tasks.md`, or `design.md`.');
  });
});
