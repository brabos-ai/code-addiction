import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../../mcp/corpora.mjs';

/**
 * 0075B, F7 — the doc schemas stop naming a `ticket:` frontmatter field, and a legacy document
 * that still carries one stays valid.
 *
 * The validation gate (add--doc-schemas, "Validation Gate Block") is a prompt, not code, so the
 * legacy half cannot run it. It is pinned two ways instead: the gate's check 1 lists the required
 * fields and `ticket` is not one of them, and the one executable frontmatter reader (the docs
 * corpus parser) reads a legacy document and still sees every required field. That second test
 * starts GREEN — validation never rejected an unknown key — and is a pin against a future gate
 * that would. The removal itself is the RED half.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DOC_SCHEMAS = path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--doc-schemas');
const read = (...p) => fs.readFileSync(path.join(DOC_SCHEMAS, ...p), 'utf8');

const LEGACY_ABOUT = `---
id: 0042F
type: feature
slug: legacy-thing
status: done
branch: feat/0042f-legacy-thing
ticket: 0042B
created: 2026-08-01
updated: 2026-08-02
related: []
tags: [legacy]
---

# Legacy thing

## TL;DR

An old document that still carries the retired field.
`;

describe('F7 — add--doc-schemas drops the ticket field', () => {
  it.each(['fix.md', 'new-feature.md'])('references/%s no longer lists a ticket: field', (file) => {
    expect(read('references', file)).not.toMatch(/ticket:/);
  });

  it('references/fix.md and new-feature.md name no backlog skill or board id letter', () => {
    for (const file of ['fix.md', 'new-feature.md']) {
      const text = read('references', file);
      expect(text).not.toContain('add--backlog');
      expect(text).not.toMatch(/\[NNNN\]B/);
    }
  });

  it('the validation gate check 1 does not require ticket:', () => {
    const gate = read('SKILL.md');
    const check1 = gate.slice(gate.indexOf('1. **Frontmatter presence.**'), gate.indexOf('2. **TL;DR present'));
    expect(check1).toContain('`id:`');
    expect(check1).not.toMatch(/ticket/);
  });

  it('a legacy about.md carrying ticket: 0042B still has every required field (pin, starts green)', () => {
    const fm = parseFrontmatter(LEGACY_ABOUT);
    for (const key of ['id', 'type', 'created', 'updated', 'related', 'tags', 'branch']) {
      expect(fm, key).toHaveProperty(key);
    }
    expect(fm.type).toBe('feature');
    expect(fm.ticket).toBe('0042B');
  });
});
