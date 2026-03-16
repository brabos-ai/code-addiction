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
    log: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
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

function setupCommandWithMarkers(dir, commandDir, commandName, featureName, sections) {
  const cmdDir = path.join(dir, commandDir);
  fs.mkdirSync(cmdDir, { recursive: true });

  let content = `# Test Command\n\n`;
  for (const section of sections) {
    content += `<!-- feature:${featureName}:${section} -->\n`;
    content += `<!-- /feature:${featureName}:${section} -->\n`;
  }
  content += `\n## End\n`;

  const filePath = path.join(cmdDir, `${commandName}.md`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function setupFragment(dir, featureName, commandName, sections) {
  const fragDir = path.join(dir, '.codeadd', 'fragments', featureName);
  fs.mkdirSync(fragDir, { recursive: true });

  let content = '';
  for (const [name, body] of Object.entries(sections)) {
    content += `<!-- section:${name} -->\n`;
    content += `${body}\n`;
    content += `<!-- /section:${name} -->\n\n`;
  }

  fs.writeFileSync(path.join(fragDir, `${commandName}.md`), content, 'utf8');
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
    expect(FEATURES.tdd.commands).toContain('add.check');
  });

  it('defines startup-test feature', () => {
    expect(FEATURES['startup-test']).toBeDefined();
    expect(FEATURES['startup-test'].commands).toContain('add.build');
    expect(FEATURES['startup-test'].commands).toContain('add.check');
  });

  it('both features default to true', () => {
    expect(FEATURES.tdd.default).toBe(true);
    expect(FEATURES['startup-test'].default).toBe(true);
  });
});

describe('enableFeature', () => {
  it('injects fragment content into empty markers in provider dir', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.plan', 'tdd', ['step9', 'step-list']);
    setupFragment(tmpDir, 'tdd', 'add.plan', {
      step9: '## STEP 9: Test-Spec Subagent',
      'step-list': 'STEP 9:  Test-Spec subagent',
    });

    const result = enableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(1);

    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.plan.md'), 'utf8');
    expect(content).toContain('## STEP 9: Test-Spec Subagent');
    expect(content).toContain('STEP 9:  Test-Spec subagent');
  });

  it('sets manifest.features to true', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', {
      gate: 'TDD GATE content',
    });

    enableFeature(tmpDir, 'tdd');

    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(true);
  });

  it('recalculates hashes for modified files', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, hashes: {}, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', {
      gate: 'TDD GATE content',
    });

    enableFeature(tmpDir, 'tdd');

    const manifest = readManifest(tmpDir);
    const hashKey = Object.keys(manifest.hashes).find((k) => k.includes('add.build'));
    expect(hashKey).toBeDefined();
    expect(manifest.hashes[hashKey]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('injects into multiple provider directories', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude', 'codex'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupCommandWithMarkers(tmpDir, '.agent/workflows', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', {
      gate: 'TDD GATE injected',
    });

    const result = enableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(2);

    const claudeContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    const agentContent = fs.readFileSync(path.join(tmpDir, '.agent', 'workflows', 'add.build.md'), 'utf8');
    expect(claudeContent).toContain('TDD GATE injected');
    expect(agentContent).toContain('TDD GATE injected');
  });

  it('returns 0 modified when no matching commands exist', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupFragment(tmpDir, 'tdd', 'add.plan', { step9: 'content' });

    const result = enableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(0);
  });

  it('is idempotent — enabling twice produces same result', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD content' });

    enableFeature(tmpDir, 'tdd');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');

    enableFeature(tmpDir, 'tdd');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');

    expect(content1).toBe(content2);
  });
});

describe('disableFeature', () => {
  it('removes content between markers', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });

    const cmdDir = path.join(tmpDir, '.claude', 'commands');
    fs.mkdirSync(cmdDir, { recursive: true });
    const cmdPath = path.join(cmdDir, 'add.build.md');
    fs.writeFileSync(
      cmdPath,
      `# Command\n<!-- feature:tdd:gate -->\nTDD GATE content here\n<!-- /feature:tdd:gate -->\n## End\n`,
      'utf8'
    );

    const result = disableFeature(tmpDir, 'tdd');

    expect(result.modified).toBe(1);
    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).not.toContain('TDD GATE content here');
    expect(content).toContain('<!-- feature:tdd:gate -->');
    expect(content).toContain('<!-- /feature:tdd:gate -->');
  });

  it('sets manifest.features to false', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);

    disableFeature(tmpDir, 'tdd');

    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(false);
  });

  it('handles multiple sections in one file', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });

    const cmdDir = path.join(tmpDir, '.claude', 'commands');
    fs.mkdirSync(cmdDir, { recursive: true });
    const cmdPath = path.join(cmdDir, 'add.build.md');
    fs.writeFileSync(
      cmdPath,
      [
        '# Command',
        '<!-- feature:tdd:gate -->',
        'GATE content',
        '<!-- /feature:tdd:gate -->',
        'middle text',
        '<!-- feature:tdd:awareness -->',
        'AWARENESS content',
        '<!-- /feature:tdd:awareness -->',
        '## End',
      ].join('\n'),
      'utf8'
    );

    disableFeature(tmpDir, 'tdd');

    const content = fs.readFileSync(cmdPath, 'utf8');
    expect(content).not.toContain('GATE content');
    expect(content).not.toContain('AWARENESS content');
    expect(content).toContain('middle text');
  });

  it('is idempotent — disabling already disabled feature is no-op', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);

    disableFeature(tmpDir, 'tdd');
    const content1 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');

    disableFeature(tmpDir, 'tdd');
    const content2 = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');

    expect(content1).toBe(content2);
  });
});

