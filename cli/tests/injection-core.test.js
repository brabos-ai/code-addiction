import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseFragmentSections,
  findAnchorLine,
  insertBlockAfterAnchor,
  removeBlockAfterAnchor,
  resolveResourceFiles,
  readManifest,
  saveManifest,
  calculateHash,
  recalculateHashes,
  composeSlot,
  renderSlotRegion,
  renderSlots,
  captureBaselines,
  renderInstalledResource,
  reconcileSlots,
} from '../src/injection-core.js';

// ---------------------------------------------------------------------------
// parseFragmentSections
// ---------------------------------------------------------------------------

describe('parseFragmentSections', () => {
  it('parses a single section (content ends with newline)', () => {
    expect(parseFragmentSections('<!-- section:a -->\nbody\n<!-- /section:a -->').get('a')).toBe('body\n');
  });

  it('parses multiple sections preserving order', () => {
    const frag = '<!-- section:a -->\nA\n<!-- /section:a -->\n<!-- section:b -->\nB\n<!-- /section:b -->';
    const sections = parseFragmentSections(frag);
    expect([...sections.keys()]).toEqual(['a', 'b']);
  });

  it('returns empty map when no sections', () => {
    expect(parseFragmentSections('no markers here').size).toBe(0);
  });

  it('parses sections when the fragment uses CRLF line endings', () => {
    const frag = '<!-- section:a -->\r\nbody\r\n<!-- /section:a -->';
    expect(parseFragmentSections(frag).get('a')).toBe('body\r\n');
  });

  it('rejects malformed section markers even when another section could be parsed', () => {
    const valid = '<!-- section:step-list -->\nSTEP tdd-pipeline.test-spec: Test\n<!-- /section:step-list -->';
    expect(() => parseFragmentSections(`${valid}\n<!-- /section:extra -->`)).toThrow(/malformed/i);
    expect(() => parseFragmentSections(`${valid}\n<!-- section:unclosed -->`)).toThrow(/malformed/i);
  });
});

// ---------------------------------------------------------------------------
// findAnchorLine
// ---------------------------------------------------------------------------

