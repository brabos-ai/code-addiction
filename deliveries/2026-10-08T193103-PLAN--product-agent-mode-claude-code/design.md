# Brainstorm: Product Agent Mode for Claude Code

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-10-08
> **Type:** product
> **Ticket:** 0031B

## Objective

A bot (CI, a script or another agent) can run any command of the installed codeadd in Claude Code with nobody watching: it gets a JSON result validated by a schema it passes itself, it knows when the command stopped waiting for approval and resumes it with `--resume`, and a short guide — present in every installation and pointed to by `AGENTS.md` — explains how.

## Discovery

- **Workbench agent mode (0028B → 0030B → 0029B)** — the internal layer already has this. Its final form is one contract file (`workbench/skills/add-final-report/references/result-block.schema.json`, 12 required keys, `additionalProperties: false`), one call doc (`result-block.md`: `claude -p --output-format json --json-schema "<text>"`, `.structured_output`, `.session_id`, `--resume`, the PowerShell 5.1 escape) and no JSON instruction in any prompt, enforced by a test.
- **Plan `2026-10-07T192430-PLAN--agent-friendly-workbench` (0028B)** — the prompt-driven result block. Removed by 0030B before release. This design does not repeat it.
- **Plan `2026-10-08T155700-PLAN--workbench-run-safety` (0029B)** — `needs-approval` is carried only by the schema's `status` description; no checkpoint marker in any prompt. Proved by a real headless run with `--resume`.
- **`add--delivery-mode`** — already classifies every product stop as deciding or confirming. A deciding stop is what `needs-approval` describes; no new marker is needed.
- **`add-wiki`** — the only writer of the installed `AGENTS.md`. Writes three managed blocks with `[//]: # (...)` markers; the `codeadd-shell` "Runtime policy" block already points at `.codeadd/scripts/` by literal path.
- **`add--ecosystem`** — owns command order for the `/add` gateway. It is a skill, loaded only inside a command, at a provider-specific path; an external bot cannot rely on reaching it.
- **Release packaging** — `release.yml` zips an explicit list of `.codeadd/` subdirectories; `cli/src/release-copy.js` installs everything under `framwork/.codeadd` from the zip, on both install and update. A new `.codeadd/` subdirectory needs one line in `release.yml` and no CLI change.
- **Delivery index** — no `gone` or `superseded` entry for any artefact this design touches.

## Context & Motivation

The workbench can be driven headless; the product cannot. A user who wants to run `add-plan`, `add-build` or `add-done` from CI or from another agent today has to parse the seven-block prose report and guess whether a run stopped on purpose, failed or is waiting for an answer. The workbench solved this without touching any prompt, by letting Claude Code validate the output against a schema the caller passes. The same mechanism works for the product with no prompt change, so the cost is a contract file, a guide and one pointer.

## Problem / Opportunity

- No product schema exists, so a headless caller has nothing to pass to `--json-schema`.
- No document tells a bot how to call, how to read the result, or how to continue a stopped run.
- The installed `AGENTS.md` — the one file every agent session reads — says nothing about headless use.

## Proposed Solution

**Recommended:** a new installation directory `framwork/.codeadd/agent-mode/`, shipped as `.codeadd/agent-mode/` in every install and update, holding two files:

- `result.schema.json` — the product result schema. Same 12 keys, types and `status` enum as the workbench schema; only the descriptions change to speak of the product (`stage` example `add-build`; `ticket` is `null` when the `board` feature is off or the command made no board write; `ci` is `null` when the command did not read CI).
- `README.md` — the bot guide: how to call (bash and PowerShell), how to resume, the stop rule in one sentence, the main flows one line each, and "Claude Code only for now".

`add-wiki`'s `codeadd-shell` managed block gains one line pointing headless callers at `.codeadd/agent-mode/README.md`.

**Alternatives rejected:**

| Alternative | Why not |
|---|---|
| Schema under `skills/add--final-report/references/`, as in the workbench | A skill's installed path differs per provider (`.claude/skills/…`, `.agents/skills/…`); `.codeadd/` is the one provider-independent path, which is why `scripts/` and `templates/` already live there |
| A slimmer product schema without `ci` and `ticket` | Two result formats for one bot to handle; `ticket` matters to board users |
| The product schema as the single source, read by the workbench | Crosses the layers; the workbench reads `workbench/…`, the user reads `.codeadd/agent-mode/…` |
| A line in `add--delivery-mode` mapping deciding stops to `needs-approval` | The start of the 0028B prompt-driven block that 0030B removed; the schema description already carries the meaning |
| A new `codeadd-agent-mode` managed block | Three new marker sites and more of the 150-line budget, for one line that fits the existing Runtime policy block |
| A per-command table of stops in the guide | ~40 stops over 14 commands; it drifts on the next edit of any command and no test can hold it |

