# Roadmap

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

---

## 1. Delivered-work relationships

### 1.2 — Migration command: initial relationship graph for old installs

**Scope:** product
**TLDR:** An opt-in command that builds an initial relationship structure over features delivered before the typed-relation format existed, grouped by app/group/category as a tree or graph, so the agent can find correlated features and know what to search.

- **The relationship format this item migrates INTO is delivered, so nothing blocks this any more.** (It was item 1.1, removed from this roadmap on delivery — `git log docs/roadmap/index.md` has it.) `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` shipped the typed `## Relations` section, the closed vocabulary (`caused_by`, `depends_on`, `part_of`, `links_to`) and the docs-corpus MCP that reads them. `templates/related.md` is gone and the `hotfix-related` schema is retired.
- **Half of the migration also shipped.** `cli/src/migrations.js` migration 0002 (`harvestRelations`) walks a brownfield project's `docs/`, harvests the relationships it already wrote — body references, `related:` ids, Follow-up sentences — and writes them as `links_to` lines. Additive-only: it never deletes, never commits, and reports every id that resolves to no work item.
- **What is left is the project that declared nothing.** 0002 finds nothing in a project whose documents never named each other, and that is the common case for deliveries predating the format. Such a project needs a structure derived from what its deliveries have in common — path overlap, directory, domain — rather than from a declaration nobody made.
- Scan past deliveries (`docs/features`, changelogs) and group them — by app, group or category, tree or graph: the shape is still open, and choosing it is the first half of this item.
- Ships as an enabled feature, not part of the default flow.
- When the gitnexus plugin is enabled, the grouping also points at what to search in gitnexus per group.
- **Deliberately deferred past item 4 and past 1.3.** Item 4.1 repairs the `add-knowledge-discovery` step this command would consult on its first run, and 1.3 decides where a work item's file set lives — which is half of what this migration would have to write. Building the migration before either one would hang it on a lookup that answers wrong and on a destination nobody has chosen. The usual "finish everything above before starting" rule is suspended for those two reasons, and recorded here rather than left as an unexplained skip.
- **Done when:** running the command on a project whose deliveries declare no relationship produces the initial grouped structure with relationships filled, and add.new/add.plan/add.hotfix use it as the investigation entry point.

### 1.3 — The impact question: which deliveries touched this file

**Scope:** product
**TLDR:** "Who has already changed this file?" has no working answer in the current document format. The only thing that ever filled a work item's file set is a schema that was retired, and a deliberate coupling in the brownfield migration keeps that dead schema being read instead of converting it. Build the capability properly and delete the legacy path — no compatibility branch.

- **Do this BEFORE 1.2.** Two commands that already shipped ask this question and get half an answer, while 1.2 is a migration for projects that have not adopted the format yet. The usual top-down order is suspended for the same kind of reason 1.2's own deferral is recorded.

- **What is broken, verified 2026-09-14.** `mcp/engine.mjs:405` answers `touched_by` by matching the query's paths against `node.files`. In the **docs** corpus, `mcp/corpora.mjs:389` is the ONLY thing that ever populates `node.files`, and it fires for exactly one document type:
  ```js
  if (attachment.type === 'hotfix-related') {
    for (const file of parseImpactedFiles(attachment.content)) { ... }
  }
  ```
  `hotfix-related` is marked `### hotfix-related (retired)` at `add-doc-schemas/references/fix.md:52`. No command and no template writes it. **So in any project on the current format, `touched_by` returns `workItems: []`.** Its `pages` half still works, because a wiki page's `sources` globs are unrelated to this. The **artefacts** corpus is unaffected: there `files` comes from the node's own path (`corpora.mjs:512`).

- **⛔ No backward compatibility, and no second path. This is the requirement, not a preference.** `cli/src/migrations.js:309-311` states the coupling in its own words: *"The file list is read by the INDEX, straight from this attachment, so nothing is written for it here. It is counted because the migration report is what tells a user the list was found."* That is a live reader kept alive for a retired schema, and it is why the current format was never given a file set of its own — the legacy path answered just well enough that nobody noticed the new one was missing. The work is: build the capability for the current format, and **delete** `corpora.mjs:389`, `parseImpactedFiles` and the migration's count-and-point.

  **Converting the legacy list was dropped during the build, deliberately.** This item first asked the migration to convert an `Impacted Files` section into the new home. Two findings killed it. The delivered answer derives the delivery's own commit, so the complete file set is the commit's diff — a hand-written list is a worse copy of something git already holds exactly. And nobody hand-wrote those lists: `/add.hotfix` STEP 12 did, so there is no author's work to preserve and no author to inform. A counter that only reported them was kept for one round and then deleted for the same reason — reading a dead schema's section name is still reading it.