describe('findAnchorLine', () => {
  const lines = ['# Title', '```', 'a', '```', 'b', '```', 'tail'];

  it('finds the first occurrence (ordinal 1)', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 1, position: 'after' })).toBe(1);
  });

  it('finds the 3rd occurrence of a non-unique line', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 3, position: 'after' })).toBe(5);
  });

  it('matches on trimmed content (ignores surrounding whitespace)', () => {
    expect(findAnchorLine(['  spaced  ', 'x'], { text: 'spaced', ordinal: 1, position: 'after' })).toBe(0);
  });

  it('returns -1 when the ordinal exceeds occurrences', () => {
    expect(findAnchorLine(lines, { text: '```', ordinal: 9, position: 'after' })).toBe(-1);
  });

  it('returns -1 when the text is absent', () => {
    expect(findAnchorLine(lines, { text: 'nope', ordinal: 1, position: 'after' })).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// insertBlockAfterAnchor
// ---------------------------------------------------------------------------

describe('insertBlockAfterAnchor', () => {
  const anchor = { text: 'Anchor.', ordinal: 1, position: 'after', next: 'After.' };
  const base = 'Top.\nAnchor.\nAfter.\n';

  it('inserts the block immediately after the anchor line', () => {
    const out = insertBlockAfterAnchor(base, anchor, 'INJECTED\n');
    expect(out).toBe('Top.\nAnchor.\nINJECTED\nAfter.\n');
  });

  it('is idempotent — inserting an already-present block returns content unchanged', () => {
    const once = insertBlockAfterAnchor(base, anchor, 'INJECTED\n');
    const twice = insertBlockAfterAnchor(once, anchor, 'INJECTED\n');
    expect(twice).toBe(once);
  });

  it('returns null when the anchor is not found (fail-loud miss)', () => {
    expect(insertBlockAfterAnchor('No anchor here.\n', anchor, 'X\n')).toBeNull();
  });

  it('returns null when the next-line hint drifted (recorded next line gone entirely)', () => {
    const drifted = 'Top.\nAnchor.\nDIFFERENT.\n';
    expect(insertBlockAfterAnchor(drifted, anchor, 'X\n')).toBeNull();
  });

  it('inserts a second block at a SHARED anchor after a sibling block (no false drift)', () => {
    // Two different features/plugins resolve to the same anchor on the same file
    // and inject in separate calls. The first sits between the anchor and `next`;
    // the second must NOT be mistaken for prose drift and dropped.
    const featA = insertBlockAfterAnchor(base, anchor, 'FEAT_A\n');
    const featB = insertBlockAfterAnchor(featA, anchor, 'FEAT_B\n');
    expect(featB).not.toBeNull();
    expect(featB).toContain('FEAT_A');
    expect(featB).toContain('FEAT_B');
    // Both blocks removable independently → byte-identical restore regardless of order.
    const r1 = removeBlockAfterAnchor(featB, anchor, 'FEAT_B\n');
    const r2 = removeBlockAfterAnchor(r1, anchor, 'FEAT_A\n');
    expect(r2).toBe(base);
  });

  it('inserts a multi-line block and resolves the Nth-occurrence anchor', () => {
    const content = '```\na\n```\nAnchor.\nAfter.\n';
    const a = { text: '```', ordinal: 2, position: 'after', next: 'Anchor.' };
    expect(insertBlockAfterAnchor(content, a, 'L1\nL2\n')).toBe('```\na\n```\nL1\nL2\nAnchor.\nAfter.\n');
  });

  it('skips the drift check when no next hint is recorded (end-of-file marker)', () => {
    const eof = 'Top.\nAnchor.\n';
    const a = { text: 'Anchor.', ordinal: 1, position: 'after', next: null };
    expect(insertBlockAfterAnchor(eof, a, 'X\n')).toBe('Top.\nAnchor.\nX\n');
  });

  it('writes no HTML markers (marker-free injection)', () => {
    expect(insertBlockAfterAnchor(base, anchor, 'INJECTED\n')).not.toContain('<!--');
  });

  it('position "before" inserts above the anchor line', () => {
    const a = { text: 'Below.', ordinal: 1, position: 'before', next: null };
    expect(insertBlockAfterAnchor('Top.\nBelow.\n', a, 'X\n')).toBe('Top.\nX\nBelow.\n');
  });
});

// ---------------------------------------------------------------------------
// removeBlockAfterAnchor (round-trip)
// ---------------------------------------------------------------------------

describe('removeBlockAfterAnchor', () => {
  const anchor = { text: 'Anchor.', ordinal: 1, position: 'after', next: 'After.' };

  it('enable → disable is byte-identical', () => {
    const before = 'Top.\nAnchor.\nAfter.\n';
    const injected = insertBlockAfterAnchor(before, anchor, 'A\nB\n');
    expect(removeBlockAfterAnchor(injected, anchor, 'A\nB\n')).toBe(before);
  });

  it('leaves content unchanged when the block is absent', () => {
    const content = 'Top.\nAnchor.\nAfter.\n';
    expect(removeBlockAfterAnchor(content, anchor, 'NOT THERE\n')).toBe(content);
  });

  it('removes the right block when another block sits between anchor and it (interleaving)', () => {
    // anchor → [otherBlock, ourBlock]; removing ours must leave otherBlock intact
    const content = 'Anchor.\nOTHER\nOURS\nAfter.\n';
    expect(removeBlockAfterAnchor(content, anchor, 'OURS\n')).toBe('Anchor.\nOTHER\nAfter.\n');
  });
});

// ---------------------------------------------------------------------------
// resolveResourceFiles (sidecar resource → per-provider installed paths)
// ---------------------------------------------------------------------------

describe('resolveResourceFiles', () => {
  let cwd;
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-res-'));
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  });
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

  function manifest(providers) {
    fs.writeFileSync(path.join(cwd, '.codeadd', 'manifest.json'), JSON.stringify({ version: '1', providers }));
  }
  function touch(rel) {
    const f = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, 'x');
  }

  it('resolves a command to every installed provider that has a commandsSubdir', () => {
    manifest(['claude', 'cursor', 'codex']); // codex has no commandsSubdir
    touch('.claude/commands/add-new.md');
    touch('.cursor/commands/add-new.md');
    const files = resolveResourceFiles(cwd, { name: 'add-new', kind: 'command' });
    expect(files.sort()).toEqual([
      path.join(cwd, '.claude', 'commands', 'add-new.md'),
      path.join(cwd, '.cursor', 'commands', 'add-new.md'),
    ].sort());
  });

  it('resolves an agent only to providers with an agentsSubdir (claude)', () => {
    manifest(['claude', 'cursor']); // only claude has agentsSubdir
    touch('.claude/agents/backend-agent.md');
    const files = resolveResourceFiles(cwd, { name: 'backend-agent', kind: 'agent' });
    expect(files).toEqual([path.join(cwd, '.claude', 'agents', 'backend-agent.md')]);
  });

  it('omits paths whose file does not exist', () => {
    manifest(['claude']);
    expect(resolveResourceFiles(cwd, { name: 'ghost', kind: 'command' })).toEqual([]);
  });

  it('resolves under the global dest when manifest.scope is global', () => {
    // OpenCode: project dest .opencode, global dest .config/opencode.
    fs.writeFileSync(
      path.join(cwd, '.codeadd', 'manifest.json'),
      JSON.stringify({ version: '1', providers: ['opencode'], scope: 'global' }),
    );
    touch('.config/opencode/commands/add-new.md');
    const files = resolveResourceFiles(cwd, { name: 'add-new', kind: 'command' });
    expect(files).toEqual([path.join(cwd, '.config', 'opencode', 'commands', 'add-new.md')]);
  });
});

