import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SKILL = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--doc-schemas', 'SKILL.md'), 'utf8');
const section = (text, heading) => {
  const start = text.indexOf(`\n## ${heading}\n`);
  if (start === -1) return '';
  const next = text.indexOf('\n## ', start + 1);
  return text.slice(start, next === -1 ? undefined : next);
};

describe('Docs Branch — the shared instruction (F12, L1.9)', () => {
  const docsBranch = section(SKILL, 'Docs Branch');

  it('add--doc-schemas owns a Docs Branch section', () => {
    expect(docsBranch).not.toBe('');
  });

  it('it names the root, the branch and the DOCS= vocabulary', () => {
    expect(docsBranch).toContain('.codeadd/docs/');
    expect(docsBranch).toContain('codeadd-docs');
    for (const word of ['ready', 'created', 'linked', 'missing']) expect(docsBranch).toContain(`\`${word}\``);
  });

  it('it carries the universal search line: pass the root explicitly to rg/Grep', () => {
    expect(docsBranch).toMatch(/skip git-ignored paths/);
    expect(docsBranch).toMatch(/rg -n "[^"]+" \.codeadd\/docs\//);
  });

  it('it owns the end-of-command rule: commit before the final report, and /add-done pushes', () => {
    expect(docsBranch).toContain('node .codeadd/scripts/docs-branch.cjs commit');
    expect(docsBranch).toMatch(/final report/);
    expect(docsBranch).toContain('/add-done');
    for (const word of ['committed', 'clean', 'failed']) expect(docsBranch).toContain(word);
  });

  it('doc-reference resolution greps the docs root, never an implicit path', () => {
    expect(SKILL).toContain('rg "^id: F0042$" .codeadd/docs/');
    expect(SKILL).toContain('rg "^id: <ID>$" .codeadd/docs/');
  });
});
