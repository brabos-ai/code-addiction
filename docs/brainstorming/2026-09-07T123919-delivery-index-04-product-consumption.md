# Brainstorm: Delivery Index — Consumption and Disposable Docs

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **04 of 08**, subtopic 3 of `2026-09-07T123919-delivery-index-01-product-umbrella.md`
> **Consumes:** the record shape from the `schema` subtopic and `delivered.sh` from the `write-verify` subtopic
> **Corrects:** the umbrella's definition of "level 2". See Key Decisions — two files it listed for deletion have post-merge readers

## Discovery

- **`add-knowledge-discovery`** — the framework's existing answer to "consult what we already know before dispatching agents". Loaded at the discovery step of **five** commands: `add.plan`, `add.hotfix`, `add.new`, `add.diagnose`, `add.review`. Its own description already reaches past the wiki — *"consult the project wiki (and code knowledge graph)"*. A seven-step procedure: PRESENCE → ENTRY → SELECT → FRESHNESS → STRUCTURE → HANDOFF → CONFLICT.
- **`add.brainstorm` does not load it.** It has its own `STEP 1: Load Context & Recent Activity (AUTOMATIC - SILENT)`.
- **`@feature-history-agent`** — dispatched by `/add.hotfix` with the prompt *"Find existing features whose docs (about.md, changelog.md, plan.md) plausibly relate to this bug. Scan `docs/features/`, score relevance, deep-read top-10."* It scans the whole directory from scratch, every time.
- **`/add.diagnose` STEP 5** — *"Check for doc-code drift — compare what about.md/plan.md claim vs what the code does."*
- **`cli/src/features.js`** — the `FEATURES` registry: `description`, `default`, `aliases`. The key doubles as the fragment directory name, so renaming a key renames a directory.
- **`/add.done` STEP 6 commit discipline** — generated output stays in the working tree; `done.sh --merge` at STEP 8 commits it.

**Measured, not assumed** — which commands read each feature-directory file:

| File | Read by | Any reader *after* the merge? |
|---|---|---|
| `discovery.md` | audit, build, done, new, plan-to-ready, plan, review | **No** |
| `tasks.md` | build, done, plan-to-ready, plan, review | **No** |
| `epic.md` | build, done, new, plan-to-ready, plan | **No** |
| `review-NNN.md` | build, done, plan-to-ready, review | **No** |
| `plan.md` | build, done, plan-to-ready, plan, review, **diagnose**, **hotfix** | **Yes** |
| `iterations.*` | build, done, plan-to-ready, review, **`add.new`** | **Yes** |
| `about.md` | eleven commands, including diagnose and hotfix | **Yes** |
| `design.md` | build, plan-to-ready, plan, qa-setup, review | No, but see Key Decisions |
| `changelog.md` | brainstorm, done, hotfix, new, pull-request | **Yes** |

## Context & Motivation

The index is worth nothing unread. Two questions remain, and the second is the one the owner actually asked for at the start of this brainstorm: *"eu poderia MUITO BEM remover essa documentação bruta gerada para desenvolvimento."*

Answering the second honestly required measuring rather than assuming, and the measurement contradicted a decision the umbrella had already recorded as validated. That contradiction is resolved here, loudly, rather than shipped.

## Problem / Opportunity

**On reading:** six commands run a discovery step, and none of them can currently ask *"have we built this before?"* They ask *"how does this area work?"* — which the wiki answers — and they scan `docs/features/` from scratch when they need history. Wiring the index into six commands separately would be six edits that drift.

**On pruning:** the umbrella defined level 2 as deleting `discovery.md`, `plan.md`, `tasks.md`, `review-*.md`, `epic.md` and `iterations.*`. The table above shows `plan.md` and `iterations.*` have post-merge readers — and not incidental ones:

