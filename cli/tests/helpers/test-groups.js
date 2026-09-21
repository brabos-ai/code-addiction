/**
 * Which test files run serially, decided from the files themselves.
 *
 * A file that spawns a subprocess — it imports child_process, as a require or
 * an import, with or without the `node:` prefix — runs in the serial project.
 * Everything else runs in parallel. Computed on every run, so a new spawning
 * file lands in the right project without anyone editing a list.
 *
 * Why spawners: measured 2026-09-11 on a loaded Windows machine, every one of
 * the twelve failures parallelism caused was a subprocess timing out at 5000ms
 * in one of these files. They cannot get a spawn done in time while a dozen
 * workers fight over the same CPU and disk.
 */

import fs from 'node:fs';
import path from 'node:path';

export const TESTS_DIR = path.resolve(import.meta.dirname, '..');

/** Matches a child_process import or require, in either spelling. */
export const SPAWNS = /['"](node:)?child_process['"]/;

/** Does this source spawn a subprocess? */
export function spawns(source) {
  return SPAWNS.test(source);
}

/**
 * Every test file under cli/tests, at any depth, as a path relative to cli/.
 * Recursive because the config's include glob is — a nested spawning file
 * missed here would run in the parallel project.
 */
export function testFiles(dir = TESTS_DIR) {
  const out = [];
  const walk = (d, rel) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(d, entry.name), next);
      else if (entry.name.endsWith('.test.js')) out.push(`tests/${next}`);
    }
  };
  walk(dir, '');
  return out.sort();
}

/** The test files that go to the serial project, relative to cli/. */
export function serialFiles(dir = TESTS_DIR) {
  return testFiles(dir).filter((f) => spawns(fs.readFileSync(path.join(dir, f.slice('tests/'.length)), 'utf8')));
}
