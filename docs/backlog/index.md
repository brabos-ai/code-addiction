# Backlog

Items are listed in execution order — the number **is** the priority. An item may only start once
every item above it is done. Scope lives with each item, not with this document — an item names
the layer(s) it touches.

⛔ **A delivered item is removed, never renumbered, and the gap it leaves stays.** `git log --follow` on this
file carries what it was, and every changelog, commit message and index entry that shipped alongside
it names it by its number — renumbering makes those references point at a different item. Missing
numbers here mean delivered, not lost.

---

## 1. Delivered-work relationships

### 1.2 — Migration command: initial relationship graph for old installs

**Scope:** product
**TLDR:** An opt-in command that builds an initial relationship structure over features delivered before the typed-relation format existed, grouped by app/group/category as a tree or graph, so the agent can find correlated features and know what to search.

- **The relationship format this item migrates INTO is delivered, so nothing blocks this any more.** (It was item 1.1, removed from this backlog on delivery — `git log --follow docs/backlog/index.md` has it.) `2026-09-12T104012-PLAN--docs-knowledge-graph-mcp` shipped the typed `## Relations` section, the closed vocabulary (`caused_by`, `depends_on`, `part_of`, `links_to`) and the docs-corpus MCP that reads them. `templates/related.md` is gone and the `hotfix-related` schema is retired.
- **Half of the migration also shipped.** `cli/src/migrations.js` migration 0002 (`harvestRelations`) walks a brownfield project's `docs/`, harvests the relationships it already wrote — body references, `related:` ids, Follow-up sentences — and writes them as `links_to` lines. Additive-only: it never deletes, never commits, and reports every id that resolves to no work item.
- **What is left is the project that declared nothing.** 0002 finds nothing in a project whose documents never named each other, and that is the common case for deliveries predating the format. Such a project needs a structure derived from what its deliveries have in common — path overlap, directory, domain — rather than from a declaration nobody made.
- Scan past deliveries (`docs/features`, changelogs) and group them — by app, group or category, tree or graph: the shape is still open, and choosing it is the first half of this item.
- Ships as an enabled feature, not part of the default flow.
- When the gitnexus plugin is enabled, the grouping also points at what to search in gitnexus per group.
- **Deliberately deferred past 1.4.** The `add-knowledge-discovery` step this command consults on its first run was repaired on 2026-09-14, and the impact question — where a work item's file set lives, which is half of what this migration would have to write — shipped on 2026-09-14 (`git log --follow docs/backlog/index.md` carries the item it was). What is still missing is 1.4: this migration cannot know what it is walking until something reports which of a project's documents the MCP can already read. The usual "finish everything above before starting" rule is suspended for that reason, and recorded here rather than left as an unexplained skip.
- **Done when:** running the command on a project whose deliveries declare no relationship produces the initial grouped structure with relationships filled, and add.new/add.plan/add.hotfix use it as the investigation entry point.

### 1.4 — A doctor for document schemas, and an opt-in pass that makes a project's documents fit

**Scope:** product
**TLDR:** Every docs-corpus answer is only as good as the frontmatter and the sections of the documents underneath it. Nothing tells a user which of their files the MCP can read and which it skips, and nothing offers to fix the ones it cannot. Two pieces: a **doctor** that reports fitness per file, and an **opt-in skill** that reads a project's features and rewrites their headers to the current schema.

- **Do this BEFORE 1.2.** 1.2 migrates relationships into a project that declared none; it cannot know what it is walking until something reports which documents are already readable. The doctor is that report, and 1.2 records the same suspension from its own side.

- **What made this urgent.** The impact-question delivery of 2026-09-14 deleted the last reader that tolerated an old document shape. From now on a document is either in the current format or it is **invisible to the MCP, silently** — it parses, it lands in the corpus, and it answers nothing. Silence is the defect: an empty answer and an unreadable file look identical from the caller's side, which is the exact confusion `add-knowledge-discovery` already had to be taught to separate.

- **The doctor reports, and writes nothing.** For every document in the docs corpus: fit, off-standard, or unreadable, naming the field or section that is missing rather than a score. `add-doc-schemas` owns the schemas, so the doctor reads them from there — a doctor that restates a schema drifts from it, and the drift is invisible until the two disagree about what "fit" means.

- **The fix pass is a skill, not a codemod.** It reads each feature's document and adjusts the header — frontmatter `type` and `id`, the `## Relations` block — to the current schema. It has to be an agent reading the content, because deciding a document's type and its relations is a judgement, not a text substitution. Opt-in, and it edits headers only: never a body, never a deletion.

- ⛔ **The user writes nothing by hand.** Every one of those documents was written by a command, so a migration that hands the user a list of files to edit is addressing the wrong actor. The skill's output is the edit; the user's part is approving it. This is the rule the impact-question build established, and it is what killed the legacy converter there.

- **Carried over from the impact-question delivery: the behaviour with no index at all.** `touched_by` answers empty in a project that has never run a close-out. `git log --follow <path>` answers it with no index and no plugin, always. Whatever ships must degrade to that rather than to nothing — and the doctor is where a user finds out which of the two they are getting.

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
