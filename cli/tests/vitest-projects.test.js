import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import config from '../vitest.config.js';
import { spawns, serialFiles, testFiles, TESTS_DIR } from './helpers/test-groups.js';

/**
 * The two vitest projects (plan 2026-09-21T001942-PLAN--parallel-tests-in-one-container, F8).
 *
 * Files that spawn a subprocess run serially, after every other file has run
 * in parallel. A spawning file that lands in the parallel project brings back
 * the timeout class that kept the whole suite serial for months, so membership
 * is asserted, not trusted.
 */

const projects = config.test.projects;
const byName = Object.fromEntries(projects.map((p) => [p.test.name, p.test]));

describe('the classifier', () => {
  it('sees every spelling of a child_process import', () => {
    expect(spawns("import { spawnSync } from 'node:child_process';")).toBe(true);
    expect(spawns('import { execFileSync } from "child_process";')).toBe(true);
    expect(spawns("const cp = require('child_process');")).toBe(true);
    expect(spawns("const { spawn } = await import('node:child_process');")).toBe(true);
    expect(spawns("import fs from 'node:fs'; // spawns nothing")).toBe(false);
  });

  it('reads the files on disk, so a new spawning file is serial with no edit', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-groups-'));
    try {
      fs.writeFileSync(path.join(dir, 'a.test.js'), "import 'node:fs';\n");
      fs.writeFileSync(path.join(dir, 'b.test.js'), "import { spawn } from 'node:child_process';\n");
      fs.writeFileSync(path.join(dir, 'helper.js'), "import 'node:child_process';\n");
      expect(testFiles(dir)).toEqual(['tests/a.test.js', 'tests/b.test.js']);
      expect(serialFiles(dir)).toEqual(['tests/b.test.js']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the config', () => {
  it('declares exactly a parallel and a serial project, serial ordered after parallel', () => {
    expect(Object.keys(byName).sort()).toEqual(['parallel', 'serial']);
    expect(byName.parallel.sequence.groupOrder).toBeLessThan(byName.serial.sequence.groupOrder);
    expect(byName.serial.fileParallelism).toBe(false);
    expect(byName.parallel.fileParallelism).not.toBe(false);
  });

  it('puts every file importing child_process in the serial project, and every file in exactly one', () => {
    const serial = new Set(byName.serial.include);
    const excludedFromParallel = new Set(byName.parallel.exclude);

    for (const file of testFiles()) {
      const source = fs.readFileSync(path.join(TESTS_DIR, path.basename(file)), 'utf8');
      const inSerial = serial.has(file);
      const inParallel = !excludedFromParallel.has(file);
      expect(inSerial !== inParallel, `${file} must be in exactly one project`).toBe(true);
      expect(inSerial, `${file} ${spawns(source) ? 'spawns' : 'does not spawn'}`).toBe(spawns(source));
    }
    expect(serial.size).toBeGreaterThan(0);
  });

  it('builds once, before any worker, through the sidecar-guarding globalSetup', () => {
    expect(config.test.globalSetup).toEqual(['./tests/helpers/global-setup.js']);
  });
});
