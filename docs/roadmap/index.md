# Roadmap

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

---

## 1. Delivered-work relationships

### 1.1 — Relationship index/graph in delivered documents

**Scope:** both
**TLDR:** Changelogs and deliveries carry a relationship index/graph so add.brainstorm, add.new, add.plan and add.hotfix can find related delivered work when opening a feature, investigating a hotfix or drafting a technical plan.

- Builds on what already exists: the `related:` frontmatter across the add-doc-schemas, the `## Relations` section every work item now carries, and the `CHG[NNNN]` changelog add.done closes with `related:` pointing at the closed `[NNNN]F`/`[NNNN]H`. **`templates/related.md` is gone and the `hotfix-related` schema is retired** — the document format that replaced them is what this item now builds on.
- Adjust how documents are saved and related (changelog, deliveries archiving) so the index becomes the base for the next phase, not a one-off annotation.
- Prepare the ground for vector search over delivered docs — the planned next step, which reaches documents the index alone does not surface.
- **Done when:** an add.new or add.plan run reaches a previous delivery's related docs through the index (not only text search), and a new hotfix records its cause as a typed `caused_by` relation in its own about.md.

  > **Revised on delivery, 2026-09-12.** The original criterion said the hotfix must cross-update the `related.md` of every feature it impacts. Under a graph that is writing one fact twice: a `caused_by` declared on the hotfix already yields the inbound edge on the feature, and `related.md` is no longer written by anything. The outcome the criterion wanted — a hotfix's connections being findable from the feature — is delivered by the edge, not by the second write.

### 1.2 — Migration command: initial relationship graph for old installs

**Scope:** product
**TLDR:** An opt-in command that builds an initial relationship structure over features delivered before the new format existed, grouped by app/group/category as a tree or graph, so the agent can find correlated features and know what to search.

- Depends on 1.1 — migrating existing projects into the format only makes sense once 1.1 defines it.
- Scan past deliveries (docs/features, changelogs) and group them — by app, group or category, tree or graph: the shape is still open.
- Ships as an enabled feature, not part of the default flow.
- When the gitnexus plugin is enabled, the graph also points at what to search in gitnexus per group.
- **Done when:** running the command on a project with pre-format deliveries produces the initial grouped structure with relationships filled, and add.new/add.plan/add.hotfix use it as the investigation entry point.

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
- `framwork/.codeadd/skills/add-knowledge-discovery/SKILL.md:69` and `:75` name two literal actions, `--action=search` and `--action=touched_by`. The docs corpus answers more than those two, and an agent runs what is written and stops.
- `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/SKILL.md` already resolves intent to a native skill, which is the right shape — but its "Command-intent resolution" section then pins each command to exactly one: `add.plan` → `gitnexus-impact-analysis`, `add.new` → `gitnexus-exploring`, and so on. A planning run that needs to trace an error has the mapping pointing the other way.
- The 6 command fragments and 9 agent fragments under `framwork/.codeadd/plugins/gitnexus/fragments/` carry the same fixed mapping into every command and agent the plugin reaches, so a change to the mapping alone does not reach them.
- The product layer has no owner for question-to-call resolution. `add-knowledge-discovery` covers when to consult, not which call answers which question — the role `add-artefact-graph` plays internally has no product counterpart, and deciding whether that is a new skill or a section inside an existing one is part of this item.
- Carry over the two things the internal delivery learned: an empty answer is a finding and a missing route is not, so they must not be merged; and a command that only states a question gets skipped, so each one needs a gate on a filled answer.
- **Done when:** no product command or fragment names an MCP action or a gitnexus native skill as the whole instruction, `grep -rn "action=\|Command-intent resolution" framwork/.codeadd/` returns only the resolution table itself, and a product command asked a question outside its pinned mapping reaches the right call.


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
