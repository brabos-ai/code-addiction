import { defineConfig } from 'vitest/config';

/**
 * Test files run one at a time, on purpose — but not for the reason this
 * comment used to give.
 *
 * It used to say that build.test.js wrote provider output into the real tree,
 * that the injection round-trips enabled and disabled injection inside
 * framwork/.claude/**, and that parallel workers therefore collided on the same
 * files until Windows reported EBUSY. The symptom was real and worth keeping on
 * the record: three full runs failed 8, then 6, then 6 tests with almost no
 * overlap, and every one of them passed in isolation. POSIX CI never saw any of
 * it, because replacing a file another process holds open is legal there.
 *
 * Both causes were then fixed in the tests and the comment was never updated.
 * build.test.js redirects every write into a temp directory through its
 * redirected() helper, and all four round-trip suites copy the tree before
 * touching it. They only read the real tree now, and concurrent readers do not
 * produce EBUSY. (cli/tests/build.test.js still narrates the old hazard beside
 * redirected(); that comment describes why the helper exists, which is still
 * true, not a live race.)
 *
 * What does reproduce is different. Measured 2026-09-11, both ways, back to
 * back on one Windows machine while other work was running on it:
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
 * twelve-way parallelism suggests. So parallelism bought about a quarter of the
 * wall time for ten new failures, and slowed down the file that dominated the
 * run.
 *
 * Those two rows are the only pair measured against each other, and they are
 * the comparison that matters. They are NOT comparable to a figure from an idle
 * checkout: the same serial suite on a quiet clean worktree was 164s with zero
 * failures on the same day, and the two `graph-query` failures above are
 * load-dependent timeouts that do not reproduce there at all.
 *
 * On that quiet baseline the fixture work in plan 2026-09-11T005514 took the
 * serial run from 164s to around 80s without touching this setting, which is
 * the other reason it stays off: the cost parallelism was being asked to hide
 * was mostly a fixture nobody needed.
 *
 * Worth re-measuring if the subprocess-spawning suites ever stop spawning, or
 * once their timeouts are sized for contention the way graph-query's history
 * block now is. Until then, serial.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
