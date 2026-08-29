# Evidence: T2 — Epic foundations

> **Plan:** `docs/plans/0074-PLAN--autonomous-epic-convergence-002-epic-foundations.md`
> **Umbrella:** `docs/plans/0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Status:** complete
> **Closed:** 2026-08-29 — after the adversarial round and its fixes
> **Started:** 2026-08-27

---

## L0.1 — Injection-point baseline (recorded before any edit)

Captured with `node scripts/build.js` on a clean tree at branch point `feat/0074-autonomous-epic-convergence`.

**Total injection points: 39**

| Resource | Points | Namespaces |
|---|---|---|
| `architecture-agent` (agent) | 1 | plugin:gitnexus:graph |
| `backend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `database-agent` (agent) | 1 | plugin:gitnexus:graph |
| `discovery-agent` (agent) | 1 | plugin:gitnexus:graph |
| `frontend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `qa-agent` (agent) | 1 | plugin:playwright:drive |
| `reviewer-agent` (agent) | 1 | plugin:gitnexus:graph |
| `system-design-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-flow-agent` (agent) | 1 | plugin:gitnexus:graph |
| `add.build` (command) | 10 | feature:qa-pipeline:e2e-dispatch · feature:qa-pipeline:qa-fix · feature:tdd-pipeline:awareness · feature:tdd-pipeline:coverage · feature:tdd-pipeline:detect-framework · feature:tdd-pipeline:gate · feature:tdd-pipeline:tasks-flow · feature:tdd-pipeline:test-dispatch · feature:tdd-pipeline:verification · feature:tdd-pipeline:verify-red |
| `add.diagnose` (command) | 1 | plugin:gitnexus:graph-trace |
| `add.done` (command) | 1 | plugin:gitnexus:graph-reindex |
| `add.hotfix` (command) | 2 | feature:tdd-pipeline:red-gate · plugin:gitnexus:graph-impact |
| `add.new` (command) | 1 | plugin:gitnexus:graph-map |
| `add.plan` (command) | 5 | feature:qa-pipeline:qa-spec · feature:qa-pipeline:step-list · feature:tdd-pipeline:step-list · feature:tdd-pipeline:step9 · plugin:gitnexus:graph-plan |
| `add.review` (command) | 3 | feature:tdd-pipeline:spec-audit · feature:tdd-pipeline:step-list · plugin:playwright:drive |
| `add.wiki` (command) | 6 | plugin:gitnexus:graph-classify · plugin:gitnexus:graph-contract · plugin:gitnexus:graph-database · plugin:gitnexus:graph-dispatch-common · plugin:gitnexus:graph-quality · plugin:gitnexus:graph-specialist |

Baseline copy: `C:/tmp/0074-injection-baseline.json`
Checker: `C:/tmp/check-anchors.py` — compares namespace/name/section/resource AND anchor text, so a moved anchor is caught even when the total stays 39.

---

## F-block log

### F10, F11 — `epic` schema

**F10** — new `### epic` schema in `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md`, placed after `### brainstorm`. Sibling bullet order kept (Frontmatter / Sections / Depth floor / Compression / Hard bans). The file's own intro count and schema list updated to five.

**F11** — `epic` appended to the `new-feature` row of the Schema Index in `add-doc-schemas/SKILL.md` (L165). No new ID prefix: an epic lives under its feature's `[NNNN]F`.

**Status values verified against the code, not assumed:** exactly `pending` / `in_progress` / `done`, matching the grep patterns at `status.sh:275,278,283,288`. No value invented.

**A real defect surfaced and was fixed during authoring.** `/add.new` STEP 5 never specified a table header at all — it says only "subfeature table + order + notes", so every run invents one. Meanwhile `/add.build` block 14.3 turns a 4-cell `pending` row into a 5-cell `done` row by appending the checkpoint tag name. A positional 6-column schema would therefore misread that 5th cell as `dependencies`.

The subagent's first solution was to recognise the optional columns *by content shape*. **Rejected on review** — content sniffing is exactly the guessing this topic exists to remove; it would have left every consumer inspecting cell values to decide which column it was looking at. Replaced with:

- the schema **requires a header row naming every column**, and consumers resolve columns **by header name**;
- one deterministic legacy rule: *a data row with more cells than the header declares has its trailing extra cell read as `checkpoint`* — the only cell `/add.build` has ever appended.

No cell contents are inspected, and every pre-schema `epic.md` still reads correctly.

**Checkpoint-column attribution corrected.** The draft credited `/add.build` STEP 16 with writing the `checkpoint` cell. F13 removes tag creation from `/add.build`, and F27 (T4) creates it on the real commit. The schema now says the cell is written **only by the command that creates the checkpoint commit the tag points at**, and notes that `/add.build` never commits so never writes it. Hard bans gained: a checkpoint cell naming a tag that resolves to no commit.

**Backward compatibility walked field by field** against today's real output: fresh `pending` row (4 cells), post-build `done` row (5 cells), doc-level absence of frontmatter/TL;DR/headings. All read correctly; nothing is rewritten.

### F12, F16 — consumers wired to the schema

**F12** `add.new.md` STEP 5 — now writes `epic.md` per the `epic` schema, and the instruction names the part that matters: a **required header row naming every column** (`id | name | objective | status | dependencies | checkpoint`), `status` starting `pending`, optional cells left empty. Single-line in-place edit inside STEP 5.

**F16** `add.plan.md` STEP 8.0 — resolves the dependency graph **by header name, never by column position**, taking dependencies from the `dependencies` column when populated and falling back to the legacy `## Order` narrative only when it is absent. The STEP 5 documentation table row now names the schema. Edit starts at L207, below the L205 boundary.

