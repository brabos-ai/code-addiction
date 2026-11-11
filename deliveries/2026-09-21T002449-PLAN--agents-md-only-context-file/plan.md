# Plan: AGENTS.md only — the framework writes and reads one context file

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-21
> **Delivery:** automatic

---

## Objective

AGENTS.md is the only context file the framework writes and reads — in the user's project and in this
repository. No command, skill, script or agent generates, maintains or reads CLAUDE.md (or GEMINI.md)
any more, and all five providers read the same single file.

**When this build is done:** `/add.wiki` and `add-architecture-discovery` write AGENTS.md and nothing
else. On their first run in a project they fold every root CLAUDE.md, `.claude/CLAUDE.md` and GEMINI.md
into AGENTS.md and delete them, so Claude Code (v2.1.277+) starts reading AGENTS.md. Every product reader
reads AGENTS.md. This repository's own context file is AGENTS.md, and `scripts/inventory.js` maintains
its block there.

## Context

Claude Code v2.1.277 reads AGENTS.md natively, but only when no CLAUDE.md exists in the working directory
or above. Antigravity reads it since 1.20.5, but a GEMINI.md overrides it. Codex, Cursor and OpenCode
already read it. Today `add.wiki` writes CLAUDE.md as the source and copies it to AGENTS.md and GEMINI.md.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-20T235642-agents-md-only-context-file.md` | Discovery, the mechanism (writers, migration, readers, detection, validation, rename, internal layer), scope, key decisions, risks |
| `docs/brainstorming/2026-09-20T235642-agents-md-only-context-file-intent.md` | Path `architectural`, `delivery: automatic`, closed decisions, worktree + PR-at-end instruction |

## Global Constraints

- Only AGENTS.md is written; no CLAUDE.md shim of any kind (intent file, `## Decided`)
- Migration never loses a line: every line of a migrated file ends up in AGENTS.md before the file is deleted (design, Key Decisions)
- `.claude/`, `.cursor/`, `.agents/`, `.opencode/` provider directories and `~/.claude/CLAUDE.md` are NOT context files and are not touched — only the filenames `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md` change meaning (design, Scope)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Never write a raw `.codeadd/` path in an artefact; scripts are the exception — always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments are stripped at build; the `<!-- plugin:gitnexus:graph-contract -->` marker in `add.wiki` STEP 6 must survive (CLAUDE.md, Feature Injection System)
- Build runs in an isolated git worktree and ends by opening the PR (intent file, `## Decided`)

## Problem

1. **Three context files for one content** — CLAUDE.md is the source, AGENTS.md and GEMINI.md are copies that must stay equal.
2. **A stale file hides the right one** — a leftover CLAUDE.md makes Claude Code ignore AGENTS.md; a leftover GEMINI.md overrides AGENTS.md in Antigravity.
3. **A hand-written CLAUDE.md would hide everything** — a Claude Code user whose own CLAUDE.md never ran `add.wiki` would, under a "managed-block only" migration, never see what the framework writes (found at planning; see Validated Decisions).
4. **This repo's context is Claude-only** — root CLAUDE.md is invisible to OpenCode, which the workbench now targets.

## Proposal

Product first, internal last. A deterministic migration script comes first because both writers depend
on it and "no line lost" must be proven by a test, not by an agent following prose. Then the renamed
style skill that owns the procedure, then the two writers, then detection, validation and the reader
sweep. The internal rename of this repo's CLAUDE.md goes after the product is green, then the workbench
sweep, then one repo-wide gate that proves nothing outside an allowlist still names CLAUDE.md or GEMINI.md.

## Current State

| Artefact | Direct dependants (graph, `impact --depth 1`) | Grade |
|---|---|---|
| `add-claude-md-style` | `add.wiki`, `add-architecture-discovery`, `add-doc-schemas`, `add-token-efficiency` | HIGH |
| `add.wiki` | 16 (8 commands, 1 agent, 6 skills, gitnexus fragment — fragment has no context-file text) | HIGH |
| `add-architecture-discovery` | `architecture-agent`, `system-design-agent`, `add.wiki`, `add-claude-md-style`, `add-tasks-checklist` | HIGH |
| `init.sh` | `add.new`, `add-feature-discovery` | MEDIUM |
| `documentation-analyzer.md`, the 24 readers/mentions, root CLAUDE.md, `scripts/inventory.js`, tests | NOT VERIFIED — CLAUDE.md is not a graph node, and neither are these files' references to it. Swept by grep (counts in Impact) | — |

