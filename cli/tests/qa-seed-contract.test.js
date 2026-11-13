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

describe('F7 — add--settings and add--setup-contract (L3.4)', () => {
  const settings = () => read('skills/add--settings/SKILL.md');
  const contract = () => read('skills/add--setup-contract/SKILL.md');

  it('add--settings names qa.seed.command and qa.seed.env, names only, never values', () => {
    const text = settings();
    expect(text).toMatch(/\| `qa\.seed\.command` \|/);
    expect(text).toMatch(/\| `qa\.seed\.env` \|[^\n]*(NAMES|names)[^\n]*never[^\n]*values/);
    expect(text).toMatch(/no[^\n]*bash/i);
  });

  it('add--settings has no local-file section and no mention of the local file', () => {
    const text = settings();
    expect(text).not.toMatch(/^## The local file/m);
    expect(text).not.toContain('settings.local.json');
  });

  it('add--setup-contract keeps the "never drop a user key" rule with no exception', () => {
    const text = contract();
    expect(text).toMatch(/Never drop a user key/);
    expect(text).not.toMatch(/ONE exception/);
    expect(text).not.toContain('settings.local.json');
  });
});

describe('F8 — /add-qa-setup studies the project and generates the seed (L3.5)', () => {
  const setup = () => read('commands/add-qa-setup.md');
  const materializes = () => {
    const text = setup();
    const start = text.indexOf('\n## Materializes');
    return text.slice(start, text.indexOf('\n## STEP add-qa-setup.context'));
  };
  const step = (id) => {
    const text = setup();
    const start = text.indexOf(`\n## STEP add-qa-setup.${id}:`);
    expect(start, `STEP add-qa-setup.${id} exists`).toBeGreaterThan(-1);
    const next = text.indexOf('\n## ', start + 5);
    return text.slice(start, next === -1 ? undefined : next);
  };

  it('the step list holds STEP add-qa-setup.seed between config and catalog', () => {
    const text = setup();
    const list = text.slice(text.indexOf('STEP add-qa-setup.context: Load context'), text.indexOf('## ⛔ ABSOLUTE PROHIBITIONS'));
    const order = [...list.matchAll(/^STEP add-qa-setup\.([\w-]+):/gm)].map((m) => m[1]);
    expect(order.indexOf('seed')).toBe(order.indexOf('config') + 1);
    expect(order.indexOf('catalog')).toBe(order.indexOf('seed') + 1);
  });

  it('the seed step analyses auth model, stores, services, existing tooling and env vars, cites files, asks only the rest', () => {
    const body = step('seed');
    for (const topic of [/auth model/i, /data stores?/i, /services?/i, /seed, fixture|existing seed/i, /env vars?/i]) expect(body).toMatch(topic);
    expect(body).toMatch(/none, session, OAuth, API key, magic link/i);
    expect(body).toMatch(/cite/i);
    expect(body).toMatch(/only what the analysis could not infer/i);
    expect(body).toMatch(/`\.codeadd\/qa\/`/);
    expect(body).toMatch(/README\.md/);
    expect(body).toMatch(/Seed Output Contract/);
    expect(body).toMatch(/no auth/i);
    expect(body).toMatch(/no bash dependency/i);
    expect(body).toMatch(/never editing/i);
  });

  it('## Materializes holds qa.seed and .codeadd/qa/ (shared), and no local settings file', () => {
    const block = materializes();
    expect(block).toMatch(/- path: \.codeadd\/qa\/\n\s+owner: shared/);
    expect(block).toMatch(/"seed": \{ "command"/);
    expect(block).not.toMatch(/settings\.local\.json/);
    expect(block).toMatch(/changed-in: 1\.9\.3/);
    expect(block).toMatch(/^## Seed$/m);
    expect(block).not.toMatch(/^## Auth \/ Seed$/m);
    expect(block).toMatch(/\*\*Seed\*\*|^\d+\. \*\*Seed\*\*/m);
  });

  it('the command names the local settings file and the retired key nowhere', () => {
    expect(setup()).not.toContain('settings.local.json');
    expect(setup()).not.toMatch(/authSeed/);
  });

  it('the proof requires QA_SEED=ok, the validate gate checks names-only and tracked seed, the prohibitions allow .codeadd/qa/', () => {
    const text = setup();
    expect(step('proof')).toMatch(/`QA_SEED`/);
    const validate = step('validate');
    expect(validate).toMatch(/qa\.seed\.command/);
    expect(validate).toMatch(/qa\.seed\.env/);
    expect(validate).toMatch(/names only/i);
    expect(validate).toMatch(/git check-ignore/);
    expect(validate).toMatch(/must NOT match/i);
    expect(text).toMatch(/\| \*\*STEP add-qa-setup\.qa-project-9\*\*[^\n]*`\.codeadd\/qa\/`/);
    expect(step('receipt')).toMatch(/\.codeadd\/qa\/`[^\n]*owner: shared|owner: shared[^\n]*\.codeadd\/qa\//);
    expect(step('handoff')).toMatch(/tracked/i);
  });
});
