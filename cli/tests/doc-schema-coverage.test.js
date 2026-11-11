import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

/**
 * doc-schema-coverage — every writer of a generated document carries the schema
 * version (plan 0078F, F26, L1.15). The number is never written: only the build
 * variable `{{doc-schema}}` (build-doc-schema.test.js holds the other half), and the
 * scripts take it from DOC_SCHEMA_VERSION.
 */
const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (...p) => fs.readFileSync(path.join(CODEADD, ...p), 'utf8');
const SKILL = read('skills', 'add--doc-schemas', 'SKILL.md');
const section = (text, heading) => {
  const start = text.indexOf(`\n## ${heading}\n`);
  if (start === -1) return '';
  const next = text.indexOf('\n## ', start + 1);
  return text.slice(start, next === -1 ? undefined : next);
};
const TOKEN = 'schema: {{doc-schema}}';

describe('the owner skill', () => {
  it('lists schema among the mandatory fields of Universal Document Requirements', () => {
    expect(section(SKILL, 'Universal Document Requirements')).toContain(TOKEN);
  });

  it('the Schema Version section states the legacy-0 rule, the bump rule and the JSONL v', () => {
    const s = section(SKILL, 'Schema Version');
    expect(s).not.toBe('');
    expect(s).toMatch(/schema `0` — legacy/);
    expect(s).toMatch(/only when the doc format changes/);
    expect(s).toMatch(/never follows the package version/);
    expect(s).toMatch(/per-line `v`/);
    expect(s).toContain('docSchemaOf');
  });

  it('the validation gate checks the schema key', () => {
    expect(section(SKILL, "STEP N: Validation Gate (add--doc-schemas)")).toMatch(/`schema:` is present/);
  });
});

describe('every reference schema example carries the version', () => {
  const refs = fs
    .readdirSync(path.join(CODEADD, 'skills', 'add--doc-schemas', 'references'))
    .filter((f) => f.endsWith('.md') && !['delivery-index.md', 'receipt.md'].includes(f));

  for (const file of refs) {
    it(`${file}: every Frontmatter line and fenced frontmatter example names schema`, () => {
      const text = read('skills', 'add--doc-schemas', 'references', file);
      const lines = text.split('\n');
      const bad = [];
      lines.forEach((line, i) => {
        if (/^- \*\*Frontmatter:\*\*/.test(line) && !/`schema:/.test(line) && !/keeps `id`/.test(line) && !/the same id/.test(line)) {
          bad.push(`${file}:${i + 1}`);
        }
      });
      // a fenced block opening with `---` and carrying `type:` is an example and must carry the token
      for (const m of text.matchAll(/```[a-z]*\n(---\n[\s\S]*?\n---)\n/g)) {
        if (/^type:/m.test(m[1]) && !m[1].includes(TOKEN)) bad.push(`${file}: fenced example without ${TOKEN}`);
      }
      expect(bad).toEqual([]);
    });
  }
});

describe('every writer of the formerly frontmatter-less outputs carries type + schema', () => {
  it('tasks.md — the checklist skill owns the template', () => {
    const t = read('skills', 'add--tasks-checklist', 'SKILL.md');
    expect(t).toContain('type: tasks');
    expect(t).toContain(TOKEN);
  });

  it('health-check reports — every analyzer template', () => {
    const dir = path.join(CODEADD, 'skills', 'add--health-check');
    const analyzers = fs.readdirSync(dir).filter((f) => /-(analyzer|check)\.md$|context-discovery\.md$/.test(f));
    expect(analyzers.length).toBeGreaterThan(3);
    for (const f of analyzers) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(text, f).toContain('type: health-check');
      expect(text, f).toContain(TOKEN);
    }
  });

  it('code-quality-review.md — the analyzer template', () => {
    const t = read('skills', 'add--architecture-discovery', 'code-quality-analyzer.md');
    expect(t).toContain('type: code-quality-review');
    expect(t).toContain(TOKEN);
  });

  it('every shipped template carries the token', () => {
    const dir = path.join(CODEADD, 'templates');
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && x !== 'docs-migrate-prompt.md')) {
      expect(fs.readFileSync(path.join(dir, f), 'utf8'), f).toContain(TOKEN);
    }
  });

  it('the scripts that create iterations.md and build-ledger.md read DOC_SCHEMA_VERSION, never a number', () => {
    for (const f of ['log-iteration.cjs', 'build-ledger.cjs']) {
      const src = read('scripts', f);
      expect(src, f).toContain('DOC_SCHEMA_VERSION');
      expect(src, f).not.toMatch(/schema: \d/);
    }
  });

  it('log-jsonl.cjs declares its own line version once', () => {
    const src = read('scripts', 'log-jsonl.cjs');
    expect(src.match(/LOG_LINE_VERSION = \d+/g)).toHaveLength(1);
  });
});

describe('the registry knows the six new types', () => {
  it('DOCS_LAYOUT.types and mcp/types.mjs both carry them', async () => {
    const { DOCS_LAYOUT } = require(path.join(CODEADD, 'scripts', 'docs-root.cjs'));
    const { TYPES } = await import('../../mcp/types.mjs');
    for (const t of ['iterations', 'build-ledger', 'tasks', 'health-check', 'design-system', 'code-quality-review']) {
      expect(Object.keys(DOCS_LAYOUT.types), t).toContain(t);
      expect(Object.keys(TYPES), t).toContain(t);
    }
  });
});
