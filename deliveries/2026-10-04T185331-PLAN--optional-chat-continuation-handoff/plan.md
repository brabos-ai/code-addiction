# Plan: Optional chat continuation handoff

> **Status:** delivered — PR #102 open, CI green, awaiting explicit close-out
> **Layers:** product
> **Type:** workflow
> **Created:** 2026-10-04
> **Delivery:** confirm
> **Ticket:** 0018B

## Objective

[from conversation, no design document]

Allow the user to continue the development flow in a fresh context without writing instructions or reconstructing settled decisions. At manual command completion, offer a copyable next-command invocation with concise, complete activity instructions pointing to official documents.

**When this build is done:** a finishing command with an actionable next activity will offer continuation instructions after its complete report. Acceptance will produce only one copyable block; it will execute nothing and create no handoff file. Automatic continuation will retain its existing behavior.

**Ticket done when:** Executar add-review sobre uma feature com findings gera um arquivo em docs/features/<feature>/_instructions/YYYY-MM-DDTHHMMSS-<slug>.md com decisões confirmadas, routing vigente, caminhos relativos existentes e checks; o encerramento entrega /add-build com o caminho relativo direto; uma sessão nova usa esse arquivo sem pedir novamente decisões já fechadas nem executar routing substituído; a cobertura de cada comando e dos casos sem feature/próxima ação fica definida e verificada.

**Superseded acceptance:** the paragraph above is the original board criterion, preserved verbatim for traceability. The user explicitly replaced file persistence in this conversation. Completion is governed by R1–R8 below, not by creation of `_instructions`. Before claiming ticket completion, route an administrative update of 0018B's `done_when` to `/add-framework--backlog`, the separate publication owner, using the approved chat-only R1–R8 criteria. This board-record alignment is outside product F1–F6, changes no internal pipeline artefact and uses the native publication entry. If that update does not publish, report it as pending and never claim the original file-based criterion passed. Do not implement the discarded file design.

## Context

The user first requested persistent instructions, then explicitly chose a simpler chat-only handoff. Final approval: manual completion asks whether to receive continuation instructions; acceptance returns only the next command and the complete copyable activity text. The user invoked planning directly and authorized writing now. No brainstorm design or intent file was written. Delivery therefore defaults to confirm; this request authorizes planning, not implementation.

AGENTS.md and both ecosystem/path maps were available. Optional strategy documents under `docs/strategy/` were absent. Current relationships were queried through the artefact graph by the discovery agent. Delivery-index history remains NOT VERIFIED: the Windows/WSL invocation failed with exit 127, tracked separately as 0021B. Archived plans provide prior context, not a substitute for a successful history query.

## Global Constraints

- “com o usuario confirmando a LLM apenas responde com o proximo comando e o texto completo para ser copiado” (user, final design change).
- “na real eu prefiro que nas instrucoes tenha o apontamento dos documentos oficiais com instrucoes bem enxutas e com orientacoes a respeito da atividade” (user).
- “vamos deixar mais enxuto com o agente entregando o proximo comando a ser executado” (user; replaces `_instructions` persistence).
- “Emit the report BEFORE any metadata.” (`add--final-report`, The Rule That Comes First; applies to the initial completion response, not the later accepted instruction-only response).
- “Absent means `confirm`.” (`add--delivery-mode`, The Two Modes).
- “Every stop in `/add-done`.” (`add--delivery-mode`, Stops that are deciding in every state; preserve user-controlled close-out).
- Preserve authored injection slots, member markers, fallbacks and existing STEP IDs. This plan changes completion prose, not slot membership, STEP identity or injection composition.
- This delivery runs in an isolated git worktree on its own branch, never in the primary checkout (user, 2026-10-04; overrides the recommendation at `/add-framework--build` STEP 1.3).
- Every F-block is driven RED first — a check authored and confirmed failing for the right reason before the prose it guards changes, then GREEN (user, 2026-10-04; strengthens the RED-first discipline this Validation Matrix already declares).
- The delivery ends with its PR open: the answer to `/add-framework--build` STEP 9's first-push question is affirmative (user, 2026-10-04). The question is still asked and still waits — this states the intended answer, never a bypass.
- CI is watched to green on the PR with `gh pr checks --watch --fail-fast`, the command `/add-framework--done` already uses (`.github/workflows/ci.yml`; `add-framework--done` STEP 4).

## Problem