Installer: `cli/src/installer.js` L298 and `cli/src/updater.js` L158 already prune every file the prior
manifest listed and the new release did not ship — the old `add-claude-md-style/SKILL.md` is removed on
update with no change. Delivery index: no entry for any name here, either layer.

## Scope

### Includes

- **F1** [product] — NEW `framwork/.codeadd/scripts/migrate-context-files.sh` + `framwork/.codeadd/scripts/tests/migrate-context-files.bats`: run at the project root, folds legacy context files into AGENTS.md and deletes them. Candidates, in priority order: `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md`. AGENTS.md absent → the first candidate becomes AGENTS.md verbatim. AGENTS.md present → a candidate already contained in it (the old-copy case: AGENTS.md was CLAUDE.md + shell policy; GEMINI.md was an exact copy) carries nothing; any other candidate is appended whole under a `## Migrated from <file>` heading. Line endings normalised before comparing. Then the candidate is deleted. `CLAUDE.local.md` is never touched, only reported. Header documents usage and exit codes (0 ok, 1 I/O error), like every other script. Must not lose any line; must be idempotent (second run: no output change).
  - **Produces:** `MIGRATED:<file>:created|duplicate|appended`, `LEGACY_LOCAL:CLAUDE.local.md`, `CONTEXT_MIGRATION:none`
- **F2** [product] — `git mv framwork/.codeadd/skills/add-claude-md-style framwork/.codeadd/skills/add-agents-md-style`; rename the `framwork/provider-map.json` key; rewrite the skill for AGENTS.md (name, description, `uses:` block adds `script: migrate-context-files.sh`). It gains a **Migration** section: before any write, run `.codeadd/scripts/migrate-context-files.sh` and report every `MIGRATED:` / `LEGACY_LOCAL:` line. Keep the Writing Style block byte-identical and the source citation to code.claude.com. Update the two callers not touched elsewhere — `add-doc-schemas/SKILL.md`, `add-token-efficiency/SKILL.md` — and the tests `cli/tests/build.test.js` L824-825 and `cli/tests/plain-language-rule.test.js` skill path. The root context file's generated inventory is NOT regenerated here — F8 does it, in the internal block, after the rename.
  - **Consumes:** `MIGRATED:<file>:created|duplicate|appended`, `LEGACY_LOCAL:CLAUDE.local.md`, `CONTEXT_MIGRATION:none` (F1)
- **F3** [product] — `framwork/.codeadd/commands/add.wiki.md`: STEP 6 becomes "Update AGENTS.md" — loads `add-agents-md-style`, runs its Migration first, the dispatched agent writes AGENTS.md. The Windows shell policy becomes a third managed block `[//]: # (codeadd-shell:start)` / `(codeadd-shell:end)` in AGENTS.md, replace-or-append, keeping both shell forms the 2026-09-17 plan made mandatory. STEP 7 is no longer a copy: it becomes "Verify AGENTS.md" — each managed block exactly once, no root CLAUDE.md / `.claude/CLAUDE.md` / GEMINI.md left. Step numbers do not shift. Update-mode text, the "Why update mode reaches…" paragraph, Rules and STEP 9 report (lists migration lines) follow. Keep `<!-- plugin:gitnexus:graph-contract -->` in STEP 6.
  - **Produces:** managed block `codeadd-shell`
- **F4** [product] — `framwork/.codeadd/skills/add-architecture-discovery/SKILL.md` + `backend-analyzer.md`, `frontend-analyzer.md`, `database-analyzer.md`, `code-quality-analyzer.md`: every output target reads AGENTS.md; before writing, run `add-agents-md-style`'s Migration. Section names (Architecture Contract, Technical Spec, Validation Gates) unchanged — readers parse them.
- **F5** [product] — `framwork/.codeadd/scripts/init.sh` + `tests/init.bats`: `ARCH:AGENTS.md` / `ARCH:none` on AGENTS.md; new line `LEGACY_CONTEXT:<comma list>` when any of `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md` exists at the root, absent otherwise. `framwork/.codeadd/commands/add.new.md`: its `REF` line names AGENTS.md, and after running `init.sh` it tells the user, when `LEGACY_CONTEXT:` is present, to run `/add.wiki update` to migrate.
  - **Produces:** `LEGACY_CONTEXT:<comma list>`
