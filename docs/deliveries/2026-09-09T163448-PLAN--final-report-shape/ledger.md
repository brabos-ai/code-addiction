# Build ledger — plan: docs/plans/2026-09-09T163448-PLAN--final-report-shape.md

READBACK: complete (cold reader agreed on files, order and rationale; 6 gaps marked, 3 ruled below)
Ruling: command-specific structured extras trail AFTER the seven blocks and before the metadata; only plain facts fold into block 2 — the readback read Validated Decisions' "the command's own facts become the middle bullets" against L4.1's "before the ledger path, the commit brackets and the rulings" as conflicting, and a rulings TABLE cannot be a bullet — costs a second pass over 21 files if the user wanted them nested inside a block
Ruling: the banned-phrasing table moves with all six of its rows, and the two plan-specific rows ("The plan adds a section on X", "Restating the Problem section") are generalized to any command output — the plan named four rows as examples and F1 must not ship a shorter ban list than the one it replaces — costs a lost ban if a generalization changes a row's meaning
Ruling: F2 proves the five inherited blocks moved verbatim by diffing the new file against the pre-F2 git version of the source section — the readback marked that no stated check (L3.1-L3.5) catches a paraphrase of moved text — costs one extra command per block if unnecessary, catches a silent rewrite if not
F1: complete (commits 0b9ad71..d0081fe, build.js exit 0 / 0 warnings vs 0 baseline, framwork/ clean, L3.5 pass)
Ruling: dropped the mention: entries for add-plan-authoring and add-build-ledger from F1's uses block — the prose gate flagged both as stale acknowledgements after the final wording stopped naming them — costs nothing; a later edit that names either must re-declare it
F2: complete (commits d0081fe..93cdf5b3315c511728eae88bbf32f921c02c932c, build.js exit 0 / 0 warnings, framwork/ clean, L3.3 pass: heading absent, 1 prose ref)
Ruling: dropped the mention: entry for /add-framework--build from add-plan-authoring — its only prose mention was the "Where it plugs in" example inside the section F2 moved out — costs a re-declaration if a later edit names the command again
F3: complete (commits 93cdf5b..8a9019e983b111812862d6c0c4cb036b632d699e, build.js exit 0 / 0 warnings, framwork/ clean, L3.6 34/34 facts preserved, 6/6 declare + load)
F4: complete (commits 8a9019e..a844c0ff25ee75a0a00962cfa13951e85493cead, build.js exit 0 / 0 warnings, framwork/ clean, STEPS IN ORDER block updated to name STEP 8)
F5: complete (commits a844c0f..c18e6192f9ce4e4fa07eef2106a502877173c52e, build.js exit 0 / 0 warnings, L1.2 5/5 provider dirs, L1.4 key present, L2.3 clean, L3.5 pass)
Ruling: registered the skill by surgical text insert into provider-map.json, not by json.dumps — a full re-serialize reformatted 190 lines of a column-aligned file for one key — costs nothing; the file keeps its alignment convention
Ruling: read L2.3 as scoped to the new product skill, not to every product command — add.md and add.qa-setup.md already name a ".claude/" path, and both mean the USER's own installed provider directory, not this repo's internal layer — costs a missed leak only if a future product command references this repo's internal tree, which the same grep still catches when scoped to files the build touched
F6: complete (commits c18e619..538b604bc2cc54826cc4ac1a0c0df3620444749e, build.js exit 0 / 0 warnings, L3.6 21/21 facts preserved, .claude/ untouched)
Ruling: ran the L3.6 grep whitespace-insensitive for add.review after a line-anchored grep reported a false MISS — the edit reflowed "reviewers dispatched (files reviewed per reviewer)" across a different line break without changing a word — costs nothing; the flattened comparison is the stricter of the two
F7: complete (commits 538b604..23d02e34d27e7d1f06eba38dec3c7f5b6975c81c, build.js exit 0 / 0 warnings, L3.6 29/29 facts preserved, .claude/ untouched)
Ruling: reworded add.brainstorm's "the ONLY allowed output at STEP 6" to "the ONLY allowed form the handoff itself may take" — as written it banned the report the plan requires, and its real intent is the prohibition directly above it, not to run the next command — costs the guard's strictness if a future reader reads "form" as looser than "output"
Ruling: accepted add.new's "Summarize created artifacts" reworded to "summarize the created artifacts" — the sentence now continues a clause instead of opening one, and the fact is unchanged — costs nothing; no fact list item was dropped
F8: complete (commits 23d02e3..0d6a8ace5d8845f0e5b1c7dfd7e04ecc1b2a5562, build.js EXIT=0 / 0 warnings, L3.6 8/8 facts preserved, STEPS IN ORDER blocks updated, .claude/ untouched)
F9: complete (commits 0d6a8ac..efeb2eb7b2186440508370308c360cdf493c7878, build.js EXIT=0 / 0 warnings, framwork/ clean, product sibling named in prose only per plan)
F10: complete (commits efeb2eb..75ab62413cab78c6c98af141841f8af1c944dbf1, build.js EXIT=0 / 0 warnings, framwork/ clean, L1.3 inventory lists add-final-report, block regenerated not hand-edited)

