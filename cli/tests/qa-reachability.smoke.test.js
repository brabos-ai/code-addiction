import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Capture the fail-loud warning channel — an anchor miss/drift must never be silent.
const warnSpy = vi.hoisted(() => vi.fn());
vi.mock('@clack/prompts', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, intro: vi.fn(), outro: vi.fn(), log: { ...actual.log, success: vi.fn(), info: vi.fn(), error: vi.fn(), warn: warnSpy } };
});

import { enableFeature, disableFeature } from '../src/features.js';

/**
 * Smoke evidence for plan 0056 (QA pipeline reachability) — pins the end-to-end
 * scenarios the topic touches, on the REAL build outputs:
 *   1. qa-pipeline enable/disable round-trip (byte-identical restore)
 *   2. pre-sidecar enable no-op (silent success the setup step must detect)
 *   3. fragment self-detection notices in always-present built body text
 *   4. add.qa two-phase preflight contract + shared probe script
 *
 * Requires `node scripts/build.js` to have produced framwork/.claude +
 * framwork/.codeadd/injection-points.json (CI builds before testing).
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const BUILT_CLAUDE = path.join(ROOT, 'framwork', '.claude');
const CODEADD = path.join(ROOT, 'framwork', '.codeadd');

const REMEDY = 'codeadd features enable qa-pipeline';

const builtCommand = (name) =>
  fs.readFileSync(path.join(BUILT_CLAUDE, 'commands', `${name}.md`), 'utf8');

let tmp;

function snapshot(file) {
  return fs.readFileSync(file, 'utf8');
}

// A real installed project carries LF files (the release ZIP is built on CI).
// A Windows checkout with core.autocrlf=true materializes CRLF instead, which
// the LF-based injection regexes don't match — normalize the fixture so the
// suite reproduces the real installed state on any checkout config.
function normalizeLineEndings(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) normalizeLineEndings(p);
    else if (/\.(md|json)$/.test(entry.name)) {
      const raw = fs.readFileSync(p, 'utf8');
      if (raw.includes('\r\n')) fs.writeFileSync(p, raw.replaceAll('\r\n', '\n'), 'utf8');
    }
  }
}

beforeEach(() => {
  warnSpy.mockClear();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-reach-'));
  fs.cpSync(BUILT_CLAUDE, path.join(tmp, '.claude'), { recursive: true });
  fs.cpSync(CODEADD, path.join(tmp, '.codeadd'), { recursive: true });
  normalizeLineEndings(tmp);
  fs.writeFileSync(
    path.join(tmp, '.codeadd', 'manifest.json'),
    JSON.stringify({ version: '0.0.0', providers: ['claude'], features: {}, plugins: {}, hashes: {} }, null, 2),
  );
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('scenario 1 — qa-pipeline enable/disable round-trip', () => {
  it('enable injects all three gated commands, disable restores byte-identically', () => {
    const targets = ['add.plan', 'add.test', 'add.build'].map((n) =>
      path.join(tmp, '.claude', 'commands', `${n}.md`),
    );
    const before = Object.fromEntries(targets.map((f) => [f, snapshot(f)]));

    const { modified } = enableFeature(tmp, 'qa-pipeline');
    expect(warnSpy).not.toHaveBeenCalled();
    expect(modified).toBeGreaterThan(0);

    expect(snapshot(targets[0])).toContain('STEP 10.0'); // QA-Spec step landed in add.plan
    expect(snapshot(targets[1])).toContain('E2E Spec Authoring'); // e2e-dispatch landed in add.test
    expect(snapshot(targets[2])).toContain('QA-Fix Flow'); // qa-fix landed in add.build
    for (const f of targets) if (snapshot(f) !== before[f]) expect(snapshot(f)).not.toContain('<!--');

    disableFeature(tmp, 'qa-pipeline');
    for (const f of targets) expect(snapshot(f)).toBe(before[f]);
  });
});

describe('scenario 2 — pre-sidecar enable no-op (features.js:85)', () => {
  it('with injection-points.json absent, enable injects nothing yet marks the feature on', () => {
    fs.rmSync(path.join(tmp, '.codeadd', 'injection-points.json'));

    const { modified } = enableFeature(tmp, 'qa-pipeline');

    // Pins the exact silent-success defect the add.qa-setup gate step must
    // detect (post-enable verification). If the CLI ever starts failing loud
    // here, the command guidance must be revisited — this test will flag it.
    expect(modified).toBe(0);
    const manifest = JSON.parse(snapshot(path.join(tmp, '.codeadd', 'manifest.json')));
    expect(manifest.features['qa-pipeline']).toBe(true);
  });
});

describe('scenario 3 — fragment self-detection notices (always-present body text)', () => {
  it('built add.plan carries the OFF-state notice with the exact remedy', () => {
    expect(builtCommand('add.plan')).toContain(REMEDY);
  });

  it('built add.test carries the OFF-state notice with the exact remedy', () => {
    expect(builtCommand('add.test')).toContain(REMEDY);
  });

  it('built add.build retains its existing self-detection stop (pattern origin)', () => {
    expect(builtCommand('add.build')).toContain(REMEDY);
  });
});

describe('scenario 4 — add.qa preflight contract + shared probe script', () => {
  it('qa-preflight.sh exists in the source scripts dir', () => {
    expect(fs.existsSync(path.join(CODEADD, 'scripts', 'qa-preflight.sh'))).toBe(true);
  });

  it('built add.qa invokes the shared probe script and declares block/degrade phases', () => {
    const qa = builtCommand('add.qa');
    expect(qa).toContain('.codeadd/scripts/qa-preflight.sh');
    expect(qa).toContain('Phase A');
    expect(qa).toContain('Phase B');
    expect(qa).toContain('degrade');
  });

  it('built add.qa-setup carries the feature-gate opt-in with the exact remedy', () => {
    const setup = builtCommand('add.qa-setup');
    expect(setup).toContain(REMEDY);
    expect(setup).toContain('.codeadd/scripts/qa-preflight.sh');
  });
});
