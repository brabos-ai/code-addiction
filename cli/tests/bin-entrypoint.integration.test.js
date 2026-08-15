import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const BIN = fileURLToPath(new URL('../bin/codeadd.js', import.meta.url));
const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const USAGE = 'Usage: codeadd <command>';

function runNode(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    timeout: 30000,
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

  it('importing src/cli.js dispatches nothing and prints nothing', () => {
    const result = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', `await import(${JSON.stringify(pathToFileURL(CLI).href)})`],
      { encoding: 'utf8', timeout: 30000 },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
  });
});
