# Vitest fixture scope — stop charging a full-tree copy to tests that never open it

**Date:** 2026-09-11
**Plan:** `2026-09-11T005514-PLAN--vitest-fixture-scope`
**Layer:** product

The `cli/` suite took 164 seconds serially on the machine this framework is developed on. It now
takes about 85. Nothing it asserts changed.

## Why

The time was not spread across 44 test files. One carried nearly half of it, for a reason that was
mechanical rather than architectural.

`cli/tests/qa-reachability.smoke.test.js` declared a `beforeEach` outside every `describe`. That hook
copied `framwork/.claude` and `framwork/.codeadd` into a temporary directory, walked all 332 markdown
and JSON files in the copy rewriting CRLF, and deleted the tree afterwards. Five of its 43 tests open
that directory. The other 38 read a built command straight out of the real tree and assert on its
text. They paid for the fixture anyway: 75.5 seconds of a 164-second run, 46% of the suite, for a
directory 88% of its tests never touched.

Three more files carried their own copy of the same hook. Four hand-written versions of one idea is
how a cost that has already been paid down comes back.

## What changed

**`cli/tests/helpers/tree-fixture.js`** is new, and it inverts when the copy happens. The template is
built once per test file, lazily, on the first `root()` call. Every call after that copies the
template instead of re-reading the source, and a test that never calls `root()` pays nothing.
Isolation is unchanged: each call returns its own directory, so no two tests can see each other's
writes. A missing source throws by default and names the command that produces it, because these
trees are build output; `optional: true` opts into a skip, which only the file that copies every
provider directory wants.

**The four consumers** now ask for the fixture where they use it. In `qa-reachability.smoke` the five
tests that open a project root take it themselves, because they sit in five different describes that
also hold tests which do not. In `injection-exclusivity` the three describes whose every test writes
to a root take it through one scoped hook, and the completeness describe takes nothing.
`injection-roundtrip` and `hotfix-review-0073` moved onto the same helper; in the latter, the two
tests that read only the registry and the fragment tree stopped taking a root at all.

`warnSpy.mockClear()` stayed global everywhere it was global, and so did the
`CODEADD_PLUGINS_CATALOG` setup, which is environment state rather than fixture state and now writes
to its own temporary directory instead of into a project root only some tests have.

**`cli/tests/graph-query.test.js`** gives its `history` block a 20-second budget. That block drives
the real `delivered.sh` against a real temporary git repository, on purpose — the verb owns the join
and delegates the read, so a mocked read would assert the one thing the design forbids reimplementing
there. The slowest test in it runs in 3.5 seconds idle and was seen taking 10.5 under load, crossing
the 5000ms default and reporting as a failure against a tree with nothing wrong with it. The block's
`beforeAll` carries the same budget explicitly, because a suite-level timeout option reaches tests
and not hooks, and the one subprocess in that setup sits in the hook.

**`cli/vitest.config.js`** keeps `fileParallelism: false` and replaces the comment that justified it.
The old text described a tree that no longer exists: `build.test.js` redirects its writes to a
temporary directory, and all four round-trip suites copy before touching. They only read the real
tree now, and concurrent readers do not produce EBUSY. Parallelism was measured rather than assumed —
208s and 2 failures serial against 153s and 12 failures parallel, back to back on one loaded machine.
All twelve are timeouts, all in files that spawn a subprocess, and the heaviest suite got slower
rather than faster because twelve workers were fighting over one disk.

## What it cost

| | before | after |
|---|---|---|
| suite, serial | 164s | 84-92s |
| `qa-reachability.smoke` | 75455ms | ~6900ms |
| `injection-exclusivity` | 25099ms | ~22000ms |
| `hotfix-review-0073` | 2337ms | 1989ms |
| tests | 1002 | 1018 |

The sixteen new tests are the helper's own. No existing test was removed, renamed or weakened: the
full test-name set from before the first change is still present, verified by diffing the reporter's
output rather than by counting `it(` call sites in source — a call site inside a loop registers one
test per iteration, which is how one file's "2 tests" was really 4.

Three deliberate breakages confirmed the tests still bite. Removing the OFF-state notice from a built
command turns red a test that LOST the fixture. Renaming a real injection anchor turns red both
round-trips that read the warning spy. Eight mutations of the helper were each caught by the level
that names it.

## Known gaps

`injection-exclusivity` was targeted at under 22 seconds and lands at 21979ms and 23140ms across two
samples. The threshold sits inside the run-to-run spread, so it is not reliably met. The file
improved by about 13%; the eight tests that still copy the template copy 948 files each, and every
provider directory in that copy is walked by a skill assertion, so nothing in it is dead weight.

`.claude/skills/add-framework-product-layer/SKILL.md` still explains the serial rule as "parallel
workers race on shared fixtures", which the config comment now contradicts, and its CLI-source table
does not cover the new `cli/tests/helpers/`. Both were left alone deliberately: the plan lists that
skill as untouched, and a test pins its wording verbatim.
