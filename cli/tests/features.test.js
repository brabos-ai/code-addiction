import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const mockPromptFeatures = vi.hoisted(() => vi.fn());

vi.mock('../src/prompt.js', () => ({
  promptFeatures: mockPromptFeatures,
}));

vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    intro: vi.fn(),
    outro: vi.fn(),
    log: { success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  };
});

import {
  FEATURES,
  enableFeature,
  disableFeature,
  applyEnabledFeatures,
  getFeatureStates,
  features,
  resolveFeatureName,
  normalizeFeatureStates,
} from '../src/features.js';
import { log } from '@clack/prompts';

let tmpDir;

function writeManifest(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data, null, 2), 'utf8');
}

function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.codeadd', 'manifest.json'), 'utf8'));
}

const anchorText = (cmd, section) => `<<${cmd}:${section}>>`;

/**
 * Write a marker-free command file with one anchor line per section.
 */
function setupCommand(dir, commandDir, commandName, sections) {
  const cmdDir = path.join(dir, commandDir);
  fs.mkdirSync(cmdDir, { recursive: true });
  let content = `# Test Command\n\n`;
  for (const section of sections) {
    content += `${anchorText(commandName, section)}\n\n`;
  }
  content += `## End\n`;
  const filePath = path.join(cmdDir, `${commandName}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function setupFragment(dir, featureName, commandName, sections) {
  const fragDir = path.join(dir, '.codeadd', 'fragments', featureName);
  fs.mkdirSync(fragDir, { recursive: true });
  let content = '';
  for (const [name, body] of Object.entries(sections)) {
    content += `<!-- section:${name} -->\n${body}\n<!-- /section:${name} -->\n\n`;
  }
  fs.writeFileSync(path.join(fragDir, `${commandName}.md`), content, 'utf8');
}

/**
 * Append injection points to the sidecar (anchor per section, end-of-block → next null).
 */
function addSidecar(dir, featureName, commandName, sections) {
  const p = path.join(dir, '.codeadd', 'injection-points.json');
  const existing = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { version: 1, points: [] };
  for (const section of sections) {
    existing.points.push({
      namespace: 'feature',
      name: featureName,
      section,
      resource: { name: commandName, kind: 'command' },
      anchor: { text: anchorText(commandName, section), ordinal: 1, position: 'after', next: null },
    });
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(existing, null, 2), 'utf8');
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-features-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('FEATURES registry', () => {
  it('defines tdd-pipeline feature', () => {
    expect(FEATURES['tdd-pipeline']).toBeDefined();
    expect(FEATURES['tdd-pipeline'].commands).toContain('add.plan');
    expect(FEATURES['tdd-pipeline'].commands).toContain('add.build');
    expect(FEATURES['tdd-pipeline'].commands).toContain('add.review');
  });

  it('tdd-pipeline defaults to true and carries the retired tdd alias', () => {
    expect(FEATURES['tdd-pipeline'].default).toBe(true);
    expect(FEATURES['tdd-pipeline'].aliases).toEqual(['tdd']);
    expect(FEATURES.tdd).toBeUndefined();
  });

  it('defines qa-pipeline feature with the tdd-pipeline shape', () => {
    expect(FEATURES['qa-pipeline']).toBeDefined();
    expect(FEATURES['qa-pipeline'].default).toBe(false);
    expect(FEATURES['qa-pipeline'].commands).toEqual(['add.plan', 'add.build']);
    expect(FEATURES['qa-pipeline']).not.toHaveProperty('providers');
  });

  // F4: the key doubles as the fragment directory name (getFragments), so a
  // mismatch is a silent no-op today. A test, not a build gate — build.js has
  // no CLI-registry import and adding one is more coupling than this is worth.
  it('every registry key has a matching fragment directory in the source tree', () => {
    const fragmentsRoot = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd', 'fragments');
    for (const key of Object.keys(FEATURES)) {
      expect(fs.existsSync(path.join(fragmentsRoot, key)), `fragments/${key}/ missing`).toBe(true);
    }
  });
});

/**
 * L2 — the rename migration red-green. These are the levels that make the
 * `tdd` → `tdd-pipeline` rename safe rather than silently destructive.
 */
describe('legacy tdd alias resolution', () => {
  function fixture(dir) {
    setupCommand(dir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(dir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(dir, 'tdd-pipeline', 'add.build', ['gate']);
  }

  it('L2.1 an explicitly disabled legacy key stays disabled (never falls back to default)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false }, providers: ['claude'] });
    fixture(tmpDir);

    applyEnabledFeatures(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).not.toContain('TDD GATE content');
  });

  it('L2.2 the legacy key is normalised away even when the feature resolves disabled', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false }, providers: ['claude'] });
    fixture(tmpDir);

    applyEnabledFeatures(tmpDir);

    const manifest = readManifest(tmpDir);
    expect(manifest.features['tdd-pipeline']).toBe(false);
    expect(manifest.features).not.toHaveProperty('tdd');
  });

  it('L2.3 an enabled legacy key resolves enabled and normalises to the canonical key', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    fixture(tmpDir);

    applyEnabledFeatures(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).toContain('TDD GATE content');

    const manifest = readManifest(tmpDir);
    expect(manifest.features['tdd-pipeline']).toBe(true);
    expect(manifest.features).not.toHaveProperty('tdd');
  });

  it('L2.4 `features disable tdd` succeeds, acts on the canonical key and warns', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    fixture(tmpDir);

    await features(tmpDir, ['disable', 'tdd']);

    const manifest = readManifest(tmpDir);
    expect(manifest.features['tdd-pipeline']).toBe(false);
    expect(manifest.features).not.toHaveProperty('tdd');
    expect(log.warn).toHaveBeenCalledWith(expect.stringMatching(/deprecated/i));
  });

  it('L2.4 `features enable tdd` is honoured rather than rejected', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    fixture(tmpDir);

    await features(tmpDir, ['enable', 'tdd']);

    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(true);
  });

  it('L2.5 getFeatureStates reports the legacy key still present in the manifest', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false }, providers: ['claude'] });

    const row = getFeatureStates(tmpDir).find((f) => f.name === 'tdd-pipeline');
    expect(row.enabled).toBe(false);
    expect(row.legacyKey).toBe('tdd');
  });

  it('an unknown feature name is still rejected', () => {
    expect(resolveFeatureName('not-a-feature')).toBeNull();
    expect(resolveFeatureName('tdd')).toEqual({ key: 'tdd-pipeline', alias: 'tdd' });
    expect(resolveFeatureName('tdd-pipeline')).toEqual({ key: 'tdd-pipeline', alias: null });
  });

  it('normalizeFeatureStates prefers an existing canonical key over the alias', () => {
    const { states, changed } = normalizeFeatureStates({ tdd: true, 'tdd-pipeline': false });
    expect(changed).toBe(true);
    expect(states).toEqual({ 'tdd-pipeline': false });
  });

  it('normalizeFeatureStates is a no-op when no alias is present', () => {
    const { states, changed } = normalizeFeatureStates({ 'tdd-pipeline': true });
    expect(changed).toBe(false);
    expect(states).toEqual({ 'tdd-pipeline': true });
  });
});

describe('enableFeature', () => {
  it('injects fragment content at the sidecar anchor (marker-free)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.plan', ['step9', 'step-list']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.plan', {
      step9: '## STEP 9: Test-Spec Subagent',
      'step-list': 'STEP 9:  Test-Spec subagent',
    });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.plan', ['step9', 'step-list']);

    const result = enableFeature(tmpDir, 'tdd-pipeline');

    expect(result.modified).toBe(1);
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.plan.md'), 'utf8');
    expect(content).toContain('## STEP 9: Test-Spec Subagent');
    expect(content).toContain('STEP 9:  Test-Spec subagent');
    expect(content).not.toContain('<!--'); // no markers written
  });

  it('sets manifest.features to true', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd-pipeline');
    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(true);
  });

  it('recalculates hashes for modified files', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, hashes: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd-pipeline');
    const manifest = readManifest(tmpDir);
    const hashKey = Object.keys(manifest.hashes).find((k) => k.includes('add.build'));
    expect(manifest.hashes[hashKey]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('injects into multiple provider directories', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude', 'cursor'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupCommand(tmpDir, '.cursor/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE injected' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    const result = enableFeature(tmpDir, 'tdd-pipeline');

    expect(result.modified).toBe(2);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE injected');
    expect(fs.readFileSync(path.join(tmpDir, '.cursor', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE injected');
  });

  it('returns 0 modified when no sidecar points match', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupFragment(tmpDir, 'tdd-pipeline', 'add.plan', { step9: 'content' });
    // no sidecar entries → nothing to inject
    const result = enableFeature(tmpDir, 'tdd-pipeline');
    expect(result.modified).toBe(0);
  });

  it('is idempotent — enabling twice produces the same file', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd-pipeline');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    enableFeature(tmpDir, 'tdd-pipeline');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content1).toBe(content2);
  });
});

describe('disableFeature', () => {
  it('removes injected content (marker-free)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content here' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);
    enableFeature(tmpDir, 'tdd-pipeline');

    const result = disableFeature(tmpDir, 'tdd-pipeline');

    expect(result.modified).toBe(1);
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).not.toContain('TDD GATE content here');
  });

  it('sets manifest.features to false', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    disableFeature(tmpDir, 'tdd-pipeline');
    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(false);
  });

  it('handles multiple sections in one file', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate', 'awareness']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'GATE content', awareness: 'AWARENESS content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate', 'awareness']);
    enableFeature(tmpDir, 'tdd-pipeline');

    disableFeature(tmpDir, 'tdd-pipeline');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).not.toContain('GATE content');
    expect(content).not.toContain('AWARENESS content');
  });

  it('is idempotent — disabling an already-disabled feature is a no-op', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    disableFeature(tmpDir, 'tdd-pipeline');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    disableFeature(tmpDir, 'tdd-pipeline');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content1).toBe(content2);
  });
});

describe('enable then disable roundtrip', () => {
  it('returns command to original state after enable→disable (byte-identical)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    const cmdPath = setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate', 'awareness']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content', awareness: 'TDD AWARENESS content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate', 'awareness']);

    const originalContent = fs.readFileSync(cmdPath, 'utf8');

    enableFeature(tmpDir, 'tdd-pipeline');
    expect(fs.readFileSync(cmdPath, 'utf8')).toContain('TDD GATE content');

    disableFeature(tmpDir, 'tdd-pipeline');
    expect(fs.readFileSync(cmdPath, 'utf8')).toBe(originalContent);
  });
});

describe('applyEnabledFeatures', () => {
  it('applies all default-enabled features', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD injected' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    const total = applyEnabledFeatures(tmpDir);

    expect(total).toBeGreaterThanOrEqual(1);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD injected');
  });

  it('skips disabled features', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD should not appear' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    applyEnabledFeatures(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).not.toContain('TDD should not appear');
  });

  it('uses defaults when manifest has no features field', () => {
    writeManifest(tmpDir, { version: '1.0.0', providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'Default TDD' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    applyEnabledFeatures(tmpDir);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('Default TDD');
  });

  it('returns undefined when no manifest exists', () => {
    expect(applyEnabledFeatures(tmpDir)).toBeUndefined();
  });
});

describe('getFeatureStates', () => {
  it('returns all features with their states', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true } });
    const states = getFeatureStates(tmpDir);
    expect(states).toHaveLength(Object.keys(FEATURES).length);
    expect(states.find((s) => s.name === 'tdd-pipeline').enabled).toBe(true);
  });

  it('uses defaults when no features in manifest', () => {
    writeManifest(tmpDir, { version: '1.0.0' });
    expect(getFeatureStates(tmpDir).find((s) => s.name === 'tdd-pipeline').enabled).toBe(FEATURES['tdd-pipeline'].default);
  });

  it('uses defaults when no manifest exists', () => {
    for (const state of getFeatureStates(tmpDir)) {
      expect(state.enabled).toBe(FEATURES[state.name].default);
    }
  });

  it('includes description for each feature', () => {
    writeManifest(tmpDir, { version: '1.0.0' });
    for (const state of getFeatureStates(tmpDir)) {
      expect(state.description).toBe(FEATURES[state.name].description);
    }
  });
});

describe('features() CLI interactive mode', () => {
  beforeEach(() => {
    mockPromptFeatures.mockReset();
  });

  it('enables a previously disabled feature when user selects it', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    mockPromptFeatures.mockResolvedValue(['tdd-pipeline']);
    await features(tmpDir, []);

    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE content');
  });

  it('disables a previously enabled feature when user deselects it', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);
    enableFeature(tmpDir, 'tdd-pipeline');

    mockPromptFeatures.mockResolvedValue([]);
    await features(tmpDir, []);

    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(false);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).not.toContain('TDD content');
  });

  it('makes no changes when selection matches current state', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    mockPromptFeatures.mockResolvedValue(['tdd-pipeline']);
    await features(tmpDir, []);

    const manifest = readManifest(tmpDir);
    expect(manifest.features['tdd-pipeline']).toBe(true);
  });

  it('passes currently enabled features as initialValues to prompt', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true } });
    mockPromptFeatures.mockResolvedValue(['tdd-pipeline']);
    await features(tmpDir, []);
    expect(mockPromptFeatures).toHaveBeenCalledWith(['tdd-pipeline']);
  });

  it('still supports enable subcommand with args', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    await features(tmpDir, ['enable', 'tdd-pipeline']);
    expect(mockPromptFeatures).not.toHaveBeenCalled();
    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(true);
  });

  it('still supports disable subcommand with args', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { 'tdd-pipeline': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd-pipeline', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd-pipeline', 'add.build', ['gate']);

    await features(tmpDir, ['disable', 'tdd-pipeline']);
    expect(mockPromptFeatures).not.toHaveBeenCalled();
    expect(readManifest(tmpDir).features['tdd-pipeline']).toBe(false);
  });
});
