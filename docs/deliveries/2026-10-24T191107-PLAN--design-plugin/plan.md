# Plan: design-plugin — an opt-in `design` plugin that uses an installed ui-ux-pro-max in the plan's design step

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0065B

---

## Objective

[from conversation, no design document] Add an opt-in `design` plugin that, when the user has already
installed the ui-ux-pro-max skill, makes the `/add-plan` design step (`add-plan` + `@ux-flow-agent`,
`@ux-layout-agent`, `@ux-agent` critique) use it as the data source for style, palette, typography and
chart choice — without bundling, installing or vendoring anything, and without changing the design core.

**When this build is done:** `codeadd plugins list` shows `design` (off by default); enabling it with no
install found fails with the homepage and both official install routes; with any known install location
present it fills four new slots from `plugins/design/fragments/`, and disabling restores the files byte
for byte; the fragments state the source precedence, forbid `--persist` and degrade softly without
Python; the docs page and the ecosystem map list the plugin; tests pin the detect locations.

**Ticket done when:** cli/src/plugins.json has a `design` entry (type skill, skills [], injects add-plan, agents ux-flow/ux-layout/ux) whose node detect finds ui-ux-pro-max in project or home skill dirs for claude/codex/cursor/antigravity/opencode/zcode or in Claude's installed_plugins.json, and whose installHint gives the official marketplace and ui-ux-pro-max-cli routes; four slots (add-plan design.plan, ux-flow-agent design.direction, ux-layout-agent design.layout, ux-agent design.critique) are filled from plugins/design/fragments with core precedence, no --persist and a Python soft-fail; enable/disable round-trips byte-identical; slot fixture and counts updated; detect tests added; docs.astro and the add--ecosystem plugins table list it; build and test:all pass.

## Context

Once `ux-design-core-slim` (0061B) lands, the design core gives the plan structure but no curated data
for style, palette, typography or chart choice. ui-ux-pro-max (MIT, nextlevelbuilder) supplies that data
through a local database and `scripts/search.py` (Python 3, standard library only). Ticket 0065B is
card 6 of 6 in the `2026-10-24T18300*` set. It depends on 0061B and blocks nothing. This plan assumes
0061B is merged (`docs/plans/2026-10-24T182942-PLAN--ux-design-core-slim.md`).

**Every decision here was taken and approved in the document below. This plan does not re-derive them —
it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183006-design-plugin-intent.md` | `path: bounded`; decisions 1–17 (catalog entry, detect locations, hints, Python soft-fail, the four slots, precedence, write scope, scope-out, tests, docs, acceptance, risks); `## Open` = None |

## Global Constraints

- "codeadd owns utilization, never installation" — the plugin ships no copy of the skill, installs nothing, `skills: []` (`cli/src/plugins.json` `$schema-doc.description`; intent decision 2)
- No change to `cli/src/plugins.js` or `cli/src/injection-core.js`; no change to any design-core file under `framwork/.codeadd/skills/add--ux-design/` (intent decision 14)
- Precedence, in every fragment: inspected project tokens → `docs/design-system.md` → ui-ux-pro-max → `add--ux-design` defaults (intent decision 8)
- Fragments forbid `search.py --persist`; every `search.py` call carries a query and `--domain <x>` or `--design-system` (intent decision 9)
- Python is never installed and never part of `detect`; missing Python or a failed search is reported in one line and the design core is used (intent decision 6)
- The `detect` string must run unchanged under `/bin/sh` and `cmd.exe` (`validate` calls `execSync(entry.detect)` with the default shell, `cli/src/plugins.js` `validate`): one `node -e "<js>"` with no `$`, backtick, `%`, `!`, `\` or inner `"` in the JS (decided here, see Validated Decisions)
- Every slot uses `fallback="fallbacks/empty.md"`, and its anchor line above carries no `{{cmd:}}`/`{{skill:}}`/`{{addpath:}}` variable (`add-framework-injection`, Declare a slot; `scripts/build.js` `anchorAt`)
- Anchor every edit by quoted text, never by line number — 0061B and 0063B edit neighbouring lines of the same files (invocation rule from Maicon; 0063B plan F15 "Must NOT touch … the line after item 6 (0065B inserts `design.direction` there)")
- No deploy, publish, rollout or release task (invocation)
- The plan is stack-agnostic: no fragment names a UI library or framework as a default (invocation)

