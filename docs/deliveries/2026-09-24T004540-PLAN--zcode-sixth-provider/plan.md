# Plan: ZCode as sixth provider — reuse codex's output tree, own agent dialect

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-09-24
> **Delivery:** confirm
> **Ticket:** 0006B

---

## Objective

[from conversation, no design document] Ship code-addiction's commands, skills and agents to ZCode
(Z.ai) — a free agentic desktop IDE for GLM models, close to Claude Code in layout — so a user running
it gets the same 14 commands, ~40 skills and ~20 agents as any of the other five supported providers.

**When this build is done:** ZCode is registered as a provider in `framwork/provider-map.json` and
`cli/src/providers.js`, reusing codex's already-built `.agents/` tree for commands and skills (both
ship to ZCode from the same files codex already produces, at the same install destination, so no new
duplicate tree exists and no user ever sees a skill listed twice), with its own agent dialect and its
own project-level agents directory (`.zcode/`). The MCP registration writer and the uninstaller both
know about ZCode. `AGENTS.md` and the internal product-layer skill say "6 providers", not 5.

**Ticket done when:** `npm run build` emits `framwork/.zcode/` with every command, skill and agent;
installing with the zcode provider into a scratch project and opening it in ZCode lists every
framework command under `/` (none dropped with `custom_command_invalid_name`), every skill under `$`,
and every agent under `@`; a handoff line inside a command names a command that actually exists in
that install; a project with codex and zcode both installed does not list any skill twice; the cli
test suite covers the new provider entry and agent dialect; and uninstall removes `.zcode/`.

## Context

ZCode's command loader rejects any name containing a dot (`COMMAND_NAME_PATTERN =
/^[a-z0-9][a-z0-9_:-]{0,63}$/`, `apps/zcode-cli/packages/adapters/src/commands/index.ts`), and every
product command but `add` is named `add.<verb>`. ZCode also reads skills from **both**
`.zcode/skills/` and `.agents/skills/` (merged, not a fallback) — the same directory codex already
installs its commands-as-skills into.

Two decisions came out of planning this ticket, both recorded here because they came from the
conversation and not from a design document:

1. **Reuse codex's output, don't duplicate it.** ZCode's `dir` for commands/skills is
   `framwork/.agents` — the same tree `scripts/build.js` already writes for codex — and its
   `cli/src/providers.js` entry installs to the same `.agents` destination codex uses. This is what
   `provider-map.json` lets a provider do today: a provider entry that declares no `commands`/`skills`
   pattern is skipped by `buildResources` for those two resource kinds (the skip check sits around
   `scripts/build.js:1675-1676`, ahead of the `commandStrategy`/`skillStrategy` definitions at
   1711-1727; the same mechanism already lets `antigrav` skip `agents` entirely). Zero new files, and
   the double-listing risk the ticket raised disappears by
   construction — there is only ever one tree on disk for the two providers to share.
2. **The dot-in-name question is deliberately NOT resolved here.** Whether ZCode's skill `name:`
   field tolerates a dot (`add.plan`, exactly what codex already emits) is unverified against a real
   install. This plan does not gate on it — see Risks — and a separate ticket (**0010B**) exists to
   evaluate renaming the framework's commands off the dot, should this or a future provider make that
   worth doing. That is out of scope here on purpose: a framework-wide rename has a blast radius this
   ticket's six files do not.

## Global Constraints

- Agents build only for a provider declaring an `agents` pattern (`framwork/provider-map.json` →
  `providers`)
- A registered agent with no source file must fail the build, never warn-and-skip
  (`scripts/build.js`, `agentStrategy.requireSource`)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Every provider with an `agents` pattern must have an `AGENT_DIALECTS` entry, or the build throws
  (`scripts/build.js:1921-1927`)

## Problem

1. **ZCode users get nothing.** ZCode is close enough to Claude Code (markdown commands/skills,
   near-identical agent frontmatter, MCP support) that its users are the natural next audience, but
   the framework has no entry for it at all — not in the registry, not in the installer, not in the
   uninstaller.

## Proposal

Register ZCode as a sixth provider whose commands and skills are never independently built — they
ride on codex's existing `.agents` tree — and whose agents get their own dialect and destination
(`.zcode/`), because ZCode's agent frontmatter is close to Claude's, not to codex's TOML. Wire the MCP
registration writer and the uninstaller to know about the new provider, and update the two provider-count
occurrences in `AGENTS.md`.

## Scope

### Includes

- **F1** [product] — `framwork/provider-map.json`: add the `zcode` provider entry. `dir:
  "framwork/.agents"` (no independent `commands`/`skills` pattern — reuses codex's build output),
  `agentsDir: "framwork/.zcode"` (its own dialect target), `agents: "agents/{name}.md"`,
  capabilities `{ hooks: false, agentDispatch: true, mcp: true,
  nativeFormat: "md", slashCommands: true, structuredQuestions: true }` (`hooks: false` because
  ZCode's docs state project hooks under `.zcode/config.json` do not run in the current version — only
  global hooks do), and the five docs URLs already drafted in the ticket (`commands`, `skill`,
  `subagents`, `mcp-services`, `hooks`).
  - **Produces:** `provider-map.json.providers.zcode`, read by F2.
- **F2** [product] — `scripts/build.js`: add `AGENT_DIALECTS.zcode`. Modelled on the `claude` dialect
  (`name`, `description`, verbatim passthrough of `tools`/`disallowedTools`/`skills`, and the same
  `disallowedTools: Write, Edit, NotebookEdit` fallback for `readonly: true` with no explicit
  `disallowedTools`) — ZCode's own documented agent keys include `tools` and `disallowedTools`
  directly, so no denial-by-prose fallback is needed the way Claude's is. `model` is dropped: ZCode
  model ids are not `sonnet`/`opus`/`inherit`, so the key is omitted rather than mistranslated.
  - **Consumes:** `provider-map.json.providers.zcode` (F1) — the dialect key must be `zcode` to match.
- **F3** [product] — `cli/src/providers.js`: add the `zcode` entry to `PROVIDERS` — `label: 'ZCode
  (Z.ai)'`, `hint: '.agents/skills/'` (matching the reuse — `cli/src/prompt.js` reads both directly
  to render the install prompt row, so omitting them shows `undefined`), `src: 'framwork/.agents'`,
  `dest: '.agents'` (same as codex — this is the reuse), `commandsSubdir: null`,
  `skillsSubdir: 'skills'`, `agentsSubdir: 'agents'`, `agentsSrc: 'framwork/.zcode'`, `agentsDest:
  '.zcode'`, `globalDest: '.agents'`. Append `'zcode'` to `PROVIDER_PRIORITY`.
