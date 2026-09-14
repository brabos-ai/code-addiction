# Plan: Ask the Graph by Question, and Speak Plainly — the commands stop naming verbs, and both layers gain a register rule

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-13

---

## Context

Two problems, found the same way — by watching a real session fail.

**The graph.** A coordinator built a design's affected-artefact table by reading files and grepping,
and missed a depth-1 `DISPATCHES` caller. The command it was following names one verb: `history`. It
ran `history` and stopped. The instruction did not fail by being weak; it worked, and it held the
agent to one verb. The skill documents eleven verbs, four of them reachable only over MCP. The
commands expose two to four, all CLI.

**The voice.** The same session produced answers that were factual, non-figurative and free of
filler — and still hard to read. The existing voice rules ban filler, figures of speech, marketing
copy and aspirational language. **None of them bans an elaborate register.** A sentence can pass
every rule on the books and still be a stack of subordinate clauses.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-13T114957-brainstorm-graph-gate-placement.md` | The placement analysis, the three-path routing problem, and the alternatives rejected. **Superseded in one respect:** that design proposed naming two calls at the right moment. This plan names the question instead — see Validated Decisions |

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- `uses:` targets resolve inside the declaring artefact's own layer; a cross-layer name dangles and fails the build (`add-framework--done.md`, source comment)
- Never write a raw `.codeadd/` path; use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`. Scripts are the exception — always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- The two `add-final-report` skills and the two `add-review-discipline` skills are deliberately not shared across layers and must not be merged (both skills' own source comments)
- Numeric advisories (`<200 words`) are prohibited in any rule constraining agent output (`add-doc-schemas`, Output Length Doctrine)

## Problem

1. **A named verb freezes the choice.** `--brainstorm` STEP 1.2 names `history`; `--plan` STEP 3.2
   names four CLI calls; `--sync` names `stats` and `neighbors`. An agent runs what is written and
   stops. `search`, `get` and `touched_by` are never reached by any command.
2. **The discovery agent cannot ask at all.** `framework-discovery-agent` carries
   `tools: Glob, Read`. Its whole job is finding related artefacts, and it does it by globbing
   filenames and scoring keywords. It has no `Bash`, so it cannot even shell out to the CLI.
3. **The skill's reassurance does not cover that agent.** It says an agent whose allowlist blocks MCP
   "is not degraded" for the seven shared verbs, because the CLI answers identically. That holds for
   an agent with `Bash`. An agent with neither has no route at all, and the skill does not say so.
4. **`--done` keeps a private copy of a rule the skill owns.** It reads the sidecar to classify
   paths, and restates the "what is not a node" caveat inline. It declares no route to the skill, so
   the graph does not record the dependency.
5. **`docs/brainstorming/` is unreachable.** `add-plan-authoring` tells a plan to reference its design
   doc, but `--plan` STEP 1.2's read-list does not name the directory, and the discovery agent's plan
   scan globs only `docs/plans/` and `docs/deliveries/`.
6. **The effort paths contradict their own steps.** STEP 3's routing table says `bounded` and `spike`
   abbreviate STEP 4, while STEP 4.1 says `DO NOT skip any` of its eight sections and STEP 4.4's
   checklist carves out no path.
7. **Two of three paths skip the closing report.** The same table says `7.1`, `7.2` and `7.4` have
   nothing to show, on the premise there is no document. `add-final-report` reports the work, not a
   file — a spike's recommendation is exactly what its blocks 2 and 3 carry.
8. **No rule governs register, in either layer.** `add-doc-schemas` owns product voice and bans
   filler, figures and marketing. The internal layer has no voice owner at all, because
   `add-doc-schemas` is product and an internal artefact cannot declare it.

## Proposal

Two halves, no shared file, one plan because they were found together and both change how the same
commands behave.

**The graph half** replaces named verbs with a named question and a gate. The command states what
must be answered and what the answer looks like; `add-artefact-graph` owns which verb answers it. The
gate is what keeps the step from being skipped — it has to produce a filled table. The discovery
agent gets both routes to the graph, MCP and CLI, so it can answer the question it is dispatched to
answer.

**The voice half** adds a register rule where voice already lives: `add-doc-schemas` for the product
layer, both `add-final-report` skills for the closing summary, and the `> **LANG:**` line at the top
of every command for everything in between. No new artefact.

## Current State

| Artefact | Dependants (`impact --depth 1`) | Today |
|---|---|---|
| `.claude/commands/add-framework--brainstorm.md` | **0** — a leaf command | Names `history` only, in a step titled for the delivery index |
| `.claude/commands/add-framework--plan.md` | 2 | Names four CLI calls at STEP 3.2 |
| `.claude/commands/add-framework--build.md` | 3 | Names two calls at STEP 7.2, after the last F-block |
| `.claude/commands/add-framework--sync.md` | 1 | Names `stats` and `neighbors` at STEP 2 |
| `.claude/commands/add-framework--done.md` | 0 | Reads the sidecar; restates the skill's caveat; declares no route |
| `.claude/agents/framework-discovery-agent.md` | — | `tools: Glob, Read` |
| `.claude/skills/add-artefact-graph/SKILL.md` | 8 | Owns the eleven verbs and what the graph cannot see |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | — | § Voice bans filler, figures, marketing, aspiration — not register |

`plan-review-agent` and `prompt-review-agent` inherit every tool and already point at the skill; they
need no change. `plan-readback-agent` keeps `Glob, Read` by decision — see Validated Decisions.

The `> **LANG:**` line is present in **16 product commands and 7 internal commands**.

## Scope

### Includes

#### T1 — Ask by question, not by verb (ref: `2026-09-13T114957-brainstorm-graph-gate-placement.md`)

- **F1** [internal] — `.claude/skills/add-artefact-graph/SKILL.md`: a `Which verb answers which
  question` section usable as the resolution table a command points at, and one new line stating what
  the skill does not currently say — an agent whose allowlist carries neither MCP nor `Bash` has no
  route to the graph and must say its answer is NOT VERIFIED. Must NOT become a second copy of the
  eleven-verb table; it is the same table given a job.
  - **Produces:** `add-artefact-graph resolves a question to a verb, and states the no-route case`
- **F2** [internal] — `.claude/agents/framework-discovery-agent.md`: graph access, which is **five
  edits in one file**, not one. A builder who changes only `tools:` ships a grant a sibling line
  cancels.
  1. `tools:` becomes `Glob, Read, Bash` plus ten MCP identifiers —
     `mcp__artefact-graph__impact`, `dependencies`, `neighbors`, `path`, `orphans`, `search`,
     `get`, `stats`, `touched_by`, `history`. **`reindex` is excluded**: it rebuilds an index and
     this agent investigates.
  2. `disallowedTools:` drops `Bash` and keeps `Write, Edit, NotebookEdit, Grep`. It denies `Bash`
     today, which is why edit 1 alone changes nothing.
  3. `readonly: true` is added, matching `plan-readback-agent`. Both keys are kept for the reason
     that agent's own comment gives — provider dialects read different keys, and dropping either
     leaves some provider unenforced.
  4. The `description` and the body both read *"never modifies files or runs shell commands"*. The
     second half becomes false. Both are corrected to say it runs read-only graph queries and still
     writes no file.
  5. The agent answers its dispatch question from the graph first, and falls back to filename
     scoring only when the graph cannot answer.
  - **Consumes:** `add-artefact-graph resolves a question to a verb, and states the no-route case` (F1)
  - **Produces:** `framework-discovery-agent can query the graph over MCP or the CLI`
- **F3** [internal] — `.claude/commands/add-framework--brainstorm.md`: a gated step that states the
  question — who calls every artefact this design changes, and is that answer complete — placed where
  the artefact list exists, and producing the affected-artefact table's caller column. The STEP 1.2
  paragraph stops restating what the skill owns and points at it instead.
  - **Consumes:** `add-artefact-graph resolves a question to a verb, and states the no-route case` (F1)
  - **Produces:** `a command states the graph question and gates on its filled answer`
- **F4** [internal] — `.claude/commands/add-framework--plan.md`: STEP 3.2 states the question and
  gates on the answer instead of listing four calls. Must NOT lose the depth-1 grading rule or the
  risk table, which are about reading an answer, not about choosing a verb.
  - **Consumes:** `a command states the graph question and gates on its filled answer` (F3)
- **F5** [internal] — `.claude/commands/add-framework--build.md`: STEP 7.2 states its own question —
  what depends on a file nobody in this delivery opened — keeping its post-implementation timing,
  which is deliberate and different from `--plan`'s.
  - **Consumes:** `a command states the graph question and gates on its filled answer` (F3)
- **F6** [internal] — `.claude/commands/add-framework--sync.md`: **the literal calls stay.** STEP 2 is
  deterministic transcription with no agent — it runs `neighbors <artefact> --json` once per row to
  fill the ecosystem map's relationship columns, and `--json` is the point. `building-commands` keeps
  explicit bash exactly here: when the flags matter and are not obvious. What F6 changes is only the
  pointer — `add-artefact-graph` is named as the owner for any question outside that transcription
  loop, so the step stops implying those two verbs are the whole surface.
  - **Consumes:** `add-artefact-graph resolves a question to a verb, and states the no-route case` (F1)
- **F7** [internal] — `.claude/commands/add-framework--done.md`: the inline restatement of "what
  produces no graph node" becomes a pointer, and `add-artefact-graph` is declared in its `uses:`.
  **No investigative guidance is added** — this command feeds the index, it does not investigate.
  - **Consumes:** `add-artefact-graph resolves a question to a verb, and states the no-route case` (F1)
- **F8** [internal] — `.claude/commands/add-framework--plan.md`: STEP 1.2's read-list gains
  `docs/brainstorming/`, and `.claude/commands/add-framework--brainstorm.md`'s handoff names the
  design file path it wrote. Both halves, because the handoff alone breaks in Continue Mode.
- **F9** [internal] — `.claude/agents/framework-discovery-agent.md`: `prior_deliveries` joins its
  Input Contract, and its plan scan honours pre-resolved entries when given. Without this the
  brainstorm's claim that it avoids a third parser of the index is false — the agent scans anyway.
  - **Consumes:** `framework-discovery-agent can query the graph over MCP or the CLI` (F2)

#### T2 — The effort paths stop contradicting their own steps

- **F10** [internal] — `.claude/commands/add-framework--brainstorm.md`: STEP 4.1 and STEP 4.4 gain the
  path carve-out STEP 3's routing table already assumes. The table is the newer, deliberate design;
  `DO NOT skip any` predates it.
- **F11** [internal] — `.claude/commands/add-framework--brainstorm.md`: all three paths emit the
  closing report. STEP 3's table stops claiming `7.1`, `7.2` and `7.4` have nothing to show. A
  spike's recommendation and a bounded design in chat are the work, and the work is what the report
  carries.

#### T3 — Plain register, both layers

- **F12** [product] — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`: § Voice gains a register
  rule — short sentences, one idea each; the common word over the rare one; a technical term explained
  in one line the first time it appears. It sits beside the existing figurative-language rule and
  binds the same surface that one does, chat replies included. Must NOT become a banned-word list:
  the neighbouring rule says why, and the reason holds here for the same reason.
  - **Produces:** `a register rule stated once, in the product voice owner`
- **F13** [product] — `framwork/.codeadd/skills/add-final-report/SKILL.md` and
  **F14** [internal] — `.claude/skills/add-final-report/SKILL.md`: each gains the same register rule
  in its own vocabulary, applied to the closing summary. The summary itself stays — this changes how
  it reads, not whether it exists. The two files are deliberately not shared and each states the rule
  itself rather than pointing across the layer boundary.

  **Each also gains one banned subject: the report never narrates the author's own mistakes, nor how
  a reviewer corrected them.** That record belongs in the plan changelog, which already holds it. The
  closing message answers three things — what was decided, what is still open, and what needs
  watching. A line that grades the author's performance answers none of them and costs the reader
  the space where an open item would have gone.
  - **Consumes:** `a register rule stated once, in the product voice owner` (F12)
- **F15** [product] — the `> **LANG:**` line in all 16 `framwork/.codeadd/commands/*.md`, and
  **F16** [internal] — the same line in all 7 `.claude/commands/*.md`: the line gains the register
  clause. It already governs how the command talks and already sits at the top of every file, so it
  is the one surface that reaches everything said between the first step and the closing report.
  - **Consumes:** `a register rule stated once, in the product voice owner` (F12)

### Does NOT Include (important!)

- **`add-framework--release`.** It classifies changes by commit prefix and never asks the graph. That
  is a missing improvement, not a defect, and it is the command that publishes. Roadmap, not here.
- **`add-framework--roadmap`.** Its STEP 3 forbids `scripts/graph.js` on purpose, with the reason
  written down: it captures intent, not planning.
- **`plan-readback-agent`.** It keeps `Glob, Read`. A cold reader with graph access is no longer cold,
  and reading one document with nothing else in hand is the whole point of that seat.
- **`plan-review-agent` and `prompt-review-agent`.** Both already inherit every tool and were pointed
  at the skill by the 2026-09-12 delivery.
- **Merging the two `add-final-report` skills.** Their own source comments forbid it.
- **A numeric length limit anywhere.** `add-doc-schemas` prohibits numeric advisories in any rule
  constraining agent output, and this plan adds none.
- **An agent's own output, for the register rule.** No agent file in either layer carries a
  `> **LANG:**` line, so F15 and F16 do not reach one. That is deliberate: a dispatched agent's
  report is consumed by the coordinator, not read raw by the user — every command that dispatches one
  says so ("DO NOT show the raw report"). The register rule governs what reaches the user, which is
  the coordinator's own output and its closing summary. If an agent report ever becomes user-facing,
  it needs a surface this plan does not create.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Name the verb, or name the question? | **The question**, with a gate on the answer | A named verb is what held the coordinator to `history`. The gate answers the opposite risk — guidance with no output gets skipped, which is this repo's own diagnosis |
| Does the discovery agent get graph access? | Yes — `Bash` **and** the MCP tools | MCP reaches all eleven verbs; `Bash` is the route where MCP is not configured. That is the skill's own two-interfaces rule applied to the agent that needs it most |
| Does `plan-readback-agent` get it? | No | Its value is reading one document cold. Graph access ends that |
| Is `--done` in scope? | Only for the duplication | It feeds the index rather than investigating. The private copy of the skill's caveat goes; no investigative guidance is added |
| Is `--release` in scope? | No | No defect behind it, and it publishes |
| `bounded` / `spike` vs STEP 4 | STEP 4 gains the carve-out | The three-path routing is the newer, deliberate design; `DO NOT skip any` predates it |
| The closing report on all three paths | Yes, all three | The report carries the work, not a file. A spike produces a recommendation, which is what its blocks 2 and 3 are for |
| Where does the register rule live? | `add-doc-schemas`, both `add-final-report` skills, and the `LANG` line | Three surfaces that already exist and already govern voice. A new skill would be a fourth owner of one subject |
| Is the register rule a word list? | No | `add-doc-schemas` already explains why a word list holds in one language only, and the same reason applies |
| Does the executive summary stay? | Yes | The user asked for it kept. This changes how it reads |
| What does the closing summary answer? | Decisions taken, what is still open, what needs watching | User decision. It does not narrate the author's mistakes or a reviewer's corrections — the plan changelog already carries that, and a reader scanning for open items has to skip past it |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A command reaches the verb its question needs, including the four only MCP has | The certainty of knowing exactly which command line an agent will run |
| The discovery agent answers from the graph instead of scoring filenames | A strictly `Glob, Read` agent — it gains `Bash`, which is a wider capability |
| A register rule that catches the failure the existing voice rules let through | |
| One rule per surface instead of a private copy per command | |
| | **A weaker read-only guarantee for the discovery agent.** `readonly: true` becomes `permission: edit: deny` on OpenCode and `readonly: true` on Cursor — neither blocks a shell write. With `Bash` granted, the "writes no file" promise rests on the prose in the agent's body, not on the dialect. That is the cost of the access, stated rather than glossed |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Stating a question instead of a call makes the step easier to skip | Medium | **Proven for F3 only.** L3.1 asserts a design document cannot be written with the caller column empty. F4 gates the same way on its own Ecosystem Impact table (L3.5). F6 keeps its literal calls, so the risk does not reach it. **F5 is the residual:** `--build` STEP 7.2 writes no document, so it has nothing to gate on — it blocks instead on the audit stage's report naming what the graph returned, or naming it NOT VERIFIED. That is a weaker guarantee than the other three and is stated here rather than claimed away |
| The register rule is read as a word list and turned into one | Medium | F12 states the prohibition explicitly and cites the neighbouring rule's reason. L2.5 asserts no banned-word list appears in any of the four voice surfaces |
| Widening the discovery agent's allowlist lets it write | Low | F2 keeps the read-only statement in its body; L2.2 asserts the agent declares no write tool |
| The register rule lands in four places and they drift | Medium | F12 is the single statement; F13/F14 apply it to the closing summary and F15/F16 to the `LANG` line, each consuming F12. L2.4 asserts all four agree on the rule |
| The `LANG` edit touches 23 files and one gets missed | Medium | L1.2 counts them: 16 product and 7 internal, every one carrying the clause |
| MCP is unavailable and the discovery agent has no fallback | Low | F2 declares `Bash` too, and F1 adds the no-route line so an agent with neither says NOT VERIFIED instead of guessing |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `.claude/skills/add-artefact-graph/SKILL.md` | internal | modify | Question→verb resolution and the no-route case (F1) |
| `.claude/agents/framework-discovery-agent.md` | internal | modify | Allowlist, graph-first behaviour (F2), `prior_deliveries` contract (F9) |
| `.claude/commands/add-framework--brainstorm.md` | internal | modify | Gated question step and STEP 1.2 pointer (F3); handoff names the design path (F8); path carve-out (F10); report on all three paths (F11) |
| `.claude/commands/add-framework--plan.md` | internal | modify | STEP 3.2 states the question (F4); STEP 1.2 reads `docs/brainstorming/` (F8) |
| `.claude/commands/add-framework--build.md` | internal | modify | STEP 7.2 states its question (F5) |
| `.claude/commands/add-framework--sync.md` | internal | modify | STEP 2 states its question (F6) |
| `.claude/commands/add-framework--done.md` | internal | modify | Pointer replaces the private copy; skill declared (F7) |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | product | modify | § Voice gains the register rule (F12) |
| `framwork/.codeadd/skills/add-final-report/SKILL.md` | product | modify | Register rule for the closing summary (F13) |
| `.claude/skills/add-final-report/SKILL.md` | internal | modify | The same, in internal vocabulary (F14) |
| `framwork/.codeadd/commands/*.md` (16 files) | product | modify | `LANG` line gains the register clause (F15) |
| `.claude/commands/*.md` (7 files) | internal | modify | The same (F16) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

### L1 — Build-side unit (RED → GREEN)

1. `node scripts/build.js` exits 0 with no new warning, and the artefact graph records a
   `USES_SKILL` edge from `add-framework--done` to `add-artefact-graph`. *RED today: the edge does
   not exist.* Covers F7.
2. Every `framwork/.codeadd/commands/*.md` (16) and every `.claude/commands/*.md` (7) carries the
   `LANG` line **with** the register clause — 23 of 23. *RED today: 0 of 23.* Covers F15, F16.
3. `framework-discovery-agent.md`'s frontmatter declares `Bash` and the `artefact-graph` MCP tools.
   *RED today: `Glob, Read`.* Covers F2.

### L2 — Integration

1. No `.claude/commands/add-framework--*.md` names a `scripts/graph.js` verb as the instruction to
   follow. Naming one as an example beside a stated question is allowed; naming one as the whole
   instruction is not. *RED today: four commands do.* Covers F3, F4, F5, F6.
2. `framework-discovery-agent.md` declares no write tool and its body still states it writes no file.
   *Guard — green today, and written first so F2 cannot break it.*
3. `add-framework--plan.md` STEP 1.2's read-list names `docs/brainstorming/`, and
   `add-framework--brainstorm.md`'s handoff names the design file path. *RED today: neither.* Covers F8.
4. Each of the four voice surfaces — `add-doc-schemas` § Voice, both `add-final-report` skills, and
   the `LANG` clause — states the same three things **in its own wording**: short sentences with one
   idea each, the common word over the rare one, and a technical term explained in one line at first
   use. **Not byte-identity.** Both `add-final-report` skills forbid a check that keeps them
   identical, and this level must not become one. *RED today: absent from all four.*
   Covers F12, F13, F14, and the `LANG` clause of F15 and F16.
5. None of those four surfaces contains a list of banned words. *Guard — green today.*
6. `framework-discovery-agent.md`'s Input Contract declares `prior_deliveries`, and its plan scan
   states what it does when the field arrives filled. *RED today.* Covers F9.
7. `add-artefact-graph` states the case of an agent with neither MCP nor `Bash`. *RED today.* Covers F1.
8. `add-framework--done.md` contains no inline restatement of which paths produce no graph node, and
   points at the skill instead. *RED today.* Covers F7.

### L3 — Behavioural acceptance

1. Given a brainstorm on the architectural path whose design changes an artefact with a depth-1
   caller, the affected-artefact table names that caller, and the document cannot be written with the
   column empty. Covers F3, F10.
2. Given a spike, the closing report is emitted in the seven blocks. *RED today: the routing table
   says three of them have nothing to show.* Covers F11.
3. Given a bounded request, STEP 4 runs the abbreviated form the routing table describes, without
   the STEP 4.4 checklist blocking on sections that path does not fill. Covers F10.
4. Given a dispatch, `framework-discovery-agent` answers from the graph and reports its answer as NOT
   VERIFIED when it has no route. Covers F1, F2.
5. Given a plan whose change touches an artefact with a depth-1 caller, `--plan`'s Ecosystem Impact
   table names that caller, and the plan cannot be written with it absent. Covers F4.
6. Given a delivery's audit stage, `--build` STEP 7.2's report names what the graph returned for
   every artefact the delivery touched, or names it NOT VERIFIED. It writes no document, so this
   report line is the only thing it can be held to. Covers F5.

**RED expectations against the current tree:** L1.1, L1.2, L1.3, L2.1, L2.3, L2.4, L2.6, L2.7, L2.8
and all of L3 fail today. L2.2 and L2.5 are guards, written green and never claimed as RED→GREEN.
**GREEN = all levels pass after F1-F16.**

**L1.3 reads both frontmatter keys.** It asserts `tools:` lists `Bash` and the ten MCP identifiers,
`disallowedTools:` no longer denies `Bash` and still denies `Write, Edit, NotebookEdit, Grep`, and
`readonly: true` is present. A check on `tools:` alone passes while the agent stays blind.

**Every F-block has a level.** F1 → L2.7, L3.4; F2 → L1.3, L2.2, L3.4; F3 → L2.1, L3.1;
F4 → L2.1, L3.5; F5 → L2.1, L3.6; F6 → L2.1; F7 → L1.1, L2.8; F8 → L2.3; F9 → L2.6;
F10 → L3.1, L3.3; F11 → L3.2; F12/F13/F14 → L2.4, L2.5; F15/F16 → L1.2, L2.4.

---

## Execution Order

```
F1                        [internal]  the skill first — five F-blocks consume it
F2 → F9                   [internal]  the discovery agent: access, then its contract
F3                        [internal]  brainstorm's gated question — the pattern the rest copy
F4 → F5 → F6 → F7         [internal]  plan, build, sync, done
F8                        [internal]  docs/brainstorming reachability, both halves
─────────── working state ───────────
F10 → F11                 [internal]  the effort paths and the closing report
─────────── working state ───────────
F12                       [product]   the register rule, stated once
F13 → F14                 [product/internal]  the two closing-report skills
F15 → F16                 [product/internal]  the LANG line, 16 + 7 files
```

- **F1 first** because F2, F3 and F7 all consume it.
- **F3 before F4, F5 and F6** — it establishes the shape those three copy. Writing them first means
  three commands guess at a pattern that does not exist yet.
- **F12 before F13-F16.** One statement, then three applications of it. Reversed, four surfaces each
  invent their own wording, which is the drift the risk table names.
- **T3 last** because it touches 26 files and none of T1 or T2 depends on it.

**Working-state boundaries.** After F8 the graph half is complete and the repo builds. After F11 the
brainstorm is internally consistent. T3 is documentation-only — stopping before it leaves every
command working and the register unchanged.

**Per-F-block validation beyond the layer default.** F2 and F7 each run `node scripts/build.js`,
because both move graph edges. F15 and F16 run L1.2's count, because a 23-file sweep is where one
file gets missed.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED. L2.2 and L2.5 are guards and must be
   labelled as such, never claimed as RED→GREEN.
2. **A stated question that is really a named verb wearing a question mark.** L2.1 matches strings.
   Read F3 through F6 and check each states what must be answered, not which command to run.
3. **The register rule turned into a word list**, in any of the four surfaces. L2.5 catches a list;
   it does not catch four words of advice that function as one.
4. **The 23-file `LANG` sweep.** L1.2 counts. Confirm the clause reads the same in all 23, not merely
   that something was added to each.
5. **`framework-discovery-agent` still writing nothing.** It gained `Bash`. L2.2 asserts the
   declaration; read the body and confirm no step now tells it to write.

## References

- Design: `docs/brainstorming/2026-09-13T114957-brainstorm-graph-gate-placement.md` — superseded on
  one point, recorded in Validated Decisions.
- Prior art: `2026-09-12T221117-PLAN--agent-git-safety-and-dynamic-artefact-indexing` created
  `add-artefact-graph` and pointed both review agents at it. This plan finishes that sweep —
  `--done` and the discovery agent were the two it did not reach.

---

## Next Steps

/add-framework--build graph-question-first-and-plain-voice

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-13 | Initial creation |
| 2026-09-13 | Implemented. F1-F16 landed in 569a6c5..95abe63, one commit per F-block, in the plan's execution order. STEP 7 dispatched 13 auditors (3 scopes + 10 ruler ticks): 30 findings, 20 applied in 71331f3 and d64f7b7, 10 rejected with rulings. Three applied findings were regressions this delivery introduced — a false claim about the discovery agent's allowlist in `--brainstorm`, the pre-change LANG line surviving in both command templates, and the new no-self-narration ban colliding with `add-build-ledger`'s exhaustive-rulings rule. Two were gates pointing at nothing: `--build` STEP 7.2 blocked on a report STEP 7.3 never writes (now a ledger `GRAPH:` line), and `--done`'s pointer target did not carry `.gitignore` (now answered by its own row). Scope grew by two files the plan never named: `add-framework-internal-layer`, which carried the same named-verb defect on the highest-traffic internal surface, and the two authoring skills' LANG templates. Full L1+L2 matrix green, 11 of 11; L2.2 and L2.5 are guards and were never claimed as RED→GREEN. |
| 2026-09-13 | Review `fix-then-ok` applied. F2 grew from one edit to five: the agent denies `Bash` in `disallowedTools` today, so granting it in `tools:` alone changes nothing; the ten MCP identifiers are now named (`reindex` excluded); `readonly: true` is added to match `plan-readback-agent`; and the description and body, which both say the agent never runs shell commands, are corrected. F6 narrowed — `--sync` STEP 2 is deterministic `--json` transcription and keeps its literal calls. L2.4 reworded away from byte-identity, which both `add-final-report` skills forbid. Risk 1's mitigation narrowed to what is proven, with `--build` STEP 7.2 named as the residual. Added L3.5 and L3.6 so F4 and F5 have behavioural coverage. Agent output declared out of scope for the register rule, with the reason. File count corrected to 26 |