// ---------------------------------------------------------------------------
// manifest / hash IO
// ---------------------------------------------------------------------------

describe('manifest + hash IO', () => {
  let cwd;
  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-core-'));
    fs.mkdirSync(path.join(cwd, '.codeadd'), { recursive: true });
  });
  afterEach(() => fs.rmSync(cwd, { recursive: true, force: true }));

  it('readManifest returns null when missing', () => {
    expect(readManifest(cwd)).toBeNull();
  });

  it('readManifest returns null on invalid JSON', () => {
    fs.writeFileSync(path.join(cwd, '.codeadd', 'manifest.json'), '{ not json');
    expect(readManifest(cwd)).toBeNull();
  });

  it('saveManifest then readManifest round-trips', () => {
    saveManifest(cwd, { version: '1.0.0', plugins: { x: { enabled: true } } });
    expect(readManifest(cwd)).toEqual({ version: '1.0.0', plugins: { x: { enabled: true } } });
  });

  it('calculateHash returns null for missing file', () => {
    expect(calculateHash(path.join(cwd, 'nope.txt'))).toBeNull();
  });

  it('calculateHash returns a 64-char sha256 hex', () => {
    const f = path.join(cwd, 'a.txt');
    fs.writeFileSync(f, 'content');
    expect(calculateHash(f)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('recalculateHashes records relative paths', () => {
    const f = path.join(cwd, '.claude', 'commands', 'add-new.md');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, 'x');
    const manifest = {};
    recalculateHashes(cwd, manifest, [f]);
    expect(manifest.hashes['.claude/commands/add-new.md']).toMatch(/^[a-f0-9]{64}$/);
  });
});

const FALLBACK = 'No optional test-spec or QA-spec step is available. Continue with STEP add-plan.consolidate.';

