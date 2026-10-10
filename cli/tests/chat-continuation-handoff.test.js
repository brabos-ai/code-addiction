import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withFallbacks } from './helpers/with-fallbacks.js';

/**
 * Plan 2026-10-04T185331 -- optional chat continuation handoff.
 *
 * The content matrix for the plan's Validation Matrix, L1. Authored RED, before
 * F1, and driven GREEN across F1-F5.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT CLAIM
 *
 * Every assertion below is one of three kinds, and only these three:
 *
 *   1. INTERFACE. The two contract ids the plan's Produces/Consumes pairs
 *      name. `chat-continuation-output-v1` (F1) and
 *      `chat-continuation-eligibility-v1` (F2) are strings one F-block writes
 *      and a later one reads, so their presence in a file is a fact about the
 *      tree and not a reading of intent.
 *   2. NEGATIVE. Text that must be GONE. The plan replaces an unconditional
 *      manual print; the strongest available proof that it was replaced is that
 *      the string it replaced no longer exists anywhere in the scoped closings.
 *   3. PRESERVATION. Text that must STILL be there. R6 and the plan's
 *      Global Constraints keep automatic execution, the deciding stops, the
 *      merge gate and the diagnose `@report` interface exactly as they were, so
 *      a change that quietly dropped one of them has to fail here.
 *
 * It asserts NOTHING about how an LLM behaves at a closing. "A prose checklist
 * or static regex is not behavioral evidence" is the plan's own sentence, and
 * this file is a static regex suite. The offer actually appearing once, the
 * decline ending silently, and a fresh-context session following the block are
 * L3, and L3 runs real conversations -- see the plan's Validation Matrix.
 *
 * The `no handoff file` negative is the one that fails for an interesting
 * reason: `_instructions` is absent from the tree today because the user
 * discarded that design. The assertion is here to hold it discarded, so a later
 * block cannot quietly reintroduce persistence the user rejected.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'framwork', '.codeadd');

const read = (rel) => withFallbacks(fs.readFileSync(path.join(SRC, rel), 'utf8'));

const FINAL_REPORT = 'skills/add--final-report/SKILL.md';
// The owner of both contract ids since plan 2026-10-09T184411-PLAN--agent-mode-feature (F9): the human rule set.
const HUMAN = 'skills/add--human-interaction/SKILL.md';
const DELIVERY_MODE = 'skills/add--delivery-mode/SKILL.md';
const ECOSYSTEM = 'skills/add--ecosystem/SKILL.md';

const OUTPUT = 'chat-continuation-output-v1';
const ELIGIBILITY = 'chat-continuation-eligibility-v1';

/**
 * F3's five routing commands, each with the existing STEP anchor the plan names.
 * `add-new` is the one adapter whose closing is an H2 rather than a STEP id, so
 * its anchor is the heading itself.
 */
const F3 = {
  'add-brainstorm.md': 'add-brainstorm.route',
  'add-new.md': '## Completion',
  'add-plan.md': 'add-plan.complete',
  'add-build.md': 'add-build.complete',
  'add-review.md': 'add-review.console-output',
};

/** F4's seven closings, with the anchors the plan names. */
const F4 = {
  'add-audit.md': 'add-audit.complete',
  'add-diagnose.md': 'add-diagnose.complete',
  'add-done.md': 'add-done.complete',
  'add-hotfix.md': 'add-hotfix.complete',
  'add-pull-request.md': 'add-pull-request.complete',
  'add-qa-setup.md': 'add-qa-setup.handoff',
  'add-wiki.md': 'add-wiki.report',
};

/** All twelve adapters. R8 counts exactly this set. */
const ADAPTERS = { ...F3, ...F4 };

/**
 * The five that already carry `add--delivery-mode` in their `uses:` block, and
 * the seven that do not. F4's seven need it added -- a standalone run with no
 * mode carrier has to resolve to `manual` from somewhere, and
 * `add--delivery-mode` is what owns that fall.
 */
