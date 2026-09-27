import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PROVIDERS } from '../src/providers.js';

const require = createRequire(import.meta.url);
const {
  extractInjectionPoints,
  extractSlots,
  collectInjectionPoints,
  getInjectionPoints,
  _resetInjectionPoints,
  writeInjectionPoints,
} = require('../../scripts/build.js');

// ---------------------------------------------------------------------------
// extractInjectionPoints — pure marker → content-anchor parser
// ---------------------------------------------------------------------------

describe('extractInjectionPoints', () => {
  it('returns [] for content with no injection markers', () => {
    expect(extractInjectionPoints('# Title\n\nbody\n', 'add.x', 'command')).toEqual([]);
  });

  it('anchors a single marker to the nearest non-blank line above', () => {
    const src = ['# Title', '', 'Anchor line.', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->', '', 'After.'].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({
      namespace: 'feature',
      name: 'tdd',
      section: 'gate',
      resource: { name: 'add-build', kind: 'command' },
    });
    expect(pts[0].anchor).toMatchObject({ text: 'Anchor line.', ordinal: 1, position: 'after', next: 'After.' });
  });

  it('ignores closing markers (one point per open marker)', () => {
    const src = ['prose', '<!-- plugin:gx:graph -->', '<!-- /plugin:gx:graph -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add-new', 'command');
    expect(pts).toHaveLength(1);
    expect(pts[0].section).toBe('graph');
  });

  it('computes ordinal as the occurrence index of a non-unique anchor line', () => {
    const src = ['```', 'a', '```', 'b', '```', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    // the anchor "```" is the 3rd occurrence in the surviving body
    expect(pts[0].anchor).toMatchObject({ text: '```', ordinal: 3, position: 'after' });
  });

  it('handles clustered/adjacent markers sharing one anchor (same text+ordinal, distinct sections, source order)', () => {
    const src = [
      '5. final flow step.',
      '```',
      '',
      '<!-- feature:tdd:tasks-flow -->',
      '<!-- /feature:tdd:tasks-flow -->',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
      '',
      '**Next prose.**',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    expect(pts.map((p) => p.section)).toEqual(['tasks-flow', 'gate']);
    expect(pts[0].anchor).toEqual(pts[1].anchor); // identical anchor → grouped at enable time
    expect(pts[0].anchor).toMatchObject({ text: '```', ordinal: 1, position: 'after', next: '**Next prose.**' });
  });

  it('skips blank lines and stripped comments when choosing the anchor', () => {
    const src = [
      'Real anchor.',
      '',
      '<!-- a dev note comment -->',
      '',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    expect(pts[0].anchor.text).toBe('Real anchor.');
  });

  it('skips a multi-line dev-note comment when choosing the anchor', () => {
    const src = [
      'Real anchor.',
      '<!-- multi',
      'line',
      'note -->',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    expect(pts[0].anchor.text).toBe('Real anchor.');
  });

  it('marks next as null when the marker is at end of file (agent body)', () => {
    const src = ['---', 'name: backend-agent', '---', '', 'Agent body.', '<!-- plugin:gitnexus:graph -->', '<!-- /plugin:gitnexus:graph -->', ''].join('\n');
    const pts = extractInjectionPoints(src, 'backend-agent', 'agent');
    expect(pts[0]).toMatchObject({ namespace: 'plugin', name: 'gitnexus', section: 'graph', resource: { name: 'backend-agent', kind: 'agent' } });
    expect(pts[0].anchor).toMatchObject({ text: 'Agent body.', position: 'after' });
    expect(pts[0].anchor.next).toBeNull();
  });

  it('ignores a marker embedded in prose (documentation), only standalone markers count', () => {
    const src = [
      'Real anchor.',
      '| When applicable | enabled (see `<!-- feature:tdd:gate -->` markers) |',
      'more prose',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    // Only the standalone marker is an injection point (the inline one is documentation).
    expect(pts).toHaveLength(1);
    expect(pts[0].anchor.text).toBe('more prose');
  });

  it('parses dotted plugin/feature names', () => {
    const src = ['anchor', '<!-- plugin:add-new:explore -->', '<!-- /plugin:add-new:explore -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add.x', 'command');
    expect(pts[0]).toMatchObject({ namespace: 'plugin', name: 'add-new', section: 'explore' });
  });

  it('walks up past a variable line to the nearest variable-free anchor (next disabled)', () => {
    const src = [
      'Stable prose anchor.',
      'See `{{skill:add--investigation/SKILL.md}}` section X.',
      '<!-- plugin:gitnexus:graph-trace -->',
      '<!-- /plugin:gitnexus:graph-trace -->',
      '',
      'Following prose.',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-diagnose', 'command');
    expect(pts[0].anchor.text).toBe('Stable prose anchor.');
    expect(pts[0].anchor.position).toBe('after');
    expect(pts[0].anchor.next).toBeNull(); // skipped variable line → no drift hint
  });

  it('drops the next hint when the line directly below the marker carries a variable', () => {
    const src = ['Anchor.', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->', 'Use {{cmd:add-plan}} here.'].join('\n');
    const pts = extractInjectionPoints(src, 'c', 'command');
    expect(pts[0].anchor).toMatchObject({ text: 'Anchor.', position: 'after', next: null });
  });

  it('FAILS the build when no variable-free line is adjacent to the marker', () => {
    const src = ['See {{cmd:add-plan}} now', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    expect(() => extractInjectionPoints(src, 'add-build', 'command')).toThrow(/anchor/i);
  });

  it('FAILS the build for {{skill:}} and {{addpath:}} anchor variables too', () => {
    const skillSrc = ['Read {{skill:add-foo/SKILL.md}}', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    const pathSrc = ['Write {{addpath:manifest.json}}', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    expect(() => extractInjectionPoints(skillSrc, 'c', 'command')).toThrow(/anchor/i);
    expect(() => extractInjectionPoints(pathSrc, 'c', 'command')).toThrow(/anchor/i);
  });

  it('FAILS the build when a standalone feature pair has non-empty content', () => {
    const src = [
      'Anchor line.',
      '<!-- feature:tdd:step9 -->',
      '## STEP 9: baked leftover',
      '<!-- /feature:tdd:step9 -->',
    ].join('\n');
    expect(() => extractInjectionPoints(src, 'add-plan.md', 'command')).toThrow(/add-plan\.md:2/);
    expect(() => extractInjectionPoints(src, 'add-plan.md', 'command')).toThrow(/feature:tdd:step9/);
  });

  it('FAILS the build when a standalone plugin pair has non-empty content', () => {
    const src = [
      'Anchor line.',
      '<!-- plugin:gitnexus:graph -->',
      'leftover',
      '<!-- /plugin:gitnexus:graph -->',
    ].join('\n');
    expect(() => extractInjectionPoints(src, 'backend-agent.md', 'agent')).toThrow(/backend-agent\.md:2/);
    expect(() => extractInjectionPoints(src, 'backend-agent.md', 'agent')).toThrow(/plugin:gitnexus:graph/);
  });

  it('FAILS the build when a standalone open marker has no close', () => {
    const src = ['Anchor line.', '<!-- feature:tdd:gate -->', 'more prose'].join('\n');
    expect(() => extractInjectionPoints(src, 'add-build.md', 'command')).toThrow(/add-build\.md:2/);
    expect(() => extractInjectionPoints(src, 'add-build.md', 'command')).toThrow(/feature:tdd:gate/);
    expect(() => extractInjectionPoints(src, 'add-build.md', 'command')).toThrow(/unbalanced/i);
  });

  it('ignores non-empty content inside a prose-embedded (non-standalone) marker pair', () => {
    const src = [
      'Real anchor.',
      'See `<!-- feature:tdd:gate --> leftover <!-- /feature:tdd:gate -->` in docs.',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add-build', 'command');
    expect(pts).toHaveLength(1);
    expect(pts[0].section).toBe('gate');
  });
});

// ---------------------------------------------------------------------------
// collector + sidecar emit
// ---------------------------------------------------------------------------

describe('injection-points collector + emit', () => {
  beforeEach(() => _resetInjectionPoints());
  afterEach(() => _resetInjectionPoints());

  it('accumulates across multiple collect calls', () => {
    collectInjectionPoints('anchor\n<!-- feature:tdd:gate -->\n<!-- /feature:tdd:gate -->', 'add-build', 'command');
    collectInjectionPoints('anchor\n<!-- plugin:gitnexus:graph -->\n<!-- /plugin:gitnexus:graph -->', 'backend-agent', 'agent');
    expect(getInjectionPoints()).toHaveLength(2);
  });

  it('collecting content without markers adds nothing', () => {
    collectInjectionPoints('# no markers here', 'add.x', 'command');
    expect(getInjectionPoints()).toHaveLength(0);
  });

  it('writeInjectionPoints emits a versioned, deterministic sidecar sorted by (kind, name)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sidecar-'));
    try {
      collectInjectionPoints('anchor\n<!-- plugin:gitnexus:graph -->\n<!-- /plugin:gitnexus:graph -->', 'reviewer-agent', 'agent');
      collectInjectionPoints('anchor\n<!-- feature:tdd:gate -->\n<!-- /feature:tdd:gate -->', 'add-build', 'command');
      const out = path.join(dir, 'injection-points.json');
      writeInjectionPoints(out);
      const data = JSON.parse(fs.readFileSync(out, 'utf8'));
      expect(data.version).toBe(1);
      // kind ascending: "agent" < "command", so reviewer-agent precedes add-build
      expect(data.points.map((p) => p.resource.name)).toEqual(['reviewer-agent', 'add-build']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

const MAP = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'slot-membership-map-v2.json'), 'utf8'));
const OPEN_RE = /^<!-- (feature|plugin):([^:]+):([^\s]+) -->\s*$/;
const CLOSE_RE = /^<!-- \/(feature|plugin):([^:]+):([^\s]+) -->\s*$/;
const STEP_RE = /\bSTEP\s+\d+(?:\.\d+)?\b|^\s*[-*]\s+\d+(?:\.\d+)?:/;

function productSourceRoot() {
  return path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd');
}

function deriveSlots() {
  const root = productSourceRoot();
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.md') && (p.includes(`${path.sep}commands${path.sep}`) || p.includes(`${path.sep}agents${path.sep}`))) files.push(p);
    }
  }
  walk(root);
  const resources = [];
  for (const file of files.sort()) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const markers = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(OPEN_RE);
      if (!m) continue;
      let close = -1;
      for (let j = i + 1; j < lines.length; j++) {
        const c = lines[j].match(CLOSE_RE);
        if (c && c[1] === m[1] && c[2] === m[2] && c[3] === m[3]) { close = j; break; }
        if (OPEN_RE.test(lines[j])) break;
      }
      markers.push({ line: i + 1, close, namespace: m[1], name: m[2], section: m[3] });
    }
    if (!markers.length) continue;
    const rel = path.relative(path.resolve(import.meta.dirname, '..', '..'), file).split(path.sep).join('/');
    const kind = rel.includes('/agents/') ? 'agent' : 'command';
    const name = path.basename(file, '.md').replace(/-agent$/, '');
    const slots = [];
    let cur = null;
    for (const mk of markers) {
      const gap = cur ? lines.slice(cur.lastClose + 1, mk.line - 1).join('\n') : '';
      if (!(cur && gap.trim() === '')) {
        cur = { members: [], lastClose: mk.close };
        slots.push(cur);
      }
      cur.members.push({ namespace: mk.namespace, name: mk.name, section: mk.section });
      cur.lastClose = mk.close;
    }
    resources.push({
      resource: `${kind}/${name}`,
      file: rel,
      slots: slots.map((s) => s.members),
    });
  }
  return resources;
}

function stepRefFiles() {
  const root = productSourceRoot();
  const found = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith('.md')) {
        const hit = fs.readFileSync(p, 'utf8').split(/\r?\n/).some((line) => STEP_RE.test(line));
        if (hit) {
          found.push(path.relative(path.resolve(import.meta.dirname, '..', '..'), p).split(path.sep).join('/'));
        }
      }
    }
  }
  for (const d of ['commands', 'agents', 'skills', 'fragments', 'plugins']) walk(path.join(root, d));
  return found.sort();
}

describe('slot membership map v2', () => {
  it('freezes 70 memberships in 63 slots, one nonempty fallback', () => {
    expect(MAP.membershipCount).toBe(70);
    expect(MAP.slotCount).toBe(63);
    const members = MAP.resources.flatMap((r) => r.slots.flatMap((s) => s.sourceOrder));
    expect(members).toHaveLength(70);
    const nonempty = MAP.resources.flatMap((r) => r.slots.filter((s) => s.fallback !== 'fallbacks/empty.md'));
    expect(nonempty).toEqual([
      expect.objectContaining({
        id: 'plan-specs',
        fallback: 'fallbacks/plan-specs.md',
        expectedOrder: [
          { namespace: 'feature', name: 'tdd-pipeline', section: 'step-list' },
          { namespace: 'feature', name: 'qa-pipeline', section: 'step-list' },
        ],
      }),
    ]);
    expect(MAP.fallbacks.nonempty.bytes).toBe(
      'No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.',
    );
  });

  it('current source grouping matches the frozen source order', () => {
    const derived = deriveSlots();
    const frozen = MAP.resources.map((r) => ({
      resource: r.resource,
      file: r.file,
      slots: r.slots.map((s) => s.expectedOrder),
    }));
    expect(derived).toEqual(frozen);
  });

  it('provider targets match the installer flags, not every provider key', () => {
    const command = Object.entries(PROVIDERS).filter(([, p]) => p.commandsSubdir).map(([k]) => k);
    const agentInjection = Object.entries(PROVIDERS).filter(([, p]) => p.agentInjection && p.agentsSubdir).map(([k]) => k);
    expect(MAP.providers.command).toEqual(command);
    expect(MAP.providers.agentInjection).toEqual(agentInjection);
  });

  it('every incoming fragment file has a frozen depth-1 dependency list', () => {
    const root = productSourceRoot();
    const paths = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith('.md') && !p.includes(`${path.sep}skills${path.sep}`)) paths.push(path.relative(path.resolve(import.meta.dirname, '..', '..'), p).split(path.sep).join('/'));
      }
    }
    walk(path.join(root, 'fragments'));
    walk(path.join(root, 'plugins'));
    const frozen = MAP.fragments.map((f) => f.id.replace(/^product\/fragment\//, 'framwork/.codeadd/')).sort();
    expect(frozen).toEqual(paths.filter((p) => p.includes('/fragments/')).sort());
    for (const f of MAP.fragments) expect(Array.isArray(f.dependencies)).toBe(true);
  });

  it('active numeric STEP reference files match the frozen inventory', () => {
    expect(stepRefFiles()).toEqual(MAP.activeStepRefFiles.map((e) => e.file).sort());
  });

  it('extractSlots reads fallback bytes and keeps member order', () => {
    const src = [
      'Before',
      '<!-- slot:plan-specs fallback="fallbacks/plan-specs.md" -->',
      '<!-- feature:tdd-pipeline:step-list -->',
      '<!-- /feature:tdd-pipeline:step-list -->',
      '<!-- feature:qa-pipeline:step-list -->',
      '<!-- /feature:qa-pipeline:step-list -->',
      '<!-- /slot:plan-specs -->',
      'After',
    ].join('\n');
    const files = {
      'fallbacks/plan-specs.md': 'No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.',
      'fallbacks/empty.md': '',
    };
    const slots = extractSlots(src, 'add-plan', 'command', (rel) => {
      if (!(rel in files)) throw new Error(`absent ${rel}`);
      return files[rel];
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].fallback).toBe(files['fallbacks/plan-specs.md']);
    expect(slots[0].members.map((m) => m.name)).toEqual(['tdd-pipeline', 'qa-pipeline']);
    expect(slots[0].anchor).toMatchObject({ text: 'Before', next: 'After', position: 'after' });
  });

  it('extractSlots rejects a mixed marker outside a slot', () => {
    const src = [
      'Before',
      '<!-- slot:a fallback="fallbacks/empty.md" -->',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
      '<!-- /slot:a -->',
      '<!-- feature:board:ticket-read -->',
      '<!-- /feature:board:ticket-read -->',
    ].join('\n');
    expect(() => extractSlots(src, 'add-plan', 'command', () => '')).toThrow(/Mixed injection source/);
  });

  it('add-plan step-list source order is tdd then qa', () => {
    const slot = MAP.resources.find((r) => r.resource === 'command/add-plan').slots.find((s) => s.id === 'plan-specs');
    const derived = deriveSlots().find((r) => r.resource === 'command/add-plan').slots[0];
    expect(derived).toEqual(slot.expectedOrder);
  });
});
