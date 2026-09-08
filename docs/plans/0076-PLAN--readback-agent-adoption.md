# Plan: Readback Agent Adoption — a cold reader says back what the docs would make someone build

> **Status:** implemented
> **Type:** product (agent + skill + four command dispatch sites + one dead-artefact removal)
> **Created:** 2026-09-06
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

Two artefacts — `framwork/.codeadd/agents/readback-agent.md` and `framwork/.codeadd/skills/add-feature-readback/SKILL.md` — were authored inside a project that *consumes* codeadd, then copied into the product layer. They are orphans in three independent ways: **untracked by git** (`git ls-files` returns nothing for either), **absent from `framwork/provider-map.json`**, and **dispatched by no command**. Nothing builds them, nothing ships them, nothing calls them.

They answer a question the ecosystem currently cannot ask. Plan 0069 established a two-species review taxonomy: `@doc-reviewer-agent` asks *"is this well written?"* (Gap/Clarity/Scope questions) and `@plan-reviewer-agent` asks *"can this be executed?"* (verdict + required fixes). Neither asks the third question: **"will whoever reads this build the right thing?"** A document can satisfy every rubric in this repo and still steer its reader into a different feature. That failure is invisible to both existing reviewers and visible only to a reader who says out loud what they would go build.

That taxonomy has since collapsed to one live species. Plan 0069's own outcome was that `@plan-reviewer-agent` replaced `@doc-reviewer-agent` at every dispatch site, and the questionnaire agent has had zero consumers ever since while still building and shipping to five providers. This plan therefore does two things at once: it adds the missing third species and **deletes the dead first one**, leaving the ecosystem with exactly two reviewers that both run.

The originating pain, in the owner's words: an agent read the documentation, misunderstood the proposal, and asked questions that had nothing to do with it — it had already gone down a completely different line. Nothing in the pipeline catches that today.

No design doc exists in `docs/brainstorm/` for this work. The decisions were taken across two rounds of the `/add-framework--plan` consultation and are recorded inline in **Validated Decisions** below; the rows marked *owner call, round 2* overrode this command's own round-1 recommendation.

## Problem

1. **A whole class of doc failure has no detector.** Docs that read well and steer wrong pass every current gate. The two live reviewers grade the text; neither reports what a reader would build from it.
2. **The artefacts are unshippable as they stand.** Not in git, not in the registry, not dispatched. A release would carry neither.
3. **The agent is not read-only outside Claude.** Its frontmatter carries `disallowedTools` (which the Claude dialect passes through) but **not** `readonly: true`. The OpenCode dialect emits its `permission: edit/bash deny` block only from `readonly: true`, and the Cursor dialect emits `readonly: true` only from it. On two of the four agent-bearing providers, a read-only agent ships with nothing enforcing read-only.
4. **The agent points at a hardcoded provider path.** Its closing line references `.claude/skills/add-feature-readback/SKILL.md`. That path is wrong on Cursor, OpenCode and Codex, where the skill lands elsewhere.
5. **Both files assert the docs are in Portuguese — in four places, not two.** The agent says the report goes out "in the language the docs are written in (Portuguese, here)"; the skill repeats the claim in its language rules, again in its output-format preamble ("for this repo that is Portuguese"), and a fourth time inside its own checklist ("(Portuguese here)"). codeadd is open-source and installs into projects in any language. The rule is right; the hardcoded answer is a leak from the origin project, and enumerating the sentences rather than scanning for the claim is how a fix leaves one behind.
6. **`_superseded/` is not a codeadd convention.** Both files instruct the reader to skip it. `_tests/` exists here; `_superseded/` does not. Skipping a directory that never exists is harmless, but it ships as an unexplained name in distributed documentation.
7. **`doc-reviewer-agent` and `add-doc-reviewer` are dead code.** Zero dispatch sites — `add-ecosystem/SKILL.md:102` records it as "None currently ... add.new and add.brainstorm now dispatch plan-reviewer-agent" since plan 0069 replaced it. They still build and ship to every provider, and **twelve live references across five other artefacts still point at them** — `add-feature-readback` (4), `add-ecosystem` (3), `add-doc-schemas` (2), `add-plan-review` (2), `plan-reviewer-agent` (1). One is a `{{skill:add-doc-reviewer/SKILL.md}}` resource-path variable inside `add-doc-schemas/SKILL.md:231`, which resolves to a path with no file behind it and fails no gate. **Treat this count as a floor, not a checklist** — the guarantee of completeness is L4.4's blanket grep, never the enumeration.
8. **Neither readback file has a reading-scope contract.** The agent's enumeration step is an unconditional `Glob <folder>/**/*.md`, and the skill's `Input` section states flatly: "No schema name, no doc type, no reading list. You take the whole folder." A caller cannot restrict the reading set today, and nothing in either file would honour a restriction if one were passed.
9. **The readback cannot read a brainstorm at all.** `add.brainstorm` STEP 3 writes **one file** — `docs/brainstorm/YYYY-MM-DD-<slug>.md` — not a folder. The agent's input is a feature folder, its enumeration is a recursive glob, and its constraint prose says "folder-bound ... only the feature folder you were given". A single-document target is outside its contract in three separate places.

## Proposal

Ship the readback as the **third review species**, running **after** the existing `@plan-reviewer-agent` loop settles and its fixes are applied — never beside it. Running the two in parallel would have the readback report on a version of the doc that is about to be edited, testing text that will never exist. This is not a new constraint; it is the skill's own `When NOT to Use` rule, and it is correct.

The work has five stages. **T1** repairs the portability defects and generalizes the reading contract so the agent can take any doc set, not only a feature folder. **T2** registers the two artefacts so the build emits them and the release packages them. **T3** deletes `doc-reviewer-agent` + `add-doc-reviewer` and every reference to them. **T4** wires four dispatch sites. **T5** brings the ecosystem map into agreement with the tree in one coherent edit.

**Every command that runs a fresh-reader review gets the readback.** The pair is always `@plan-reviewer-agent` (verdict + fixes) then, once those fixes are applied, `@readback-agent` (restatement). Four sites:

| Command | Where | Reading set |
|---|---|---|
| `add.new` | STEP 8 | the whole feature folder |
| `add.plan` | STEP 13 | top-level docs + **only** the subfeature being planned |
| `add.brainstorm` | STEP 5 | the single brainstorm document |
| `add.plan-to-ready` | STEP 3, plan leg | same as `add.plan` |

Two consequences follow, and neither is optional.

