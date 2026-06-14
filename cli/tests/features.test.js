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
} from '../src/features.js';

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
  it('defines tdd feature', () => {
    expect(FEATURES.tdd).toBeDefined();
    expect(FEATURES.tdd.commands).toContain('add.plan');
    expect(FEATURES.tdd.commands).toContain('add.build');
    expect(FEATURES.tdd.commands).toContain('add.review');
  });

  it('defines startup-test feature', () => {
    expect(FEATURES['startup-test']).toBeDefined();
    expect(FEATURES['startup-test'].commands).toContain('add.build');
    expect(FEATURES['startup-test'].commands).toContain('add.review');
  });

  it('both features default to true', () => {
    expect(FEATURES.tdd.default).toBe(true);
    expect(FEATURES['startup-test'].default).toBe(true);
  });
});

describe('enableFeature', () => {
  it('injects fragment content at the sidecar anchor (marker-free)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.plan', ['step9', 'step-list']);
    setupFragment(tmpDir, 'tdd', 'add.plan', {
      step9: '## STEP 9: Test-Spec Subagent',
      'step-list': 'STEP 9:  Test-Spec subagent',
    });
    addSidecar(tmpDir, 'tdd', 'add.plan', ['step9', 'step-list']);

    const result = enableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(1);
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.plan.md'), 'utf8');
    expect(content).toContain('## STEP 9: Test-Spec Subagent');
    expect(content).toContain('STEP 9:  Test-Spec subagent');
    expect(content).not.toContain('<!--'); // no markers written
  });

  it('sets manifest.features to true', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd');
    expect(readManifest(tmpDir).features.tdd).toBe(true);
  });

  it('recalculates hashes for modified files', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, hashes: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd');
    const manifest = readManifest(tmpDir);
    const hashKey = Object.keys(manifest.hashes).find((k) => k.includes('add.build'));
    expect(manifest.hashes[hashKey]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('injects into multiple provider directories', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude', 'cursor'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupCommand(tmpDir, '.cursor/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE injected' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    const result = enableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(2);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE injected');
    expect(fs.readFileSync(path.join(tmpDir, '.cursor', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE injected');
  });

  it('returns 0 modified when no sidecar points match', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupFragment(tmpDir, 'tdd', 'add.plan', { step9: 'content' });
    // no sidecar entries → nothing to inject
    const result = enableFeature(tmpDir, 'tdd');
    expect(result.modified).toBe(0);
  });

  it('is idempotent — enabling twice produces the same file', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    enableFeature(tmpDir, 'tdd');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    enableFeature(tmpDir, 'tdd');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content1).toBe(content2);
  });
});

describe('disableFeature', () => {
  it('removes injected content (marker-free)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content here' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);
    enableFeature(tmpDir, 'tdd');

    const result = disableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(1);
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).not.toContain('TDD GATE content here');
  });

  it('sets manifest.features to false', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    disableFeature(tmpDir, 'tdd');
    expect(readManifest(tmpDir).features.tdd).toBe(false);
  });

  it('handles multiple sections in one file', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate', 'awareness']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'GATE content', awareness: 'AWARENESS content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate', 'awareness']);
    enableFeature(tmpDir, 'tdd');

    disableFeature(tmpDir, 'tdd');
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).not.toContain('GATE content');
    expect(content).not.toContain('AWARENESS content');
  });

  it('is idempotent — disabling an already-disabled feature is a no-op', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    disableFeature(tmpDir, 'tdd');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    disableFeature(tmpDir, 'tdd');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content1).toBe(content2);
  });
});

describe('enable then disable roundtrip', () => {
  it('returns command to original state after enable→disable (byte-identical)', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    const cmdPath = setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate', 'awareness']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content', awareness: 'TDD AWARENESS content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate', 'awareness']);

    const originalContent = fs.readFileSync(cmdPath, 'utf8');

    enableFeature(tmpDir, 'tdd');
    expect(fs.readFileSync(cmdPath, 'utf8')).toContain('TDD GATE content');

    disableFeature(tmpDir, 'tdd');
    expect(fs.readFileSync(cmdPath, 'utf8')).toBe(originalContent);
  });
});