- **F6** [product] — `framwork/.codeadd/skills/add-health-check/SKILL.md` + `documentation-analyzer.md`: validate AGENTS.md (existence, compliance, word count, paths); a root CLAUDE.md, `.claude/CLAUDE.md` or GEMINI.md is a finding whose fix is `/add.wiki update`. Existing DOC-00N ids keep their numbers; the leftover finding takes the next free id.
  - **Consumes:** `LEGACY_CONTEXT:<comma list>` (F5) — the analyzer may read it instead of re-testing the files; either way the three filenames match F5's list exactly
- **F7** [product] — reader and mention sweep, CLAUDE.md → AGENTS.md, meaning unchanged: `agents/conformance-agent.md`, `agents/readback-agent.md`, `commands/add.audit.md`, `add.brainstorm.md`, `add.build.md`, `add.hotfix.md`, `add.md`, `add.plan.md`, `add.review.md`; skills `add-backend-development`, `add-code-review`, `add-database-development`, `add-doc-schemas/references/new-feature.md`, `add-ecosystem`, `add-feature-readback`, `add-frontend-development`, `add-project-scaffolding` (drop GEMINI.md and CLAUDE.md from its context-file line), `add-security-audit`, `add-skill-creator/testing-skills-with-subagents.md`, `add-subagent-driven-development`, `add-tasks-checklist`, `add-wiki-maintenance` (its "never touches" rule names AGENTS.md); `framwork/.codeadd/scripts/converge-gates.sh` comment L396; `framwork/.codeadd/scripts/tests/delivered.bats` comment L885; `provider-map.json` `conformance-agent` description. No fallback read of CLAUDE.md anywhere.
- **F8** [internal] — `git mv CLAUDE.md AGENTS.md` at the repo root. Its own text: the anatomy line listing the internal layer, the "Where the details live" row (`What belongs in AGENTS.md` → `add-agents-md-style`), any other CLAUDE.md self-reference. `scripts/inventory.js`: target path, variable names, header comments. `scripts/build.js` comment L2031. Run `node scripts/inventory.js` so the generated inventory block lists `add-agents-md-style` (plan-directed edit of a generated block).
  - **Produces:** root context file path `AGENTS.md`
- **F9** [product] — tests reading or naming the root file: `cli/tests/inventory.test.js`, `close-out-hardening.test.js`, `review-no-loops.test.js`, `run-bats.test.js`, `prompt-quality-ruler.test.js`, and comments in `product-close-out-parity.test.js`, `cut-review-and-build-loop-cost.test.js`, `delivery-index.test.js`. Test titles naming "CLAUDE.md" are renamed with them. `cli/` is product, so these are split from F8 and land right after it — they go GREEN only once the root file is renamed.
  - **Consumes:** root context file path `AGENTS.md` (F8)
- **F10** [internal] — workbench sweep, CLAUDE.md → AGENTS.md: `workbench/skills/add-framework--build`, `add-framework--plan`, `add-framework--done` (the inventory item stages `AGENTS.md` alone), `add-framework-internal-layer` (its layer path list and the "not bookkeeping" rule), `add-framework-product-layer`, `add-framework-development`, `add-artefact-graph` ("not visible" row), `add-plan-authoring/SKILL.md` + `references/plan-template.md`, `add-final-report` (block 7 names an AGENTS.md edit), `workbench/agents/plan-readback-agent.md`. Then `npm run setup`.
  - **Consumes:** root context file path `AGENTS.md` (F8)
- **F11** [product] — NEW `cli/tests/agents-md-only.test.js`: the repo-wide gate (L3 below). `npm run build`, `node scripts/inventory.js --check`.

### Does NOT Include (important!)

