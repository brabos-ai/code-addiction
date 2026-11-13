import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * qa-project-seed — contract text of the project-based QA seed (L3.2–L3.7).
 * Created by F6; each later F-block adds its own cases to this file, RED first.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(ROOT, 'framwork', '.codeadd');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

describe('F6 — the Seed Output Contract lives in add--qa', () => {
  const skill = () => read('skills/add--qa/SKILL.md');

  it('add--qa carries a Seed Output Contract with ready, baseUrl, identity (null allowed) and data', () => {
    const text = skill();
    expect(text).toMatch(/^## Seed Output Contract/m);
    const section = text.slice(text.indexOf('## Seed Output Contract'));
    const body = section.slice(0, section.indexOf('\n## ', 5) === -1 ? undefined : section.indexOf('\n## ', 5));
    for (const field of ['`ready`', '`baseUrl`', '`identity`', '`data`']) expect(body).toContain(field);
    expect(body).toMatch(/null/);
    expect(body).toMatch(/last stdout line/i);
    expect(body).toMatch(/exit(s)? 0/i);
    expect(body).toMatch(/env var names?/i);
    expect(body).toMatch(/\/add-qa-setup|\{\{cmd:add-qa-setup\}\}/);
    expect(body).toMatch(/no (login|sign-in)/i);
  });

  it('the data-seed root cause is a seed gap and no row routes to a settings field', () => {
    const text = skill();
    expect(text).toMatch(/\| `data-seed` \|[^\n]*seed gap/i);
    expect(text).not.toMatch(/settings\.local\.json/);
  });

  it('the coordinator and the skill route a seed gap to the seed in .codeadd/qa/', () => {
    const coordinator = read('skills/add--qa/references/coordinator.md');
    expect(coordinator).toMatch(/data-seed[^\n]*\.codeadd\/qa\//);
    expect(skill()).toMatch(/data-seed[^\n]*\.codeadd\/qa\//);
    expect(coordinator).not.toMatch(/settings\.local\.json/);
  });
});