## Problem

1. **The design step has structure but no data** — after 0061B the agents get the contract, rubric and
   UX laws, but pick palette, font pairing, style and chart type from generic defaults. Users who already
   installed ui-ux-pro-max (it worked well on Estanka) have no way to make the plan step use it.

## Proposal

Add a catalog entry and four slots on the existing plugin mechanism, with no CLI code change. Tests land
first and are RED; the fragments, the slots and the catalog drive them GREEN. The detect probe is a
single cross-shell `node -e` that looks in every known install location.

## Scope

### Includes

- **F1** [product] — `cli/tests/plugins.test.js`: NEW `describe('design plugin (0065B)')`, writing only to
  `os.tmpdir()` dirs it deletes. It reads the real catalog and the real source tree. Checks:
  1. **Catalog shape** — `design` exists with `type: "skill"`, `skills: []`, `injects: ["add-plan"]`,
     `agents` equal to `[{agent:"ux-flow-agent",sections:["direction"]},{agent:"ux-layout-agent",sections:["layout"]},{agent:"ux-agent",sections:["critique"]}]`
     (the real `{agent, sections}` shape — intent decision 3 wrote it in short form), `homepage` equal to
     `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`; `installHint` contains
     `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`,
     `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill`, `npm install -g ui-ux-pro-max-cli`, `uipro init --ai`,
     `uipro-cli` and `Python 3`; `postEnableHint` contains `python3 --version`, `py --version` and
     `/reload-plugins`; `$schema-doc.fields.type` mentions `'skill'`.
  2. **Detect quoting** — `detect` matches `^node -e "[^"$\`%!\\]*"$`.
  3. **Detect matrix** — runs the real `detect` string with `execSync`, `cwd` = a temp project, `env` =
     `process.env` with `HOME` and `USERPROFILE` = a temp home and `CLAUDE_CODE_PLUGIN_CACHE_DIR` removed
     (the developer's own `~/.claude/skills/ui-ux-pro-max` must not leak in). Exit 0 for each of:
     project `{.claude,.cursor,.agents,.agent,.opencode,.zcode}/skills/ui-ux-pro-max/SKILL.md` (one case per
     root); home `{.claude,.cursor,.agents,.zcode}/skills/ui-ux-pro-max/SKILL.md` and
     `.config/opencode/skills/ui-ux-pro-max/SKILL.md`; home `.claude/plugins/installed_plugins.json` with key
     `ui-ux-pro-max@ui-ux-pro-max-skill` under `plugins` (the real v2 shape, checked on this machine) and,
     separately, at the top level; the same file under a dir named by `CLAUDE_CODE_PLUGIN_CACHE_DIR`.
     Non-zero for: nothing present; a `ui-ux-pro-max/` dir with no `SKILL.md`; an `installed_plugins.json`
     whose only key is `other@x`; a malformed `installed_plugins.json` (the probe must not crash into a
     false 0).
  4. **Fragment rules** — for each of the four fragment files: one line starting `**Precedence:**` on which
     `inspected`, `docs/design-system.md`, `ui-ux-pro-max`, `add--ux-design` appear in that order; every line
     containing `--persist` also contains `never` (case-insensitive); it contains `python3` and the word
     `design core`; every line containing `search.py` also contains `--domain` or `--design-system`. The
     `add-plan` fragment also contains `DESIGN_SOURCE=ui-ux-pro-max`, `ux-consolidate`, `design-context.md`,
  `installPath` and `Soft-degrade` (the generic-subagent dispatches).
  5. **Slot placement in source (by text)** — `design.plan` sits after the line starting
     `⛔ A \`design.md\` with no \`## Design Contract\`` and before `#### STEP add-plan.dispatch-ux-flow`
     in `commands/add-plan.md`; `design.direction` after the line starting `6. If \`HAS_FOUNDATIONS=true\``
     and before `Write the inspection to temp \`design-context.md\`` in `agents/ux-flow-agent.md`, and not
     inside the `gitnexus.graph` slot; `design.layout` after the line starting `6. Emit the \`## Design Contract\` block`
     and before `## Output` in `agents/ux-layout-agent.md`; `design.critique` after the line starting
     `2. Adversarially hunt defects` and before the next `### Output` in `agents/ux-agent.md`. Each slot
     has `fallback="fallbacks/empty.md"` and exactly one member `plugin:design:<section>`.
  - *RED today: no `design` entry, no fragment, no slot.*
  - **Produces:** `design plugin (0065B)` suite
- **F2** [product] — NEW `framwork/.codeadd/plugins/design/fragments/add-plan.md` (section `plan`) and
  `fragments/agents/{ux-flow-agent,ux-layout-agent,ux-agent}.md` (sections `direction`, `layout`,
  `critique`), each a `<!-- section:NAME -->` block like the gitnexus fragments. Content per intent
  decisions 6, 7 (one bullet per file), 8 and 9: the `add-plan` fragment locates the skill directory —
  the first match of the project/home `…/skills/ui-ux-pro-max/SKILL.md` locations; else, for a Claude
  marketplace install, the `installPath` of the `plugins["ui-ux-pro-max@…"]` entry in
  `installed_plugins.json` (an array of objects carrying `installPath`, checked on this machine) searched
  for `ui-ux-pro-max/SKILL.md`; else the skill loaded by name where the engine exposes it, with its
  directory taken from there; none found → the soft-fail line — and passes `DESIGN_SOURCE=ui-ux-pro-max <path>`
  in all three UX dispatch prompts **including the generic soft-degrade subagents**, and at STEP
  `add-plan.ux-consolidate` rejects a ui-ux-pro-max value that contradicts `design-context.md`
  constraints; flow runs at most one `--design-system` search on a new project with no
  `docs/design-system.md` and only fills empty dimensions on an established one; layout fills only
  `unknown` Design Contract rows, in the existing table, adding no dimension; critique uses results only
  as evidence on existing `critique-rubric.md` items, adding no item. A fragment that names
  `add--ux-design` declares it in a `<!-- uses: -->` block like the gitnexus fragments
  (`add-framework-development` § 9); `ui-ux-pro-max` is plain text, never a `uses:` entry — it is not a
  graph node and the gate would fail. `search.py` appears only on command lines, so every mention
  carries its domain (F1 check 4); text about a failed search says "the search", not the script name. Each fragment carries the
  blank lines its slot needs (`add-framework-injection`, Render). A user-made
  `design-system/<slug>/MASTER.md` is read at the `docs/design-system.md` level (intent decision 8).
  Also in this commit: `cli/tests/build-artefact-graph.test.js` — the node-count assertion
  (`expect(nodes).toHaveLength(228 + …)`) moves by the measured delta (expected +5: four fragment nodes
  and one plugin node) and the `declares` assertion (`toHaveLength(143 + …)`) by +4, each with a comment
  line in the file's existing style. Anchor both edits by their quoted text, not by number — 0060B may
  have moved the base.
  - **Consumes:** `design plugin (0065B)` suite (F1)
  - **Produces:** fragment sections `plan`, `direction`, `layout`, `critique`
- **F3** [product] — the four slots, each `<!-- slot:design.<section> fallback="fallbacks/empty.md" -->`
  around one empty `<!-- plugin:design:<section> -->` pair, at the anchors in F1 check 5:
  `commands/add-plan.md` (`design.plan`), `agents/ux-flow-agent.md` (`design.direction`, its own slot,
  never merged with `gitnexus.graph`), `agents/ux-layout-agent.md` (`design.layout`), `agents/ux-agent.md`
  (`design.critique`, Critique Mode only — review and fix mode get nothing). Must NOT touch any other
  line, and no anchor line gains a variable. Same commit: `cli/tests/fixtures/slot-membership-map-v2.json`
  gains the four slots (one member each, empty fallback); `cli/tests/build-injection-points.test.js`
  `64 + agentModePoints()` → `68 + agentModePoints()` and its comment; `cli/tests/helpers/agent-mode-points.js`
  `BASELINE_POINTS = 72` → `76` (this also moves `loop-consolidation-0070.test.js` L1.0, which reads
  `TOTAL_POINTS()`; add its history comment line).
  - **Consumes:** fragment sections `plan`, `direction`, `layout`, `critique` (F2)
  - **Produces:** slots `design.plan`, `design.direction`, `design.layout`, `design.critique`
- **F4** [product] — `cli/src/plugins.json`: the `design` entry exactly as F1 check 1 and intent
  decisions 3–5 state, and the detect probe over the decision-4 locations under the Global-Constraints
  quoting rule (reads `process.cwd()`, `os.homedir()`, `process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR`; parses
  `installed_plugins.json` in a try and checks keys of `plugins` and of the top level for the prefix
  `ui-ux-pro-max@`). `$schema-doc.fields.type` becomes `'mcp' | 'script' | 'http' | 'skill'`, saying
  that no code reads it. `gitnexus` and `playwright` stay byte-identical.
  - **Consumes:** slots `design.plan`, `design.direction`, `design.layout`, `design.critique` (F3)
- **F5** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md` `## Plugins` table: add, after the
  row starting `| playwright |`, the row `| design | skill | <the catalog description> | add-plan (command) + 3 agents (ux-flow, ux-layout, ux critique) | — (uses your installed ui-ux-pro-max) |`.
  Every other row stays (0060B, 0061B, 0064B edit other rows).
  - **Consumes:** `design plugin (0065B)` suite (F1)
- **F6** [internal] — `web/src/pages/docs.astro`: in the Plugins section, the sentence starting
  `Plugins integrate external MCP tools into ADD commands.` says "external tools (MCP servers or skills you
  install)"; a `design` card goes after the card opened by `<!-- playwright -->`, same structure (header
  with "disabled by default" and "skill", homepage link, install step with both routes, enable/disable
  commands, the Python note); the line `List, enable, or disable MCP plugins (e.g. GitNexus, Playwright).`
  drops "MCP" and adds Design to the examples. Element ids for the new copy buttons use a new `cmd-design-`
  prefix so they collide with none.

