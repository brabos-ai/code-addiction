# Plan: Brainstorm Greenfield — `/add-brainstorm` decides and records stack foundations on an empty repo

> **Status:** implemented
> **Layers:** both
> **Type:** command
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0064B

---

## Objective

[from conversation, no design document] On a repo with no code and no `AGENTS.md`, `/add-brainstorm`
helps the user decide language/runtime, tenancy, layering, validation and ORM — one recommended stack
pack, each item backed by a named precedent and gated by the architecture skills' over-engineering
lists — and, after approval, records those decisions where every later command already reads them:
`.codeadd/wiki/conventions.md` → `## Stack Conventions` (rows `source: decided`), a minimal wiki hub and
`.meta.json`, and a minimal `AGENTS.md` with the three managed blocks. A fresh repo with no commit no
longer stops the brainstorm at `status.cjs`.

**When this build is done:** `/add-brainstorm` carries one greenfield branch — a trigger evaluated once
in load-context, a tolerated `status.cjs` failure on greenfield only, the `Path: architectural
(greenfield)` line, a `greenfield-foundations` sub-step inside explore, and four foundation files
written after the approval and before the intent file. Every non-greenfield run reads the same text it
reads today. The ecosystem map and the web docs say so. A new guard test pins the text, the 0062B
contract this card writes into, and the three `status.cjs` behaviours the branch relies on.

**Ticket done when:** on a repo with no code and no AGENTS.md, /add-brainstorm takes the architectural path, asks one five-item foundations question (stack, tenancy, layering, validation, ORM) with recommendations backed by the architecture skills, and after approval writes .codeadd/wiki/conventions.md Stack Conventions (source: decided), a minimal wiki index.md + .meta.json and a minimal AGENTS.md with the managed blocks; Keep discussing writes nothing; non-greenfield repos are unchanged; an uncommitted fresh repo does not stop at status.cjs; /add-wiki update and full /add-wiki confirm or flag decided rows against code; build and test:all pass.

## Context

Card 5 of 6 in the `2026-10-24T18300*` set. It writes into the `## Stack Conventions` table that
0062B (`wiki-stack-conventions`) creates, consults the architecture skills that 0063B
(`agnostic-dev-skills`) makes stack-neutral, and relies on 0060B (`remove-generic-skills`) having
removed `add--project-scaffolding`. **This plan assumes 0060B, 0061B, 0062B and 0063B are merged.**
Edits are anchored by quoted text from main `dfe98bb0`; where another card rewrites a nearby line, the
overlap is named under **Cross-Card Overlaps**.

**Every decision here was taken and approved in the document below. This plan does not re-derive them —
it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183005-brainstorm-greenfield-intent.md` | `path: bounded`; decisions 1–20 (problem, shape, trigger, `status.cjs` tolerance, path, the five-item question, consulting skills, the three outputs, write timing, existing wiki, later check against code, schemas, agent mode, listings, scope out, acceptance, risks); `## Open` = None |

Decisions this plan adds on top (no intent decision covered them; each is in Validated Decisions with its
reason): D-A decision 13 is already delivered by 0062B, so this card only guards it; D-B a legacy
context file turned into `AGENTS.md` by the migration is merged, not overwritten; D-C "never runs git
commands" means no git command that writes; D-D the minimal hub's exact sections; D-E the order of the
four writes and what a failure does; D-F the guard test pins `status.cjs` behaviour instead of changing
it; D-G the Used By cells of the three consulted skills; D-H `docs.astro` is `[internal]`.

## Global Constraints