- `README.md`, `web/` — `add-framework--sync` refreshes them at the next release.
- `~/.claude/CLAUDE.md`, and the `.claude/` provider directory — not context files.
- `CLAUDE.local.md` — personal and gitignored; reported, never migrated.
- Nested CLAUDE.md files in subdirectories of a user's project — the framework never wrote them.
- Historical files: `docs/changelog/`, `docs/deliveries/`, `docs/brainstorming/`, `docs/plans/`.
- A CLAUDE.md fallback in any reader; a CLAUDE.md shim.
- The installer — its prune already removes the renamed skill's old file.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Context file(s) written | AGENTS.md only, no shim | Intent `## Decided` |
| Which legacy files are migrated | **Every** root `CLAUDE.md`, `.claude/CLAUDE.md`, `GEMINI.md` — not only those with a managed block | **Departs from the design** ("only files carrying a framework managed block"). Decided by the user at planning STEP 4: the migration carries every line, so the managed-block filter protected nothing, and it left a hand-written CLAUDE.md hiding AGENTS.md from Claude Code forever |
| Where the migration lives | A script, run by the one skill both writers load | Design decision "lives once, in the renamed skill" holds — the skill owns the procedure; the script makes "no line lost" provable in bats instead of by an agent editing text |
| Merge rule | Contained → carry nothing; otherwise append whole under a heading | Line-level de-duplication mangles markdown (blank lines, `---`); block-level is safe and visible |
| GEMINI.md | Stop generating, migrate | Intent `## Decided` |
| Shell policy | Managed block `codeadd-shell` in AGENTS.md | It used to survive re-runs because STEP 7 rewrote AGENTS.md from scratch; writing in place needs a marker to stay idempotent |
| STEP 7 of `add.wiki` | Kept as "Verify AGENTS.md", no renumbering | Removing it would shift STEP 8/9 and every reference to them |
| Skill name | `add-agents-md-style` | Intent `## Decided` |
| Readers | AGENTS.md, no fallback; `LEGACY_CONTEXT:` signal instead | Intent `## Decided` |
| Installer change | None | Prune at `installer.js` L298 / `updater.js` L158 already removes shipped files the new release drops |
| This repo | `git mv CLAUDE.md AGENTS.md` | Intent `## Decided`; Claude Code here is 2.1.278 and no ancestor CLAUDE.md exists (checked) |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One file, read by all five providers | Claude Code on Bedrock/Vertex/Foundry, pre-2.1.277, telemetry-off or `agents-md`-disabled sessions gets no project instructions |
| No copy step, no drift | AGENTS.md read natively is not listed in Claude Code's `/memory` or `/context` |
| Claude users with a hand-written CLAUDE.md get the framework's content | Their file is deleted after its text is moved into AGENTS.md |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Migration loses user text | Medium | F1 is a script; L1 bats proves every line of every candidate is in AGENTS.md after the run, for all three merge outcomes, and that a second run changes nothing |
| A leftover CLAUDE.md hides AGENTS.md | High (every existing user) | F2/F3/F4 run the migration before every write; F5 signals it; F6 flags it |
| A reader missed by the sweep | Medium | CLAUDE.md is not a graph node; F11's test fails on any unlisted hit |
| Shell policy duplicated on re-run | Medium | F3 managed block; L2 asserts the marker contract in `add.wiki` |
| gitnexus injection breaks when STEP 6 is edited | Low | Global Constraint; L4 asserts `injection-points.json` still carries `graph-contract` for `add.wiki` |
| Another plan in flight (`2026-09-21T001942-PLAN--parallel-tests-in-one-container`) edits `cli/tests/` | Medium | Build branches from latest `main` in its worktree and re-runs the cli suite after any merge from `main` |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/migrate-context-files.sh` | product | create | F1 |
| `framwork/.codeadd/scripts/tests/migrate-context-files.bats` | product | create | F1 |
| `framwork/.codeadd/skills/add-claude-md-style/` → `add-agents-md-style/` | product | rename + modify | F2 |
| `framwork/provider-map.json` | product | modify | F2 (key), F7 (description) |
| `add-doc-schemas/SKILL.md`, `add-token-efficiency/SKILL.md` | product | modify | F2 |
| `cli/tests/build.test.js`, `cli/tests/plain-language-rule.test.js` | product | modify | F2, F3 |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | F3 |
| `add-architecture-discovery/SKILL.md` + 4 analyzers | product | modify | F4 |
| `framwork/.codeadd/scripts/init.sh`, `tests/init.bats`, `commands/add.new.md` | product | modify | F5 |
| `add-health-check/SKILL.md`, `documentation-analyzer.md` | product | modify | F6 |
| 24 reader/mention files listed in F7, `converge-gates.sh`, `delivered.bats` | product | modify | F7 |
| `CLAUDE.md` → `AGENTS.md` (root) | internal | rename + modify | F8 (incl. inventory block) |
| `scripts/inventory.js`, `scripts/build.js` | internal | modify | F8 |
| `cli/tests/inventory.test.js`, `close-out-hardening`, `review-no-loops`, `run-bats`, `prompt-quality-ruler`, `product-close-out-parity`, `cut-review-and-build-loop-cost`, `delivery-index` | product | modify | F9 |
| 10 workbench skills/references + `plan-readback-agent.md` | internal | modify | F10 |
| `cli/tests/agents-md-only.test.js` | product | create | F11 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

No feature or plugin injection map changes: the `graph-contract` anchor stays where it is.

### L1 — Scripts (bats, run targeted: `npm run test:scripts -- <file>`)

1. `migrate-context-files.bats`: (a) CLAUDE.md only → AGENTS.md equals it, CLAUDE.md gone, `MIGRATED:CLAUDE.md:created`; (b) CLAUDE.md + AGENTS.md = copy + shell policy + GEMINI.md = copy → AGENTS.md byte-unchanged, both gone, two `duplicate` lines; (c) hand-written CLAUDE.md + different AGENTS.md → every CLAUDE.md line present in AGENTS.md under `## Migrated from CLAUDE.md`, `appended`; (d) `.claude/CLAUDE.md` handled like (a)/(c); (e) CRLF candidate vs LF AGENTS.md counts as contained; (f) `CLAUDE.local.md` untouched, `LEGACY_LOCAL:` emitted; (g) nothing to do → `CONTEXT_MIGRATION:none`; (h) second run is a no-op. *RED today: the script does not exist.*
2. `init.bats`: AGENTS.md → `ARCH:AGENTS.md`; none → `ARCH:none`; CLAUDE.md alone → `ARCH:none` plus `LEGACY_CONTEXT:CLAUDE.md`; all three legacy files → the list names all three; no legacy file → no `LEGACY_CONTEXT:` line. *RED today: `init.sh` tests CLAUDE.md.*

