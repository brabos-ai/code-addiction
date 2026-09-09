import { describe, it, expect, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Artefact graph extraction + gate guard (plan 0077, waves 1-2).
 *
 * `scripts/build.js` emits a third content-derived sidecar,
 * `framwork/.codeadd/artefact-graph.json`, holding every artefact node and the
 * typed edges between them. Declared edges come from a source-only
 * `<!-- uses: -->` HTML comment read from RAW content before stripHtmlComments()
 * runs — the same mechanism extractInjectionPoints() uses, so the block never
 * reaches a provider file.
 *
 * Two cases here are load-bearing and must never be relaxed:
 *
 *   L2.2 — a directory under skills/ WITHOUT a SKILL.md produces no node and no
 *   failure. Node identity is "what the build can transform", never "what sits in
 *   the right folder". Three separate probes written while specifying this change
 *   misread skills/*\/ as the skill set; a gate built that way fails the build on
 *   perfectly correct files (eval workspaces, scratch dirs, tooling output).
 *
 *   L1.2 — the block is absent from built output for every provider. This is what
 *   proves extraction rides the existing stripping pass instead of adding its own.
 *   Without it, a second stripping implementation can drift from the first and
 *   ship build metadata to users.
 */

const require = createRequire(import.meta.url);
const {
  extractUses,
  collectNodes,
  stripHtmlComments,
  buildArtefactGraph,
  writeArtefactGraph,
  checkArtefactGraph,
  readMap,
} = require('../../scripts/build.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const TMP_DIRS = [];

function tmpDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  TMP_DIRS.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of TMP_DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

/** A source body carrying a well-formed declaration block. */
const WELL_FORMED = `---
description: a command
---

# Some Command

<!-- uses:
- skill: add-doc-schemas/references/new-feature.md
- skill: add-tasks-checklist
- agent: reviewer-agent (depth 1)
- command: /add.review (handoff)
- script: qa-evidence.sh
- skill: add-tdd (conditional)
-->

## STEP 1

Body prose.
`;

// ---------------------------------------------------------------------------
// L1 — extractUses() unit
// ---------------------------------------------------------------------------

describe('L1 extractUses', () => {
  it('L1.1 yields one edge per entry, with kind, target and modifier resolved', () => {
    const edges = extractUses(WELL_FORMED, 'add.build', 'command');

    expect(edges).toHaveLength(6);
    expect(edges.every((e) => e.from === 'product/command/add.build')).toBe(true);
    expect(edges.every((e) => e.origin === 'declared')).toBe(true);

    // A skill target carrying a path is a reference node, not a skill node.
    // The author writes `skill:` because that is how they think about it; the
    // resolver decides the node kind. Collapsing these two would make the
    // dangling-reference gate unable to tell a missing file from a missing skill.
    expect(edges[0]).toMatchObject({
      to: 'product/reference/add-doc-schemas/references/new-feature.md',
      type: 'USES_SKILL',
      modifier: null,
    });
    expect(edges[1]).toMatchObject({ to: 'product/skill/add-tasks-checklist', type: 'USES_SKILL' });
    expect(edges[2]).toMatchObject({ to: 'product/agent/reviewer-agent', type: 'DISPATCHES', modifier: 'depth 1' });
    expect(edges[3]).toMatchObject({ to: 'product/command/add.review', type: 'HANDS_OFF_TO', modifier: 'handoff' });
    expect(edges[4]).toMatchObject({ to: 'product/script/qa-evidence.sh', type: 'RUNS_SCRIPT' });
    expect(edges[5]).toMatchObject({ to: 'product/skill/add-tdd', modifier: 'conditional' });
  });

  it('L1.2 the block is removed by the EXISTING stripping pass, not a new one', () => {
    // The mechanism, at unit level: extraction reads raw content, and the block
    // is a plain HTML comment that stripHtmlComments() already removes. If this
    // ever fails, someone has added a second stripping implementation — free to
    // drift from the first and ship build metadata to users.
    const stripped = stripHtmlComments(WELL_FORMED);

    expect(stripped).not.toMatch(/uses:/);
    expect(stripped).not.toMatch(/add-tasks-checklist/);
    expect(stripped).toContain('## STEP 1'); // the rest of the body survives
  });

  it('L1.2 no built provider file carries a declaration block', () => {
    // The mechanism against the real tree, across every provider that received
    // one of the three pilots. Requires `node scripts/build.js` to have run.
    const built = [
      'framwork/.claude/commands/add.ux.md',
      'framwork/.cursor/commands/add.ux.md',
      'framwork/.opencode/commands/add.ux.md',
      'framwork/.agents/skills/add.ux/SKILL.md',
      'framwork/.claude/skills/add-frontend-development/SKILL.md',
      'framwork/.claude/agents/database-agent.md',
    ];

    let checked = 0;
    for (const rel of built) {
      const full = path.join(ROOT, rel);
      if (!fs.existsSync(full)) continue; // provider layouts differ; skip absent
      expect(fs.readFileSync(full, 'utf8'), `${rel} ships the declaration block`)
        .not.toMatch(/uses:/);
      checked++;
    }

    // Guard the guard: skipping every path would make this level vacuous.
    expect(checked).toBeGreaterThan(2);
  });

  it('L1.11 `mention:` records an acknowledged reference and creates NO edge', () => {
    // Wave 2 turns "mentioned but not declared" into a build failure, and a
    // name-matching sniffer cannot tell "uses X" from "explicitly does NOT use
    // X". add-health-check's only reference to add-security-audit is
    // "- Security-only audit (use add-security-audit)" — a pointer AWAY, inside
    // a list of when not to use the skill. Declaring it would put a false edge
    // in the graph; leaving it undeclared would fail the build on correct prose.
    // `mention:` is the third option: acknowledged, reviewable, edge-free.
    // It is a typed edge, not a side channel: the graph gains the fact that one
    // doc points at another without depending on it, and the dangling gate
    // validates the target for free.
    const src = '<!-- uses:\n- skill: add-qa\n- mention: add-security-audit\n-->\n';
    const edges = extractUses(src, 'add-health-check', 'skill');

    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({ to: 'product/skill/add-qa', type: 'USES_SKILL' });
    expect(edges[1]).toMatchObject({ to: 'product/skill/add-security-audit', type: 'MENTIONS' });
  });

  it('L1.11 a MENTIONS edge suppresses the undeclared-reference failure', () => {
    const nodes = [
      {
        id: 'product/skill/add-health-check', kind: 'skill', layer: 'product',
        name: 'add-health-check', path: 'x/SKILL.md', registered: true,
        providers: [], declares: true,
      },
      {
        id: 'product/skill/add-security-audit', kind: 'skill', layer: 'product',
        name: 'add-security-audit', path: 'y/SKILL.md', registered: true,
        providers: [], declares: false,
      },
    ];
    const prose = () => 'Security-only audit (use add-security-audit)';

    // Undeclared: fails.
    expect(checkArtefactGraph({ nodes, edges: [] }, { readSource: prose }).failures.length)
      .toBeGreaterThan(0);

    // Acknowledged: silent, and no USES_SKILL edge was invented to get there.
    const edges = [{
      from: 'product/skill/add-health-check',
      to: 'product/skill/add-security-audit',
      type: 'MENTIONS', origin: 'declared', modifier: null,
    }];
    expect(checkArtefactGraph({ nodes, edges }, { readSource: prose }).failures).toEqual([]);
  });

  it('L1.11 a typo in a `mention:` target still fails the dangling gate', () => {
    // Acknowledging a name is not a licence to invent one — a typo'd mention
    // would silence the sniffer forever against a name nothing will ever match.
    const graph = {
      nodes: [{
        id: 'product/skill/add-health-check', kind: 'skill', layer: 'product',
        name: 'add-health-check', path: 'x/SKILL.md', registered: true,
        providers: [], declares: true,
      }],
      edges: [{
        from: 'product/skill/add-health-check',
        to: 'product/skill/add-securty-audit',
        type: 'MENTIONS', origin: 'declared', modifier: null,
      }],
    };

    expect(checkArtefactGraph(graph, { readSource: () => '' }).failures.join('\n'))
      .toMatch(/add-securty-audit/);
  });

  it('L1.10 a target ending in /SKILL.md names the SKILL, not a reference file', () => {
    // `{{skill:add-ux-design/SKILL.md}}` is how a source points at a skill
    // itself. Under a bare "contains a slash → reference" rule it resolves to
    // reference/add-ux-design/SKILL.md — a node that does not exist, because
    // SKILL.md files are skills. The dangling gate would then fail the build on
    // a correct declaration.
    const src = '<!-- uses:\n- skill: add-ux-design/SKILL.md\n-->\n';
    expect(extractUses(src, 'add-frontend-development', 'skill')[0].to)
      .toBe('product/skill/add-ux-design');
  });

  it('L1.9 resolves targets within the declaring artefact own layer', () => {
    // `add-commit` is BOTH a product skill and an internal skill. A bare name is
    // ambiguous across layers and unambiguous within one, so the declaring
    // artefact's layer decides. Without this, the two collide on one id.
    const src = '<!-- uses:\n- skill: add-commit\n-->\n';

    expect(extractUses(src, 'add.done', 'command', 'product')[0].to)
      .toBe('product/skill/add-commit');
    expect(extractUses(src, 'add-framework--build', 'command', 'internal')[0].to)
      .toBe('internal/skill/add-commit');
  });

  it('L1.3 returns no edges and does not throw when the artefact declares nothing', () => {
    // The common case during wave 1: almost no artefact declares yet. Throwing
    // here would block every build.
    expect(extractUses('# Plain\n\nNo block here.\n', 'add.audit', 'command')).toEqual([]);
  });

  it('L1.4 fails on an unknown kind, naming the artefact and the line', () => {
    const src = '<!-- uses:\n- widget: something\n-->\n';
    expect(() => extractUses(src, 'add.build', 'command')).toThrow(/add\.build/);
    expect(() => extractUses(src, 'add.build', 'command')).toThrow(/widget/);
  });

  it('L1.4 fails on a missing colon', () => {
    expect(() => extractUses('<!-- uses:\n- skill add-tdd\n-->\n', 'add.build', 'command'))
      .toThrow(/add\.build/);
  });

  it('L1.4 fails on an empty target', () => {
    expect(() => extractUses('<!-- uses:\n- skill:\n-->\n', 'add.build', 'command'))
      .toThrow(/add\.build/);
  });

  it('L1.4 never silently skips an unparseable line', () => {
    // Skipping turns a typo into a missing edge, which is invisible: the graph
    // simply under-reports and every consumer trusts it.
    const src = '<!-- uses:\n- skill: add-tdd\n- this is not an entry\n-->\n';
    // A bare .toThrow() would pass on ANY throw, including "extractUses is not
    // a function" — it cannot tell a correct rejection from a missing
    // implementation. Assert the message identifies the artefact.
    expect(() => extractUses(src, 'add.build', 'command')).toThrow(/add\.build/);
  });

  it('L1.5 parses (conditional) as the reserved modifier and other text as free-form', () => {
    const src = '<!-- uses:\n- skill: add-tdd (conditional)\n- skill: add-qa (loaded in STEP 4)\n-->\n';
    const edges = extractUses(src, 'add.build', 'command');

    expect(edges[0].modifier).toBe('conditional');
    expect(edges[1].modifier).toBe('loaded in STEP 4');
  });

  it('L1.6 fails when one artefact carries two declaration blocks', () => {
    // Ambiguity must not resolve to "first wins" silently — the second block
    // would vanish from the graph while reading as declared in the source.
    const src = '<!-- uses:\n- skill: add-tdd\n-->\n\ntext\n\n<!-- uses:\n- skill: add-qa\n-->\n';
    expect(() => extractUses(src, 'add.build', 'command')).toThrow(/two|second|multiple/i);
  });

  it('L1.7 ignores a block inside a fenced code region', () => {
    // An artefact documenting this convention shows the block as an example.
    // Treating it as a declaration would invent edges out of documentation.
    const src = [
      '# Docs',
      '',
      'Declare what you use like this:',
      '',
      '```markdown',
      '<!-- uses:',
      '- skill: add-tdd',
      '-->',
      '```',
      '',
    ].join('\n');

    expect(extractUses(src, 'add-skill-creator', 'skill')).toEqual([]);
  });

  it('L1.8 accepts blank lines and indentation inside the block', () => {
    const src = '<!-- uses:\n\n  - skill: add-tdd\n\n  - agent: qa-agent\n\n-->\n';
    const edges = extractUses(src, 'add.build', 'command');
    expect(edges.map((e) => e.to)).toEqual(['product/skill/add-tdd', 'product/agent/qa-agent']);
  });
});

// ---------------------------------------------------------------------------
// L2 — collectNodes() unit
// ---------------------------------------------------------------------------

describe('L2 collectNodes', () => {
  const map = readMap();

  it('L2.1 every node has a legal kind, a non-empty path and a legal layer', () => {
    const nodes = collectNodes(map, CODEADD);
    const KINDS = new Set(['command', 'skill', 'agent', 'reference', 'script', 'fragment']);

    expect(nodes.length).toBeGreaterThan(0);
    for (const n of nodes) {
      expect(KINDS.has(n.kind), `${n.id} has kind ${n.kind}`).toBe(true);
      expect(n.path, `${n.id} has no path`).toBeTruthy();
      expect(['product', 'internal'], `${n.id} layer`).toContain(n.layer);
      expect(n.id).toBe(`${n.layer}/${n.kind}/${n.name}`);
    }
  });

  it('L2.1 node ids are unique', () => {
    const nodes = collectNodes(map, CODEADD);
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
  });

  it('L2.1 only command, skill and agent are declaring kinds', () => {
    const nodes = collectNodes(map, CODEADD);
    const declaring = nodes.filter((n) => n.declares);
    expect(new Set(declaring.map((n) => n.kind))).toEqual(new Set(['command', 'skill', 'agent']));
  });

  it('L2.2 a directory under skills/ with no SKILL.md produces no node and no failure', () => {
    // THE load-bearing case. Node identity is SKILL.md presence, never directory
    // position. A scan keyed on position classifies eval workspaces and scratch
    // dirs as unregistered artefacts and fails the build on correct files.
    const dir = tmpDir('graph-nodes-');
    const codeadd = path.join(dir, '.codeadd');

    fs.mkdirSync(path.join(codeadd, 'skills', 'real-skill'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'skills', 'real-skill', 'SKILL.md'), '# real\n');

    fs.mkdirSync(path.join(codeadd, 'skills', 'not-a-skill', 'evals'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'skills', 'not-a-skill', 'evals', 'evals.json'), '{}\n');

    const nodes = collectNodes({ providers: {}, commands: {}, skills: {}, agents: {} }, codeadd);
    const skillIds = nodes.filter((n) => n.kind === 'skill').map((n) => n.name);

    expect(skillIds).toContain('real-skill');
    expect(skillIds).not.toContain('not-a-skill');
  });

  it('L2.2 a SKILL.md-less directory does not become an unregistered node of any kind', () => {
    // The inverse framing: it must not slip in as a `reference` node either,
    // which would make the dangling gate resolve a target that is not an artefact.
    const dir = tmpDir('graph-nodes-');
    const codeadd = path.join(dir, '.codeadd');
    fs.mkdirSync(path.join(codeadd, 'skills', 'not-a-skill'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'skills', 'not-a-skill', 'notes.md'), 'scratch\n');

    const nodes = collectNodes({ providers: {}, commands: {}, skills: {}, agents: {} }, codeadd);
    expect(nodes.filter((n) => n.name.includes('not-a-skill'))).toEqual([]);
  });

  it('L2.2 the identity rule covers COMMANDS and AGENTS, not just skills', () => {
    // The rule was first applied to skills only, via the SKILL.md check.
    // Commands and agents took every *.md, so a README documenting the agents
    // directory failed the build as an unregistered artefact — the exact
    // false-positive class the rule exists to prevent, on the kinds it missed.
    const dir = tmpDir('graph-nodes-');
    const codeadd = path.join(dir, '.codeadd');

    fs.mkdirSync(path.join(codeadd, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'commands', 'add.real.md'), '# real\n');
    fs.writeFileSync(path.join(codeadd, 'commands', 'NOTES.md'), '# scratch\n');

    fs.mkdirSync(path.join(codeadd, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'agents', 'real-agent.md'), '# real\n');
    fs.writeFileSync(path.join(codeadd, 'agents', 'README.md'), '# docs\n');
    fs.writeFileSync(path.join(codeadd, 'agents', '_draft.md'), '# wip\n');

    const names = collectNodes({ providers: {}, commands: {}, skills: {}, agents: {} }, codeadd)
      .map((n) => n.name);

    expect(names).toContain('add.real');
    expect(names).toContain('real-agent');
    expect(names).not.toContain('NOTES');
    expect(names).not.toContain('README');
    expect(names).not.toContain('_draft');
  });

  it('L2.2 the non-artefact rule matches whole names, never prefixes', () => {
    // `/^README\b/i` matches `readme-analyzer.md` — `-` is a word boundary — and
    // silently drops a REAL agent, breaking the two commands that dispatch it.
    // A guard against false positives that introduces one is worse than none.
    const dir = tmpDir('graph-nodes-');
    const codeadd = path.join(dir, '.codeadd');
    fs.mkdirSync(path.join(codeadd, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'agents', 'readme-analyzer.md'), '# real\n');
    fs.writeFileSync(path.join(codeadd, 'agents', 'notes-agent.md'), '# real\n');

    const names = collectNodes({ providers: {}, commands: {}, skills: {}, agents: {} }, codeadd)
      .map((n) => n.name);

    expect(names).toContain('readme-analyzer');
    expect(names).toContain('notes-agent');
  });

  it('L2.3 product and internal artefacts carry the right layer', () => {
    const nodes = collectNodes(map, CODEADD);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    expect(byId.get('product/command/add.review')?.layer).toBe('product');
    expect(byId.get('internal/command/add-framework--build')?.layer).toBe('internal');
    expect(byId.get('internal/skill/building-commands')?.layer).toBe('internal');
    expect(byId.get('internal/agent/readme-analyzer')?.layer).toBe('internal');
  });

  it('L2.4 registered reflects provider-map.json membership', () => {
    const nodes = collectNodes(map, CODEADD);
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // A product command is registered; an internal command is not in the
    // product registry and must not be reported as drift because of it.
    expect(byId.get('product/command/add.review')?.registered).toBe(true);
    expect(byId.get('internal/command/add-framework--build')?.registered).toBe(true);
  });

  it('L2.4 an unregistered product artefact is marked registered:false', () => {
    const dir = tmpDir('graph-nodes-');
    const codeadd = path.join(dir, '.codeadd');
    fs.mkdirSync(path.join(codeadd, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'agents', 'ghost-agent.md'), '# ghost\n');
    fs.writeFileSync(path.join(codeadd, 'agents', 'known-agent.md'), '# known\n');

    const nodes = collectNodes(
      { providers: {}, commands: {}, skills: {}, agents: { 'known-agent': {} } },
      codeadd,
    );
    const byId = new Map(nodes.map((n) => [n.id, n]));

    expect(byId.get('product/agent/ghost-agent')?.registered).toBe(false);
    expect(byId.get('product/agent/known-agent')?.registered).toBe(true);
  });

  it('L2.5 providers on a node match what the registry resolves for it', () => {
    const nodes = collectNodes(map, CODEADD);
    const cmd = nodes.find((n) => n.id === 'product/command/add.review');

    expect(cmd.providers).toEqual(Object.keys(map.providers));
  });

  it('L2.6 internal-layer artefacts are never reported as unregistered', () => {
    // provider-map.json registers the PRODUCT layer only. Marking internal
    // artefacts unregistered would fire the gate on 17 correct files.
    const nodes = collectNodes(map, CODEADD);
    const internal = nodes.filter((n) => n.layer === 'internal' && n.declares);

    expect(internal.length).toBeGreaterThan(0);
    expect(internal.every((n) => n.registered)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// L3 — guard
// ---------------------------------------------------------------------------

describe('L3 checkArtefactGraph', () => {
  /** A minimal graph: one command node plus whatever else a case needs. */
  function graphOf(nodes, edges = []) {
    return { nodes, edges };
  }

  const node = (over) => ({
    id: 'product/command/add.build',
    kind: 'command',
    layer: 'product',
    name: 'add.build',
    path: 'framwork/.codeadd/commands/add.build.md',
    registered: true,
    providers: [],
    declares: true,
    ...over,
  });

  const noSource = () => ''; // sniffing sees nothing; isolates the hard gates

  it('L3.1 a declared entry naming a nonexistent artefact FAILS, naming path and target', () => {
    const g = graphOf(
      [node()],
      [{
        from: 'product/command/add.build',
        to: 'product/skill/add-typo',
        type: 'USES_SKILL',
        origin: 'declared',
        modifier: null,
      }],
    );

    const { failures } = checkArtefactGraph(g, { readSource: noSource });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/add-typo/);
    expect(failures[0]).toMatch(/add\.build\.md/);
  });

  it('L3.2 an unregistered artefact FAILS — the readback shape', () => {
    // An agent on disk with no provider-map.json entry reads correctly, is
    // referenced in prose, and ships to nobody. Nothing catches it today.
    const g = graphOf([
      node(),
      node({
        id: 'product/agent/readback-agent',
        kind: 'agent',
        name: 'readback-agent',
        path: 'framwork/.codeadd/agents/readback-agent.md',
        registered: false,
      }),
    ]);

    const { failures } = checkArtefactGraph(g, { readSource: noSource });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/readback-agent/);
    expect(failures[0]).toMatch(/provider-map\.json/);
  });

  it('L3.3 the unregistered gate does NOT fire on a non-declaring node', () => {
    // L2.2 from the gate's side. A reference file, a script and a fragment are
    // not registry-managed; reporting them would fail the build on 105 correct
    // files. A SKILL.md-less directory produces no node at all (L2.2), so the
    // only way it could reach the gate is as some other kind.
    const g = graphOf([
      node(),
      node({
        id: 'product/reference/add-qa/references/coordinator.md',
        kind: 'reference',
        name: 'add-qa/references/coordinator.md',
        registered: false,
        declares: false,
      }),
    ]);

    expect(checkArtefactGraph(g, { readSource: noSource }).failures).toEqual([]);
  });

  it('L3.3 an internal artefact is never reported unregistered', () => {
    const g = graphOf([
      node({
        id: 'internal/command/add-framework--build',
        layer: 'internal',
        name: 'add-framework--build',
        path: '.claude/commands/add-framework--build.md',
        registered: true,
      }),
    ]);

    expect(checkArtefactGraph(g, { readSource: noSource }).failures).toEqual([]);
  });

  it('L3.4 a prose mention with no declaration FAILS', () => {
    // Hardened in wave 2, once all 97 artefacts declare and the tree is clean.
    // Shipping this in wave 1 would have blocked every build in the repo — the
    // three-level split existed precisely so it could wait for the declarations.
    const g = graphOf([
      node(),
      node({ id: 'product/skill/add-tdd', kind: 'skill', name: 'add-tdd', path: 'x/SKILL.md', declares: true }),
    ]);

    const { failures } = checkArtefactGraph(g, {
      readSource: (n) => (n.name === 'add.build' ? 'Load the add-tdd skill in STEP 3.' : ''),
    });

    expect(failures.join('\n')).toMatch(/add-tdd/);
    // The message must offer both fixes, or an author hits it and guesses.
    expect(failures.join('\n')).toMatch(/mention:/);
  });

  it('L3.5 a declaration absent from prose and unmarked WARNS as a phantom edge', () => {
    // Deliberately softer than L3.4, its inverse. "Named in prose, undeclared"
    // is mechanical to fix — the name is right there. This direction is usually
    // stale but sometimes a real, non-greppable load, and `(conditional)` has
    // no field use yet. Failing on an unproven valve trades a finding for a
    // blocked build.
    const g = graphOf(
      [
        node(),
        node({ id: 'product/skill/add-tdd', kind: 'skill', name: 'add-tdd', path: 'x/SKILL.md' }),
      ],
      [{
        from: 'product/command/add.build',
        to: 'product/skill/add-tdd',
        type: 'USES_SKILL',
        origin: 'declared',
        modifier: null,
      }],
    );

    const { failures, warnings } = checkArtefactGraph(g, { readSource: noSource });

    expect(failures).toEqual([]);
    expect(warnings.join('\n')).toMatch(/add-tdd/);
    expect(warnings.join('\n')).toMatch(/phantom edge/);
  });

  it('L3.6 (conditional) suppresses the phantom-edge warning, and nothing else does', () => {
    const mk = (modifier) => graphOf(
      [
        node(),
        node({ id: 'product/skill/add-tdd', kind: 'skill', name: 'add-tdd', path: 'x/SKILL.md' }),
      ],
      [{
        from: 'product/command/add.build',
        to: 'product/skill/add-tdd',
        type: 'USES_SKILL',
        origin: 'declared',
        modifier,
      }],
    );

    expect(checkArtefactGraph(mk('conditional'), { readSource: noSource }).warnings).toEqual([]);
    // A free-text modifier is documentation, not a waiver.
    expect(checkArtefactGraph(mk('loaded in STEP 4'), { readSource: noSource }).warnings.length)
      .toBeGreaterThan(0);
  });

  it('L3.4 a longer name is not matched inside another name', () => {
    // `/add` matches inside `/add.plan` and `add-qa` inside `add-qa-migration`
    // under a naive \b boundary. Both produced wrong counts while specifying
    // this change; a sniffer that does it fires warnings nobody can act on.
    const g = graphOf([
      node(),
      node({ id: 'product/skill/add-qa', kind: 'skill', name: 'add-qa', path: 'x/SKILL.md' }),
      node({ id: 'product/command/add', kind: 'command', name: 'add', path: 'y.md' }),
    ]);

    const { failures } = checkArtefactGraph(g, {
      readSource: (n) => (n.name === 'add.build' ? 'See add-qa-migration and /add.plan for details.' : ''),
    });

    // Assert the node IDS are absent. An earlier version matched /"add"/ —
    // the failure text carries no quotes, so it could never match whether the
    // bug existed or not, which is a dead line dressed as coverage.
    const text = failures.join('\n');
    expect(text).not.toContain('product/skill/add-qa');
    expect(text).not.toContain('product/command/add\n');
    expect(failures).toEqual([]);
  });

  it('L3.8 a command is only matched with its slash, never as a bare word', () => {
    // `add.done` carries "DO NOT USE Bash for git add/commit/push". Under a
    // bare-word match the command named `add` matches inside `git add`, and the
    // graph gains an edge invented out of an English sentence. Commands are
    // always written `/add.plan` where they are actually referenced, so the
    // slash is part of the name for sniffing purposes.
    const nodes = [
      {
        id: 'product/command/add.done', kind: 'command', layer: 'product',
        name: 'add.done', path: 'x.md', registered: true, providers: [], declares: true,
      },
      {
        id: 'product/command/add', kind: 'command', layer: 'product',
        name: 'add', path: 'y.md', registered: true, providers: [], declares: false,
      },
    ];

    const bare = checkArtefactGraph({ nodes, edges: [] }, {
      readSource: (n) => (n.name === 'add.done' ? 'DO NOT USE Bash for git add/commit/push.' : ''),
    });
    expect(bare.failures).toEqual([]);

    const slashed = checkArtefactGraph({ nodes, edges: [] }, {
      readSource: (n) => (n.name === 'add.done' ? 'Route back to /add when unsure.' : ''),
    });
    expect(slashed.failures.join('\n')).toMatch(/product\/command\/add\b/);
  });

  it('L3.7 the real tree produces no failures', () => {
    // The gate must be clean on a correct repo before it is worth anything.
    const graph = buildArtefactGraph(readMap(), CODEADD, ROOT);
    expect(checkArtefactGraph(graph).failures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// L4 — sidecar
// ---------------------------------------------------------------------------

describe('L4 artefact-graph sidecar', () => {
  const map = readMap();

  function emit() {
    const out = path.join(tmpDir('graph-out-'), 'artefact-graph.json');
    writeArtefactGraph(out, buildArtefactGraph(map, CODEADD, ROOT));
    return out;
  }

  it('L4.1 parses, carries version 1, and holds no timestamp', () => {
    const parsed = JSON.parse(fs.readFileSync(emit(), 'utf8'));

    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.nodes)).toBe(true);
    expect(Array.isArray(parsed.edges)).toBe(true);

    // A timestamp would make every rebuild a diff and defeat L4.2 — which is
    // what makes "did the graph actually change" an answerable question.
    expect(JSON.stringify(parsed)).not.toMatch(/generatedAt|timestamp|\d{4}-\d{2}-\d{2}T/);
  });

  it('L4.2 is byte-identical across two consecutive builds', () => {
    // Set and object iteration order varies more than it looks. Non-determinism
    // here stays invisible until wave 4 starts diffing graphs.
    expect(fs.readFileSync(emit())).toEqual(fs.readFileSync(emit()));
  });

  it('L4.2 ends with exactly one trailing newline, like its two sibling sidecars', () => {
    const raw = fs.readFileSync(emit(), 'utf8');
    expect(raw.endsWith('}\n')).toBe(true);
  });

  it('L4.3 emits one INJECTS_INTO edge per injection point, one per section', () => {
    // Points are passed explicitly. Reading the module-level accumulator here
    // would make the level VACUOUS in a fresh test process: it is empty until a
    // build runs, and `expect(0).toHaveLength(0)` proves nothing.
    // The two sections on one fragment must stay two edges — collapsing them
    // would lose which section landed where.
    const points = [
      { namespace: 'feature', name: 'tdd-pipeline', section: 'step-list', resource: { name: 'add.build', kind: 'command' } },
      { namespace: 'feature', name: 'tdd-pipeline', section: 'spec-audit', resource: { name: 'add.build', kind: 'command' } },
      { namespace: 'plugin', name: 'gitnexus', section: 'graph', resource: { name: 'add.plan', kind: 'command' } },
      { namespace: 'plugin', name: 'gitnexus', section: 'graph', resource: { name: 'backend-agent', kind: 'agent' } },
    ];

    const graph = buildArtefactGraph(map, CODEADD, ROOT, points);
    const injects = graph.edges.filter((e) => e.type === 'INJECTS_INTO');

    expect(injects).toHaveLength(4);
    expect(injects.every((e) => e.origin === 'sidecar')).toBe(true);
    expect(injects.map((e) => e.from)).toEqual(
      expect.arrayContaining([
        'product/fragment/fragments/tdd-pipeline/add.build.md',
        'product/fragment/plugins/gitnexus/fragments/add.plan.md',
        'product/fragment/plugins/gitnexus/fragments/agents/backend-agent.md',
      ]),
    );
  });

  it('L4.3 every INJECTS_INTO endpoint resolves to a node, against the REAL points', () => {
    // The real check: the fragment path is RECONSTRUCTED from namespace + name +
    // resource, not stored. Reconstruct it wrongly and `from` points at nothing,
    // silently. Read the points the build actually emitted.
    const sidecar = path.join(CODEADD, 'injection-points.json');
    const points = JSON.parse(fs.readFileSync(sidecar, 'utf8')).points;

    // Guard the guard: an empty sidecar would make this level vacuous too.
    expect(points.length).toBeGreaterThan(0);

    const graph = buildArtefactGraph(map, CODEADD, ROOT, points);
    const ids = new Set(graph.nodes.map((n) => n.id));
    const injects = graph.edges.filter((x) => x.type === 'INJECTS_INTO');

    expect(injects).toHaveLength(points.length);
    for (const e of injects) {
      expect(ids.has(e.from), `no node for ${e.from}`).toBe(true);
      expect(ids.has(e.to), `no node for ${e.to}`).toBe(true);
    }
  });

  it('L4.1 every declared edge endpoint that is a source resolves to a node', () => {
    const graph = buildArtefactGraph(map, CODEADD, ROOT);
    const ids = new Set(graph.nodes.map((n) => n.id));

    for (const e of graph.edges.filter((x) => x.origin === 'declared')) {
      expect(ids.has(e.from), `no node for ${e.from}`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// L5 — behavioural acceptance
// ---------------------------------------------------------------------------

describe('L5 acceptance', () => {
  it('L5.1 the readback reproduction: an unregistered agent and skill fail the build', () => {
    // THE acceptance test for wave 1, rebuilt from a real event. Commit 49422ad
    // landed readback-agent.md and add-feature-readback/ on main. They read
    // correctly, are referenced in prose, and — until a later commit registered
    // them — were built for no provider at all. Nothing in the build, the suite
    // or CI said a word.
    const codeadd = path.join(tmpDir('graph-accept-'), '.codeadd');

    fs.mkdirSync(path.join(codeadd, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'agents', 'readback-agent.md'), '# readback\n');

    fs.mkdirSync(path.join(codeadd, 'skills', 'add-feature-readback'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'skills', 'add-feature-readback', 'SKILL.md'), '# readback\n');

    // A registry that knows about neither — exactly the shape 49422ad shipped.
    const map = { providers: {}, commands: {}, skills: {}, agents: {} };
    const graph = buildArtefactGraph(map, codeadd, path.join(codeadd, 'no-internal'));
    const { failures } = checkArtefactGraph(graph);

    expect(failures).toHaveLength(2);

    const joined = failures.join('\n');
    expect(joined).toMatch(/readback-agent/);
    expect(joined).toMatch(/add-feature-readback/);
    // The message has to say what is wrong and what to do, or the gate costs
    // more than it saves.
    expect(joined).toMatch(/never built for any provider/);
    expect(joined).toMatch(/provider-map\.json/);
  });

  it('L5.1 registering them clears the failure', () => {
    // The other half: the gate must be satisfiable by the obvious fix, or it is
    // just an obstacle.
    const codeadd = path.join(tmpDir('graph-accept-'), '.codeadd');

    fs.mkdirSync(path.join(codeadd, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(codeadd, 'agents', 'readback-agent.md'), '# readback\n');

    const map = { providers: {}, commands: {}, skills: {}, agents: { 'readback-agent': {} } };
    const graph = buildArtefactGraph(map, codeadd, path.join(codeadd, 'no-internal'));

    expect(checkArtefactGraph(graph).failures).toEqual([]);
  });

});

// ---------------------------------------------------------------------------
// Snapshot tripwire — ONE place, deliberately
// ---------------------------------------------------------------------------

describe('node inventory snapshot', () => {
  it('matches the 2026-09-06 snapshot', () => {
    // A moved count is FINE when it is intended — a new command, a deleted
    // skill. Update the numbers here and say so in the commit. This lives in
    // exactly one test on purpose: counts duplicated across assertions produce a
    // scatter of failures for one correct change, which is how a suite teaches
    // people to ignore it.
    const nodes = collectNodes(readMap(), CODEADD);
    const byKind = {};
    for (const n of nodes) byKind[n.kind] = (byKind[n.kind] || 0) + 1;

    expect(byKind).toEqual({
      // command 25 -> 23: add-framework--self-plan and add-framework--self-build
      // were absorbed into add-framework--plan and add-framework--build, which
      // now carry a per-F-block layer tag instead of one layer each. The two
      // shared- commands were renamed, which moves no count.
      command: 23,
      // skill 44 -> 48: add-build-ledger, add-plan-authoring,
      // add-framework-product-layer and add-framework-internal-layer, extracted
      // from the four commands above so a build loads only the layer it is in.
      skill: 48,
      agent: 28,
      // reference 69 -> 70: add-plan-authoring/references/plan-template.md.
      reference: 70,
      script: 18,
      fragment: 24,
    });
    // 208 -> 211: +4 skills, +1 reference, -2 commands.
    // declares 97 -> 99: the four new skills all carry a `<!-- uses: -->` block,
    // the two deleted commands carried one each.
    // (plan 2026-09-08T210322-SELF-PLAN--unify-dev-commands, F2-F13.)
    expect(nodes).toHaveLength(211);
    expect(nodes.filter((n) => n.declares)).toHaveLength(99);
  });
});

/**
 * The one row of the close-out's RED matrix a machine can check.
 *
 * The other fifteen describe runtime behaviour of an LLM-driven markdown
 * command — it stops, it writes nothing, it asks before deleting — which no
 * unit test can assert. This one is a string, and it guards the hazard the
 * design named specifically: `test:package` exists ONLY in cli/package.json,
 * so the bare form fails with "Missing script", which is a FALSE gate and
 * worse than a failing one.
 */
describe('/add-framework--done — the CI gate it reproduces', () => {
  // One source, not two: the root .opencode/ adapter tree was deleted with the
  // command merge (plan 2026-09-08T210322-SELF-PLAN--unify-dev-commands, F1).
  // The internal layer has no provider mirror, so .claude/ is the only copy.
  const sources = [
    path.join(ROOT, '.claude', 'commands', 'add-framework--done.md'),
  ];

  for (const file of sources) {
    const label = path.relative(ROOT, file).split(path.sep).join('/');

    it(`${label} runs test:package through --prefix cli`, () => {
      const src = fs.readFileSync(file, 'utf8');

      expect(src).toContain('npm --prefix cli run test:package');
      // A bare `npm run test:package` anywhere in the file would be the false
      // gate, whatever else the file also says.
      expect(src).not.toMatch(/(?<!--prefix cli )\bnpm run test:package\b/);
    });

    it(`${label} carries all four CI commands`, () => {
      const src = fs.readFileSync(file, 'utf8');

      for (const cmd of ['node scripts/build.js', 'npm test', 'npm run test:scripts']) {
        expect(src, `${label} is missing the ${cmd} gate`).toContain(cmd);
      }
    });
  }
});
