import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Plan 2026-09-12T104012 — F12 and F13, distribution.
 *
 * Validation Matrix levels L1.4, L1.5 and L1.6.
 *
 * L1.5 is the one with a trap in it, and the plan's Reviewer Handoff names it:
 * the npm `files` whitelist is exactly what can fail to pack a generated
 * directory, so reading `package.json` back proves nothing. This asserts
 * against the REAL `npm pack` listing.
 */

const require = createRequire(import.meta.url);
const { MCP_SOURCE, MCP_PACKAGED } = require('../../scripts/build.js');

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const RELEASE_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release.yml');

/** Every file under a directory, as posix-relative paths. */
function tree(dir, rel = '', out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) tree(path.join(dir, entry.name), next, out);
    else out.push(next);
  }
  return out.sort();
}

describe('F12 — the build copies mcp/ into the CLI package', () => {
  it('names both ends in one place, so a consumer cannot drift from it', () => {
    expect(MCP_SOURCE).toBe('mcp');
    expect(MCP_PACKAGED).toBe('cli/src/mcp');
  });

  it('L1.4 the build leaves cli/src/mcp populated with the contents of mcp/', () => {
    // The build ran before this suite (the release workflow runs it
    // unconditionally, and a local run precedes every F-block).
    const source = tree(path.join(ROOT, MCP_SOURCE));
    const packaged = tree(path.join(ROOT, MCP_PACKAGED));
    expect(source.length).toBeGreaterThan(0);
    expect(packaged).toEqual(source);
  });

  it('L1.4 the copied files are byte-identical to their source', () => {
    for (const rel of tree(path.join(ROOT, MCP_SOURCE))) {
      const a = fs.readFileSync(path.join(ROOT, MCP_SOURCE, rel));
      const b = fs.readFileSync(path.join(ROOT, MCP_PACKAGED, rel));
      expect(b.equals(a), rel).toBe(true);
    }
  });

  it('the generated copy is gitignored, like every other build output', () => {
    // `git check-ignore -q` exits 0 when the path IS ignored and 1 when it is
    // not, and execFileSync turns a non-zero exit into a throw. The throw is
    // therefore the failure this level reports.
    expect(() =>
      execFileSync('git', ['check-ignore', '-q', `${MCP_PACKAGED}/server.mjs`], {
        cwd: ROOT,
        stdio: 'ignore',
      }),
    ).not.toThrow();
  });

  it('the build removes a stale file the source no longer has', () => {
    // A copy that only adds leaves a deleted module in every published package
    // forever, which is the class of bug the sidecar prune already guards.
    const stale = path.join(ROOT, MCP_PACKAGED, 'stale-module.mjs');
    fs.writeFileSync(stale, 'export const gone = true;\n', 'utf8');
    execFileSync(process.execPath, ['scripts/build.js'], { cwd: ROOT, stdio: 'ignore' });
    expect(fs.existsSync(stale)).toBe(false);
  }, 120000);
});

describe('F12 — L1.5 the packed tarball really contains it', () => {
  it('npm pack lists src/mcp, read from the tarball and never from the files array', () => {
    const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: path.join(ROOT, 'cli'),
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    const [meta] = JSON.parse(out);
    const packed = meta.files.map((f) => f.path.replace(/\\/g, '/'));
    const inMcp = packed.filter((p) => p.startsWith('src/mcp/'));

    expect(inMcp.length, `packed files: ${packed.length}`).toBeGreaterThan(0);
    expect(inMcp).toContain('src/mcp/server.mjs');
    expect(inMcp).toContain('src/mcp/engine.mjs');
    expect(inMcp).toContain('src/mcp/corpora.mjs');
  }, 120000);
});

describe('F13 — the publish gate covers mcp/', () => {
  const workflow = () => fs.readFileSync(RELEASE_WORKFLOW, 'utf8');

  it('L1.6 the CLI-change gate diffs mcp/ as well as cli/', () => {
    // The ZIP step is unconditional while the publish is gated on this diff, so
    // an mcp/-only release would ship a ZIP and skip npm publish — the exact
    // version skew the npx distribution route exists to make impossible.
    const match = workflow().match(/git diff --name-only "\$PREV_TAG"\.\.HEAD -- ([^|]+)\|/);
    expect(match, 'CLI-change diff not found in release.yml').toBeTruthy();
    const paths = match[1].trim().split(/\s+/);
    expect(paths).toContain('cli/');
    expect(paths).toContain('mcp/');
  });

  it('L1.6 the skip message names both paths, so a skipped publish is legible', () => {
    const yml = workflow();
    const skip = yml.split('\n').find((l) => l.includes('skipping publish'));
    expect(skip).toBeTruthy();
    expect(skip).toContain('cli/');
    expect(skip).toContain('mcp/');
  });

  it('L1.6 the gate fires on a diff touching only mcp/', () => {
    // Run the real predicate against a synthetic diff list: an mcp/-only change
    // must report changed, which is what the whole level is about.
    const match = workflow().match(/git diff --name-only "\$PREV_TAG"\.\.HEAD -- ([^|]+)\|/);
    const paths = match[1].trim().split(/\s+/);
    const changed = ['mcp/server.mjs'].some((f) => paths.some((p) => f.startsWith(p)));
    expect(changed).toBe(true);
  });

  it('the build step still runs unconditionally, so the copy exists before pack', () => {
    // cli/src/mcp is gitignored and generated. If "Build framework" ever grew
    // an `if:` guard, the tarball would ship without the server and L1.5 would
    // only catch it locally, where the build has always just run.
    const yml = workflow();
    const step = yml.slice(yml.indexOf('- name: Build framework'), yml.indexOf('- name: Run tests'));
    expect(step).toContain('node scripts/build.js');
    expect(step).not.toContain('if:');
  });
});
