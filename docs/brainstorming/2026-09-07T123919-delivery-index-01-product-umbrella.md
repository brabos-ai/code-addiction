# Brainstorm: Delivery Index — Product Layer (Umbrella)

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--plan`
> **Date:** 2026-09-07
> **Type:** architecture
> **Set:** `2026-09-07T123919` — **01 of 08**, the product root. Paired with `2026-09-07T123919-delivery-index-05-internal-umbrella.md` (05)

## Reading Order — the whole set

Eight documents, numbered `01`–`08`, in dependency order. **Lexicographic order is the reading order**, and the number sits before the layer for one reason: the schema is owned by the *product* side and the *internal* side consumes it, so numbering within each layer would sort `internal` first and invite reading the consumer before its contract.

| # | Document | Depends on | Gives the set |
|---|---|---|---|
| **01** | `…-01-product-umbrella` | — | Why the index exists; the four states; the two delivery paths |
| **02** | `…-02-product-schema` | 01 | **The record. Owned here for BOTH layers** — everything below reads it |
| **03** | `…-03-product-write-verify` | 02 | `delivered.sh`; when `/add.done` writes; how verification runs |
| **04** | `…-04-product-consumption` | 02, 03 | Who reads it; the `docs-pruning` feature |
| **05** | `…-05-internal-umbrella` | 01, 02 | Why the internal layer needs the same thing, and how it differs |
| **06** | `…-06-internal-done-command` | 02, 05 | `/add-framework--done`: gates, `gh` merge, cleanup |
| **07** | `…-07-internal-entry-join` | 02, 05 | Internal deltas; the `artefact-graph` join |
| **08** | `…-08-internal-query` | 03, 05, 07 | `graph.js history`; internal consumers; retiring force-add |

**02 is the hinge.** It is the only document both layers depend on, and the only one that must be read before anything else can be judged. **05 sits after 04 for narrative reasons, not dependency ones** — it needs only 01 and 02, so a reader who cares solely about the internal layer can go `01 → 02 → 05 → 06 → 07`, picking up 03 only when reaching 08.

## Discovery

- **`framwork/.codeadd/scripts/build-ledger.sh`** — append-only per-feature log. Its stated doctrine ("IT IS A LOG, NOT A SET: the same line twice appends twice") is the durability model this index adopts verbatim.
- **`framwork/.codeadd/scripts/log-jsonl.sh`** — already writes `decisions.jsonl` (`pivot` / `from` / `decision` / `reason`) and `iterations.jsonl` per feature. The raw material for a history already exists per feature; nothing consolidates it.
- **`@feature-history-agent` and `@git-history-agent`** — dispatched by `/add.diagnose`. Both already answer historical questions, but by scanning docs and commits from scratch on every invocation. There is no index for them to read.
- **`/add.done` + `done.sh --merge`** — `done.sh --merge` is declared the *sole git owner* of the finalization flow. This is the only point in the product layer where "this shipped" is proven rather than asserted.
- **`gitnexus` plugin** — already injects into `add.done`, `add.plan`, `add.diagnose`, `add.new`, `add.hotfix`, `add.wiki`, and its own `postEnableHint` documents the degradation contract: *"if it does not [appear indexed], the commands silently fall back to grep."* Deep code navigation is that plugin's job and stays there.
- **`contracts.json` + `SETUP_QA_STALE`** — existing precedent for "store a hash, recompute later, report stale". The index's anchor check is the same motor aimed at source files.
- **Plan 0074 (epic convergence)** — the governing rule: *"No gate is satisfied by the agent that executes it saying so. Either a script proves it, or the filesystem proves it."*
- **Plan 0077 (artefact-graph sidecar)** — two constraints inherited: sidecars are **JSON, not SQLite** (the CLI ships in a ZIP and users must be able to diff and inspect it), and **query is separate from write** (`graph.js` never writes).

## Context & Motivation

Generated documentation cites features that were discarded. Worse, it cites features that never reached `main` at all, because their branch died halfway. The consequences the owner named directly: **incorrect mapping, wasted tokens, lost time.**

The mechanism is structural, not accidental. `docs/features/` accumulates one folder per feature ever started, and every folder carries the same weight. An agent in the discovery phase reading that directory has no signal separating *shipped* from *abandoned* from *never merged*. It reads them all and cites them all.

**Live evidence, from the framework's own repository at the time of writing.** `doc-reviewer-agent` and the `add-doc-reviewer` skill were both deleted — absent from `framwork/.codeadd/`, scoring zero in `provider-map.json`. **Seventy-four occurrences across thirteen files nevertheless survive** (measured repo-wide, excluding `node_modules` and `.git`): plans `0074`, `0076` and `0077`; an evidence file; a changelog; a CLI test; three stale build copies under `framwork/.claude/`, `framwork/.cursor/` and `framwork/.opencode/`; and — the part that names this design's whole purpose — **`ecosystem.md`, `web/src/pages/docs.astro`, and the built `web/dist/docs/index.html`**.

The deleted skill is listed in the ecosystem map and published on the documentation website. On top of that, the session that produced this document was handed `add-doc-reviewer` in its own available-skills listing.

That is *generated documentation citing a discarded feature* — word for word the complaint this design answers, occurring inside the framework that will ship the fix.

## Problem / Opportunity

A feature can leave the working set in four different ways, and today none of them is recorded:

| | State | Provable without human declaration? |
|---|---|---|
| **A** | Branch died, never merged to `main` | Yes — git proves it |
| **B** | Plan written, never executed | Yes — the absence of a ledger or commit proves it |
| **C** | Delivered, later removed from the code | Yes, if the removal is detectable at the source |
| **D** | Delivered, later superseded by a different approach | No — someone must declare it |

The opportunity is that **A and B disappear entirely if the index is only ever written after a merge**, and **C collapses into a cheap source check**. Only D needs a human, and D is rare.

Writing only after a merge buys that at a price, and the price must be named rather than discovered later: **a fifth state appears — shipped but unindexed.** A feature merged through `/add.pull-request` on GitHub whose branch is then deleted by hand, skipping `/add.done`, ships without ever reaching the index. The index will not lie about it; it will be silent about it, which for a discovery tool is the difference between "we never built this" and "we have no record either way". Absence in the index therefore means *no `/add.done` ran*, not *never shipped* — and that distinction has to survive into the consuming commands rather than being quietly forgotten.

The second, equally real pain is organizational: the owner wants to be able to delete the raw development documentation and keep a compact index instead. Two hundred feature folders is not a knowledge base, it is a landfill.

## Proposed Solution

A **per-project delivery index**: one JSONL line per delivered feature, written only once the merge is proven, therefore reaching `main` only if the work actually shipped.

### The two delivery paths, and what "proven" means in each

The product layer has two, and the design must hold in both. Getting this wrong was the first draft's real defect:

| Path | What happens | When the entry is written |
|---|---|---|
| **`/add.done` alone** | `done.sh --merge` does a **local `git merge --squash` and pushes straight to `main`**. There is no PR object anywhere in this flow | On the branch, as the last commit. It lands *inside* the squash. If the squash never runs, the branch dies and the entry dies with it — no extra commit on `main` |
| **`/add.pull-request` then `/add.done`** | A real GitHub PR via `gh`; the merge happens on GitHub, and that command's own guidance is to run `/add.done` afterwards for cleanup | After the merge, as a commit on `main`. Here the merge is *already* proven when `/add.done` runs — the principle is satisfied more strongly, at the cost of one extra commit |

The validated principle — **written after merge is proven, never before** — holds in both. Only the no-extra-commit convenience is specific to the first path.

Each line carries three things:

1. **The words someone would search for.** `0042` finds nothing. `login Google OAuth token social` finds it. The index exists to answer *"have we built anything like this before?"* during discovery, so it must be matchable by meaning, not only by id.
2. **Where to go look** — commit hashes and file paths. Modest role: a pointer, never an explanation of what the code does.
3. **Three to five public-surface items**, each anchored to one file — an endpoint, a table, a screen, a command, a flag. These are the things documentation actually cites, and each one is individually checkable.

A separate verification pass re-checks the anchors and appends a status line when one has changed or vanished. Written once, verified always. Four statuses exist and no more — `live` (still there), `changed` (the anchor file moved on; look before citing), `gone` (absent from the source), `superseded` (declared, carrying a pointer to the replacement).

One illustrative line, shape only:

```
{"id":"0042","name":"login com Google","words":"login Google OAuth token social auth","status":"live","commits":["a1b2c3"],"items":[{"what":"POST /auth/google","at":"src/auth/google.ts"},{"what":"tabela oauth_tokens","at":"db/migrations/0042.sql"}]}
```

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Derive everything from git, author nothing** | The public surface does not fall out of a diff. Git knows 23 files changed; it does not know which three of them are the thing other documents will cite. Twenty of the twenty-three would be noise, and a noisy index is an ignored index. |
| **Extend `artefact-graph.json` to cover features** | The graph is a structural map with no time axis, emitted by a build step the product layer does not have in the user's project. Merging the two would make each worse: the graph would grow a lifecycle it does not need, and the index would inherit a build dependency it cannot satisfy. |
| **Keep the raw docs, add a search command over them** | Addresses neither staleness nor the organizational pain. Searching a landfill faster still returns garbage, and the folders still accumulate. |

### Why this is not a code knowledge graph

Explicitly ruled out by the owner and recorded here so a later reader does not "improve" the design into one. The index answers *what exists and what was discarded*. It does not answer *what calls what*. Deep code navigation belongs to the `gitnexus` plugin, and when that plugin is disabled the investigation degrades to ordinary reading — which is **out of scope for this work**, not a gap in it.

## Type of Artefact

Architecture — spanning a schema, two scripts, a feature-registry entry, and changes to several existing commands.

## Scope

### Includes

- The delivery index file format and its entry identity
- Writing the index from `/add.done` — on the branch, ahead of `done.sh --merge`'s local squash when there is no PR; as a commit on `main` when a real GitHub merge already happened via `/add.pull-request` (see the two-path table below)
- The source-anchor verification pass and the four-value status vocabulary
- A `docs-pruning` feature (default **disabled**) that deletes **level-2** docs after indexing. Level 2 is defined here once, because the term is this design's own and appears nowhere else in the framework:

  | Level | What it deletes |
  |---|---|
  | 1 | Nothing — index only |
  | **2** | The scaffolding whose purpose expires at merge: `discovery.md`, `tasks.md`, `epic.md`, `review-*.md`. **Keeps** `about.md`, `design.md`, `decisions.jsonl`, `changelog.md`, **`plan.md` and `iterations.*`**. ⚠️ An earlier draft listed `plan.md` and `iterations.*` for deletion; the `consumption` subtopic measured their readers and found `/add.diagnose`, `/add.hotfix` and `/add.new` still need them after the merge. See that document for the evidence |
  | 3 | The whole feature folder — **rejected**, see Key Decisions |

- Wiring the index into the discovery phase of the commands that ask "what already exists": `add.plan`, `add.new`, `add.brainstorm`, `add.diagnose`
- Coexistence with the `gitnexus` plugin — the index hands off, it does not compete

### Does NOT Include

- Any map of code structure, call graphs, dependencies or blast radius — that is `gitnexus`
- Any behaviour when `gitnexus` is disabled beyond the existing grep fallback
- Deleting `about.md`, `design.md`, `decisions.jsonl` or `changelog.md` (level 3 was considered and rejected: `about.md` is evidence for the wiki's **incremental update** path, and deleting it degrades that update — see Key Decisions)
- A cross-project or hosted index — one index per repository, no server
- Replacing `@feature-history-agent` or `@git-history-agent`; they gain a fast first stop, they do not disappear
- Backfilling the index for features delivered before it exists

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Entry = one feature, containing 3–5 anchored items | A feature alone cannot be checked against the source (too coarse; the check would fire weekly and be learned into noise). An item alone loses the "what was this for" that discovery needs | ✅ |
| Items are public surface only — what other documents cite | It is exactly the class of thing that goes stale and gets miscited. Everything the diff touched would be ~23 lines with ~20 of noise | ✅ |
| Purpose is **discovery**, not code mapping | Keeps the artefact small and prevents it growing into a second, worse `gitnexus` | ✅ |
| The index is tracked in git | An untracked index is empty in a fresh clone and the agent finds nothing — reproducing today's failure with extra steps | ✅ |
| Written **after** merge is proven, never before | States A and B stop being statuses to model and become impossible by construction. This is plan 0074's rule applied to a new artefact | ✅ |
| On the `/add.done`-only path, written **on the branch** as the last commit, landing inside `done.sh --merge`'s squash | Same guarantee with no extra commit on `main`: if the squash never runs, the entry dies with the branch. Note this path has no PR at all — `done.sh --merge` merges locally and pushes to `main` | ✅ |
| On the `/add.pull-request` path, written as a commit on `main` when `/add.done` runs afterwards | The merge is already proven at that point. One extra commit is the honest cost of a path where the branch no longer exists to carry the entry | ✅ |
| Index write applies to any branch type `/add.done` finalizes; a **hotfix or refactor appends a status line to the existing feature's entry** rather than creating its own | `/add.done` routes `feature`, `hotfix`, `refactor`, `chore` and `docs` through one flow. A hotfix changes an existing public surface — a new entry would split one capability's history across two lines and defeat the search. Append-only, last-line-wins already gives the right shape. The exact per-type rules **and how a hotfix resolves which `id` to append to** belong to the write-verify subtopic | ✅ |
| Format is JSONL, append-only, last line wins | Matches `decisions.jsonl` / `iterations.jsonl` / `log-jsonl.sh` already in the tree, and `build-ledger.sh`'s "log, not set" doctrine. A grep for one word returns the whole entry | ✅ |
| Four statuses only: `live`, `changed`, `gone`, `superseded` | "Branch died" and "plan never executed" need no status because they never enter the index | ✅ |
| Doc cleanup is level 2, opt-in, default off, toggled with `codeadd features … enable` | Deleting a user's documentation is their call, not the framework's. Rides `tdd-pipeline` / `qa-pipeline` machinery — zero new mechanism | ✅ |
| Level 3 (delete the whole folder) rejected | `about.md` is evidence for the wiki's **incremental update** path (`add-wiki-maintenance`, invoked from `/add.done` STEP 6.7), alongside the changed-file list and the changelog. Full wiki generation dispatches analyzers against live code and does not read it, so level 3 would **degrade** that update rather than break generation — still a real loss, and re-sourcing it is separate work | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `/add.done` | Gains the index write. Applies to every branch type it finalizes, not features only | Add a step; do not disturb `done.sh --merge`'s sole-git-owner rule |
| `done.sh` | Must carry the index entry into the branch's final commit before its local squash-and-push | Extend, carefully — this script is the single git owner of the flow, and it merges **locally**; there is no PR here |
| `/add.pull-request` | The other delivery path, and the one that breaks the cheap guarantee. It creates a real `gh` PR and instructs the user to run `/add.done` *after* the GitHub merge | Decide in the write-verify subtopic whether it warns that an entry is still owed, or whether `/add.done` is simply the only supported close-out |
| New write script | Appends one entry; `KEY=VALUE` output, exit 2 on CLI misuse, exit 1 on a refused write | Create, following `build-ledger.sh`'s contract |
| New verify script | Re-checks anchors, appends status lines | Create; read-only against source, append-only against the index |
| `/add.plan`, `/add.new`, `/add.brainstorm`, `/add.diagnose` | Gain the index as the first stop of the discovery phase | Add a read step ahead of existing discovery |
| `@feature-history-agent` | Reads the index before scanning folders | Update dispatch input |
| `cli/src/features.js` | New `docs-pruning` entry, default disabled | Register |
| `framwork/.codeadd/fragments/docs-pruning/add.done.md` | Cleanup fragment | Create |
| `gitnexus` plugin | Unchanged. The index is the cheap first answer; gitnexus is the deep one | None |
| `/add.wiki` | Unchanged under level 2 — `about.md` survives | None |
| `add-doc-schemas` | The index needs a schema entry like every other ADD doc | Add reference |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A cheap, always-available first answer to "have we built this before?" | The agent authors a 3–5 item list at the end of every feature, and the user **sees** it in STEP 7's preview rather than signing off on it — `/add.done` forbids confirmation gates. Recorded by the `write-verify` subtopic |
| Discarded and superseded work stops being cited as live | A new file to keep honest, and a new failure mode if it drifts |
| Feature folders lose the four files that multiply — `discovery.md`, `tasks.md`, `epic.md`, `review-*.md` | Deleted scaffolding is recoverable only through git. **Four pruned, six kept:** the `consumption` subtopic measured post-merge readers and found that `plan.md` and `iterations.*` have them, so the level-2 list below is narrower than this umbrella first assumed |
| States A and B become structurally impossible, not merely tracked | The index cannot describe work in progress — by design |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A feature ships through `/add.pull-request` + a GitHub merge, the branch is deleted by hand, `/add.done` never runs — shipped, unindexed, invisible | **High** | Cannot be prevented by construction: nothing forces `/add.done`. Two honest responses, and the write-verify subtopic owns the choice — have `/add.pull-request` state that an entry is still owed, or declare `/add.done` the only supported close-out and say so where users read it. What is **not** acceptable is letting consumers read absence as "never built" |
| The index drifts and quietly becomes wrong — the exact disease it treats | Med | The verification pass is the whole answer; it must be *run* by something, not merely available. Fold it into the same discovery read that consumes the index |
| Anchor checks fire so often they are learned into noise | Med | Anchors point at public surface, not at whole features. If a status is noisy in practice the item was too coarse — that is a schema bug, not an acceptable cost |
| The item list is authored badly under fatigue at the end of a feature | High | Keep it to 3–5 and let `/add.done` propose from `tasks.md` and the diff. A wrong item is worse than a missing one; prefer fewer |
| The design grows into a code graph over time | Med | The "Does NOT Include" section above is the guard, and the reason is recorded, not merely the rule |
| `docs-pruning` deletes something a user still needed | Low | Default off, opt-in, level 2 only, and git retains everything |

## Decomposition Map

| Subtopic | Design Path | Purpose |
|----------|-------------|---------|
| Schema and entry identity | `2026-09-07T123919-delivery-index-02-product-schema.md` | What an entry is; stable identity when files are renamed; the fields; where the file lives; the four statuses. **Owns the schema for both layers.** |
| Write and verification | `2026-09-07T123919-delivery-index-03-product-write-verify.md` | Who writes and exactly when inside `/add.done`; how the anchor is computed and re-checked; what separates `changed` from `gone` from `superseded` |
| Consumption and disposable docs | `2026-09-07T123919-delivery-index-04-product-consumption.md` | Which commands read it and where in their discovery phase; the `docs-pruning` feature; proving the index carries what the deleted docs carried |

## Dependencies & Relationships

Refine in order. The schema topic must close first — the other two are guesswork without it. The consumption topic can still send work back to the schema: if the index is to replace deleted documentation, it may need to carry something that exists today only as prose, and that is a schema field. This is the reason the umbrella exists rather than three independent designs.

**The schema topic is the single owner of the format for both layers.** The internal umbrella consumes it verbatim and records only its deltas. Two independently-authored schemas become two incompatible indexes within a release, and neither layer can read the other's history.

## Next Steps

**The set is complete and APPROVED by the owner on 2026-09-07.** All eight documents are written and reviewed; nothing remains to refine.

The approval explicitly covers five decisions the owner was asked to confirm, two of which reverse or narrow an earlier one:

1. `plan.md` and `iterations.*` are **kept**, not pruned — reversing part of the umbrella's original level-2 list (04)
2. `changed` means **moved**, not modified (02)
3. The internal cleanup is **retiring force-add**, not deleting files (06)
4. The index is **exempt from `/add.hotfix`'s wiki-blind rule**, read with `--no-verify` at STEP 4 (04)
5. **Nobody confirms** the item list; STEP 7 previews it (03)

Both layers are now plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