describe('slot render', () => {
  const anchor = { text: 'Before', ordinal: 1, position: 'after', next: 'After' };
  const baseline = 'Before\n\nAfter\n';

  it('empty fallback removes the pristine gap and adds no blank line', () => {
    expect(renderSlotRegion(baseline, anchor, '')).toBe('Before\nAfter\n');
  });

  it('nonempty fallback replaces the gap with the approved line', () => {
    expect(renderSlotRegion(baseline, anchor, FALLBACK)).toBe(`Before\n${FALLBACK}\nAfter\n`);
  });

  it('a contributing member suppresses the fallback', () => {
    const slot = {
      id: 'plan-specs',
      resource: { name: 'add-plan', kind: 'command' },
      fallback: FALLBACK,
      members: [{ namespace: 'feature', name: 'tdd-pipeline', section: 'step-list' }],
      anchor,
    };
    const composed = composeSlot(slot, [{ contribute: true, text: 'STEP tdd-pipeline.test-spec: Generate contract test cases\n' }]);
    expect(composed.usedFallback).toBe(false);
    const rendered = renderSlots(baseline, [{ ...slot, text: composed.text }]);
    expect(rendered.content).toBe('Before\nSTEP tdd-pipeline.test-spec: Generate contract test cases\nAfter\n');
    expect(rendered.content).not.toContain(FALLBACK);
  });

  it('a warned member with no sibling uses the fallback and keeps the warning', () => {
    const slot = {
      id: 'plan-specs',
      resource: { name: 'add-plan', kind: 'command' },
      fallback: FALLBACK,
      members: [{ namespace: 'feature', name: 'qa-pipeline', section: 'step-list' }],
    };
    const composed = composeSlot(slot, [{ contribute: false, warning: 'section missing' }]);
    expect(composed.usedFallback).toBe(true);
    expect(composed.warnings).toEqual([
      { resource: 'add-plan', slot: 'plan-specs', member: 'feature:qa-pipeline:step-list', reason: 'section missing' },
    ]);
  });

  it('a missing baseline leaves the installed file intact', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-base-'));
    const file = path.join(dir, '.claude', 'commands', 'add-plan.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'installed\n');
    fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify({ providers: ['claude'], scope: 'project' }));
    const result = renderInstalledResource(
      dir,
      { name: 'add-plan', kind: 'command' },
      [{ id: 'plan-specs', resource: { name: 'add-plan', kind: 'command' }, fallback: FALLBACK, members: [], anchor, memberStates: [] }],
      'claude',
    );
    expect(result.written).toBe(false);
    expect(result.warnings[0].reason).toBe('missing baseline');
    expect(fs.readFileSync(file, 'utf8')).toBe('installed\n');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('v1 sidecar capture is a no-op', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-v1-'));
    fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 1, points: [] }));
    fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify({ providers: ['claude'] }));
    expect(captureBaselines(dir)).toEqual({ captured: [], pruned: [], warnings: [] });
    expect(fs.existsSync(path.join(dir, '.codeadd', 'baselines'))).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('reconcile renders tdd before qa from the baseline, and a missing section warns without clearing the flag', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-rec-'));
    const file = path.join(dir, '.claude', 'commands', 'add-plan.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const pristine = 'Before\n\nAfter\n';
    fs.writeFileSync(file, pristine);
    fs.mkdirSync(path.join(dir, '.codeadd', 'baselines', 'claude', 'commands'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'baselines', 'claude', 'commands', 'add-plan.md'), pristine);
    fs.mkdirSync(path.join(dir, '.codeadd', 'fragments', 'tdd-pipeline'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.codeadd', 'fragments', 'tdd-pipeline', 'add-plan.md'),
      '<!-- section:step-list -->\nSTEP tdd-pipeline.test-spec: Generate contract test cases\n<!-- /section:step-list -->\n',
    );
    const slot = {
      id: 'plan-specs',
      resource: { name: 'add-plan', kind: 'command' },
      fallback: FALLBACK,
      members: [
        { namespace: 'feature', name: 'tdd-pipeline', section: 'step-list' },
        { namespace: 'feature', name: 'qa-pipeline', section: 'step-list' },
      ],
      anchor: { text: 'Before', ordinal: 1, position: 'after', next: 'After' },
    };
    fs.writeFileSync(path.join(dir, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 2, slots: [slot] }));
    fs.writeFileSync(
      path.join(dir, '.codeadd', 'manifest.json'),
      JSON.stringify({ providers: ['claude'], scope: 'project', features: { 'tdd-pipeline': true, 'qa-pipeline': true }, plugins: {}, hashes: {} }),
    );
    const result = reconcileSlots(dir);
    expect(fs.readFileSync(file, 'utf8')).toBe('Before\nSTEP tdd-pipeline.test-spec: Generate contract test cases\nAfter\n');
    expect(result.warnings).toEqual([
      { resource: 'add-plan', slot: 'plan-specs', member: 'feature:qa-pipeline:step-list', reason: 'file missing' },
    ]);
    expect(JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8')).features['qa-pipeline']).toBe(true);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('a disabled feature contributes nothing and warns nothing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-off-'));
    const file = path.join(dir, '.claude', 'commands', 'add-plan.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const pristine = 'Before\n\nAfter\n';
    fs.writeFileSync(file, pristine);
    fs.mkdirSync(path.join(dir, '.codeadd', 'baselines', 'claude', 'commands'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'baselines', 'claude', 'commands', 'add-plan.md'), pristine);
    const slot = {
      id: 'plan-specs',
      resource: { name: 'add-plan', kind: 'command' },
      fallback: '',
      members: [{ namespace: 'feature', name: 'qa-pipeline', section: 'step-list' }],
      anchor: { text: 'Before', ordinal: 1, position: 'after', next: 'After' },
    };
    fs.writeFileSync(path.join(dir, '.codeadd', 'injection-points.json'), JSON.stringify({ version: 2, slots: [slot] }));
    fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify({
      providers: ['claude'], scope: 'project', features: { 'qa-pipeline': false }, plugins: {}, hashes: {},
    }));
    const result = reconcileSlots(dir);
    expect(fs.readFileSync(file, 'utf8')).toBe('Before\nAfter\n');
    expect(result.warnings).toEqual([]);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('no sidecar is a different failure from a warned member', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'slot-none-'));
    fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify({
      providers: ['claude'], features: { 'qa-pipeline': true },
    }));
    expect(reconcileSlots(dir)).toBeNull();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
