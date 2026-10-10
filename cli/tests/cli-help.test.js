/**
 * cli-help.test.js — `--help` / `-h` after a subcommand prints the usage and
 * runs nothing (L1.10). Each case runs in an empty temp dir and asserts the
 * dir is still empty: nothing was installed, updated or removed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'codeadd.js');

describe('cli — --help after a subcommand', () => {
  let dir;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-help-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  const cases = [['update', '--help'], ['install', '-h'], ['uninstall', '--help']];
  for (const args of cases) {
    it(`${args.join(' ')} prints the usage, exits 0 and touches nothing`, () => {
      const res = spawnSync(process.execPath, [BIN, ...args], {
        cwd: dir, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' },
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/Usage/i);
      expect(fs.readdirSync(dir)).toEqual([]);
    });
  }
});
