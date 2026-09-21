import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hashSidecars, sidecarDrift, SIDECAR_NAMES } from './helpers/global-setup.js';

/**
 * cli/tests/helpers/global-setup.js — build once, then guard the sidecars
 * (plan 2026-09-21T001942-PLAN--parallel-tests-in-one-container, F7).
 *
 * The suite runs in parallel now. A test that deletes or rewrites a sidecar in
 * the real tree breaks every test reading it afterwards, in whatever order the
 * workers happen to run — the failure that once gave 6, 13, 47 and 28 failures
 * on one unchanged commit. The teardown fails the run and names the sidecar.
 */

function sidecarDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'global-setup-'));
  for (const name of SIDECAR_NAMES) fs.writeFileSync(path.join(dir, name), `{"${name}":1}\n`);
  return dir;
}

describe('the sidecar guard', () => {
  it('names the same three sidecars scripts/build.js emits', async () => {
    const { createRequire } = await import('node:module');
    const { SIDECARS } = createRequire(import.meta.url)('../../scripts/build.js');
    expect([...SIDECAR_NAMES].sort()).toEqual([...SIDECARS].sort());
  });

  it('reports nothing when no sidecar changed', () => {
    const dir = sidecarDir();
    try {
      expect(sidecarDrift(hashSidecars(dir), hashSidecars(dir))).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('names a sidecar deleted mid-run, and one rewritten mid-run', () => {
    const dir = sidecarDir();
    try {
      const before = hashSidecars(dir);
      fs.rmSync(path.join(dir, 'contracts.json'));
      fs.writeFileSync(path.join(dir, 'artefact-graph.json'), '{"changed":true}\n');

      const drift = sidecarDrift(before, hashSidecars(dir));
      expect(drift).toHaveLength(2);
      expect(drift.join('\n')).toMatch(/contracts\.json.*deleted/);
      expect(drift.join('\n')).toMatch(/artefact-graph\.json.*rewritten/);
      expect(drift.join('\n')).not.toMatch(/injection-points/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
