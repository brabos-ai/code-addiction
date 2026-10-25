import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const skillPath = path.join(root, 'framwork', '.codeadd', 'skills', 'add--settings', 'SKILL.md');
const read = (p) => fs.readFileSync(p, 'utf8');

describe('add--settings skill (L1.5)', () => {
  it('exists and is registered in provider-map.json', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
    const map = JSON.parse(read(path.join(root, 'framwork', 'provider-map.json')));
    expect(Object.keys(map.skills)).toContain('add--settings');
  });

  it('states the content rule', () => {
    const text = read(skillPath);
    expect(text).toMatch(/## Content Rule/);
    expect(text).toMatch(/No prompts in JSON/);
    expect(text).toMatch(/relative path/);
  });

  it('states the shared / hash: null rule', () => {
    const text = read(skillPath);
    expect(text).toMatch(/owner: shared/);
    expect(text).toMatch(/MUST be `null` for `owner: shared`/);
    expect(text).toMatch(/"owner": "shared", "hash": null/);
  });

  it('never says settings.json without the .codeadd/ prefix', () => {
    const text = read(skillPath);
    const bare = [...text.matchAll(/settings\.json/g)].filter(
      (m) => text.slice(Math.max(0, m.index - 8), m.index) !== '.codeadd/'
    );
    expect(bare).toHaveLength(0);
  });
});