| File | Post-merge reader | The line |
|---|---|---|
| `plan.md` | `/add.hotfix` STEP 4 | *"Find existing features whose docs (about.md, changelog.md, plan.md) plausibly relate to this bug"* — the `@feature-history-agent` dispatch |
| `plan.md` | `/add.diagnose` STEP 5 | *"compare what about.md/plan.md claim vs what the code does"* — the doc-code drift check |
| `iterations.*` | `/add.new` STEP 3 | *"For matches, read iterations.jsonl + about.md, classify relationship"* — Past Features Discovery, reading **other, already-shipped** features via `RECENT_CHANGELOGS`. **This row alone carries the argument** |

(`/add.new`'s Continue Mode also loads `iterations.jsonl`, but that is the in-progress feature's own file across a re-invocation — useful, and *not* evidence for this reversal. It is left out deliberately.)

**An earlier draft of this document credited `iterations.*` to `/add.hotfix`. That was wrong** — hotfix only *writes* its own `docs/features/[NNNN]H-<slug>/iterations.jsonl` at STEP 15 and never reads the target feature's. The real reader is `/add.new`, and the correction strengthens the case rather than weakening it: `add.new`'s stated purpose for that read is *"understand prior implementations/pivots, avoid re-work"* — **the exact job this index is being built to do.** Deleting the file would remove a working instance of the capability while building a new one.

Deleting either file would degrade exactly the discovery and bug investigation this design was commissioned to improve.

## Proposed Solution

### 1. One insertion point: `add-knowledge-discovery`

The index becomes a source inside the skill five commands already load, rather than a new step in each. One edit, five consumers, no drift.

`add.brainstorm` **gains the skill**, and its existing behaviour is what makes this worth doing. Its STEP 1 already reads *"CLAUDE.md, product.md (if exists), and implemented features from `docs/features/`"* — an **unranked scan of the whole directory**, which is precisely the landfill read this index exists to replace. So the index does not sit beside that line; **it replaces it.** STEP 1 keeps its `status.sh` parse and its changelog matching, and swaps the raw `docs/features/` sweep for a ranked, status-labelled lookup.

That makes this a substitution rather than an addition, and it lands on the command most likely to re-invent something already built.

**The substitution costs something, and it needs the same fallback `@feature-history-agent` has.** The old sweep read `about.md`-level content — business rules, integration points — across the directory. An index entry carries 3–5 anchored items and, by the schema's own rule, *never* an explanation of what the code does. For an open-ended ideation partner that is a real narrowing, not just a dedup. So brainstorm mirrors the agent's two-stage shape: **the index ranks, then `about.md` is deep-read for the entries that matched.** Ranked-then-deep-read, on a handful of features instead of the whole directory — which was the point.

### 2. The index is consulted *before* the wiki

They answer different questions at different costs, and the cheap one goes first:

| Source | Answers | Cost |
|---|---|---|
| **Delivery index** | *Was this built? Is it still there? What replaced it?* | One grep over one file |
| **Wiki** | *How does this area work today?* | Several pages |
| **gitnexus** (when enabled) | *What calls what?* | An MCP round trip |

The skill's procedure gains an INDEX step ahead of PRESENCE. Its absence is a no-op with a note, exactly as the wiki's absence already is — no project is broken by not having one yet.

### 3. Dead entries rank lower; they are never hidden

The schema forbids filtering them, and consumption is where that rule earns its keep. A `gone` or `superseded` result is frequently **the most valuable answer available**: it says the thing was tried and dropped, which is precisely what stops a plan from rebuilding it.

Returned entries are ordered `live` → `changed` → `superseded` → `gone`, each carrying its status and, for `superseded`, its replacement's id. A consumer that hides the tail has reproduced the original failure with the sign flipped.

### 4. `@feature-history-agent` reads the index first — and the skill's wiki-blind boundary must not block it

The agent scans `docs/features/`, scores relevance and deep-reads the top ten. It keeps doing exactly that; the index goes into its dispatch payload as a pre-filtered candidate list, so the scan starts from ranked ids instead of an unranked directory. Method unchanged, starting point better.

**But there is a boundary in the way, and it has to be resolved rather than stepped over.** `add-knowledge-discovery`'s own *When NOT to Use* says:

> *"Bug-cause investigation in `add.hotfix` STEPs 4-6 — diagnosis stays history/code-driven and wiki-blind; this skill enters only at fix time."*

