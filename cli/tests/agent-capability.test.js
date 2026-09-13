import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Agent capability — a read-only agent is never asked to write.
 *
 * An agent declares `readonly: true` in its source frontmatter and every
 * provider dialect renders that however its engine expresses it. Claude's had no
 * capability field, so the constraint shipped there as prose in the agent body
 * and nothing enforced it: the agent DECLINED a write instead of being denied
 * one. A decline is not an error, so the dispatching command carried on and the
 * file it expected was simply absent — which is exactly how three dispatch sites
 * in `/add.plan` went unnoticed.
 *
 * Two gates, one per half of that failure:
 *
 *   1. The emitted Claude header carries a tool denial for every read-only
 *      agent. A source that declares its own `disallowedTools` keeps it — three
 *      agents deny Bash, Grep or Glob on top of the default three, and a build
 *      that overwrote them would silently WIDEN their capability.
 *
 *   2. No dispatch block declares a file `Output:` for a read-only agent. This is
 *      the regression gate for the shape the three fixed sites had.
 *
 * ⛔ Gate 2 is a text scan, not a semantic one, and its blind spots are known:
 * it needs a literal `@<name>` on a line, a declared DISPATCHES edge, and an
 * `Output:` bullet within DISPATCH_WINDOW lines. A prompt that orders a write in
 * a sentence — "the validator WRITES tasks.md directly" — passes it. So does a
 * dispatch written by role name with no `@`, and an instruction inside a skill
 * the agent loads, which arrives over USES_SKILL rather than DISPATCHES. Read it
 * as "this shape cannot come back", never as "no read-only agent is asked to
 * write anywhere".
 */

