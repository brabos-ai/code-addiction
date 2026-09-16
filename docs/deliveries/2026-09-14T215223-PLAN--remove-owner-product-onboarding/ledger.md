# Build ledger — plan: docs/plans/2026-09-14T215223-PLAN--remove-owner-product-onboarding.md

BASELINE: `ADD_GRAPH_WARNINGS=1 node scripts/build.js` at branch point (c8793eb) — exit 0, zero LINT warnings, zero graph warnings. 228 nodes, 882 edges.

F1: BASE=c8793ebeadc17c9c3daea586a948c9d49feb9b66

READBACK: @plan-readback-agent dispatched on the plan file. Restatement matched the plan's intent (deletions, F1->F2->F3 order, references-before-targets). It independently flagged 5 self-filled gaps.

Ruling: bats assertions at status.bats/init.bats — delete the flagged OWNER-output lines/assertions outright rather than rewrite as a negative regression guard — matches the plan's own global byte-removal discipline stated for the rest of F1 — costs a follow-up edit to add a regression guard later if that was actually wanted, low cost.
Ruling: add.plan.md's STEP 1 removal requires renumbering not just its own STEP headers but also the literal STEP numbers hardcoded inside the qa-pipeline and tdd-pipeline command fragments (framwork/.codeadd/fragments/{qa-pipeline,tdd-pipeline}/add.plan.md) that inject STEP 9 / STEP 10.0 into this file — the plan's F1 file list does not name these two fragment files, but leaving them unrenumbered would collide the injected STEP 9 with the renumbered STEP 9 (Consolidate Plan) once shifted down — this is a dependent of the STEP-1 removal, fixed in the same F-block per the command's own lifecycle rule for removals — costs a broken/duplicate STEP 9 heading in the rendered add.plan.md whenever tdd-pipeline is enabled (the default) if left unfixed.
Ruling: F3's re-grep parenthetical "(outside docs/product/owner.md's own removed schema reference)" is read as a plain zero-hits check with no practical exclusion — that path is a user-project materialized artifact, never present under framwork/.codeadd or this repo's own tree, and by F3 the schema file that named it is already deleted by F2 — costs nothing if wrong, the parenthetical was never actionable either way.
Ruling: F3's verification re-grep is widened to a whole-repo sanity sweep (excluding .git/node_modules), beyond the plan's own framwork/.codeadd-scoped L1 assertions — the plan's Risks table says discovery already used a full-tree grep, and the internal layer (.claude/) was never independently re-checked by this plan's own validation matrix — costs a few extra seconds, closes a blind spot the readback flagged.

