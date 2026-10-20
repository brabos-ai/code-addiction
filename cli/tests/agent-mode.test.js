import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { copyRelease } from '../src/release-copy.js';

const { validateResultBlock } = createRequire(import.meta.url)('../../scripts/tests/result-block-schema.cjs');

/**
 * Product agent mode (ticket 0031B) — static reads only.
 *
 * `framwork/.codeadd/agent-mode/` ships a result schema and a bot guide. The schema is a second copy of
 * the workbench one with product descriptions, so equality is held HERE: remove `description` at every
 * depth and deep-equal the rest, which compares `required`, every `properties` key set, `type`, `enum`,
 * `const`, `additionalProperties` and `title` in one assertion.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SOURCE = path.join(ROOT, 'framwork', '.codeadd');
const PRODUCT_SCHEMA = path.join(SOURCE, 'agent-mode', 'result.schema.json');
const GUIDE = path.join(SOURCE, 'agent-mode', 'README.md');
const WORKBENCH_SCHEMA = path.join(ROOT, 'workbench', 'skills', 'add-final-report', 'references', 'result-block.schema.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** The value with every `description` key removed, at every depth. */
function withoutDescriptions(node) {
  if (Array.isArray(node)) return node.map(withoutDescriptions);
  if (node === null || typeof node !== 'object') return node;
  return Object.fromEntries(
    Object.entries(node).filter(([k]) => k !== 'description').map(([k, v]) => [k, withoutDescriptions(v)]),
  );
}

/** Every file under `dir`, recursively. */
function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? filesUnder(p) : [p];
  });
}

const SAMPLES = {
  done: { status: 'done', needs_approval: false, reason: null, next_step: null },
  stopped: { status: 'stopped', needs_approval: false, reason: 'A gate ended the run.', next_step: null },
  'needs-approval': { status: 'needs-approval', needs_approval: true, reason: 'Waiting on an answer.', next_step: 'Which scope?' },
  failed: { status: 'failed', needs_approval: false, reason: 'An unplanned error.', next_step: null },
};

const sample = (overrides) => JSON.stringify({
  v: 1, stage: 'add-build', branch: null, commits: [], tests: null, pr: null, ci: null, ticket: null, ...overrides,
});