- **The shape is open, and the honest question is where a work item's file set lives.** Three candidates, none chosen:
  - **`docs/delivered.jsonl` `items[].at`** already holds it — up to five paths per delivery, each with a line saying what changed there. It answers delivery → files today. The objection to reading it backwards is recorded in `delivered.sh` itself: `--repair` rewrites `at` on every anchor move, so matching on it can return an entry on the strength of a stale pointer. That objection was written about TEXT SEARCH; a typed file lookup is a different operation and needs its own answer, not an inherited one.
  - **The `about.md` records its own file set**, written at close-out, where the diff is already in hand.
  - **Git is the floor.** `git log --follow <path>` answers "who touched this" with no index and no plugin, always. Whatever is built must degrade to it rather than to nothing.

- **Two shipped commands are waiting on this.** `add.review` STEP 2.2 hands its judges "the deliveries that last changed these files" and currently hands them wiki pages only; `add.hotfix` STEP 9.1 asks the same question of the fix's own diff. Both were made explicit by `2026-09-14T102848-PLAN--product-knowledge-discovery-answers-the-question`, which is how the gap surfaced — neither command caused it.

- **This is the umbrella's subtopic 003**, `docs/brainstorming/2026-09-12T075635-delivered-work-relationships-000-umbrella.md`, which called it defect 2 — *"The impact question has no verb"* — and reserved a design that was never written. Item 1.1 closed without it.

- **Done when:** `touched_by --corpus=docs` returns the work items for a file in a project written entirely in the current format, with no `hotfix-related` document anywhere; `grep -rn "hotfix-related|Impacted Files|parseImpactedFiles" mcp/ cli/src/` returns nothing; and `add.review` STEP 2.2 and `add.hotfix` STEP 9.1 each receive work items, not only pages.

- **Two clauses left this item and are recorded rather than dropped.** Converting the legacy list was rejected, for the reasons above. **The git fallback for a project with no index at all moved to 1.4**, where it belongs: a project with no index is the extreme case of a project whose documents the MCP cannot read, and 1.4 is the item about that.

### 1.4 — A doctor for document schemas, and an opt-in pass that makes a project's documents fit

**Scope:** product
**TLDR:** Every docs-corpus answer is only as good as the frontmatter and the sections of the documents underneath it. Nothing tells a user which of their files the MCP can read and which it skips, and nothing offers to fix the ones it cannot. Two pieces: a **doctor** that reports fitness per file, and an **opt-in skill** that reads a project's features and rewrites their headers to the current schema.

- **Do this BEFORE 1.2.** 1.2 migrates relationships into a project that declared none; it cannot know what it is walking until something reports which documents are already readable. The doctor is that report. The same suspension 1.3 records applies here for the same kind of reason.

- **What made this urgent.** 1.3 deleted the last reader that tolerated an old document shape. From now on a document is either in the current format or it is **invisible to the MCP, silently** — it parses, it lands in the corpus, and it answers nothing. Silence is the defect: an empty answer and an unreadable file look identical from the caller's side, which is the exact confusion `add-knowledge-discovery` already had to be taught to separate.

- **The doctor reports, and writes nothing.** For every document in the docs corpus: fit, off-standard, or unreadable, naming the field or section that is missing rather than a score. `add-doc-schemas` owns the schemas, so the doctor reads them from there — a doctor that restates a schema drifts from it, and the drift is invisible until the two disagree about what "fit" means.

- **The fix pass is a skill, not a codemod.** It reads each feature's document and adjusts the header — frontmatter `type` and `id`, the `## Relations` block — to the current schema. It has to be an agent reading the content, because deciding a document's type and its relations is a judgement, not a text substitution. Opt-in, and it edits headers only: never a body, never a deletion.

- ⛔ **The user writes nothing by hand.** Every one of those documents was written by a command, so a migration that hands the user a list of files to edit is addressing the wrong actor. The skill's output is the edit; the user's part is approving it. This is the rule 1.3's build established, and it is what killed the legacy converter there.

- **Carried over from 1.3: the behaviour with no index at all.** `touched_by` answers empty in a project that has never run a close-out. `git log --follow <path>` answers it with no index and no plugin, always. Whatever ships must degrade to that rather than to nothing — and the doctor is where a user finds out which of the two they are getting.

- **The open question, and it is why this is recorded and not planned.** Where does the doctor live?
  - **An MCP action**, beside `search` and `history` — the agent asks it mid-flow, in the same session it is about to query, and gets the caveat before the answer. Costs an action on a surface that already has eleven.
  - **A CLI verb**, `codeadd doctor` — a user runs it once after install, reads a report, and decides. Costs the agent a route it cannot take on its own.
  - **Both, over one implementation.** That is already the shape `scripts/graph.js` and `mcp/` hold over one sidecar, asserted identical by test rather than shared by code. It is the likeliest answer and it is still a decision, not a default.

