import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Plan 2026-09-16T205633 — product pipeline parity.
 * Validation Matrix, level L1 (static contract).
 *
 * Written RED against the pre-plan tree: the product layer has no delivery
 * mode, no objective in its schemas, eight reviewer dimensions, and
 * /add.plan-to-ready still owns the checkpoint tag and both consistency passes.
 *
 * L2 (build and graph) runs from the command line and L3 (behavioural walk of
 * the automatic chain) is recorded in the build ledger.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const read = (p) => fs.readFileSync(p, 'utf8');
const cmd = (name) => path.join(CODEADD, 'commands', `${name}.md`);
const skill = (name) => path.join(CODEADD, 'skills', name, 'SKILL.md');

const P = {
  mode: skill('add-delivery-mode'),
  map: path.join(ROOT, 'framwork', 'provider-map.json'),
  schemas: path.join(CODEADD, 'skills', 'add-doc-schemas', 'references', 'new-feature.md'),
  planReview: skill('add-plan-review'),
  reviewerAgent: path.join(CODEADD, 'agents', 'plan-reviewer-agent.md'),
  spec: skill('add-feature-specification'),
  brainstorm: cmd('add.brainstorm'),
  newCmd: cmd('add.new'),
  plan: cmd('add.plan'),
  build: cmd('add.build'),
  review: cmd('add.review'),
  planToReady: cmd('add.plan-to-ready'),
  qaBuild: path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.build.md'),
  tddBuild: path.join(CODEADD, 'fragments', 'tdd-pipeline', 'add.build.md'),
};

/** Every file under dir, recursively, skipping the gitignored sidecars. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (!entry.name.endsWith('.json') || entry.name === 'plugins.json') out.push(full);
  }
  return out;
}

/** The body of the `### <name>` schema section in new-feature.md. */
function schema(name) {
  const text = read(P.schemas);
  const start = text.indexOf(`### ${name}\n`);
  expect(start, `schema ${name} exists`).toBeGreaterThan(-1);
  const next = text.indexOf('\n### ', start + 5);
  return text.slice(start, next === -1 ? undefined : next);
}

function sectionsLine(name) {
  const line = schema(name).split('\n').find((l) => l.includes('**Sections'));
  expect(line, `schema ${name} has a Sections line`).toBeTruthy();
  return line;
}

function usesBlock(file) {
  const m = read(file).match(/<!-- uses:([\s\S]*?)-->/);
  expect(m, `${path.basename(file)} has a uses block`).toBeTruthy();
  return m[1];
}

