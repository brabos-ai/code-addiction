import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

/**
 * Plan 2026-09-09T090201 — review, no loops.
 * Red-Green Validation Matrix, levels L1 through L5.
 *
 * Every level here is written RED against the pre-plan tree: the review
 * discipline skill and the isolated readback agent do not exist, the build
 * dispatches neither, `/add-framework--review` is still on disk with its `vNN`
 * sequence, `/add-framework--done` still gates on a verdict file, four files
 * still instruct a re-entry into review, and `build.js` has no gate against a
 * distributed artefact naming an internal command.
 *
 * A number of assertions PASS on the pre-plan tree by design, and each is
 * marked. They guard properties the plan must PRESERVE — the eight reviewer
 * dimensions, the ledger gate in the close-out, the two prohibitions in
 * add-plan-authoring, the sync command's own gate, and the cross-layer
 * direction that is deliberately left open. A matrix that is RED everywhere has
 * no guard against collateral damage.
 *
 * L6 is behavioural (a real build observed end to end) and cannot live here. It
 * is recorded in the build ledger.
 */

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const P = {
  discipline: path.join(ROOT, '.claude', 'skills', 'add-review-discipline', 'SKILL.md'),
  readback: path.join(ROOT, '.claude', 'agents', 'plan-readback-agent.md'),
  reviewer: path.join(ROOT, '.claude', 'agents', 'plan-review-agent.md'),
  build: path.join(ROOT, '.claude', 'commands', 'add-framework--build.md'),
  done: path.join(ROOT, '.claude', 'commands', 'add-framework--done.md'),
  reviewCmd: path.join(ROOT, '.claude', 'commands', 'add-framework--review.md'),
  planCmd: path.join(ROOT, '.claude', 'commands', 'add-framework--plan.md'),
  brainstorm: path.join(ROOT, '.claude', 'commands', 'add-framework--brainstorm.md'),
  sync: path.join(ROOT, '.claude', 'commands', 'add-framework--sync.md'),
  authoring: path.join(ROOT, '.claude', 'skills', 'add-plan-authoring', 'SKILL.md'),
  claudeMd: path.join(ROOT, 'CLAUDE.md'),
  productPlanReview: path.join(
    ROOT, 'framwork', '.codeadd', 'skills', 'add-plan-review', 'SKILL.md',
  ),
};

const exists = (p) => fs.existsSync(p);
const read = (p) => (exists(p) ? fs.readFileSync(p, 'utf8') : '');

/** The frontmatter block only. Bodies also contain these words as prose. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

/** Everything after the frontmatter. */
function body(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
}

/**
 * Every `.md` under `.claude/`, as [absolute path, contents].
 * This is the sweep surface for L3 and L4 — the same one the plan's done-when
 * criteria name.
 */
function claudeMarkdown() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.md')) out.push([full, fs.readFileSync(full, 'utf8')]);
    }
  };
  walk(path.join(ROOT, '.claude'));
  return out;
}

// ---------------------------------------------------------------------------
// L1 — The two new artefacts
// ---------------------------------------------------------------------------

