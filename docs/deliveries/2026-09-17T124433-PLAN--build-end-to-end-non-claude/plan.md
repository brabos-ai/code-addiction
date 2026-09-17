# Plan: Build End-to-End on Non-Claude — three fixes that halt /add.build outside Claude

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-17
> **Delivery:** automatic

---

## Objective

[from conversation, no design document] `/add.build` runs development from start to end and stops only
at the PR question, on OpenCode with a non-Claude model on Windows — the shell policy `add.wiki` writes,
`build-setup.sh` on a resumed build, and the `model` pinned on agents no longer break it.

**When this build is done:** a user on OpenCode + Grok on Windows can resume a build with uncommitted
work on the feature branch, dispatch every subagent on the session model, and run `.codeadd/scripts/*.sh`
through the shell policy their AGENTS.md carries, without a manual rerun of `/add.build`.

## Context

A user ran `/add.build` over a four-subfeature epic on OpenCode + Grok 4.6 on Windows and hit three
failures, each of which halted the delivery.

**Every decision here was taken in the document below. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-17T124342-build-end-to-end-non-claude-intent.md` | Path `bounded`, delivery `automatic`, the six closed decisions, the callers checked on the graph, `## Open: None` |

## Global Constraints

- `build-setup.sh` exit code 5 keeps its meaning: dirty tracked working tree, in-place mode (script header, `framwork/.codeadd/scripts/build-setup.sh`)
- `add.build` STEP 2 keeps stopping on any non-zero `build-setup.sh` exit (intent file, `## Decided`)
- The claude agent dialect keeps its verbatim `model` passthrough (`docs/deliveries/2026-09-13T100745-PLAN--readonly-agent-dispatch-capability/plan.md` F6)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)

## Problem

1. **Shell policy is PowerShell-only** — `add.wiki` STEP 7.2 appends `& "<bash.exe>" -lc "<command>"` to AGENTS.md. `&` is PowerShell's call operator; OpenCode's shell tool is already bash, so every script call fails with `syntax error near unexpected token '&'`.
2. **Claude model names ship to other providers** — `AGENT_DIALECTS.opencode`, `.cursor` and `.codex` in `scripts/build.js` copy `model: sonnet|haiku|inherit` from the source agent. Those names do not exist outside Claude, so a subagent dispatch on Grok fails.
3. **A resumed build halts at setup** — `build-setup.sh` exits 5 on tracked modifications even when the current branch already is the feature branch. No checkout happens in that state, yet `add.build` STEP 2 stops and the user must commit and rerun.

## Proposal

Fix each at its source. The script learns that the dirty guard only protects a branch switch. The
three non-Claude dialects stop emitting `model`, so each provider falls back to the session model. The
shell policy names both cases: bash runs the command directly, PowerShell uses the call operator.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/build-setup.sh` + `framwork/.codeadd/scripts/tests/build-setup.bats`: the dirty-tree guard (section 5) runs only when `CURRENT` differs from `BRANCH`. Header comment for exit 5 states the condition. New bats case: on the feature branch with a tracked modification → exit 0, `STATE:current`. Must NOT lose: the existing "dirty tracked tree exits 5" case (off the branch) and "untracked-only tree is allowed". Note `BRANCH` must be resolved before the guard — reorder only if it is not.
- **F2** [internal] — `scripts/build.js` `AGENT_DIALECTS`: `opencode`, `cursor` and `codex` stop emitting `model`. Must NOT lose: `mode: subagent` and the read-only `permission` map on opencode, `readonly: true` on cursor, `developer_instructions` on codex, and the claude dialect's passthrough untouched. Update the dialect block comment so its per-provider field list no longer names `model` for those three.
- **F3** [product] — `cli/tests/build.test.js`: one test calling `AGENT_DIALECTS.opencode`, `.cursor` and `.codex` with a source carrying `model: sonnet`, asserting no output contains a `model` key; the existing `the claude dialect preserves the source frontmatter` test stays as the claude side.
- **F4** [product] — `framwork/.codeadd/commands/add.wiki.md` STEP 7.2: both shell-policy templates (path detected / not detected) become shell-aware — when the tool's shell is already bash (Git Bash, MSYS, OpenCode), run `bash .codeadd/scripts/<name>.sh` directly; only from PowerShell use `& "<bash.exe>" -lc "<command>"`. Keep "Do not use WSL bash directly". Must NOT lose: the OS detection, the fallback path list, the copy rules for GEMINI.md/AGENTS.md, and the managed-block verification that follows.

### Does NOT Include (important!)

- The `> **MODEL:** Use haiku model` line in `add.pull-request.md` — guidance text, breaks nothing
- Repairing AGENTS.md already written in user projects — the user reruns `/add.wiki` after release
- The stale tracked `framwork/.agent/skills/add.wiki/SKILL.md` — an old build output, separate cleanup
- Any change to `add.build` STEP 2's gate

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Shell policy | Shell-aware, both forms named | Intent file — keeps PowerShell hosts (Codex) off WSL bash |
| Where `model` goes | Dropped on opencode/cursor/codex, kept on claude | Intent file — names are Claude-only; Claude keeps cheap subagents |
| When the dirty guard applies | Only when a checkout will happen | Intent file — on the branch nothing can leak |
| `add.build` STEP 2 gate | Unchanged | Intent file — the script was wrong, not the gate |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| On opencode/cursor/codex every subagent now runs on the session model — no cheaper model can be pinned, so a long build costs more there | High | Accepted (Validated Decisions): a pinned Claude name fails outright on those providers, which is worse than cost. Provider-native pinning is a separate request |
| Relaxing the guard lets a resumed build start on top of unrelated tracked edits sitting on the feature branch | Low | The branch is the feature's own, so those edits belong to it; off-branch the guard still exits 5 (L1.2) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/build-setup.sh` | product | modify | F1 |
| `framwork/.codeadd/scripts/tests/build-setup.bats` | product | modify | F1 |
| `scripts/build.js` | internal | modify | F2 |
| `cli/tests/build.test.js` | product | modify | F3 |
| `framwork/.codeadd/commands/add.wiki.md` | product | modify | F4 |

