# Plan: Internal Layer Reconciliation after Plan 0070

> **Status:** implemented
> **Scope:** cross-cutting (map + command + skill)
> **Created:** 2026-08-24

---

## Context

Plan 0070 collapsed `add.qa` and `add.test` into their neighbours, replaced `add.autopilot` with `add.plan-to-ready`, and extended the agents strategy to four providers with a TOML emitter for Codex. `/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/` by design, so the internal layer still describes the pre-0070 world.

`CLAUDE.md` is loaded into **every session in this repository**. A stale count or a false invariant there does not fail a test — it silently misinforms every future piece of work. That is the whole cost being paid down here.

Reading the file to scope this plan surfaced **two defects that plan 0070 did not cause** and that no test covers:

1. **Line 97 contradicts line 150.** Line 97 says `extractContract()` derives `{ version, shape, recipes, paths }` and describes a third build gate for "a declared version with no matching `## vN` section in its recipe file, or a hole in the `1..N` chain". Line 150 says "There is no version integer and no recipe chain." `scripts/build.js:486-489` confirms line 150 — the return is `{ contract, shape, paths }`, and only two gates exist. This is drift from plan 0068, which removed the version/recipe mechanism but left the earlier description in place.
2. **Line 150 routes to `/add.qa`**, a command 0070 deleted.

Both are in scope by explicit decision (see *Validated Decisions*).

## Current State

| Artefact | Line | States today | Reality after 0070 |
|---|---|---|---|
| `CLAUDE.md` | 15 | Commands: `18` | `16` |
| `CLAUDE.md` | 17 | Agents: `15` | `17` |
| `CLAUDE.md` | 93 | Agents row: `Passthrough` / `None` | Per-provider frontmatter dialect; `MD or TOML` |
| `CLAUDE.md` | 95 | "All providers use markdown (the build is markdown-only)" | False — Codex agents emit TOML |
| `CLAUDE.md` | 97 | `{ version, shape, recipes, paths }` + a version/recipe gate | `{ contract, shape, paths }` + two gates (**pre-existing drift from 0068**) |
| `CLAUDE.md` | 111 | "Agents only build for providers with an `agents` pattern (currently only claude)" | claude, cursor, opencode, codex — antigrav deliberately deferred |
| `CLAUDE.md` | 134-135 | Feature `tdd`; `qa-pipeline` affects `add.plan, add.test, add.build` | `tdd-pipeline`; `add.plan, add.build` |
| `CLAUDE.md` | 150 | Hard gate "in `/add.qa` preflight" | The preflight lives in `/add.review` |
| `.claude/commands/add-framework--sync.md` | 160 | Main flow lists `add.test`, `add.autopilot` | `add.plan-to-ready`; the other two are gone |
| `.claude/skills/add-framework-development/SKILL.md` | 206 | `--yolo` supported by "`add.review` and `add.autopilot` (which forwards it)" | Only `add.review`. `/add.plan-to-ready` deliberately does **not** inherit it |
| `.opencode/commands/add-framework--sync.md` | 165 | mirror of the above | same edit |
| `.opencode/skills/add-framework-development/SKILL.md` | 206 | mirror of the above | same edit |

**Mirror relationship.** `.opencode/` is an adapter of `.claude/`: identical body, different frontmatter (`description:` block, `> **INPUT:** $ARGUMENTS`) and self-referential paths (`.opencode/skills/` instead of `.claude/skills/`). Line numbers differ by the frontmatter offset. Every edit below is listed twice for exactly this reason.

## Proposed Changes

### A. `CLAUDE.md` — Project Anatomy counts

**1.** Line 15 — `| Commands | \`framwork/.codeadd/commands/*.md\` | 18 |` → `| 16 |`

**2.** Line 17 — `| Agents | \`framwork/.codeadd/agents/*-agent.md\` | 15 |` → `| 17 |`

> Line 16 (Skills, 40) is correct and must not change. Line 73 ("15 provider dirs") refers to output directories, not agents — **do not touch it**; the collision with the old agent count is coincidental.