1. Existing next-command lines omit activity-specific context needed by a fresh session.
2. Manual and automatic handoff share unconditional printing instructions; a common rule alone would conflict with local closing sections.
3. Replacing the report with a copyable prompt would lose mandatory findings, rulings, gate tables and evidence. The instruction-only response must be a separate turn.

## Proposal

Extend existing owners. `add--final-report` owns the two-response output contract and compact instruction content. `add--delivery-mode` owns eligibility and preserves execution boundaries. Commands select their concrete next activity and supply official references. `add--ecosystem` reflects the routing semantics and the existing exemptions.

No new command, skill, agent, parser, runtime file or schema is needed. Prefer this over a standalone handoff skill, which would add a fourth owner and repeated loads, or per-command templates, which would duplicate the same state transition across closings. Persisted prompts were rejected by the user and are not an alternative for this build.

### Continuation contract

| State | Required outcome |
|---|---|
| Normal top-level manual completion, actionable agent activity | Emit all report blocks, mandatory tables and metadata first; finish with one localized yes/no offer to receive instructions for a fresh context; wait. |
| User accepts the pending offer | Respond with exactly one fenced plain-text block. Start its content with the complete next-command invocation, then concise activity instructions, official paths and applicable confirmed decisions/restrictions. No introduction, report, footer or execution. |
| User declines | End the pending handoff without a block, tools or repeated offer. |
| No actionable activity | Finish normally without the offer or an invented continuation. |
| Automatic handoff | Preserve existing printed handoff and same-session command execution from its first step; no new offer. |
| Existing deciding stop or incomplete command | Preserve its original decision/failure handling; do not substitute the continuation offer for it. |

The initial response can identify the next activity in ordinary prose; defer the full copyable invocation until acceptance. A later acceptance is scoped to the last explicit pending offer, not an earlier approval of design, staging, publishing or merge. Ambiguous replies do not execute anything.

The block is complete for its activity, not a transcript. Include command arguments/feature or subfeature scope, objective/action, actual official document paths with their roles, and only the decisions/restrictions needed to act. References remain authoritative. In a review correction, name the current review and Fix Routing; retain finding identity and supersession decisions, preserve other sessions' work and evidence, and instruct the recipient to check current state before reapplying fixes. Omit irrelevant optional references and never invent a path, target feature, patch or approval.

Use actual project-relative paths in the produced text and keep existing command-specific path semantics. No universal `@file` handoff parser is introduced; the diagnosis-to-hotfix `@report` interface remains intact. Invocation spelling must follow the provider's declared capabilities (e.g. command-as-skill invocation where slash commands are unavailable), without changing the canonical command identity.

The shared rule applies only to a top-level finishing command. A worker/subagent loading final-report or a backlog operation nested inside another command must not start a competing continuation conversation. A top-level backlog operation offers continuation only if its host has selected an actual next development activity; otherwise it ends normally.

## Current State