- **Done when:** a project holding a mix of current-format and off-standard documents gets a per-file verdict naming the missing field; the opt-in skill converts an off-standard feature header and the same file then answers a docs-corpus query it did not answer before; no body text is modified and no document is deleted by either piece; and `touched_by` on a project with no index at all returns the documented git answer instead of an empty list.


## 2. Obsolescence and backward compatibility

### 2.1 — Treat obsolete code and backward compatibility as first-class concerns

**Scope:** product
**TLDR:** /add.build and /add.hotfix explicitly ask whether the work must preserve backward compatibility; when it does not, they guide the author to propose a migration or cleanup script. /add.done surfaces any dead code the feature left behind before merging.

- Add a backward-compatibility question to `/add.build` (around STEP 6/8) and `/add.hotfix` (around STEP 7/8), and record the answer in `plan.md` / `about.md` / hotfix `about.md`.
- When backward compatibility is **not** required, require a migration or data-cleanup artifact (script, SQL, worker, or explicit manual steps) before the feature/hotfix can be considered complete.
- Add a dead-code detection pass to `/add.done` (before merge) that lists unused files, unreachable routes, orphaned exports, or tables/columns left behind by the delivery.
- Extend the relevant `add-doc-schemas` (`feature-plan`, `hotfix-about`, `changelog`) to carry the compatibility decision and any attached migration/cleanup artifact.
- **Done when:** a feature that rewrites an existing model produces a `plan.md` entry stating `backward compatibility: no` plus a migration script path, and `/add.done` reports either `dead code: none` or a concrete cleanup candidate list.

## 3. Prompt density

### 3.1 — Sweep the artefacts for text that informs without instructing, and name the rule that keeps it out

**Scope:** both
**TLDR:** A pass over every command, skill and agent removing passages that explain rather than instruct, plus a named rule in `building-commands` so the next author recognises the shape before writing it.

- The rule already half exists: `.claude/skills/building-commands/SKILL.md:583` carries ruler item 7 ("No filler"), and `@prompt-review-agent` ticks it. What it lacks is the concrete shapes to look for — the abstract test "does this change what the executor does" did not stop four instances being written into one delivery and shipped past a five-auditor review.
- Name the recurring shapes in item 7, each with an Expected / Not expected pair like the other items carry: telling artefact A how artefact B behaves when nothing in A branches on it; restating a rule already stated a few lines above in different words; explaining the mechanism behind a change, which belongs in the changelog and the commit message because a human reads those once and an agent reads the prompt every run.
- Keep the distinction the ruler already draws, so the sweep does not strip what is load-bearing: a scope statement (which commands a section covers, which phase an exemption applies to) and a prohibition restated at the exact point where skipping it is tempting both change what the reader does. Only the passages that survive removal without changing any action come out.
- Sweep 106 artefacts: 16 commands, 43 skills and 22 agents under `framwork/.codeadd/`, plus 7 commands, 10 skills and 8 agents under `.claude/`. Product artefacts ship to users and are read on every run, so they pay the token cost repeatedly.
- Decide whether anything mechanical can back the rule. Nothing in `cli/tests/` or `scripts/` enforces item 7 today, and a text heuristic for "informs without instructing" may not exist — if it does not, say so in the plan rather than shipping a gate that misses.
- **Done when:** ruler item 7 names the shapes with examples, a run of `@prompt-review-agent` over a deliberately padded artefact flags them by shape rather than by feel, and the sweep's diff shows every artefact it touched with the removed passages listed per file.


## 4. MCP utilisation in the product layer

### 4.1 — Product commands ask the MCP by question, not by named verb

**Scope:** product
**TLDR:** The shipped knowledge-graph MCP and the gitnexus plugin stop being reached through a fixed verb or a fixed skill per command; a command states what it must answer and a skill resolves that to the right call, the way the internal layer now does.