### B. `CLAUDE.md` — Build Transform Details

**3.** Line 93, the Agents row of the strategies table (line 90 is the table separator — navigate by the quoted text, not the number):

```
| Agents | Passthrough (keeps original frontmatter) | None | — |
```
→
```
| Agents | Per-provider frontmatter dialect | MD or TOML (Codex) | — |
```

**4.** Line 95, final sentence — replace:

```
All providers use markdown (the build is markdown-only).
```
with:

```
Commands and skills are markdown on every provider. Agents carry a per-provider frontmatter dialect (`AGENT_DIALECTS` in `scripts/build.js`); Codex emits TOML with the body in `developer_instructions`.
```

**5.** Line 97 — correct the contract-sidecar description to match `scripts/build.js:486-489`. Replace:

```
`extractContract()` derives `{ version, shape, recipes, paths }` from it. Three gates fail the build loud: a resource-path variable inside the block (it would resolve per provider), a declared `shape` that does not match the computed one (the forgotten-bump guard — the build prints the value to paste), and a declared version with no matching `## vN` section in its recipe file, or a hole in the `1..N` chain.
```
with:

```
`extractContract()` derives `{ contract, shape, paths }` from it. Two gates fail the build loud: a resource-path variable inside the block (it would resolve per provider), and a declared `shape` that does not match the computed one (the forgotten-bump guard — the build prints the value to paste).
```

> This is the 0068 drift. After the edit, line 97 and line 150 agree and both match the code.

### C. `CLAUDE.md` — Provider Capabilities

**6.** Line 111, second sentence — replace:

```
Agents only build for providers with an `agents` pattern (currently only claude).
```
with:

```
Agents build for providers with an `agents` pattern: claude, cursor and opencode as markdown, codex as TOML. A provider whose agents live outside its main root declares `agentsDir` (codex: skills under `.agents/`, agents under `.codex/agents/`). Antigravity is deliberately deferred — its native `.agents/agents/` collides with the Codex skills root. Plugin agent-fragment injection is separately gated on `agentInjection` in `cli/src/providers.js` and remains Claude-only.
```

### D. `CLAUDE.md` — Feature table

**7.** Lines 134-135 — replace both rows:

```
| `tdd` | enabled | add.plan, add.build, add.review |
| `qa-pipeline` | disabled | add.plan, add.test, add.build |
```
with:

```
| `tdd-pipeline` | enabled | add.plan, add.build, add.review |
| `qa-pipeline` | disabled | add.plan, add.build |
```

> The registry keeps `aliases: ['tdd']` so a pre-rename manifest still resolves. That belongs in `cli/src/features.js` (already shipped), not in this table.

### E. `CLAUDE.md` — Setup Contracts

**8.** Line 150 — replace `(hard gate in \`/add.qa\` preflight)` with `(hard gate in \`/add.review\`'s QA preflight)`.

> Only the parenthetical changes. The rest of the line — `setup-shape`, owner-scoped hashes, the `screens.json` rationale — is correct and must be preserved verbatim.

### F. `add-framework--sync` — main flow list

**9.** `.claude/commands/add-framework--sync.md` line 160 — replace:

```
  Commands in main feature flow (add.new, add.plan, add.build, add.review, add.done, add.test, add.autopilot)
```
with:

```
  Commands in main feature flow (add.new, add.plan, add.build, add.review, add.done, add.plan-to-ready)
```

**10.** `.opencode/commands/add-framework--sync.md` line 165 — the same body edit.

> ⛔ Preserve the mirror's frontmatter (`---` / `description: Synchronizes ADD ecosystem maps...` / `---`) and its `> **INPUT:** $ARGUMENTS` line. Only the quoted line changes.

### G. `add-framework-development` — the `--yolo` note

**11.** `.claude/skills/add-framework-development/SKILL.md` line 206 — replace:

```
an autonomy flag supported ONLY by `add.review` and `add.autopilot` (which forwards it).
```
with:

```
an autonomy flag supported ONLY by `add.review`. `/add.plan-to-ready` does NOT inherit it: it is autonomous by contract, and with a read-only `add.review` the flag's auto-correct half no longer exists.
```

> The rest of the bullet — the plan 0057 rationale and the "grep the target command first" instruction — is still correct and must be preserved.

**12.** `.opencode/skills/add-framework-development/SKILL.md` line 206 — the same body edit.

> ⛔ The mirror differs from `.claude/` at lines 70 and 532 (`.opencode/skills/` vs `.claude/skills/`). Line 206 is identical in both. Do not "fix" lines 70/532 — those differences are correct.

## Impact

| Artefact | Action | Reason |
|---|---|---|
| `CLAUDE.md` | modify (8 edits) | Counts, build invariant, provider reach, feature table, contract description, one dead route |
| `.claude/commands/add-framework--sync.md` | modify (1 edit) | Main-flow list names two deleted commands |
| `.opencode/commands/add-framework--sync.md` | modify (1 edit) | Mirror |
| `.claude/skills/add-framework-development/SKILL.md` | modify (1 edit) | `--yolo` scope names a deleted command |
| `.opencode/skills/add-framework-development/SKILL.md` | modify (1 edit) | Mirror |
| `framwork/.codeadd/**` | **untouched** | Product layer; already correct after 0070 |
| `scripts/build.js` | **untouched** | Code is correct; only its description in `CLAUDE.md` was wrong |
| `cli/**`, `web/**` | **untouched** | Out of scope |

**No code changes.** Edits 1-8 and 11-12 are descriptive prose. Edits 9-10 are different in kind: `add-framework--sync.md` is a live instruction consumed by `/add-framework--sync`, and it defines what Graph 1 renders — so the next sync run will emit a corrected Graph 1, bringing the instruction back in line with the already-current `ecosystem.md` output. No test asserts any of these strings today, which is precisely why they drifted.

## Execution Order

1. **`CLAUDE.md` edits 1-8**, top to bottom. Each anchor is unique; verify verbatim before replacing.
2. **Edit 9** — `.claude/commands/add-framework--sync.md`.
3. **Edit 10** — `.opencode/` mirror of the same. Diff the two afterwards: the only differences must be the frontmatter block and the `> **INPUT:**` line.
4. **Edit 11** — `.claude/skills/add-framework-development/SKILL.md`.
5. **Edit 12** — `.opencode/` mirror. Diff the two afterwards: the only differences must be lines 70 and 532.
6. **Verify** — from the repository root, `grep -rnE "add\.(qa|test|autopilot)(-setup)?" --exclude-dir=docs --exclude-dir=node_modules --exclude-dir=.git . | grep -vE "add\.qa-setup"` must return **only** matches inside `cli/tests/` (those are deliberate absence-assertions and historical comments).
7. **Verify** — `grep -n "markdown-only\|version, shape, recipes\|currently only claude" CLAUDE.md` returns nothing.
8. **Do not run** `node scripts/build.js` — this plan touches no product-layer source, so the build output cannot change. If it does, something outside this plan's scope was edited.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Include the pre-existing 0068 drift on line 97? | **Yes, fix it now** | One sentence, and it removes a direct self-contradiction with line 150 that misinforms every reader of the file. Deferring it means the map keeps lying about its own build |
| How to record the TOML exception? | **Correct the sentence and the table row; no new section** | `CLAUDE.md` has a line budget. Two surgical edits carry the fact; a dedicated dialect section would add ~12 lines to restate what `AGENT_DIALECTS` already holds |
| How to handle the `.opencode/` mirror? | **List every edit twice, explicitly** | The mirror is an adapter, not a copy. A general "mirror everything" rule invites the executor to overwrite frontmatter or the `.opencode/`-relative paths that are *supposed* to differ |
| Discovery agent in STEP 0.4? | **Skipped, deliberately** | The 0070 build ran in this same session and mapped these artefacts by exhaustive grep. Dispatching discovery to re-derive a known set would burn tokens for no new information |

---

## Next Steps

/add-framework--self-build 0071-SELF-PLAN--internal-layer-post-0070
