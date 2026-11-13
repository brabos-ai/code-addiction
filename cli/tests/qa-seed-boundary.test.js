import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { enableFeature, disableFeature } from '../src/features.js';
import { enablePlugin } from '../src/plugins.js';
import { parseFragmentSections } from '../src/injection-core.js';
import { PROVIDERS } from '../src/providers.js';
import { treeFixture } from './helpers/tree-fixture.js';

/**
 * qa-project-seed, decision 6 — seed and test-environment instructions in plan, build and review
 * are injected ONLY through `qa-pipeline` fragments. A build without QA contains none of them.
 *
 * Declared once, here: the sentinels and the artefacts allowed to carry them with QA off.
 * `plugins/playwright/fragments/add-review.md` is deliberately NOT allowed: its anchor is in the
 * base `add-review` body, so it injects with `qa-pipeline` off.
 *
 * Requires `node scripts/build.js` to have produced framwork/.claude.
 */
const SENTINELS = ['qa.seed', '.codeadd/qa/', 'QA_SEED', 'Seed Update', 'seed coverage'];

// Compiled paths (relative to the provider dir) that exist only to set up or run QA.
const ALLOWED = [
  /^commands\/add-qa-setup\.md$/,
  /^skills\/add--qa\//,
  /^skills\/add--qa-spec\//,
  /^skills\/add--settings\//,
  /^agents\/qa-agent\.md$/,
  /^agents\/e2e-agent\.md$/,
];

// What the three qa-pipeline fragments own: command -> section -> sentinels that must land there.
const OWNED = {
  'add-plan': { 'qa-spec': ['Seed Update'] },
  'add-build': { 'e2e-dispatch': ['Seed Update', 'seed coverage'], 'qa-fix': ['.codeadd/qa/'] },
  'add-review': { preflight: ['QA_SEED', 'qa.seed'], evidence: ['seed coverage'] },
};

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const lf = (s) => s.replace(/\r\n/g, '\n');

const fixture = treeFixture({
  prefix: 'qa-seed-boundary-',
  copy: [
    { src: 'framwork/.claude', dest: '.claude' },
    { src: 'framwork/.codeadd', dest: '.codeadd' },
  ],
  manifest: {
    at: '.codeadd/manifest.json',
    data: { version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} },
  },
  normalize: true,
});

const claudeDir = (cwd) => path.join(cwd, PROVIDERS.claude.dest);
const commandFile = (cwd, name) => path.join(claudeDir(cwd), PROVIDERS.claude.commandsSubdir, `${name}.md`);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

/** Every compiled command, skill and agent outside the allowed set that carries a sentinel. */
function leaks(cwd) {
  const base = claudeDir(cwd);
  const out = [];
  for (const sub of ['commands', 'skills', 'agents']) {
    for (const file of walk(path.join(base, sub))) {
      const rel = path.relative(base, file).split(path.sep).join('/');
      if (!rel.endsWith('.md') || ALLOWED.some((re) => re.test(rel))) continue;
      const text = lf(fs.readFileSync(file, 'utf8'));
      for (const sentinel of SENTINELS) if (text.includes(sentinel)) out.push(`${rel}: ${sentinel}`);
    }
  }
  return out;
}

const count = (haystack, needle) => haystack.split(needle).length - 1;
const sections = (command) =>
  parseFragmentSections(fs.readFileSync(path.join(CODEADD, 'fragments', 'qa-pipeline', `${command}.md`), 'utf8'));

beforeEach(() => warnSpy.mockClear());
afterEach(() => fixture.cleanup());
afterAll(() => fixture.dispose());

describe('L3.1 — seed instructions exist only with qa-pipeline on', () => {
  it('QA off: no compiled command, skill or agent outside the allowed set carries a sentinel', () => {
    expect(leaks(fixture.root())).toEqual([]);
  });

  // RED by design until F13–F15 land the fragment text: `it.fails` keeps every commit green and
  // makes the red visible. F15 flips it to a plain `it` — an unexpected pass fails the suite.
  it.fails('QA on: each fragment sentinel lands in its section, and nowhere else in add-plan, add-build and add-review', () => {
    const cwd = fixture.root();
    enableFeature(cwd, 'qa-pipeline');
    for (const [command, bySection] of Object.entries(OWNED)) {
      const installed = lf(fs.readFileSync(commandFile(cwd, command), 'utf8'));
      const fragment = sections(command);
      for (const [section, owned] of Object.entries(bySection)) {
        const body = lf(fragment.get(section) ?? '');
        for (const sentinel of owned) {
          expect(body, `${command}:${section} must carry "${sentinel}"`).toContain(sentinel);
        }
      }
      // exactly the fragment's own occurrences: none from the base body, none injected twice
      const allBodies = [...fragment.values()].map(lf).join('\n');
      for (const sentinel of SENTINELS) {
        expect(count(installed, sentinel), `${command}: "${sentinel}"`).toBe(count(allBodies, sentinel));
      }
    }
  });

  it('QA on then off restores add-plan, add-build and add-review byte for byte', () => {
    const cwd = fixture.root();
    const before = Object.keys(OWNED).map((c) => fs.readFileSync(commandFile(cwd, c), 'utf8'));
    enableFeature(cwd, 'qa-pipeline');
    disableFeature(cwd, 'qa-pipeline');
    const after = Object.keys(OWNED).map((c) => fs.readFileSync(commandFile(cwd, c), 'utf8'));
    expect(after).toEqual(before);
  });

  it('QA off with the playwright plugin on: still no sentinel outside the allowed set', () => {
    const cwd = fixture.root();
    enablePlugin(cwd, 'playwright');
    expect(leaks(cwd)).toEqual([]);
  }, 60000);
});