**The input contract must generalize.** `add.brainstorm` writes one file, not a folder. So the agent stops taking "a feature folder" and starts taking a **doc set** — a folder read recursively, or a single document. Sections that need several documents (build order, cross-document disagreement, facts that never reach the builder's doc) go empty on a single-file target, and the skill already says to omit empty sections. What survives on one document — restatement, filled gaps, forks, confidence — is precisely the part that catches a reader going down a different line.

**`add.plan-to-ready` cannot stop, so it must not.** That command states it outright: *"⛔ Never stop to ask the user during this exchange — the loop is autonomous by contract."* The readback there is compared against the loop's **Decision Log**, not against the docs it just read — comparing a report to its own source is circular and always matches. On divergence the loop applies the fix through the exact `apply → re-run the feature-plan gate → one re-dispatch` shape the plan-reviewer loop beside it already uses, logs it to the Decision Log and `iterations.jsonl`, and carries on. It never exits BLOCKED on a readback alone, because the readback issues no verdict to block on.

The subfeature scoping at `add.plan` and `add.plan-to-ready` is not merely a cost control. Sibling-versus-sibling divergence is `@consistency-agent`'s exclusive territory (five named dimensions, `add-cross-sf-consistency`); a readback that read every sibling would duplicate that owner and grow quadratically across an epic.

At the three **interactive** sites the dispatching command holds the conversation that produced the docs, so it compares against that. Matching → proceed, cited in one line. **Diverging → present the divergence and stop.** It is never a hard gate anywhere.

Deleting `doc-reviewer-agent` is safe to ship: `PRESERVE_PATTERNS` in `cli/src/installer.js` protects only `/history/` and `*.local.json`, and both install and update prune every file the prior manifest listed that the new one does not. Deregistering the two artefacts is therefore enough — `codeadd update` removes them from users' projects with no migration script.

## Scope

### Includes

#### T1 — Portability repair (no design doc; decisions inline below)

- **F1** — `framwork/.codeadd/agents/readback-agent.md`: add `readonly: true` to the frontmatter alongside the existing `disallowedTools` (both are needed — different providers read different keys); replace the hardcoded `.claude/skills/...` closing reference with the `{{skill:}}` resource-path variable per `add-resource-path-convention`; strip the parenthetical asserting the docs are Portuguese from the report-language instruction, keeping the rule itself; **replace the folder-bound input with a doc-set contract** — the caller passes a target plus a `scope`, and the agent handles three values: `feature` (a folder read recursively — today's behaviour, the default), `subfeature` (top-level `.md` plus one named subfeature's subtree, siblings excluded because `@consistency-agent` owns sibling-vs-sibling, stated as deliberate rather than as an oversight), and `document` (a single file, no glob at all). The unconditional `Glob <folder>/**/*.md` becomes conditional on scope, and the "folder-bound" constraint prose becomes "**bound to the doc set you were given**" — the boundary is unchanged in strength, only in shape, and every "no source code / no sibling features / no wiki / no git / no memory / no conversation" clause survives verbatim; qualify `_superseded/` as skipped when present; add a frontmatter comment recording two deliberate absences — no `memory:` key (the skill forbids memory, and every sibling agent carries `memory: project`, so an uncommented absence invites an "alignment" fix that kills the mechanism) and no plugin injection marker (the `tools: Glob, Read` allowlist is the folder-boundedness; a code-graph tool would let the reader repair gaps from outside the folder). **Must NOT lose:** `tools: Glob, Read`, `disallowedTools`, the out-of-bounds list in full, the "your blindness is the mechanism" framing, and "you are the instrument, not the suspect".
- **F2** — `framwork/.codeadd/skills/add-feature-readback/SKILL.md`: remove **every** statement naming a specific language as this repo's or these docs' language — there are three in this file (the language rule, the output-format preamble, and the checklist line), and the fix is a scan for the claim, not an edit of a named list — while keeping the language rule itself ("the language of the docs you read, headings included"); relabel the existing Portuguese example block as an illustration **of** that rule rather than as this repo's fact — it demonstrates the rule better than prose can, so it stays; **rewrite the `Input` section**, which today states "No schema name, no doc type, no reading list. You take the whole folder" and so flatly contradicts both a restricted reading set and a single-file target: the caller passes a target plus a `scope`, and the section must define all three values (`feature`, `subfeature`, `document`), what `subfeature` excludes and why, and which output sections legitimately go empty under `document`; qualify `_superseded/`; amend `When to Use` and `When NOT to Use` to name the **four** dispatch moments and the after-the-fixes ordering — and **specifically rewrite the `When NOT to Use` bullet reading "A single doc in isolation with a schema to check against"**, which now contradicts `scope: document` outright: `add.brainstorm` dispatches this skill on exactly one document that `@plan-reviewer-agent` also reviews against a schema. The line that survives must separate *reviewing one doc against a rubric* (not this skill) from *reading one doc cold for comprehension* (exactly this skill); rewrite the `Boundary` table — it currently has three rows and one of the species is being deleted in T3, so it becomes a two-row split between `@plan-reviewer-agent` (verdict) and this skill (restatement); amend `Pairing` so `@plan-reviewer-agent` is the sole partner, and add the autonomous-loop variant (compare against the Decision Log, never stop, never block). **Must NOT lose:** the paraphrase test, the three-line gap shape including "what I'd build wrong", the fork-reporting rule, the "facts that never reach the builder's document" section and its "this is not a gap" warning, the anti-rationalization section, the rule that a divergence is a defect in the document and never in the agent, the Anti-Patterns table, and the checklist.

#### T2 — Registration (nothing ships without this)

- **F3** — `framwork/provider-map.json`: register `add-feature-readback` in the `skills` block and `readback-agent` in the `agents` block with a `description`. No `providers` restriction on either — both go everywhere their kind goes (skills: all 5; agents: the 4 with an `agents` pattern).
- **F4** — Track both paths in git. They are untracked today; `release.yml` packages from the tree, so an untracked file reaches no release regardless of registration.

#### T3 — Delete the dead reviewer

- **F5** — Delete `framwork/.codeadd/agents/doc-reviewer-agent.md` and the whole `framwork/.codeadd/skills/add-doc-reviewer/` directory, and remove both entries from `framwork/provider-map.json`. `agentStrategy.requireSource` is `true`, so a registry entry left behind after the file is gone fails the build loud — the two halves must land together. No migration script: install and update both prune every path the prior manifest listed that the new one does not, and `PRESERVE_PATTERNS` guards only `/history/` and `*.local.json`, so `codeadd update` removes them from users' projects on its own.
- **F6** — Clean the surviving references the deletion itself does not touch. Twelve exist across five files; three F-blocks split them by owner, and **no reference may be left to another block by assumption**:
  - **F6 owns 5.** `add-doc-schemas/SKILL.md` ×2 (line 180 names it as the review route for "other generators"; line 231 is the live `{{skill:add-doc-reviewer/SKILL.md}}` variable). `add-plan-review/SKILL.md` ×2 (lines 10 and 23, contrast clauses defining that skill by what it is *not*). `plan-reviewer-agent.md` ×1, inside its `description` frontmatter — the field the build writes into every provider dialect, so a stale name there ships to all four.
  - **F2 owns 4** in `add-feature-readback/SKILL.md` (lines 30, 32, 40, 44) — the `When NOT to Use` ordering bullet, the single-doc exclusion bullet, the `Boundary` row, and the hard-line paragraph that defines the no-questions rule by contrast.
  - **F11 owns 3** in `add-ecosystem/SKILL.md` (lines 48, 102, 141), removed as rows.
  Each reference must be **rewritten to stand on its own, never merely deleted**: seven of the twelve exist to draw a distinction between a question-only review and a verdict review, and that distinction survives the artefact's deletion. The count is a floor for planning, not a completion signal — L4.4's grep over the whole product layer is what proves the sweep finished.

#### T4 — Command wiring (four sites)

- **F7** — `framwork/.codeadd/commands/add.new.md`, STEP 8: a readback sub-step placed **after** the plan-reviewer verdict is resolved and **before** Completion, dispatching `@readback-agent` with the feature folder and `scope: feature`. On divergence: apply the doc fix, **re-run STEP 7's validation gate**, then present the divergence to the user and stop. No inline fallback — see the Validated Decisions row on soft-degrade. Never reached when the plan-reviewer verdict is `blocked`, because STEP 8 already stops there. **Must NOT lose:** the existing verdict/one-re-dispatch loop, and the rule that the readback is not a gate.
- **F8** — `framwork/.codeadd/commands/add.plan.md`, STEP 13: the same sub-step, dispatched with `scope: subfeature` — the reading set is the feature folder's top-level `.md` files plus the subfeature currently being planned, with sibling subfeature folders excluded. On divergence: apply the fix, **re-run STEP 12's validation gate on `plan.md`**, present and stop, before STEP 14. On a non-epic feature there are no subfeatures and the scope degenerates to the whole folder. **Must NOT lose:** the existing STEP 13 verdict loop and its prohibition on re-dispatching the UX subagents to satisfy a review finding.
- **F9** — `framwork/.codeadd/commands/add.brainstorm.md`, STEP 5: the same sub-step after the plan-reviewer verdict resolves and before STEP 6, dispatched with `scope: document` and the single `docs/brainstorm/YYYY-MM-DD-<slug>.md` path. On divergence: apply the fix, **re-run STEP 4's `brainstorm` gate**, present and stop. The step must say which output sections are expected to be empty on a one-file target, so an emptier report is not read as a weaker one. **Must NOT lose:** the existing verdict loop and the STEP 6 hard stop.
- **F10** — `framwork/.codeadd/commands/add.plan-to-ready.md`, STEP 3 plan leg: the readback runs **after** the plan-reviewer verdict resolves to advance **and after** the epic-mode `@consistency-agent` FULL pass, because that pass edits `plan.md` — a readback before it reads a version about to change, which is the same rule that puts the readback after the reviewer everywhere else. `scope: subfeature`. **This site alone does not stop and does not present**, because the command forbids it in writing (*"Never stop to ask the user during this exchange — the loop is autonomous by contract"*). Instead: compare against the **Decision Log**, never against the docs just read; on divergence apply the fix through the `apply → re-run the feature-plan gate → one re-dispatch` shape the two loops beside it already use; record the divergence and its resolution in the **Decision Log**, which exists on every run. **In epic mode only**, also carry it into the plan-leg `iterations.jsonl` entry — that entry is explicitly epic-gated today (*"This entry does not fire outside epic mode"*), so a `SFxx`-scoped or non-epic run must NOT start firing it. Follow the existing per-leg convention; do not break it to give the readback a log line. **Never a BLOCKED exit on the readback alone** — it issues no verdict, so there is nothing to block on; a genuine blocker still has to come from the plan-reviewer or the consistency judge. **Must NOT lose:** the autonomous-by-contract rule, the existing two verdict loops, and the plan-leg boundary log.

#### T5 — Ecosystem map (one coherent edit)

- **F11** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: in a single pass, **add** the `add-feature-readback` skill row, the `readback-agent` agent row and the skill→consumers row naming all four sites, and **remove** the three `doc-reviewer` rows (lines 48, 102, 141). Doing it as one edit is deliberate: adding first and removing later leaves a window where the map lists an agent the tree no longer has. This file is what the discovery agent and future plans read; a row that disagrees with the tree is worse than no row.

### Does NOT Include (important!)

- **A migration script for the `doc-reviewer` removal.** Not needed and not written — the installer's existing manifest-diff prune already deletes deregistered artefacts from users' projects. Adding one would duplicate a mechanism that works.
- **`@reviewer-agent`, `@consistency-agent` or any other reviewer.** T3 deletes exactly one agent and one skill, both with zero dispatch sites. No other artefact is audited for deadness by this plan.
- **The `add.hotfix` / `add.review` / `add.audit` doc steps.** Those review *code and delivery*, not a freshly written specification. The readback's question does not apply there.
- **A `readback-pipeline` feature toggle.** Decided against; the readback is always on.
- **Any new feature or plugin fragment, marker, or sidecar entry.** This change adds zero injection points — see the end-state map in the validation matrix.
- **`CLAUDE.md` artefact counts (Skills 42 / Agents 22) and anything under `.claude/`.** `/add-framework--build` reaches neither. Routed to a companion `/add-framework--self-plan` — see Next Steps.

## Validated Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Pair with `@doc-reviewer-agent`, as requested? | **No — and delete it** | It has zero dispatch sites since plan 0069 replaced it (`add-ecosystem/SKILL.md:102`). **Owner call, round 2:** don't leave dead code in the framework. The live partner everywhere is `@plan-reviewer-agent` |
| Run alongside the reviewer, as requested? | **No — sequentially, after its fixes land** | The skill's own `When NOT to Use`: a parallel readback reports on a version of the doc that is about to be edited |
| Where to dispatch? | **All four fresh-reader review steps** — `add.new` S8, `add.plan` S13, `add.brainstorm` S5, `add.plan-to-ready` S3 | **Owner call, round 2**, overriding the round-1 answer of two sites. Every step that runs a pre-delivery review gets the readback, so the main agent always receives both reports and documentation stays consistent across the flow |
| Reading scope, per site? | `feature` / `subfeature` / `document` / `subfeature` | Subfeature scoping prevents quadratic re-reading across an epic and respects `@consistency-agent`'s exclusive ownership of sibling-vs-sibling divergence. `document` exists because `add.brainstorm` writes one file, not a folder |
| Duplicate gaps reported at several sites? | **Accepted, not de-duplicated** | A gap that reappears downstream means the upstream fix never landed in the text. That recurrence is itself signal; dedup machinery would hide it |
| What does the command do with the report? | **Compare; proceed on match (one line), stop and present on divergence** | At the three interactive sites the command holds the originating conversation. A blanket stop would interrupt even when comprehension matched |
| Is it a gate? | **No, at any site** | The skill forbids a verdict. The stop is for a user decision, not a mechanical block |
| Inline fallback when the provider has no subagent dispatch? | **No — skip and say so** | An inline readback performed by the command that wrote the docs is incoherent: the mechanism *is* that the reader does not hold the conversation. Agents build for 4 of 5 providers, so the concrete skipped case is antigravity |
| Into `/add.plan-to-ready`, which cannot stop? | **Yes — compare against the Decision Log, never stop, never block** | **Owner call, round 2**, overriding the round-1 answer of no. The stated goal is that the main agent receive the review feedback inside the loop. The circularity objection is answered by the comparator: the Decision Log records what the loop decided, so comparing against it is not comparing the docs to themselves. Divergence rides the existing `apply → re-gate → one re-dispatch` shape and is logged; it never produces a BLOCKED exit, because there is no verdict to block on |
| Does deleting `doc-reviewer-agent` break existing installs? | **No, and no migration script** | `PRESERVE_PATTERNS` covers only `/history/` and `*.local.json`; both install and update prune every prior-manifest path the new manifest omits. Deregistering is the whole removal |
| Always on, or feature toggle? | **Always on** | A sonnet subagent reading markdown is cheap, and the users who most need this are the ones who would never know to enable it. A toggle would cost a fragment, a registry entry, injection markers and sidecar anchors for the sole gain of switching it off |
| Keep the Portuguese example in the skill? | **Keep it, relabelled as an illustration** | It demonstrates the "emit in the docs' language" rule more convincingly than prose. Only the sentences asserting *this repo's* docs are Portuguese are removed |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A detector for docs that read well and steer wrong, on **every** pre-delivery review step | Up to four extra subagent dispatches per feature, two of them repeated per subfeature in an epic |
| The main agent always holds both reports — verdict and restatement — at every handoff | Four dispatch sites to keep in sync; a change to the readback contract now touches four commands |
| The same report at every site, so a recurrence is visible | Some gaps reported more than once on the same feature |
| One less dead artefact shipping to five providers | Twelve references rewritten across five files, seven of which used `doc-reviewer` to define themselves *by contrast* and now need their own words |
| A genuinely read-only agent on all four agent providers | A second frontmatter key (`readonly:` plus `disallowedTools`) that looks redundant until you know the dialects read different ones |
| A readback that works on a single document, not only a feature folder | Four of the report's sections go empty on a brainstorm, so the report there is thinner — and a thin report is easy to misread as a weak signal |
| The reader's blindness stays intact | The readback can never resolve a `{{doc:...}}` reference or a cited source line; those stay findings forever, by design |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| The command rationalizes a divergence away ("that's basically what I meant") and never stops | **High** — it is the same agent that wrote the docs | F7–F10 require the comparison to be made against the report's closing **"In one sentence"** line, which is short and hard to soften, and require the divergence to be *presented* (or, in the loop, *logged*), never summarized away. L3 asserts all four commands carry that instruction |
| **`add.plan-to-ready` gains a step that stops the loop**, breaking the autonomous contract | **High** — every other site stops, so the loop site is the odd one out and "consistency" argues for the wrong thing | F10 states it explicitly; L3 asserts `add.plan-to-ready.md` contains no STOP/present-to-user language in the readback sub-step, and that its existing "never stop to ask the user" rule survives verbatim |
| **The loop compares the readback against the docs it just read**, which always matches and yields nothing | **High** — it is the obvious implementation and the reason this site was argued against in round 1 | F10 names the **Decision Log** as the comparator. L3 asserts the sub-step names it and does not name the docs |
| The readback quietly becomes a hard gate, or a BLOCKED exit in the loop | Medium | F7–F10 state it is not a gate; L3 asserts no command routes it into a GATES-table row, a STOP-on-report path, or a BLOCKED exit condition |
| An inline fallback is added "for parity with the plan-reviewer" and destroys the mechanism | Medium | Named in Validated Decisions and in the Reviewer Handoff gap list; L3 asserts all four commands state the skip-and-say-so rule |
| Editing `add.new.md` / `add.plan.md` shifts an existing injection anchor's ordinal and silently breaks a feature or plugin | **Medium** — those two files carry 6 of the sidecar's 39 anchors, matched by adjacent prose text plus occurrence index. `add.brainstorm.md`, `add.plan-to-ready.md` and `doc-reviewer-agent.md` carry **zero**, so T3's deletion and F9/F10's edits cannot shift anything | L1 asserts the sidecar still holds exactly 39 points after both the deletion and the four command edits, and that all 6 anchors keep identical `text`, `ordinal` and `position` |
| **A reference to `add-doc-reviewer` survives T3 and ships as a broken link** | **High** — twelve references across five files, split across three F-blocks, and one is a `{{skill:}}` variable that resolves silently to a missing file rather than failing the build | **L4.4's blanket grep over `framwork/.codeadd/` is the guarantee, not the enumeration.** F6/F2/F11 divide the twelve by owner so none is left to another block by assumption, but the plan states the count is a floor: a builder who edits twelve and stops has proved nothing until the grep returns zero |
| A reference is deleted instead of rewritten, so `add-plan-review` loses the contrast that defined it | Medium | F6 requires each reference to stand on its own; L2 asserts `add-plan-review/SKILL.md` still distinguishes verdict-with-fix from question-only review without naming the deleted skill |
| A thin brainstorm readback is read as a weak signal and ignored | Medium | F9 requires the step to name which sections are expected empty on a one-file target; L5 checks a real brainstorm run |
| `readonly: true` is added and `disallowedTools` is dropped as "redundant", or the reverse | Medium | F1 states both are required; L1 asserts the built output for each of the four agent providers independently |
| Someone gives the agent more tools so it can "resolve references properly" | Medium | F1 writes the reason into the frontmatter as a comment; L2 asserts the comment is present and the tool allowlist unchanged |
| The agent gains `memory: project` to match its siblings | Medium | Same frontmatter comment; L2 asserts no `memory:` key |
| A future plugin fragment is written for `readback-agent` | Low | L1's zero-sidecar-entry assertion is a standing regression guard |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `framwork/.codeadd/agents/readback-agent.md` | F1 — frontmatter (`readonly:`, comment), path variable, language, doc-set contract, `_superseded/` |
| `framwork/.codeadd/skills/add-feature-readback/SKILL.md` | F2 — language, `_superseded/`, `Input` rewrite (3 scopes), When-to-Use (4 sites), `Boundary` rewrite, `Pairing` + loop variant |
| `framwork/provider-map.json` | F3 — add 1 skill + 1 agent entry; **F5** — remove 1 skill + 1 agent entry |
| git index | F4 — both readback paths tracked |
| `framwork/.codeadd/agents/doc-reviewer-agent.md` | **F5 — deleted** |
| `framwork/.codeadd/skills/add-doc-reviewer/` (whole dir) | **F5 — deleted** |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | F6 — 2 references (line 180 prose route, line 231 `{{skill:}}` variable) |
| `framwork/.codeadd/skills/add-plan-review/SKILL.md` | F6 — 2 contrast clauses (lines 10, 23) rewritten to stand alone |
| `framwork/.codeadd/agents/plan-reviewer-agent.md` | F6 — the `description` frontmatter, which ships to all four agent dialects |
| `framwork/.codeadd/commands/add.new.md` | F7 — readback sub-step in STEP 8 (`scope: feature`) |
| `framwork/.codeadd/commands/add.plan.md` | F8 — readback sub-step in STEP 13 (`scope: subfeature`) |
| `framwork/.codeadd/commands/add.brainstorm.md` | F9 — readback sub-step in STEP 5 (`scope: document`) |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | F10 — readback in STEP 3 plan leg, after the consistency pass; no stop, Decision Log comparator |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | F11 — one pass: +3 readback rows, −3 doc-reviewer rows |
| `framwork/.codeadd/injection-points.json` (build-emitted) | No change expected — 39 points before and after; asserted, not assumed (L1) |
| `framwork/.codeadd/contracts.json` (build-emitted) | No change — no F-block touches a `## Materializes` block |
| `framwork/.claude/`, `.cursor/`, `.opencode/`, `.codex/`, `.agents/` … | Regenerated by `node scripts/build.js`; deploy artefacts, never hand-edited |
| `CLAUDE.md` (counts 42/22) | ⛔ Out of `/add-framework--build`'s reach → companion `/add-framework--self-plan` |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level below is written and run against the current tree **before** any F-block lands. A level that passes today is not proof — it is a level that does not bite, and it must be rewritten until it fails.

**Expected injection end-state map (asserted, never assumed):**

| Resource | Namespace:name:section entries expected after this change |
|---|---|
| `readback-agent` | **zero** — no `feature:` and no `plugin:` marker; the `tools:` allowlist is the boundary |
| `add.new` | exactly the 1 it has today (`plugin:gitnexus:graph-map`), anchor text and ordinal unchanged |
| `add.plan` | exactly the 5 it has today (`feature:qa-pipeline:step-list`, `feature:tdd-pipeline:step-list`, `plugin:gitnexus:graph-plan`, `feature:tdd-pipeline:step9`, `feature:qa-pipeline:qa-spec`), all anchor texts and ordinals unchanged |
| `add.brainstorm`, `add.plan-to-ready` | **zero, before and after** — verified: neither file carries a marker today, so F9/F10's edits cannot shift an anchor |
| `doc-reviewer-agent` (deleted by F5) | **zero removed** — verified: it carries no marker, so its deletion subtracts nothing from the sidecar |
| **Sidecar total** | **39 points, unchanged** — the deletion removes none and the four command edits add none |

### L1 — Build-side (RED → GREEN)

Run `node scripts/build.js` and assert against its output tree and sidecars.

1. `readback-agent` is emitted for **claude, cursor, opencode** (markdown) and **codex** (TOML, body inside `developer_instructions`), each under that provider's resolved agents root. *RED today: absent from `provider-map.json`, so the build emits nothing and no output file exists.*
2. `add-feature-readback/SKILL.md` is emitted for **all 5** providers. *RED today: unregistered.*
3. The **claude** output's frontmatter carries `disallowedTools`. *RED today: no output file.*
4. The **opencode** output's frontmatter carries the `permission:` block with `edit: deny` and `bash: deny`. *RED today twice over: no output file, and the source lacks `readonly: true`, so the dialect would emit no permission block even once registered. This level must be re-run after F3 alone to confirm it still fails, proving it tests F1 and not merely F3.*
5. The **cursor** output's frontmatter carries `readonly: true`. *RED for the same two reasons.*
6. No built `readback-agent` output on any provider contains the literal string `.claude/skills/` — the closing skill reference resolves to each provider's own path. *RED today: the source ships that path verbatim to every dialect.*
7. `lintResourcePaths()` emits no warning for either file.
8. `injection-points.json` contains **zero** entries whose `resource.name` is `readback-agent`.
9. `injection-points.json` holds exactly **39** points, and the 6 whose `resource.name` is `add.new` or `add.plan` have `text`, `ordinal` and `position` byte-identical to their pre-change values. *Captured as a baseline before F7–F10 land; this is the anchor-drift guard.*
10. `contracts.json` is unchanged.
11. The build exits 0 with no new warnings.
12. **After F5:** no provider output tree contains `doc-reviewer-agent` or an `add-doc-reviewer` skill directory. *RED today: both ship to every provider they target.*
13. **After F5, negative build check:** removing the source files while leaving either `provider-map.json` entry in place makes the build **fail**, not warn — `agentStrategy.requireSource` is `true`. Run this deliberately as a one-off to confirm the two halves are coupled, then land them together. *This level exists to prove the coupling, not to be left failing.*
14. No built output on any provider contains the string `add-doc-reviewer` or `doc-reviewer-agent`. *RED today: twelve source references across five files (`add-feature-readback` 4, `add-ecosystem` 3, `add-doc-schemas` 2, `add-plan-review` 2, `plan-reviewer-agent` 1) produce hits on every provider they build to.* The gate is **zero hits**, which is count-independent — the figure is context for the RED baseline, never a target to tick off.

### L2 — Source content (RED → GREEN)

Assertions on the two source files, independent of the build.

1. `readback-agent.md` frontmatter contains `readonly: true` **and** `disallowedTools` **and** `tools: Glob, Read`, and contains **no** `memory:` key. *RED today: `readonly: true` absent.*
2. `readback-agent.md` carries a frontmatter comment stating why there is no `memory:` key and why the tool allowlist must never gain a plugin marker. *RED today: absent.*
3. **Scanned and classified, not enumerated.** Grep both files case-insensitively for every human-language name, then sort each hit into one of two classes:
   - **(a) the artefact's own authorship language** — "this skill is written in English", "the skeleton below is written in English because this skill is". These are true in every repo, are not slated for removal, and **must survive**.
   - **(b) a claim about the language of the *read documents* or *this repo*** — "(Portuguese, here)", "These docs are in Portuguese", "for this repo that is Portuguese", "(Portuguese here)".

   Assert **zero class-(b) hits outside the Example block**. Do not assert zero hits of any kind: two class-(a) hits legitimately survive, so a blanket scan can never go GREEN even after F2 is done correctly. *RED today: four class-(b) hits — one in the agent's report-format step, three in the skill (the language rule, the output-format preamble, and the checklist line). Note that skill lines 122 and 132 each carry a class-(a) and a class-(b) claim **in the same sentence**, so the edit is surgical, not a line deletion. A test written against a named list of two sentences reports GREEN with two class-(b) hits still in place; a test written as a blanket language-name scan reports RED forever. Both failures are what this level's classification exists to prevent.*
4. Both files still contain the language **rule** — that the report ships in the language of the documents read, section headings included. *GREEN today; a guard that F2 removes the assertion without removing the rule.*
5. The Portuguese example block in the skill is still present and is introduced as an illustration of the language rule. *RED today on the framing half.*
6. Every occurrence of `_superseded/` is qualified as "when present". *RED today.*
7. The skill's `Pairing` section names `@plan-reviewer-agent` as the sole live partner, and the `Boundary` table lists exactly **two** species — `@plan-reviewer-agent` (verdict) and this skill (restatement). The `doc-reviewer` row is gone, because T3 deletes the artefact it names. *RED today on both halves: `Pairing` presents two partners and `Boundary` has three rows.*
8. The skill's `Input` section defines both scope values and what `subfeature` excludes and why, and **no longer contains** the sentence "No schema name, no doc type, no reading list. You take the whole folder." *RED today on both halves: the section is absent of any scope, and carries that sentence verbatim.*
9. The **agent's** enumeration step is conditional on scope — under `scope: subfeature` it reads top-level `.md` plus one named subfeature subtree, and no sibling. *RED today: the step is an unconditional `Glob <folder>/**/*.md`.* **This level and L2.8 must both be asserted:** the exclusion has three places it could plausibly live — the dispatch prompt in the command, the agent body, or the skill body — and a builder who writes it into only one of them leaves the other two contradicting it. L3.2 covers the third.
10. The skill's `When NOT to Use` still forbids running in parallel with the rubric review. *GREEN today; a guard that F2's rewrite does not drop it.*
11. The checklist, the three-line gap shape, the paraphrase test, the "facts that never reach the builder's document" section, the "a divergence is a defect in the document" rule and the Anti-Patterns table all survive F2 intact. *GREEN today; the must-NOT-lose guard.*

### L3 — Command integration (RED → GREEN)

**Every assertion below runs per command, never as an aggregate** — an aggregate greps the four command files as one blob and reports GREEN when three carry the rule and the fourth does not.

1. Each of the four commands dispatches `@readback-agent` at its named step with its named scope — `add.new` S8 `feature`, `add.plan` S13 `subfeature`, `add.brainstorm` S5 `document`, `add.plan-to-ready` S3 plan leg `subfeature` — each positioned **after** its plan-reviewer verdict resolves. *RED today: no mention in any of the four.*
2. `add.plan-to-ready.md`'s sub-step is additionally positioned **after** the epic-mode `@consistency-agent` FULL pass, not merely after the plan review. *RED today.*
3. All four state the comparison is made against the report's **"In one sentence"** line. *RED today.*
4. The **three interactive** commands state the divergence is **presented** to the user and the command stops. *RED today.*
5. **`add.plan-to-ready.md` states the opposite, and must:** its sub-step contains no STOP, no "present to the user", and no BLOCKED exit condition tied to the readback. It names the **Decision Log** as the comparator and does not name the docs. It routes a divergence through `apply → re-run the feature-plan gate → one re-dispatch`, and logs the outcome to the Decision Log — plus, **in epic mode only**, the plan-leg `iterations.jsonl` entry. *RED today.* Assert the epic gate explicitly: a non-epic run must not gain a plan-leg log entry it does not have today. **This is the single most likely level to be got wrong by copying F7's text into F10.**
6. Each command routes a divergence fix back through **its own** gate — STEP 7 (`add.new`), STEP 12 (`add.plan`), STEP 4 (`add.brainstorm`), the `feature-plan` gate (`add.plan-to-ready`). *RED today.*
7. All four state the no-inline-fallback rule and the skip-and-say-so behaviour when the provider has no `@readback-agent`. *RED today.*
8. `add.brainstorm.md`'s sub-step names the output sections expected to be empty on a single-document target. *RED today.*
9. No command adds a GATES-table row for the readback, and none treats the report as pass/fail. *GREEN today by absence; a standing guard that the sub-step does not become a gate at any site.*
10. `add.plan-to-ready.md`'s existing "⛔ Never stop to ask the user during this exchange — the loop is autonomous by contract" survives F10 verbatim. *GREEN today; the guard that F10 did not soften the contract to fit the readback in.*
11. `add.plan.md`'s existing prohibition on re-dispatching the UX subagents for a review finding survives F8 verbatim. *GREEN today.*
12. `add.brainstorm.md`'s STEP 6 hard stop and `add.plan-to-ready.md`'s plan-leg boundary log survive F9/F10 verbatim. *GREEN today.*

### L4 — Ecosystem coherence and dead-reference sweep (RED → GREEN)

1. `add-ecosystem/SKILL.md` lists `add-feature-readback` in the skills table and `readback-agent` in the agents table, and contains **no** `doc-reviewer` row. *RED today on both halves.*
2. The consumer list in those rows names exactly the four sites, and **matches the set of command files that actually contain a `@readback-agent` dispatch — computed from the tree, not copied from the row.** *RED today; this is the map-drift guard.*
3. `git ls-files` returns both readback paths. *RED today: both untracked.*
4. **Dead-reference sweep:** grep the entire product layer (`framwork/.codeadd/`) case-insensitively for `doc-reviewer-agent` and `add-doc-reviewer`. Zero hits. *RED today: twelve hits across five files — four in `add-feature-readback/SKILL.md`, three in `add-ecosystem/SKILL.md`, two in `add-doc-schemas/SKILL.md`, two in `add-plan-review/SKILL.md`, one in `plan-reviewer-agent.md`'s `description`.*
5. `add-plan-review/SKILL.md` still draws the distinction between a verdict-with-fix review and a question-only review, **without naming the deleted skill**. *RED today: it draws the distinction only by naming it.* A grep that merely confirms the name is gone would pass on a plain deletion, which is why this level asserts the surviving meaning and not the absence.
6. `add-doc-schemas/SKILL.md` contains no `{{skill:}}` variable pointing at a skill directory that does not exist in `framwork/.codeadd/skills/`. *RED today after F5 lands without F6; GREEN today only because the directory still exists.*

### L5 — Behavioural acceptance (dogfood, manual)

The levels above prove the wiring exists. Only this one proves it works.

1. Run `/add.new` on a request with one deliberately unresolved decision. The readback surfaces it in the gap section with **all three lines**, including "what I'd build wrong", and the command **stops** presenting the divergence rather than proceeding.
2. Run `/add.new` on an unambiguous request. The readback matches, the command proceeds and cites it in one line — no stop.
3. Run `/add.plan` on a subfeature of an epic. Confirm from the report's `**Read:** N documents` header that **no sibling subfeature folder** was opened, and that top-level `epic.md` and `about.md` were.
4. **Negative:** the emitted report contains zero questions, zero proposed fixes and zero verdict — the hard line separating this species from the other two.
5. On a feature whose `epic.md` names a concrete mechanism that its subfeature `about.md` omits, the readback files it under "facts that never reach the builder's document" and **not** as a gap.
6. Run `/add.brainstorm` through to a written document. The readback runs on one file, emits the restatement / gaps / forks / confidence sections, and **omits** build order, cross-document disagreement and facts-that-never-reach — omitted, not padded with "none" filler.
7. Run `/add.plan-to-ready` on a subfeature whose plan diverges from the Decision Log. The loop **does not stop**, applies the fix, re-runs the `feature-plan` gate, and the divergence plus its resolution appear in the **Decision Log**. The run still reports CONVERGED or CAP_REACHED — **never BLOCKED because of the readback**.
7b. Run the same case twice, once `SFxx`-scoped and once epic-scoped. The epic run additionally carries the divergence into the plan-leg `iterations.jsonl` entry; the `SFxx` run **does not**, and its absence there is the correct result, not a broken implementation — that entry is epic-gated today and F10 does not change it.
8. Run `/add.plan-to-ready` where the readback matches. It adds no iteration, no stop and no log noise beyond one line.

**RED expectations against the current tree:** L1.1–L1.6, L1.12–L1.14, L2.1–L2.3, L2.5–L2.9, L3.1–L3.8, L4.1–L4.4 and L4.6-after-F5 all fail today. L1.7–L1.11, L2.4, L2.10, L2.11, L3.9–L3.12 and L4.5-as-worded pass today and are preservation guards — stated as such, not counted as proof. **GREEN = every L1-L4 level passes after F1-F11.** L5 is deliberately outside that roll-up: it is manual dogfood, has no RED state to capture against the current tree (the wiring it exercises does not exist yet), and is evaluated only after the whole set has landed.

---

## Execution Order

`T1 → T2 → T3 → T4 → T5`, with the whole matrix written and confirmed RED before F1.

- **T1 first** because T2 makes the build emit these files; registering them before repairing them ships a non-portable agent to four providers.
- **T2 before T4** because a command that dispatches an unregistered agent is a dangling reference on every provider.
- **T3 before T4** so the commands are wired against a tree that already has one reviewer, not two. F2's `Boundary` rewrite (T1) assumes the deletion, so T3 landing later than T4 would leave the skill describing a world the tree still contradicts.
- **F5 and F6 land together**, and **F5's two halves land together**: deleting the source while leaving the `provider-map.json` entry fails the build (`requireSource: true`), and deleting both while leaving the twelve references ships broken links that no gate catches.
- **T4 before T5** because F11's consumer list is verified against the dispatch sites T4 creates (L4.2 computes it from the tree, not from this plan).
- **L1.9's baseline must be captured before F7 edits any command file.** Once the edits land, the pre-change anchor ordinals are unrecoverable without a checkout.
- **L1.4 and L1.5 must be re-run after F3 alone**, before F1 lands, to confirm they still fail. If registering the agent turns them green, they were testing registration and not the missing `readonly: true`, and they must be rewritten.

**Safe stopping points:** after **T2** the framework is coherent — the readback artefacts are portable, registered and shipped, simply not yet dispatched, which is strictly better than today. After **T3** the dead reviewer is gone and every reference rewritten; also coherent. After **T4** the wiring is live but `add-ecosystem/SKILL.md` under-reports it — a documentation lag, not a break.

**Not safe stops:** mid-**T3** (a deleted file with a live registry entry fails the build; a deleted skill with six live references ships broken links), and mid-**T4** with some commands wired and others not — the four sites are specified as one contract, and the `add.plan-to-ready` site behaves differently from the other three on purpose, so a partial landing is exactly the state where that difference gets flattened.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-deriving the consultation. For each F-block the build leaves in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state — separating the levels that were RED-then-GREEN from the preservation guards that were green throughout.
- **The L1.9 anchor baseline**, captured verbatim before F7, beside its post-change re-read.
- **The four command sub-steps quoted side by side**, so the deliberate asymmetry between the three interactive sites and `add.plan-to-ready` is visible in one place rather than inferred across four files.
- **Any decision deferred or altered**, with the Validated Decisions row it departs from and why.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — in particular L1.4/L1.5, which pass for the wrong reason if only checked after both F1 and F3 have landed.
2. **`readonly: true` added but `disallowedTools` removed as "redundant"**, or the reverse. Different dialects read different keys; dropping either leaves some provider unenforced. L1.3–L1.5 catch this only if run per provider, not as one aggregate.
3. **An inline fallback smuggled into any of F7-F10** for symmetry with the `@plan-reviewer-agent` dispatch above it. It is not symmetric: a readback performed by the command that wrote the docs measures nothing.
4. **The sub-step turned into a gate.** Look for a GATES-table row, a `STOP`-on-report path, or language treating the report as pass/fail. The skill forbids a verdict; a gate manufactures one.
5. **The anchor-drift guard skipped** because "the edits are far from the markers". Distance is irrelevant — the sidecar matches by text and occurrence index across the whole file. L1.9 is not optional.
6. **The language cleanup done at the wrong granularity.** Three distinct ways to get it wrong: deleting the Portuguese example block along with the assertions (it stays — it is the rule's demonstration); removing only the obvious assertions from a named list, leaving survivors while L2.3 reports green; or deleting whole lines 122 and 132 of the skill, which would take the *legitimate* "this skill is written in English" statements down with the leaked claims sitting in the same sentence. L2.3's class-(a)/class-(b) split is what separates the three.
7. **The scope contract written into only one of the three places it must agree.** It has to hold in the agent's enumeration step (L2.9), the skill's `Input` section (L2.8) and each dispatch prompt (L3.1). Any one of them left saying "you take the whole folder" silently wins over the other two at runtime.
8. **`add.plan`'s readback scope quietly widened to the whole folder**, which both re-introduces quadratic reading across an epic and trespasses on `@consistency-agent`'s dimensions. L5.3 is the level that actually detects it.
9. **F11's consumer row hand-written to match the plan instead of the tree.** L4.2 requires it computed from the command files.
10. **F10 written by copying F7 and changing the step number.** This is the single likeliest defect in the plan. The loop site is deliberately the odd one out: no stop, no presenting, no BLOCKED exit, and the comparator is the Decision Log rather than the conversation. A copied sub-step reads correct and breaks the autonomous contract the command states in writing. L3.5 and L3.10 are the levels that bite; read the two sub-steps side by side, not each on its own.
11. **A `doc-reviewer` reference deleted rather than rewritten**, taking a real distinction down with the dead name. Seven of the twelve exist to draw the question-only-vs-verdict line, which outlives the artefact. `add-plan-review` defines itself partly by contrast with the question-only species; that species still exists as a concept even though the artefact is gone. L4.5 asserts the surviving meaning, which a name-absence grep cannot.
12. **The reference count treated as a checklist.** The plan says twelve and says twice that twelve is a floor. A build that reports "all twelve cleaned" without L4.4's grep output has not finished; a build that reports the grep at zero has, whatever the count turned out to be.
13. **The `add.plan-to-ready` plan-leg log made unconditional** to give the readback somewhere to write. That entry is epic-gated today by explicit design; a non-epic run gaining one is a silent behaviour change in a command this plan was not asked to alter.
14. **T3 landed in halves.** A deleted source with a live registry entry fails the build loudly (`requireSource`), but a deleted skill with six live references fails nothing — it ships a `{{skill:}}` variable resolving to a path with no file behind it, on every provider. L1.14 and L4.4 are the only things that catch it.
15. **The brainstorm readback judged as weak** because four sections came back empty. Empty there is correct — a single document has no build order and no cross-document disagreement. L5.6 asserts the sections are omitted, not padded with filler.

## References

- Prior art: **plan 0069** — established the doc-reviewer (questions) vs plan-reviewer (verdict + fix) species split and the fresh-context principle this agent extends to a third species.
- Prior art: **plan 0074 T3** — the pattern for registering a product-layer agent in `provider-map.json` and routing it from a command.
- `framwork/.codeadd/skills/add-ecosystem/SKILL.md:102` — the record that `doc-reviewer-agent` has no consumers, which is what justifies T3.
- `framwork/.codeadd/skills/add-resource-path-convention/SKILL.md` — the `{{skill:}}` variable F1 must use.
- `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md` — `@consistency-agent`'s five dimensions, the boundary F8/F10's subfeature scoping respects.
- `framwork/.codeadd/commands/add.plan-to-ready.md` — the plan leg's existing dispatch order and its "never stop to ask the user" contract, which F10 extends rather than amends.
- `cli/src/installer.js` — `PRESERVE_PATTERNS` and the manifest-diff prune that make T3 self-migrating.
- `scripts/build.js` — `AGENT_DIALECTS` (which frontmatter key each provider reads), `extractInjectionPoints()`, `lintResourcePaths()`.

---

## Next Steps

```
/add-framework--build 0076-PLAN--readback-agent-adoption
```

⚠️ This plan now **deletes** a shipped agent and skill. Land it on a branch and let `/add-framework--shared-review` audit T3's reference sweep (L4.4-L4.6) before merging — a missed reference ships a broken `{{skill:}}` link to five providers and no gate catches it.

Then, for the internal layer (`/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/`):

```
/add-framework--self-plan bump the stale CLAUDE.md artefact counts (Skills 42, Agents 22) — the tree already holds 43 skills and 23 agents on disk, so the counts are wrong today and independent of when 0076 lands
```

⚠️ Note for that self-plan: the counts are **already** stale. The orphan files physically exist, so `framwork/.codeadd/skills/*/SKILL.md` and `agents/*-agent.md` return 43 and 23 today, regardless of `provider-map.json` registration. Do not derive a "before" state of 42/22 from `CLAUDE.md` — and decide there whether the numbers should count files on disk or registry entries, because 0076 makes the two agree again and hides the ambiguity.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-06 | Initial creation |
| 2026-09-06 | **Correction to the record, raised by the owner after the PR opened.** This plan called `doc-reviewer-agent` dead code without qualification, on the strength of `add-ecosystem`'s "None currently" row. Re-audited at the base commit: it was dead in **execution** (zero command dispatches, confirmed) but **not** in specification — `add-doc-schemas:180` routed "other generators" to it. That route was itself hollow: `add.hotfix`, `add.wiki`, `add.audit` and `add.diagnose` have no doc-review step at all, so it named a step that existed nowhere. The ecosystem row and the schema skill contradicted each other and this plan trusted the row, which is precisely the map-drift failure the plan warns about elsewhere. Owner confirmed the removal stands: the surviving pair (`@plan-reviewer-agent` adversarial + `@readback-agent` comprehension) is the dual review that was asked for, and the deleted agent was a third lens 0069 had deliberately retired. The generators still lacking any review are now recorded as open work in `add-doc-schemas` instead of being erased with the route. |
| 2026-09-06 | **Implemented** on branch `worktree-0076-readback-agent`. Two plan defects surfaced at the build's design gate and were fixed with owner approval before any file was touched. **(a) Ordering contradiction:** the plan said "T1 first" while L1.4/L1.5 required "re-run after F3 alone, before F1 lands" - F3 is in T2, so the two demanded opposite orders. Resolved by running F3 first: the build after F3 alone confirmed OpenCode still emitted no `permission:` block and Cursor no `readonly: true`, proving those levels test F1's missing key and not mere registration. They flipped GREEN only after F1 landed. **(b) Missing third consumer:** the plan mapped `provider-map.json` and `add-ecosystem` but not `cli/tests/`, which hardcodes the agent list in two `expectedAgents` arrays and names the plugin-exclusion allowlist. Added as F12. That allowlist is the real guard behind F1's no-plugin-marker rule, which the plan had covered only via the sidecar. Anchor drift did not materialise: 39 sidecar points before and after, all 6 anchors byte-identical. L4.4's sweep returned zero hits. Suite: 32 files / 685 passed / 0 failed, serial. Anatomy counts agree across all three consumers at 16/42/22, so the companion self-plan the Next Steps called for is no longer needed. One build-tree observation worth recording: `pruneStaleOutputs` deliberately does not prune skills (its own comment says a manifest would be needed), so a deregistered skill leaves its built directory behind - harmless, because provider dirs are gitignored and CI builds clean, but a local tree needs manual cleanup to match CI. |
| 2026-09-06 | Review v04 (`fix-then-ok`; B1, B2, A1, A2, N1 confirmed closed, and the twelve-count independently re-grepped by the reviewer). **A3:** L5.7 still asserted the plan-leg `iterations.jsonl` entry unconditionally — the exact claim B2 removed from F10 and L3.5 — so a `SFxx` dogfood run would have hunted for an entry that correctly does not exist. Split into L5.7 (Decision Log, every run) and L5.7b (both scopes, absence in the non-epic run is the right answer). **A4:** three sites still carried the pre-A1 count of six — L1.14, L4.4 and the Trade-offs row — now twelve across five files, with L1.14 restating that the gate is zero hits and the count is only RED context. Both items were drift from my own fixes, which is the failure mode this plan's L2.3 exists to prevent. |
| 2026-09-06 | Review v03 (`fix-then-ok`). **B1:** L2.7 still demanded a three-row `Boundary` table, which F2's two-row collapse can never satisfy — reworded to the real target. **B2:** F10 told the builder to log into the plan-leg `iterations.jsonl` entry, but that entry is epic-gated by explicit design (`"does not fire outside epic mode"`); F10 and L3.5 now scope the log to epic mode and forbid making it unconditional. **A1:** the reference count was wrong — twelve across five files, not six; F6 now splits them by owner (F6 5, F2 4, F11 3) and the plan states three times that the count is a floor and L4.4's grep is the guarantee. **A2:** the skill's `When NOT to Use` bullet excluding "a single doc with a schema to check against" directly contradicts the new `scope: document`; now named explicitly in F2's edit list. **N1:** the RED/GREEN roll-up now says why L5 sits outside it. |
| 2026-09-06 | **Scope change, owner call (round 2), overriding three round-1 recommendations.** (a) `doc-reviewer-agent` + `add-doc-reviewer` are now **deleted**, not merely left undispatched — new T3, F5 (delete + deregister) and F6 (rewrite the surviving references; corrected to twelve across five files in v04), with L1.12–L1.14 and L4.4–L4.6. (b) `add.brainstorm` STEP 5 gains the readback, which forces a **generalized input contract**: the agent stops being folder-bound and takes a doc set, with a third scope `document`, because brainstorm writes one file and not a folder (new Problem #9, F1/F2 rewritten, F9). (c) `add.plan-to-ready` STEP 3 gains it too, with a deliberately different contract — no stop, no BLOCKED, compared against the **Decision Log** rather than the docs, which is what answers the circularity objection that had ruled this site out (F10, L3.5, L3.10). Renumbered F5–F7 to F7–F11; rewrote Proposal, Does-NOT-Include, Validated Decisions, Trade-offs, Risks, Ecosystem Impact, Execution Order and Reviewer Handoff. Verified before writing: the sidecar stays at **39 points** because `add.brainstorm`, `add.plan-to-ready` and `doc-reviewer-agent` carry zero markers, and the removal needs **no migration script** because `PRESERVE_PATTERNS` guards only `/history/` and `*.local.json` while both install and update prune by manifest diff. |
| 2026-09-06 | Review v02 (`fix-then-ok`, no blockers; A1 + A2 confirmed closed). A3: L2.3's scan was over-corrected into a check that could never go GREEN — "English" appears twice outside the Example block as a true statement about the skill's own authorship language. L2.3 now classifies each hit as the artefact's authorship language (must survive) or a claim about the read docs' language (must go), and asserts zero of the second class. Reviewer Handoff gap 6 gained the third failure direction: deleting skill lines 122/132 wholesale, since each carries a legitimate and a leaked claim in the same sentence. |
| 2026-09-06 | Review v01 (`fix-then-ok`, no blockers). A1: added the reading-scope contract to F1 (agent enumeration step) and F2 (skill `Input` section, which flatly contradicted a restricted reading set), plus L2.8/L2.9 and a Reviewer Handoff gap — the exclusion has three places it must agree and only one was specified. A2: the Portuguese assertion count is four, not two — F2 and L2.3 now scan for the claim instead of enumerating sentences, since a named-list fix reports green with survivors. N1: Next Steps no longer implies the CLAUDE.md counts are accurate today. |
