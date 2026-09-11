import { defineConfig } from 'vitest/config';

/**
 * Test files run one at a time, on purpose — but not for the reason this
 * comment used to give.
 *
 * It used to say that build.test.js wrote provider output into the real tree,
 * that the injection round-trips enabled and disabled injection inside
 * framwork/.claude/**, and that parallel workers therefore collided on the same
 * files until Windows reported EBUSY. Both halves were fixed in the tests
 * themselves and the comment was never updated. build.test.js redirects every
 * write into a temp directory through its redirected() helper, and all four
 * round-trip suites copy the tree before touching it. They only read the real
 * tree now, and concurrent readers do not produce EBUSY.
 *
 * What does reproduce is different, and was measured on 2026-09-11, both ways,
 * on the same Windows machine in the same session:
 *
 *   serial               208s, 2 failures
 *   --file-parallelism   153s, 12 failures
 *
 * Every one of those twelve is a timeout, and every one is in a file that
 * spawns a subprocess: bin-entrypoint, graph-mcp, graph-query, plugins,
 * updater, inventory, features. Twelve workers on one machine cannot give a
 * spawn its 5000ms. The heaviest suite got slower rather than faster —
 * qa-reachability went from 105.8s to 149.3s — because the workers were
 * fighting over one disk, which is also why the 26% saved is far less than
 * twelve-way parallelism suggests.
 *
 * So it buys about a quarter of the wall time for ten new failures, and slows
 * down the file that dominates the run. Meanwhile the fixture work in plan
 * 2026-09-11T005514 took the serial run from 164s to under 80s on the same
 * machine without touching this setting at all.
 *
 * Worth re-measuring if the subprocess-spawning suites ever stop spawning, or
 * if their timeouts are sized for contention the way graph-query's history
 * block now is. Until then, serial.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