describe('L1 the two new artefacts', () => {
  it('L1.1 the review-discipline skill exists and carries name + description', () => {
    expect(exists(P.discipline)).toBe(true);
    const fm = frontmatter(read(P.discipline));
    expect(fm).toMatch(/^name:\s*add-review-discipline\s*$/m);
    expect(fm).toMatch(/^description:/m);
  });

  it('L1.2 it states one adversarial pass and at most two readbacks', () => {
    const text = read(P.discipline);
    // Both numbers written down, not implied.
    expect(text).toMatch(/\bexactly once\b/i);
    expect(text).toMatch(/\bat most twice\b|\bat most two\b/i);
  });

  it('L1.3 it states that neither dispatch writes a file, and names no vNN artefact', () => {
    const text = read(P.discipline);
    expect(text).toMatch(/writes no file|never writes a file|nothing is written to disk/i);
    expect(text).not.toMatch(/--review-v/);
    expect(text).not.toMatch(/\bvNN\b/);
  });

  it('L1.4 it forbids applying a finding without analysing it, in a condition block', () => {
    const text = read(P.discipline);
    expect(text).toMatch(/⛔ DO NOT/);
    expect(text).toMatch(/✅ DO/);
    // The rule itself, not merely the block format.
    expect(text).toMatch(/without (reading|analysing|analyzing|judging)|blindly|unread/i);
  });

  it('L1.5 its verdict table carries all three verdicts and no re-entry', () => {
    const text = read(P.discipline);
    for (const v of ['ok', 'fix-then-ok', 'blocked']) {
      expect(text).toContain(`\`${v}\``);
    }
    expect(text).not.toMatch(/re-enter review/i);
    expect(text).not.toMatch(/re-dispatch/i);
  });

  it('L1.6 the readback agent exists and its frontmatter enforces the blindness', () => {
    expect(exists(P.readback)).toBe(true);
    const fm = frontmatter(read(P.readback));
    expect(fm).toMatch(/^name:\s*plan-readback-agent\s*$/m);
    expect(fm).toMatch(/^readonly:\s*true\s*$/m);

    const tools = fm.match(/^tools:\s*(.+)$/m)?.[1] ?? '';
    expect(tools).not.toMatch(/\bGrep\b/);
    expect(tools).not.toMatch(/\bBash\b/);

    const denied = fm.match(/^disallowedTools:\s*(.+)$/m)?.[1] ?? '';
    for (const t of ['Write', 'Edit', 'Bash', 'Grep']) {
      expect(denied).toMatch(new RegExp(`\\b${t}\\b`));
    }

    // No memory: a reader that recalls context the document never gave it is
    // the one way to make the readback worthless.
    expect(fm).not.toMatch(/^memory:/m);
  });

  it('L1.7 its body forbids every external source by name', () => {
    const text = body(read(P.readback));
    for (const source of [/source code|code/i, /git/i, /memory/i]) {
      expect(text).toMatch(source);
    }
    expect(text).toMatch(/nothing outside|no external source|the document is the entire context/i);
  });

  it('L1.8 its body states it issues no verdict and asks no question', () => {
    const text = body(read(P.readback));
    expect(text).toMatch(/no verdict|issues? no verdict/i);
    expect(text).toMatch(/no question|asks? no question/i);
  });

  it('L1.9 the reviewer keeps its eight dimensions and four verdict rules', () => {
    // Passes today. Guards F5 against editing more than the two references.
    const text = read(P.reviewer);
    for (const dim of [
      'Scope', 'Hidden assumptions', 'Contradictions', 'Dependencies',
      'Executability', 'Testability', 'Risks', 'Gold-plating',
    ]) {
      expect(text).toContain(dim);
    }
    const verdictRules = text.match(/## Verdict[\s\S]*?\n(?=##)/)?.[0] ?? '';
    expect(verdictRules).toMatch(/^1\./m);
    expect(verdictRules).toMatch(/^4\./m);
  });
});

// ---------------------------------------------------------------------------
// L2 — The build dispatches both
// ---------------------------------------------------------------------------

/** The fenced STEP map at the top of a command. */
function stepMap(text) {
  return text.match(/\*\*STEPS IN ORDER:\*\*\s*```?[\s\S]*?```/)?.[0]
    ?? text.match(/\*\*STEPS IN ORDER:\*\*[\s\S]*?\n\n/)?.[0]
    ?? '';
}

/** The STEP numbers the map declares, in order. */
function stepNumbers(text) {
  return [...stepMap(text).matchAll(/^STEP (\d+):/gm)].map((m) => Number(m[1]));
}

/** Index of the heading for `STEP <n>` in the body, or -1. */
function stepHeadingIndex(text, n) {
  return text.search(new RegExp(`^## STEP ${n}:`, 'm'));
}

describe('L2 the build dispatches both', () => {
  it('L2.1 it dispatches the readback agent before the Implement step', () => {
    const text = read(P.build);
    expect(text).toContain('@plan-readback-agent');
    const readbackAt = text.indexOf('@plan-readback-agent');
    const implementAt = text.search(/^## STEP \d+: Implement/m);
    expect(readbackAt).toBeGreaterThan(-1);
    expect(implementAt).toBeGreaterThan(-1);
    expect(readbackAt).toBeLessThan(implementAt);
  });

  it('L2.2 it states the readback neither stops the flow nor gates it', () => {
    const text = read(P.build);
    expect(text).toMatch(/readback[\s\S]{0,400}?(does not stop|never stops|no gate|not a gate)/i);
  });

  it('L2.3 the adversarial audit sits after Validate and before Document', () => {
    const text = read(P.build);
    const validateAt = text.search(/^## STEP \d+: Validate/m);
    const reviewAt = text.search(/^## STEP \d+: Review/m);
    const documentAt = text.search(/^## STEP \d+: Document/m);
    expect(validateAt).toBeGreaterThan(-1);
    expect(reviewAt).toBeGreaterThan(-1);
    expect(documentAt).toBeGreaterThan(-1);
    expect(reviewAt).toBeGreaterThan(validateAt);
    expect(reviewAt).toBeLessThan(documentAt);
  });

  it('L2.4 it states the audit runs once, and instructs no re-dispatch', () => {
    const text = read(P.build);
    expect(text).toMatch(/\bexactly once\b|\bonce per\b/i);
    expect(text).not.toMatch(/re-dispatch/i);
    expect(text).not.toMatch(/double-check/i);
  });

  it('L2.5 the audit step carries the blast-radius queries', () => {
    const text = read(P.build);
    expect(text).toMatch(/graph\.js impact[^\n]*--depth 1/);
    expect(text).toMatch(/graph\.js history[^\n]*--layer/);
  });

  it('L2.6 its uses: block declares the new skill and the new agent', () => {
    const uses = read(P.build).match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
    expect(uses).toMatch(/^- skill: add-review-discipline$/m);
    expect(uses).toMatch(/^- agent: plan-readback-agent$/m);
  });

  it('L2.7 the STEP map declares ten steps, numbered 1..10 with no gap', () => {
    const nums = stepNumbers(read(P.build));
    expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('L2.8 every declared STEP has a matching heading in the body', () => {
    // Guards the renumbering: a map that says 10 and a body that stops at 8 is
    // the failure mode of inserting a step by hand.
    const text = read(P.build);
    for (const n of stepNumbers(text)) {
      expect(stepHeadingIndex(text, n), `STEP ${n} heading`).toBeGreaterThan(-1);
    }
  });

  it('L2.9 the build names review-vNN only as a resolver exclusion, never as an output', () => {
    // The plan predicted this green against a flat "no --review-v anywhere".
    // It is not: STEP 1.1 excludes `--review-v*` when resolving a plan argument,
    // and that exclusion must SURVIVE. Review companions from before this
    // delivery are still on disk, and a resolver that stops excluding them
    // returns two candidates for every such plan and refuses to run.
    // The property worth pinning is narrower: the string appears only where a
    // path is being ruled OUT, never where one is written.
    const lines = read(P.build).split(/\r?\n/).filter((l) => l.includes('--review-v'));
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l).toMatch(/excluding/);
  });

  it('L2.10 the two human gates survive the renumbering', () => {
    // Passes today. Guards against a renumbering that eats a real stop.
    const text = read(P.build);
    expect(text).toMatch(/^## STEP \d+: Design \[STOP\]/m);
    expect(text).toMatch(/^## STEP \d+: Publish \[STOP\]/m);
  });
});

// ---------------------------------------------------------------------------
// L3 — The review command is gone
// ---------------------------------------------------------------------------

describe('L3 the review command is gone', () => {
  it('L3.1 add-framework--review.md does not exist', () => {
    expect(exists(P.reviewCmd)).toBe(false);
  });

  it('L3.2 nothing under .claude/, CLAUDE.md or .codeadd/ names it', () => {
    const offenders = [];
    for (const [file, text] of claudeMarkdown()) {
      if (text.includes('add-framework--review')) offenders.push(path.relative(ROOT, file));
    }
    if (read(P.claudeMd).includes('add-framework--review')) offenders.push('CLAUDE.md');

    const codeadd = path.join(ROOT, 'framwork', '.codeadd');
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        // artefact-graph.json is generated; it mirrors the tree, it is not a source.
        else if (e.name.endsWith('.md')
          && fs.readFileSync(full, 'utf8').includes('add-framework--review')) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    };
    walk(codeadd);

    expect(offenders).toEqual([]);
  });

  it('L3.3 the close-out declares no command edge to it', () => {
    const uses = read(P.done).match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
    expect(uses).not.toMatch(/add-framework--review/);
  });

  it('L3.4 the reviewer declares no mention edge to it', () => {
    const uses = read(P.reviewer).match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
    expect(uses).not.toMatch(/add-framework--review/);
  });

  it('L3.5 the CLAUDE.md internal-command table loses that row and keeps the rest', () => {
    const text = read(P.claudeMd);
    expect(text).not.toMatch(/^\|\s*`add-framework--review`/m);
    // Passes today on this half. Guards against deleting neighbouring rows.
    for (const cmd of [
      'add-framework--plan', 'add-framework--build', 'add-framework--brainstorm',
      'add-framework--sync', 'add-framework--release', 'add-framework--done',
      'add-framework--roadmap',
    ]) {
      expect(text, cmd).toMatch(new RegExp(`^\\|\\s*\`${cmd}\``, 'm'));
    }
  });

  it('L3.6 the close-out has no review gate, and reads no review companion', () => {
    const text = read(P.done);
    expect(text).not.toMatch(/^#+ .*review gate/im);

    // Same correction as L2.9, same reason: the close-out's plan resolver also
    // excludes `--review-v*`, and companions from earlier deliveries are still
    // on disk. The string may appear where a path is ruled out, never where one
    // is read or required.
    const lines = text.split(/\r?\n/).filter((l) => l.includes('--review-v'));
    for (const l of lines) expect(l).toMatch(/excluding/);
  });

  it('L3.7 the close-out keeps its ledger gate intact', () => {
    // Passes today. This is the guard that F4 removed one gate and not two.
    const text = read(P.done);
    expect(text).toMatch(/ledger gate/i);
    expect(text).toContain('unwritten code breaks no test');
  });

  it('L3.8 the close-out speaks of no review verdict, and keeps the CI one', () => {
    // The plan asked for "no occurrence of the word verdict". That is too wide:
    // the close-out uses the word in two unrelated senses, and the second one
    // is load-bearing. A CI run has a verdict, and the rule that refuses to
    // read it off a different SHA is the gate that stops yesterday's green run
    // being accepted as today's. Only the REVIEW sense goes.
    const text = read(P.done);
    expect(text).not.toMatch(/review verdict/i);
    expect(text).not.toMatch(/verdict[^.\n]{0,60}review/i);
    expect(text).not.toMatch(/review[^.\n]{0,60}verdict/i);

    // Passes today and must keep passing.
    expect(text).toMatch(/refuse a verdict from any other SHA/);
  });

  it('L3.9 the distributed plan-review skill names no internal command', () => {
    const text = read(P.productPlanReview);
    expect(text).not.toMatch(/add-framework--/);
    // Passes today. Guards against deleting the whole sentence instead of the name.
    expect(text).toMatch(/review the document, not the repo/i);
  });
});

// ---------------------------------------------------------------------------
// L4 — No re-entry anywhere in .claude/
// ---------------------------------------------------------------------------

const RE_ENTRY = /re-dispatch|re-enter review|re-enter STEP|second review pass/i;

describe('L4 no re-entry', () => {
  it('L4.1 nothing under .claude/ instructs a re-entry, except the skill that owns the rule', () => {
    const offenders = [];
    for (const [file, text] of claudeMarkdown()) {
      if (path.resolve(file) === path.resolve(P.discipline)) continue;
      if (RE_ENTRY.test(text)) offenders.push(path.relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });

  it('L4.2 add-plan-authoring keeps both prohibitions', () => {
    // Passes today. Guards against collateral deletion while the re-entry goes.
    const text = read(P.authoring);
    expect(text).toMatch(/invent decisions to clear blockers/i);
    expect(text).toMatch(/skip review in Continue Mode/i);
  });

  it('L4.3 the pass rule is stated once, in the skill that owns it', () => {
    const owners = [];
    for (const [file, text] of claudeMarkdown()) {
      if (/\bexactly once\b/i.test(text) && /\bat most tw/i.test(text)) {
        owners.push(path.relative(ROOT, file));
      }
    }
    expect(owners).toEqual([path.relative(ROOT, P.discipline).split(path.sep).join('/')]
      .map((p) => p.split('/').join(path.sep)));
  });

  it('L4.4 the three dispatch sites point at the skill instead of repeating it', () => {
    for (const p of [P.authoring, P.planCmd, P.brainstorm]) {
      const uses = read(p).match(/<!--\s*uses:[\s\S]*?-->/)?.[0] ?? '';
      expect(uses, path.basename(p)).toMatch(/^- skill: add-review-discipline$/m);
    }
  });

  it('L4.5 the sync command keeps its four-report gate', () => {
    // Passes today. F11 changes one word; the behaviour is untouched.
    const text = read(P.sync);
    expect(text).toMatch(/All 4 reports exist/i);
    expect(text).toMatch(/⛔ DO NOT USE: Edit on any documentation file/);
  });
});

// ---------------------------------------------------------------------------
// L5 — The cross-layer gate
// ---------------------------------------------------------------------------

const PRODUCT_SKILL = {
  id: 'product/skill/add-plan-review',
  kind: 'skill',
  layer: 'product',
  name: 'add-plan-review',
  path: 'framwork/.codeadd/skills/add-plan-review/SKILL.md',
  registered: true,
  declares: true,
};

const INTERNAL_CMD = {
  id: 'internal/command/add-framework--build',
  kind: 'command',
  layer: 'internal',
  name: 'add-framework--build',
  path: '.claude/commands/add-framework--build.md',
  registered: true,
  declares: true,
};

const PRODUCT_SCRIPT = {
  id: 'product/script/delivered.sh',
  kind: 'script',
  layer: 'product',
  name: 'delivered.sh',
  path: 'framwork/.codeadd/scripts/delivered.sh',
  registered: true,
  declares: false,
};

function check(nodes, sources) {
  const { checkArtefactGraph } = require_('../../scripts/build.js');
  return checkArtefactGraph(
    { nodes, edges: [] },
    { readSource: (n) => sources[n.id] ?? '' },
  );
}

describe('L5 the cross-layer gate', () => {
  it('L5.1 a distributed artefact naming an internal command warns', () => {
    // The real case writes the bare name inside backticks, with no leading
    // slash — so a check reusing the command-only `/name` pattern would miss
    // the very line that motivated this gate.
    const { warnings } = check([PRODUCT_SKILL, INTERNAL_CMD], {
      [PRODUCT_SKILL.id]: 'Do not confuse this with `add-framework--build`.',
    });
    const hit = warnings.join('\n');
    expect(hit).toContain(PRODUCT_SKILL.path);
    expect(hit).toContain('add-framework--build');
  });

  it('L5.2 an internal artefact naming a product artefact does not warn', () => {
    // Passes today, and must keep passing: the close-out names `delivered.sh`
    // on purpose, and its own source comment explains why.
    const { warnings } = check([INTERNAL_CMD, PRODUCT_SCRIPT], {
      [INTERNAL_CMD.id]: 'The close-out calls delivered.sh to write the entry.',
    });
    expect(warnings.join('\n')).not.toContain('delivered.sh');
  });

  it('L5.3 a distributed artefact naming no internal command does not warn', () => {
    const { warnings } = check([PRODUCT_SKILL, INTERNAL_CMD], {
      [PRODUCT_SKILL.id]: 'Review the document, not the repo versus the document.',
    });
    expect(warnings.join('\n')).not.toContain('add-framework--build');
  });

  it('L5.4 the real distributed plan-review skill does not trip the gate', () => {
    const { warnings } = check([PRODUCT_SKILL, INTERNAL_CMD], {
      [PRODUCT_SKILL.id]: read(P.productPlanReview),
    });
    expect(warnings.join('\n')).not.toContain(PRODUCT_SKILL.path);
  });
});