const require = createRequire(import.meta.url);
const { collectNodes, buildArtefactGraph, splitFrontmatter, AGENT_DIALECTS, readMap } =
  require('../../scripts/build.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

/**
 * Render an agent source through the Claude dialect exactly as
 * `agentStrategy.transform` does. The built provider directories are gitignored,
 * so reading them from disk would assert on whatever the last local build left
 * behind — or on nothing at all in a fresh clone.
 */
function claudeHeader(sourcePath, name, description) {
  const { fields, blocks, body } = splitFrontmatter(fs.readFileSync(sourcePath, 'utf8'));
  return AGENT_DIALECTS.claude({ fields, blocks }, body, {
    name,
    description,
    readonly: fields.readonly === 'true',
  });
}

const disallowedLine = (text) => (/^disallowedTools:.*$/m.exec(text) || [null])[0];

// --- Gate 2: the dispatch-block scan -------------------------------------

/**
 * How far past the line naming an agent a dispatch block is taken to reach.
 * Every physical line counts — a blank line and an HTML comment are not skipped.
 * Widening this without re-running the scan over the tree is how a false
 * positive gets in.
 */
const DISPATCH_WINDOW = 8;

/**
 * An `Output:` whose value OPENS with a backticked path ending in `.md`.
 *
 * The tightness is load-bearing. A looser `Output:.*\.md` also matches prose
 * that merely mentions a filename — `/add.plan` STEP 10.5 declares
 * `**Output:** Summary of changes … Keep each plan.md under 150 lines`, which is
 * a stdout summary and not a file the agent writes. That form scored a false
 * positive against the tree; this one scores none.
 */
const FILE_OUTPUT = /^\s*[-*]?\s*\*{0,2}Output:?\*{0,2}\s*`[^`\n]*\.md[^`\n]*`/;

/**
 * Every place a dispatch block for a read-only agent declares a file `Output:`.
 *
 * @param {{nodes: Array, edges: Array}} graph
 * @param {(nodePath: string) => string} readSource  source text for a node path
 * @returns {Array<{path: string, line: number, agent: string, text: string}>}
 */
function writeDispatches(graph, readSource) {
  const readonlyAgents = new Set(
    graph.nodes.filter((n) => n.kind === 'agent' && n.readonly).map((n) => n.id),
  );
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const found = new Map();

  for (const edge of graph.edges) {
    if (edge.type !== 'DISPATCHES' || !readonlyAgents.has(edge.to)) continue;
    const from = byId.get(edge.from);
    if (!from) continue;

    const agent = `@${edge.to.split('/').pop()}`;
    const lines = readSource(from.path).split(/\r?\n/);

    lines.forEach((line, i) => {
      if (!line.includes(agent)) return;
      for (let j = i + 1; j < Math.min(i + 1 + DISPATCH_WINDOW, lines.length); j++) {
        if (/^#{1,6}\s/.test(lines[j])) break;
        if (!FILE_OUTPUT.test(lines[j])) continue;
        const key = `${from.path}:${j + 1}`;
        if (!found.has(key)) {
          found.set(key, { path: from.path, line: j + 1, agent, text: lines[j].trim() });
        }
      }
    });
  }

  return [...found.values()];
}

const report = (hits) =>
  hits.map((h) => `${h.path}:${h.line} dispatches ${h.agent} (read-only)\n  ${h.text}`).join('\n');

// --- Fixtures -------------------------------------------------------------

/** A graph shaped like the real one, driven from in-memory sources. */
function fixture(sources) {
  return {
    graph: {
      nodes: [
        { id: 'product/agent/ro-agent', kind: 'agent', readonly: true, path: 'ro-agent.md' },
        { id: 'product/agent/rw-agent', kind: 'agent', readonly: false, path: 'rw-agent.md' },
        ...Object.keys(sources).map((p) => ({ id: `product/command/${p}`, kind: 'command', path: p })),
      ],
      edges: Object.keys(sources).flatMap((p) => [
        { from: `product/command/${p}`, to: 'product/agent/ro-agent', type: 'DISPATCHES' },
        { from: `product/command/${p}`, to: 'product/agent/rw-agent', type: 'DISPATCHES' },
      ]),
    },
    read: (p) => sources[p] ?? '',
  };
}

describe('agent capability — the emitted Claude header', () => {
  const agentsDir = path.join(CODEADD, 'agents');
  const agentFiles = fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  it('denies Write, Edit and NotebookEdit on every read-only agent', () => {
    const missing = [];
    for (const file of agentFiles) {
      const full = path.join(agentsDir, file);
      const { fields } = splitFrontmatter(fs.readFileSync(full, 'utf8'));
      if (fields.readonly !== 'true') continue;
      if (!disallowedLine(claudeHeader(full, file.slice(0, -3), 'x'))) missing.push(file);
    }
    expect(missing, `read-only agents built with no tool denial: ${missing.join(', ')}`).toEqual([]);
  });

  it('keeps a wider denial the source declared, instead of overwriting it', () => {
    // These three deny Bash, Grep or Glob on top of the default. A dialect that
    // replaced a source declaration rather than filling one in would widen their
    // capability, and nothing else in the suite would notice.
    //
    // All three are named, not a sample: the Glob shape occurs exactly once, so
    // asserting only the two Bash ones covers a single shape twice and the other
    // not at all.
    const wider = {
      'feature-history-agent': 'disallowedTools: Write, Edit, NotebookEdit, Bash, Grep',
      'git-history-agent': 'disallowedTools: Write, Edit, NotebookEdit, Glob, Grep',
      'readback-agent': 'disallowedTools: Write, Edit, NotebookEdit, Bash, Grep',
    };
    for (const [name, expected] of Object.entries(wider)) {
      const header = claudeHeader(path.join(agentsDir, `${name}.md`), name, 'x');
      expect(disallowedLine(header), name).toBe(expected);
    }
  });

  it('adds no denial to an agent that never declared readonly', () => {
    for (const name of ['backend-agent', 'frontend-agent']) {
      const header = claudeHeader(path.join(agentsDir, `${name}.md`), name, 'x');
      expect(disallowedLine(header), name).toBeNull();
    }
  });
});

describe('agent capability — no read-only agent is dispatched to write', () => {
  it('finds no file Output: in any dispatch block across the tree', () => {
    const graph = buildArtefactGraph(readMap(), CODEADD, ROOT);

    // Guard against a vacuous pass. The scan only reaches agents the graph marks
    // read-only, so if that field ever stops being emitted this assertion goes
    // green while checking nothing at all — which is how it behaved against the
    // tree before the field existed.
    const readonlyCount = graph.nodes.filter((n) => n.kind === 'agent' && n.readonly).length;
    expect(readonlyCount, 'no agent node is marked read-only — the scan would be blind').toBeGreaterThan(0);

    const hits = writeDispatches(graph, (p) => fs.readFileSync(path.join(ROOT, p), 'utf8'));
    expect(hits.length, `\n${report(hits)}\n`).toBe(0);
  });

  it('every agent node carries the readonly field the scan reads', () => {
    const nodes = collectNodes(readMap(), CODEADD, ROOT).filter((n) => n.kind === 'agent');
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.filter((n) => typeof n.readonly !== 'boolean')).toEqual([]);
  });

  it('catches a file Output: on a read-only agent, and names it', () => {
    const { graph, read } = fixture({
      'bad.md': [
        '**Dispatch:** @ro-agent',
        '- **Output:** `${PLAN_DIR}/tasks.md` (subfeature dir if epic)',
      ].join('\n'),
    });
    const offending = '- **Output:** `${PLAN_DIR}/tasks.md` (subfeature dir if epic)';
    const hits = writeDispatches(graph, read);
    expect(hits).toHaveLength(1);
    // Verbatim, not a substring: a report that paraphrases the line sends the
    // reader hunting for text that is not in the file.
    expect(hits[0]).toEqual({ path: 'bad.md', line: 2, agent: '@ro-agent', text: offending });
    expect(report(hits)).toBe(`bad.md:2 dispatches @ro-agent (read-only)\n  ${offending}`);
  });

  it('ignores an Output: that summarises to stdout but mentions a .md name', () => {
    // The exact shape /add.plan STEP 10.5 carries. A looser pattern flags it.
    const { graph, read } = fixture({
      'stdout.md': [
        '**Dispatch:** @ro-agent for integration review',
        '**Output:** Summary of changes to stdout. Keep each plan.md under 150 lines.',
      ].join('\n'),
    });
    expect(writeDispatches(graph, read)).toEqual([]);
  });

  it('ignores a file Output: handed to an agent that is not read-only', () => {
    const { graph, read } = fixture({
      'rw.md': ['**Dispatch:** @rw-agent', '- **Output:** `docs/design.md`'].join('\n'),
    });
    expect(writeDispatches(graph, read)).toEqual([]);
  });

  it('stops at the next heading, and at the end of the window', () => {
    const { graph, read } = fixture({
      'heading.md': [
        '**Dispatch:** @ro-agent',
        '',
        '### Next section',
        '- **Output:** `docs/out.md`',
      ].join('\n'),
      'far.md': ['**Dispatch:** @ro-agent', ...Array(8).fill(''), '- **Output:** `docs/out.md`'].join('\n'),
    });
    expect(writeDispatches(graph, read)).toEqual([]);
  });
});