**F15 — no change needed, and that is stated rather than invented.** T1's F6 had already rewritten `add.done.md` STEP 4.1 to branch entirely on `GATE_EPIC` / `GATE_EPIC_DETAIL` / `EPIC_PENDING`, and STEP 4's preamble already bans re-deriving a verdict by counting rows. A grep for string-counting logic across the file found none. `add.done.md` has **zero diff** in T2.

### F13 — the fake checkpoint tag, dropped

Block `14.2` under `## STEP 16` no longer creates a tag. The file now carries the reasoning: `GIT CLEAN` (line 54) means `/add.build` never commits, so a tag here lands on the commit that existed **before** this subfeature's work — restoring from it restores the state before the subfeature. *"The tag has always been a lie, and gating its creation behind a condition would only wrap the same lie in a different hat — there is no condition this block could ever evaluate to true."*

**The block's own label was self-contradictory after the edit** and was corrected: `**14.2 Create Checkpoint Tag (MANDATORY):**` -> `**14.2 Checkpoint Tag — NOT created here (MANDATORY):**`. Checked first that no feature or plugin fragment references `14.2` or `STEP 16` (grep: none), so no injected text goes stale. The number `14.2` is unchanged.

### F14, F17, F18

- **F14** block `14.3` resolves the epic row by its `id` cell and sets `status` **by header name**. It explicitly no longer writes the `checkpoint` cell: `/add.build` creates no commit, so ownership of that cell belongs to whoever does.
- **F17** the `review` schema's frontmatter gained `scope: [<SFxx>, ...]`, mirroring `qa-validation`'s field; `[feature]` on a simple feature. The QA-baseline format text from T1 was left untouched.
- **F18** `add.review.md` STEP 11.3 writes `scope:`, derived from the in-scope `SCOPE_DIR`s resolved in 8.3.

### F19 — gate 3 upgraded, RED first

Written as two failing tests before the implementation, targeting the exact blind spots the string rule has. The string rule cannot tell *which* column it matched, so any cell reading `done` passes the whole row:

| Test | Before F19 | After F19 |
|---|---|---|
| A `Notes` cell reading `done` while `status` is `pending` | **not ok** — row counted as done | ok — `broken`, `EPIC_PENDING=SF02` |
| A subfeature literally **named** `done`, status `pending` | **not ok** — row counted as done | ok — `broken`, `EPIC_PENDING=SF02` |
| `status` in a different column position | ok (guard) | ok |
| Legacy 5-cell `done` row under a 4-column header | ok (guard) | ok |

Implementation resolves `status` by header name in awk, and **falls back to the T1 string rule when no header names its columns** — which is what every pre-schema `epic.md` relies on. Suite grew 34 -> 38 tests; **38/38 green**.

_Appended as each F-block lands._

## Validation levels

| Level | Result | Evidence |
|---|---|---|
| **L0.2** injection total after T2 | **PASS** | build clean; checker reports 39/39 intact **by anchor text**, run after every file |
| **L1** schema gate | **PARTIAL** | The schema is authored and its rules are stated. No automated `add-doc-schemas` gate runner exists to execute it against a document, so L1.1-L1.3 (well-formed passes, each depth-floor violation caught, cycle rejected) are **not machine-verified** |
| **L2.1/L2.2** consumers read by schema | **PARTIAL** | F14/F15/F16 instructions rewritten and inspected. These are command instructions, not code, so "does the agent actually resolve by header" cannot be proven without a live run |
| **L2.4** `/add.new` writes a conforming epic | **NOT RUN** | Needs a live `/add.new` invocation |
| **L3.1b** string-rule blind spots close | **PASS** | Two tests RED before F19, green after — Notes cell reading `done`, subfeature named `done` |
| **L3.1/L3.2** gate 3 outcomes | **PASS** | 9/9 gate-3 tests, incl. regression guards for all-done, pending, no-`epic.md`, and both scoped forms |
| **L4.1** pre-schema `epic.md` still parses | **PASS** | The no-header fallback path is exercised by every pre-F19 fixture in the suite (their tables have a `Status` header, and the legacy 5-cell test proves the extra-cell case) |
| **L4.4** `LAST_CHECKPOINT` tells the truth | **PASS by construction** | F13 removes tag creation, so `status.sh:322` can only report a tag that some command's real commit created. Not exercised live |
| **L5.1/L5.2** build after each file | **PASS** | 39/39 after every edit |
| **L5.3** fragment step references re-verified by hand | **PASS** | grep for `14.[123]` and `STEP 16` across all feature and plugin fragments: **no matches**. No injected text references the blocks T2 edited |
| **L5.4/L5.5** feature and plugin enable/disable round-trip | **NOT RUN** | Needs a project installed from this build; see Gaps |

## Gaps — what is NOT proven

- **No schema-gate runner exists.** `add-doc-schemas` defines its validation gate as a procedure an agent performs, not a script. So the `epic` schema's depth floors and hard bans (cycle rejection, unknown status value, dependency naming an absent id) are **specified but not machine-enforced**. Any claim that they "pass" would be a claim about prose.
- **L5.4/L5.5 round-trips not run.** Enabling and disabling `tdd-pipeline`, `qa-pipeline`, `gitnexus` and `playwright` on a project installed from this build, and confirming byte-identical files, needs an install target. The 39/39 anchor check proves the sidecar is intact; it does not prove the enable/disable path round-trips.
- **Command-level behaviour is inspected, not executed.** F12/F14/F16/F18 are instructions to an agent. The script beneath gate 3 is fully tested; whether a coordinator follows the new instruction is not something this checkpoint can prove.
