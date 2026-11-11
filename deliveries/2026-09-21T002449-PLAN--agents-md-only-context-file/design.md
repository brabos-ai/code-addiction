# Brainstorm: AGENTS.md as the only context file

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** architecture

## Objective

AGENTS.md is the only context file the framework writes and reads — in the user's project and in this
repository. No command, skill, script or agent generates, maintains or reads CLAUDE.md (or GEMINI.md)
any more, and all five providers read the same single file.

## Discovery

- **Claude Code v2.1.277** reads `AGENTS.md` (exact case; also `.claude/AGENTS.md`) natively — root,
  ancestors and nested directories. Default precedence: AGENTS.md is read **only when no CLAUDE.md,
  `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above**. `~/.claude/CLAUDE.md`
  does not count. Unavailable on Bedrock, Vertex, Foundry, with telemetry off, with `disableAllHooks`, or
  with the built-in `agents-md` plugin disabled. CLAUDE.md is **not** deprecated. Source:
  https://code.claude.com/docs/en/memory.md and the v2.1.277 CHANGELOG entry.
- **Antigravity** reads AGENTS.md since IDE 1.20.5 and still reads GEMINI.md; on conflict GEMINI.md wins.
  Codex, Cursor and OpenCode already read AGENTS.md. All five providers in `framwork/provider-map.json`
  (`claude`, `codex`, `antigrav`, `opencode`, `cursor`) are therefore covered by AGENTS.md alone.
- `add.wiki` STEP 6 writes CLAUDE.md (two managed blocks: `codeadd-wiki` and `codeadd-style`); STEP 7
  copies it to AGENTS.md (+ Windows shell-policy append) and GEMINI.md (exact copy). AGENTS.md is today a
  derived copy, never the source.
- `add-claude-md-style` owns the context file's format; `add-architecture-discovery` (and its four
  `*-analyzer.md`) writes Technical Spec / Architecture Contract / Validation Gates sections into CLAUDE.md.
- 15 product artefacts READ CLAUDE.md (validation_gates, architecture contract, stack), and 9 more
  MENTION it — 24 named in total, by text search:
  `add.build`, `add.review`, `add.plan`, `add.brainstorm`, `add.hotfix`, `add`, `add-tasks-checklist`,
  `add-backend-development`, `add-frontend-development`, `add-database-development`, `add-code-review`,
  `add-security-audit`, `add-subagent-driven-development`, `conformance-agent`, `readback-agent`, plus
  mentions in `add-ecosystem`, `add-doc-schemas`, `add-token-efficiency`, `add-feature-readback`,
  `add-wiki-maintenance`, `add-project-scaffolding`, `add-skill-creator`, `add.new`, `add.audit`.
  `init.sh` L116 emits `ARCH:CLAUDE.md` / `ARCH:none` (no command consumes the `ARCH:` key);
  `add-health-check/documentation-analyzer.md` validates the file.
- Internal layer: `scripts/inventory.js` writes the generated inventory block into root `CLAUDE.md` only;
  `add-framework--done` runs it and commits `CLAUDE.md`. Most workbench skills name CLAUDE.md
  (`add-framework--build`, `--plan`, `--done`, `add-framework-internal-layer`, `-product-layer`,
  `-development`, `add-artefact-graph`, `add-plan-authoring` + `plan-template.md`, `add-final-report`,
  `plan-readback-agent`). The repo has no AGENTS.md — already a gap since PR #79 added `.opencode/`,
  whose runtime reads AGENTS.md.
- Plans: `2026-09-17T124433-PLAN--build-end-to-end-non-claude` (made the AGENTS.md shell-policy append
  shell-aware — that block moves, it is not dropped); `2026-09-20T110912-PLAN--workbench-layer` (gave the
  internal layer a second provider without touching `inventory.js`). No delivery-index entry for any of
  these names: this is new territory.

## Context & Motivation

Claude Code, the last of the five providers that needed CLAUDE.md, now reads AGENTS.md directly. The
framework still writes CLAUDE.md as the source and copies it twice, so every user project carries three
files that must stay equal, and every reader in the framework is hard-wired to the Claude-specific name.
Reducing to one file removes the copy step, the drift between copies, and the Claude-centric naming in a
framework that ships to five providers.

## Problem / Opportunity

- Three context files per user project (CLAUDE.md, AGENTS.md, GEMINI.md) for content that is one file.
- A **stale** CLAUDE.md actively hides AGENTS.md from Claude Code, and a stale GEMINI.md overrides
  AGENTS.md in Antigravity — so simply "stop generating" is not enough; leftovers must be migrated away.
- This repository's own context lives in CLAUDE.md, which OpenCode (now a workbench target) does not read.

## Proposed Solution

| Option | Description | Verdict |
|---|---|---|
| A. AGENTS.md only, migrate and delete legacy files | Writers target AGENTS.md; on first run they fold any framework-managed CLAUDE.md / GEMINI.md into AGENTS.md and delete them | **Chosen** |
| B. AGENTS.md + one-line `@AGENTS.md` CLAUDE.md shim | Covers Bedrock/Vertex/Foundry and old Claude Code versions | Rejected by the user: the goal is no CLAUDE.md at all |
| C. AGENTS.md only, leave legacy files in place | Least code | Rejected: a leftover CLAUDE.md makes Claude Code ignore AGENTS.md silently |

Mechanism of A:

1. **Writers** — `add.wiki` and `add-architecture-discovery` write straight into AGENTS.md. `add.wiki`
   STEP 7 (copy to AGENTS.md/GEMINI.md) disappears; the Windows shell-policy block is written directly
   into AGENTS.md, keeping its current shell-aware form. Both managed blocks (`codeadd-wiki`,
   `codeadd-style`) live in AGENTS.md, once each.
2. **Migration** — owned by ONE place, the renamed `add-agents-md-style` skill, which both writers
   already load. When a CLAUDE.md or GEMINI.md exists at the project root carrying a framework managed
   block: regenerate the managed blocks in AGENTS.md, carry every line outside the managed blocks (the
   user's hand-written text) into AGENTS.md, delete the legacy file, and name it in the command's report.
   A legacy file **without** any framework managed block is not the framework's: it is left in place and
   reported, with the note that Claude Code ignores AGENTS.md while it exists.
3. **Readers** — every reader reads AGENTS.md. **No fallback to CLAUDE.md.**
4. **Detection** — `init.sh` detects AGENTS.md (`ARCH:AGENTS.md` / `ARCH:none`) and, when a CLAUDE.md or
   GEMINI.md is present, emits a separate legacy signal so callers can suggest `add.wiki` to migrate.
   The exact key name is the plan's to choose; it must be covered in `init.bats`.
5. **Validation** — `add-health-check`'s documentation analyzer validates AGENTS.md and raises a finding
   for a leftover CLAUDE.md or GEMINI.md.
6. **Rename** — `add-claude-md-style` → `add-agents-md-style`, with the full rename sweep
   (provider-map, graph, every caller, this repo's context file's "Where the details live" table).
7. **Internal layer** — `git mv CLAUDE.md AGENTS.md`; `scripts/inventory.js` targets AGENTS.md;
   `add-framework--done` commits AGENTS.md; every workbench skill, agent and `cli/tests/` assertion that
   names CLAUDE.md names AGENTS.md; `add-artefact-graph`'s "not visible" row is renamed.

## Type of Artefact

architecture — changes the context file every writer and reader in both layers depends on, plus one
skill rename and one script-signal change.

## Scope

### Includes
- `add.wiki`: write AGENTS.md directly; drop the CLAUDE.md→AGENTS.md/GEMINI.md copy step; run migration.
- `add-architecture-discovery` and its four analyzers: target AGENTS.md; run migration.
- Rename `add-claude-md-style` → `add-agents-md-style`; it owns format rules and the migration procedure.
- Every product reader listed in Discovery: read AGENTS.md.
- Every product artefact that only MENTIONS CLAUDE.md (the 9 in Discovery): name AGENTS.md.
- `init.sh` + `init.bats`: detect AGENTS.md, emit the legacy-file signal.
- `add-health-check` documentation analyzer: validate AGENTS.md, flag leftovers.
- Internal: `git mv CLAUDE.md AGENTS.md`, `scripts/inventory.js`, `add-framework--done` staging line,
  every workbench skill/agent/template naming CLAUDE.md, `cli/tests/*` that assert on it, `scripts/build.js`
  comment L2031.
- Verification that the installer removes the old `add-claude-md-style` directory from an installed
  project on update (the plan checks this; if it does not, the plan adds the removal).

### Does NOT Include
- `README.md` and `web/` — refreshed by `add-framework--sync` at the next release.
- The user's personal `~/.claude/CLAUDE.md` — never touched.
- Historical files: `docs/changelog/`, `docs/deliveries/`, `docs/brainstorming/`, `docs/plans/`.
- A CLAUDE.md shim (`@AGENTS.md`) — explicitly rejected.
- Any fallback read of CLAUDE.md by a reader.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| AGENTS.md only, no CLAUDE.md shim | "no artefact generates CLAUDE.md" | The user accepts losing Bedrock/Vertex/Foundry and pre-2.1.277 Claude Code in exchange for one file | ✅ |
| Migrate framework-managed CLAUDE.md into AGENTS.md, then delete it | "all providers read the same file" | A leftover CLAUDE.md silently makes Claude Code ignore AGENTS.md | ✅ |
| Stop generating GEMINI.md and migrate it the same way | "all providers read the same file" | Antigravity reads AGENTS.md since 1.20.5; a stale GEMINI.md would override it | ✅ |
| Only files carrying a framework managed block are migrated and deleted | "writes and reads" — the framework acts only on what it owns | Deleting a file the user wrote by hand is destructive and not the framework's call | ✅ |
| Migration procedure lives once, in `add-agents-md-style` | "no artefact maintains CLAUDE.md" — one place to remove it from later | Two writers carrying their own copy is how they drift | ✅ |
| Rename `add-claude-md-style` → `add-agents-md-style` | "no artefact … CLAUDE.md" | A name naming the wrong file misleads every future reader | ✅ |
| Readers get no CLAUDE.md fallback | "no artefact reads CLAUDE.md" | Existing installs already have an AGENTS.md copy from `add.wiki`; the legacy signal covers the rest | ✅ |
| Shell-policy block written directly into AGENTS.md | "writes … AGENTS.md" | It already lives only in AGENTS.md; only the copy step around it goes | ✅ |
| This repo: `git mv CLAUDE.md AGENTS.md` | "in this repository" | Also closes the gap left by PR #79's `.opencode/` target | ✅ |

## Ecosystem Impact

Layer column feeds the planner's F-block tags. `Called by` for artefacts that are graph nodes comes from
`node scripts/graph.js impact <name> --depth 1`. **CLAUDE.md itself is not a graph node**
(`add-artefact-graph`, "What the Graph Cannot See"), so "who reads CLAUDE.md" is NOT VERIFIED by the graph —
the reader list in Discovery is a text search, labelled as such, and the plan must re-sweep with grep.

| Component | Layer | Called by | Impact | Action |
|-----------|-------|-----------|--------|--------|
| `add-claude-md-style` | product | `add.wiki`, `add-architecture-discovery`, `add-doc-schemas`, `add-token-efficiency` (graph, depth 1) | Renamed; gains migration procedure | Rename + rewrite for AGENTS.md; update all 4 callers and provider-map |
| `add.wiki` | product | 16 HANDS_OFF_TO dependants (graph, depth 1) incl. gitnexus fragment `plugins/gitnexus/fragments/add.wiki.md` — fragment has no CLAUDE.md/GEMINI.md/AGENTS.md text (grep) | STEP 6/7 rewritten | Write AGENTS.md, drop copy step, run migration; verify injection anchors survive |
| `add-architecture-discovery` (+4 analyzers) | product | `architecture-agent`, `system-design-agent`, `add.wiki`, `add-claude-md-style`, `add-tasks-checklist` (graph, depth 1) | Write target changes | Target AGENTS.md; run migration |
| `init.sh` / `init.bats` | product | `add.new`, `add-feature-discovery` (graph, depth 1). `ARCH:` key read by no command (grep) | Detection changes | Detect AGENTS.md; add legacy signal; tests |
| `add-health-check/documentation-analyzer.md` | product | NOT VERIFIED (sub-document, not a node; dispatched under `add.audit`) | Validation target changes | Validate AGENTS.md; flag leftovers |
| 15 reader artefacts (Discovery list) | product | NOT VERIFIED — CLAUDE.md is not a node | Read path changes | Replace CLAUDE.md with AGENTS.md |
| 9 mention-only artefacts (Discovery list) | product | NOT VERIFIED — CLAUDE.md is not a node | Text references | Name AGENTS.md — required for the final grep check to pass |
| Installer (`cli/src/installer.js`) | product | NOT VERIFIED — not a node | Old skill dir may linger | Verify stale-skill removal; add if missing |
| Root `CLAUDE.md` → `AGENTS.md` | internal | NOT VERIFIED — not a node | Renamed | `git mv` |
| `scripts/inventory.js` + `cli/tests/inventory.test.js` | internal | `add-framework--done` (text); not a node | Target changes | Write AGENTS.md |
| `add-framework--done` | internal | graph: workbench stage chain | Stages/commits the context file | `git add AGENTS.md` |
| Workbench skills/agents/templates naming CLAUDE.md | internal | NOT VERIFIED for the file reference — not a node | Text references | Rename references |
| `add-artefact-graph` "not visible" row | internal | — | Row names CLAUDE.md | Rename to AGENTS.md |
| `cli/tests/*.test.js` naming CLAUDE.md (9 files) | internal | not nodes | Assertions on the filename | Update |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| One context file per project, read by all five providers | Claude Code on Bedrock/Vertex/Foundry, pre-2.1.277, telemetry-off or `agents-md`-plugin-disabled sessions get no project instructions |
| No copy step, no drift between three files | AGENTS.md read natively does not show in Claude Code's `/memory` or `/context` |
| Provider-neutral naming across the framework | A wide, mechanical rename sweep in both layers |
| This repo becomes drivable from OpenCode with its context | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A stale CLAUDE.md in a user project hides AGENTS.md | High (every existing user) | Migration in both writers + `init.sh` legacy signal + health-check finding |
| Migration deletes user-written text | Med | Carry every line outside the managed blocks into AGENTS.md before deleting; only files carrying a managed block are touched |
| Installer leaves `add-claude-md-style` behind | Med | Plan verifies installer behaviour; adds removal if missing |
| A reader missed by the sweep keeps reading CLAUDE.md | Med | CLAUDE.md is invisible to the graph — plan ends with a repo-wide grep for `CLAUDE.md` / `GEMINI.md` in `framwork/.codeadd/`, `workbench/`, `scripts/`, `cli/` whose only hits are the migration procedure and legacy detection |
| Injection anchors in `add.wiki` break when STEP 7 is removed | Low | Build regenerates `injection-points.json`; cli tests cover anchors |

## Next Steps

Run: `/add-framework--plan agents-md-only-context-file`
