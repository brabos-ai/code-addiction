/**
 * Vitest globalSetup — build once, then guard the sidecars.
 *
 * setup    runs `node scripts/build.js` once, before any worker starts, and
 *          records a hash of each of the three sidecars it emits.
 * teardown re-hashes them after the last test and fails the run, naming the
 *          sidecar, if any was deleted or rewritten.
 *
 * Why: the suite runs in parallel. A test that deletes or rewrites a sidecar in
 * the real tree breaks every test reading it afterwards, in whatever order the
 * workers happen to run — that is what once gave 6, 13, 47 and 28 failures on
 * one unchanged commit. No test may touch them; this is the net that catches
 * the next one that does.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

/** The sidecars scripts/build.js emits. A test holds this equal to its SIDECARS. */
export const SIDECAR_NAMES = ['injection-points.json', 'contracts.json', 'artefact-graph.json'];

/** name → sha256 of the file, or null when it is absent. */
export function hashSidecars(dir) {
  const out = {};
  for (const name of SIDECAR_NAMES) {
    const file = path.join(dir, name);
    out[name] = fs.existsSync(file) ? createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
  }
  return out;
}

/** One line per sidecar that differs between two hashes. Empty means clean. */
export function sidecarDrift(before, after) {
  const drift = [];
  for (const name of SIDECAR_NAMES) {
    if (before[name] === after[name]) continue;
    if (after[name] === null) drift.push(`${name} was deleted during the run`);
    else if (before[name] === null) drift.push(`${name} was created during the run`);
    else drift.push(`${name} was rewritten during the run`);
  }
  return drift;
}

export default function setup() {
  // A debugger bootloader in NODE_OPTIONS prints onto stdout; the build does
  // not need it, and a banner here reads like a build failure.
  const built = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build.js')], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '' },
  });
  if (built.error || built.status !== 0) {
    throw new Error(`globalSetup: node scripts/build.js failed (exit ${built.status})\n${built.stdout}\n${built.stderr}`);
  }

  const before = hashSidecars(CODEADD);

  return function teardown() {
    const drift = sidecarDrift(before, hashSidecars(CODEADD));
    if (drift.length > 0) {
      throw new Error(
        'A test changed a build sidecar in the real tree. Tests must work on a copy.\n  ' + drift.join('\n  '),
      );
    }
  };
}