describe('applyEnabledFeatures', () => {
  it('applies all default-enabled features', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupCommand(tmpDir, '.claude/commands', 'add.review', ['step']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD injected' });
    setupFragment(tmpDir, 'startup-test', 'add.review', { step: 'Startup Test injected' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);
    addSidecar(tmpDir, 'startup-test', 'add.review', ['step']);

    const total = applyEnabledFeatures(tmpDir);

    expect(total).toBeGreaterThanOrEqual(2);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD injected');
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.review.md'), 'utf8')).toContain('Startup Test injected');
  });

  it('skips disabled features', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false, 'startup-test': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupCommand(tmpDir, '.claude/commands', 'add.review', ['step']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD should not appear' });
    setupFragment(tmpDir, 'startup-test', 'add.review', { step: 'Startup injected' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);
    addSidecar(tmpDir, 'startup-test', 'add.review', ['step']);

    applyEnabledFeatures(tmpDir);

    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).not.toContain('TDD should not appear');
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.review.md'), 'utf8')).toContain('Startup injected');
  });

  it('uses defaults when manifest has no features field', () => {
    writeManifest(tmpDir, { version: '1.0.0', providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'Default TDD' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    applyEnabledFeatures(tmpDir);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('Default TDD');
  });

  it('returns undefined when no manifest exists', () => {
    expect(applyEnabledFeatures(tmpDir)).toBeUndefined();
  });
});

describe('getFeatureStates', () => {
  it('returns all features with their states', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': false } });
    const states = getFeatureStates(tmpDir);
    expect(states).toHaveLength(Object.keys(FEATURES).length);
    expect(states.find((s) => s.name === 'tdd').enabled).toBe(true);
    expect(states.find((s) => s.name === 'startup-test').enabled).toBe(false);
  });

  it('uses defaults when no features in manifest', () => {
    writeManifest(tmpDir, { version: '1.0.0' });
    expect(getFeatureStates(tmpDir).find((s) => s.name === 'tdd').enabled).toBe(FEATURES.tdd.default);
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
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false, 'startup-test': false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    mockPromptFeatures.mockResolvedValue(['tdd']);
    await features(tmpDir, []);

    expect(readManifest(tmpDir).features.tdd).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).toContain('TDD GATE content');
  });

  it('disables a previously enabled feature when user deselects it', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);
    enableFeature(tmpDir, 'tdd');

    mockPromptFeatures.mockResolvedValue(['startup-test']);
    await features(tmpDir, []);

    expect(readManifest(tmpDir).features.tdd).toBe(false);
    expect(fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8')).not.toContain('TDD content');
  });

  it('makes no changes when selection matches current state', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    mockPromptFeatures.mockResolvedValue(['tdd']);
    await features(tmpDir, []);

    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(true);
    expect(manifest.features['startup-test']).toBe(false);
  });

  it('passes currently enabled features as initialValues to prompt', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': false } });
    mockPromptFeatures.mockResolvedValue(['tdd']);
    await features(tmpDir, []);
    expect(mockPromptFeatures).toHaveBeenCalledWith(['tdd']);
  });

  it('still supports enable subcommand with args', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: false }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD content' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    await features(tmpDir, ['enable', 'tdd']);
    expect(mockPromptFeatures).not.toHaveBeenCalled();
    expect(readManifest(tmpDir).features.tdd).toBe(true);
  });

  it('still supports disable subcommand with args', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommand(tmpDir, '.claude/commands', 'add.build', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'X' });
    addSidecar(tmpDir, 'tdd', 'add.build', ['gate']);

    await features(tmpDir, ['disable', 'tdd']);
    expect(mockPromptFeatures).not.toHaveBeenCalled();
    expect(readManifest(tmpDir).features.tdd).toBe(false);
  });
});