- Greenfield trigger, exactly: `GREENFIELD=yes` only when there is no `AGENTS.md` at the project root AND, after `git ls-files --cached --others --exclude-standard` (or a plain directory listing outside git) drops dot-prefixed paths, `docs/`, root `*.md` and `LICENSE*`, nothing remains (intent, decision 3)
- With `GREENFIELD` not `yes`, every line a run reads is the text it reads today — no reworded non-greenfield instruction (intent, decision 3: "the flow does not change at all")
- `status.cjs` is not changed; on greenfield only, exit 1 (`ERROR:not a git repository`) and exit 2 (`ERROR:no main branch found`) are tolerated (intent, decisions 4, 17)
- Classify line, verbatim: `Path: architectural (greenfield): stack foundations first, then full exploration.` (intent, decision 5)
- New sub-step id, verbatim: `### STEP add-brainstorm.greenfield-foundations`, inside STEP `add-brainstorm.explore`, after `add-brainstorm.draft-objective-first` and before `add-brainstorm.sections-close` (intent, decision 2)
- STEP index explore line gains, verbatim: `(+ greenfield foundations when GREENFIELD=yes)` (intent, decision 2)
- The `## Stack Conventions` table is written in 0062B's format: header `| Convention | Value | Where / enforcement | Evidence | Source |`, rows `Tenancy`, `DI`, `Barrels`, `Layering`, `Validation`, `ORM / data access`, `Entity language` in that order, every row `Source` = `decided`, Evidence = `BRN-<slug>` (intent, decision 8; `2026-10-24T183514-PLAN--wiki-stack-conventions.md`, Global Constraints and D-E)
- The four foundation files are exactly `.codeadd/wiki/conventions.md`, `.codeadd/wiki/index.md`, `.codeadd/wiki/.meta.json`, `AGENTS.md`; `INSTRUCTIONS.md` is never written (intent, decisions 9, 10, 11)
- `.meta.json`, exactly: `{"updatedAt":"<ISO>","command":"brainstorm-greenfield"}`, plus `gitHead` only when HEAD exists (intent, decision 9)
- Managed blocks copied verbatim from `add-wiki.md`: `codeadd-shell` (STEP `add-wiki.resolve-shell-policy`), `codeadd-wiki` and `codeadd-style` (STEP `add-wiki.dispatch-updater` items 4 and 5) (intent, decision 10)
- Written only after either Approve option, in STEP `add-brainstorm.write-intent-file`, before the intent file; "Keep discussing" writes nothing (intent, decision 11)
- The ban on application code stays: no source files, no `package.json`, no installs, no `git init` (intent, decision 11)
- `uses:` rows added: four skills, all `(conditional)` — `add--backend-architecture`, `add--frontend-architecture`, `add--agents-md-style` (intent, decision 7) and `add--architecture-discovery` (F7 points at its Wiki Page Contract); `- command: /add-wiki` (F7 copies its managed blocks via `{{cmd:add-wiki}}`); `- script: migrate-context-files.cjs`. Each body reference uses `{{skill:<name>/SKILL.md}}` / `{{cmd:add-wiki}}` (`scripts/build.js` "artefact-graph: undeclared reference")
- No slot or injection marker is added, moved or edited; no `fragments/agent-mode/add-brainstorm.md`, fallback or `result.schema.json` change; no numeric `STEP N` text (intent, decisions 15, 19h; `cli/tests/build-injection-points.test.js`)
- `STEP add-brainstorm.load-context` keeps `add--knowledge-discovery` and `about.md` and gains no `docs/features/` sweep wording (`cli/tests/delivery-index.test.js` L3.6)
- The approval keeps `Approve, I confirm each stage`, `Approve, deliver automatically`, `Keep discussing` and `Draft the objective` (`cli/tests/product-pipeline-parity.test.js` L1.5)
- Do not re-add `add--project-scaffolding` anywhere (intent, decision 17; card 0060B removes it)
- Stack-agnostic: the sub-step names no language, framework or library as a default; a stack name appears only inside a line that labels it as one example (Maicon's binding rule for this plan)
- Anchor every edit by quoted text, never by line number (Maicon's binding rule for this plan)
- No deploy, publish, rollout or release task (Maicon's binding rule for this plan)
- `node scripts/build.js` exits 0 with no new warning; `npm run test:all` passes in the container per `scripts/run-tests.js` (intent, decision 19h; AGENTS.md, Pipeline)

## Problem

1. **No help on an empty repo** — `/add-brainstorm` reads `AGENTS.md` and the wiki as its pattern
   source. On a repo with neither and no code there is nothing to read, nothing helps the user choose
   the stack foundations, and nothing records the choice.
2. **The first command fails on a fresh repo** — `node .codeadd/scripts/status.cjs` exits 2 after
   `git init` with no commit and exits 1 outside git. The brainstorm has no rule for that and stops.
3. **Decisions would be invisible** — readers consult the wiki only when `status.cjs` prints
   `WIKI:present`, which needs `.codeadd/wiki/index.md`; `conventions.md` alone would never be read.

## Proposal

Write the guard test first and record it RED. Then edit `add-brainstorm.md` in the order a run reads
it: the index and the gate table, load-context (trigger + tolerance), classify, the new sub-step, then
the approval / write / report changes. Then the two listings. Decision 13 (decided rows checked against
code) already lands with 0062B, so this card adds a GUARD for it, not an edit (D-A). Each F-block turns
its own assertions GREEN.

## Scope

### Includes

#### Phase A — the guard test (RED first)

- **F1** [product] — NEW `cli/tests/brainstorm-greenfield.test.js` (vitest). It reads
  `framwork/.codeadd/` source and `web/src/pages/docs.astro`, never the build output, and asserts
  L1.1–L1.14 of the Validation Matrix. The `status.cjs` cases (L1.14) run the script in temp
  directories created under the OS temp dir and removed in `afterEach`; they write nothing in the
  checkout. Header comment names this plan, says every non-GUARD assertion was RED before F2, and labels
  the GUARD assertions (L1.11, L1.12, L1.13, L1.14). Run it with
  `node scripts/run-tests.js cli brainstorm-greenfield` in the container (never `npx vitest` in `cli/`)
  and paste the failing assertion names into the ledger. **If L1.12 fails at this point, 0062B is not
  merged: that is a hard stop, not a RED to drive GREEN.**
  - **Produces:** `brainstorm-greenfield.test.js` (the RED suite F2–F8 turn GREEN)

#### Phase B — `framwork/.codeadd/commands/add-brainstorm.md`

- **F2** [product] — the index, the `uses:` block and the hard-gate table (intent, decisions 2, 7, 11):
  - In the STEP index, the line starting "STEP add-brainstorm.explore:   Interactive Exploration" gains
    `(+ greenfield foundations when GREENFIELD=yes)` at its end. Column alignment of the other lines is
    not touched.
  - `<!-- uses: -->`: add, after "- skill: add--knowledge-discovery", the three rows
    `- skill: add--backend-architecture (conditional)`, `- skill: add--frontend-architecture (conditional)`,
    `- skill: add--agents-md-style (conditional)`, `- skill: add--architecture-discovery (conditional)`;
    after "- command: /add-new", `- command: /add-wiki`; after "- script: status.cjs",
    `- script: migrate-context-files.cjs`. F7 names all of them in the body, and the build fails on a
    name it references without a row (review B1).
  - The heading "**Two files may be written, and only these two, both under `docs/brainstorm/`:**" is
    reworded to say the two brainstorm files are always the only ones under `docs/brainstorm/`, and a
    greenfield run adds four more; the table gains one row: the four foundation files of Global
    Constraints → "greenfield only (`GREENFIELD=yes`), after either Approve option, at STEP
    add-brainstorm.write-intent-file, before the intent file". Right under the table, one line (review
    A2): the foundation files and the context-file migration are project documentation, not application
    code, so the HARD GATE's ban on application code and on Bash for implementation does not cover
    them. The spike line below the table stays; the HARD GATE code blocks are not edited.
  - Must NOT touch: the `<!-- slot:agent-mode.output-cap -->` block, the "> **ARCHITECTURE REFERENCE:**"
    line (0063B F12 owns it), the HARD GATE code blocks.
  - **Consumes:** `brainstorm-greenfield.test.js` (F1)

- **F3** [product] — STEP `add-brainstorm.load-context` (intent, decisions 3, 4; D-C):
  - Right after the line "Parse output: BRANCH, FEATURE, PROJECT_DOCS, RECENT_CHANGELOGS.", add the
    greenfield block: evaluate `GREENFIELD` once, by the trigger of Global Constraints, with the
    read-only listing named there. Then the tolerance rule as a ⛔/✅ block: when `GREENFIELD=yes`,
    `status.cjs` exit 1 (`ERROR:not a git repository`) or exit 2 (`ERROR:no main branch found`) is not
    fatal — continue with BRANCH, WIKI and PROJECT_DOCS unknown and record `no git history yet`; when
    `GREENFIELD` is not `yes`, a failure is handled as today. The block states the order the run needs:
    the trigger is evaluated even when `status.cjs` failed, because the tolerance depends on it.
  - One line (D-C): the brainstorm runs read-only git queries only (`git ls-files`, `git rev-parse`);
    it never runs `git init`, `git add` or `git commit`.
  - The line "- **ARCHITECTURE:** Read AGENTS.md and product.md (if exists)" stays byte-identical
    (0063B leaves it to this card; on greenfield there is no `AGENTS.md`, which the trigger already says).
  - Must NOT touch: the `board.ticket-resolve` slot, the knowledge-discovery bullets, the GRAPH block.
  - **Produces:** `GREENFIELD=yes` (state set in STEP `add-brainstorm.load-context`); `no git history yet`
  - **Consumes:** `brainstorm-greenfield.test.js` (F1)

- **F4** [product] — STEP `add-brainstorm.classify` (intent, decision 5): below the paths table, right
  after its row containing "`Path: architectural — full exploration and a brainstorm document.`" (the
  one inside STEP `add-brainstorm.classify`; the string `| **architectural** |` alone occurs three times
  in the file), one rule: when `GREENFIELD=yes` the path is always
  `architectural`, stated with the verbatim line of Global Constraints, because there is no existing flow
  to modify. Nothing else in the STEP changes; the ratchet, red flags and the `board.ticket-refining`
  slot stay.
  - **Consumes:** `GREENFIELD=yes` (state set in STEP `add-brainstorm.load-context`) (F3)

- **F5** [product] — NEW sub-step `### STEP add-brainstorm.greenfield-foundations`, inserted directly
  before the heading "### STEP add-brainstorm.sections-close The sections to close" (so after the
  paragraph ending "the questions are how it stops being one.") (intent, decisions 6, 7):
  - Opens with its guard: runs only when `GREENFIELD=yes`; otherwise skip it, nothing changes.
  - The one "foundations" question with the five items of intent decision 6, each with a recommendation
    and a named precedent per STEP `add-brainstorm.bring-outside-in`. The pack is one question under the
    cadence; a follow-up goes only to an item the user changed, one per turn; an item the request
    already names is pre-filled and only confirmed. Agent mode: the five items go into the numbered
    batch with a RECOMMENDED line each, by the existing `cadence` / `structured-ask` slots — the
    sub-step adds no slot and repeats no fragment text. `Stop kind — deciding.`
  - Consulting: load `{{skill:add--backend-architecture/SKILL.md}}` and/or
    `{{skill:add--frontend-architecture/SKILL.md}}` by the apps chosen in item 1. Their lists named
    "Over-Engineering Signals" (backend) and "Over-engineering signals" (frontend) gate every
    recommendation: the simplest option the drafted objective needs, no layer or pattern without a
    present need, DI container only when the framework provides one, barrels off by default.
  - The decisions become Key Decisions rows of the `Decision | Serves | Rationale` table (intent,
    decision 14) — the brainstorm schema is not changed.
  - Stack-agnostic: every concrete stack name in the sub-step is labelled as an example.
  - Must NOT: add a slot, a new top-level STEP, or any scaffolding instruction.
  - **Produces:** the five foundation decisions (Key Decisions rows, carried to STEP add-brainstorm.write-intent-file)
  - **Consumes:** `GREENFIELD=yes` (state set in STEP `add-brainstorm.load-context`) (F3)

- **F6** [product] — STEP `add-brainstorm.approval` (intent, decision 11): in the block
  "IF THE ANSWER IS \"Keep discussing\":", the ⛔ line "Write the intent file or print a handoff" gains
  "or, on greenfield, any of the four foundation files". In the block "IF THE USER HAS NOT CHOSEN ONE OF
  THE THREE OPTIONS:", the ⛔ "Write on docs/brainstorm/ for the intent file" gains the same files. The
  `agent-mode.approval-ask` slot and the three option names stay.
  - **Consumes:** `brainstorm-greenfield.test.js` (F1)

- **F7** [product] — STEP `add-brainstorm.write-intent-file` and STEP `add-brainstorm.report` (intent,
  decisions 8, 9, 10, 12, 13; D-B, D-D, D-E):
  - In write-intent-file, before the paragraph starting "Write `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md`",
    a greenfield block (runs only when `GREENFIELD=yes`) that writes, in this order (D-E):
    1. `.codeadd/wiki/conventions.md` — Wiki Page Contract frontmatter per intent decision 8 (`id:
       wiki/conventions`, `type: reference`, `area: conventions`, `sources:` = globs of the planned
       source roots, `commit:` short sha or `none`, `generated:` today), pointing at
       `{{skill:add--architecture-discovery/SKILL.md}}` for the contract rather than restating it; the
       `## Stack Conventions` table in the format of Global Constraints. Existing page (intent,
       decision 12): write or replace only that section.
    2. `.codeadd/wiki/index.md` — the minimal hub of D-D; existing hub: add the `conventions.md` link
       only when missing.
    3. `.codeadd/wiki/.meta.json` — exactly as in Global Constraints.
    4. `AGENTS.md` — load `{{skill:add--agents-md-style/SKILL.md}}`, run its Migration
       (`node .codeadd/scripts/migrate-context-files.cjs`) first, then write `## Architecture Contract`
       (planned apps + layer rule), `## Technical Spec` (compact JSON of the decided stack), the
       multi-tenancy critical rule line only when Tenancy = multi-tenant, and the three managed blocks
       verbatim from `{{cmd:add-wiki}}` (D-B for a migrated file). Within the skill's line budget.
    Then the existing intent-file text runs unchanged. A ⛔ line repeats the ban: no source file, no
    `package.json`, no install, no `git init`. A write failure stops the step before the intent file
    and is reported (D-E).
  - In STEP `add-brainstorm.report`, after the paragraph "After the report: the document path …", one
    greenfield line: the report lists the four files written, every `MIGRATED:` / `LEGACY_LOCAL:` line
    from the migration, and — when load-context recorded `no git history yet` — tells the user to run
    `git init` and make a first commit before `/add-new`, because `/add-new` runs `status.cjs` too.
  - In `## Rules` → **ALWAYS**, one line: on greenfield, write the four foundation files only after an
    Approve option and before the intent file.
  - Must NOT touch: the `board.ticket-intent`, `board.ticket-shaped`, `board.ticket-report` slots, the
    `## Open` block, the validation-gate paragraph.
  - **Consumes:** `GREENFIELD=yes` (state set in STEP `add-brainstorm.load-context`); `no git history yet` (F3);
    the five foundation decisions (Key Decisions rows, carried to STEP add-brainstorm.write-intent-file) (F5)

#### Phase C — the listings

- **F8** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md` (intent, decision 16; D-G):
  - The Commands-table row starting "| add-brainstorm | Explore ideas (READ-ONLY) |": purpose gains
    ", decides stack foundations on an empty repo"; Skills Loaded gains `add--agents-md-style`,
    `add--architecture-discovery`, `add--backend-architecture`, `add--frontend-architecture`, kept
    alphabetical as the cell already is. "(READ-ONLY)" stays: F2's line says what it covers.
  - D-G: the Skills-table rows starting "| add--agents-md-style |" (Used By `add-wiki` → `add-brainstorm, add-wiki`),
    "| add--architecture-discovery |" (`add-brainstorm` joins its list), "| add--backend-architecture |"
    and "| add--frontend-architecture |" (Used By `(none)` → `add-brainstorm`). Multi-value cells use
    `, ` and stay alphabetical, as the other cells do.
  - The `uses:` block of this file stays all `mention:`; no other row changes (0060B, 0061B, 0063B and
    0065B edit other rows).
  - **Consumes:** `brainstorm-greenfield.test.js` (F1)

- **F9** [internal] — `web/src/pages/docs.astro` (intent, decision 16; D-H): the line
  `<p class="text-muted text-xs mt-0.5">Explore ideas (read-only)</p>` under `/add-brainstorm` becomes
  "Explore ideas (read-only); decides stack foundations on an empty repo". No other entry changes.
  - **Consumes:** `brainstorm-greenfield.test.js` (F1)

### Does NOT Include (important!)

- Any scaffolding, source file, `package.json`, install or `git init` (intent, decision 17)
- Any change to `status.cjs` — its empty-repo exit codes stay; L1.14 pins them (intent, decision 17; D-F)
- Edits to `add--wiki-maintenance/SKILL.md` and `add--architecture-discovery/spine-analyzer.md` — 0062B
  F3 (D-D) and F7 rule (b) already carry decision 13; this card guards it (D-A)
- A new command, a new top-level STEP, a new slot, any agent-mode fragment or fallback edit,
  `result.schema.json` (intent, decisions 2, 15)
- The brainstorm and brainstorm-intent schemas (intent, decision 14)
- Planning the first feature — `/add-new` does that
- `/add-help` (reads the ecosystem map), `docs.astro`'s graph-data arrays and the SVGs — `add-framework--sync` regenerates them
- The "> **ARCHITECTURE REFERENCE:**" line of `add-brainstorm.md` (0063B F12)
- Any deploy, publish, rollout or release step

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Shape, trigger, tolerance, path, question, consulting, outputs, timing, existing wiki, check against code, schemas, agent mode, listings, scope | As decided | Intent decisions 1–20, approved by Maicon |
| D-A: 0062B already adds the decided-row rule to `spine-analyzer.md` (its D-D) and `add--wiki-maintenance` (its F7 rule b), with Evidence `BRN-<slug>` and `drift: <path:line>`. Does this card edit them again? | No edit. L1.12 guards the rule's presence; failing at F1 means 0062B is not merged → hard stop | Intent decision 13 asks for "one rule in each of those two files"; it exists after 0062B. A second edit would duplicate it. Decision 8's fallback ("if it ships without a source marker") does not fire: 0062B ships the `Source` column |
| D-B: A root `CLAUDE.md`/`GEMINI.md` passes the trigger (root `*.md` is dropped), and the migration then creates `AGENTS.md` from it. Overwrite? | No. On `MIGRATED:<file>:created` or `appended`, add `## Architecture Contract` and `## Technical Spec` only when their headings are absent, and replace-or-append the three managed blocks on their markers — the same rule `add-wiki` uses | Overwriting deletes the user's content right after the migration moved it there. The trigger stays as decided; only the write handles the case |
| D-C: Decision 4 says "the brainstorm never runs git commands itself", but decisions 3 and 8 need `git ls-files` and the short sha | "Git commands" means commands that write: `init`, `add`, `commit`. Read-only `ls-files` and `rev-parse` are allowed | The decisions only hold together on this reading; decision 11 names `git init` as the banned act |
| D-D: Which sections does the minimal `index.md` carry? | Title, one-line summary, the "Generated by" line naming `/add-brainstorm (greenfield)` and the commit or `none`, `## Architecture & Rules` with only the `conventions.md` link (description from its frontmatter), and `## How to Search`. Empty sections (Domains, Terminology, Optional, Backlog) are omitted | Hub format of STEP `add-wiki.hub`; the link↔file bijection holds with one page; a full `/add-wiki` rewrites the hub (intent risk 2) |
| D-E: Order of the four writes, and a failure | conventions → index → .meta.json → AGENTS.md, then the intent file. A failure stops before the intent file and is reported | `index.md` is what flips `WIKI:present`, so it follows the page it links; the intent file last means a half-written greenfield never hands off as if complete |
| D-F: Decision 4 is a bug-fix behaviour (the brainstorm stops on a fresh repo). Where is the red-green? | RED: L1.4 (no tolerance text today). GUARD: L1.14 pins the three `status.cjs` behaviours the tolerance relies on (exit 1, exit 2, `WIKI:present` with no `gitHead`) | `status.cjs` is out of scope (decision 17); if its codes change, L1.14 fails before the command silently mis-handles them |
| D-G: The Skills table lists who uses each skill. Update the three consulted skills? | Yes — `add-brainstorm` in their Used By cells | After F2 the graph has the edges; a table saying `(none)` would contradict it. Derivable, same file as decision 16 |
| D-H: Layer of `web/src/pages/docs.astro` | `[internal]` | Repo root, not `mcp/`, not in the npm package (`add-plan-authoring` layer table); same tag as 0061B F9 |
| How are agent-driven behaviours proven? | L1 text guard (RED first) + L1.14 script guards + L2 build/test:all + L3 cold walkthrough of each acceptance scenario recorded in the ledger | No harness runs `/add-brainstorm` on a sample repo; adding one is out of scope |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/brainstorm-greenfield.test.js` | product | create | Guard test, RED first (F1) |
| `framwork/.codeadd/commands/add-brainstorm.md` | product | modify | F2–F7. Graph depth 1: 4 dependants (add-help, add-new `HANDS_OFF_TO`; agent-mode and board fragments `INJECTS_INTO`) → **HIGH**; no slot or marker is touched, so both fragments inject unchanged |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F8. Graph depth 1: 6 dependants (add-audit, add-diagnose, add-done, add-help, add-hotfix, add-wiki) → **HIGH**; table text only |
| `web/src/pages/docs.astro` | internal | modify | F9. Not in the graph (web page) — **LOW**, one text line |
| `framwork/.codeadd/skills/add--wiki-maintenance/SKILL.md` | product | none (read by L1.12) | D-A. Graph depth 1: 3 dependants → would be HIGH; not edited |
| `framwork/.codeadd/skills/add--architecture-discovery/spine-analyzer.md` | product | none (read by L1.12) | D-A. Sibling of `add--architecture-discovery` (5 dependants); not edited |
| `framwork/.codeadd/skills/add--backend-architecture/SKILL.md`, `add--frontend-architecture/SKILL.md`, `add--agents-md-style/SKILL.md`, `add--architecture-discovery/SKILL.md` | product | none | Gain one inbound `USES_SKILL` edge each from F2's conditional rows; their text is not edited. `add-wiki` gains one inbound edge from `- command: /add-wiki` |
| `AGENTS.md` | internal | none | Not changed by this plan |

Delivery index (product layer): `add-brainstorm` 1 live entry, 0 dead — nothing here was shipped and
dropped before. No greenfield / foundations artefact exists in either layer.

### Cross-Card Overlaps

| Card | Same file | What it edits | What this plan edits | Rule |
|---|---|---|---|---|
| 0060B | `add--ecosystem/SKILL.md` | removes five skill rows and five `mention:` rows | F8 the `add-brainstorm` Commands row and three Skills rows | Different rows; anchor by quoted text |
| 0060B | `docs.astro` | removes five `{ name: … }` skill entries | F9 the `/add-brainstorm` description line | Different lines |
| 0060B | arch skills (read) | removes `add--project-scaffolding` from their `uses:` | consults them, no edit | Dependency only; never re-add the row |
| 0061B | `add--ecosystem/SKILL.md`, `docs.astro` | `add--ux-design` row / entry | F8, F9 | Different rows |
| 0062B | `add--wiki-maintenance`, `spine-analyzer.md` | decided-row rule, table contract, D-F (tiny mode not chosen when `conventions.md` exists) | nothing (D-A); writes rows in its format | Dependency; L1.12 is the merge check |
| 0063B | `add-brainstorm.md` | F12 the "> **ARCHITECTURE REFERENCE:**" line only | F2–F7, never that line | 0063B's F12 explicitly leaves this card's lines alone |
| 0063B | arch skills (read) | F6 adds the "recorded conventions" line | consults them, no edit | On greenfield no conventions exist yet, so that line does not fire |
| 0065B | `add--ecosystem/SKILL.md`, `docs.astro` | the Plugins table and the Plugins section | F8, F9 | Different sections |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 writes every L1 assertion BEFORE F2 lands; run it and confirm L1.1–L1.10
fail against the current tree. Then drive them GREEN with F2–F9. "Section" below means the text from the
heading line to the next heading of the same or a higher level, matched at line start.

### L1 — Source guard (`cli/tests/brainstorm-greenfield.test.js`, RED → GREEN)

1. `add-brainstorm.md`: the STEP-index line starting `STEP add-brainstorm.explore:` contains
   `(+ greenfield foundations when GREENFIELD=yes)`. *RED today.* (F2)
2. Its `uses:` block contains `- skill: add--backend-architecture (conditional)`,
   `- skill: add--frontend-architecture (conditional)`, `- skill: add--agents-md-style (conditional)`,
   `- skill: add--architecture-discovery (conditional)`, `- command: /add-wiki` and
   `- script: migrate-context-files.cjs`. *RED today.* (F2)
3. The text `Two files may be written, and only these two` is gone, and one table row names all four of
   `conventions.md`, `index.md`, `.meta.json`, `AGENTS.md`. *RED today.* (F2)
4. The load-context section contains `GREENFIELD`, `git ls-files --cached --others --exclude-standard`,
   `not a git repository`, `no main branch found` and `no git history yet`; it still contains
   `add--knowledge-discovery` and `about.md`. *RED today: the first five are absent.* (F3, D-F)
5. The classify section contains `Path: architectural (greenfield): stack foundations first, then full exploration.` *RED today.* (F4)
6. A line `### STEP add-brainstorm.greenfield-foundations` exists, after
   `### STEP add-brainstorm.draft-objective-first` and before `### STEP add-brainstorm.sections-close`;
   its section contains `GREENFIELD=yes`, `Tenancy`, `Validation`, `ORM`,
   `{{skill:add--backend-architecture/SKILL.md}}`, `{{skill:add--frontend-architecture/SKILL.md}}`,
   `Over-Engineering Signals`, `Over-engineering signals` and `Stop kind — deciding`. *RED today.* (F5)
7. The approval section mentions `conventions.md` inside the "Keep discussing" block. The
   write-intent-file section contains `## Stack Conventions`, `decided`, `BRN-`,
   `migrate-context-files.cjs`, `codeadd-wiki`, `codeadd-style`, `codeadd-shell`,
   `brainstorm-greenfield`, `INSTRUCTIONS.md` and `git init`; and the first `conventions.md` in it comes
   before the line starting ``Write `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md` ``. *RED today.* (F6, F7)
8. The report section contains `first commit`. *RED today.* (F7)
9. `add--ecosystem/SKILL.md`: the row starting `| add-brainstorm |` contains
   `decides stack foundations on an empty repo`, `add--agents-md-style`, `add--backend-architecture` and
   `add--frontend-architecture`, `add--architecture-discovery`; the rows starting `| add--agents-md-style |`,
   `| add--architecture-discovery |`, `| add--backend-architecture |`, `| add--frontend-architecture |` each end with a Used By cell
   containing `add-brainstorm`. *RED today.* (F8)
10. `docs.astro` contains `decides stack foundations on an empty repo`. *RED today.* (F9)
11. GUARD — `add-brainstorm.md` has no line matching `/\bSTEP \d/`; keeps every `STEP add-brainstorm.`
    id it has today (the test lists them); its count of `<!-- slot:` lines equals today's (the test
    records the number); it still contains `Approve, I confirm each stage`,
    `Approve, deliver automatically`, `Keep discussing` and `Make code changes to application files`.
    Passes today, must keep passing.
12. GUARD — 0062B is merged: `spine-analyzer.md` contains
    `| Convention | Value | Where / enforcement | Evidence | Source |`, `decided` and `drift:`;
    `add--wiki-maintenance/SKILL.md` contains `decided` and `drift:`. Must pass at F1; a failure is a
    hard stop (D-A).
13. GUARD — `add-brainstorm.md` does not contain `add--project-scaffolding`. Passes today.
14. GUARD — `status.cjs` in temp dirs (D-F): (a) a plain directory → exit 1 and stderr
    `ERROR:not a git repository`; (b) `git init` on `main` with no commit → exit 2 and stderr
    `ERROR:no main branch found`; (c) one commit on `main` plus `.codeadd/wiki/index.md` and
    `.codeadd/wiki/.meta.json` = `{"updatedAt":"2026-10-24T00:00:00Z","command":"brainstorm-greenfield"}`
    → exit 0, stdout `WIKI:present` and `WIKI_STALE_COUNT:unknown`. Passes today.

### L2 — Build and full suite

1. `node scripts/build.js` exits 0 with no new warning: no undeclared reference (the four
   `{{skill:}}` names, `{{cmd:add-wiki}}` and `migrate-context-files.cjs` are declared), no raw `.codeadd/` path warning
   from `lintResourcePaths()` other than the `.codeadd/scripts/` and `.codeadd/wiki/` forms the file
   already uses.
2. `npm run test:all` passes in the container, including `delivery-index.test.js` L3.6,
   `product-pipeline-parity.test.js` L1.5, the slot-membership fixture, `build-artefact-graph.test.js`,
   `agent-mode*.test.js`, `board-*.test.js` and the new suite. If a graph test asserts an edge total that
   the new edges change, update that number in the same commit with a comment naming this plan.
3. The built `framwork/.claude/commands/add-brainstorm.md` contains the greenfield sub-step with
   `{{skill:}}` resolved (no leaked placeholder) and the same slot content as before.

### L3 — Behavioural acceptance (cold walkthrough, recorded in the ledger)

The build reads the edited command as the agent would, for each scenario, and records in the ledger the
quoted lines that produce the outcome:

1. Temp repo with one commit, no code, no `AGENTS.md` → `Path: architectural (greenfield)…`, the
   five-item question with recommendations, and after Approve the four files + intent file, nothing else;
   `status.cjs` then prints `WIKI:present` (acceptance a, e; L1.14c).
2. Same repo, "Keep discussing" → no file written (acceptance b).
3. Repo with a `src/` file, or with `AGENTS.md` → `GREENFIELD` not `yes`; every step reads as today
   (acceptance c).
4. `git init`, no commit → load-context continues with `no git history yet`; the report asks for a first
   commit; `.meta.json` has no `gitHead`; `commit: none` (acceptance d).
5. The written `AGENTS.md` carries each managed-block pair exactly once, per STEP `add-wiki.verify`
   (acceptance f).
6. `/add-wiki update` and full `/add-wiki` over a `decided` row: confirmed → `detected` with `path:line`;
   contradicted → `drift:`; no code → unchanged — by quoting the 0062B lines L1.12 found (acceptance g).
7. Root `CLAUDE.md` only → migration creates `AGENTS.md`; the write keeps its content and adds the
   sections and blocks (D-B). Existing `.codeadd/wiki/conventions.md` → only `## Stack Conventions`
   replaced, link added only if missing (decision 12).

**RED expectations against the current tree:** L1.1–L1.10 fail (the text does not exist); L1.11, L1.13
and L1.14 pass; L1.12 passes once 0062B is merged. L2 passes today and must still pass after. L3 cannot
pass today.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [product] → F7 [product] → F8 [product] → F9 [internal]

- **F1 first** because it is the RED proof and the 0062B merge check (L1.12).
- **F2 before F5/F7** because the `{{skill:}}` references they add fail the build unless the `uses:`
  rows exist.
- **F3 before F4, F5, F7** because they consume `GREENFIELD=yes` and `no git history yet`.
- **F5 before F7** because the writes consume the five decisions.
- **F8, F9 last** — listings describe the finished behaviour.
- Coverage map: F2→L1.1–L1.3, F3→L1.4, F4→L1.5, F5→L1.6, F6/F7→L1.7–L1.8, F8→L1.9, F9→L1.10;
  L1.11, L1.13, L1.14 and L2 span every F-block; L3 covers F3–F7.
- Every boundary leaves the repo building. Per F-block: run the new suite and record which L1 items
  turned GREEN; run L2 once after F9; do L3 after L2.

## Reviewer Handoff

For each F-block the build must leave in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision or D-A..D-H it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 item was never RED — a test written after the edit proves nothing.
2. A non-greenfield line reworded while adding the branch (Global Constraints, second line).
3. A slot or marker moved, or a fragment/fallback edited to fit the sub-step.
4. A stack name in the sub-step that is not labelled as an example.
5. A write path in F7 that can run before an Approve option, or after the intent file.
6. An edit to `add--wiki-maintenance` or `spine-analyzer.md` that duplicates 0062B's rule (D-A).

---

## Next Steps

Run the build only after 0062B (`wiki-stack-conventions`) is on `main`; otherwise it stops at F1 on
L1.12 (review A3).

/add-framework--build docs/plans/2026-10-24T190124-PLAN--brainstorm-greenfield.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review fix-then-ok applied: B1 `uses:` gains `add--architecture-discovery (conditional)` and `command: /add-wiki` (Global Constraints, F2, F8, L1.2, L1.9, L2.1); A1 F4 anchor made unique; A2 F2 line says the HARD GATE does not cover the foundation files; A3 Next Steps names the 0062B precondition; A4 Used By separator stated; N1 coverage map; N2 F5 anchored on the next heading |
| 2026-10-24 | Implemented on feat/0064b-brainstorm-greenfield, F1-F9 plus review fixes (commits 64761d0..HEAD) |
