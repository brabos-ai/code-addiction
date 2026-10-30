import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pruneObsolete } from '../src/release-copy.js';

/**
 * pruneObsolete removes the files a previous install wrote and this one did not, and the
 * directories that removal leaves empty (ticket 0077F). Temp root only; nothing touches the checkout.
 */
let root;

const put = (rel, text = 'x') => {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text);
};
const has = (rel) => fs.existsSync(path.join(root, rel));

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-prune-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('pruneObsolete — emptied directories', () => {
  it('L1.1 removes the skill folders it empties, counts files only, keeps the siblings', () => {
    put('.claude/skills/add--x/SKILL.md');
    put('.agents/skills/add--x/SKILL.md');
    put('.claude/skills/add-help/SKILL.md');

    const removed = pruneObsolete(
      root,
      ['.claude/skills/add--x/SKILL.md', '.agents/skills/add--x/SKILL.md', '.claude/skills/add-help/SKILL.md'],
      ['.claude/skills/add-help/SKILL.md'],
    );

    expect(removed).toBe(2);
    expect(has('.claude/skills/add--x')).toBe(false);
    expect(has('.agents/skills/add--x')).toBe(false);
    expect(has('.claude/skills')).toBe(true);
    expect(has('.claude/skills/add-help/SKILL.md')).toBe(true);
  });

  it('L1.2 keeps a folder that still holds a file the user added', () => {
    put('.claude/skills/add--x/SKILL.md');
    put('.claude/skills/add--x/mine.md');

    const removed = pruneObsolete(root, ['.claude/skills/add--x/SKILL.md'], []);

    expect(removed).toBe(1);
    expect(has('.claude/skills/add--x/SKILL.md')).toBe(false);
    expect(has('.claude/skills/add--x/mine.md')).toBe(true);
  });

  it('L1.2 never removes a directory directly under the install root', () => {
    put('.claude/skills/add--x/SKILL.md');

    pruneObsolete(root, ['.claude/skills/add--x/SKILL.md'], []);

    // `.claude/skills` is empty now and may go; `.claude` is depth 1 and stays, empty or not.
    expect(has('.claude/skills')).toBe(false);
    expect(has('.claude')).toBe(true);
    expect(fs.existsSync(root)).toBe(true);
  });

  it('L1.2 stops at the first directory that is not empty', () => {
    put('.claude/skills/add--x/SKILL.md');
    put('.claude/skills/other/SKILL.md');

    pruneObsolete(root, ['.claude/skills/add--x/SKILL.md'], ['.claude/skills/other/SKILL.md']);

    expect(has('.claude/skills/add--x')).toBe(false);
    expect(has('.claude/skills/other/SKILL.md')).toBe(true);
  });

  it('L1.3 keeps a preserved path and its folder', () => {
    put('.codeadd/history/session.json');

    const removed = pruneObsolete(root, ['.codeadd/history/session.json'], []);

    expect(removed).toBe(0);
    expect(has('.codeadd/history/session.json')).toBe(true);
  });
});
