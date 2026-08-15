import { describe, it, expect } from 'vitest';
import os from 'node:os';
import { resolveTarget } from '../src/cli.js';

describe('resolveTarget', () => {
  it('defaults to project scope (cwd) when no flag is present', () => {
    const result = resolveTarget('/work/repo', []);
    expect(result).toEqual({ targetDir: '/work/repo', scope: 'project', global: false });
  });

  it('resolves --global to the home dir at global scope', () => {
    const result = resolveTarget('/work/repo', ['--global']);
    expect(result).toEqual({ targetDir: os.homedir(), scope: 'global', global: true });
  });

  it('treats --user as an alias for --global', () => {
    const result = resolveTarget('/work/repo', ['--user']);
    expect(result).toEqual({ targetDir: os.homedir(), scope: 'global', global: true });
  });

  it('ignores unrelated flags', () => {
    const result = resolveTarget('/work/repo', ['--version', 'v1.0.0']);
    expect(result.scope).toBe('project');
    expect(result.targetDir).toBe('/work/repo');
  });
});
