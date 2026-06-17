import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { readManifest } from '../src/uninstaller.js';

vi.mock('../src/prompt.js', () => ({
  promptConfirm: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
  log: { info: vi.fn(), warn: vi.fn(), success: vi.fn() },
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-test-'));
  fs.mkdirSync(path.join(tmpDir, '.codeadd'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readManifest', () => {
  it('returns null when manifest does not exist', () => {
    expect(readManifest(path.join(tmpDir, 'empty'))).toBeNull();
  });

  it('parses a valid manifest', () => {
    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude'],
      files: ['.codeadd/commands/add.md'],
    };
    fs.writeFileSync(
      path.join(tmpDir, '.codeadd', 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const result = readManifest(tmpDir);
    expect(result).toMatchObject({
      version: '2.0.1',
      providers: ['claude'],
      files: ['.codeadd/commands/add.md'],
    });
    expect(result.corrupted).toBeUndefined();
  });

  it('returns corrupted=true for invalid JSON', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.codeadd', 'manifest.json'),
      'not valid json{{{',
      'utf8'
    );

    const result = readManifest(tmpDir);
    expect(result).not.toBeNull();
    expect(result.corrupted).toBe(true);
    expect(result.files).toEqual([]);
  });
});

describe('uninstall', () => {
  it('throws if manifest does not exist', async () => {
    const { uninstall } = await import('../src/uninstaller.js');
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'add-empty-'));

    try {
      await expect(uninstall(emptyDir, true)).rejects.toThrow(
        'No ADD installation found'
      );
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it('removes files listed in manifest (--force)', async () => {
    // Create fake ADD files
    const addDir = path.join(tmpDir, '.codeadd');
    const commandsDir = path.join(addDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.writeFileSync(path.join(commandsDir, 'add.md'), '# add');

    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude'],
      files: ['.codeadd/commands/add.md'],
    };
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true);

    expect(fs.existsSync(path.join(commandsDir, 'add.md'))).toBe(false);
    expect(fs.existsSync(path.join(addDir, 'manifest.json'))).toBe(false);
  });

  it('removes the ADD-managed .gitignore block and preserves user entries', async () => {
    const addDir = path.join(tmpDir, '.codeadd');
    const commandsDir = path.join(addDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.writeFileSync(path.join(commandsDir, 'add.md'), '# add');
    fs.writeFileSync(
      path.join(tmpDir, '.gitignore'),
      'node_modules/\n\n# ADD - managed by code-addiction\n.codeadd/\n.claude/\n.agent/\n.agents/\n.opencode/\n# END ADD\n\ndist/\n',
      'utf8'
    );

    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude', 'codex', 'antigrav', 'opencode'],
      files: ['.codeadd/commands/add.md'],
      gitignore: true,
    };
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true);

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toBe('node_modules/\n\ndist/\n');
    expect(gitignore).not.toContain('# ADD - managed by code-addiction');
    expect(gitignore).not.toContain('# END ADD');
  });

  it('global corrupted-manifest fallback removes .config/opencode and keeps .gitignore', async () => {
    // Global install dir that ADD_DIRS does not list — only GLOBAL_ADD_DIRS does
    const ocSkill = path.join(tmpDir, '.config', 'opencode', 'skills', 'add', 'SKILL.md');
    fs.mkdirSync(path.dirname(ocSkill), { recursive: true });
    fs.writeFileSync(ocSkill, '# add');

    // A home-level .gitignore that must NOT be touched in global scope
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n', 'utf8');

    // Corrupted manifest → fallback path; scope comes from the --global flag (param)
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), 'not json{{{', 'utf8');

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true, 'global');

    expect(fs.existsSync(ocSkill)).toBe(false);
    expect(fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8')).toBe('node_modules/\n');
  });

  it('global manifest-driven uninstall does not remove a .gitignore block', async () => {
    const ocDir = path.join(tmpDir, '.config', 'opencode', 'skills', 'add');
    fs.mkdirSync(ocDir, { recursive: true });
    fs.writeFileSync(path.join(ocDir, 'SKILL.md'), '# add');
    fs.writeFileSync(
      path.join(tmpDir, '.gitignore'),
      '# ADD - managed by code-addiction\n.codeadd/\n# END ADD\n',
      'utf8'
    );

    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['opencode'],
      scope: 'global',
      gitignore: false,
      files: ['.config/opencode/skills/add/SKILL.md'],
    };
    fs.writeFileSync(path.join(tmpDir, '.codeadd', 'manifest.json'), JSON.stringify(manifest), 'utf8');

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true, 'global');

    expect(fs.existsSync(path.join(ocDir, 'SKILL.md'))).toBe(false);
    // .gitignore block left intact (global never manages gitignore)
    expect(fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8')).toContain('# ADD - managed by code-addiction');
  });

  it('deletes .gitignore when it only contains the ADD-managed block', async () => {
    const addDir = path.join(tmpDir, '.codeadd');
    const commandsDir = path.join(addDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.writeFileSync(path.join(commandsDir, 'add.md'), '# add');
    fs.writeFileSync(
      path.join(tmpDir, '.gitignore'),
      '# ADD - managed by code-addiction\n.codeadd/\n.claude/\n.agent/\n.agents/\n.opencode/\n# END ADD\n',
      'utf8'
    );

    const manifest = {
      version: '2.0.1',
      installedAt: '2026-03-01T00:00:00Z',
      providers: ['claude'],
      files: ['.codeadd/commands/add.md'],
      gitignore: true,
    };
    fs.writeFileSync(
      path.join(addDir, 'manifest.json'),
      JSON.stringify(manifest),
      'utf8'
    );

    const { uninstall } = await import('../src/uninstaller.js');
    await uninstall(tmpDir, true);

    expect(fs.existsSync(path.join(tmpDir, '.gitignore'))).toBe(false);
  });
});