### L2 — Artefact contracts (vitest)

1. `build.test.js`: provider output contains `add-agents-md-style/SKILL.md` and no `add-claude-md-style`. *RED: old name ships.*
2. `plain-language-rule.test.js`: STEP 6 section is `## STEP 6: Update AGENTS.md`; the Writing Style block is byte-identical in `add-agents-md-style` and `add.wiki`; `add.wiki` names no CLAUDE.md/GEMINI.md copy target; `add-wiki-maintenance` still refuses the context file (AGENTS.md). *RED: heading and copy step exist.*
3. `add.wiki` carries the three managed-block marker pairs `codeadd-wiki`, `codeadd-style`, `codeadd-shell`, and STEP 7 verifies each exactly once. *RED: no `codeadd-shell`.*
4. `inventory.test.js` + the four root-file tests read `AGENTS.md`. *RED: file is CLAUDE.md.*

### L3 — Repo-wide gate (`cli/tests/agents-md-only.test.js`)

1. A case-sensitive search for `CLAUDE.md`, `GEMINI.md` and `claude-md` over `framwork/.codeadd/` (sidecars excluded), `framwork/provider-map.json`, `workbench/`, `scripts/`, `cli/src/`, `cli/tests/` (this test file excluded) and `mcp/` hits only the allowlist: `migrate-context-files.sh` + its bats, `init.sh` + `init.bats`, `add-agents-md-style/SKILL.md`, `add.wiki.md`, `add-health-check/documentation-analyzer.md`, `plain-language-rule.test.js`. Each allowlist entry carries its reason in the test. *RED today: ~60 files hit.*
2. Root `CLAUDE.md` does not exist and root `AGENTS.md` does, carrying the `codeadd-inventory` markers. *RED today.*

