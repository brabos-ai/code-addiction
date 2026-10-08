import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const BIN = fileURLToPath(new URL('../bin/codeadd.js', import.meta.url));
const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const USAGE = 'Usage: codeadd <command>';

// A debugger bootloader in the parent's NODE_OPTIONS prints onto the child's
// stderr, which the no-output assertion below reads as a failure.
const CHILD_ENV = { ...process.env, NODE_OPTIONS: '' };

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    timeout: 30000,
    env: CHILD_ENV,
  });
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-bin-'));
const linkPath = path.join(tmpDir, 'codeadd');

let canSymlink = true;
try {
  fs.symlinkSync(BIN, linkPath);
} catch {
  canSymlink = false;
}

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('bin entrypoint (process level)', () => {
  it('direct file with --help prints usage and exits 0', () => {
    const result = runNode(BIN, ['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(USAGE);
  });

  it.skipIf(!canSymlink)('symlink invocation with --help prints usage and exits 0 (npm bin regression)', () => {
    const result = runNode(linkPath, ['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(USAGE);
  });

  it('unknown command prints usage and exits 1', () => {
    const result = runNode(BIN, ['does-not-exist']);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(USAGE);
  });

  it('install --version without a value reports the error and exits 1', () => {
    const result = runNode(BIN, ['install', '--version']);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Missing value for --version');
  });

  it('help lists the providers and modify commands (L3.3)', () => {
    const result = runNode(BIN, ['--help']);
    expect(result.status).toBe(0);
    for (const line of [
      'providers list',
      'providers add <name>',
      'providers remove <name>',
      'modify',
      'npx codeadd providers add cursor',
      'npx codeadd modify',
    ]) {
      expect(result.stdout, line).toContain(line);
    }
  });

  describe('routing', () => {
    const project = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-route-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-route-home-'));
    afterAll(() => {
      fs.rmSync(project, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    });

    const writeManifest = (dir, manifest) => {
      fs.mkdirSync(path.join(dir, '.codeadd'), { recursive: true });
      fs.writeFileSync(path.join(dir, '.codeadd', 'manifest.json'), JSON.stringify(manifest));
    };

    const run = (args) =>
      spawnSync(process.execPath, [BIN, ...args], {
        encoding: 'utf8',
        timeout: 30000,
        cwd: project,
        env: { ...CHILD_ENV, HOME: home, USERPROFILE: home },
      });

    it.each([['providers', ['providers', 'list']], ['modify', ['modify']]])(
      '%s is routed, not treated as an unknown command',
      (_name, args) => {
        const result = run(args);
        expect(result.stdout).not.toContain(USAGE);
        expect(result.stdout).toContain('No ADD installation found');
        expect(result.status).toBe(1);
      },
    );

    it('providers list reads the project installation', () => {
      writeManifest(project, { version: '1.0.0', scope: 'project', providers: ['cursor'] });
      const result = run(['providers', 'list']);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/● cursor/);
      expect(result.stdout).toMatch(/○ claude/);
    });

    it('providers list --global reads the home installation, not the project one', () => {
      writeManifest(home, { version: '1.0.0', scope: 'global', providers: ['claude'] });
      const result = run(['providers', 'list', '--global']);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/● claude/);
      expect(result.stdout).not.toMatch(/cursor/);
    });
  });

  it('importing src/cli.js dispatches nothing and prints nothing', () => {
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(CLI).href)})`],
      { encoding: 'utf8', timeout: 30000, env: CHILD_ENV },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });
});
