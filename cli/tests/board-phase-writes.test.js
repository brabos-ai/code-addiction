/**
 * The seven writes (plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses,
 * checkpoint 3). Every write is a step an agent reads, so what this suite can
 * hold is the TEXT that tells the agent: which section carries which write,
 * that each one points at the lifecycle reference instead of restating it, and
 * that the product and internal pipelines name the same seven statuses.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseFragmentSections } from '../src/injection-core.js';
import { FEATURES } from '../src/features.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const exists = (...p) => fs.existsSync(path.join(ROOT, ...p));
const REF = ['framwork', '.codeadd', 'skills', 'add--backlog', 'references'];
const lifecycle = () => read(...REF, 'lifecycle.md');
const phases = () => read(...REF, 'phases.md');
const fragment = (cmd) => parseFragmentSections(read('framwork', '.codeadd', 'fragments', 'board', `${cmd}.md`));

const TEN = ['open', 'refining', 'shaped', 'planning', 'planned', 'doing', 'in-review', 'awaiting-release', 'done', 'dropped'];
const EIGHT = ['backlog', 'shaping', 'planning', 'building', 'review', 'release', 'done', 'dropped'];
const WRITTEN = ['refining', 'shaped', 'planning', 'planned', 'doing', 'in-review', 'done'];
const tick = (s) => '`' + s + '`';

// The two rules live in lifecycle.md and nowhere else. These are the sentences
// a fragment would have to copy to restate them.
const RULE_SENTINELS = ['entry **or** exit', 'ONLY `in-review` AND `done`'];

describe('L11.1 -- phases.md carries the model, and no write table', () => {
  it('exists, and names the ten statuses and the eight columns', () => {
    expect(exists(...REF, 'phases.md')).toBe(true);
    for (const s of TEN) expect(phases(), s).toContain(tick(s));
    for (const c of EIGHT) expect(phases(), c).toContain(tick(c));
  });

  it('pairs a running status with a parked one where a phase has both', () => {
    expect(phases()).toMatch(/`refining`[^\n]*`shaped`/);
    expect(phases()).toMatch(/`planning`[^\n]*`planned`/);
  });

  it('carries no write: no backlog-commit.sh, no command step, neither rule', () => {
    expect(phases()).not.toContain('backlog-commit.sh');
    expect(phases()).not.toMatch(/STEP [0-9]/);
    for (const s of RULE_SENTINELS) expect(phases()).not.toContain(s);
  });
});

describe('L11.2/L11.3 -- lifecycle.md carries the procedure', () => {
  it('never says "hook"', () => {
    expect(lifecycle()).not.toMatch(/hook/i);
  });

  it('states both rules, once each, and points at phases.md for the model', () => {
    for (const s of RULE_SENTINELS) expect(lifecycle().split(s).length - 1, s).toBe(1);
    expect(lifecycle()).toContain('add--backlog/references/phases.md');
  });

  // The per-command section, not the whole file: The Status Names already lists
  // all nine, so a whole-file check would pass without a single write declared.
  it('declares every one of the seven writes in its per-command section', () => {
    const s = lifecycle();
    const a = s.indexOf('## Per Command');
    expect(a, 'no ## Per Command section').toBeGreaterThan(-1);
    const perCommand = s.slice(a, s.indexOf('\n## ', a + 5));
    for (const st of WRITTEN) expect(perCommand, st).toContain(tick(st));
  });
});

describe('L11.4 -- a fragment carries an anchor and a pointer, never a procedure', () => {
  it.each(FEATURES.board.commands)('%s restates neither rule', (cmd) => {
    const all = [...fragment(cmd).values()].join('\n');
    for (const s of RULE_SENTINELS) expect(all, `${cmd}: ${s}`).not.toContain(s);
  });
});

describe('L8/L9 -- each write sits in the section its step reads', () => {
  const has = (cmd, section, ...needles) => {
    const s = fragment(cmd).get(section);
    expect(s, `${cmd}:${section} missing`).toBeTruthy();
    for (const n of needles) expect(s, `${cmd}:${section} lacks ${n}`).toContain(n);
    expect(s, `${cmd}:${section} does not point at the lifecycle`).toContain('add--backlog/references/lifecycle.md');
  };

  it('add-brainstorm: refining once the path is stated, never on a spike; shaped after the intent file', () => {
    has('add-brainstorm', 'ticket-refining', tick('refining'), 'spike');
    has('add-brainstorm', 'ticket-shaped', tick('shaped'));
  });

  it('add-new: refining and the feature pointer in one write; shaped before its report', () => {
    has('add-new', 'ticket-skeleton', tick('refining'), tick('feature'));
    has('add-new', 'ticket-shaped', tick('shaped'));
  });

  it('add-plan: planning where the ticket is read; planned before its report', () => {
    has('add-plan', 'ticket-read', tick('planning'));
    has('add-plan', 'ticket-planned', tick('planned'));
  });

  it('add-build: in-review only on a PR that was opened or updated', () => {
    has('add-build', 'ticket-in-review', tick('in-review'), 'pr-opened', 'pr-updated');
  });

  it('add-hotfix: resolves from the invocation, writes doing, persists ticket:, never in-review', () => {
    expect(FEATURES.board.commands).toContain('add-hotfix');
    has('add-hotfix', 'ticket-resolve', '[0-9]{4}B');
    has('add-hotfix', 'ticket-doing', tick('doing'), tick('work_id'));
    expect(fragment('add-hotfix').get('ticket-frontmatter')).toContain('ticket:');
    expect(fragment('add-hotfix').get('ticket-report')).toMatch(/never[^\n]*in-review|in-review[^\n]*never/);
  });

  it('no add-build fragment line cites add-build STEP 17 or 18 (product-close-out-parity L4.6)', () => {
    const lines = [...fragment('add-build').values()].join('\n').split('\n');
    expect(lines.filter((l) => l.includes('add-build') && /STEP 1[78]/.test(l))).toEqual([]);
  });
});

describe('L11.5 -- the product and internal pipelines name the same seven writes', () => {
  const internal = () => {
    const s = read('workbench', 'skills', 'add-plan-authoring', 'SKILL.md');
    const a = s.indexOf('## The Ticket');
    const b = s.indexOf('\n## ', a + 5);
    return s.slice(a, b === -1 ? undefined : b);
  };
  it.each(WRITTEN)('%s is written in both', (s) => {
    const l = lifecycle();
    const a = l.indexOf('## Per Command');
    expect(l.slice(a, l.indexOf('\n## ', a + 5))).toContain(tick(s));
    expect(internal()).toContain(tick(s));
  });
  it('both state the work_id stop', () => {
    expect(lifecycle()).toContain('`work_id` stop');
    expect(internal()).toContain('`work_id` stop');
  });
  it.each([
    ['add-framework--brainstorm', ['refining', 'shaped']],
    ['add-framework--plan', ['planning', 'planned']],
    ['add-framework--build', ['in-review']],
  ])('%s carries its own writes', (stage, statuses) => {
    const s = read('workbench', 'skills', stage, 'SKILL.md');
    for (const st of statuses) expect(s, `${stage} lacks ${st}`).toContain(tick(st));
  });
});

describe('L2.2 -- the add-done write parks a merged ticket when the project opted in', () => {
  const doneRow = () => lifecycle().split('\n').find((l) => l.startsWith('| `add-done` |'));
  const closeStep = () => fragment('add-done').get('ticket-close');

  it('the lifecycle row, the lifecycle section and the fragment each name RELEASE_FLOW and awaiting-release', () => {
    expect(doneRow()).toContain('RELEASE_FLOW');
    expect(doneRow()).toContain(tick('awaiting-release'));
    const l = lifecycle();
    const a = l.indexOf('### `add-done`');
    const section = l.slice(a, l.indexOf('\n##', a + 5));
    expect(section).toContain('RELEASE_FLOW=yes');
    expect(section).toContain(tick('awaiting-release'));
    expect(closeStep()).toContain('RELEASE_FLOW=yes');
    expect(closeStep()).toContain(tick('awaiting-release'));
  });

  it('the Resume skip names both done and awaiting-release', () => {
    expect(closeStep()).toMatch(/already reads `done` or `awaiting-release`/);
    expect(lifecycle()).toMatch(/already reads `done` or `awaiting-release`/);
  });

  it('the work_id stop lets the awaiting-release write through, like done', () => {
    const l = lifecycle();
    const a = l.indexOf('### The `work_id` stop');
    const stop = l.slice(a, l.indexOf('\n###', a + 5));
    expect(stop).toContain(tick('awaiting-release'));
  });

  it('the close-out reports which status was written', () => {
    for (const section of ['ticket-carry', 'ticket-report']) {
      expect(fragment('add-done').get(section), section).toContain(tick('awaiting-release'));
    }
  });
});

describe('L11.6 -- a project starts on the ten', () => {
  // The board lives on its own branch, outside the checkout, so no test opens
  // this repository's board. What a new board starts with is the seed in the core.
  it('the seeded definitions hold the ten statuses and eight columns, and every status sits in a column', () => {
    const { DEFAULT_DEFS: d } = createRequire(import.meta.url)(path.join(ROOT, 'framwork', '.codeadd', 'scripts', 'backlog-core.cjs'));
    expect(d.statuses.map((s) => s.name)).toEqual(TEN);
    expect(d.columns.map((c) => c.name)).toEqual(EIGHT);
    const columns = new Set(EIGHT);
    expect(d.statuses.filter((s) => !columns.has(s.column))).toEqual([]);
  });
});

describe('the hotfix schema declares the field its command now writes', () => {
  it('fix.md lists ticket: as optional frontmatter', () => {
    expect(read('framwork', '.codeadd', 'skills', 'add--doc-schemas', 'references', 'fix.md')).toContain('optionally `ticket: [NNNN]B`');
  });
});

describe('L5 sweeps — the native recipes carry no shell pipeline', () => {
  /** The instruction files and the fragments that name native recipes must
   *  run the BACKLOG ENTRIES by `node`, with no bash/grep/printf/status.sh
   *  or redirection feeding a record. Compatibility references are marked:
   *  only prose that SAYS it is a compatibility path may name the shell form. */
  const FILES = [
    'framwork/.codeadd/skills/add--backlog/SKILL.md',
    'framwork/.codeadd/skills/add--backlog/references/lifecycle.md',
  ];
  const FRAGMENTS = ['brainstorm', 'build', 'done', 'hotfix', 'new', 'plan'];
  const NATIVE_FORBIDDEN = [
    [/printf[^\n]*backlog/i, 'a printf pipe feeding the backlog'],
    [/grep[^\n]*backlog\.(?:sh|-commit\.sh)/i, 'a grep of the board output'],
    [/status\.sh[^\n]*backlog|backlog[^\n]*status\.sh/i, 'an allocator running from the instruction'],
  ];

  it('the two instruction files feed records only through --record-file or a marked compat line', () => {
    for (const rel of FILES) {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      // Non-native sequences are refused wherever they appear UNLESS the
      // sentence marks itself as a compatibility path — that is the one
      // legal form. The check walks every shell-shaped record line.
      for (const [re, why] of NATIVE_FORBIDDEN) {
        for (const m of src.matchAll(new RegExp(re.source, 'gi'))) {
          const lineStart = src.lastIndexOf('\n', m.index) + 1;
          const block = src.slice(Math.max(0, lineStart - 260), m.index + 200);
          const marked = /compatibility/i.test(block);
          if (!marked) expect(`${rel}: ${why}`, m[0]).toBe(undefined || 'marked compat');
          expect(marked, `${rel}: an UNMARKED ${why}: ${m[0]}`).toBe(true);
        }
      }
      expect(src, rel).toContain('--record-file');
      expect(src, rel).toContain('backlog-cli.cjs');
      // The exact detail read: a declared id is answered by `get`, and this
      // block migrates with the lifecycle recipe in the same delivery.
      expect(src, rel).toMatch(/backlog-cli\.cjs get|get <id|get [A-Za-z<]/);
    }
  });

  it.each(FRAGMENTS.map((f) => [`fragments/board/add-${f}`, f]))('%s carries no record-feeding pipeline', (label, f) => {
    const src = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'fragments', 'board', `add-${f}.md`), 'utf8');
    expect(src, label).not.toMatch(/printf[^\n]*backlog/);
    expect(src, label).not.toMatch(/grep[^\n]*backlog/);
  });

  it('lifecycle.md names the native publication entry for its writes', () => {
    const s = fs.readFileSync(path.join(ROOT, 'framwork', '.codeadd', 'skills', 'add--backlog', 'references', 'lifecycle.md'), 'utf8');
    expect(s).toContain('node .codeadd/scripts/backlog-commit.cjs');
    expect(s).not.toContain('printf');
  });

  it('the product and internal Ticket procedure keep the same two rules and the writes', () => {
    const l = lifecycle();
    for (const st of WRITTEN) {
      const a = l.indexOf('## Per Command');
      expect(l.slice(a, l.indexOf('\n## ', a + 5))).toContain(tick(st));
    }
    expect(l).toContain('`work_id` stop');
  });

  it('the read recipe answers a declared id with get — no line scan, no grep pipe survived', () => {
    const s = lifecycle();
    expect(s).not.toMatch(/\| grep/);
    expect(s).toContain('get <ticket id>');
    // The exact read is named in the read section, not only in passing.
    expect(s).toContain('backlog-cli.cjs get');
  });
});