describe('product agent mode', () => {
  it('L1.1 the product schema parses as JSON and carries no $schema key', () => {
    const schema = readJson(PRODUCT_SCHEMA);
    expect(schema).not.toHaveProperty('$schema');
  });

  it('L1.2 equals the workbench schema once every description is removed, at every depth', () => {
    expect(withoutDescriptions(readJson(PRODUCT_SCHEMA))).toEqual(withoutDescriptions(readJson(WORKBENCH_SCHEMA)));
  });

  it('L1.3 one sample per status passes validateResultBlock, and the samples cover the schema status enum', () => {
    const statuses = readJson(PRODUCT_SCHEMA).properties.status.enum;
    expect(Object.keys(SAMPLES).sort()).toEqual([...statuses].sort());
    for (const [status, overrides] of Object.entries(SAMPLES)) {
      const result = validateResultBlock(sample(overrides));
      expect(result.reasons, `sample for ${status}`).toEqual([]);
      expect(result.ok).toBe(true);
    }
  });

  it('L1.4 every /add-* command named in the guide is a command in provider-map.json', () => {
    const commands = Object.keys(readJson(path.join(ROOT, 'framwork', 'provider-map.json')).commands);
    const named = [...new Set(fs.readFileSync(GUIDE, 'utf8').match(/\/add-[a-z][a-z-]*/g) ?? [])];
    expect(named.length, 'the guide names no /add-* command').toBeGreaterThan(0);
    for (const name of named) {
      expect(commands, `the guide names ${name}, which is not a product command`).toContain(name.slice(1));
    }
  });

  it('L1.5 no command, skill or agent source mentions json-schema or result block', () => {
    // A regression guard: the contract is the schema the caller passes, never an instruction in a prompt.
    // Scans exactly these three trees — never agent-mode/ (the guide names the flag), fragments or output.
    const files = ['commands', 'skills', 'agents'].flatMap((d) => filesUnder(path.join(SOURCE, d)));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      expect(text, `${path.relative(ROOT, file)} mentions json-schema`).not.toMatch(/json-schema/i);
      expect(text, `${path.relative(ROOT, file)} mentions result block`).not.toMatch(/result block/i);
    }
  });

  it('L2.4 the guide presents claude -p as an example other providers can reproduce, and shows a Notion mirror', () => {
    const guide = fs.readFileSync(GUIDE, 'utf8');
    expect(guide).not.toMatch(/Claude Code only/i);
    expect(guide).not.toMatch(/No other provider supports this/i);
    expect(guide).toMatch(/Codex/);
    expect(guide).toMatch(/OpenCode/);
    expect(guide).toMatch(/own documentation/i);
    const s9 = guide.slice(guide.indexOf('## 9. Mirror the board'));
    expect(s9).toContain('Notion');
    expect(s9).toContain('awaiting-release');
    expect(s9).toMatch(/`release`/);
    expect(s9).toMatch(/any project-management app/i);
    expect(s9).toContain('the framework ships no tracker code');
    expect(s9).not.toMatch(/notion.so|@notionhq|api.notion/i);
  });

  it('L1.7 the codeadd-shell block of add-wiki.md points at the guide', () => {
    const wiki = fs.readFileSync(path.join(SOURCE, 'commands', 'add-wiki.md'), 'utf8');
    const block = wiki.match(/\[\/\/\]: # \(codeadd-shell:start\)([\s\S]*?)\[\/\/\]: # \(codeadd-shell:end\)/);
    expect(block, 'codeadd-shell block not found in add-wiki.md').not.toBeNull();
    expect(block[1]).toContain('.codeadd/agent-mode/README.md');
  });

  it('L1.8 the guide states the resume and worktree rules and no claude -c', () => {
    const guide = fs.readFileSync(GUIDE, 'utf8');
    expect(guide).not.toContain('claude -c');
    for (const anchor of ['--resume <session_id>', '.jsonl', 'worktree']) expect(guide).toContain(anchor);
  });

  it('L1.9 the status description says a stop or refusal is never done and names the refusal on main', () => {
    const status = readJson(PRODUCT_SCHEMA).properties.status.description;
    expect(status).toContain('is stopped, never done');
    expect(status).toMatch(/refus\w* to run on main/);
  });

  it('L1.10 guide section 1 carries the exit-code check for bash and PowerShell and says claude -p exits 0', () => {
    const guide = fs.readFileSync(GUIDE, 'utf8');
    const section = guide.slice(guide.indexOf('## 1.'), guide.indexOf('## 2.'));
    for (const anchor of ["jq -e '.structured_output.status == \"done\"'", 'ConvertFrom-Json', "-ne 'done'", 'exit 1', 'claude -p` itself exits 0']) expect(section).toContain(anchor);
  });
});

/**
 * Agent team roles (ticket 0054B) — a team section in the guide and two role files.
 *
 * Test names carry a `T` prefix: `L1.1`–`L1.10` above are taken, and a reused name would collide.
 * Every check reads files; T2.1 also installs into a temp dir it deletes at the end.
 */
const AGENT_MODE = path.join(SOURCE, 'agent-mode');
const ROLES = ['product-pm', 'chief-engineer'];
const roleText = (name) => fs.readFileSync(path.join(AGENT_MODE, 'roles', `${name}.md`), 'utf8');
const ROLE_HEADINGS = ['## Commands', '## Boundaries', '## When to stop and ask', '## Summary format'];
const LOCK_CLAIM = /per-ticket (lock|claim)|locks? (the|each|one|a) ticket|ticket is locked|claims? (the|a) ticket/i;