F11: complete (commits 34d7649, review findings, product layer; build.js EXIT=0 / 0 warnings, cli suite serial 41 files / 954 pass / 1 skip, .claude/ untouched)
F12: complete (commits 8c947ff, review findings, internal layer; build.js EXIT=0 / 0 warnings, framwork/ clean)
REVIEW: complete (28 findings, 18 applied, 10 rejected)

--- L3.6 per-file evidence, expanded after the review asked for it ---
F3 34/34: add-framework--plan 5, --build 7, --done 9, --brainstorm 3, --sync 5, --roadmap 5
F6 21/21: add.plan 4, add.build 7, add.review 3, add.hotfix 2, add.pull-request 2, add.plan-to-ready 3
F7 29/29: add.new 4, add.brainstorm 4, add.audit 5, add.init 4, add.qa-setup 6, add.wiki 6
F8 8/8: add.done 5, add.diagnose 3
Method: exact-string grep per item, whitespace-flattened where an edit reflowed a line.

--- rejected findings, with reasons ---
Ruling: rejected "the product skill ships an HTML comment naming the internal layer" — measured it: source 141 lines, all five built copies 126 lines, zero HTML comments, zero internal jargon; the auditor asserted the opposite without measuring — costs nothing, and the first auditor's reading was the correct one
Ruling: rejected "roadmap item 3 is still open and cites a deleted heading" — /add-framework--done drops a delivered item after the merge, and git log shows that as its own commit twice; the citation describes the problem as it stood, which is what a roadmap item is for — costs a stale citation surviving if done skips the drop
Ruling: rejected "add-doc-schemas still says completion summary" — the plan's Does NOT Include forbids touching that skill, and the gate placement the sentence describes is still correct for every command — costs one stale term in a file this plan may not edit
Ruling: rejected "the historical changelog names add-plan-authoring as owner of the closing report" — a changelog records what was true on its date — costs nothing
Ruling: rejected "ecosystem.md and web/src/pages/docs.astro omit the new skill" — both are generated or curated by /add-framework--sync and both already carry drift older than this branch — costs an out-of-date public doc until sync runs before release
Ruling: rejected "the product skill lacks an ## Overview heading" — its structural siblings are the internal-layer skills, which open the same way — costs a cosmetic inconsistency with the doc-schema skills
Ruling: rejected "closing steps do not use IF/DO-NOT-USE condition blocks" — no tool is at stake in writing a message; the two spots where ambiguity was real were fixed instead — costs a formal inconsistency with building-commands' gate format
Ruling: rejected "add.new's closing is ## Completion, not ## STEP N" — pre-existing, and renumbering that command's steps is not this plan's work — costs one heading out of form
Ruling: rejected "add.pull-request kept the heading Completion Summary" — it is a completion summary — costs nothing
Ruling: rejected "pre-existing numeric caps in add.plan and add.wiki" — real, and out of scope: the plan changes the shape around a command's facts, never the facts — costs leaving a doc-schema violation for a follow-up
L4.1: PASS (live). Re-read .claude/commands/add-framework--build.md STEP 10 from disk after F3 committed; the rewritten text loaded and the closing report below follows it. The level did not degrade to inspection.
L4.2: PASS (inspection). Read add.build.md STEP 17 and add.done.md STEP 9 end to end; both name what the command will print and both were corrected in F11 where they did not. Recorded as an inspection result, not as a passing test.