- **F4** [product] — `cli/src/mcp-registration.js`: add `zcode: { file: '.zcode/config.json', format:
  'mcp.servers' }` to `MCP_CONFIG`, and add the `'mcp.servers'` branch to `registerProvider` — same
  `{command, args}` entry shape as the existing `mcpServers` format, nested one level under a `mcp`
  key instead of at the document root (`current.mcp.servers`, not `current.mcpServers`).
  - **Produces:** the `'mcp.servers'` format branch in `registerProvider`.
- **F5** [product] — `cli/src/uninstaller.js`: add `'.zcode'` to `ADD_DIRS` and to
  `GLOBAL_ADD_DIRS` — the agents directory is `.zcode` in both scopes even though commands/skills
  live under the shared `.agents`.
- **F6** [internal] — `workbench/skills/add-framework-product-layer/SKILL.md`: this file carries no
  "5 providers" count or provider-name list to update (checked by grep — its only provider-name
  strings are unrelated examples). Its one change is to record the codex-reuse pattern (a provider
  entry with no `commands`/`skills` pattern, reusing another provider's `dir`) as a documented option
  for a future provider addition — this is the first time it has been used.
  - **Consumes:** F1-F5 (documents the shape actually shipped).
- **F7** [internal] — `AGENTS.md`: two occurrences change — the opening-paragraph count ("distributes
  ... to 5 MCP-capable providers", line 3) and the § Providers list ("The 5 supported providers
  (claude, codex, cursor, antigrav, opencode) ...", line 188) — both become 6, naming zcode.
  - **Consumes:** F1-F5.

### Does NOT Include (important!)

- Renaming any command off the dot convention — tracked separately as ticket 0010B, not this plan
- A build-time transform that rewrites literal `/add.plan`-style prose per provider — avoided
  entirely by the reuse decision; nothing about ZCode's output needs its own text
- Changes to `cli/src/injection-core.js` — feature injection already skips codex (its
  `commandsSubdir` is `null`), and ZCode's entry sets the same, so it is already excluded with no new
  code
- Plugin agent-fragment injection for ZCode — stays Claude-only, as it already is for the other four
- Enabling ZCode by default, or auto-detecting it — opt-in, same as every other provider
- `add-framework--sync` (README/web docs regeneration) — runs before release as its own command, not
  as an F-block here

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Ship ZCode commands nested (`add:plan`), flat-renamed (`add-plan`), or reuse codex's skill route? | Reuse codex's route — no independent commands/skills pattern | Zero new build surface, zero prose-rewrite risk; matches the precedent codex and antigrav already set |
| Codex + ZCode both installed — how to avoid double-listing? | ZCode's `dir`/`src`/`dest` are literally codex's — one tree, one copy, always | User's explicit call; simpler than any installer-side dedup condition |
| ZCode project agents, or global only? | Project (`.zcode/agents/`), matching the other 4 providers | User's explicit call, following the open-source code over the (older) docs |
| Does ZCode's skill `name:` field accept a dot? | Left unverified, not gated on | See Risks — resolving it is either free (nothing to do) or scopes into ticket 0010B, not this plan |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| ZCode's skill-name pattern rejects the dot in `add.plan`, so reused commands never appear under ZCode's `/` even though the files are present | Medium | Verify against a real (or scratch) ZCode install as part of this plan's own acceptance check (Validation Matrix, behavioural acceptance), **before** closing F1-F5 as done. A rejection does not block this plan — ZCode still gets every real skill (`add-backend-development` etc., already dash-named) and every agent; only the reused commands-as-skills are affected, and that becomes the concrete motivation ticket 0010B needs |
| `registerProvider`'s new `'mcp.servers'` branch regresses the existing `'mcpServers'`/`'opencode'` branches | Low | F4's validation runs the full existing `mcp-registration.test.js` suite plus new cases, RED before GREEN |
| Codex's own install silently changes shape because `zcode`'s entry now points at the same `dir` | Low | F1/F3 add zcode as a pure additive entry; nothing about codex's own entry is touched |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/provider-map.json` | product | modify | F1 — new `zcode` provider entry |
| `scripts/build.js` | product | modify | F2 — new `AGENT_DIALECTS.zcode` |
| `cli/src/providers.js` | product | modify | F3 — new `PROVIDERS.zcode`, `PROVIDER_PRIORITY` |
| `cli/src/mcp-registration.js` | product | modify | F4 — new `MCP_CONFIG.zcode`, `'mcp.servers'` format |
| `cli/src/uninstaller.js` | product | modify | F5 — `.zcode` added to both dir lists |
| `cli/tests/build.test.js` / `agent-capability.test.js` | product | modify | F2's RED-then-GREEN coverage |
| `cli/tests/providers.test.js` | product | modify | F3's coverage |
| `cli/tests/mcp-registration.test.js` | product | modify | F4's coverage |
| `cli/tests/uninstaller.test.js` | product | modify | F5's coverage |
| `workbench/skills/add-framework-product-layer/SKILL.md` | internal | modify | F6 — provider count + reuse pattern |
| `AGENTS.md` | internal | modify | F7 — provider count |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree.

### L1 — Unit / build-side (RED → GREEN)

1. `AGENT_DIALECTS.zcode` exists and renders `name`, `description`, and `disallowedTools` (when
   `readonly: true` and no explicit `disallowedTools`) exactly as the `claude` dialect does, minus
   `model`. *RED today: the key does not exist, so `scripts/build.js` throws
   `No agent frontmatter dialect for provider "zcode"` the moment an agent targets it.*
2. `node scripts/build.js` emits `framwork/.zcode/agents/<name>.md` for every agent
   `provider-map.json` resolves to zcode, and emits **nothing** under `framwork/.zcode/commands/` or
   `framwork/.zcode/skills/` (there is no such pattern). *RED today: no `zcode` key in
   `provider-map.json` at all.*
3. `registerProvider(cwd, 'zcode', version, corpus)` writes `{ mcp: { servers: { 'codeadd-docs': {
   command: 'npx', args: [...] } } } }` into `.zcode/config.json`, is idempotent, and rewrites the
   version pin on a second call. *RED today: `MCP_CONFIG.zcode` does not exist, so `registerProvider`
   returns `status: 'print'`.*
4. `resolveSelected(['zcode'])` returns `src: 'framwork/.agents'`, `dest: '.agents'`,
   `agentsSubdir: 'agents'`, and `agentDest(p) === '.zcode'`. *RED today: `PROVIDERS.zcode` is
   undefined, so `resolveSelected` filters it out.*
5. Uninstalling with `installScope: 'project'` and `'global'` both remove `.zcode/`. *RED today:
   `.zcode` is absent from both `ADD_DIRS` and `GLOBAL_ADD_DIRS`.*

### L2 — Integration

1. `node scripts/build.js` run end to end exits 0 with no new warning, and `framwork/.agents/` (the
   codex tree) is byte-identical to what a build with no `zcode` entry at all would have produced —
   the new provider changes nothing about codex's own output.
2. `cli/tests/mcp-registration.test.js`'s full existing suite still passes — the new `'mcp.servers'`
   branch does not disturb `'mcpServers'` or `'opencode'`.

### L3 — Behavioural acceptance

1. Installing with `providers: ['zcode']` alone into a scratch project produces `.agents/skills/`,
   `.agents/commands/` (empty — codex has none either, commands ship as skills),
   `.zcode/agents/`, and a `.zcode/config.json` carrying the MCP registration.
2. Installing with `providers: ['codex', 'zcode']` together produces exactly one `.agents/` tree —
   no file is written twice, no skill is listed twice when ZCode is opened.
3. **The unresolved question, run once, reported either way (Risks):** opening the scratch install in
   a real or scratch ZCode session lists every product command under `/` (or reports the specific
   ones ZCode drops with `custom_command_invalid_name`, if the dot is in fact rejected there too).

**RED expectations against the current tree:** all of L1 and L2 fail today — none of the five files
carry a `zcode` entry. **GREEN = all levels pass after F1-F7.**

---

## Execution Order

1. **F1** first — every later F-block reads the `zcode` key it creates.
2. **F2** next — the dialect the agent build throws without.
3. **F3, F4, F5** — independent of each other, all consume only F1; may land in any order or in
   parallel commits.
4. **F6, F7** last — they document the shape F1-F5 actually shipped, not a planned one.

Run L3.3 (the real-ZCode acceptance check) **after F1-F5, before F6-F7** — its outcome (dot accepted
or not) is worth recording in the same commit that updates the provider-count prose, so F6/F7 do not
have to be revised a second time if it comes back negative.

Every boundary after F1 leaves the repo buildable and every existing provider's output unchanged —
`node scripts/build.js` is safe to run after any single F-block.

## Reviewer Handoff

- **What changed** — files touched, with the F-block id, per the Impact table.
- **Which validation levels cover it**, and their pass state, including L3.3's outcome (accepted /
  rejected / not testable in this environment).
- **Any decision deferred or altered**, with the reason — specifically, whether L3.3 came back
  negative and what that means for ticket 0006B's own `done_when`.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a dialect or registration branch
   added after the fact proves nothing about whether it was needed.
2. `PROVIDER_PRIORITY` and the install prompt order — confirm zcode was appended, not inserted ahead
   of an existing provider by accident.
3. `globalDest: '.agents'` on the zcode entry — confirm a global install of `['codex', 'zcode']`
   together does not double-write anything, the same check L3.2 makes for project scope.

## Next Steps

/add-framework--build zcode-sixth-provider

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-24 | Initial creation |
| 2026-09-24 | fix-then-ok review: corrected F1's docs-URL count (five, not four), added missing `label`/`hint` to F3, corrected F6's target (no "5 providers" text in that file — kept only the reuse-pattern documentation), named both `AGENTS.md` occurrences in F7, tightened the `build.js` line citation |
| 2026-09-24 | Implemented (commits 2d55bcb..3fb6ecc). F1's "no independent commands/skills pattern" became "same commands/skills strings as codex" — real agent bodies need `provider.commands`/`.skills` resolved for any provider carrying an `agents` pattern (see ledger). Post-build review found and fixed a missing `.zcode` entry in `release.yml`'s packaging loop, with a new generic regression test. Full changelog: `docs/changelog/2026-09-24T012231-add-zcode-sixth-provider.md` |
