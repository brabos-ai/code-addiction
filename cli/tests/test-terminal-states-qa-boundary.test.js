import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { FEATURES, enableFeature, disableFeature } from '../src/features.js';
import { enablePlugin } from '../src/plugins.js';
import { parseFragmentSections } from '../src/injection-core.js';
import { PROVIDERS } from '../src/providers.js';
import { treeFixture } from './helpers/tree-fixture.js';

/**
 * Validation matrix for
 * docs/plans/2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary.md
 *
 * The plan specifies four levels. L1.1/L1.2 already live in
 * loop-consolidation-0070.test.js and L1.4 in build-artefact-graph.test.js, so
 * they are not repeated here. This file carries the rest:
 *
 *   L1.3  the playwright anchor is never enclosed by a feature pair (guard)
 *   L1.5  FEATURES['qa-pipeline'].commands
 *   L2.*  cross-artefact text and installed-shape assertions
 *   L3.2  the two step-list pairs share one anchor without colliding
 *   L4.*  the agent and fragment CONTRACTS, read as text
 *
 * ⛔ L4 is contract text, not executed behaviour. Nothing in this repository
 * runs a @test-agent or a @fix-agent, so "the agent returns BLOCKED" is only
 * checkable here as "the instruction telling it to is present and
 * unambiguous". Read a green L4 as that and nothing more.
 *
 * L1.3 and L2.3 are written GREEN on purpose. They are guards against a
 * regression F16 and F17 could introduce, never RED→GREEN evidence.
 *
 * Requires `node scripts/build.js` to have produced framwork/.claude and
 * framwork/.codeadd/injection-points.json.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const sidecarPoints = () =>
  JSON.parse(fs.readFileSync(path.join(CODEADD, 'injection-points.json'), 'utf8')).points;

const read = (rel) => fs.readFileSync(path.join(CODEADD, rel), 'utf8').replace(/\r\n/g, '\n');
const lf = (s) => s.replace(/\r\n/g, '\n');

const fixture = treeFixture({
  prefix: 'tts-qa-',
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

const claudeCommand = (cwd, name) =>
  path.join(cwd, PROVIDERS.claude.dest, PROVIDERS.claude.commandsSubdir, `${name}.md`);

beforeEach(() => warnSpy.mockClear());
afterEach(() => fixture.cleanup());
afterAll(() => fixture.dispose());

// ---------------------------------------------------------------------------
// L1 — build-side unit
// ---------------------------------------------------------------------------

describe('L1 — build-side unit', () => {
  // GUARD, not RED→GREEN. It is green today and must stay green: F16 places
  // four marker pairs around STEP 10, and the one mistake that ships a broken
  // build is a pair that swallows the playwright anchor.
  it('L1.3 (guard) the plugin:playwright:drive pair is enclosed by no feature pair', () => {
    const src = read('commands/add.review.md');
    const openAt = src.indexOf('<!-- plugin:playwright:drive -->');
    const closeAt = src.indexOf('<!-- /plugin:playwright:drive -->');
    expect(openAt, 'playwright drive pair is missing from add.review.md').toBeGreaterThan(-1);
    expect(closeAt).toBeGreaterThan(openAt);

    // Walk every feature pair and assert none of them spans the anchor.
    const pairRe = /<!-- feature:([a-z-]+):([a-z-]+) -->/g;
    for (let m = pairRe.exec(src); m; m = pairRe.exec(src)) {
      const close = `<!-- /feature:${m[1]}:${m[2]} -->`;
      const end = src.indexOf(close, m.index);
      expect(end, `unclosed feature pair ${m[1]}:${m[2]}`).toBeGreaterThan(-1);
      const encloses = m.index < openAt && end > closeAt;
      expect(encloses, `feature:${m[1]}:${m[2]} encloses the playwright drive anchor`).toBe(false);
    }
  });

  it('L1.5 FEATURES[qa-pipeline].commands is add.plan, add.build, add.review', () => {
    expect(FEATURES['qa-pipeline'].commands).toEqual(['add.plan', 'add.build', 'add.review']);
  });
});

// ---------------------------------------------------------------------------
// L2 — integration
// ---------------------------------------------------------------------------

const QA_STEP_HEADINGS = [
  '## STEP 8: QA Preflight',
  '## STEP 9: QA Evidence',
  '## STEP 10: QA Judgement',
];

const QA_STEP_ORDER_LINES = ['STEP 8: QA Preflight', 'STEP 9: QA Evidence', 'STEP 10: QA Judgement'];

describe('L2 — integration', () => {
  it('L2.1 with qa-pipeline disabled, add.review carries no STEP 8, 9 or 10', () => {
    const cwd = fixture.root();
    const installed = lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'));

    for (const heading of QA_STEP_HEADINGS) {
      expect(installed, `${heading} survived with the feature off`).not.toContain(heading);
    }
    for (const line of QA_STEP_ORDER_LINES) {
      expect(installed, `STEP-order block still lists "${line}" with the feature off`).not.toContain(line);
    }
  });

  it('L2.2 with qa-pipeline enabled, all five sections land exactly once and the anchor resolves', () => {
    const cwd = fixture.root();
    const fragment = path.join(CODEADD, 'fragments', 'qa-pipeline', 'add.review.md');
    expect(fs.existsSync(fragment), 'fragments/qa-pipeline/add.review.md does not exist').toBe(true);

    const sections = parseFragmentSections(fs.readFileSync(fragment, 'utf8'));
    expect([...sections.keys()].sort()).toEqual(
      ['evidence', 'judge-head', 'judge-tail', 'preflight', 'step-list'],
    );

    enableFeature(cwd, 'qa-pipeline');
    expect(warnSpy, 'enable logged a warning — an anchor missed or drifted').not.toHaveBeenCalled();

    const installed = lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'));
    for (const [section, body] of sections) {
      const lines = lf(body).split('\n');
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      const block = lines.join('\n');
      const occurrences = installed.split(block).length - 1;
      expect(occurrences, `section ${section} landed ${occurrences}× (expected exactly 1)`).toBe(1);
    }

    // The MARKER never survives — build.js strips every HTML comment. What has
    // to survive is the ANCHOR the plugin injects at, which the sidecar records.
    const drive = sidecarPoints().find(
      (p) => p.namespace === 'plugin' && p.name === 'playwright' && p.resource.name === 'add.review',
    );
    expect(drive, 'the playwright drive point left the sidecar').toBeTruthy();
    expect(installed, `the playwright anchor "${drive.anchor.text}" did not survive the injection`)
      .toContain(drive.anchor.text);
  });

  // THE PLUGIN HAS ITS OWN ANCHOR, so its placement no longer follows the
  // enable order.
  //
  // It used to share the `contract.` seam with all four qa sections, and
  // applyInjectionToContent groups by anchor WITHIN one namespace only — so the
  // two namespaces inserted separately at the same line and whichever was
  // enabled first went first. The live-driving playbook landed above STEP 8 in
  // one order and below STEP 10 in the other, and never where it belonged.
  //
  // A seam line in the ungated body now anchors the plugin alone. The four qa
  // sections still share `contract.`, which is harmless: one namespace, grouped,
  // in source order. This asserts the single placement that is now reachable,
  // both ways round.
  it('L2.2 the playwright block lands after the QA judgement, whatever the enable order', () => {
    const lineOf = (s, pred) => lf(s).split(String.fromCharCode(10)).findIndex(pred);
    const step8 = (s) => lineOf(s, (l) => l.startsWith('## STEP 8:'));
    const step11 = (s) => lineOf(s, (l) => l.startsWith('## STEP 11:'));
    const drive = (s) => lineOf(s, (l) => l.includes('Driving is via Playwright MCP'));

    const qaFirst = fixture.root();
    enableFeature(qaFirst, 'qa-pipeline');
    enablePlugin(qaFirst, 'playwright');
    const a = lf(fs.readFileSync(claudeCommand(qaFirst, 'add.review'), 'utf8'));

    const pwFirst = fixture.root();
    enablePlugin(pwFirst, 'playwright');
    enableFeature(pwFirst, 'qa-pipeline');
    const b = lf(fs.readFileSync(claudeCommand(pwFirst, 'add.review'), 'utf8'));

    for (const [label, s] of [['qa-then-playwright', a], ['playwright-then-qa', b]]) {
      expect(drive(s), `${label}: the drive block is missing`).toBeGreaterThan(-1);
      expect(s.split('Driving is via Playwright MCP').length - 1, `${label}: not exactly once`).toBe(1);
      expect(drive(s), `${label}: the drive block is not below STEP 8`).toBeGreaterThan(step8(s));
      expect(drive(s), `${label}: the drive block escaped below STEP 11`).toBeLessThan(step11(s));
    }

    // The point of the seam: one placement, not two. Byte-identical either way.
    expect(b, 'the enable order still changes the installed bytes').toBe(a);
  }, 30000); // two full fixture roots plus four enable passes

  // The seam only works while it is the last thing before the plugin pair. A
  // feature pair inserted between them would take the anchor back.
  it('L2.10 the plugin pair is anchored by the seam line, not by a shared one', () => {
    const src = read('commands/add.review.md');
    const seam = src.indexOf('**Live driving is a `playwright` plugin enhancement');
    const pair = src.indexOf('<!-- plugin:playwright:drive -->');
    expect(seam, 'the seam line is gone').toBeGreaterThan(-1);
    expect(pair, 'the plugin pair is gone').toBeGreaterThan(pair - 1);
    expect(seam, 'the seam no longer precedes the plugin pair').toBeLessThan(pair);

    const between = src.slice(seam, pair);
    expect(between, 'a feature pair moved between the seam and the plugin pair')
      .not.toContain('<!-- feature:');

    const drivePoint = sidecarPoints().find(
      (p) => p.namespace === 'plugin' && p.name === 'playwright' && p.resource.name === 'add.review',
    );
    expect(drivePoint.anchor.text, 'the plugin anchor is not the seam line')
      .toContain('Live driving is a `playwright` plugin enhancement');
  });

  // F17's OWN two edits, neither of which had a level. L2.3 below guards that
  // STEP 11 does not move; it says nothing about the row inside it that F17
  // rewrote, nor about the command description. Both are what a reader meets
  // first on the feature-off branch.
  it('L2.11 the ungated text that describes the boundary names both states', () => {
    const src = read('commands/add.review.md');

    // The one-line description: it used to promise the judgement outright.
    const desc = src.slice(src.indexOf('Coordinator for feature review.'), src.indexOf('Coordinator for feature review.') + 420);
    expect(desc, 'the description does not name the feature').toContain('`qa-pipeline`');
    expect(desc, 'the description does not say what the command is without it')
      .toContain('this command is the code review and the spec-compliance audit');

    // STEP 11's gate row: five values, and the two ⊘ diagnoses distinguished.
    expect(src, 'the Quality Gate Report row lost ⊘ FEATURE OFF').toContain('⊘ FEATURE OFF');
    expect(src, 'the two ⊘ states are no longer told apart')
      .toContain('different diagnoses, and neither blocks');
  });

  // F13 had no assertion anywhere: deleting every MODEL line broke no test.
  it('L2.12 the final attempt escalates the model, at both surviving dispatch sites', () => {
    const agent = read('agents/test-agent.md');
    const fragment = read('fragments/tdd-pipeline/add.build.md');

    expect(agent, 'test-agent no longer declares MODEL as an input')
      .toMatch(/`MODEL` — present on the FINAL attempt only/);
    expect(fragment, 'the build fragment no longer passes MODEL on the final attempt')
      .toMatch(/On the FINAL attempt only/);
    for (const [label, body] of [['test-agent', agent], ['tdd-pipeline/add.build', fragment]]) {
      expect(body, `${label}: the escalation no longer names a tier`).toContain('one tier above');
    }

    // The hotfix dispatch is the third site the plan named and it is deliberately
    // NOT here: that flow dispatches once, so it has no earlier attempt to
    // escalate from. F38 removed the line and its cap is 1.
    const hotfix = read('fragments/tdd-pipeline/add.hotfix.md');
    expect(hotfix, 'the hotfix dispatch grew a MODEL escalation it cannot reach')
      .not.toContain('one tier above');
    expect(hotfix, 'the hotfix cap is not 1').toContain('MAX_ATTEMPTS = 1');
  });

  // GUARD, not RED→GREEN. STEP 11 is ungated and must stay ungated: F17 edits
  // one of its rows, and the failure mode is moving the whole step by accident.
  it('L2.3 (guard) add.review keeps STEP 11 in both feature states', () => {
    const cwd = fixture.root();
    const heading = '## STEP 11: Quality Gate Report';

    expect(lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'))).toContain(heading);
    enableFeature(cwd, 'qa-pipeline');
    expect(lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'))).toContain(heading);
    disableFeature(cwd, 'qa-pipeline');
    expect(lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'))).toContain(heading);
  });

  it('L2.4 no source under framwork/.codeadd/ still describes the old agent contracts', () => {
    const offenders = { green: [], singularArea: [] };

    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(p);
          continue;
        }
        if (!entry.name.endsWith('.md')) continue;
        const rel = path.relative(CODEADD, p).replace(/\\/g, '/');
        const body = lf(fs.readFileSync(p, 'utf8'));

        // @test-agent iterating until green, in any of the three phrasings the
        // tree carries today.
        if (/(runs? them until green|iterates? until green|iterate until they pass)/i.test(body)) {
          offenders.green.push(rel);
        }
        // @fix-agent taking a singular AREA. `AREAS` must not match, so the
        // boundary is explicit.
        //
        // A singular `AREA` is LEGITIMATE as @test-agent's input — the plan kept
        // that agent per-area on purpose ("Merge @test-agent the same way? No"),
        // so the scan has to ask WHO a line is talking about. Testing the file
        // as a whole cannot: add.build.md and the tdd-pipeline fragment each
        // name both agents, so `AREA` anywhere plus `fix-agent` anywhere reports
        // @test-agent's own input contract as a fix-agent regression.
        //
        // Attribution is the nearest agent named at or above the line, which is
        // how these files are written: a dispatch block opens by naming its
        // agent and its `Inputs` bullet follows. Where no mention precedes the
        // line, the agent the file itself declares in frontmatter owns it.
        let owner = (/^name:\s*(test-agent|fix-agent)\s*$/m.exec(body) || [])[1] || null;
        for (const line of body.split('\n')) {
          const named = [...line.matchAll(/@?\b(test-agent|fix-agent)\b/g)].pop();
          if (named) owner = named[1];
          if (owner === 'fix-agent' && /`AREA`(?!S)/.test(line)) {
            offenders.singularArea.push(rel);
            break;
          }
        }
      }
    };
    walk(CODEADD);

    expect(offenders.green, 'still describes @test-agent as iterating until green').toEqual([]);
    expect(offenders.singularArea, 'still describes @fix-agent as taking a singular AREA').toEqual([]);
  });

  // GUARD, not RED→GREEN. The plan's F3 says this field is used at line 66 and
  // declared nowhere; it is in fact already declared, by the 2026-09-12
  // delivery that introduced it. The level stays as the guard that keeps it
  // declared while F1-F5 rewrite the sections around it.
  it('L2.5 (guard) test-agent.md declares KNOWN_FAILURES in ## Inputs', () => {
    const body = read('agents/test-agent.md');
    const start = body.indexOf('## Inputs');
    expect(start, 'test-agent.md has no ## Inputs section').toBeGreaterThan(-1);
    const end = body.indexOf('\n## ', start + 1);
    const inputs = body.slice(start, end === -1 ? undefined : end);
    expect(inputs, 'KNOWN_FAILURES is used in the body but not declared in ## Inputs')
      .toContain('KNOWN_FAILURES');
  });

  it('L2.6 add.qa-setup.md names add.review in its feature-off sentence', () => {
    const body = read('commands/add.qa-setup.md');
    const sentence = body
      .split('\n')
      .find((l) => l.includes('inert while the `qa-pipeline` feature is off'));
    expect(sentence, 'the feature-off sentence is gone or was reworded').toBeTruthy();
    expect(sentence).toContain('add.plan');
    expect(sentence).toContain('add.build');
    expect(sentence, 'the feature-off sentence still omits add.review').toContain('add.review');
  });

  it('L2.7 add-qa/SKILL.md says the feature gates judgement', () => {
    const body = read('skills/add-qa/SKILL.md');
    const statement = body
      .split('\n')
      .find((l) => l.includes('Feature vs plugin (canonical statement)'));
    expect(statement, 'the canonical statement is gone or was renamed').toBeTruthy();

    // Scope to the FEATURE half. The plugin half already says "the judge can
    // drive the app live", so a match against the whole sentence is green
    // today for the wrong reason.
    const split = statement.indexOf('`playwright` (plugin)');
    expect(split, 'the statement no longer names the plugin half').toBeGreaterThan(-1);
    const featureHalf = statement.slice(0, split);

    expect(featureHalf, 'the feature half still names only authoring and correction')
      .toMatch(/judge(d|ment)/i);
  });

  // THE LEVEL THAT WAS MISSING, AND THE ONE THE REVIEW NEEDED.
  //
  // L2.1 asserts the three STEP 8/9/10 HEADINGS leave the base command. It says
  // nothing about the body that stays behind, and twelve lines there went on
  // pointing at those steps by number — one of them, `${REVIEW_SCOPE}`, a
  // MANDATORY frontmatter field of every review document, defined only inside a
  // step that ships conditionally. With qa-pipeline off the ungated body sent the
  // reader to steps the file does not contain.
  //
  // The rule is attribution, not absence: a base-command line MAY name one of
  // those steps as long as the same line names the feature that supplies it, so a
  // reader on the feature-off branch is told the step is not there. That is the
  // shape F26 wrote by hand and this level now enforces for every line.
  it('L2.8 every STEP 8/9/10 pointer left in the base command names the feature that supplies it', () => {
    const src = read('commands/add.review.md');
    const offenders = [];
    for (const [line] of src.matchAll(/^.*STEP (?:8|9|10).*$/gm)) {
      if (/qa-pipeline/.test(line)) continue;
      offenders.push(line.trim().slice(0, 90));
    }
    expect(offenders, 'ungated lines point at steps the feature may not supply').toEqual([]);
  });

  // REVIEW_SCOPE is the one that breaks a document rather than confusing a reader,
  // so it gets its own assertion rather than riding on L2.8's line scan.
  it('L2.9 the review scope is resolved in the ungated body, not in a QA step', () => {
    const src = read('commands/add.review.md');
    const frag = read('fragments/qa-pipeline/add.review.md');

    expect(src, 'REVIEW_SCOPE is still written into the review frontmatter')
      .toContain('scope: ${REVIEW_SCOPE}');
    expect(src, 'the ungated body does not resolve REVIEW_SCOPE')
      .toMatch(/Review scope \(`SCOPE_DIR`, `REVIEW_SCOPE`\)/);
    expect(frag, 'the fragment took ownership of the scope back')
      .not.toMatch(/### 8\.3 Resolve QA scope/);
  });
});

// ---------------------------------------------------------------------------
// L3 — combination matrix
//
// L3.1, L3.3, L3.4 and L3.5 are already covered generically, for every feature
// and plugin, by injection-exclusivity.integration.test.js and
// injection-roundtrip.integration.test.js. Only L3.2 is specific to this plan.
// ---------------------------------------------------------------------------

describe('L3 — combination matrix', () => {
  it('L3.2 both step-list sections land in the STEP-order block, deterministically ordered', () => {
    // Both bodies come from the FRAGMENTS, so this asserts the injected text
    // landed — not that the base body happens to carry the same words.
    const stepListBody = (feature) => {
      const file = path.join(CODEADD, 'fragments', feature, 'add.review.md');
      expect(fs.existsSync(file), `fragments/${feature}/add.review.md does not exist`).toBe(true);
      const body = parseFragmentSections(fs.readFileSync(file, 'utf8')).get('step-list');
      expect(body, `${feature}/add.review.md declares no step-list section`).toBeTruthy();
      const lines = lf(body).split('\n');
      if (lines.length && lines[lines.length - 1] === '') lines.pop();
      return lines.join('\n');
    };
    const qaBody = stepListBody('qa-pipeline');
    const tddBody = stepListBody('tdd-pipeline');

    const cwd = fixture.root();
    enableFeature(cwd, 'qa-pipeline');
    enableFeature(cwd, 'tdd-pipeline');
    const qaThenTdd = lf(fs.readFileSync(claudeCommand(cwd, 'add.review'), 'utf8'));

    const fenceStart = qaThenTdd.indexOf('**STEPS IN ORDER:**');
    expect(fenceStart, 'the STEP-order block is gone').toBeGreaterThan(-1);
    const fenceEnd = qaThenTdd.indexOf('```', qaThenTdd.indexOf('```', fenceStart) + 3);
    const block = qaThenTdd.slice(fenceStart, fenceEnd);

    expect(block.split(qaBody).length - 1, 'the qa step-list body is not in the STEP-order block exactly once').toBe(1);
    expect(block.split(tddBody).length - 1, 'the tdd step-list body is not in the STEP-order block exactly once').toBe(1);

    // Deterministic: the reverse enable order produces identical bytes.
    const other = fixture.root();
    enableFeature(other, 'tdd-pipeline');
    enableFeature(other, 'qa-pipeline');
    const tddThenQa = lf(fs.readFileSync(claudeCommand(other, 'add.review'), 'utf8'));
    expect(tddThenQa, 'enable order changes the bytes').toBe(qaThenTdd);
  });
});

// ---------------------------------------------------------------------------
// L4 — behavioural acceptance, read as CONTRACT TEXT
//
// ⛔ Not an executed run. See the header.
// ---------------------------------------------------------------------------

describe('L4 — behavioural acceptance (contract text)', () => {
  it('L4.1 test-agent declares BLOCKED as its own terminal state, distinct from CONCERNS', () => {
    const body = read('agents/test-agent.md');

    expect(body, 'BLOCKED is not declared anywhere').toContain('BLOCKED');
    // It names what a BLOCKED report must carry.
    expect(body, 'BLOCKED does not require naming the assertion').toMatch(/BLOCKED[\s\S]{0,900}assertion/i);
    expect(body, 'BLOCKED does not require naming the source symbol').toMatch(/BLOCKED[\s\S]{0,900}(source symbol|symbol in the source)/i);
    // It does not consume an attempt.
    expect(body, 'BLOCKED is not stated to leave the attempt counter alone')
      .toMatch(/BLOCKED[\s\S]{0,900}(does not consume an attempt|consumes no attempt)/i);
    // CONCERNS survives and stays a different answer.
    expect(body, 'CONCERNS was collapsed into BLOCKED').toContain('CONCERNS');
    // A known-real red is recorded as an expected failure, never skipped.
    expect(body, 'the declared-red mechanism is missing').toMatch(/xfail\(strict=True\)/);
    expect(body, 'the declared-red mechanism is missing').toMatch(/test\.failing\(\)/);
    expect(body, 'the declared-red mechanism is missing').toMatch(/test\.fails\(\)/);
    // Ruled out by a tool-specific prohibition, per building-commands — not by
    // the word "never". The gate form is the stronger one; assert the ban, not
    // one phrasing of it.
    expect(body, 'skip is not ruled out as the way to record a known-real red')
      .toMatch(/⛔ DO NOT USE:[^\n]*\bskip\b/);
    // The prohibitions the terminal state exists to keep satisfiable.
    expect(body).toMatch(/never application source|never modify source/i);
    expect(body).toMatch(/never soften an assertion/i);
  });

  it('L4.1/L4.4 test-agent takes its cap from the caller and never sets its own', () => {
    const body = read('agents/test-agent.md');
    expect(body, 'ATTEMPT is not an input').toContain('ATTEMPT');
    expect(body, 'MAX_ATTEMPTS is not an input').toContain('MAX_ATTEMPTS');
    expect(body, 'the cap is not stated to come from the caller')
      .toMatch(/supplied by the caller|from the caller|the caller decides/i);
    expect(body, 'the unbounded instruction is still present')
      .not.toMatch(/iterate until they pass|iterates? until green|runs? them until green/i);
  });

  it('L4.2 fix-agent takes AREAS, one ATTEMPT per wave, and defers a Blocked by row', () => {
    const body = read('agents/fix-agent.md');

    expect(body, 'AREAS is not declared').toMatch(/`AREAS`/);
    expect(body, 'the singular AREA input survived').not.toMatch(/^- `AREA` —/m);
    expect(body, 'the wave-level attempt is not stated').toMatch(/wave/i);
    expect(body, 'the Blocked by deferral is missing').toMatch(/Blocked by/);
    expect(body, 'the deferral does not say to come back for the deferred row')
      .toMatch(/defer[\s\S]{0,400}(continue|return)/i);
    expect(body, 'skills are not scoped to the areas present in the rows')
      .toMatch(/areas? present in the rows|per area present/i);

    // The three report fields the plan forbids losing.
    for (const field of ['NOT_MINE', 'DISPUTED', 'ROWS_FAILED']) {
      expect(body, `${field} was lost`).toContain(field);
    }
  });

  it('L4.3 add.review has no ungated QA dispatch left in its base body', () => {
    const body = read('commands/add.review.md');
    expect(body, '@ux-agent is still dispatched from the ungated base body')
      .not.toMatch(/DISPATCH AGENTS?: `@ux-agent`/);
    expect(body, 'the coverage blocker is still authored in the ungated base body')
      .not.toContain('coverage: <screen> not captured');
  });

  it('L4.4 the tdd-pipeline build fragment interleaves one agent at a time', () => {
    const body = lf(
      fs.readFileSync(path.join(CODEADD, 'fragments', 'tdd-pipeline', 'add.build.md'), 'utf8'),
    );

    expect(body, 'the interleaved order is not written down')
      .toMatch(/DB\s*→\s*test:DB\s*→\s*Backend\s*→\s*test:Backend\s*→\s*Frontend\s*→\s*test:Frontend/);
    expect(body, 'the parallel per-area dispatch survived')
      .not.toMatch(/one per area, parallel/i);
    expect(body, 'the dispatch does not carry the cap').toContain('MAX_ATTEMPTS');
    expect(body, 'the coordinator does not run TEST_COMMAND itself at WAIT-ALL')
      .toMatch(/WAIT-ALL[\s\S]{0,700}run[\s\S]{0,120}`?TEST_COMMAND`?[\s\S]{0,200}yourself|coordinator runs[\s\S]{0,80}TEST_COMMAND/i);
    // The two things the plan forbids losing.
    expect(body, 'KNOWN_FAILURES was lost').toContain('KNOWN_FAILURES');
    expect(body, 'the CORRECTION-mode branch was lost').toContain('MODE = CORRECTION');
  });

  it('L4.4 the hotfix fragment carries the cap on its CORRECTION dispatch', () => {
    const body = lf(
      fs.readFileSync(path.join(CODEADD, 'fragments', 'tdd-pipeline', 'add.hotfix.md'), 'utf8'),
    );
    expect(body, 'ATTEMPT is not carried').toContain('ATTEMPT');
    expect(body, 'MAX_ATTEMPTS is not carried').toContain('MAX_ATTEMPTS');
  });

  // THE COLLISION THE REVIEW FOUND, AND THE REASON IT IS NOT COSMETIC.
  //
  // BLOCKED's trigger is "my correct test is red because the source is wrong".
  // In CORRECTION mode that is not a problem to report — it is the order the
  // agent was given. But the trigger matches, so the procedure fires and
  // declares the red an expected failure. TEST_COMMAND then PASSES, and the
  // hotfix coordinator runs that command itself to confirm RED: it reads the
  // pass as "the bug is not where the root cause says it is" and sends the flow
  // back to re-investigate a root cause that was correct. An agent obeying both
  // documents breaks the flow.
  it('L4.5 BLOCKED is excluded in CORRECTION mode, where the red test is the deliverable', () => {
    const agent = read('agents/test-agent.md');
    const blockedAt = agent.indexOf('### `BLOCKED`');
    expect(blockedAt, 'the BLOCKED section is gone or was renamed').toBeGreaterThan(-1);

    // The exclusion has to OPEN the section. A reader in CORRECTION mode must
    // meet it before the procedure it disables, not after.
    const opening = agent.slice(blockedAt, blockedAt + 900);
    expect(opening, 'the BLOCKED section does not exclude CORRECTION mode')
      .toContain('IF `MODE` IS `CORRECTION`');
    expect(opening, 'the exclusion does not forbid declaring the red an expected failure')
      .toContain('no xfail, no test.fails(), no test.failing()');

    const hotfix = read('fragments/tdd-pipeline/add.hotfix.md');
    const reportAt = hotfix.indexOf('- **Report:**');
    expect(reportAt, 'the hotfix dispatch has no Report line').toBeGreaterThan(-1);
    expect(
      hotfix.slice(reportAt, reportAt + 120),
      'the hotfix dispatch still expects a BLOCKED its own agent cannot return',
    ).not.toContain('`BLOCKED`,');
  });

  it('L4.2/L4.4 add.build and add.plan-to-ready dispatch against the new contracts', () => {
    const build = read('commands/add.build.md');
    expect(build, 'the fix dispatch is still one per area').not.toMatch(/one per affected area, parallel across areas/);
    expect(build, 'the fix dispatch does not pass AREAS').toMatch(/`AREAS`/);
    // NOT `toMatch(/BLOCKED/)`. add.build says BLOCKED six times, one of them in
    // the Agent Roster row, so the bare match stayed green with the whole
    // in-flight routing section deleted. What F11 delivers is the synthesis
    // path: a BLOCKED report becomes a routed row in the SAME run, through the
    // path STEP 11.2 already uses, with no review document involved.
    expect(build, 'the in-flight BLOCKED routing section is gone')
      .toContain('#### A `BLOCKED` report becomes a routed row, in this run');
    expect(build, 'the routing no longer says it needs no review document')
      .toMatch(/No review document is involved/i);

    // F8's own subject: implementers run one at a time, in add.build's UNGATED
    // body. The plan called serialising them its highest-probability risk and no
    // level reached it — L4.4's add.build half checked AREAS and the word
    // BLOCKED, both of which are F7 and F11.
    expect(build, 'STEP 10.1 no longer says one implementation agent at a time')
      .toMatch(/ONE IMPLEMENTATION AGENT AT A TIME/);
    expect(build, 'the >4 areas row still promises parallel groups')
      .not.toMatch(/Split into maximum parallel groups/);

    const ready = read('commands/add.plan-to-ready.md');
    expect(ready, 'the correction leg does not pass AREAS').toMatch(/`AREAS`/);
    expect(ready, 'the test dispatch does not pass the cap').toContain('MAX_ATTEMPTS');
    expect(ready, 'the test dispatch does not pass KNOWN_FAILURES').toContain('KNOWN_FAILURES');
  });

  it('L2.4/L4 add-ecosystem describes the end state of both halves', () => {
    const body = read('skills/add-ecosystem/SKILL.md');
    expect(body, 'the test-agent row still says it runs them until green')
      .not.toMatch(/runs? them until green/i);
    expect(body, 'the add.review row still claims it self-gates on the receipt')
      .not.toMatch(/self-gating on the `\/add\.qa-setup` receipt/);
    const qaRow = body.split('\n').find((l) => /^\| qa-pipeline \|/.test(l));
    expect(qaRow, 'the Features table has no qa-pipeline row').toBeTruthy();
    expect(qaRow, 'the Features table row still omits add.review').toContain('add.review');
  });
});
