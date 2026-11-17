# Build ledger — plan: .codeadd/docs/plans/2026-11-16T204659-PLAN--pm-refinement-standard.md

Ruling: Design STOP not waited on — the operator approved the plan and the chain through v1.10.0 in their own words — nothing; the approval is on record in the run prompt
Ruling: Readback gaps (example-card text, Decisions 5/9/10 detail, exact test strings) — built from the card body file, which this build can read; test strings chosen by the build — costs a string rename if a stricter wording was wanted
Ruling: "six parts" read as Problem, Objective, What we expect, Decided, Open, Acceptance criteria — the plan lists exactly these — costs one sentence if wrong
RED (L1.1-L1.7, before any F-block): product-pipeline-parity L1.1,L1.2 fail; agent-mode L1.3-L1.6 fail; agent-mode-notion L1.7 fail (run output captured in the F-block commits' PR notes)
F1: complete (commits e83ec076..2e79f2cc, build.js clean, L1.1 RED->GREEN)
F2: complete (commits 2e79f2cc..242e7a97, build.js clean, L1.2 RED->GREEN)
F3: complete (commits 242e7a97..69a6d105, build.js clean, L1.3 L1.4 RED->GREEN; test anchors compared case-insensitively)
F4: complete (commits 69a6d105..79ca1cf3, build.js clean, L1.5 RED->GREEN)
F3: Ruling: the role handoff paragraph is one sentence 'Notion: card; otherwise the handoff is the intent file' — existing L1.11 asserts that literal — costs nothing; fixup commit 5e741cea covers F3 and F4
F5: complete (commits 5e741cea..b462b164, build.js clean, L1.6 RED->GREEN)
F6: complete (commits b462b164..ff6b0af8, build.js clean, L1.7 RED->GREEN)
L3.1: cold reader named the autosave draft, reopen with the same text, the under-2-s criterion and the excluded co-editing. It also marked 8 gaps (storage place, the "2. ..." placeholder, measure start, retention value...) — all are implementation or edge detail the product view leaves out on purpose, or the fictitious placeholder itself
Ruling: L3.1 counted as passed although the reader marked gaps — the plan's pass criterion names the four facts, all four were read correctly, and the gaps are implementation detail Decision 4 keeps out of a card — costs a stricter example card if the operator wanted zero marked gaps
F5: Ruling: audit finding (guide §9 lines 224/236/237 still intent-file only) accepted and fixed in commit after F6, worded without the word Notion because L2.4 bans it before §10 — costs nothing
F3: Ruling: audit finding "same turn as the approval" in add-brainstorm accepted — now "before the approval question" — one-approval rule kept
Ruling: audit finding on the repeated "stay as they are" sentence (3 places) rejected — each place is a different reader (role, guide, skill) and the plan lists it in F3, F5 and F6 — costs a trim if the duplication is judged noise
GRAPH: add--doc-schemas — 27 direct dependants (add-brainstorm changed; the others read sections they name and the change is additive); no entry
GRAPH: add--agent-notion — none; no entry
GRAPH: add-brainstorm, agent-mode/ roles and guide — NOT VERIFIED (agent-mode/ is not a graph node)
REVIEW: complete (10 findings, 2 applied, 8 rejected as already satisfied or accepted-by-plan)
