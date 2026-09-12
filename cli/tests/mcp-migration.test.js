import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-12T104012 — F17 and F18, the brownfield migration.
 *
 * Validation Matrix level L3, plus L4.1 and L4.5. The levels the plan's
 * Reviewer Handoff singles out are here in the shape it asks for: L3.2 SHOWS
 * the diff rather than summarising it, and L3.3 asserts a relation per source
 * EDGE rather than comparing totals.
 */

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'package.json'), 'utf8'));

describe('F17 — yaml is a direct CLI dependency', () => {
  it('is declared, not relied on transitively', () => {
    // The plan assumed it was already present transitively. It was not:
    // `npm ls yaml` reported empty and an import threw ERR_MODULE_NOT_FOUND.
    expect(PKG.dependencies.yaml).toBeTypeOf('string');
  });

  it('is ranged like its neighbours, not pinned against them', () => {
    const ranges = Object.values(PKG.dependencies);
    expect(ranges.every((r) => r.startsWith('^')), JSON.stringify(PKG.dependencies)).toBe(true);
  });

  it('is in the lockfile, so a CI install gets the same one', () => {
    const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'package-lock.json'), 'utf8'));
    expect(lock.packages['node_modules/yaml']).toBeTruthy();
    expect(lock.packages[''].dependencies.yaml).toBe(PKG.dependencies.yaml);
  });

  it('resolves from cli/src at runtime', async () => {
    const yaml = await import('yaml');
    expect(yaml.parse('a: 1\nb: [x, y]\n')).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('a hand-rolled reader is what it replaces — a multi-line value survives', async () => {
    const yaml = await import('yaml');
    const parsed = yaml.parse('description: >\n  one line\n  and another\nid: 0042F\n');
    expect(parsed.id).toBe('0042F');
    expect(parsed.description).toContain('one line and another');
  });

  it('the MCP server still takes no dependency, yaml included', () => {
    for (const file of fs.readdirSync(path.join(ROOT, 'mcp'))) {
      const source = fs.readFileSync(path.join(ROOT, 'mcp', file), 'utf8');
      const specs = [...source.matchAll(/^import .*? from '([^']+)';$/gm)].map((m) => m[1]);
      for (const spec of specs) {
        expect(spec.startsWith('node:') || spec.startsWith('./'), `${file}: ${spec}`).toBe(true);
      }
    }
  });
});
