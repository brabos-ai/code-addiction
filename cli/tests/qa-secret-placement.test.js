import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Decision 8 — `qa.authSeed` never lives in the committed `.codeadd/settings.json`.
 * Every shipped source that names it places it in the gitignored local file instead.
 * Fixtures and examples here use no credential at all.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'framwork', '.codeadd');
const LOCAL = 'settings.local.json';
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

// A line may name authSeed and the tracked file together only to FORBID it there.
const NEGATION = /\b(no|not|never|without|holds no|must not)\b/i;

/** Lines naming authSeed together with the tracked settings file, with neither a local-file mention nor a negation. */
function misplacedLines(text) {
  return text.split('\n').filter((line) =>
    line.includes('authSeed') && /settings\.json/.test(line) && !line.includes(LOCAL) && !NEGATION.test(line));
}

/** Fenced json blocks that carry authSeed, with the three lines above each fence. */
function authSeedBlocks(text) {
  const lines = text.split('\n');
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^```json/.test(lines[i])) continue;
    let end = i + 1;
    while (end < lines.length && !/^```/.test(lines[end])) end++;
    const body = lines.slice(i + 1, end).join('\n');
    if (body.includes('authSeed')) found.push({ above: lines.slice(Math.max(0, i - 3), i).join('\n'), body });
    i = end;
  }
  return found;
}

const placedInLocalFile = (rel) => {
  const text = read(rel);
  expect(text, `${rel} names authSeed`).toContain('authSeed');
  expect(text, `${rel} names the local file`).toContain(LOCAL);
  expect(misplacedLines(text), `${rel} places authSeed in settings.json`).toEqual([]);
  for (const block of authSeedBlocks(text)) {
    expect(block.above, `${rel}: a json block with authSeed must be introduced as the local file`).toContain(LOCAL);
  }
};

const GROUPS = {
  'F4 — the settings and setup-contract skills': [
    'skills/add--settings/SKILL.md',
    'skills/add--setup-contract/SKILL.md',
  ],
};

describe('authSeed placement', () => {
  for (const [name, files] of Object.entries(GROUPS)) {
    describe(name, () => {
      for (const rel of files) it(`${rel} places authSeed in ${LOCAL}`, () => placedInLocalFile(rel));
    });
  }

  it('the settings skill states the content rule: no credential value in the committed settings file', () => {
    const text = read('skills/add--settings/SKILL.md');
    expect(text).toMatch(/no (credential|password)[^\n]*settings\.json|settings\.json[^\n]*(never|no)[^\n]*(credential|password|token)/i);
    expect(text).toMatch(/gitignored/i);
  });

  it('the setup-contract names authSeed as the one key MOVED to the local file, an exception to "never drop a user key"', () => {
    const text = read('skills/add--setup-contract/SKILL.md');
    expect(text).toMatch(/authSeed[^\n]*(moved|move)[^\n]*settings\.local\.json|settings\.local\.json[^\n]*authSeed[^\n]*(moved|move)/i);
  });
});
