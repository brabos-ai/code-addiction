import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const {
  extractInjectionPoints,
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
    const pts = extractInjectionPoints(src, 'add.build', 'command');
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({
      namespace: 'feature',
      name: 'tdd',
      section: 'gate',
      resource: { name: 'add.build', kind: 'command' },
    });
    expect(pts[0].anchor).toMatchObject({ text: 'Anchor line.', ordinal: 1, position: 'after', next: 'After.' });
  });

  it('ignores closing markers (one point per open marker)', () => {
    const src = ['prose', '<!-- plugin:gx:graph -->', '<!-- /plugin:gx:graph -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add.new', 'command');
    expect(pts).toHaveLength(1);
    expect(pts[0].section).toBe('graph');
  });

  it('computes ordinal as the occurrence index of a non-unique anchor line', () => {
    const src = ['```', 'a', '```', 'b', '```', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add.build', 'command');
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
    const pts = extractInjectionPoints(src, 'add.build', 'command');
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
    const pts = extractInjectionPoints(src, 'add.build', 'command');
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
    const pts = extractInjectionPoints(src, 'add.build', 'command');
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
    const pts = extractInjectionPoints(src, 'add.build', 'command');
    // Only the standalone marker is an injection point (the inline one is documentation).
    expect(pts).toHaveLength(1);
    expect(pts[0].anchor.text).toBe('more prose');
  });

  it('parses dotted plugin/feature names', () => {
    const src = ['anchor', '<!-- plugin:add.new:explore -->', '<!-- /plugin:add.new:explore -->'].join('\n');
    const pts = extractInjectionPoints(src, 'add.x', 'command');
    expect(pts[0]).toMatchObject({ namespace: 'plugin', name: 'add.new', section: 'explore' });
  });

  it('walks up past a variable line to the nearest variable-free anchor (next disabled)', () => {
    const src = [
      'Stable prose anchor.',
      'See `{{skill:add-investigation/SKILL.md}}` section X.',
      '<!-- plugin:gitnexus:graph-trace -->',
      '<!-- /plugin:gitnexus:graph-trace -->',
      '',
      'Following prose.',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add.diagnose', 'command');
    expect(pts[0].anchor.text).toBe('Stable prose anchor.');
    expect(pts[0].anchor.position).toBe('after');
    expect(pts[0].anchor.next).toBeNull(); // skipped variable line → no drift hint
  });

  it('drops the next hint when the line directly below the marker carries a variable', () => {
    const src = ['Anchor.', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->', 'Use {{cmd:add.plan}} here.'].join('\n');
    const pts = extractInjectionPoints(src, 'c', 'command');
    expect(pts[0].anchor).toMatchObject({ text: 'Anchor.', position: 'after', next: null });
  });

  it('FAILS the build when no variable-free line is adjacent to the marker', () => {
    const src = ['See {{cmd:add.plan}} now', '<!-- feature:tdd:gate -->', '<!-- /feature:tdd:gate -->'].join('\n');
    expect(() => extractInjectionPoints(src, 'add.build', 'command')).toThrow(/anchor/i);
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
    expect(() => extractInjectionPoints(src, 'add.plan.md', 'command')).toThrow(/add\.plan\.md:2/);
    expect(() => extractInjectionPoints(src, 'add.plan.md', 'command')).toThrow(/feature:tdd:step9/);
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
    expect(() => extractInjectionPoints(src, 'add.build.md', 'command')).toThrow(/add\.build\.md:2/);
    expect(() => extractInjectionPoints(src, 'add.build.md', 'command')).toThrow(/feature:tdd:gate/);
    expect(() => extractInjectionPoints(src, 'add.build.md', 'command')).toThrow(/unbalanced/i);
  });

  it('ignores non-empty content inside a prose-embedded (non-standalone) marker pair', () => {
    const src = [
      'Real anchor.',
      'See `<!-- feature:tdd:gate --> leftover <!-- /feature:tdd:gate -->` in docs.',
      '<!-- feature:tdd:gate -->',
      '<!-- /feature:tdd:gate -->',
    ].join('\n');
    const pts = extractInjectionPoints(src, 'add.build', 'command');
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
    collectInjectionPoints('anchor\n<!-- feature:tdd:gate -->\n<!-- /feature:tdd:gate -->', 'add.build', 'command');
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
      collectInjectionPoints('anchor\n<!-- feature:tdd:gate -->\n<!-- /feature:tdd:gate -->', 'add.build', 'command');
      const out = path.join(dir, 'injection-points.json');
      writeInjectionPoints(out);
      const data = JSON.parse(fs.readFileSync(out, 'utf8'));
      expect(data.version).toBe(1);
      // kind ascending: "agent" < "command", so reviewer-agent precedes add.build
      expect(data.points.map((p) => p.resource.name)).toEqual(['reviewer-agent', 'add.build']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
