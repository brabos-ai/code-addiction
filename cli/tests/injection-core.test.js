import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  escapeRegex,
  parseFragmentSections,
  injectSections,
  removeSections,
  readManifest,
  saveManifest,
  calculateHash,
  recalculateHashes,
} from '../src/injection-core.js';

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b*c+')).toBe('a\\.b\\*c\\+');
  });

  it('escapes dots in plugin/feature names', () => {
    expect(escapeRegex('add.new')).toBe('add\\.new');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeRegex('plain')).toBe('plain');
  });
});

// ---------------------------------------------------------------------------
// parseFragmentSections
// ---------------------------------------------------------------------------

describe('parseFragmentSections', () => {
  it('parses a single section', () => {
    const sections = parseFragmentSections('<!-- section:a -->\nbody\n<!-- /section:a -->');
    expect(sections.get('a')).toBe('body\n');
  });

  it('parses multiple sections', () => {
    const frag = '<!-- section:a -->\nA\n<!-- /section:a -->\n<!-- section:b -->\nB\n<!-- /section:b -->';
    const sections = parseFragmentSections(frag);
    expect([...sections.keys()]).toEqual(['a', 'b']);
    expect(sections.get('b')).toBe('B\n');
  });

  it('returns empty map when no sections', () => {
    expect(parseFragmentSections('no markers here').size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// injectSections
// ---------------------------------------------------------------------------

describe('injectSections', () => {
  const sections = new Map([['explore', 'INJECTED\n']]);

  it('injects into matching namespaced markers', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\n<!-- /plugin:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).toContain('INJECTED');
    expect(out).toContain('<!-- plugin:gitnexus:explore -->');
    expect(out).toContain('<!-- /plugin:gitnexus:explore -->');
  });

  it('uses the namespace argument (feature vs plugin are distinct)', () => {
    const cmd = '<!-- feature:gitnexus:explore -->\n<!-- /feature:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).not.toContain('INJECTED'); // wrong namespace → no injection
  });

  it('replaces previously injected content (idempotent re-enable)', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\nOLD\n<!-- /plugin:gitnexus:explore -->';
    const out = injectSections(cmd, 'plugin', 'gitnexus', sections);
    expect(out).toContain('INJECTED');
    expect(out).not.toContain('OLD');
  });

  it('escapes dotted names in markers', () => {
    const cmd = '<!-- plugin:add.new:explore -->\n<!-- /plugin:add.new:explore -->';
    const out = injectSections(cmd, 'plugin', 'add.new', sections);
    expect(out).toContain('INJECTED');
  });
});

// ---------------------------------------------------------------------------
// removeSections
// ---------------------------------------------------------------------------

describe('removeSections', () => {
  it('removes injected content but keeps markers', () => {
    const cmd = '<!-- plugin:gitnexus:explore -->\nINJECTED\n<!-- /plugin:gitnexus:explore -->';
    const out = removeSections(cmd, 'plugin', 'gitnexus');
    expect(out).not.toContain('INJECTED');
    expect(out).toContain('<!-- plugin:gitnexus:explore -->');
    expect(out).toContain('<!-- /plugin:gitnexus:explore -->');
  });

  it('only removes the matching namespace', () => {
    const cmd = '<!-- feature:tdd:gate -->\nKEEP\n<!-- /feature:tdd:gate -->';
    const out = removeSections(cmd, 'plugin', 'tdd');
    expect(out).toContain('KEEP'); // feature namespace untouched by plugin removal
  });

  it('removes multiple sections of the same plugin', () => {
    const cmd =
      '<!-- plugin:g:a -->\nAA\n<!-- /plugin:g:a -->\n<!-- plugin:g:b -->\nBB\n<!-- /plugin:g:b -->';
    const out = removeSections(cmd, 'plugin', 'g');
    expect(out).not.toContain('AA');
    expect(out).not.toContain('BB');
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

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

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
    const f = path.join(cwd, '.claude', 'commands', 'add.new.md');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, 'x');
    const manifest = {};
    recalculateHashes(cwd, manifest, [f]);
    expect(manifest.hashes['.claude/commands/add.new.md']).toMatch(/^[a-f0-9]{64}$/);
  });
});
