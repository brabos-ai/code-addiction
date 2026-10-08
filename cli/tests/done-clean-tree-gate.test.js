import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

/** The gate is an instruction an agent reads, so the suite holds the text that tells it what to check. */
describe('add-framework--done STEP 2.3 clean-tree gate', () => {
  const skill = read('workbench', 'skills', 'add-framework--done', 'SKILL.md');
  const gate = skill.match(/^2\. \*\*No tracked file[^\n]*/m)?.[0] ?? '';

  it('stops on uncommitted changes to tracked files only', () => {
    expect(gate).toContain('git status --porcelain --untracked-files=no');
    expect(gate).toMatch(/STOP/);
  });

  it('lets unrelated untracked paths through', () => {
    expect(gate).toMatch(/Untracked paths[^.]*do not block/);
  });

  it('no longer asks for a fully clean tree', () => {
    expect(skill).not.toContain('The working tree must be clean.');
  });
});

describe('phases.md in-review', () => {
  it('does not claim the board checks for an open PR', () => {
    const row = read('framwork', '.codeadd', 'skills', 'add--backlog', 'references', 'phases.md').match(/^\| `in-review` \|[^\n]*/m)[0];
    expect(row).not.toContain('a pull request is open');
    expect(row).toContain('does not check');
  });
});
