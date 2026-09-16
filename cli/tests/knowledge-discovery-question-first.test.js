import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ACTIONS } from '../../mcp/engine.mjs';

/**
 * Plan 2026-09-14T102848 — the product layer's knowledge discovery answers the
 * question it was asked.
 *
 * Validation Matrix levels L2 and L3. L1 lives in
 * `framwork/.codeadd/scripts/tests/delivered.bats`, because the contract it
 * proves is bash.
 *
 * RED FIRST for the assertions that carry the change. Every one of those was
 * authored and confirmed FAILING against the tree before F1 landed.
 *
 * NOT every assertion here was red, and the header used to claim otherwise.
 * Some are GUARDs, labelled at the assertion: they passed before the change and
 * must keep passing, which is a different and equally load-bearing job. Where a
 * block carries no label, read its body — a presence check over text the change
 * did not author (L2.4, L3.3's count, L3.4's "keeps the intent table") is a
 * guard whether or not it says so.
 *
 * Why L3 is here and not only in a reviewer's eye: F9 takes L1 and this is the
 * only test-writing F-block left, and the matrix's opening rule requires every
 * level to be RED before any F-block lands.
 */

const REPO = path.resolve(import.meta.dirname, '..', '..');
const CODEADD = path.join(REPO, 'framwork', '.codeadd');

const read = (...p) => fs.readFileSync(path.join(CODEADD, ...p), 'utf8');

const SKILL = ['skills', 'add-knowledge-discovery', 'SKILL.md'];
const CONTRACT = ['skills', 'add-doc-schemas', 'references', 'delivery-index.md'];
const SCRIPT = ['scripts', 'delivered.sh'];
const GITNEXUS = ['plugins', 'gitnexus', 'skills', 'add-gitnexus', 'SKILL.md'];

/** The six commands that load the skill and consume its GRAPH step. */
const GRAPH_COMMANDS = [
  'add.plan.md',
  'add.new.md',
  'add.hotfix.md',
  'add.brainstorm.md',
  'add.diagnose.md',
  'add.review.md',
];

/** The per-bucket keys F2 emits in place of MATCHED/RETURNED. */
const BUCKET_KEYS = ['MATCHED_LIVE', 'MATCHED_DEAD', 'RETURNED_LIVE', 'RETURNED_DEAD'];

const AGENT_FRAGMENT_DIR = path.join(CODEADD, 'plugins', 'gitnexus', 'fragments', 'agents');
const COMMAND_FRAGMENT_DIR = path.join(CODEADD, 'plugins', 'gitnexus', 'fragments');

const agentFragments = () =>
  fs.readdirSync(AGENT_FRAGMENT_DIR).filter((f) => f.endsWith('.md')).sort();

const commandFragments = () =>
  fs.readdirSync(COMMAND_FRAGMENT_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();

// ─── L2 — the written contracts describe what the code does ──────────────────

describe('L2.1 — the script header carries its own contract', () => {
  it('names the two caps and the scoring rule in the usage block', () => {
    const header = read(...SCRIPT).split('set -u')[0];
    expect(header).toMatch(/per-term|terms? are scored|score/i);
    expect(header).toMatch(/5 live|five live/i);
    expect(header).toMatch(/2 dead|two dead/i);
  });
});

describe('L2.2 — the read contract stops promising what the script does not do', () => {
  const contract = () => read(...CONTRACT);

  it('states per-term matching', () => {
    expect(contract()).toMatch(/per-term|each term|term by term/i);
  });

  it('states the two-bucket cut with both caps', () => {
    const c = contract();
    expect(c).toMatch(/5 live|five live/i);
    expect(c).toMatch(/2 dead|two dead/i);
  });

  it('never promises dead entries are returned without naming the dead cap', () => {
    // The old line read "Dead entries are returned, never filtered." — true only
    // while MATCHED <= LIMIT, which is the defect F2 closes.
    const c = contract();
    const unqualified = /never filtered\.|NEVER dropped\./;
    expect(c).not.toMatch(unqualified);
  });
});

describe('L2.3 — every reader of doRead output speaks the new keys, and there are exactly two', () => {
  it('the skill INDEX step names the per-bucket keys', () => {
    const s = read(...SKILL);
    for (const k of BUCKET_KEYS) expect(s).toContain(k);
  });

  it('add.hotfix.md, which calls `delivered.sh read` directly, names them too', () => {
    const h = read('commands', 'add.hotfix.md');
    for (const k of BUCKET_KEYS) expect(h).toContain(k);
  });

  it('no third artefact invokes `delivered.sh read`', () => {
    // GUARD. add.done.md calls `verify` and `write` and never `read`, so it
    // carries no output key and must not be asserted to.
    const hits = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.md') && /delivered\.sh\s+read\b/.test(fs.readFileSync(full, 'utf8'))) {
          hits.push(path.relative(CODEADD, full).replace(/\\/g, '/'));
        }
      }
    };
    walk(CODEADD);
    expect(hits.sort()).toEqual([
      'commands/add.hotfix.md',
      'skills/add-knowledge-discovery/SKILL.md',
    ]);
  });
});