Callers (graph, depth 1): `build-setup.sh` ← add.build, add-doc-schemas, add-id-convention (HIGH by count; the change only relaxes one exit). `add.wiki` ← 16 dependants, none reads STEP 7.2's text, gitnexus fragment included. `scripts/build.js` is not a graph node — NOT VERIFIED; its dialect output is read by `cli/tests/build.test.js` and `cli/tests/agent-capability.test.js`.

---

## Validation Matrix (spec for the build phase)

### L1 — Script (RED → GREEN)

1. bats: feature branch checked out, tracked file modified → `build-setup.sh 0042F` exits 0 with `STATE:current`. *RED today: exits 5.*
2. bats: existing "dirty tracked tree exits 5" (off the branch) still passes.

### L2 — Build dialects (RED → GREEN)

1. vitest: opencode, cursor and codex dialect outputs contain no `model` key for a source with `model: sonnet`. *RED today: all three emit it.*
2. vitest: `the claude dialect preserves the source frontmatter` still sees `model: sonnet`.
3. `node scripts/build.js` exits 0; `framwork/.opencode/agents/fix-agent.md` has no `model:` line.

### L3 — Command text

1. `add.wiki.md` STEP 7.2: both templates carry the bash-direct form and the PowerShell `&` form, each labelled with its shell; `node scripts/build.js` emits no new warning.

### L4 — Behavioural acceptance

1. Running the bash-direct command form from the policy inside Git Bash (`bash .codeadd/scripts/status.sh` form) parses; the old `& "..." -lc` form fails there — i.e. the policy no longer hands bash a PowerShell line.

**RED expectations against the current tree:** L1.1 and L2.1 fail. **GREEN = all levels pass after F1–F4.**

---

## Execution Order

F1 → F2 → F3 → F4. The four are independent; the order goes from the failure that halts a build to the
one that only affects the next `/add.wiki`. Every boundary leaves the repo working. F2 and F3 may land
as one commit only if the ledger records why; otherwise one commit per F-block.

Run `npm run test:scripts` only for `build-setup.bats` (the full bats suite is slow); run the targeted
vitest files for F3.

## Reviewer Handoff

1. L1.1 and L2.1 were observed RED before the fix.
2. F2 did not touch the claude dialect's passthrough, and opencode's read-only `permission` map still emits.

---

## Next Steps

/add-framework--build build-end-to-end-non-claude

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-17 | Initial creation |
| 2026-09-17 | Review fix-then-ok: add.wiki dependants corrected to 16; Risks section added (session-model cost on non-Claude providers) |
| 2026-09-17 | Implemented: F1 5e6c30f, F2 adf7607, F3 81183bf, F4 4eba749, F5 55f3608 (audit follow-up) |