### L4 — Behavioural acceptance

1. `npm run build` exits 0, no new warning; `injection-points.json` still lists the `add.wiki` `graph-contract` point.
2. `NODE_OPTIONS= node scripts/graph.js impact add-agents-md-style --depth 1` returns exactly `add.wiki`, `add-architecture-discovery`, `add-doc-schemas`, `add-token-efficiency`; `impact add-claude-md-style` finds no node.
3. `node scripts/inventory.js --check` exits 0 against root AGENTS.md.
4. `npm run setup` rebuilds `.claude/` and `.opencode/` with no reference to the old skill name.
5. `cd cli && npm test` passes (per memory: attribute a failure by running that test alone before blaming the change).

**RED expectations against the current tree:** L1.1, L1.2, L2.1-L2.4, L3.1-L3.2 fail; L4.2 fails (no node).
**GREEN = all levels pass after F1–F11.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [product] → F7 [product] → F8 [internal] → F9 [product] → F10 [internal] → F11 [product]

- **F1 first**: F2-F4 run the script, and its bats is the proof the rest leans on.
- **F2 before F3/F4**: both writers load the renamed skill.
- **F5 before F6**: F6 reads the signal F5 emits.
- **F7 after the writers**: readers change meaning only once something writes AGENTS.md.
- **F8 after all product blocks**: the product build stays green while the root file still has its old name; F8 regenerates the inventory block once, after the rename.
- **F9 right after F8**: the root-file tests go RED at the rename and GREEN here; F8 and F9 are one working boundary.
- **F10 after F8**: workbench text names the file F8 created.
- **F11 last**: its allowlist is only true once every sweep landed.

Every boundary after F2 leaves the repo building and the cli suite green except the tests an F-block is
explicitly rewriting; F8 alone leaves root-file tests red until F9. L3 goes GREEN only at F11.
Per-F-block: F1 and F5 run their bats file; F2, F3, F9 run `cd cli && npm test`.

## Reviewer Handoff

For each F-block the evidence file carries: files touched with the F-block id, the validation levels
covering it and their pass state, and any decision altered with the design section it departs from.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. An L3 allowlist entry with no reason, or one whose file only names CLAUDE.md as a reader — the allowlist is for migration and legacy detection only.
3. The Writing Style block drifting by one byte between `add-agents-md-style` and `add.wiki` during the rename.
4. `migrate-context-files.sh` deleting a candidate before AGENTS.md is written and flushed.
5. A reference to the `.claude/` directory changed by a careless replace — only the filenames change.

## References

- Design set: `docs/brainstorming/2026-09-20T235642-agents-md-only-context-file.md`, `-intent.md`
- Prior art: `2026-09-17T124433-PLAN--build-end-to-end-non-claude` (shell-aware policy block), `2026-09-20T110912-PLAN--workbench-layer` (OpenCode target), `2026-09-08T234054-PLAN--claude-md-inventory-block` (inventory block)

---

## Next Steps

/add-framework--build agents-md-only-context-file

One command executes every F-block, whichever layer each is tagged.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-21 | Initial creation. Migration widened to every root legacy file (user decision at STEP 4); migration implemented as a script owned by the skill |
| 2026-09-21 | Review fix-then-ok: `cli/tests/` edits split from F8 into a new `[product]` F9; test-gate block retagged `[product]` (now F11); workbench sweep renumbered F10; inventory regeneration moved from F2 to F8; `framwork/.codeadd/` prefix added to two F7 citations |
| 2026-09-21 | Implemented in 2a68d4c..acbc259: F1 7a97b70, F2 dd18da0, F3 0fa1417, F4 effcfab, F5 22e68da, F6 5858d57, F7 9b4f788, F8 118834c, F9 e41c4dd, F10 b407eb6, F11 10565e5; review fixes 94f3f23, acbc259. Changelog docs/changelog/2026-09-21T011204-refactor-agents-md-only-context-file.md |