describe('L2.4 — the gitnexus agent fragments keep what makes each one distinct', () => {
  it('every fragment keeps its section markers and its uses: block', () => {
    for (const f of agentFragments()) {
      const body = fs.readFileSync(path.join(AGENT_FRAGMENT_DIR, f), 'utf8');
      expect(body, `${f} open marker`).toMatch(/<!-- section:graph -->/);
      expect(body, `${f} close marker`).toMatch(/<!-- \/section:graph -->/);
      expect(body, `${f} uses block`).toMatch(/<!-- uses:[\s\S]*skill: add-gitnexus[\s\S]*-->/);
    }
  });

  it('the three frontend-scoped fragments keep that scoping word', () => {
    for (const f of ['frontend-agent.md', 'ux-agent.md', 'ux-flow-agent.md']) {
      const body = fs.readFileSync(path.join(AGENT_FRAGMENT_DIR, f), 'utf8');
      expect(body, f).toContain('frontend-scoped');
    }
  });

  it('every fragment keeps its grep-insufficiency sentence', () => {
    for (const f of agentFragments()) {
      const body = fs.readFileSync(path.join(AGENT_FRAGMENT_DIR, f), 'utf8');
      expect(body, f).toMatch(/grep alone misses|not sufficient evidence/i);
    }
  });
});

describe('L2.5 — the injection surface is untouched', () => {
  it('the gitnexus anchors in injection-points.json are unchanged', () => {
    // The plan owes "same anchors, same section names, same target resources,
    // same count" — the file set alone would pass a moved or renamed
    // `<!-- section:graph -->` marker, which is the one thing F8 could break.
    const sidecar = path.join(CODEADD, 'injection-points.json');
    if (!fs.existsSync(sidecar)) return; // build-emitted and gitignored
    const points = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    const gitnexus = JSON.stringify(points).match(/gitnexus/g) ?? [];
    expect(gitnexus.length, 'the gitnexus plugin vanished from the injection map').toBeGreaterThan(0);
    const sections = new Set(
      JSON.stringify(points).match(/"section":"[^"]+"/g)?.map((x) => x) ?? [],
    );
    // graph and graph-<command> are the only section names gitnexus declares.
    expect([...sections].filter((x) => /graph/.test(x)).length).toBeGreaterThan(0);
  });

  it('the fragment file set is exactly the nine agents and the six commands', () => {
    // GUARD. F8 edits bodies inside existing markers; it adds, removes and
    // renames nothing, so the injection map must come out byte-identical.
    expect(agentFragments()).toEqual([
      'architecture-agent.md',
      'backend-agent.md',
      'database-agent.md',
      'discovery-agent.md',
      'frontend-agent.md',
      'reviewer-agent.md',
      'system-design-agent.md',
      'ux-agent.md',
      'ux-flow-agent.md',
    ]);
    expect(commandFragments()).toEqual([
      'add.diagnose.md',
      'add.done.md',
      'add.hotfix.md',
      'add.new.md',
      'add.plan.md',
      'add.wiki.md',
    ]);
  });
});

// ─── L3 — behavioural acceptance ─────────────────────────────────────────────

describe('L3.1 — each command states its question and gates on a filled answer', () => {
  it.each(GRAPH_COMMANDS)('%s carries a GRAPH question ending in a question mark', (file) => {
    const body = read('commands', file);
    const m = body.match(/\*\*GRAPH question:\*\*\s*(.+)/);
    expect(m, `${file} has no **GRAPH question:** line`).not.toBeNull();
    expect(m[1].trim(), `${file}'s question is not phrased as one`).toMatch(/\?/);
  });

  it.each(GRAPH_COMMANDS)('%s gates on a filled RELATED_WORK', (file) => {
    // The plan's Risk table names this gate as the mitigation for "replacing a
    // fixed call with a question makes the agent call nothing". Asserting only
    // the question would leave that mitigation unbuilt and unnoticed.
    const body = read('commands', file);
    expect(body, `${file} has no blank-RELATED_WORK gate`).toMatch(
      /IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:/,
    );
  });

  it.each(GRAPH_COMMANDS)('%s names no MCP action of its own', (file) => {
    // GUARD. None of the six carries `--action=` today — they inherit the two
    // pinned calls from the skill. This asserts F5 does not fix the pinning by
    // copying the calls down into each command, which would spread the defect
    // instead of removing it.
    expect(read('commands', file)).not.toMatch(/--action=/);
  });

  it.each(GRAPH_COMMANDS)('%s pins no action in prose either', (file) => {
    // `--action=` is not the only way to pin one. Three commands wrote the
    // action's NAME into a sentence — "run the GRAPH step with `touched_by`",
    // "`search` ONLY at this step" — which holds a run to one call exactly as
    // firmly as the flag does, and the flag-only check sailed past all three.
    //
    // This matches the SHAPE of a pin, not the action's name. Every action name
    // collides with an ordinary use somewhere in these files — `path` is a field
    // on a hit and an argument to an agent, `dependencies` is a column in the
    // epic schema, `search` and `history` are English words — so a name-based
    // check flags correct text and teaches the next author to work around it.
    // What is actually wrong is an instruction that hands the step a call:
    // "run the GRAPH step with X", or "X ONLY at this step".
    const body = read('commands', file);
    const PINS = [
      /GRAPH step (?:with|using) `\w+`/g,
      /`\w+` ONLY at this step/g,
    ];
    const offenders = PINS.flatMap((re) => [...body.matchAll(re)].map((m) => m[0]));
    expect(offenders, `${file} hands the GRAPH step a call:\n${offenders.join('\n')}`).toEqual([]);
  });
});

