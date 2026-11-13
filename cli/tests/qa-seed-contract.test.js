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

describe('F9 — agent-mode config values ask only what the analysis could not infer (L3.5)', () => {
  const fragment = () => read('fragments/agent-mode/add-qa-setup.md');
  const fallback = () => read('fallbacks/agent-mode.add-qa-setup.config-values.md');
  const section = () => {
    const text = fragment();
    const start = text.indexOf('<!-- section:config-values -->');
    return text.slice(start, text.indexOf('<!-- /section:config-values -->'));
  };

  for (const [name, get] of [['the fragment section', section], ['the fallback', fallback]]) {
    it(`${name} takes values from the project analysis and asks only what it could not infer`, () => {
      const text = get();
      expect(text).toMatch(/project analysis/i);
      expect(text).toMatch(/only what the analysis could not infer/i);
      expect(text).toMatch(/never ask for a secret value|never asks? for a secret value/i);
      expect(text).toMatch(/env var name/i);
      expect(text).not.toMatch(/do NOT guess base URL or auth\/seed flow/);
    });
  }
});

describe('F10 — /add-setup carries no seed vocabulary (L3.6)', () => {
  const addSetup = () => read('commands/add-setup.md');

  it('the value batch names neither the retired key nor the local settings file, and points to the analysis of /add-qa-setup', () => {
    const text = addSetup();
    expect(text).not.toMatch(/authSeed/);
    expect(text).not.toContain('settings.local.json');
    expect(text).toMatch(/\{\{cmd:add-qa-setup\}\}`?'s own analysis could not infer/);
  });

  it('add-setup contains no seed sentinel', () => {
    for (const sentinel of ['qa.seed', '.codeadd/qa/', 'QA_SEED', 'Seed Update', 'seed coverage']) {
      expect(addSetup(), sentinel).not.toContain(sentinel);
    }
  });
});

describe('F11 — the QA readers consume the seed output and improvise no sign-in (L3.3)', () => {
  const FILES = {
    'agents/qa-agent.md': 'qa-agent',
    'agents/e2e-agent.md': 'e2e-agent',
    'plugins/playwright/fragments/agents/qa-agent.md': 'playwright qa-agent fragment',
    'plugins/playwright/fragments/add-review.md': 'playwright add-review fragment',
  };

  for (const [rel, name] of Object.entries(FILES)) {
    it(`${name} names neither the retired key nor the local settings file, and has no login fallback`, () => {
      const text = read(rel);
      expect(text).not.toMatch(/authSeed/);
      expect(text).not.toContain('settings.local.json');
      expect(text).not.toMatch(/\blogin\b/i);
    });
  }

  for (const rel of ['agents/qa-agent.md', 'agents/e2e-agent.md', 'plugins/playwright/fragments/agents/qa-agent.md']) {
    it(`${rel} consumes the Seed Output Contract and treats an auth screen without identity as a data-seed finding`, () => {
      const text = read(rel);
      expect(text).toMatch(/Seed Output Contract/);
      expect(text).toMatch(/identity/);
      expect(text).toMatch(/env var names?/i);
    });
  }

  it('qa-agent and the plugin fragment say an auth:true screen with no identity is a data-seed finding, never a guess', () => {
    for (const rel of ['agents/qa-agent.md', 'plugins/playwright/fragments/agents/qa-agent.md']) {
      expect(read(rel), rel).toMatch(/auth:true[^\n]*data-seed|data-seed[^\n]*auth:true/);
    }
  });

  it('e2e-agent may write .codeadd/qa/ for the per-feature seed update', () => {
    expect(read('agents/e2e-agent.md')).toMatch(/`\.codeadd\/qa\/`/);
    expect(read('agents/e2e-agent.md')).toMatch(/seed update/i);
  });

  it('the playwright add-review fragment carries no seed sentinel — it injects with QA off', () => {
    const text = read('plugins/playwright/fragments/add-review.md');
    for (const sentinel of ['qa.seed', '.codeadd/qa/', 'QA_SEED', 'Seed Update', 'seed coverage', 'Seed Output Contract']) {
      expect(text, sentinel).not.toContain(sentinel);
    }
    expect(text).toMatch(/identity the QA judgement hands/i);
    expect(text).toMatch(/does not sign in/i);
  });
});

describe('F13 — add-plan asks for a seed update through the qa-spec fragment (L3.7)', () => {
  const section = () => {
    const text = read('fragments/qa-pipeline/add-plan.md');
    const start = text.indexOf('<!-- section:qa-spec -->');
    return text.slice(start, text.indexOf('<!-- /section:qa-spec -->'));
  };

  it('the qa-spec section compares the screens in scope with .codeadd/qa/README.md and writes ## QA Seed Update', () => {
    const body = section();
    expect(body).toContain('## QA Seed Update');
    expect(body).toContain('.codeadd/qa/README.md');
    expect(body).toMatch(/`none`|\bnone\b/);
    expect(body).toMatch(/screen that needs it/i);
    expect(body).toMatch(/seed-update task/i);
  });

  it('a missing .codeadd/qa/ is a warning that names /add-qa-setup, never a stop', () => {
    const body = section();
    expect(body).toMatch(/\.codeadd\/qa\/[^\n]*warning[^\n]*\{\{cmd:add-qa-setup\}\}|warning[^\n]*\.codeadd\/qa\/[^\n]*\{\{cmd:add-qa-setup\}\}/i);
    expect(body).toMatch(/never a stop/i);
  });

  it('add--qa-spec documents the ## QA Seed Update block with none or one row per data/prerequisite and its screen', () => {
    const text = read('skills/add--qa-spec/SKILL.md');
    expect(text).toContain('## QA Seed Update');
    expect(text).toMatch(/`none`/);
    expect(text).toMatch(/screen/);
    expect(text).toContain('.codeadd/qa/README.md');
  });
});

describe('F14 — add-build applies the seed update and checks seed coverage through its fragment (L3.7)', () => {
  const fragment = () => read('fragments/qa-pipeline/add-build.md');
  const section = (name) => {
    const text = fragment();
    const start = text.indexOf(`<!-- section:${name} -->`);
    return text.slice(start, text.indexOf(`<!-- /section:${name} -->`));
  };

  it('e2e-dispatch orders the seed update before spec authoring, in the same spec batch commit', () => {
    const body = section('e2e-dispatch');
    expect(body).toContain('## QA Seed Update');
    const update = body.indexOf('## QA Seed Update');
    const author = body.indexOf('author ONE <surface>.qa.spec');
    expect(update).toBeGreaterThan(-1);
    expect(update).toBeLessThan(author);
    expect(body).toMatch(/`\.codeadd\/qa\/`[^\n]*seed[^\n]*README|seed[^\n]*README[^\n]*`\.codeadd\/qa\/`/i);
    expect(body).toMatch(/same (spec )?batch/i);
    expect(body).toMatch(/read-write on test files and `\.codeadd\/qa\/`/);
  });

  it('e2e-dispatch holds the seed coverage check before ## Final Review, and a gap becomes an E2E-n row', () => {
    const body = section('e2e-dispatch');
    expect(body).toMatch(/seed coverage/i);
    const coverage = body.search(/seed coverage/i);
    expect(body.slice(coverage)).toMatch(/E2E-n/);
    expect(body.slice(coverage)).toMatch(/Final Review/);
    expect(body).toMatch(/new screen/i);
    expect(body).toMatch(/identity/);
  });

  it('qa-fix routes a data-seed row to the seed in .codeadd/qa/ or /add-qa-setup, and no settings field', () => {
    const body = section('qa-fix');
    expect(body).toMatch(/`data-seed`[^\n]*`\.codeadd\/qa\/`/);
    expect(body).toMatch(/\{\{cmd:add-qa-setup\}\}/);
    expect(body).not.toMatch(/settings\.local\.json|authSeed/);
  });
});

describe('F15 — add-review blocks without a seed and runs it before capture, through its fragment (L3.7)', () => {
  const fragment = () => read('fragments/qa-pipeline/add-review.md');
  const section = (name) => {
    const text = fragment();
    const start = text.indexOf(`<!-- section:${name} -->`);
    return text.slice(start, text.indexOf(`<!-- /section:${name} -->`));
  };

  it('preflight Phase A table holds the QA_SEED row: block, remedy /add-qa-setup', () => {
    const body = section('preflight');
    expect(body).toMatch(/\| `QA_SEED` \|[^\n]*\*\*block\*\*[^\n]*\{\{cmd:add-qa-setup\}\}|\|[^\n]*`QA_SEED`[^\n]*\*\*block\*\*[^\n]*\{\{cmd:add-qa-setup\}\}/);
  });

  it('preflight runs qa.seed.command once per review, after the boot and before capture, parsed per the contract', () => {
    const body = section('preflight');
    expect(body).toMatch(/`qa\.seed\.command`/);
    expect(body).toMatch(/once per review/i);
    expect(body).toMatch(/after (the )?(row 3's )?boot/i);
    expect(body).toMatch(/before (STEP qa-pipeline\.capture|capture)/i);
    expect(body).toMatch(/Seed Output Contract/);
    expect(body).toMatch(/no (login|sign-in)|attempts no sign-in/i);
    expect(body).toMatch(/both judges/i);
  });

  it('the seed block never names a login, and failure says run /add-qa-setup', () => {
    const body = section('preflight');
    expect(body).toMatch(/run `\{\{cmd:add-qa-setup\}\}`/);
    expect(body).not.toMatch(/\blogin\b/i);
  });

  it('evidence coverage reconciliation adds the seed coverage check for new screens', () => {
    const body = section('evidence');
    expect(body).toMatch(/seed coverage/i);
    expect(body).toMatch(/new screen/i);
    expect(body).toMatch(/identity/);
  });
});

describe('review findings — one seed run per review, and a seed gap is repaired by the agent that owns the seed', () => {
  it('the review capture step says the lifecycle skips its Seed step because the preflight ran it', () => {
    const text = read('fragments/qa-pipeline/add-review.md');
    const evidence = text.slice(text.indexOf('<!-- section:evidence -->'), text.indexOf('<!-- /section:evidence -->'));
    expect(evidence).toMatch(/skip[^\n]*Seed step|Seed step[^\n]*skip/i);
  });

  it('the build says a seed-coverage row goes to @e2e-agent as the one exception to the fix wave', () => {
    const text = read('fragments/qa-pipeline/add-build.md');
    expect(text).toMatch(/seed[^\n]*row[^\n]*(exception|only)[^\n]*@e2e-agent|@e2e-agent[^\n]*(exception|only)[^\n]*seed[^\n]*row/i);
  });
});

describe('prompt-review findings — seed ownership and re-run rules', () => {
  it('the seed step keeps an existing seed, reports drift, and says what to do about an ignored seed file', () => {
    const text = read('commands/add-qa-setup.md');
    const start = text.indexOf('\n## STEP add-qa-setup.seed:');
    const body = text.slice(start, text.indexOf('\n## ', start + 5));
    expect(body).toMatch(/already exists?[^\n]*keep|keep[^\n]*existing seed/i);
    expect(body).toMatch(/drift/i);
    expect(body).toMatch(/app (is )?(up|booted)|boot/i);
    expect(text).toMatch(/must NOT match[^\n]*codeadd update/i);
  });

  it('add--setup-contract gives seed no default and never regenerates an existing one', () => {
    const text = read('skills/add--setup-contract/SKILL.md');
    expect(text).toMatch(/`seed` has no default/i);
    expect(text).not.toMatch(/qa\.seed|\.codeadd\/qa\//);
    expect(text).toMatch(/never regenerated/i);
  });

  it('qa.seed.env gets new names from the seed update through @e2e-agent, and e2e-agent loads add--qa first', () => {
    expect(read('skills/add--settings/SKILL.md')).toMatch(/`@e2e-agent`[^\n]*`qa\.seed\.env`|`qa\.seed\.env`[^\n]*`@e2e-agent`/);
    const agent = read('agents/e2e-agent.md');
    expect(agent).toMatch(/Load skill `add--qa`/);
    expect(agent).toMatch(/`qa\.seed\.env`/);
    expect(agent).not.toMatch(/Inputs \(from the dispatching command\)[\s\S]{0,1200}the seed output the lifecycle ran/);
  });
});
