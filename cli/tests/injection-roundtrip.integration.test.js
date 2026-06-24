import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Capture the fail-loud warning channel: any anchor miss/drift logs a warning.
const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { enableFeature, disableFeature } from '../src/features.js';
import { enablePlugin, disablePlugin } from '../src/plugins.js';

/**
 * End-to-end: round-trip the REAL build outputs (built Claude provider dir +
 * .codeadd source incl. the emitted sidecar) through enable → disable and assert
 * byte-identical restore. This is the integration proof that the marker-free
 * sidecar mechanism wires together build → install shape → injection correctly.
 *
 * Requires `node scripts/build.js` to have produced framwork/.claude +
 * framwork/.codeadd/injection-points.json (CI builds before testing).
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const BUILT_CLAUDE = path.join(ROOT, 'framwork', '.claude');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');
const SIDECAR = path.join(CODEADD, 'injection-points.json');

let tmp;

function snapshot(file) {
  return fs.readFileSync(file, 'utf8');
}

beforeEach(() => {
  warnSpy.mockClear();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'inj-rt-'));
  fs.cpSync(BUILT_CLAUDE, path.join(tmp, '.claude'), { recursive: true });
  fs.cpSync(CODEADD, path.join(tmp, '.codeadd'), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} }, null, 2),
  );
});

afterEach(() => {
  delete process.env.CODEADD_PLUGINS_CATALOG;
  fs.rmSync(tmp, { recursive: true, force: true });
});

const sidecarPoints = () => JSON.parse(fs.readFileSync(SIDECAR, 'utf8')).points;

describe('feature injection round-trip on real built files', () => {
  for (const feature of ['tdd']) {
    it(`${feature}: enable injects, never misses an anchor, disable restores byte-identically`, () => {
      // All command files carrying a sidecar point for this feature.
      const targets = [
        ...new Set(
          sidecarPoints()
            .filter((p) => p.namespace === 'feature' && p.name === feature && p.resource.kind === 'command')
            .map((p) => path.join(tmp, '.claude', 'commands', `${p.resource.name}.md`)),
        ),
      ].filter(fs.existsSync);
      expect(targets.length).toBeGreaterThan(0);
      const before = Object.fromEntries(targets.map((f) => [f, snapshot(f)]));

      const { modified } = enableFeature(tmp, feature);
      expect(warnSpy).not.toHaveBeenCalled(); // no anchor miss/drift — every available fragment injected
      expect(modified).toBeGreaterThan(0); // injection actually happened
      // Any file that changed must be marker-free.
      for (const f of targets) if (snapshot(f) !== before[f]) expect(snapshot(f)).not.toContain('<!--');

      disableFeature(tmp, feature);
      for (const f of targets) expect(snapshot(f)).toBe(before[f]); // byte-identical restore
    });
  }
});

describe('gitnexus plugin injection round-trip on real built files', () => {
  function forceDetectableCatalog() {
    const real = JSON.parse(fs.readFileSync(path.join(ROOT, 'cli', 'src', 'plugins.json'), 'utf8'));
    const entry = { ...real.gitnexus, detect: 'true' }; // bypass the MCP probe in this hermetic test
    const p = path.join(tmp, 'catalog.json');
    fs.writeFileSync(p, JSON.stringify({ gitnexus: entry }, null, 2));
    process.env.CODEADD_PLUGINS_CATALOG = p;
  }

  it('enable injects into commands + agents, disable restores byte-identically', () => {
    forceDetectableCatalog();
    const points = sidecarPoints().filter((p) => p.namespace === 'plugin' && p.name === 'gitnexus');
    const cmdTargets = [...new Set(points.filter((p) => p.resource.kind === 'command').map((p) => path.join(tmp, '.claude', 'commands', `${p.resource.name}.md`)))];
    const agentTargets = [...new Set(points.filter((p) => p.resource.kind === 'agent').map((p) => path.join(tmp, '.claude', 'agents', `${p.resource.name}.md`)))];
    expect(cmdTargets.length).toBeGreaterThan(0);
    expect(agentTargets.length).toBeGreaterThan(0);

    const before = Object.fromEntries([...cmdTargets, ...agentTargets].map((f) => [f, snapshot(f)]));

    const result = enablePlugin(tmp, 'gitnexus');
    expect(warnSpy).not.toHaveBeenCalled(); // no anchor miss/drift on any of the 8 agents + commands
    expect(result.ok).toBe(true);
    expect(result.modified).toBe(cmdTargets.length);
    expect(result.agents).toBe(agentTargets.length);
    for (const f of [...cmdTargets, ...agentTargets]) {
      expect(snapshot(f)).not.toBe(before[f]); // actually injected
      expect(snapshot(f)).not.toContain('<!--'); // marker-free
    }

    disablePlugin(tmp, 'gitnexus');
    for (const f of [...cmdTargets, ...agentTargets]) expect(snapshot(f)).toBe(before[f]);
  });
});