describe('agent team roles', () => {
  it.each(ROLES)('T1.1 roles/%s.md exists and carries the four role headings exactly once', (name) => {
    const text = roleText(name);
    for (const heading of ROLE_HEADINGS) {
      expect(text.split('\n').filter((line) => line.trim() === heading), `${name}.md heading ${heading}`).toHaveLength(1);
    }
  });

  it('T1.2 every /add-* command named in a role file is a command in provider-map.json', () => {
    const commands = Object.keys(readJson(path.join(ROOT, 'framwork', 'provider-map.json')).commands);
    const named = [...new Set(ROLES.flatMap((name) => roleText(name).match(/\/add-[a-z][a-z-]*/g) ?? []))];
    expect(named.length, 'the role files name no /add-* command').toBeGreaterThan(0);
    for (const name of named) {
      expect(commands, `a role file names ${name}, which is not a product command`).toContain(name.slice(1));
    }
  });

  it('T1.3 chief-engineer.md names its commands and the review rules, and makes /add-review optional', () => {
    const text = roleText('chief-engineer');
    for (const anchor of ['/add-plan', '/add-build', '/add-review', '/add-done', '/add-hotfix', 'Final review:', 'blocked N', 'Ruling:']) {
      expect(text, `chief-engineer.md names ${anchor}`).toContain(anchor);
    }
    expect(text).toContain("`/add-review` is optional");
    expect(text).not.toContain("/add-pull-request");
  });

  it('T1.4 product-pm.md names its commands, the release close, that it never implements, and the assignee comment', () => {
    const text = roleText('product-pm');
    for (const anchor of ['/add-brainstorm', '/add-new', 'shaped', 'backlog-commit.cjs release', 'backlog-commit.cjs comment']) {
      expect(text, `product-pm.md names ${anchor}`).toContain(anchor);
    }
    expect(text).toMatch(/never implements?/i);
  });

  it.each(ROLES)('T1.5 roles/%s.md carries the with-board and without-board handoff', (name) => {
    const text = roleText(name);
    for (const anchor of ['shaped', '-intent.md', 'about.md']) expect(text, `${name}.md names ${anchor}`).toContain(anchor);
  });

  it('T1.6 the guide has section 10, with the team rules, and sections 1 to 9 are still there', () => {
    const guide = fs.readFileSync(GUIDE, 'utf8');
    const start = guide.indexOf('## 10. Work as a team of agents');
    expect(start, 'the guide has no section 10').toBeGreaterThan(-1);
    const section = guide.slice(start);
    for (const anchor of [
      'section 2', 'backlog-commit.cjs', 'ERROR=board-locked', 'rebase-conflict', 'push-refused', 'fetch-failed',
      'RECOVERY_REF', 'shaped', '-intent.md', '/add-review', 'roles/product-pm.md', 'roles/chief-engineer.md',
    ]) {
      expect(section, `section 10 names ${anchor}`).toContain(anchor);
    }
    // These two are the detail of section 2's list. Naming them again is the copy the drift risk warns about.
    expect(section).not.toContain('--continue');
    expect(section).not.toContain('.jsonl');
    for (let n = 1; n <= 9; n++) expect(guide, `section ${n}`).toMatch(new RegExp(`^## ${n}\\. `, 'm'));
  });

  it('T1.7 no file under agent-mode/ says the board locks a ticket, and the check catches such a line', () => {
    const files = filesUnder(AGENT_MODE);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(fs.readFileSync(file, 'utf8'), `${path.relative(ROOT, file)} claims a per-ticket lock`).not.toMatch(LOCK_CLAIM);
    }
    // The guard bites: the same scan over a README copy carrying one such line must match.
    const injected = `${fs.readFileSync(GUIDE, 'utf8')}\nThe board locks each ticket while an engineer works on it.\n`;
    expect(injected).toMatch(LOCK_CLAIM);
  });

  it('T2.1 an install copies agent-mode/roles/ byte for byte', () => {
    const zip = new AdmZip();
    for (const file of filesUnder(AGENT_MODE)) {
      zip.addFile(`framwork/.codeadd/${path.relative(path.join(SOURCE), file).split(path.sep).join('/')}`, fs.readFileSync(file));
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-team-roles-'));
    try {
      copyRelease(zip, dir, []);
      for (const name of ROLES) {
        const installed = path.join(dir, '.codeadd', 'agent-mode', 'roles', `${name}.md`);
        expect(fs.existsSync(installed), `${name}.md was not installed`).toBe(true);
        expect(fs.readFileSync(installed)).toEqual(fs.readFileSync(path.join(AGENT_MODE, 'roles', `${name}.md`)));
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