## Type of Artefact

product — an installation directory with a JSON contract and a guide, plus one line in an existing command.

## Scope

### Includes

- `framwork/.codeadd/agent-mode/result.schema.json` — the product schema, as described above. **[product]**
- `framwork/.codeadd/agent-mode/README.md` — the bot guide with exactly five parts: (1) the call in bash and PowerShell (`--output-format json`, `--json-schema` takes the schema TEXT not a path, `.structured_output`, the PowerShell 5.1 `-replace '"','\"'` escape); (2) resume (`.session_id`, `--resume <id>`, `-c` caveat, `--json-schema` again on every call); (3) the stop rule — every stop that waits on a decision returns `needs-approval`, and `add-done` always stops before the merge; (4) the main flows, one line each (feature, hotfix, brainstorm); (5) "Claude Code only for now". It states that Claude Code itself validates against the schema, and that a bot reads `status` (`needs_approval` mirrors it). **[product]**
- `framwork/.codeadd/commands/add-wiki.md` — one line added to the `codeadd-shell` block in STEP add-wiki.resolve-shell-policy, verbatim: `Headless callers (claude -p): read .codeadd/agent-mode/README.md.` It carries neither `json-schema` nor `result block`. Marker names and the add-wiki verification list are unchanged — they check markers, not the block body. **[product]**
- `.github/workflows/release.yml` — `.codeadd/agent-mode` added to the `for subdir in .codeadd/scripts .codeadd/fragments …` list in the "Package framework zip" step. Without it the `[ -d ]` loop ships nothing and nothing fails. **[internal]**
- Tests, in the suites `scripts/run-tests.js` already dispatches. **[internal]**
  - `.codeadd/agent-mode` joins the required list in the existing `cli/tests/release-packaging.test.js` test "ships every post-install runtime .codeadd/* dir".
  - A new `cli/tests/agent-mode.test.js`: the schema parses as JSON; its `required` array, `properties` key sets (nested included), `type`s and every `enum` equal the workbench schema's — descriptions are not compared; one sample object per `status` value validates against it; every `/add-*` command named in the guide exists in `framwork/provider-map.json`; the `codeadd-shell` block in `add-wiki.md` contains `.codeadd/agent-mode/README.md`.
  - The same file scans `framwork/.codeadd/commands/`, `skills/` and `agents/` sources — and nothing else: not `agent-mode/`, not fragments, not built provider output — and fails on `json-schema` or `result block`.
- `AGENTS.md` — one sentence in the prose of `### Product Layer — framwork/.codeadd/`, above the generated inventory block, naming `.codeadd/agent-mode/` (the headless guide and result schema). `scripts/inventory.js` and the generated block are unchanged. **[internal]**
- A manual headless smoke during the build, not part of CI, needing a logged-in `claude`: run `node scripts/build.js`, copy `framwork/.codeadd/` and `framwork/.claude/` into a temporary git project (what `copyFromZip` does from the zip), then run `claude -p "/add-brainstorm <small topic>" --output-format json --json-schema "<schema text>"` — its first clarifying question is a deciding stop — and check `.structured_output.status` is `needs-approval`; answer with `--resume <session_id>` and the schema again, and check the second result validates. One attempt; a mismatch is a hard stop.

### Does NOT Include

