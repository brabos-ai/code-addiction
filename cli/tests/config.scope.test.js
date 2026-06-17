import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { log } from '@clack/prompts';
import { config } from '../src/config.js';

let tmpDir;
let originalExit;

function writeManifest(dir, data) {
  const addDir = path.join(dir, '.codeadd');
  fs.mkdirSync(addDir, { recursive: true });
  fs.writeFileSync(path.join(addDir, 'manifest.json'), JSON.stringify(data), 'utf8');
}

function infoLines(spy) {
  return spy.mock.calls.map((c) => String(c[0]));
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-cfg-'));
  originalExit = process.exit;
  process.exit = () => { throw new Error('EXIT'); };
});

afterEach(() => {
  process.exit = originalExit;
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('config show — scope line', () => {
  it('prints Scope: global from manifest.scope', async () => {
    const spy = vi.spyOn(log, 'info').mockImplementation(() => {});
    writeManifest(tmpDir, { version: '1.0.0', providers: ['claude'], files: [], scope: 'global' });

    try { await config(tmpDir, false); } catch (e) { if (e.message !== 'EXIT') throw e; }

    expect(infoLines(spy).some((l) => /Scope:\s+global/.test(l))).toBe(true);
  });

  it('defaults to Scope: project when manifest.scope is absent', async () => {
    const spy = vi.spyOn(log, 'info').mockImplementation(() => {});
    writeManifest(tmpDir, { version: '1.0.0', providers: ['claude'], files: [] });

    try { await config(tmpDir, false); } catch (e) { if (e.message !== 'EXIT') throw e; }

    expect(infoLines(spy).some((l) => /Scope:\s+project/.test(l))).toBe(true);
  });
});
