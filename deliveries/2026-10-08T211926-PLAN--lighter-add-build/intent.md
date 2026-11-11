---
path: bounded
topic: lighter-add-build
doc: none
delivery: confirm
ticket: 0034B
---

## Objective

[from conversation, no design document] Product `add-build` dispatches far fewer review, validation and readback agents per delivery, while what gets checked stays the same — users feel the build is faster.

## Decided
- One plan, one branch, one commit per cut; all F-blocks `[product]` — user's call, least effort.
- Cut 1, TASKS MODE: commit per task gated by the build only; validator runs once per area after its last task and reports ticks for all its tasks; its findings feed a normal fix round. Edit `add-build.md` (COMMIT CONTRACT, TASKS MODE step 5, STEP validate) and `add--subagent-driven-development` steps 5-6.
- Cut 2: remove readback from `add-build` entirely — frontmatter `agent: readback-agent`, STEP `read-plan-cold`, `Readback:` ledger lines, the "readback outcome" completion item. Align `add--review-discipline` (counts, by-site section, rationalisation row), `add--subagent-driven-development` ledger example, `add--ecosystem`, `add-new` text. `add-plan` readback, `readback-agent` and `add--feature-readback` stay.
- Cut 3: a fix round whose routed rows all come from build errors or test-agent `BLOCKED` skips re-review; its gate is build + tests green, and the Final Review reads that diff. Any reviewer-sourced row keeps re-review. Loosen the integrity check at `add-build.md` ~1157 accordingly.
- Cut 4: `add-build` appends ` at <sha>` (HEAD) to the `Final review:` line; `converge-gates.cjs` regex is prefix-anchored so it is unaffected (add a test proving it). `add-review` skips OWASP and spec audit when the ledger's last `Final review:` is `passed` or `ruled N` AND `git diff --name-only <sha>..HEAD` excluding the feature's docs folder is empty; area reviewers still run. `add-build` next step becomes `/add-done` only (drop the optional `/add-review` mention); `qa-pipeline/add-build.md` fragment follows. Router `add.md` unchanged (test L4.3).
- `ruled N` counts as passing — review ran in full; converge-gates already treats it as ok.
- Fix attempts stay at 3.
- Remove `product-close-out-parity.test.js` L11.x with a `Test-Removed:` trailer; add tests for the four cuts; `npm test` in the container.

## Open
None
