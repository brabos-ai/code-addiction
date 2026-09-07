import { defineConfig } from 'vitest/config';

/**
 * Test files run one at a time, on purpose.
 *
 * Several suites operate on the REAL built tree rather than a fixture:
 * build.test.js writes provider output, injection-roundtrip and
 * qa-reachability enable/disable injection into framwork/.claude/** and assert
 * byte-identical round-trips, and doctor/plugins/updater spawn node
 * subprocesses against it. Run in parallel workers they interleave on the same
 * files.
 *
 * On Windows that surfaces as EBUSY — a reader holding an open handle blocks a
 * writer — and the failure lands on a DIFFERENT random test each run. Three
 * full runs on this branch failed 8, then 6, then 6 tests with almost no
 * overlap, and every one of them passed in isolation. A run of `main` with none
 * of these changes failed 5. It reads exactly like a flaky regression and is
 * impossible to bisect.
 *
 * POSIX CI never sees it (replacing a file another process has open is legal
 * there), so this costs wall time on Linux to buy a suite that is trustworthy
 * on the machine the work actually happens on. The alternative — rewriting
 * every real-tree suite to build into a temp root — is a much larger change
 * that would touch the very injection round-trips it is meant to protect.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