- The internal layer fixed this on 2026-09-13: commands stated a question and `add-artefact-graph` resolved it to a verb. The product layer still carries the shape the fix removed, one level up — it pins a call or a skill per command instead of naming a verb.
- ~~`add-knowledge-discovery`'s GRAPH step named two literal actions, `--action=search` and `--action=touched_by`, while the docs corpus answers eleven.~~ **Done** — the step now states a question and resolves it in a table covering all eleven.
- ~~`add-gitnexus`'s "Command-intent resolution" section pinned each command to exactly one native skill, so a planning run that needed to trace an error had the mapping pointing the other way.~~ **Done** — that section is now `## Resolving an intent` and resolution runs off the intent in hand.
- **The 9 agent fragments** under `framwork/.codeadd/plugins/gitnexus/fragments/agents/` each pin a native skill inline — `reviewer-agent.md` reads "load skill `add-gitnexus` (→ `gitnexus-pr-review` and `gitnexus-impact-analysis`)" — so a change to the mapping alone does not reach them. **The 6 command fragments carry no pin.** Verified 2026-09-14: none contains a `gitnexus-` name. They state the intent and stop, which is already the target shape, and editing them would remove correct text.
- The product layer has no owner for question-to-call resolution. `add-knowledge-discovery` covers when to consult, not which call answers which question — the role `add-artefact-graph` plays internally has no product counterpart, and deciding whether that is a new skill or a section inside an existing one is part of this item.
- Carry over the two things the internal delivery learned: an empty answer is a finding and a missing route is not, so they must not be merged; and a command that only states a question gets skipped, so each one needs a gate on a filled answer.
- **Done when:** `add-knowledge-discovery`'s GRAPH step resolves all eleven actions in `mcp/engine.mjs` instead of naming two; no gitnexus agent fragment names a `gitnexus-*` native skill; `add-gitnexus/SKILL.md` carries no section mapping a command name to a native skill; and a product command asked a question outside its former pinned mapping reaches the right call.
- ⛔ **Do not use `grep -rn "action=" framwork/.codeadd/` as the check.** It also matches `qa-evidence.sh:329` and `:340`, and JSX in `add-stripe/` and `add-ux-design/`. And `add.done.md`'s `--action=reindex` and `--action=stats` are operations, not questions: an operation with exactly one call correctly names it, and this item does not touch them.


## 5. Gates that assume the main checkout

### 5.1 — The close-out's post-merge checks give a false verdict inside a worktree

**Scope:** both
**TLDR:** Two of `/add-framework--done`'s gates fail for reasons that have nothing to do with the delivery when the command runs from a worktree, and one of them refuses the cleanup of a delivery that archived correctly.

- **Check 3 reads a path, and the path is too long inside a worktree.** `.claude/commands/add-framework--done.md:490` and `:492` verify the archive with `git show origin/main:docs/deliveries/<id>/<file-member>`. Run from a worktree that is 97 characters deep, against a member path of 152, git tries to stat the whole string including the `origin/main:` prefix and answers `fatal: failed to stat ... Filename too long`, exit 128. Measured on 2026-09-14 closing `2026-09-13T153219-PLAN--test-terminal-states-and-qa-feature-boundary`: one of four members reported missing while `git ls-tree` proved all four were on `main`. From the primary checkout the same path is 63 characters shorter and resolves.
- **The consequence is worse than a wrong line of output.** Check 3 sits inside the gate at `:504` that refuses every deletion in STEP 8, so a delivery whose archive reached `main` intact has its worktree, its branch and its local originals left behind, and the operator is handed a `/add-framework--plan` suggestion for a problem that does not exist.
- **The fix is to stop stating a path.** `git ls-tree "origin/main:docs/deliveries/<id>/"` yields each member's object id, and `git cat-file blob <oid>` streams it without touching the filesystem — so checks 3 and 5 work at any depth and the `cmp` in check 5 keeps its meaning. This was done by hand on the run above; nothing in the command records it.
- **Check 5 also needs the Windows note it does not have.** `core.longpaths` is unset in this repository, which is git's default, so the limit applies as described rather than being a local misconfiguration someone can be told to fix.
- **The second failure is the bats gate, for a different reason.** A fresh worktree has no root `node_modules`, so `npm run test:scripts` exits **127** with `./node_modules/.bin/bats: No such file or directory`. `:225` already teaches the command that exit **2** is a refusal rather than a red suite; 127 is a third outcome it does not name, and it reads like neither. Running `npm install` at the worktree root fixed it and the full 415-test suite passed.
- **Decide whether the product layer needs the same guard.** `framwork/.codeadd/scripts/build-setup.sh` ships `--worktree` and puts users' own builds in exactly this position, and `framwork/.codeadd/commands/add.done.md` names `worktree` nowhere. It carries no equivalent of the five post-merge checks today, so this may be internal-only — but that is a question to answer from the product close-out's own text, not to assume from the absence of a grep hit.
- **Done when:** `/add-framework--done`'s checks 3 and 5 resolve members by object id rather than by path, a close-out run from a worktree at least 90 characters deep completes STEP 8 without refusing a deletion, `:225` names exit 127 alongside exit 2 with the `npm install` remedy, and the product close-out carries either the same guard or a recorded reason it does not need one.