`/add.hotfix` dispatches `@feature-history-agent` at **STEP 4** — four steps before the skill loads. Housing the index inside that skill would put it out of reach at exactly the moment it is most useful. (`/add.diagnose` has no such problem: its STEP 1.4 load already precedes its STEP 4 dispatch.)

**The INDEX step is therefore a standalone sub-procedure of the skill, loadable without PRESENCE and the wiki**, and the skill's *When NOT to Use* bullet is amended to say so explicitly.

**Why this does not reopen the wiki-blind rule — stated as an inference, because no source records the rule's intent.** `add-knowledge-discovery/SKILL.md` carries the bullet and nothing anywhere explains it. The reading taken here is that it protects diagnosis from **narrative documentation that can lie about the code**, so a diagnosis trusting prose over evidence chases the wrong cause. The index is not narrative: it records what shipped, in anchored items, not what the code means. On that reading, withholding it from a diagnosis inverts the rule's purpose. A different reading is possible — that the rule protects the *unfiltered* character of the investigation — and if the rule's author ever states it, this exemption is the thing to revisit.

**But the exemption alone is not enough, because of a second prohibition the first fix walked past.** `/add.hotfix`'s own table says: *"IF HISTORY AGENTS NOT DISPATCHED: ⛔ DO NOT USE: Grep on code files."* And `delivered.sh read` verifies at read time — it greps source. Loading the index at STEP 4 would break that rule while satisfying this one.

> **At `/add.hotfix` STEP 4 the index is read with `--no-verify`: stored statuses, no source access.** The full verifying read happens at STEP 8.1, inside the normal skill load, once the prohibition has lifted.

This is better than claiming a second exemption. The stored status is not a guess — it is whatever the last `verify` established — so STEP 4 gets a ranked, labelled candidate list with zero code access, and the prohibition stands untouched. It also explains why hotfix reads the index twice: **STEP 4 unverified for triage, STEP 8.1 verified at fix time**, when the root cause is known and a re-query is worth its cost.

The amended bullet must say both halves: the wiki stays out of hotfix STEPs 4–6; the index enters, unverified.

### 5. `docs-pruning` — corrected, and derived rather than listed

**The rule, which outlives any list:**

> A file may be pruned if and only if **no command reads it after the merge**.

Applying it to today's tree:

| Pruned | Kept | Why kept |
|---|---|---|
| `discovery.md` | `about.md` | Eleven readers, including diagnose and hotfix |
| `tasks.md` | `plan.md` | `@feature-history-agent`'s named input; `/add.diagnose`'s drift check |
| `epic.md` | `iterations.*` | `/add.new`'s Past Features Discovery — *"avoid re-work"* |
| `review-NNN.md` | `changelog.md` | Read by five commands post-merge |
| | `decisions.jsonl` | The "why", which the index deliberately does not carry |
| | `design.md` | No post-merge reader today, but it is a live UI contract for as long as the UI exists — the rule's one deliberate exception, recorded as such |

Four files pruned instead of six. Less relief than the umbrella promised, and the four are the ones that actually multiply: `discovery.md` is explicitly a cache, and `review-NNN.md` accumulates one file per review round.

**The list must be re-derived whenever a command's reads change.** A hardcoded list silently becomes wrong the first time someone teaches `/add.diagnose` to read `tasks.md`. The `artefact-graph` already models command→file relationships closely enough that a future gate could check this mechanically; until then, the plan carries the re-derivation as an explicit task.

### 6. Two safety rules on pruning, both hard

- **Never delete an untracked file.** If git does not have it, deletion is unrecoverable, and "it's all in git anyway" — the reassurance this feature was sold on — is simply false for that file. A project that gitignores `docs/` gets a no-op and a notice, not data loss.
- **Never prune when no index entry was written this run.** Deleting the scaffolding before the record exists inverts the whole design. If the write failed, or the branch type wrote nothing (a `docs` branch), pruning does not run.

Pruning happens at **STEP 6, after the entry is written**, and `done.sh --merge` commits the deletions with everything else. Same path as the entry, one commit, no new mechanism.