Graph depth-1 direct dependants: final-report 14, delivery-mode 7, ecosystem 6, all HIGH risk. All three currently have empty dependency sets and no strong graph path between owners. All finishing commands directly use final-report. Five commands directly use delivery-mode. The command graph includes injected fragments; discovery separately queried their dependencies, including QA/TDD build fragments that use delivery-mode. Tests, registries, AGENTS.md and root scripts are outside graph coverage. AGENTS.md requires no change for this delivery.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/skills/add--final-report/SKILL.md`: define the two-response contract, content rules and top-level eligibility boundary; preserve report facts in the initial response and exempt the subsequent instruction-only response from seven-block formatting.
  - **Produces:** `chat-continuation-output-v1` (two-response output and instruction-content contract).
- **F2** [product] — `framwork/.codeadd/skills/add--delivery-mode/SKILL.md`: replace manual unconditional next-command printing with the optional instruction offer, referring to F1 for output shape; preserve automatic execution, deciding stops and semi-automatic semantics. Add only the required same-layer relationship declaration.
  - **Consumes:** `chat-continuation-output-v1` (F1).
  - **Produces:** `chat-continuation-eligibility-v1` (manual completion eligibility; automatic/deciding boundaries).
- **F3** [product] — `framwork/.codeadd/commands/add-brainstorm.md`, `add-new.md`, `add-plan.md`, `add-build.md`, `add-review.md`: wire existing completion anchors to both contracts, preserve command-specific reports and current routing, remove conflicting manual print-and-stop rules. For build's existing confirm-mode subfeature checkpoint, retain checkpoint output and offer the same optional copyable continuation at that existing boundary; preserve semi-automatic's execution decision and automatic chaining.
  - **Consumes:** `chat-continuation-output-v1` (F1); `chat-continuation-eligibility-v1` (F2).
- **F4** [product] — `framwork/.codeadd/commands/add-audit.md`, `add-diagnose.md`, `add-done.md`, `add-hotfix.md`, `add-pull-request.md`, `add-qa-setup.md`, `add-wiki.md`: integrate the top-level manual offer at current closings when an actual next agent activity exists. Advisory-only commands remain advisory. A standalone run without a mode carrier is manual; never infer automatic from conversational tone.
  - **Consumes:** `chat-continuation-output-v1` (F1); `chat-continuation-eligibility-v1` (F2).
- **F5** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: document optional manual chat handoff and align next-step rows with concrete actionable continuation. Preserve router/UX exemptions and avoid automatically proposing a new unspecified feature at done. Keep catalogue edges as mentions.
  - **Consumes:** `chat-continuation-output-v1` (F1); `chat-continuation-eligibility-v1` (F2).
- **F6** [product] — `cli/tests/chat-continuation-handoff.test.js` (new), `cli/tests/product-pipeline-parity.test.js`, `cli/tests/optional-review-build-final-review.test.js`, `cli/tests/product-close-out-parity.test.js`, `cli/tests/hotfix-diagnosis-review-contract.test.js`: add focused contract/coverage assertions, adapt only assertions that require the replaced unconditional manual output, and retain automatic/close-out/review protections. Author the failing checks before F1; F6 completes integration and evidence after the prompt changes. Static checks establish authored contracts, not proof that every LLM follows them.
  - **Consumes:** `chat-continuation-output-v1` (F1); `chat-continuation-eligibility-v1` (F2).

### Does NOT Include

- `_instructions`, generated handoff files, new attachment syntax, migration of user documents or a second document authority.
- Internal pipeline changes, board frontend changes, automatic fresh-session spawning, execution on accepting an instruction offer, or changes to merge/publication approval.
- Runtime history fixes from 0021B, broad STEP-ID migration, slot changes, feature/plugin rewrites or a new CLI command.
- New routing behavior for `add` or `add-ux`; their existing router/transformer roles remain exempt.
- README/web regeneration: this is an existing runtime-output contract, not a new public command or installation feature.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Persist the handoff? | No; chat-only. | User replaced the file design. |
| Manual offer? | Ask after completion when there is a next activity. | User chooses whether to receive the copyable text. |
| Accepted response? | Only one copyable block with command and activity text. | User explicitly requested no surrounding response. |
| Detail source? | Official documents, with concise directions. | Avoid reconstructing specifications in a second source. |
| Acceptance authorizes execution? | No. | It authorizes text delivery for another context. |
| Automatic mode? | Existing same-session continuation. | User retained automatic behavior. |
| No next activity? | No offer. | Confirmed by the user. |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Fresh-context instructions without extra project files. | The handoff text itself has no durable archive beyond chat. |
| User-controlled copyable continuation. | Manual eligible completion adds one optional conversational turn. |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Instruction-only formatting suppresses required report facts. | High | Separate turns in F1/F3/F4; L1/L3. |
| Acceptance triggers execution or becomes merge consent. | High | F2 boundary and F3/F4 adapters; L2/L3. |
| Shared final-report makes workers ask questions. | Medium | Top-level predicate in F1; negative L1/L3 fixture. |
| A copied review instruction uses superseded routing. | Medium | Official references/current-state directions in F1/F3; L3 review fixture. |
| A local closing overrides shared manual behavior. | High | Complete closing map F3/F4/F5 and L1 coverage. |
| Slot-adjacent prose changes assembled commands. | Medium | Preserve markers/IDs; existing injection suites L2. |

## Impact

All paths below are relative to `framwork/.codeadd/` except the test row. Depth-1 counts are graph results, not text-derived callers.

| Artefact | Layer | Action / anchor | Direct dependants / risk |
|---|---|---|---|
| `skills/add--final-report/SKILL.md` | product | Modify, F1 | 14 / HIGH; 12 finishing commands plus backlog and subagent-driven-development. |
| `skills/add--delivery-mode/SKILL.md` | product | Modify, Handing Off to the Next Command, F2 | 7 / HIGH; five commands plus QA/TDD build fragments. |
| `commands/add-brainstorm.md` | product | Modify, `add-brainstorm.route`, F3 | 3 / HIGH |
| `commands/add-new.md` | product | Modify, existing `Completion`, F3 | 13 / HIGH |
| `commands/add-plan.md` | product | Modify, `add-plan.complete`, F3 | 22 / HIGH |
| `commands/add-build.md` | product | Modify, `add-build.complete`, `add-build.next-command`, confirm branch of Loop End, F3 | 21 / HIGH |
| `commands/add-review.md` | product | Modify, `add-review.console-output`, F3 | 16 / HIGH |
| `commands/add-audit.md` | product | Modify, `add-audit.complete`, F4 | 1 / MEDIUM |
| `commands/add-diagnose.md` | product | Modify, `add-diagnose.complete`, F4 | 5 / HIGH |
| `commands/add-done.md` | product | Modify, `add-done.complete`, F4 | 12 / HIGH |
| `commands/add-hotfix.md` | product | Modify, `add-hotfix.complete`, F4 | 9 / HIGH |
| `commands/add-pull-request.md` | product | Modify, `add-pull-request.complete`, F4 | 2 / MEDIUM |
| `commands/add-qa-setup.md` | product | Modify, `add-qa-setup.handoff`, F4 | 6 / HIGH |
| `commands/add-wiki.md` | product | Modify, `add-wiki.report`, F4 | 16 / HIGH |
| `skills/add--ecosystem/SKILL.md` | product | Modify, flows/routing/owner descriptions, F5 | 6 / HIGH |
| `cli/tests/chat-continuation-handoff.test.js`; `product-pipeline-parity.test.js`; `optional-review-build-final-review.test.js`; `product-close-out-parity.test.js`; `hotfix-diagnosis-review-contract.test.js` | product | Create first; modify others only where new manual contract requires, F6 | Non-artefact paths; not graph graded. |

The command adapters use their existing final-report load; add delivery-mode loads/declarations only where required to resolve mode. No registry entry is added because no new distributed artefact is created. Generated provider output is built, never hand-edited.

## Delivery Conditions

Four conditions bind how this plan is executed. They change no product artefact and no F-block content; the build records their evidence in the ledger like any other validation.

| # | Condition | Required behaviour | Evidence |
|---|---|---|---|
| D1 | **Isolated worktree** | Create the branch and worktree before the first edit and run every F-block, check and fix round inside it, following this repository's existing convention: worktree under `.claude/worktrees/`, branch `worktree-<slug>`, base SHA recorded. Never implement in the primary checkout, and never leave an uncommitted artefact the ledger names. | Ledger identity line (worktree, branch, base SHA) plus each F-block commit SHA resolving from that worktree |
| D2 | **RED → GREEN per F-block** | For each F-block, author or extend its checks first, run them, and confirm they fail for the reason the plan predicts — not for a missing dependency, a typo or an environment fault. Only then change the artefact, then drive GREEN. A RED failing for the wrong reason is a defect in the check, fixed before the F-block proceeds. | The recorded RED reason per F-block, then its GREEN result, both in the ledger |
| D3 | **PR open at completion** | After STEP 8, answer STEP 9's first-push question affirmatively: push the branch and `gh pr create`, then report the PR URL. Declining leaves the work local, does not satisfy this plan, and is reported as an unmet delivery condition rather than a completed delivery. | PR URL in the build's final report |
| D4 | **CI green** | Watch the PR's checks with `gh pr checks --watch --fail-fast` until they settle. On failure, read the failing job's log, fix the cause inside the worktree and push to the existing PR — that push was decided when the PR was opened, so it does not re-ask STEP 9 — then re-watch. Bounded by the delivery's own discipline: if it cannot reach green, report CI red with the failing job named and leave the PR open. Never merge, never report green on an unobserved run, and never let a Ruling convert red CI into pass. | The observed `gh pr checks` outcome per push, the final state green, each failure/fix pair logged |

**D1 changes the build's STEP 2 stop kind, and that is intended.** `/add-framework--build` STEP 2 makes the design a **confirming** stop on `Delivery: automatic` unless a Global Constraint overrides a gate in that skill. This plan adds one, so STEP 2 waits on every mode. D3 does not change STEP 9: the question is still asked and still waits, and the plan only records which answer the user is expected to give.

**The worktree carries the plan with it.** `docs/plans/` is gitignored, so inside a worktree this document and the ledger exist only there. `/add-framework--done` carries them into `docs/deliveries/<plan-basename>/`; this delivery therefore depends on the close-out running and reports that dependency rather than assuming the archive happened.

**D4 ends this build; it does not start the close-out.** `/add-framework--done` runs its own gates, waits for CI and owns the merge, and is never reached unattended. Green CI here means the PR is ready for the user to close out, nothing more.

## Validation Matrix

**RED first:** author the contract and coverage checks before F1, verify their failures identify absent manual offer/two-response boundaries rather than unrelated environment errors. Do not run tests at plan time.

| Requirement | Expected end state | Responsible blocks | Proof |
|---|---|---|---|
| R1 | Eligible manual completion asks exactly once, after full report/metadata. | F1–F5 | L1 coverage + L3 transcript |
| R2 | Acceptance returns only one complete copyable block. | F1/F3/F4 | L1 contract + L3 transcripts |
| R3 | Decline ends handoff without invocation or execution. | F1/F2 | L3 negative transcript |
| R4 | Concrete official references and activity decisions; no invented files. | F1/F3/F4 | L3 feature and feature-less fixtures |
| R5 | No handoff-file writes or `_instructions` requirement. | F1–F5 | L1 negative checks + L3 tool/file evidence |
| R6 | Automatic execution, semi-automatic decision, publish/merge stops unchanged. | F2/F3/F4 | L2 existing suites + L3 mode matrix |
| R7 | No offer for no-action, waiting, only manual remedies, router/worker output. | F1/F4/F5 | L1 coverage + L3 negatives |
| R8 | Every finishing command integrated, exemptions explicit, no duplicate owners. | F1–F6 | L1 map + L2 build/graph |
| D1–D4 | Worktree isolation, per-F-block RED→GREEN, PR open, CI green observed. | Delivery process, no F-block content | L4 |

### L1 — Authored contract and complete closing map (RED → GREEN)

Add focused checks for owner boundaries and all 12 adapters at the named existing anchors, plus explicit add/add-ux exemptions. Detect surviving contradictory manual full-invocation-before-offer instructions in scoped closings. Assert no new handoff-file generation contract and preserve original mandatory tables/metadata. RED today: manual mode prints a next-command line unconditionally; no instruction-only second-response contract exists.

### L2 — Build and regression integration

Run product build and CLI test suite using repository-supported runners. Verify relationship declarations resolve, resource paths compile for declared providers, injection memberships/STEP IDs remain unchanged, and assembled board/TDD/QA/plugin completions retain mandatory facts and the same eligible manual offer. Existing pipeline parity, optional review, close-out and diagnosis/hotfix tests must pass with only intentional manual-output assertions updated. Record pre-existing warnings separately; introduce no new graph/resource warning.

### L3 — Behavioral acceptance, with actual fresh-context reads

Use isolated fixture project documents and actual agent conversations. Record initial completion, user answer, next response, tool calls and file changes in the build ledger (brief quotations/results, not a new persisted verdict companion). A prose checklist or static regex is not behavioral evidence. For nondeterministic failures, report them honestly; passing static tests cannot waive them.

**Runnable minimum procedure:** use this harness's available `general` subagent mechanism as an isolated conversation runner, on the active OpenCode provider and its current default model. No alternate model is required. Load the final authored command closing section and final owner skill bodies into a fresh producer session, together with fixture state and official documents; ask it to perform the real closing behavior, not to describe what should happen. Give acceptance/decline as a subsequent message using that producer's returned session ID. For the fresh-context check, create a different recipient session, supplying the emitted block as its sole task instruction, the target command's final prompt and the disposable project location; give it no producer transcript or findings summary. References inside the block must lead to the fixture's actual official files. Inspect reported/tool-visible reads and output against the scenario assertions. Keep producers read-only, with no command execution for the output-only response; permit recipient changes only in the disposable fixture and only for the explicitly authorized correction scenario. Cover every L3 scenario with at least one actual conversation; a scenario family may use several short fixture turns. Record provider/model identity and source revision with the results. Cross-provider build assertions in L2 supplement this minimum; they do not claim behavioral coverage on untested models. If isolated continuation sessions or tool-visible fixture access are unavailable, L3 remains unverified and GREEN is blocked until the same procedure is run in fresh manual sessions with transcripts and tool evidence recorded.

1. Manual review with current review-003 and superseded review-002: initial full findings/gates report ends in the offer; yes yields only a block for correction using review-003, confirmed finding decisions and existing official references. A fresh agent given only that block reads the current documents, does not re-ask closed decisions and does not apply superseded routing or duplicate a completed fix. Use disposable work and explicit fixture permission for recipient execution.
2. Manual plan and pre-feature brainstorm: actual feature arguments or existing intent/design references suffice; no invented feature or handoff file. Output remains concise and executable through the provider-supported invocation form.
3. No-action diagnosis, healthy audit, standalone wiki, merged/completed work with no specified new goal, PR waiting for review, only manual review remedies: no runnable development continuation offer. Do not synthesize an unrelated next feature.
4. Decline, ambiguous answer, worker report and nested backlog completion: no next command executed and no competing question; only explicit acceptance of the current offer yields a block.
5. Automatic new/plan handoff: same session executes next command from its first step with no added offer. Semi-automatic checkpoint retains its original deciding question. Confirm checkpoint keeps its full checkpoint report and offers copyable continuation. First publish and every done/merge decision retain their gates.
6. Review/hotfix terminal behavior stays advisory in every mode; hotfix retains diagnose `@report` and routes to done, never an extra review. A review with an automatic carrier still stops under its existing rule and does not gain automatic execution or a manual-mode offer.

**GREEN:** R1–R8 have the corresponding passing authored, integration and behavioral evidence against the final prompt set. Every F-block has validation coverage. A missing behavioral run is unverified, not pass.

### L4 — Delivery conditions (D1–D4)

1. **D1** — every F-block commit exists only on the worktree branch, the ledger names the worktree path, branch and base SHA, and the primary checkout carries no artefact change from this delivery.
2. **D2** — each F-block's RED reason is recorded and matches the plan's prediction, followed by its GREEN. A block whose RED is recorded as failing for the wrong reason is not accepted.
3. **D3** — the PR URL exists in the build's final report and resolves to the delivery branch.
4. **D4** — the final `gh pr checks --watch --fail-fast` run on the PR head observed green after every push; any intermediate red carries its fix and its re-watch in the ledger.

**GREEN = D1–D4 evidenced.** CI that cannot be watched to green, or a PR that was not opened, leaves the delivery short of this plan however green R1–R8 stand.

## Execution Order

Create the worktree first (D1); every step below runs inside it. F6 RED preparation → F1 → F2 → F3 → F4 → F5 → F6 completion, one commit per F-block, each preceded by its own RED confirmation (D2). RED test changes belong to F6 and remain uncommitted until its final completion commit; stage only the exact owned artefact paths for each F1–F5 commit, never include the prepared test changes in those commits. This is one F6 executed in preparation and completion segments, not a second F6 commit. Record the initial RED result before F1. F1 centralizes format before mode and caller adapters consume it. F2 centralizes eligibility before both command groups. F5 documents the completed routing changes; F6 finishes cross-provider/injection regression and behavioral evidence. Intermediate commits are checkpoints, not release-ready states. After STEP 8, open the PR (D3) and watch it to green (D4); publish only after all adapters and proofs pass. The separate backlog acceptance-alignment handoff occurs after plan acceptance and before claiming ticket completion; report its publication result outside the F-block validation result.

## Reviewer Handoff

For each F-block, leave file changes, validation levels/results and any changed decision in the build ledger, plus the D1–D4 evidence. No separate persisted reviewer verdict is required. Hunt especially: mixed-turn reports inside the accepted block, execution after a yes, swallowed mandatory report facts, stale review routes, worker collateral, fabricated next activities, semi-automatic reclassification and local manual rules contradicting the owners. Judge the delivery's own claims the same way: a RED recorded as failing for the wrong reason, a PR URL that does not resolve, and a "CI green" claim with no observed run behind it are defects, not paperwork. Mandatory requirements cannot be waived by a Ruling; a real scope change needs the user's decision.

## References

- `docs/deliveries/2026-09-09T163448-PLAN--final-report-shape/plan.md` — report ownership and exemptions.
- `docs/deliveries/2026-09-16T170340-PLAN--the-pipeline-chains/plan.md` — delivery carriers and stop semantics.
- `docs/deliveries/2026-09-19T122048-PLAN--optional-review-build-final-review/plan.md` — review routing and automatic terminus.
- `docs/deliveries/2026-09-27T005231-PLAN--deterministic-fragment-slots-and-step-ids/plan.md` — stable anchors and assembly.
- Conversation for 0018B — final chat-only design supersedes the board's original persisted-file wording.

## Next Steps

`/add-framework--build optional-chat-continuation-handoff`

## Plan Changelog

| Date | Change |
|---|---|
| 2026-10-04 | Initial plan from user-approved conversation; file-based handoff explicitly superseded. |
| 2026-10-04 | Applied review clarifications: separate backlog publication owner/timing, F6 RED commit ownership, and executable minimum behavioral-session procedure. |
| 2026-10-04 | Added D1–D4 delivery conditions: isolated worktree, per-F-block RED→GREEN, PR opened at completion, CI watched to green. |
