import { describe, it, expect } from 'vitest';
import { getArgValues, readChangeFlags } from '../src/change-flags.js';
import { getArgValue } from '../src/cli.js';

describe('getArgValues (L1.1)', () => {
  it('reads repeated flags and comma lists as one list', () => {
    expect(getArgValues(['--x', 'a,b', '--x', 'c'], '--x')).toEqual(['a', 'b', 'c']);
  });

  it('reads the inline form', () => {
    expect(getArgValues(['--x=a,b'], '--x')).toEqual(['a', 'b']);
  });

  it('trims and de-duplicates', () => {
    expect(getArgValues(['--x', ' a , b ,a'], '--x')).toEqual(['a', 'b']);
  });

  it('returns undefined when the flag is absent', () => {
    expect(getArgValues(['--y', 'a'], '--x')).toBeUndefined();
  });

  it('throws a message naming the flag when the value is missing', () => {
    expect(() => getArgValues(['--x'], '--x')).toThrow(/--x/);
    expect(() => getArgValues(['--x', '--force'], '--x')).toThrow(/--x/);
  });
});

describe('readChangeFlags (L1.2, L1.3)', () => {
  it('has nothing set when no flag is present', () => {
    expect(readChangeFlags([])).toEqual({
      providers: undefined,
      features: {},
      plugins: {},
      force: false,
      gitignore: undefined,
      any: false,
    });
  });

  it('reads --providers as a list, and none as the empty list', () => {
    expect(readChangeFlags(['--providers', 'claude,codex']).providers).toEqual(['claude', 'codex']);
    expect(readChangeFlags(['--providers', 'none']).providers).toEqual([]);
  });

  it('builds the feature and plugin delta maps from the four flags', () => {
    const flags = readChangeFlags([
      '--enable-feature', 'board,qa-pipeline',
      '--disable-feature', 'tdd-pipeline',
      '--enable-plugin', 'gitnexus',
      '--disable-plugin=playwright',
    ]);
    expect(flags.features).toEqual({ board: true, 'qa-pipeline': true, 'tdd-pipeline': false });
    expect(flags.plugins).toEqual({ gitnexus: true, playwright: false });
    expect(flags.any).toBe(true);
  });

  it('reads --force and --no-gitignore', () => {
    expect(readChangeFlags(['--force']).force).toBe(true);
    expect(readChangeFlags(['--no-gitignore']).gitignore).toBe(false);
  });

  it('does not count --force, --no-gitignore or the scope flags as a change', () => {
    expect(readChangeFlags(['--force']).any).toBe(false);
    expect(readChangeFlags(['--no-gitignore']).any).toBe(false);
    expect(readChangeFlags(['--global', '--version', 'v1']).any).toBe(false);
  });

  it('counts --providers alone as a change', () => {
    expect(readChangeFlags(['--providers', 'none']).any).toBe(true);
  });

  it('throws when one name is both enabled and disabled', () => {
    expect(() => readChangeFlags(['--enable-feature', 'board', '--disable-feature', 'board'])).toThrow(/board/);
    expect(() => readChangeFlags(['--enable-plugin', 'x', '--disable-plugin', 'x'])).toThrow(/x/);
  });
});

describe('getArgValue message per flag (L1.4)', () => {
  it('keeps the <tag|main> hint for --version', () => {
    expect(() => getArgValue(['--version'], '--version')).toThrow('<tag|main>');
  });

  it('gives --channel its own <stable|beta> hint', () => {
    expect(() => getArgValue(['--channel'], '--channel')).toThrow('<stable|beta>');
    expect(() => getArgValue(['--channel='], '--channel')).toThrow('<stable|beta>');
  });

  it('still parses a value the same way', () => {
    expect(getArgValue(['--version', 'v1.2.3'], '--version')).toBe('v1.2.3');
    expect(getArgValue(['--channel=beta'], '--channel')).toBe('beta');
    expect(getArgValue([], '--version')).toBeUndefined();
  });
});
