import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PROVIDERS } from '../src/providers.js';
import { TOTAL_POINTS, agentModePoints } from './helpers/agent-mode-points.js';

const require = createRequire(import.meta.url);
const {
  extractSlots,
  collectInjectionPoints,
  _resetInjectionPoints,
  writeInjectionPoints,
} = require('../../scripts/build.js');

// ---------------------------------------------------------------------------
// collector + sidecar emit
// ---------------------------------------------------------------------------

describe('injection-points collector + emit', () => {
  beforeEach(() => _resetInjectionPoints());
  afterEach(() => _resetInjectionPoints());

  it('accumulates slotted resources and refuses a legacy marker', () => {
    const slot = (ns, name, section) => [
      'anchor',
      `<!-- slot:${name}-${section} fallback="fallbacks/empty.md" -->`,
      `<!-- ${ns}:${name}:${section} -->`,
      `<!-- /${ns}:${name}:${section} -->`,
      `<!-- /slot:${name}-${section} -->`,
    ].join('\n');
    collectInjectionPoints(slot('feature', 'tdd', 'gate'), 'add-build', 'command');
    collectInjectionPoints(slot('plugin', 'gitnexus', 'graph'), 'backend-agent', 'agent');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slots-'));
    writeInjectionPoints(path.join(dir, 'injection-points.json'));
    const data = JSON.parse(fs.readFileSync(path.join(dir, 'injection-points.json'), 'utf8'));
    expect(data.version).toBe(2);
    expect(data.slots).toHaveLength(2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('collecting content without markers adds nothing', () => {
    collectInjectionPoints('# no markers here', 'add.x', 'command');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slots-none-'));
    writeInjectionPoints(path.join(dir, 'injection-points.json'));
    const data = JSON.parse(fs.readFileSync(path.join(dir, 'injection-points.json'), 'utf8'));
    expect(data.slots).toEqual([]);
    expect(data.points).toEqual([]);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writeInjectionPoints emits v2 when no slot was collected', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slots-empty-'));
    writeInjectionPoints(path.join(dir, 'injection-points.json'));
    const data = JSON.parse(fs.readFileSync(path.join(dir, 'injection-points.json'), 'utf8'));
    expect(data.version).toBe(2);
    expect(data.slots).toEqual([]);
    expect(data.points).toEqual([]);
    expect(JSON.stringify(data)).not.toContain('"version":1');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writeInjectionPoints refuses a legacy marker source', () => {
    expect(() => collectInjectionPoints(
      'anchor\n<!-- feature:tdd:gate -->\n<!-- /feature:tdd:gate -->',
      'add-build',
      'command',
    )).toThrow(/Legacy injection markers/);
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
  it('freezes the slot membership map and its nonempty fallbacks', () => {
    // 71 memberships in 64 slots before agent-mode; every agent-mode slot holds exactly one member (F10-F21).
    expect(MAP.membershipCount).toBe(TOTAL_POINTS());
    expect(MAP.slotCount).toBe(64 + agentModePoints());
    const members = MAP.resources.flatMap((r) => r.slots.flatMap((s) => s.sourceOrder));
    expect(members).toHaveLength(TOTAL_POINTS());
    // Nonempty fallbacks: plan-specs, plus every agent-mode.* slot (plan 2026-10-09T184411-PLAN--agent-mode-feature, F24).
    const slotsOf = (r) => r.slots.filter((s) => s.fallback !== 'fallbacks/empty.md');
    const agentModeSlots = MAP.resources.flatMap((r) => slotsOf(r).filter((s) => s.id.startsWith('agent-mode.')));
    for (const s of agentModeSlots) expect(s.fallback).toMatch(/^fallbacks\/agent-mode\.[A-Za-z0-9._-]+\.md$/);
    const nonempty = MAP.resources.flatMap((r) => slotsOf(r).filter((s) => !s.id.startsWith('agent-mode.')));
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

  it('commands, fragments, agents and plugins have no numeric STEP references', () => {
    const root = productSourceRoot();
    const hits = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith('.md')) {
          fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
            if (/\bSTEP \d/.test(line)) hits.push(`${path.relative(path.resolve(import.meta.dirname, '..', '..'), p)}:${i + 1}`);
          });
        }
      }
    }
    for (const d of ['commands', 'fragments', 'agents', 'plugins']) walk(path.join(root, d));
    expect(hits).toEqual([]);
  });

  it('live step citations use an id, not a bare number', () => {
    const root = productSourceRoot();
    const re = /\bSTEP \d+\b|\b(?:by|to|from) \d+\.\d+\b|preview \(\d+\.\d+/;
    const hits = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith('.md')) {
          let fence = false;
          fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
            if (line.startsWith('```')) fence = !fence;
            if (!fence && re.test(line)) hits.push(`${path.relative(root, p)}:${i + 1}`);
          });
        }
      }
    }
    walk(path.join(root, 'commands'));
    walk(path.join(root, 'fragments'));
    expect(hits).toEqual([]);
  });

  it('numeric substep headings are gone, and overview STEP ids resolve', () => {
    const root = productSourceRoot();
    const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
    const numeric = [];
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name !== 'skills') walk(p);
        } else if (ent.name.endsWith('.md')) {
          fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
            if (/^#{2,4} \d/.test(line)) numeric.push(`${path.relative(root, p)}:${i + 1}`);
          });
        }
      }
    }
    walk(path.join(root, 'commands'));
    walk(path.join(root, 'fragments'));
    expect(numeric).toEqual([]);

    const commands = fs.readdirSync(path.join(root, 'commands')).filter((f) => f.endsWith('.md'));
    for (const file of commands) {
      const text = read(path.join('commands', file));
      const start = text.indexOf('STEPS IN ORDER');
      if (start < 0) continue;
      const block = text.slice(start, start + 2500);
      const listed = [...block.matchAll(/^STEP ([a-z0-9.-]+):/gm)].map((m) => m[1]);
      const name = file.replace(/\.md$/, '');
      const extra = fs.existsSync(path.join(root, 'fragments'))
        ? fs.readdirSync(path.join(root, 'fragments'), { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => path.join(root, 'fragments', d.name, file))
          .filter((p) => fs.existsSync(p))
          .map((p) => fs.readFileSync(p, 'utf8'))
          .join('\n')
        : '';
      const headings = new Set([...`${text}\n${extra}`.matchAll(/^#{2,4} STEP ([a-z0-9.-]+)/gm)].map((m) => m[1]));
      for (const id of listed) {
        expect(headings.has(id), `${name} overview ${id} has no heading`).toBe(true);
      }
      expect(new Set(listed).size, `${name} overview ids repeat`).toBe(listed.length);
    }
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

  it('rejects text and unrelated comments inside a slot instead of shipping them in the baseline', () => {
    const slot = (extra) => [
      'Before',
      '<!-- slot:spec fallback="fallbacks/empty.md" -->',
      '<!-- feature:tdd-pipeline:step-list -->',
      '<!-- /feature:tdd-pipeline:step-list -->',
      extra,
      '<!-- /slot:spec -->',
      'After',
    ].join('\n');
    for (const extra of ['BAD', '<!-- source note -->']) {
      expect(() => extractSlots(slot(extra), 'add-plan', 'command', () => '')).toThrow(/slot spec.*only member markers/i);
    }
  });

  it('each assembled command has distinct step heading IDs, including substeps', () => {
    const root = productSourceRoot();
    const duplicates = [];
    for (const file of fs.readdirSync(path.join(root, 'commands')).filter((name) => name.endsWith('.md'))) {
      const bodies = [fs.readFileSync(path.join(root, 'commands', file), 'utf8')];
      for (const dir of ['fragments', 'plugins']) {
        const parent = path.join(root, dir);
        const walk = (p) => {
          for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
            const full = path.join(p, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name === file) bodies.push(fs.readFileSync(full, 'utf8'));
          }
        };
        walk(parent);
      }
      const headings = [...bodies.join('\n').matchAll(/^#{2,4} STEP ([a-z0-9.-]+)\b/gm)].map((match) => match[1]);
      if (new Set(headings).size !== headings.length) {
        duplicates.push(`${file}: ${headings.filter((id, i) => headings.indexOf(id) !== i).join(', ')}`);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('add-plan step-list source order is tdd then qa', () => {
    const slot = MAP.resources.find((r) => r.resource === 'command/add-plan').slots.find((s) => s.id === 'plan-specs');
    const derived = deriveSlots().find((r) => r.resource === 'command/add-plan').slots[0];
    expect(derived).toEqual(slot.expectedOrder);
  });
});