const CARRIES_DELIVERY_MODE = Object.keys(F3);
const NEEDS_DELIVERY_MODE = Object.keys(F4);

/** R7: the two router/transformer roles the plan exempts by name. */
const EXEMPT = ['add-help.md', 'add-ux.md'];

/**
 * The unconditional manual print the plan replaces, one exact string per site.
 * Each was read off the tree at the base SHA, so a failure names a real
 * removal rather than a paraphrase.
 */
const REPLACED = [
  { file: 'skills/add--delivery-mode/SKILL.md', phrase: 'Print the next command as text and stop' },
  { file: 'commands/add-brainstorm.md', phrase: 'print and STOP:' },
  { file: 'commands/add-brainstorm.md', phrase: 'The next command is printed as text and this command stops' },
  { file: 'commands/add-build.md', phrase: 'Print the next command as a complete line' },
  { file: 'commands/add-new.md', phrase: 'The user runs the next command' },
  { file: 'commands/add-review.md', phrase: 'Print the report and the next command, and STOP, on every delivery mode' },
];

/**
 * The CLASS L1 was asked to detect, not six strings.
 *
 * A lexical class check was written and REJECTED, and the reason is worth
 * keeping. Pairing a print verb with a next-command object flags eight more
 * lines than real survivors, and every one of those eight is legitimate:
 * "Emit the report FIRST — the rulings table, the ledger path and the next
 * command all come after it" is the plan's own "Emit the report BEFORE any
 * metadata" constraint, and it appears in six commands. A check that cannot
 * separate the defect from the rule it would enforce is worse than no check,
 * because it passes vacuously and reads as coverage.
 *
 * So the class is enumerated per site instead. These are the survivors the six
 * literals missed; each was found by reading, and each phrased it differently,
 * which is exactly why no single literal found them.
 */
const SURVIVORS = [
  {
    file: 'commands/add-diagnose.md',
    phrase: 'copy-ready command',
    why: 'carry-these-step printed the hotfix invocation before the offer',
  },
  {
    file: 'commands/add-new.md',
    phrase: 'suggest the next command based on discovery',
    why: 'the completion line named the next command on every manual run',
  },
];

/** The scoped closings: the twelve adapters plus the three skills that carried the offer. */
const SCOPED = [
  ...Object.keys(ADAPTERS).map((f) => path.join('commands', f)),
  HUMAN,
  FINAL_REPORT,
  DELIVERY_MODE,
];