### Does NOT Include (important!)

- Bundling, vendoring or auto-installing the skill or Python (intent 14)
- Any change to `plugins.js`, `injection-core.js` or the design core files (intent 14)
- Agent injection beyond Claude — Cursor and OpenCode get the command fragment only, by design (intent 7, 14)
- `add-ux`, `add-build`, review-mode and fix-mode `@ux-agent` injection (intent 10)
- `/add-help` — it reads the ecosystem map already (intent 12)
- The `AGENTS.md` inventory line (`"plugins":["gitnexus","playwright"]`) — `scripts/inventory.js` regenerates it and `/add-framework--done` keeps it current
- Any release, tag, publish or deploy

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Everything in intent decisions 1–17 | As the intent states, except the one row below | Approved by Maicon; `## Open` = None |
| Where does `design.layout` sit? | After item 6 (`6. Emit the \`## Design Contract\` block…`), before `## Output` — **not** after the "How You Work" intro | 0061B F3 rewrites that intro with `{{addpath:wiki/conventions.md}}`. `anchorAt` skips variable lines and walks up to `## How You Work` with `next = null`, so the fragment would render right under the heading, above the intro. Item 6 is where `unknown` dimensions are produced, which is exactly what the fragment fills, and 0061B/0063B touch neither line |
| Shape of `installed_plugins.json` check | Keys of `plugins`, and of the top level | The real file on this machine is `{version, plugins:{…}}`. The top-level check is defensive only — no older shape was seen — and costs nothing |
| Detect quoting | One `node -e "<js>"`, JS with single quotes only and none of `$ \` % ! \\ "` | `execSync` uses `/bin/sh` on Linux/macOS and `cmd.exe` on Windows; those characters are special in one or both. F1 check 2 pins it |
| Detect test isolation | `execSync(detect, {cwd, env})` with temp `HOME`/`USERPROFILE` and no `CLAUDE_CODE_PLUGIN_CACHE_DIR` | `process.chdir` is not safe inside vitest workers; `os.homedir()` honours `HOME` (POSIX) and `USERPROFILE` (Windows); this machine has a real `~/.claude/skills/ui-ux-pro-max` that would turn the "none" case green |
| Graph node counts | Move by the measured delta (expected +5 nodes, +4 declares) | The intent's test list missed `build-artefact-graph.test.js`; a plugin dir adds one plugin node and each fragment one declaring node |
| Layer of `web/src/pages/docs.astro` | `[internal]` | Repo root, not `mcp/`, not in the npm package (`add-plan-authoring` layer table; same as 0061B and 0064B) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/plugins.test.js` | product | modify | F1 |
| `framwork/.codeadd/plugins/design/fragments/add-plan.md` | product | create | F2 |
| `framwork/.codeadd/plugins/design/fragments/agents/{ux-flow-agent,ux-layout-agent,ux-agent}.md` | product | create | F2 |
| `cli/tests/build-artefact-graph.test.js` | product | modify | F2 — node/declares counts |
| `framwork/.codeadd/commands/add-plan.md` | product | modify | F3 — risk HIGH (26 depth-1 dependants); one empty slot, the fallback renders zero bytes |
| `framwork/.codeadd/agents/ux-flow-agent.md` | product | modify | F3 — risk HIGH (3: ux-layout-agent, add-plan, gitnexus fragment) |
| `framwork/.codeadd/agents/ux-layout-agent.md` | product | modify | F3 — risk HIGH (3: ux-flow-agent, add-plan, add--ux-design) |
| `framwork/.codeadd/agents/ux-agent.md` | product | modify | F3 — risk HIGH (12); Critique Mode only |
| `cli/tests/fixtures/slot-membership-map-v2.json` | product | modify | F3 — slotCount 106 → 110, membershipCount 114 → 118 on today's base |
| `cli/tests/build-injection-points.test.js` | product | modify | F3 |
| `cli/tests/helpers/agent-mode-points.js` | product | modify | F3 |
| `cli/tests/loop-consolidation-0070.test.js` | product | modify | F3 — comment line only |
| `cli/src/plugins.json` | product | modify | F4 — not a graph node; read by 6 test files and `plugins.js` |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F5 — risk HIGH (6); one table row |
| `web/src/pages/docs.astro` | internal | modify | F6 — not in the graph; text and one card |

`AGENTS.md` is not changed by the build. Delivery index: no `design` plugin node exists, so nothing of this
name has shipped or been dropped (`history product/plugin/design` → no node).

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 lands before any other edit and is run against the current tree.

**Expected end-state map** (plugin `design`, Claude): `add-plan` ← `plan` ×1; `ux-flow-agent` ←
`direction` ×1; `ux-layout-agent` ← `layout` ×1; `ux-agent` ← `critique` ×1. Total 4 memberships in 4
new slots. Cursor/OpenCode: `add-plan` ← `plan` only. Sidecar points = `76 + agentModePoints()`.

### L1 — Unit (RED → GREEN)

1. `design plugin (0065B)` checks 1–5 fail on the current tree. *RED today: no entry, no fragment, no slot.*
   Checks 4 GREEN after F2, 5 after F3, 1–3 after F4. Covers F1–F4.
2. `build-injection-points.test.js` (`68 + agentModePoints()`, fixture) and
   `loop-consolidation-0070.test.js` L1.0 pass after F3. Covers F3.
3. `build-artefact-graph.test.js` node/declares counts pass after F2. Covers F2.

### L2 — Integration

1. `node scripts/build.js` exits 0 with no new warning at every boundary from F2 on. Covers F2, F3.
2. `injection-exclusivity.integration.test.js` — catalog ↔ fragment tree 1:1, and every catalog plugin
   enabled with a forced `detect` then disabled byte-identically — passes after F4, with `design`
   included automatically. Covers F2–F4.
3. `qa-reachability.smoke.test.js` (`playwright.agents = [qa-agent]`) still passes. Covers F4.
4. `npm run test:all` passes, per `scripts/run-tests.js` policy (in the container). Covers F1–F6.

### L3 — Behavioural acceptance (temp project, never the checkout)

1. In a temp project installed from the local build, with temp `HOME`/`USERPROFILE`:
   `codeadd plugins list` shows `design` off; `codeadd plugins enable design` with nothing installed exits 1
   and prints the homepage and installHint; after creating `.claude/skills/ui-ux-pro-max/SKILL.md` it
   enables and reports 1 command and 3 agents for Claude; the installed `add-plan`, `ux-flow-agent`,
   `ux-layout-agent`, `ux-agent` contain the fragment text and no `plugin:`/`slot:` marker; `disable`
   restores them byte-identical; enable again, delete the skill, `codeadd update` names `design` as not
   detected and the four files equal the disabled bytes. Covers intent acceptance (a)–(d), F2–F4.
2. Reading each fragment: precedence, the no-persist rule and the Python soft-fail are stated; the
   `add-plan` fragment covers the generic soft-degrade dispatches. Covers acceptance (e), F2.
3. `docs.astro` and the ecosystem Plugins table list `design`. Covers acceptance (g), F5, F6.

**RED expectations against the current tree:** L1.1 checks 1–5 fail.
**GREEN = all levels pass after F1–F6.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [internal]. One commit per F-block.

- **F1 first** so the RED state is recorded before any edit.
- **F2 before F3** because a slot member needs its section to render; **F4 last of the three** because
  the catalog's 1:1 test needs the fragments, and enable needs the slots. Between F1 and F4, L1.1 checks
  1–3 stay RED by design; record it in the ledger. **Also expected RED from F3 until F4:**
  `injection-exclusivity.integration.test.js` — F3 raises the sidecar points to `TOTAL_POINTS()` while the
  catalog has no `design` entry yet, so its points-vs-matrix comparison fails. Record it as a ruling; it is
  not a defect. (F2 alone does not trip its 1:1 check, which iterates catalog names only.) The repo is
  fully GREEN at the F4 boundary.
- The node-count and slot-count edits ride with the F-block that moves them (F2, F3), so `npm run build`
  and the count tests hold at each boundary.
- Before F3, re-read the four anchor lines on the current `main`: 0061B must be merged, and 0063B may have
  landed. If an anchor line's text changed, anchor on the new text at the same position and log a ruling.

**Cross-card notes (anchor by text):** 0063B edits `ux-flow-agent` Step 0 items 1 and 3, `ux-agent`, and
`add-plan.md` outside STEP `add-plan.ux-design`, and its plan already leaves the line after item 6 and the
Critique Mode items to this card. 0060B, 0061B, 0064B edit other rows of `add--ecosystem/SKILL.md` and
other entries of `docs.astro`. 0060B removes five skills, which moves the same node-count line in
`build-artefact-graph.test.js` that F2 edits — apply this card's delta to whatever base is there.
0061B's `ux-design-core.test.js` pins `add--ux-design/` to eight files; this card adds none there.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the validation level and its pass state,
and any departure from the intent with the decision number.

Gaps to hunt:

1. L1.1 never shown RED before F2 — a test written after the fix proves nothing.
2. The `detect` string tested through a helper instead of the real catalog string, or the test env still
   seeing the developer's real home or `CLAUDE_CODE_PLUGIN_CACHE_DIR`.
3. An anchor line next to a new slot that carries a `{{…}}` variable (the walked-anchor case the
   `design.layout` move avoids).
4. The `design.direction` slot merged with or adjacent to `gitnexus.graph`.
5. A fragment that adds a Design Contract dimension or a rubric item, names a UI library as a default, or
   shows a `search.py` call without a domain or with `--persist`.
6. `gitnexus` or `playwright` catalog entries changed.

---

## Next Steps

/add-framework--build docs/plans/2026-10-24T191107-PLAN--design-plugin.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review fix-then-ok: A1 injection-exclusivity expected RED F3→F4; A2 marketplace route resolves the skill dir via `installPath`; A3 only `add--ux-design` in `uses:`; N1 `search.py` only on command lines; N3 top-level shape marked defensive. N2 not applied — 0061B uses the same `Type: product` with `Layers: both` |
| 2026-10-24 | Built: status draft → implemented. Commits 327661b (F1), a772553 (F2), c8fce23 (F3), dec0023 (F4), ea823ac (F5), d77e0b8 (F6), 5185fca (review fixes) |
