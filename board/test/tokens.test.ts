// The design system is only a system while every value has a name. These read
// board/src/index.css and the components as text: a token that exists in one
// colour scheme and not the other, or a raw px/alpha left in a component, is a
// hole in the system that renders correctly and cannot be themed.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// vitest runs with board/ as its root, so cwd is the package directory.
const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, 'src/index.css'), 'utf8');

/** Every .tsx under src/, as [package-relative path, contents]. */
function components(): [string, string][] {
  const out: [string, string][] = [];
  (function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith('.tsx')) out.push([relative(ROOT, path).replaceAll('\\', '/'), readFileSync(path, 'utf8')]);
    }
  })(join(ROOT, 'src'));
  return out;
}

/** The token block for a scheme, as a name → value map. */
function tokens(scheme: 'light' | 'dark'): Map<string, string> {
  const block =
    scheme === 'light'
      ? CSS.slice(CSS.indexOf(':root {'), CSS.indexOf('@media (prefers-color-scheme: dark)'))
      : CSS.slice(CSS.indexOf('@media (prefers-color-scheme: dark)'), CSS.indexOf('@theme inline'));
  const map = new Map<string, string>();
  for (const match of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) map.set(name, value.trim());
  }
  return map;
}

/** Follow a var(--x) alias to the value it ends at, within one scheme. */
function resolve(map: Map<string, string>, name: string): string | undefined {
  let value = map.get(name);
  for (let hops = 0; value && hops < 8; hops++) {
    const alias = value.match(/^var\((--[a-z0-9-]+)\)$/);
    const next = alias?.[1];
    if (!next) return value;
    value = map.get(next);
  }
  return value;
}

const LIGHT = tokens('light');
const DARK = tokens('dark');

describe('L2 — no arbitrary type size survives in the components', () => {
  it('carries no text-[Npx] literal', () => {
    const found = components().flatMap(([path, src]) =>
      [...src.matchAll(/text-\[\d+px\]/g)].map((m) => `${path}: ${m[0]}`),
    );
    expect(found).toEqual([]);
  });

  it('carries no ink/[0.0XX] arbitrary alpha', () => {
    const found = components().flatMap(([path, src]) =>
      [...src.matchAll(/ink\/\[0\.\d+\]/g)].map((m) => `${path}: ${m[0]}`),
    );
    expect(found).toEqual([]);
  });

  it('declares the five-step scale in @theme inline', () => {
    const theme = CSS.slice(CSS.indexOf('@theme inline'));
    const missing = ['--text-micro', '--text-meta', '--text-body', '--text-section', '--text-display'].filter(
      (t) => !theme.includes(`${t}:`),
    );
    expect(missing).toEqual([]);
  });
});

describe('L2 — the two colour schemes declare the same tokens', () => {
  it('declares every token in both schemes', () => {
    const onlyLight = [...LIGHT.keys()].filter((k) => !DARK.has(k));
    const onlyDark = [...DARK.keys()].filter((k) => !LIGHT.has(k));
    expect({ onlyLight, onlyDark }).toEqual({ onlyLight: [], onlyDark: [] });
  });

  it('declares the tokens this design system was rebuilt around', () => {
    const required = ['--surface-3', '--surface-hover', '--surface-active', '--surface-sunken', '--rank'];
    expect(required.filter((t) => !LIGHT.has(t))).toEqual([]);
    expect(required.filter((t) => !DARK.has(t))).toEqual([]);
  });

  it('exposes every colour token to Tailwind through @theme inline', () => {
    const theme = CSS.slice(CSS.indexOf('@theme inline'));
    const missing = ['--surface-3', '--surface-hover', '--surface-active', '--surface-sunken', '--rank'].filter(
      (t) => !theme.includes(`var(${t})`),
    );
    expect(missing).toEqual([]);
  });
});

describe('L2 — tokens that must agree, and tokens that must not', () => {
  // --warn and --s-doing were equal in dark and unequal in light. One pair of
  // tokens cannot be an alias in one scheme and a distinction in the other.
  it('resolves --warn to --s-doing in both schemes', () => {
    expect(resolve(LIGHT, '--warn')).toBe(resolve(LIGHT, '--s-doing'));
    expect(resolve(DARK, '--warn')).toBe(resolve(DARK, '--s-doing'));
    expect(resolve(LIGHT, '--warn-soft')).toBe(resolve(LIGHT, '--s-doing-soft'));
    expect(resolve(DARK, '--warn-soft')).toBe(resolve(DARK, '--s-doing-soft'));
  });

  // --s-dropped was byte-identical to --faint, so "dropped" had the colour of
  // de-emphasised text rather than a colour of its own.
  it('keeps --s-dropped distinct from --faint in both schemes', () => {
    expect(resolve(LIGHT, '--s-dropped')).not.toBe(resolve(LIGHT, '--faint'));
    expect(resolve(DARK, '--s-dropped')).not.toBe(resolve(DARK, '--faint'));
  });

  // open and dropped are the two most opposed states on the board.
  it('keeps --s-dropped distinct from --s-open in both schemes', () => {
    expect(resolve(LIGHT, '--s-dropped')).not.toBe(resolve(LIGHT, '--s-open'));
    expect(resolve(DARK, '--s-dropped')).not.toBe(resolve(DARK, '--s-open'));
  });
});
