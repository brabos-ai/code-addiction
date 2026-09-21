import { defineConfig } from 'vitest/config';
import { serialFiles } from './tests/helpers/test-groups.js';

/**
 * Two projects: most files in parallel, then the subprocess spawners serially.
 *
 * The suite ran fully serial until plan 2026-09-21T001942. Two things kept it
 * there, and each now has its own fix rather than a global setting.
 *
 * 1. Shared state. mcp-packaging ran scripts/build.js in the real tree, which
 *    deletes and rewrites the three sidecars other files read — so the verdict
 *    depended on which file ran after which, and one unchanged commit gave 6,
 *    13, 47 and 28 failures across four runs. That test now works on a copy,
 *    an audit of every file found no other writer, and the globalSetup below
 *    builds once before any worker starts and FAILS the run if a sidecar
 *    changes during it. (The older EBUSY collisions in build.test.js and the
 *    injection round-trips were fixed earlier by redirecting their writes.)
 *
 * 2. Contention. Measured 2026-09-11 on a loaded Windows machine, serial vs
 *    twelve workers: 208s with 2 failures against 153s with 12. Every one of
 *    the twelve was a subprocess timing out at 5000ms in a file that spawns
 *    one. Those files — whatever imports child_process, found on every run by
 *    tests/helpers/test-groups.js — form the `serial` project. It runs one file
 *    at a time, and only after the `parallel` project has finished
 *    (sequence.groupOrder), so a spawn never competes with a dozen workers.
 *
 * tests/vitest-projects.test.js holds every file in exactly one project and
 * every spawner in `serial`.
 *
 * Measured 2026-09-21 on one Windows machine, same commit range, 1578 tests:
 *
 *   native, fully serial (the old config)          113s   all green
 *   native, these two projects                      88s   2 timeouts (mcp-server, qa-reachability)
 *   native, CODEADD_TESTS_RUNNER=native (serial)    93s   all green
 *   container, these two projects, three runs    13-18s   all green, same count each time
 *
 * So on Windows the parallel projects are only safe inside the Linux
 * container, which is what root `npm test` uses by default; the native
 * override keeps the serial run (scripts/run-tests.js passes
 * --no-file-parallelism there). The container copies the checkout in rather
 * than bind-mounting it: through the bind mount, 11 tests walking the tree
 * timed out at 5000ms and three files took 121s.
 */

const SERIAL = serialFiles();

export default defineConfig({
  test: {
    globalSetup: ['./tests/helpers/global-setup.js'],
    projects: [
      {
        extends: true,
        test: {
          name: 'parallel',
          include: ['tests/**/*.test.js'],
          exclude: [...SERIAL, '**/node_modules/**'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'serial',
          include: SERIAL,
          fileParallelism: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