- The test-loss guard for the product `add-build` and `add-done` — ticket **0032B**.
- Codex, Cursor, Antigravity, OpenCode and ZCode — separate tickets.
- Any change to a command, skill or agent prompt beyond the one `add-wiki` line. No checkpoint marker, no output instruction.
- A shipped validator script — Claude Code validates against the schema it receives.
- A CLI migration that edits the user's `AGENTS.md` — the installer never touches it.
- A plan-less fix track — the product already has `add-hotfix`.
- Changes to `add--ecosystem`, `add--delivery-mode` or `add--final-report`.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| The schema applies to any command, not only build and done | "run any command" | The caller passes it; nothing in a command decides whether it applies | ✅ |
| Guide and schema live together in `.codeadd/agent-mode/` | "present in every installation" | The one provider-independent installed path; install and update already copy all of `.codeadd/` from the zip | ✅ |
| Same 12 keys, types and enums as the workbench schema, product descriptions, held equal by a test | "a JSON result validated by a schema" | One format for a bot on either side; the test stops drift, as `cli/tests/mcp-engine.test.js` does for `graph.js` and `mcp/engine.mjs` | ✅ |
| `needs-approval` is carried by the schema's `status` description only | "knows when the command stopped waiting for approval" | 0029B proved it headless; 0030B forbids output instructions in prompts | ✅ |
| The guide states one stop rule and the main flows, not a per-stop table; a test checks every named command exists | "a short guide explains how" | A per-stop table drifts unnoticed; one rule plus a name check does not | ✅ |
| The `AGENTS.md` pointer is one line in the existing `codeadd-shell` block | "pointed to by `AGENTS.md`" | That block already tells agents how to run the framework, by literal `.codeadd/` path; no new marker | ✅ |
| Existing installs get the guide on `codeadd update` and the pointer on the next `/add-wiki`; the release notes say so | "present in every installation" | The installer does not touch the user's `AGENTS.md` | ✅ |
| No shipped validator | "a JSON result validated by a schema" | `--json-schema` already validates; a script would repeat it | ✅ |
| Proof includes one real headless run with `--resume` | "resumes it with `--resume`" | Only a real run shows Claude Code returns `needs-approval` on a product command | ✅ |
| The test-loss guard moves to 0032B | — not part of this objective | It is a run-safety gate, not part of driving a command headless | ✅ |

## Layers

| Artefact | Layer |
|---|---|
| `framwork/.codeadd/agent-mode/result.schema.json`, `README.md` | product |
| `framwork/.codeadd/commands/add-wiki.md` | product |
| `.github/workflows/release.yml`, tests, `AGENTS.md` | internal |

## Ecosystem Impact

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `add-wiki` (command) | `impact --depth 1`: conformance-agent, add-build, add-diagnose, add-done, add-hotfix, add-new, add-plan, add-review, add--agents-md-style, add--architecture-discovery, add--knowledge-discovery, add--project-scaffolding, add--resource-path-convention, add--tasks-checklist, add--wiki-maintenance (all HANDS_OFF_TO); fragment `plugins/gitnexus/fragments/add-wiki.md` (INJECTS_INTO). The fragment's own dependencies do not touch STEP add-wiki.resolve-shell-policy | One more line inside a verbatim managed block; marker names and verification list unchanged | Add the line |
| `add--agents-md-style` (skill) | `impact --depth 1`: add-wiki, add--architecture-discovery, add--doc-schemas, add--token-efficiency | Its Runtime Policy section says the block text lives in add-wiki; the 150-line budget absorbs one line | none |
| `framwork/.codeadd/agent-mode/*` (new) | NOT VERIFIED — not a graph node (a `.json` and a directory outside commands/skills/agents/scripts/fragments/plugins/templates). Its readers are external bots and the `AGENTS.md` line | New | Create |
| `.github/workflows/release.yml` | NOT VERIFIED — not a graph node | One more packaged directory | Add `.codeadd/agent-mode` to `DIRS` |
| `workbench/skills/add-final-report/references/result-block.schema.json` | NOT VERIFIED — `.json`, not a graph node | Read by the new equality test; unchanged | none |
| `AGENTS.md` | NOT VERIFIED — not a graph node | Product-layer anatomy gains one line | Add the line |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Headless use of every installed command with a validated result | A second schema file, held equal to the workbench's by a test |
| No prompt change, so no prompt drift | The guide's stop rule is one sentence; a bot learns a specific stop only from `reason` |
| One provider-independent path for future provider tickets | A new `.codeadd/` subdirectory that `release.yml` must list |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A product command does not return `needs-approval` at a stop under `-p` | Med | The headless smoke runs a stopping command and resumes it; a mismatch hard-stops the build |
| `release.yml` stops packaging `agent-mode` in a later edit | Low | Test asserts the `DIRS` entry |
| The two schemas drift | Low | Equality test on keys and enums |
| A command renamed later leaves a stale name in the guide | Low | Test checks every named command exists |
| Users on an old `AGENTS.md` never see the pointer | Med | The guide exists after `codeadd update` regardless; release notes tell them to run `/add-wiki` |
| `codeadd update` prunes or skips `agent-mode/` | Low | `copyFromZip` copies every entry under `framwork/.codeadd`; the prune removes only files absent from the new manifest, and `agent-mode/` files are in it; `PRESERVE_PATTERNS` does not match them. No new check |

## Next Steps

Run: `/add-framework--plan docs/brainstorming/2026-10-08T191240-product-agent-mode-claude-code.md`