describe('L3.2 — an empty answer and a missing route are two outcomes, not one', () => {
  const skill = () => read(...SKILL);

  it('the GRAPH step carries the NOT VERIFIED label', () => {
    expect(skill()).toContain('NOT VERIFIED');
  });

  it('it distinguishes an empty answer from an unreachable graph', () => {
    const s = skill();
    expect(s).toMatch(/empty answer|answered with nothing|returned nothing/i);
    expect(s).toMatch(/no route|cannot be reached|unreachable/i);
  });

  it('it keeps the one-shot CLI form for a provider with no MCP', () => {
    expect(skill()).toMatch(/npx codeadd mcp/);
  });
});

describe('L3.3 — the GRAPH step resolves every action the engine implements', () => {
  it('names all eleven, read from mcp/engine.mjs rather than from a copy', () => {
    // Scoped to the TABLE, and to the action column's backticked cell. A bare
    // includes() over the whole file would pass on almost any prose: `get`,
    // `path`, `history`, `stats` and `search` are ordinary English words, so it
    // would not notice a row being dropped.
    const s = read(...SKILL);
    const table = s.slice(
      s.indexOf('### Which Action Answers Which Question'),
      s.indexOf('**Two rows are the ones a discovery step usually wants**'),
    );
    expect(table.length, 'the action table was not found').toBeGreaterThan(200);
    const cells = new Set([...table.matchAll(/\|\s*`(\w+)`\s*\|/g)].map((m) => m[1]));
    const missing = [...ACTIONS].filter((a) => !cells.has(a));
    expect(missing, `actions with no row in the table: ${missing.join(', ')}`).toEqual([]);
    expect(cells.size, 'the table has rows for actions the engine does not implement').toBe(11);
  });

  it('the engine still implements exactly eleven, so the assertion above is not vacuous', () => {
    expect([...ACTIONS]).toHaveLength(11);
  });
});

describe('L3.4 — add-gitnexus resolves by intent, never by command name', () => {
  const skill = () => read(...GITNEXUS);

  it('carries no section mapping a command name to a native skill', () => {
    expect(skill()).not.toMatch(/##\s*Command-intent resolution/);
  });

  it('no codeadd command name sits on the same line as a native skill name', () => {
    const offenders = skill()
      .split('\n')
      .filter((l) => /\badd\.[a-z-]+\b/.test(l) && /gitnexus-[a-z-]+/.test(l));
    expect(offenders, `lines pairing a command with a native skill:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('keeps the intent table and the unindexed-graph fallback', () => {
    const s = skill();
    expect(s).toMatch(/##\s*Intent → native skill/);
    expect(s).toMatch(/say so explicitly/);
    expect(s).toMatch(/do not block/);
  });
});

describe('L3.5 — no gitnexus agent fragment pins a native skill', () => {
  it.each(agentFragments())('%s names no gitnexus-* skill', (file) => {
    const body = fs.readFileSync(path.join(AGENT_FRAGMENT_DIR, file), 'utf8');
    const found = body.match(/gitnexus-[a-z-]+/g) ?? [];
    expect(found, `${file} still pins: ${found.join(', ')}`).toEqual([]);
  });

  it('the six command fragments still name none — they were already correct', () => {
    // GUARD. Editing these would remove correct text.
    for (const f of commandFragments()) {
      const body = fs.readFileSync(path.join(COMMAND_FRAGMENT_DIR, f), 'utf8');
      expect(body.match(/gitnexus-[a-z-]+/g) ?? [], f).toEqual([]);
    }
  });
});

describe('L3.6 — an operation still names its call, and says why', () => {
  const done = () => read('commands', 'add.done.md');

  it('keeps both --action= calls', () => {
    // GUARD. reindex and stats are operations with exactly one call each.
    expect(done()).toContain('--action=reindex');
    expect(done()).toContain('--action=stats');
  });

  it('records why they are not questions', () => {
    // Singular or plural, either order. The assertion is about the reason being
    // written down, not about how the sentence happens to be phrased.
    expect(done()).toMatch(
      /operations?[^.]{0,60}not\s+(?:an?\s+)?questions?|not\s+(?:an?\s+)?questions?[^.]{0,60}operations?/i,
    );
  });
});
