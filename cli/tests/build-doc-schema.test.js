import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const build = require('../../scripts/build.js');
const { DOC_SCHEMA_VERSION } = require(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'docs-root.cjs'));
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8'));

const walk = (dir, ext, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
};

describe('{{doc-schema}} build variable (F25, R11)', () => {
  it('resolves to DOC_SCHEMA_VERSION for every provider, identically', () => {
    for (const [name, provider] of Object.entries(map.providers)) {
      if (!provider.dir || !provider.commands || !provider.skills) continue;
      const out = build.resolveResourcePaths('schema: {{doc-schema}} / {{doc-schema}}', provider);
      expect(out, name).toBe(`schema: ${DOC_SCHEMA_VERSION} / ${DOC_SCHEMA_VERSION}`);
    }
  });

  it('no markdown source carries a literal schema number', () => {
    const files = walk(path.join(ROOT, 'framwork', '.codeadd'), '.md');
    const hits = [];
    for (const f of files) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/\bschema:[ \t]*\d/.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}`);
      });
    }
    expect(hits).toEqual([]);
  });

  it('lint warns on a literal schema number and not on the variable', () => {
    build._resetLintCache();
    const warns = [];
    const orig = console.warn;
    console.warn = (m) => warns.push(String(m));
    try {
      build.lintResourcePaths('---\nschema: 1\n---\n', path.join(ROOT, 'framwork/.codeadd/commands/x-lint-a.md'));
      build.lintResourcePaths('---\nschema: {{doc-schema}}\n---\n', path.join(ROOT, 'framwork/.codeadd/commands/x-lint-b.md'));
    } finally {
      console.warn = orig;
      build._resetLintCache();
    }
    expect(warns.filter((w) => /x-lint-a/.test(w) && /literal schema number/.test(w))).toHaveLength(1);
    expect(warns.filter((w) => /x-lint-b/.test(w))).toHaveLength(0);
  });

  it('the anchor refusal fires on a planted token', () => {
    const body = [
      'schema: {{doc-schema}}',
      '<!-- slot:plan-specs fallback="fallbacks/empty.md" -->',
      '<!-- feature:tdd-pipeline:step-list -->',
      '<!-- /feature:tdd-pipeline:step-list -->',
      '<!-- /slot:plan-specs -->',
    ].join('\n');
    expect(() => build.extractSlots(body, 'add-plan', 'command', () => '')).toThrow(/variable-free anchor/i);
  });

  it('a contract block carrying the token is refused', () => {
    expect(build.CONTRACT_VARIABLE_RE.test('schema: {{doc-schema}}')).toBe(true);
  });

  it('the packaged-tree pass leaves zero tokens, each resolved to the constant', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-schema-'));
    try {
      for (const sub of ['templates', 'fragments/x', 'plugins/p/fragments', 'fallbacks', 'agent-mode/roles']) {
        fs.mkdirSync(path.join(tmp, sub), { recursive: true });
        fs.writeFileSync(path.join(tmp, sub, 'a.md'), `---\nschema: {{doc-schema}}\n---\nbody {{doc-schema}}\n`);
      }
      const changed = build.resolvePackagedDocSchema(tmp);
      expect(changed).toBe(5);
      for (const f of walk(tmp, '.md')) {
        const text = fs.readFileSync(f, 'utf8');
        expect(text).not.toContain('{{doc-schema}}');
        expect(text).toContain(`schema: ${DOC_SCHEMA_VERSION}`);
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('built provider trees carry no unresolved token', () => {
    const roots = ['.claude', '.agents', '.codex', '.cursor', '.opencode', '.gemini', '.zcode'].map((d) => path.join(ROOT, 'framwork', d));
    const left = [];
    for (const r of roots) {
      for (const f of walk(r, '.md').concat(walk(r, '.toml'))) {
        if (fs.readFileSync(f, 'utf8').includes('{{doc-schema}}')) left.push(path.relative(ROOT, f));
      }
    }
    expect(left).toEqual([]);
  });
});