**One consequence of that path, stated because pruning is destructive and the artefacts it borrows the path from are not.** A changelog or a wiki edit interrupted between STEP 6 and STEP 8 loses nothing. A *deletion* interrupted there leaves tracked files missing from the working tree with no commit to explain it. That is **recoverable — `git checkout -- <paths>` restores them**, guaranteed by safety rule 1, which refuses to delete anything untracked. Saying so here is the point: nobody should meet a half-finished run and read it as data loss.

**And one residual risk the rule does not cover.** "No command reads it after the merge" is a test about *commands*. A **human** doing archaeology on a shipped feature years later may well want `discovery.md` or a `review-NNN.md`, and no command speaks for them. This is accepted rather than solved: git retains every pruned file, safety rule 1 guarantees it, and the feature is opt-in and off by default. A project that values manual archaeology over a tidy tree simply leaves `docs-pruning` disabled, which is the shipped default.

### 7. What "the index carries what the docs carried" actually means

The umbrella asked this subtopic to prove it. With the corrected list, the proof is stronger than the claim:

> The pruned files are not replaced by the index — **they are read by nothing after the merge.** Their purpose expires when the branch does.

`discovery.md` caches a pre-build codebase analysis; `tasks.md` is a build checklist; `epic.md` is convergence state; `review-NNN.md` is a gate record whose gate has passed. Nothing consults them again. The index is not their successor — it is a new capability that happens to make their absence unremarkable.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Wire the index into six commands separately** | Six edits that drift. The framework already solved this with a shared discovery skill |
| **Read the index after the wiki** | The cheaper source that answers "was this built" belongs before the more expensive one that answers "how does this work" |
| **Filter out `gone` and `superseded` by default** | Hides the answer to *"did we already try this?"* — the original complaint, inverted |
| **Replace `@feature-history-agent` with an index lookup** | The index carries 3–5 items per feature, not the reasoning. The agent still reads docs; it just starts from a ranked list |
| **Keep the umbrella's level-2 list as approved** | Two of its files have post-merge readers. Shipping it would degrade `/add.hotfix` and `/add.diagnose` — the commands this design exists to serve |
| **Prune with a hardcoded file list** | Wrong the first time a command gains a read. The rule is the artefact; the list is its current output |
| **Prune after the merge, in a second commit** | Same needless extra commit the umbrella already rejected for the entry write |

## Type of Artefact

Architecture — one skill edit, one command wiring, one feature registry entry, one fragment, one agent dispatch change.

## Scope

### Includes

- The index as a source inside `add-knowledge-discovery`, ahead of the wiki
- `add.brainstorm` gaining that skill
- Result ordering, and the ban on hiding dead entries
- `@feature-history-agent`'s pre-filtered candidate list
- The `docs-pruning` feature: registry entry, fragment, position in `/add.done`
- The derivation rule for what may be pruned, and today's output of it
- The two hard safety rules

### Does NOT Include

