import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const codeadd = path.join(root, 'framwork', '.codeadd');
const read = (p) => fs.readFileSync(p, 'utf8');
const settingsPath = path.join(codeadd, 'skills/add--settings/SKILL.md');

describe('F1 — add--settings documents the setup section', () => {
  const text = () => read(settingsPath);
  const section = () => {
    const src = text();
    const start = src.indexOf('## Section `setup`');
    expect(start, 'add--settings has a setup section').toBeGreaterThan(-1);
    const next = src.indexOf('\n## ', start + 5);
    return src.slice(start, next === -1 ? undefined : next);
  };

  it('L1.1 names the setup-shape, the offered vocabulary and the log', () => {
    const s = section();
    for (const word of ['setup-shape', '"none"', 'offered', 'enabled', 'already-on', 'declined', 'unavailable', 'failed', 'log']) {
      expect(s, `setup section names ${word}`).toContain(word);
    }
    expect(s).toMatch(/\{ date, item, decision, reason \}/);
  });

  it('L1.1 the hard ban admits "none" only for a section with no contract', () => {
    const src = text();
    expect(src).toMatch(/neither a bare `sha256:` \+ 16 hex nor `"none"` in a section whose command has no contract/);
    expect(src).toMatch(/carries no `shape` key/);
    expect(src).toContain('`/add-setup` writes `setup`.');
  });

  it('keeps every qa rule', () => {
    const src = text();
    expect(src).toContain('MUST be `null` for `owner: shared`');
    expect(src).toContain('## Section `qa`');
  });
});
