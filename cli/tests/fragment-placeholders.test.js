/**
 * Fragments carry resource-path placeholders -- {{skill:}}, {{cmd:}},
 * {{addpath:}} -- because the resource-path lint requires them. The BUILD
 * resolves a placeholder per provider when it writes a command; a FRAGMENT is
 * never built: release.yml packs .codeadd/fragments exactly as authored, and
 * the CLI injects it post-install. Until this suite, nothing resolved it, so
 * every tdd-pipeline install carried a literal `{{skill:add-tdd/SKILL.md}}`
 * in its commands (plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses,
 * F48).
 *
 * The CLI now resolves at injection time, with its own copy of the build's
 * rule -- the CLI cannot import scripts/build.js at runtime. P1 is what keeps
 * the two copies equal, provider by provider, against the build's own function.
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() } };
});

import { FEATURES, enableFeature, disableFeature } from '../src/features.js';
import { PROVIDERS } from '../src/providers.js';
import { resolvePlaceholders, applyInjectionToContent, parseFragmentSections, loadInjectionPoints } from '../src/injection-core.js';
import { treeFixture } from './helpers/tree-fixture.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const require = createRequire(import.meta.url);
const { resolveResourcePaths } = require(path.join(ROOT, 'scripts', 'build.js'));
const PROVIDER_MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'framwork', 'provider-map.json'), 'utf8')).providers;
const CMD_PROVIDERS = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);
// A placeholder carries an argument, as the build's own patterns require. Prose
// that NAMES the placeholders -- `{{cmd:}}` in add.qa-setup -- is not one.
const PLACEHOLDER = /\{\{(skill|cmd|addpath):[^}]+\}\}/;

const SAMPLE = [
  'see {{skill:add-backlog/references/lifecycle.md}} for the row,',
  'run {{cmd:add.plan}} next, and read {{addpath:scripts/backlog.sh}}.',
  'two on one line: {{skill:add-tdd/SKILL.md}} and {{skill:add-qa/SKILL.md}}',
].join('\n');

describe('P1 -- the CLI resolves exactly as the build does', () => {
  it.each(CMD_PROVIDERS)('%s: resolvePlaceholders equals build.js resolveResourcePaths', (key) => {
    expect(PROVIDER_MAP[key], `${key} missing from provider-map.json`).toBeTruthy();
    expect(resolvePlaceholders(SAMPLE, PROVIDERS[key])).toBe(resolveResourcePaths(SAMPLE, PROVIDER_MAP[key]));
  });

  it('leaves text with no placeholder byte-identical', () => {
    const plain = 'no placeholder here {{ not one }} either';
    for (const key of CMD_PROVIDERS) expect(resolvePlaceholders(plain, PROVIDERS[key])).toBe(plain);
  });
});

const fixture = treeFixture({
  prefix: 'frag-ph-',
  copy: [
    ...Object.values(PROVIDERS).map((meta) => ({ src: meta.src, dest: meta.dest, optional: true })),
    { src: 'framwork/.codeadd', dest: '.codeadd' },
  ],
  manifest: {
    at: '.codeadd/manifest.json',
    data: { version: '0.0.0', providers: Object.keys(PROVIDERS), features: {}, plugins: {}, hashes: {} },
  },
});

describe('P2/P3 -- injected commands, on disk', () => {
  let tmp;
  beforeEach(() => { tmp = fixture.root(); });
  afterEach(() => fixture.cleanup());
  afterAll(() => fixture.dispose());

  const commandFiles = (cwd) => CMD_PROVIDERS.flatMap((k) => {
    const dir = path.join(cwd, PROVIDERS[k].dest, PROVIDERS[k].commandsSubdir);
    return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => ({ key: k, file: path.join(dir, f) })) : [];
  });

  it('P2: with every feature enabled, no command on disk keeps a raw placeholder', () => {
    for (const f of Object.keys(FEATURES)) enableFeature(tmp, f);
    const raw = commandFiles(tmp)
      .filter(({ file }) => PLACEHOLDER.test(fs.readFileSync(file, 'utf8')))
      .map(({ file }) => path.relative(tmp, file));
    expect(raw).toEqual([]);
  });

  it('P2b: the board pointer resolves to each provider\'s own path', () => {
    enableFeature(tmp, 'board');
    for (const key of CMD_PROVIDERS) {
      const file = path.join(tmp, PROVIDERS[key].dest, PROVIDERS[key].commandsSubdir, 'add.plan.md');
      if (!fs.existsSync(file)) continue;
      const want = resolvePlaceholders('{{skill:add-backlog/references/lifecycle.md}}', PROVIDERS[key]);
      expect(fs.readFileSync(file, 'utf8'), key).toContain(want);
    }
  });

  // Regression guard, not RED-first: an install made by a CLI from before this
  // fix carries the RAW block. Disabling with the new CLI must still take it out.
  it('P3: disable removes a block an older CLI injected raw', () => {
    const key = CMD_PROVIDERS[0];
    const file = path.join(tmp, PROVIDERS[key].dest, PROVIDERS[key].commandsSubdir, 'add.plan.md');
    const pristine = fs.readFileSync(file, 'utf8');
    const sections = parseFragmentSections(fs.readFileSync(path.join(tmp, '.codeadd', 'fragments', 'board', 'add.plan.md'), 'utf8'));
    const points = loadInjectionPoints(tmp).filter((p) => p.namespace === 'feature' && p.name === 'board' && p.resource.name === 'add.plan');
    const legacy = applyInjectionToContent(pristine, points, sections).content; // no provider: the old, raw behaviour
    expect(legacy).not.toBe(pristine);
    expect(legacy).toMatch(PLACEHOLDER);
    fs.writeFileSync(file, legacy, 'utf8');

    disableFeature(tmp, 'board');
    expect(fs.readFileSync(file, 'utf8')).toBe(pristine);
  });
});