describe('optional chat continuation handoff', () => {
  describe('F1 -- the output owner', () => {
    it('declares the two-response output contract', () => {
      expect(read(HUMAN)).toContain(OUTPUT);
    });

    it('keeps the initial response on the seven blocks and exempts only the accepted one', () => {
      const src = read(HUMAN);
      // Both halves of the contract have to be present, or the file describes a
      // one-response output that the plan replaced.
      expect(src).toContain('seven blocks');
      expect(src).toMatch(/exempt/i);
    });

    it('states that the accepted response carries no execution', () => {
      expect(read(HUMAN)).toMatch(/execut/i);
    });

    it('names the official-document rule the block content is built from', () => {
      expect(read(HUMAN)).toMatch(/official document/i);
    });

    it('explicitly places the complete invocation on the accepted block first line', () => {
      // The original L3 accepted turn put an introduction before the invocation.
      // This guard protects the authored correction; live conversations remain L3.
      expect(read(HUMAN)).toContain("Start the block's first line with the complete next-command invocation");
    });

    it('binds the offer to a top-level finishing command, not a worker', () => {
      const src = read(HUMAN);
      expect(src).toMatch(/top-level/i);
      expect(src).toMatch(/subagent|worker/i);
    });
  });

  describe('F2 -- the eligibility owner', () => {
    it('declares the eligibility contract and consumes the output one', () => {
      const src = read(HUMAN);
      expect(src).toContain(ELIGIBILITY);
      expect(src).toContain(OUTPUT);
    });

    it('declares its dependency on the output owner in its uses block', () => {
      const uses = read(HUMAN).match(/<!-- uses:[\s\S]*?-->/);
      expect(uses).not.toBeNull();
      expect(uses[0]).toMatch(/add--final-report/);
    });

    it('makes the manual outcome an offer rather than a printed invocation', () => {
      const src = read(HUMAN);
      expect(src).not.toContain('Print the next command as text and stop');
      expect(src).toMatch(/offer/i);
    });
  });

  describe('F3 and F4 -- the twelve adapters', () => {
    it.each(Object.entries(ADAPTERS))(
      '%s consumes both contracts at %s',
      (file, anchor) => {
        const src = read(path.join('commands', file));
        const name = anchor.replace(/^#{2,3}\s+/, '');
        const heading = new RegExp(`^#{2,3} (?:STEP )?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[:\\s]|$)`, 'm');
        expect(src).toMatch(heading);
        expect(src).toContain(OUTPUT);
        expect(src).toContain(ELIGIBILITY);
      },
    );

    it.each(Object.keys(F4))('%s declares add--delivery-mode', (file) => {
      const uses = read(path.join('commands', file)).match(/<!-- uses:[\s\S]*?-->/);
      expect(uses).not.toBeNull();
      expect(uses[0]).toMatch(/add--delivery-mode/);
    });

    it('keeps the five routing commands on add--delivery-mode', () => {
      for (const file of CARRIES_DELIVERY_MODE) {
        const uses = read(path.join('commands', file)).match(/<!-- uses:[\s\S]*?-->/);
        expect(uses, `${file} has no uses block`).not.toBeNull();
        expect(uses[0], `${file} dropped add--delivery-mode`).toMatch(/add--delivery-mode/);
      }
    });
  });

  describe('R5 -- the discarded design stays discarded', () => {
    it.each(Object.entries(ADAPTERS))('%s requires no handoff file', (file) => {
      expect(read(path.join('commands', file))).not.toContain('_instructions');
    });

    it.each([FINAL_REPORT, DELIVERY_MODE, ECOSYSTEM])('%s requires no handoff file', (rel) => {
      expect(read(rel)).not.toContain('_instructions');
    });
  });

  describe('R6 -- what must not move', () => {
    it('keeps automatic mode executing the next command in the same session', () => {
      expect(read(DELIVERY_MODE)).toContain('open the next command');
    });

    it('keeps every stop in /add-done deciding in every state', () => {
      expect(read(DELIVERY_MODE)).toMatch(/Every stop in `\/add-done`/);
    });

    it('keeps the automatic path ending at the publish question', () => {
      expect(read(DELIVERY_MODE)).toMatch(/publish question is where the automatic path ends/i);
    });

    it('keeps the diagnosis-to-hotfix handoff interface', () => {
      // The interface is the `@docs/diagnose/<file>.md` argument the diagnosis
      // routes to and the hotfix parses into DIAGNOSE_REPORT. It is NOT a literal
      // `@report` token -- that spelling belongs to the ecosystem routing table,
      // and asserting it here tested a string the tree never carried.
      //
      // Asserting only that the string EXISTS was not enough, and that was the
      // defect the conformance audit found: add-diagnose carried the same
      // invocation in a second place as a print instruction, directly
      // contradicting the offer. So this pins WHERE it lives as much as that it
      // is there.
      const diagnose = read(path.join('commands', 'add-diagnose.md'));
      const hotfix = read(path.join('commands', 'add-hotfix.md'));
      expect(hotfix).toContain('DIAGNOSE_REPORT');

      const carry = diagnose.slice(
        diagnose.indexOf('STEP add-diagnose.carry-these-step'),
        diagnose.indexOf('STEP add-diagnose.validate'),
      );
      expect(carry).not.toContain('/add-hotfix @docs/diagnose/');

      const handoff = diagnose.slice(diagnose.indexOf('STEP add-diagnose.handoff'));
      expect(handoff).toContain('/add-hotfix @docs/diagnose/');
    });

    it('a review inside an automatic delivery does not gain a manual offer', () => {
      // Caught behaviourally, not by reading: the first L3 run of this scenario
      // DID offer, because the step read "never on the automatic path, so it is
      // always manual". L3 is the only thing that found it, so it needs an
      // authored guard or the next edit collapses the two rows back together.
      const review = read(path.join('commands', 'add-review.md'));
      expect(review).toMatch(
        /From inside an automatic delivery \| Stop under the rule above\. \*\*No offer\*\*/,
      );
      expect(review).not.toMatch(/so it is always `manual`/);
    });

    it('the merged-branch no-goal row is reachable, not shadowed', () => {
      // Both tables evaluate FIRST match, and the branch-type rows used to sit
      // ABOVE the no-goal row -- so a merged branch with no stated goal always
      // matched one of them and the offer fired on a closed delivery. The no-goal
      // test has to come first in both.
      for (const rel of ['commands/add-done.md', 'skills/add--ecosystem/SKILL.md']) {
        const src = read(rel);
        const noGoal = src.search(/no next goal was stated|no next goal stated/i);
        const branchType = src.search(/was feature, back on main|Feature branch, back on main/);
        expect(noGoal, `${rel} has no no-goal row`).toBeGreaterThan(-1);
        expect(branchType, `${rel} has no branch-type row`).toBeGreaterThan(-1);
        expect(noGoal, `${rel} tests the branch type before the no-goal row`).toBeLessThan(
          branchType,
        );
      }
    });

    it('keeps the merge in the user hands at close-out', () => {
      const done = read(path.join('commands', 'add-done.md'));
      expect(done).toMatch(/merge/i);
      expect(read(DELIVERY_MODE)).toMatch(/merge is always the user/i);
    });

    it.each(REPLACED)('drops the replaced print in $file', ({ file, phrase }) => {
      expect(read(file)).not.toContain(phrase);
    });

    it('no scoped closing still tells the agent to print the invocation before the offer', () => {
      // The class, enumerated. Six literals passed while these survived, so each
      // one is named rather than inferred -- see the note on SURVIVORS for why
      // the lexical version was rejected.
      const survivors = [];
      for (const { file, phrase, why } of SURVIVORS) {
        if (read(file).includes(phrase)) survivors.push(`${file}: "${phrase}" — ${why}`);
      }
      expect(survivors, `surviving print instructions:\n${survivors.join('\n')}`).toEqual([]);
    });

    it('every scoped closing is one this suite actually scans', () => {
      // SCOPED is built from ADAPTERS plus the two owners. If an adapter is ever
      // added to the plan and not here, the class check silently stops covering
      // it -- so the count is pinned rather than trusted.
      expect(SCOPED).toHaveLength(Object.keys(ADAPTERS).length + 3);
      expect(SCOPED).toHaveLength(15);
    });
  });

  describe('R7 -- the exemptions and the negatives', () => {
    it.each(EXEMPT)('%s stays a router with no continuation offer', (file) => {
      const src = read(path.join('commands', file));
      expect(src).not.toContain(OUTPUT);
      expect(src).not.toContain(ELIGIBILITY);
    });

    it('keeps the seven no-action closings free of an invented continuation', () => {
      // R7's no-action half. An audit, a healthy diagnosis and a standalone wiki
      // run end normally; the offer is conditional on a real next activity, so
      // none of them may hardcode one.
      for (const file of ['add-audit.md', 'add-diagnose.md', 'add-wiki.md']) {
        const src = read(path.join('commands', file));
        expect(src, `${file} names an output contract`).not.toMatch(
          /chat-continuation-output-v1[\s\S]{0,200}?\/add-new/,
        );
      }
    });
  });

  describe('F5 -- the routing document', () => {
    it('consumes both contracts', () => {
      const src = read(ECOSYSTEM);
      expect(src).toContain(OUTPUT);
      expect(src).toContain(ELIGIBILITY);
    });

    it('keeps the router/UX exemptions it already carried', () => {
      expect(read(ECOSYSTEM)).toMatch(/add-ux/);
    });
  });
});