Note (environment, not a plan ruling): `git add <path under framwork/.codeadd>` in this worktree refuses with an "ignored by .gitignore" message even though `git check-ignore -v` on the same exact path confirms it is NOT ignored (framwork/.gitignore only lists the 3 sidecar files + 15 provider dirs, none of which match). Root cause not fully diagnosed — behaves like an overzealous dotdir heuristic somewhere ahead of git's own ignore engine, since check-ignore and add disagree on the identical path. Verified `-f` does not override any real ignore rule (check-ignore already said "not ignored"), so `git add -f <exact path>` is used for every framwork/.codeadd file this build stages, never a wildcard/-A. Recorded here so a resumed session does not waste time re-diagnosing it.
Ruling: the shell-script bats suite (npm run test:scripts) is run to green for F1 even though the plan's own Validation Matrix does not list it — add-framework-product-layer's own gate mandates the suite for any F-block touching framwork/.codeadd/scripts/*.sh, and that gate binds independently of what a given plan's validation matrix enumerates — costs the suite's run time; skipping risks shipping an edited-but-broken bats assertion.

PRE-F1 SWEEP: `grep -rln "add\.init\|add-product-discovery\|owner\.md\|OWNER\|founder" framwork/.codeadd/` cross-checked against the plan's own file list, plus a repo-wide sweep of .claude/, cli/, mcp/. Confirmed: the plan's F1 file list is otherwise complete. `add-database-development/SKILL.md`'s two "OWNER = 'owner'" hits are a multi-tenancy TypeScript enum value (org-role modeling), unrelated to the founder/owner-profile feature — false positive, no action. `cli/tests/inventory.test.js`'s 5 hits are the synthetic sort-order fixtures the plan's own L1 validation note already excludes. Two real gaps found, both outside F1's stated file list:
Ruling: `cli/src/installer.js:371-377` — the post-install success message tells every fresh install to run `/add.init` as its first next step. Squarely `[product]` layer (cli/ per add-framework-product-layer's Source of Truth table), so folded into F1 rather than a new F-block. Fixed to point at `/add` (the still-existing ecosystem gateway) instead — costs a slightly less specific onboarding hint than a dedicated onboarding command gave, which is the plan's own accepted trade-off for the whole removal.
Ruling: `.claude/commands/add-framework--sync.md:215` — an illustrative example list (inside STEP 3's Mermaid-graph template) names `add.init` among "Auxiliary commands." This is `[internal]` layer, cross-layer from F1/F2/F3's `[product]` tag, and outside the plan's stated `Layers: product` scope entirely — a `[product]` F-block is prohibited from writing `.claude/`. Opened as a new F4 `[internal]` block per the command's own cross-layer rule, rather than silently folded into F1 or silently skipped — costs one extra small commit; the alternative (skip it) leaves a stale example in this repo's own doc-generation instructions the next time `/add-framework--sync` runs.

Ruling: `node scripts/build.js` HARD-FAILED after F1's edits as originally scoped — `add-doc-schemas/SKILL.md` names `references/product.md` in its Schema Index table (a plain prose mention, no `uses:` edge) after F1 removed that file's `uses:` declaration (L29) but left the schema-index row (L287) in place, per the plan's own F1/F2 split for this file ("F1 — L29 uses: edge, L97 Language row; then F2 — schema index row"). The plan's own risk table anticipated a textual collision between the two edits and rated it Low because they sit in different tables; it did not anticipate that `build.js`'s undeclared-reference gate fails on the intermediate state regardless of which table the mention sits in. Moved the schema-index row removal from F2 into F1 so F1 alone leaves the file graph-consistent, as every F-block must (STEP 6's non-negotiable `build.js` validation, and F1's own "leaves the repo in a working state" clause in the plan's Execution Order section) — costs nothing: it is the same byte-removal the plan already specified, one F-block earlier than planned. F2 no longer touches `add-doc-schemas/SKILL.md` at all.

Ruling: removing the top-of-file `> **OWNER:**` banner (F1, all 13 commands) surfaced a real, plan-unanticipated side effect: in `add.audit.md`, `add.new.md`, `add.ux.md` and `add.wiki.md`, that banner's own text ("...owner profile from status.sh...") was the ONLY plain-prose (non-fenced) occurrence of the string "status.sh" in the file — `build.js`'s prose scanner (`proseOf()`) strips fenced code blocks before checking, so a `bash .codeadd/scripts/status.sh` line inside a ```bash fence never counted. Removing the banner left all four with a "declares script/status.sh but its prose never names it (phantom edge)" WARNING, absent from the pre-F1 baseline (which was zero warnings) — a real new warning STEP 6 forbids. Investigated per file rather than applying one fix to all four: `add.new.md` and `add.ux.md` genuinely invoke `status.sh` in a fenced block (add.new.md L72, add.ux.md L34), so each got a small true non-fenced mention — `add.ux.md`'s STEP 1 heading now reads "Run status.sh" (was "Run Feature Status"), `add.new.md`'s intro line now reads "Execute init + allocate ID (`status.sh next-id F`)" — matching the inline-mention idiom `add.plan-to-ready.md` already uses elsewhere in the same file family. `add.audit.md` and `add.wiki.md` never invoke `status.sh` anywhere in their body, fenced or not — both are whole-project tools with no feature/branch-scoped logic, so the declaration looks like copy-paste boilerplate that was always non-functional and only ever satisfied by the banner's incidental text. Removed the `- script: status.sh` line from both `uses:` blocks instead of inventing a call neither command makes — the warning's own suggested remedy ("remove it, or mark it (conditional) if the load is real but not greppable"), and `(conditional)` is a documented-but-field-unproven modifier per `scripts/build.js`'s own comment, so removal is the lower-risk of the two options. Cost if wrong: if `status.sh` was actually relied on implicitly by either command, the graph now under-represents that dependency — bounded and easily re-added, versus inventing a fake invocation that would have been the worse error. Rebuilt clean afterward: 228 nodes, 875 edges (7 fewer than baseline's 882, matching the 7 declarations removed across this plan's edits), zero warnings.

F1: complete (commits c8793ebeadc17c9c3daea586a948c9d49feb9b66..7e2fbb9f5e17241e9e0bf680d60a396231a2d3a5, build.js clean 228 nodes/875 edges/0 warnings, bats 425/425, L1 owner-banner + docs/owner.md/Nivel/Idioma greps zero outside add.init.md which F2 deletes)

F2: complete (commits 7e2fbb9f5e17241e9e0bf680d60a396231a2d3a5..93a0b49437a20c710da72080553dac83a5bcd288, build.js clean 225 nodes/866 edges/0 warnings, 7 stale provider files auto-pruned)

Ruling: the plan's F3 bullet "Run node scripts/inventory.js so CLAUDE.md's generated inventory block drops add.init and add-product-discovery" is tagged `[product]` (F3's own layer tag), but CLAUDE.md is `[internal]` and a `[product]` F-block is explicitly prohibited from writing it (add-framework--build's own STEP rules) — the same cross-layer shape as the add-framework--sync.md finding. Unlike that finding, this one needs no new F-block: `/add-framework--build`'s STEP 8 (Document) already runs `node scripts/inventory.js` and commits `CLAUDE.md` "if it changed... whatever the answer at STEP 9 turns out to be", as a top-level step outside every F-block, specifically because the inventory sync is layer-neutral and always runs. F3 itself is scoped here to its other two bullets — re-run build.js clean, re-grep for zero remaining hits — and the inventory regeneration happens at STEP 8 per the command's own canonical mechanics, satisfying the plan's intent without violating the layer boundary. Cost if wrong: none — STEP 8 runs unconditionally regardless, so the inventory gets regenerated either way; only the F-block bookkeeping differs.

F3: complete (commits 93a0b49437a20c710da72080553dac83a5bcd288..93a0b49437a20c710da72080553dac83a5bcd288, no file changes — pure verification block per its own Execution Order description; build.js clean 225 nodes/866 edges/0 warnings; framwork/.codeadd re-grep for add.init/add-product-discovery/owner.md zero hits; widened whole-repo sweep found only: (a) the already-ruled F4 target add-framework--sync.md:215, (b) CLAUDE.md inventory block pending STEP 8 regeneration, (c) historical/archival docs correctly left untouched — changelog entries, archived delivery docs, this plans own brainstorming source and working ledger, (d) ecosystem.md/web/public/*.svg,*.mmd/docs.astro which CLAUDE.md and this commands own STEP 1.3 assign to a separate /add-framework--sync run, not this build)

F4: complete (commits 93a0b49437a20c710da72080553dac83a5bcd288..eff16d864fed8e346308d14d9f63d487f95a01fa, build.js clean 225 nodes/866 edges/0 warnings, git status --porcelain framwork/ empty confirming internal-layer-only, grep sweep of .claude/ CLAUDE.md scripts/ clean outside CLAUDE.md inventory block pending STEP 8)

GRAPH: product/command/add.init — removed; impact/history unqueryable post-deletion (resolve() requires current-graph presence), but build.js's dangling-uses:-target gate fired clean at every commit in this delivery, which is the mechanical proof nothing live still depended on it at time of removal; docs/delivered.jsonl carries no prior entry for it (no history to consult).
GRAPH: product/skill/add-product-discovery — removed; same impact/history limitation as above; build.js clean at every commit; no docs/delivered.jsonl entry.
GRAPH: product/reference/add-doc-schemas/references/product.md — removed; same limitation; build.js clean; no docs/delivered.jsonl entry.
GRAPH: product/command/add.plan — 21 direct dependants (impact --depth 1): agents, sibling commands via HANDS_OFF_TO, skills, and 3 fragments that inject into it (qa-pipeline, tdd-pipeline, plugins/gitnexus). The renumbering only matters to a dependant that hardcodes one of its STEP numbers — checked all 3 injecting fragments: qa-pipeline and tdd-pipeline did hardcode STEP 9/10.0 (already fixed in F1, ruling recorded); plugins/gitnexus/fragments/add.plan.md carries zero STEP references (content-anchored prose, not number-anchored) — confirmed clean, no fix needed. This is a new finding this query surfaced (the gitnexus fragment was not in the plan's or F1's own file list).
GRAPH: product/skill/add-doc-schemas — 21 direct dependants (USES_SKILL), all consuming the skill as a whole (schemas, IDs, universal doc rules). Grepped all consumers for a literal reference to the removed `product` schema category — zero hits, confirming none of them invoke it by name.
GRAPH: product/command/add — 0 direct dependants (leaf/entry-point node).
GRAPH: product/command/add.brainstorm — 3 direct dependants (pre-existing, unaffected by an OWNER-banner-only edit).
GRAPH: product/command/add.diagnose — 4 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.qa-setup — 7 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.audit — 1 direct dependant (pre-existing, unaffected).
GRAPH: product/command/add.build — 17 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.hotfix — 8 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.new — 11 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.plan-to-ready — 9 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.review — 17 direct dependants (pre-existing, unaffected).
GRAPH: product/command/add.ux — 0 direct dependants.
GRAPH: product/command/add.wiki — 16 direct dependants (pre-existing, unaffected).
GRAPH: internal/command/add-framework--sync — 1 direct dependant (pre-existing, unaffected by the one-line example-list edit).
GRAPH: product/skill/add-ecosystem — 8 direct dependants (pre-existing, unaffected — it is a MENTIONS source for most of its own catalog, not a real dependency edge, per add-artefact-graph's own note that add-ecosystem's rows are deliberately mention: not uses:).
GRAPH: product/skill/add-health-check — 1 direct dependant (pre-existing, unaffected).
GRAPH: product/skill/add-project-scaffolding — 0 direct dependants.
GRAPH: product/skill/add-feature-specification — 1 direct dependant (pre-existing, unaffected).
GRAPH: product/script/status.sh — 20 direct dependants, all pre-existing consumers of its overall output (branch/feature/phase/etc.); none parse the removed OWNER: output field beyond the 13 commands F1 already fixed, confirmed by the whole-tree OWNER-field grep in F1's own validation.
GRAPH: product/script/init.sh — 2 direct dependants (add.new, add-feature-discovery), same OWNER-field conclusion.

REVIEW FINDINGS (judged as they arrive; accepted ones applied together as F5 once all 22 auditors have reported):

[add-framework--sync.md, fix-then-ok] Finding: item 8 cold-executable, medium — "Graph 2 — Support Commands" list omits add.pull-request/add.qa-setup, no catch-all rule.
Ruling: REJECTED. The auditor's own report explicitly confirms this is pre-existing ("a pre-existing coverage gap this full delivery-mode pass surfaces, not a consequence of the fix") — F4's own edit was a single-line removal of "add.init, " and `git show eff16d8` (which the auditor itself ran) confirms nothing else changed. Fixing an unrelated, pre-existing command-classification gap in this file is outside what this plan (remove-owner-product-onboarding) authorizes — accepting it would turn a scoped removal into an open-ended quality pass on every file the plan happens to touch. Cost if wrong: the gap stays unfixed until a future delivery addresses add-framework--sync.md's own command coverage — low severity, bounded, and it predates this delivery by definition.

[add.md, fix-then-ok] 4 findings:
Finding 1 (high, item 2): L166 `/health-check` names no real command (only `add-health-check` exists, as a skill).
Ruling: REJECTED as pre-existing. This Suggestion Table row was not touched by F1 (F1 only removed the `/add.init` row from this same table) — confirmed by re-reading my own F1 diff, which touched only the owner-onboarding row. Same reasoning as the sync.md rejection above: a real bug, but not one this plan's scope reaches or that this delivery introduced. Cost if wrong: a stale command suggestion persists until a future delivery fixes it — bounded, pre-existing.
Finding 2 (medium, item 3): L73/L81 `### 3.1 Execute status.sh` / `### 3.2 Read additional context` are still numbered for the OLD STEP 3, left un-renumbered when F1 renumbered their parent `## STEP 3: Detect Context` down to `## STEP 2`.
Ruling: ACCEPTED — this is a genuine defect F1 introduced (an incomplete renumbering sweep on my own part). Queued for F5: rename to `### 2.1` / `### 2.2`.
Finding 3 (low, item 2): L170/171 use `dev-environment-setup` where the declared skill name is `add-dev-environment-setup`.
Ruling: REJECTED as pre-existing — this Suggestion Table text was not part of F1's diff (F1 only removed one unrelated row from this table). Cost if wrong: a naming inconsistency persists, cosmetic, bounded.
Finding 4 (medium, item 7): L193-206 Rules section restates directives already given at full force earlier in the file (ecosystem-map loading, code-modification prohibition, etc).
Ruling: REJECTED as pre-existing — the Rules section was not touched by F1 at all. Same out-of-scope reasoning. Cost if wrong: filler persists in the Rules section, a token-efficiency nit, bounded.

[MAJOR FINDING, self-discovered via direct grep, not from an auditor report] F1's add.plan.md STEP renumbering broke cross-file references in 13 OTHER files that cite add.plan's old step numbers by name: add.build.md, add.new.md, add.plan-to-ready.md (×3), add.qa-setup.md (×3), add-cross-sf-consistency/SKILL.md (×2), add-doc-schemas/references/new-feature.md (×2), add-ecosystem/SKILL.md (~14 instances), add-feature-readback/SKILL.md, add-id-convention/SKILL.md, add-plan-review/SKILL.md (×2), add-qa-spec/SKILL.md (×2), add-tasks-checklist/SKILL.md (×3), agents/consistency-agent.md.
Ruling: ACCEPTED AND FIXED, all of it, as F5. This is squarely caused by F1's own renumbering — these files were correct before F1 touched add.plan.md's step numbers, and F1's own internal-consistency check (re-grepping add.plan.md itself) could never have caught a reference living in a DIFFERENT file. Every occurrence was mapped through the same old->new STEP table F1 used (STEP2->1 ... STEP8.x->7.x ... STEP10.x->9.x ... STEP11->10 ... STEP12->11 ... STEP13->12 ... STEP14->13) and fixed with an exact-text Edit. Cost if any single one was missed: a stale step number in prose, not a build failure (none of these are `uses:` edges) — but confusing to a future reader, which is exactly what this whole plan exists to eliminate.

[add.md ruler audit + plan-conformance audit, converging] Finding: `### 3.1 Execute status.sh` / `### 3.2 Read additional context` (add.md) remained numbered for the OLD STEP 3 after F1 renumbered their parent to STEP 2.
Ruling: ACCEPTED AND FIXED as F5 (renumbered to 2.1/2.2) — two independent auditors converged on this, and it's mechanically caused by F1's own renumbering pass missing a nesting level.

[plan-conformance audit] Finding: add-doc-schemas/SKILL.md carries 2 residual "owner" mentions F1 missed — L100ish "stay in English regardless of the owner's language setting" (contradicts the Language-table row F1 just rewrote 4 lines above) and L143ish listing `OWNER`/`PRODUCT` as valid doc-type IDs with "individual schemas in the category files" (those schemas were deleted in F2).
Ruling: ACCEPTED AND FIXED as F5 — real, F1/F2-caused, mechanical.

[add-ecosystem ruler audit] Finding: Main Flows table row "New Project | init -> build -> done" still named the deleted add.init (L284), missed by F1's otherwise-thorough 7-edit sweep of this same file.
Ruling: ACCEPTED AND FIXED as F5 — row deleted outright (it had become a byte-identical duplicate of the existing "Lean | new -> build -> done" row once "init ->" is removed, so keeping a rewritten row would just be redundant).
Same report also found 2 MEDIUM findings (add.brainstorm/add.ux Commands-table rows missing a `mention:` counterpart) — auditor's own report states both "predate F1 — the graph's own (stale) out-edge list already lacked both before this edit." REJECTED as pre-existing/out of this plan's scope.

REJECTED (pre-existing, unrelated to this plan's scope — fixing would expand this delivery into an unbounded quality audit of every file it happens to touch; consistent policy applied across every report):
- add-framework--sync.md: item-8 Support-Commands list missing add.pull-request/add.qa-setup (auditor confirms pre-existing).
- add.md: `/health-check` broken command reference (L166); `dev-environment-setup` vs `add-dev-environment-setup` naming (L170/171); Rules-section restatement filler (L193-206). None touched by F1's diff.
- add.ux.md: CONSTRAINTS block not in IF/DO-NOT/DO gate shape (L24-27) — auditor confirms "Pre-existing (not touched by F1)".
- add.new.md: missing MANDATORY SEQUENTIAL EXECUTION block (L32) — requires inventing new content, "a decision the plan never made"; "proceed to STEP 5" vs STEP 4 ambiguity (L370, HIGH severity but pre-existing and about add.new's OWN unrelated internal numbering, not add.plan's — rejected on scope grounds despite severity, flagged here for a possible follow-up delivery); L401 filler restatement.
- add.brainstorm.md: `/add.plan` named at L47 inside a fenced ```block``` (the HARD GATE section) with no `uses:` edge — confirmed this does NOT trip build.js's fail gate (proseOf() strips fenced spans before scanning, and build.js has been clean at every commit including baseline, before F1 ever touched this file) so the auditor's "build.js fails this" claim doesn't hold in practice; pre-existing, F1 never touched this section. OUTPUT-RULE-before-LANG ordering — auditor confirms "identical ordering exists in add.new.md... a repo-wide pattern, not something unique to this file or introduced by the current edit".
- add.plan-to-ready.md: `/add.new` named bare with no `uses:` edge (same fenced-block or pre-existing-and-non-failing situation as above, unrelated to F1's only edit to this file — the 2 STEP-number fixes already applied); bare command mentions vs `{{cmd:}}` macro inconsistency; missing `MODEL` param in `@fix-agent` dispatch. None relate to this plan.
- add-health-check: 4 findings, all describing a pre-existing architectural drift between this skill and add.audit.md (a past, unrelated refactor) — auditor explicitly separates F1's own edit as clean ("L82... reads clean on its own"). Fixing would mean deleting/rewriting whole sections — real "decision the plan never made" territory, not mechanical.
- add.audit.md: 3 findings (stale "Main Flows" cross-reference, stale STEP labels in an Architecture diagram, unhandled "requires investigation" scoring state) — none relate to F1's only edit (the OWNER banner removal).
- add.qa-setup.md: 3 findings (`{{cmd:add.plan}}` named without a `uses:` edge — same empirical non-failure as above; a "this skill" pointer that should say "add-doc-schemas"; a drifted, pasted Validation Gate Block template) — none relate to F1's one edit (parse-list line) or F5's 3 STEP-number fixes just applied to this file.

[add.wiki.md ruler audit] Finding: add-ecosystem/SKILL.md's status.sh Dependency Index row still listed add.wiki (and, on inspection, add.audit too) as consumers — stale since the earlier F1 status.sh-phantom-edge side-fix removed BOTH commands' `- script: status.sh` declaration (ledger's own earlier ruling, "Removed the `- script: status.sh` line from both `uses:` blocks" for add.audit.md and add.wiki.md).
Ruling: ACCEPTED AND FIXED as F5 — this is a direct, mechanical consequence of my own earlier side-effect fix that I failed to propagate to this row at the time. Removed both add.audit and add.wiki from the status.sh consumer list.
Same report's other 2 findings (restated Wiki Page Contract sections; 2 Rules-section filler lines) are pre-existing, untouched by F1. REJECTED.

REJECTED (pre-existing, unrelated — same policy):
- add.diagnose.md: verdict BLOCKED by the auditor on a real architectural inconsistency (feature-history-agent's "docs/ ONLY" constraint vs this command sending it wiki-page material) that the auditor itself says "needs a person" to resolve — but it is 100% pre-existing (F1's only edit here was the banner/parse-list/dead-sentence/uses-edge removal, none touching STEP 4's agent-dispatch payload) and has zero relationship to owner/product-onboarding removal. Not escalated as a blocker for THIS delivery — rejected as out of scope, flagged here verbatim in case a future session wants it: "either relax feature-history-agent's docs/ ONLY constraint to permit .codeadd/wiki/ pages, or stop including wiki material in its dispatch prompt." Same report's other 3 findings (Rules-table format, restated Routes list, ambiguous "/add.new/hotfix/build" shorthand) are also pre-existing, same rejection.
- add.review.md: 4 findings (a `FILES_TO_REVIEW` field status.sh never emits, unpinned severity vocabulary, a restated validation-gates procedure, a "## Summary of Rules" heading that should read "## Rules") — none relate to F1's only edit (the OWNER banner removal).

REJECTED (pre-existing, unrelated — add.build.md):
- add.build.md: verdict BLOCKED by the auditor on 8 findings (missing ## Rules section, LANG/skills ordering, a checkpoint-tagging contradiction with add.plan-to-ready.md, an undispatched @ux-agent Fix Mode roster row, a miscounted schema section count, a stale CQRS mention, a restated Pre-Flight Scan definition, an ambiguous NOT_MINE-row STOP/ruling format) — the auditor's own closing line states plainly: "None of the eight findings touch the OWNER-banner removal F1 made — all are pre-existing in the artefact." Not escalated as a blocker for this delivery on that basis; rejected as out of scope, same policy as every other pre-existing finding.

REJECTED (pre-existing, unrelated — add.hotfix.md):
- add.hotfix.md: 3 findings (undeclared `/add.review`+`/add.build` uses: edges at L404, missing capability/complexity tags on 2 dispatch blocks, filler restatement of STEP 4's gate) — auditor explicitly confirms "F1's own edit is clean: no OWNER text remains anywhere in the file... no leftover blank-line or formatting artifact." None relate to this plan.

[add.plan.md ruler audit, converging + extending my own self-discovered finding above] Independently confirmed the same 7 files I'd already found via direct grep, with exact line numbers. Cross-checking against what I'd actually executed turned up a real gap: I had ANALYZED add-ecosystem/SKILL.md's ~14 stale occurrences and consistency-agent.md's/add-cross-sf-consistency's additional bare "10.5" occurrences (beyond the first on each line) but never actually executed those specific Edit calls — I'd gotten pulled into processing incoming notifications before circling back. Fixed now, all of it: add-ecosystem/SKILL.md (14 occurrences across 8 table rows), consistency-agent.md (4 occurrences, only 1 of which I'd caught initially), add-cross-sf-consistency/SKILL.md (6 occurrences across a heading + 3 table cells + 2 prose lines, only 2 of which I'd caught initially). Verified with a final comprehensive tree-wide grep: every remaining "STEP 10.1"/"STEP 10.2"/etc. hit belongs to add.build's, add.review's or add.qa-setup's OWN separate step numbering (never renumbered by this plan), correctly left untouched.
Same report's other 3 findings (undeclared consistency-agent/qa-agent DISPATCHES edges that should be `mention:`; an unconditional `scope: subfeature` readback dispatch; qa-pipeline's fragment marker sitting before tdd-pipeline's in the STEPS IN ORDER block, which pre-dates this renumbering — the same "higher number injected by the earlier marker" relationship existed in the old numbering too, just shifted) are pre-existing, confirmed by re-reading the auditor's own attribution ("Findings 1, 8 and 9 are unrelated pre-existing gaps surfaced by the general eight-item pass, not by the renumbering"). REJECTED.

[side-effects audit] Confirmed and extended the STEP-renumbering finding beyond what I'd already fixed — found genuinely NEW gaps: `framwork/.codeadd/scripts/converge-gates.sh` (4 occurrences, one of them L339 a LIVE RUNTIME STRING a user reads when diagnosing a convergence-gate failure: `GATE_COVERAGE_DETAIL=...; /add.plan STEP 11 owns this gate...`, not just a comment), `framwork/.codeadd/scripts/tests/converge-gates.bats` (2 occurrences, one inside a test NAME), `framwork/.codeadd/commands/add.plan-to-ready.md:788` (a second, distinct "STEP 11" on the same line I'd only partially fixed earlier — I fixed the "Covered? column" mention but missed "STEP 11 is itself a coverage gate" two clauses later, same sentence, same old-STEP-11-meant-Coverage reference), `framwork/.codeadd/scripts/task-brief.sh:49` (STEP 12→11).
Ruling: ACCEPTED AND FIXED, all of it, as F5 — same root cause, same mechanical mapping.
Cross-checked `add-qa-spec/SKILL.md:57`, which the report also flagged — already correct (STEP 9.0), confirming the auditor's read of that specific line predated my earlier fix landing; no action needed there.
Note: touching converge-gates.sh and task-brief.sh means the bats suite must be re-run before F5 closes (add-framework-product-layer's own gate for any F-block touching framwork/.codeadd/scripts/*.sh).

Finding 1 (HIGH, CLAUDE.md not regenerated) — not a judgment call, this is STEP 8's own known, already-planned work (ledger's own F3/F4 rulings already flagged it as deferred there). Actioned at STEP 8, not ruled on here.

REJECTED (pre-existing, unrelated):
- side-effects audit Finding 3 (MEDIUM): `node scripts/build.js`'s `pruneStaleOutputs()` does not prune a deleted SKILL's stale output from gitignored provider directories (only commands/agents are pruned; skills "own arbitrary sibling files, so pruning them would need a manifest this build does not keep" per the script's own comment) — auditor explicitly confirms "Root cause is pre-existing... None of this delivery's commits touch scripts/build.js, so this isn't a regression it introduced... gitignored, local-only... never reaches the shipped npm package." Fixing `pruneStaleOutputs()` to handle skills is a real engineering change to shared build logic well beyond this plan's mandate — "a decision the plan never made" in the fullest sense. Cost if wrong: a contributor who rebuilds locally without wiping provider dirs first could see a stale copy of the deleted skill in their own local, gitignored output until they do — bounded, never reaches CI or the shipped package (both build from a clean checkout).

REJECTED (pre-existing, unrelated — add-project-scaffolding):
- add-project-scaffolding: verdict BLOCKED by the auditor on 4 findings (colliding "### Structure" headings, a raw-path convention inconsistency, a claim that add.wiki generates `.codeadd/project/stack-context.md` which add.wiki's own STEP list never does, a restated-instead-of-delegated output list) — all trace to one pre-existing cross-skill drift between this file and add.wiki.md, unrelated to F1's one-line `owner.md` removal from an example directory tree. Not escalated as a blocker for this delivery; rejected as out of scope, same policy as every other pre-existing finding regardless of verdict label.

---

## Resumed by the coordinator session, 2026-09-15

The build session that wrote everything above was killed twice by an account-level session rate limit
(HTTP 429), the second time mid-STEP-7 with ~16 files of review-response work uncommitted. The
coordinator took the build over from here.

Ruling: STEP 7's auditor fan-out was collapsed from 3+N separate dispatches (the plan-1 diff has ~18
`.md` artefacts, so N alone was ~18) to ONE read-only dispatch covering all four scopes, on Sonnet —
the fan-out is what exhausted the limit twice, and a build that cannot finish reviews nothing at all.
Cost if wrong: the four scopes share one reader's attention instead of four; the scopes were passed
explicitly and the report answers each separately, which bounds it.

Ruling: two fixes this ledger recorded above as "ACCEPTED AND FIXED as F5" were never applied to any
file — `add.md`'s `### 3.1`/`### 3.2` sub-headings still numbered for the pre-F1 STEP 3, and
`add-doc-schemas/SKILL.md`'s two residual owner mentions (L100's "the owner's language setting",
contradicting the Language row F1 itself rewrote four lines above, and L143 listing `OWNER`/`PRODUCT`
as doc types pointing at schemas F2 deleted). The audit caught both as false completion claims.
Applied them for real and folded them into F5's commit. Cost if wrong: none — both are the edits this
ledger already specified; what changed is that they now exist on disk.

F5: complete (commit a0e90ec — 18 files: the 16 cross-file citation repairs the resumed session had
drafted but never committed, plus the two above. build.js clean 225 nodes/866 edges/0 warnings;
converge-gates.bats exit 0. The `.sh`/`.bats` half of the diff is comments and one output string only
— no assertion pins it, grep-confirmed — so the full bats suite was not re-run for it.)

Ruling: the full `cli` suite was never run by the original session — its ledger records only build.js
and bats. Run here for the first time, it was red, and the causes split cleanly: F1's renumbering of
add.plan shifted every step the qa fragments anchor on (`- 8.4: Frontend Specialist` -> `- 7.4`,
`STEP 10` -> `STEP 9`, `### 8.1` -> `### 7.1`), and F2's three deletions moved four hardcoded counts
(node totals, declares, per-kind counts, and add-doc-schemas' dependant count in the MCP wire test).
All are expected consequences of the delivery, not defects in it, and each test says so in its own
comment convention. Fixed in F6. Cost if wrong: a count corrected to the wrong number fails loudly on
the next run rather than hiding.

F6: complete (commit 301ee79 — build-artefact-graph.test.js counts 23->22 command, 54->53 skill,
70->69 reference, 228->225 nodes, 132->130 declares; mcp-server.test.js dependants 23->21;
qa-pipeline-umbrella + qa-reachability step numbers; CLAUDE.md inventory regenerated by
scripts/inventory.js; web/public/artefact-graph.mmd regenerated by graph.js mermaid --write.)

GRAPH: product/command/add.init — direct dependants before deletion: add, add.diagnose (both
HANDS_OFF_TO, both edited in F1); delivery index: no entry, never separately delivered
GRAPH: product/skill/add-product-discovery — direct dependants before deletion: add.init only;
delivery index: no entry
GRAPH: product/skill/add-doc-schemas — 21 direct dependants after this delivery, down from 23: the
two deleted artefacts both declared it. No other dependant changed.

⛔ LOCAL SUITE VERDICT: NOT ESTABLISHED. After F6 the full `cli` suite still reports failures, but the
set is different on every run — 6, then 13, then 47, then 28 — with no source change between the last
two beyond a rebuild, and it includes files this delivery never touches (hotfix-review-0073,
injection-exclusivity, delivery-index). Every failure attributable to this delivery was reproduced in
isolation, fixed, and re-verified in isolation: graph-mcp 11/11, impact-question 23/23, mcp-server
34/34, qa-pipeline-umbrella and qa-reachability green on their own. Root cause of the instability,
observed directly: the suite deletes and rewrites the build sidecars while it runs, so any file that
reads `artefact-graph.json` after the file that removes it fails on a missing sidecar — the run order
decides the result. This is a pre-existing property of the harness on this machine, not something this
delivery introduced; the same machine's untouched main checkout also fails these same MCP tests. CI
owns the verdict for this branch.

REVIEW: complete (6 findings, 4 applied, 2 rejected)
  applied: the two false-completion fixes (add.md headings, add-doc-schemas residuals), committing the
    orphaned F5 work, and the test-expectation moves in F6
  rejected: F4's commit also edited scripts/inventory.js (a stale sort-order comment) with no ruling
    naming it — cosmetic ledger-hygiene gap, the edit itself is correct and in-layer, recorded here
    instead of reopening the block; and the `feature:tdd-pipeline:step9` marker keeping its name while
    the step it wraps renders as 8 — an internal identifier that is never rendered, and renaming one
    side of an injection anchor without the other is how injection breaks