describe('enable then disable roundtrip', () => {
  it('returns command to original state after enable→disable', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: {}, providers: ['claude'] });
    const cmdPath = setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate', 'awareness']);
    setupFragment(tmpDir, 'tdd', 'add.build', {
      gate: 'TDD GATE content',
      awareness: 'TDD AWARENESS content',
    });

    const originalContent = fs.readFileSync(cmdPath, 'utf8');

    enableFeature(tmpDir, 'tdd');
    const enabledContent = fs.readFileSync(cmdPath, 'utf8');
    expect(enabledContent).toContain('TDD GATE content');

    disableFeature(tmpDir, 'tdd');
    const disabledContent = fs.readFileSync(cmdPath, 'utf8');

    expect(disabledContent).toBe(originalContent);
  });
});

describe('applyEnabledFeatures', () => {
  it('applies all default-enabled features', () => {
    writeManifest(tmpDir, {
      version: '1.0.0',
      features: { tdd: true, 'startup-test': true },
      providers: ['claude'],
    });

    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.check', 'startup-test', ['step']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD injected' });
    setupFragment(tmpDir, 'startup-test', 'add.check', { step: 'Startup Test injected' });

    const total = applyEnabledFeatures(tmpDir);

    expect(total).toBeGreaterThanOrEqual(2);
    const devContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    const reviewContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.check.md'), 'utf8');
    expect(devContent).toContain('TDD injected');
    expect(reviewContent).toContain('Startup Test injected');
  });

  it('skips disabled features', () => {
    writeManifest(tmpDir, {
      version: '1.0.0',
      features: { tdd: false, 'startup-test': true },
      providers: ['claude'],
    });

    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.check', 'startup-test', ['step']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD should not appear' });
    setupFragment(tmpDir, 'startup-test', 'add.check', { step: 'Startup injected' });

    applyEnabledFeatures(tmpDir);

    const devContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    const reviewContent = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.check.md'), 'utf8');
    expect(devContent).not.toContain('TDD should not appear');
    expect(reviewContent).toContain('Startup injected');
  });

  it('uses defaults when manifest has no features field', () => {
    writeManifest(tmpDir, { version: '1.0.0', providers: ['claude'] });

    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'Default TDD' });

    applyEnabledFeatures(tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    // tdd.default is true, so it should be injected
    expect(content).toContain('Default TDD');
  });

  it('returns 0 when no manifest exists', () => {
    const result = applyEnabledFeatures(tmpDir);
    expect(result).toBeUndefined();
  });
});

describe('getFeatureStates', () => {
  it('returns all features with their states', () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': false } });

    const states = getFeatureStates(tmpDir);

    expect(states).toHaveLength(Object.keys(FEATURES).length);
    const tdd = states.find((s) => s.name === 'tdd');
    const startup = states.find((s) => s.name === 'startup-test');
    expect(tdd.enabled).toBe(true);
    expect(startup.enabled).toBe(false);
  });

  it('uses defaults when no features in manifest', () => {
    writeManifest(tmpDir, { version: '1.0.0' });

    const states = getFeatureStates(tmpDir);

    const tdd = states.find((s) => s.name === 'tdd');
    expect(tdd.enabled).toBe(FEATURES.tdd.default);
  });

  it('uses defaults when no manifest exists', () => {
    const states = getFeatureStates(tmpDir);

    for (const state of states) {
      expect(state.enabled).toBe(FEATURES[state.name].default);
    }
  });

  it('includes description for each feature', () => {
    writeManifest(tmpDir, { version: '1.0.0' });

    const states = getFeatureStates(tmpDir);

    for (const state of states) {
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
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD GATE content' });

    mockPromptFeatures.mockResolvedValue(['tdd']);

    await features(tmpDir, []);

    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(true);
    const content = fs.readFileSync(path.join(tmpDir, '.claude', 'commands', 'add.build.md'), 'utf8');
    expect(content).toContain('TDD GATE content');
  });

  it('disables a previously enabled feature when user deselects it', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': true }, providers: ['claude'] });

    const cmdDir = path.join(tmpDir, '.claude', 'commands');
    fs.mkdirSync(cmdDir, { recursive: true });
    fs.writeFileSync(
      path.join(cmdDir, 'add.build.md'),
      '# Command\n<!-- feature:tdd:gate -->\nTDD content\n<!-- /feature:tdd:gate -->\n',
      'utf8'
    );

    mockPromptFeatures.mockResolvedValue(['startup-test']);

    await features(tmpDir, []);

    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(false);
    const content = fs.readFileSync(path.join(cmdDir, 'add.build.md'), 'utf8');
    expect(content).not.toContain('TDD content');
  });

  it('makes no changes when selection matches current state', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true, 'startup-test': false }, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);

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
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);
    setupFragment(tmpDir, 'tdd', 'add.build', { gate: 'TDD content' });

    await features(tmpDir, ['enable', 'tdd']);

    expect(mockPromptFeatures).not.toHaveBeenCalled();
    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(true);
  });

  it('still supports disable subcommand with args', async () => {
    writeManifest(tmpDir, { version: '1.0.0', features: { tdd: true }, providers: ['claude'] });
    setupCommandWithMarkers(tmpDir, '.claude/commands', 'add.build', 'tdd', ['gate']);

    await features(tmpDir, ['disable', 'tdd']);

    expect(mockPromptFeatures).not.toHaveBeenCalled();
    const manifest = readManifest(tmpDir);
    expect(manifest.features.tdd).toBe(false);
  });
});
