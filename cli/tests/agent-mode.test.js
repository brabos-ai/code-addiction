import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

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

  it('L1.7 the codeadd-shell block of add-wiki.md points at the guide', () => {
    const wiki = fs.readFileSync(path.join(SOURCE, 'commands', 'add-wiki.md'), 'utf8');
    const block = wiki.match(/\[\/\/\]: # \(codeadd-shell:start\)([\s\S]*?)\[\/\/\]: # \(codeadd-shell:end\)/);
    expect(block, 'codeadd-shell block not found in add-wiki.md').not.toBeNull();
    expect(block[1]).toContain('.codeadd/agent-mode/README.md');
  });
});