- The record shape or `delivered.sh` — earlier subtopics
- Any change to the wiki, `add-wiki-maintenance`, or `/add.wiki`
- Any change to `@feature-history-agent`'s method beyond its starting point
- Level 3 pruning — rejected in the umbrella
- A mechanical gate enforcing the derivation rule — named as future work, not built here
- Internal-layer consumers — the internal umbrella's `query` subtopic

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **The index is read inside `add-knowledge-discovery`, not in each command** | Five commands already load it, and its description already reaches past the wiki. One edit instead of six that drift | ✅ |
| **`add.brainstorm` gains the skill** | It has a discovery step that consults nothing, and it is the command most likely to re-invent something already built | ✅ |
| **Index before wiki** | Different questions, and the cheap one — one grep over one file — answers the question this design was commissioned for | ✅ |
| **Dead entries rank last, never hidden** | A `gone` entry is often the most valuable answer: it says this was tried and dropped. Hiding it repeats the original failure inverted | ✅ |
| **`@feature-history-agent` keeps its method, gains a ranked starting point** | The index has 3–5 items per feature, not the reasoning. It is a better index, not a replacement for reading | ✅ |
| **The umbrella's level-2 list is corrected: `plan.md` and `iterations.*` are KEPT** | Measured, not assumed. `plan.md` is a named input to `@feature-history-agent`'s dispatch and the basis of `/add.diagnose`'s drift check; `iterations.*` is read by `/add.new`'s Past Features Discovery, whose stated purpose — *"avoid re-work"* — is this index's own job. **This reverses part of a previously validated decision**, and is carried to the owner in the handoff summary rather than left as an open question here | ✅ decided, flagged upstream |
| **The INDEX step loads standalone, exempt from the wiki-blind rule in `/add.hotfix` STEPs 4–6** | The index is not narrative: it records what shipped, in anchored items, not what the code means. Without this it is out of reach at STEP 4, where `@feature-history-agent` is dispatched. **The rationale is inferred** — no source states why hotfix is wiki-blind — and the doc says so, so a future reader can overturn it if the rule's author ever writes the reason down | ✅ |
| **At hotfix STEP 4 the index is read with `--no-verify`; the verifying read waits for STEP 8.1** | `/add.hotfix` also forbids grepping code before the history agents are dispatched, and a verifying read greps source. Stored statuses need no code access, so the prohibition stands untouched instead of collecting a second exemption. It is also why hotfix reads the index twice: unverified for triage, verified at fix time | ✅ |
| **`add.brainstorm` deep-reads `about.md` for matched entries** | An index entry carries anchored items and, by the schema, never an explanation. Replacing a full-directory `about.md` sweep with items alone would narrow an ideation command's context. Mirrors `@feature-history-agent`'s ranked-then-deep-read shape | ✅ |
| **In `add.brainstorm`, the index replaces the raw `docs/features/` scan rather than joining it** | STEP 1 already sweeps the whole directory unranked — the landfill read this design exists to eliminate. Adding a ranked lookup beside it would leave the command doing both | ✅ |
| **An interrupted prune is recoverable and the document says so** | Pruning borrows a commit path from additive artefacts that lose nothing when interrupted. `git checkout -- <paths>` restores, guaranteed by safety rule 1 | ✅ |
| **The human-archaeology case is accepted, not solved** | "No command reads it" speaks for commands, not people. Git retains everything, and the feature is off by default — a project that values archaeology leaves it off | ✅ |
| **Pruning is derived from "no post-merge reader", not from a list** | A list silently becomes wrong the first time a command gains a read. The rule survives; its output is regenerated | ✅ |
| **`design.md` is kept as a deliberate exception to that rule** | It has no post-merge reader today, but it is a live UI contract for as long as the UI exists. Recorded as an exception so it is not "fixed" later | ✅ |
| **Never delete an untracked file** | "It's all in git anyway" is the reassurance this feature was sold on, and it is false for an untracked file. A project that gitignores `docs/` gets a notice, not data loss | ✅ |
| **Never prune when no entry was written this run** | Deleting the scaffolding before the record exists inverts the design. Covers a failed write and branch types that write nothing | ✅ |
| **Prune at STEP 6; `done.sh --merge` commits it** | Same path as the entry write. One commit, no new mechanism, `done.sh --merge` stays sole git owner | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add-knowledge-discovery` | Gains an INDEX step ahead of PRESENCE, **loadable standalone**; its *When NOT to Use* bullet is amended so the wiki stays out of `/add.hotfix` STEPs 4–6 but the index does not | Edit the procedure and that bullet together — a partial edit leaves the skill contradicting itself |
| `add.plan`, `add.new`, `add.diagnose`, `add.review` | Gain the index through the skill | **None** — they already load it |
| `add.hotfix` | Reads the index **twice**: `--no-verify` at STEP 4 for triage, verified at STEP 8.1 inside the normal skill load | Add the standalone `--no-verify` load at STEP 4; the STEP 8.1 load is the skill's own |
| `add.brainstorm` | Gains the skill at STEP 1; its raw `docs/features/` sweep is **replaced** by ranked lookup plus `about.md` deep-read on matches | Add the load; remove the unranked sweep; add the deep-read |
| `@feature-history-agent` | Dispatch payload carries ranked candidate ids | Edit the dispatch in `/add.hotfix` |
| `cli/src/features.js` | New `docs-pruning` entry, `default: false` | Register |
| `framwork/.codeadd/fragments/docs-pruning/add.done.md` | New fragment with `<!-- section: -->` markers | Create |
| `add.done.md` source | New `<!-- feature:docs-pruning:… -->` marker at STEP 6 | Add; the build strips it into the sidecar |
| `injection-points.json` | One more anchor | Regenerated by the build |
| `done.sh --merge` | Commits deletions alongside generated docs | None |
| `/add.wiki`, `add-wiki-maintenance` | `about.md` survives, so its evidence is intact | **None** |
| `artefact-graph` | Could later gate the derivation rule | Named as future work |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Six commands can ask "was this built?" through one edit | One more source in a shared skill that every consumer inherits |
| Discarded work surfaces instead of being silently absent | Longer discovery results, since dead entries stay in them |
| Feature folders lose the files that multiply | Four files pruned, not six — less relief than promised |
| Pruning that cannot destroy anything unrecoverable | Projects that gitignore `docs/` get no pruning at all |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The pruned list is not re-derived when a command gains a read, and pruning starts deleting something needed | **High over time** | The single most likely way this decays. The rule is stated as the artefact and the list as its output; the plan carries re-derivation as a task; the `artefact-graph` is the eventual mechanical gate |
| Putting the index ahead of the wiki makes an agent stop at a shallow answer | Med | The index answers *whether*, never *how*. The skill's step must say so in the words that reach the agent, not only here |
| `docs-pruning` is enabled early, before the index has entries, and prunes folders with no record | Med | The second safety rule already blocks it — no entry written this run, no pruning. Worth an explicit RED test |
| Six commands inheriting a new source slows every discovery step | Low | One grep over one file, plus bounded verification of what is returned |
| `add.brainstorm` gaining a skill changes its behaviour in ways nobody asked for | Low | It gains one cheap lookup at a step that today consults nothing. If the wiki portion proves noisy there, the skill's own PRESENCE step already no-ops when the wiki is absent |

## RED Test Matrix

| # | Setup | Expected |
|---|---|---|
| 1 | Index absent | Discovery proceeds with a note; nothing errors |
| 2 | Query matching a `gone` entry and a `live` entry | Both returned, `live` first, `gone` labelled |
| 3 | Query matching only `superseded` entries | Returned with the replacement id, never an empty result |
| 4 | `docs-pruning` disabled | No file deleted |
| 5 | `docs-pruning` enabled, entry written | `discovery.md`, `tasks.md`, `epic.md`, `review-*.md` deleted; **`plan.md`, `about.md`, `design.md`, `changelog.md`, `decisions.jsonl`, `iterations.*` intact** |
| 6 | `docs-pruning` enabled, index write failed | Nothing deleted |
| 7 | `docs-pruning` enabled, `docs/` untracked | Nothing deleted; notice printed |
| 8 | `docs` branch through `/add.done` | No entry, therefore no pruning |
| 9 | After pruning, run `/add.hotfix` on that feature | `@feature-history-agent` still finds `about.md`, `changelog.md` and `plan.md` |
| 10 | After pruning, run `/add.diagnose` on that feature | The doc-code drift check still has `plan.md` |
| 11 | After pruning, run `/add.new` with a request resembling that feature | Past Features Discovery still reads `iterations.jsonl` and classifies the relationship |
| 12 | `/add.hotfix` at STEP 4 | `@feature-history-agent`'s payload carries index results; **no wiki page loaded, and no source file read** — the call used `--no-verify` |
| 13 | `/add.brainstorm` STEP 1 | Ranked index lookup runs, `about.md` deep-read on matched entries only; the unranked `docs/features/` sweep does not run |
| 14 | Interrupt `/add.done` between STEP 6 and STEP 8 with pruning enabled | `git checkout -- <paths>` restores every pruned file |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