describe('L1 — product pipeline parity, static contract', () => {
  it('L1.1 add-delivery-mode exists and is registered', () => {
    expect(fs.existsSync(P.mode)).toBe(true);
    const map = JSON.parse(read(P.map));
    expect(map.skills['add-delivery-mode']).toBeDefined();
  });

  it('L1.2 add.plan-to-ready is gone from the product layer', () => {
    expect(fs.existsSync(P.planToReady)).toBe(false);
    const map = JSON.parse(read(P.map));
    expect(map.commands['add.plan-to-ready']).toBeUndefined();
    const hits = [...walk(CODEADD), ...walk(path.join(ROOT, 'cli', 'src'))].filter((f) =>
      read(f).includes('plan-to-ready'),
    );
    expect(hits.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it('L1.3 the reviewer carries nine dimensions, Objective fit among them', () => {
    const text = read(P.planReview);
    expect(text).toMatch(/Objective fit/);
    expect(text).toMatch(/nine/i);
    expect(read(P.reviewerAgent)).toMatch(/nine/i);
    expect(read(P.reviewerAgent)).not.toMatch(/eight mandatory dimensions/i);
  });

  it('L1.4 the schemas carry the objective, delivery and Serves', () => {
    for (const name of ['brainstorm', 'brainstorm-intent', 'feature', 'feature-plan']) {
      expect(sectionsLine(name), name).toMatch(/Objective/);
    }
    expect(schema('brainstorm-intent')).toMatch(/delivery:\s*confirm\|automatic/);
    expect(schema('brainstorm')).toMatch(/Decision \| Serves \| Rationale/);
    expect(schema('brainstorm')).not.toMatch(/final decisions \(those belong in plan\)/);
  });

  it('L1.5 add.brainstorm drafts the objective, asks three options, offers no inline about.md', () => {
    const text = read(P.brainstorm);
    expect(text).toMatch(/Approve, I confirm each stage/);
    expect(text).toMatch(/Approve, deliver automatically/);
    expect(text).toMatch(/Keep discussing/);
    expect(text).toMatch(/[Dd]raft the objective/);
    expect(text).not.toMatch(/Want me to write the feature documentation now/);
    expect(usesBlock(P.brainstorm)).toMatch(/- skill: add-delivery-mode/);
  });

  it('L1.6 every stage and both build fragments declare add-delivery-mode', () => {
    for (const f of [P.newCmd, P.plan, P.build, P.review, P.qaBuild, P.tddBuild]) {
      expect(usesBlock(f), path.basename(f)).toMatch(/- skill: add-delivery-mode/);
    }
  });

  it('L1.7 add.build owns the checkpoint sequence', () => {
    const text = read(P.build);
    expect(text).toMatch(/## The Checkpoint Sequence/);
    expect(text).toMatch(/git tag -a[^\n]*checkpoint\/\$\{FEATURE_ID\}-\$\{EPIC_CURRENT_SF\}-done/);
    expect(text).toMatch(/converge-gates\.sh/);
    expect(text).toMatch(/GATE_EPIC=ok/);
    expect(text).toMatch(/Fix Routing[^\n]*blocker|blocker[^\n]*Fix Routing/);
  });

  it('L1.8 consistency-agent is dispatched FULL by add.plan and DELTA by add.build', () => {
    expect(read(P.plan)).toMatch(/DISPATCH[^\n]*@consistency-agent[\s\S]{0,400}mode: FULL/);
    expect(usesBlock(P.build)).toMatch(/- agent: consistency-agent/);
    expect(read(P.build)).toMatch(/DISPATCH[^\n]*@consistency-agent[\s\S]{0,400}mode: DELTA/);
  });

  it('L1.9 add.new asks automatic vs semi-automatic and requires a serves-line per subfeature', () => {
    const text = read(P.newCmd);
    expect(text).toMatch(/semi-automatic/);
    expect(text).toMatch(/[Ss]erves the (feature )?objective/);
  });

  it('L1.10 the stages chain through {{cmd:}} and name no Skill tool', () => {
    const chain = [
      [P.brainstorm, 'add.new'],
      [P.newCmd, 'add.plan'],
      [P.plan, 'add.build'],
      [P.build, 'add.review'],
      [P.review, 'add.build'],
    ];
    for (const [file, next] of chain) {
      expect(read(file), path.basename(file)).toMatch(new RegExp(`follow[^\\n]*\\{\\{cmd:${next.replace('.', '\\.')}\\}\\}`));
      expect(read(file), path.basename(file)).not.toMatch(/Skill tool to (load|invoke) \/add\./);
    }
  });

  it('L1.11 add-feature-specification extracts the objective and names no brainstorm offer', () => {
    const text = read(P.spec);
    expect(text).toMatch(/## Objective/);
    expect(text).not.toMatch(/accepts its new offer|brainstorm when it continues into authoring|\/add\.brainstorm['’]s offer/);
  });

  it('L1.12 the build fragments classify their stops', () => {
    const qa = read(P.qaBuild);
    expect(qa).toMatch(/confirming/);
    expect(qa).toMatch(/deciding/);
    expect(read(P.tddBuild)).toMatch(/deciding/);
  });

  it('L1.13 add-delivery-mode names the review-round baseline and the cap of two', () => {
    const text = read(P.mode);
    expect(text).toMatch(/baseline/);
    expect(text).toMatch(/two review/i);
  });
});
