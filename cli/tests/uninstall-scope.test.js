import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const mocks = vi.hoisted(() => ({
  promptUninstallScope: vi.fn(),
  promptScope: vi.fn(),
  promptProviders: vi.fn(),
  promptFeatures: vi.fn(),
  promptConfirm: vi.fn(),
  promptGitignore: vi.fn(),
}));

vi.mock('../src/prompt.js', () => ({
  promptUninstallScope: mocks.promptUninstallScope,
  promptScope: mocks.promptScope,
  promptProviders: mocks.promptProviders,
  promptFeatures: mocks.promptFeatures,
  promptConfirm: mocks.promptConfirm,
  promptGitignore: mocks.promptGitignore,
}));

vi.mock('@clack/prompts', () => ({
  cancel: vi.fn(),
  outro: vi.fn(),
  log: { message: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { resolveUninstallScope, resolveTarget } from '../src/cli.js';

let fakeHome;
let fakeCwd;

function writeManifest(base) {
  const dir = path.join(base, '.codeadd');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), '{"version":"1.0.0","files":[]}', 'utf8');
}

beforeEach(() => {
  vi.resetAllMocks();
  fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'add-home-'));
  fakeCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'add-cwd-'));
  vi.spyOn(os, 'homedir').mockReturnValue(fakeHome);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(fakeHome, { recursive: true, force: true });
  fs.rmSync(fakeCwd, { recursive: true, force: true });
});

describe('resolveUninstallScope', () => {
  it('T1 — only project manifest: returns project target without prompting', async () => {
    writeManifest(fakeCwd);
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([{ targetDir: fakeCwd, scope: 'project' }]);
    expect(mocks.promptUninstallScope).not.toHaveBeenCalled();
  });

  it('T2 — only global manifest: returns global target without prompting (the bug fix)', async () => {
    writeManifest(fakeHome);
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([{ targetDir: fakeHome, scope: 'global' }]);
    expect(mocks.promptUninstallScope).not.toHaveBeenCalled();
  });

  it('T3 — both manifests, user picks project: returns only project target', async () => {
    writeManifest(fakeCwd);
    writeManifest(fakeHome);
    mocks.promptUninstallScope.mockResolvedValueOnce('project');
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([{ targetDir: fakeCwd, scope: 'project' }]);
  });

  it('T4 — both manifests, user picks global: returns only global target', async () => {
    writeManifest(fakeCwd);
    writeManifest(fakeHome);
    mocks.promptUninstallScope.mockResolvedValueOnce('global');
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([{ targetDir: fakeHome, scope: 'global' }]);
  });

  it('T5 — both manifests, user picks both: returns project then global', async () => {
    writeManifest(fakeCwd);
    writeManifest(fakeHome);
    mocks.promptUninstallScope.mockResolvedValueOnce('both');
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([
      { targetDir: fakeCwd, scope: 'project' },
      { targetDir: fakeHome, scope: 'global' },
    ]);
  });

  it('T6 — neither manifest exists: returns empty array', async () => {
    const targets = await resolveUninstallScope(fakeCwd);
    expect(targets).toEqual([]);
    expect(mocks.promptUninstallScope).not.toHaveBeenCalled();
  });
});

describe('--global flag bypass', () => {
  it('T7 — resolveTarget with --global returns global scope (bypass path for uninstall branch)', () => {
    const result = resolveTarget('/some/project', ['--global']);
    expect(result).toEqual({ targetDir: fakeHome, scope: 'global', global: true });
  });
});
