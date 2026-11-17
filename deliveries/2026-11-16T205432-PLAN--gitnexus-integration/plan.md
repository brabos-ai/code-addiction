# Plan: gitnexus-integration (0082F) — with GitNexus on, one pass says what a change affects and which deliveries already touched that area; the graph is fresh when queried; the install touches none of our files; the license is shown

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-11-16
> **Delivery:** confirm
> **Backlog ID:** 0082F · **Release:** v1.10.0 · **Card:** https://app.notion.com/p/41ae0000aeae816eacefd46a66435e2c

---

## Objective

[from the card body — no design document; copied verbatim, translated only in the line below]

> Quando o GitNexus está ligado, o agente vê, numa passada só, o que a mudança afeta no código e o que já
> foi feito ou quebrou naquela área. O grafo está fresco quando é consultado, a instalação não mexe em
> arquivos nossos, e o usuário sabe da licença antes de ligar. Nós não mantemos o grafo do GitNexus, só a
> integração.

(With GitNexus on, the agent sees in one pass what the change affects in the code and what was already
done or broke in that area. The graph is fresh when it is queried, the install does not touch our files,
and the user knows the license before enabling. We do not maintain GitNexus's graph, only the integration.)

**When this build is done:** with the `gitnexus` plugin enabled, `add-plan`, `add-hotfix`, `add-diagnose`
and — newly — `add-review` check the graph with `gitnexus status --json` before their first GitNexus
call and run `gitnexus analyze --skip-agents-md` when it reports `stale`. The files GitNexus says a change
affects are sent to the delivery-history question `add--knowledge-discovery` already answers, so the
deliveries that touched that area arrive with the impact. `add-review` and `@reviewer-agent` use
`detect_changes` over the diff instead of listing callers symbol by symbol. `impact` is called with
`summaryOnly` and paged with `limit`/`offset`. Every setup instruction the framework gives — the enable
hint, `/add-setup`, the `add-done` re-index and the docs site — registers the MCP server by hand and
never runs `gitnexus setup`, so nothing writes `AGENTS.md` or `CLAUDE.md` and no hook is installed. The
enable and install messages, `/add-setup`'s offer and the docs site all state the PolyForm Noncommercial
license. With the plugin disabled, the installed commands carry no GitNexus text. Tests in `cli/tests/`
fail if any of this disappears.

## Context

With GitNexus on, the framework has two search layers that never meet. The code graph says what a
change affects. The delivery index (`touched_by`, reached through `add--knowledge-discovery`) knows which
deliveries touched those files. No command joins them. `detect_changes` and `gitnexus status` go unused.
Our setup guidance runs `gitnexus setup` (installs hooks) and a plain `gitnexus analyze` (writes a block
into `AGENTS.md`/`CLAUDE.md`). The license is never shown.

**Every decision here was taken in the card. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `/home/codeaddiction/terminals/intents/gitnexus-integration-intent.md` (the card body; no subpage) | Problem, objective, the example output, done criteria, out of scope, Decisions 1–8, `Em aberto: Nenhum`, and the recommendation for Decision 7 |

The intent file has no `path:` and no `delivery:` frontmatter. Per `add-plan-authoring`, that means the
full plan shape and `Delivery: confirm`. The run was unattended by instruction, so STEP 4 printed no
questionnaire. Every leftover choice below is decided by the card's own recommendation, or by a fact read
from GitNexus's source, and is marked as such.

**GitNexus facts this plan relies on, read from the published package `gitnexus@1.6.12` (`npm pack`,
`dist/cli/*.js`, `dist/mcp/tools.js`), and from its README and `docs/editor-setup.md`:**

| Fact | Source |
|---|---|
| `gitnexus status --json` prints one JSON object whose `status` is `"up-to-date"` or `"stale"`; an unindexed repo prints `{"error":"not-indexed"}` or `{"error":"stale-kuzu-index"}` instead | `dist/cli/status.js` |
| `gitnexus analyze --skip-agents-md` skips the `AGENTS.md`/`CLAUDE.md` section and **still installs** the standard skills under `.claude/skills/` and `.agents/skills/`. `--index-only` skips both | `dist/cli/index.js` option help, `dist/cli/analyze.js` |
| The standard skills `analyze` installs are exactly six: `gitnexus-exploring`, `gitnexus-impact-analysis`, `gitnexus-debugging`, `gitnexus-refactoring`, `gitnexus-guide`, `gitnexus-cli` | `dist/cli/standard-skills.js` |
| The PreToolUse/PostToolUse hooks come from `gitnexus setup` (global editor config), not from `analyze`. `setup` also installs `gitnexus-review`, which renamed the legacy `gitnexus-pr-review` | `dist/cli/setup.js`, `docs/editor-setup.md` |
| The MCP server can be registered by hand with no `setup`: `claude mcp add gitnexus -- npx -y gitnexus@latest mcp`, `codex mcp add gitnexus -- npx -y gitnexus@latest mcp`, and a JSON entry for Cursor/OpenCode | `docs/editor-setup.md` |
| `detect_changes` takes `scope` (`unstaged` default, `staged`, `all`, `compare`), `base_ref` for `compare`, `worktree` and `repo`, and returns changed symbols, affected processes and a risk summary. `all` runs `git diff HEAD`; `compare` runs `git diff <base_ref>` | `dist/mcp/tools.js`, `dist/mcp/local/local-backend.js` |
| `impact` takes `summaryOnly`, `limit` and `offset` (per depth level) and `maxTokens` | `dist/mcp/tools.js`, PR #1818 |
| License: `PolyForm-Noncommercial-1.0.0`; commercial use is licensed by the author | `npm view gitnexus license`, README |

**Decision 7, decided from those facts:** the native skills CAN be kept with no hooks and no
`AGENTS.md` block. `gitnexus analyze --skip-agents-md` installs the six skills and writes no block.
The hooks only come from `gitnexus setup`, which we stop recommending. `add--gitnexus`'s dispatcher must
therefore name only those six skills, so its review row (`gitnexus-pr-review`) changes.

## Global Constraints

- Only instruction: no change to `mcp/`, to `touched_by`, or to GitNexus's graph (card, Decision 1 and Fora do escopo)
- The bridge feeds the files `impact`/`detect_changes` point at into the delivery-history question; the agent receives the deliveries and bugs of that area (card, Decision 1)
- The bridge lives in the plugin fragments for `add-plan`, `add-hotfix`, `add-review` and `add-diagnose` (card, Decisions 1 and 8)
- `detect_changes` replaces symbol-by-symbol listing in `/add-review` and `@reviewer-agent`; `add-review` gains a gitnexus fragment (card, Decision 2)
- Before the command's first GitNexus query, run `gitnexus status`; when stale, run `analyze`. The exact command is written in the fragment, never "if it is stale" (card, Decision 3)
- `impact` uses `summaryOnly` and pages with `limit`/`offset`; `maxTokens` only as a safety net, because it cuts text mid-way, JSON included (card, Decision 4)
- The `postEnableHint` guides a setup that writes nothing to `AGENTS.md` and installs no hooks (card, Decision 5)
- The enable message says GitNexus is PolyForm Noncommercial and commercial use needs the author's license; the plugin's docs carry the same notice in one sentence (card, Decision 6)
- Hooks stay out in every case (card, Decision 7)
- Plugin disabled → no GitNexus text enters any command (card, Critério de pronto)
- Out of scope: maintaining or extending GitNexus's graph, its hooks, watch mode, its generated wiki, embeddings and repository groups (card, Fora do escopo)
- Derived relations stay in-session, never written to disk (delivery `2026-09-14T145149-PLAN--the-impact-question-which-deliveries-touched-this-file`, carried by `2026-10-05T152826-PLAN--native-node-framework-scripts`)
- Every GitNexus fragment states the `list_repos`/`repo` rule inside an injected section (`cli/tests/gitnexus-plugin.test.js`, plan `2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo`)
- Every marker pair sits in exactly one slot; plugin slots use `fallbacks/empty.md` (`add-framework-injection`)
- A command names the GRAPH *question*, never the action — the action table lives in `add--knowledge-discovery` (that skill's STEP 2)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Bug fixes and new tested behaviour follow strict TDD red-green (instruction for this run)

## Problem

1. **Two search layers, never joined** — the graph says what a change affects; the delivery index says who touched those files. No command passes one answer to the other.
2. **`detect_changes` unused** — `@reviewer-agent` enumerates callers symbol by symbol, which is slow and misses the affected processes.
3. **Stale graph queried silently** — only `add-done` re-indexes. `add-plan`'s fragment says "if the graph is stale, re-analyze first" with no way to know.
4. **Blind truncation** — no fragment pages `impact`; a hub symbol's answer can be cut mid-JSON by `maxTokens`.
5. **The setup we recommend breaks our rules** — `postEnableHint`, `/add-setup` and the docs site say `gitnexus setup` (hooks) and plain `gitnexus analyze` (writes `AGENTS.md`/`CLAUDE.md`). So does `add-done`'s re-index.
6. **License invisible** — PolyForm Noncommercial appears nowhere a user enabling the plugin would read.
7. **Dispatcher names a skill the clean install never has** — `add--gitnexus` maps PR review to `gitnexus-pr-review`, a legacy name that only `gitnexus setup` installs (now as `gitnexus-review`).

## Proposal

Instruction only, in the plugin's own files plus the four slot points it needs.

1. **`add--gitnexus` owns the reading rules once** — the `status --json` verdicts, the paging rule, the `detect_changes` scope rule, and an intent table restricted to the six skills `analyze --skip-agents-md` installs.
2. **Each fragment carries the exact commands** (Decision 3 requires it): a new `graph-fresh` section in `add-plan`, `add-hotfix`, `add-diagnose` and `add-review`, placed before that command's first GitNexus use — including the first dispatch of an agent the plugin injects into.
3. **The bridge is a GRAPH question in `add--knowledge-discovery`'s terms**, phrased over the files GitNexus returned. That keeps the action table where it lives, and the answer joins the `RELATED_WORK` (or, in `add-hotfix`, the blast radius) the command already carries.
4. **`add-review` gets a fragment** that runs `detect_changes` once, prints the card's three-part block, and passes it to every `@reviewer-agent` it dispatches as `GRAPH_IMPACT`. The reviewer fragment uses `GRAPH_IMPACT` when given and runs `detect_changes` itself only when not, and never runs `analyze`.
5. **Every setup instruction becomes the clean one**: manual MCP registration, `gitnexus analyze --skip-agents-md`, and "do not run `gitnexus setup`", plus the license line.

**Alternatives rejected:**

| Alternative | Why not |
|---|---|
| Have `codeadd` register the GitNexus MCP server itself (reuse `cli/src/mcp-registration.js`) | The CLI owns utilization, never installation (AGENTS.md, Plugin System). The card asks the hint to guide, not to wire |
| `gitnexus analyze --index-only` | Clean, but drops the six native skills the dispatcher routes to. Decision 7 keeps the skills when possible, and it is possible |
| Put the freshness check in the agent fragments | Parallel reviewers would each run `analyze` on one repo at once. The command checks once, before dispatching |
| Put freshness text inside the existing slots | In `add-plan` (`@discovery-agent` at `STEP add-plan.recent`) and `add-hotfix` (`@architecture-agent` at `STEP add-hotfix.investigate`, and `@reviewer-agent` on the resume path that skips to the review), an injected agent runs before the existing slot. Decision 3 says before the first query |
| Name `touched_by` in the fragments, as the card's example does | `add--knowledge-discovery` forbids a command naming the action; a named action is how a run gets held to one call. The printed block may still label the answer as the card shows |
| Carry the review block into `review-NNN.md` | Changes the review document schema in `add--doc-schemas`, which the card did not ask for. The block goes to chat and to the reviewers' dispatch payload |

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/plugins/gitnexus/skills/add--gitnexus/SKILL.md`: four changes. (a) A **Freshness** section: how to read `gitnexus status --json` — `status: "up-to-date"` → query; `status: "stale"` → run `gitnexus analyze --skip-agents-md` from the repo root, then query; an `error` key (`not-indexed`, `stale-kuzu-index`) → say so and fall back to grep without auto-indexing; output that is not JSON or has neither key (an older GitNexus) → say "freshness unknown" and query anyway. The check runs once per command run, by the command, never by a dispatched agent. (b) A **Small answers** section: `impact` with `summaryOnly: true` first, then the depths needed with `limit`/`offset` (they apply per depth level); `maxTokens` only as a safety net, never as the size control, because it cuts mid-text and mid-JSON. (c) `detect_changes` in the intent table, with the scope rule: `compare` with `base_ref` = the dispatcher's base or the main branch from `get-main-branch.cjs` (GitNexus runs it as `git diff <base_ref>`, so it covers committed, staged and unstaged tracked changes; untracked files are outside it); `worktree` when the MCP server runs from a different directory than the tree under review. (d) The intent table names only the six skills `gitnexus analyze --skip-agents-md` installs: the review row moves from `gitnexus-pr-review` to `detect_changes` plus `gitnexus-impact-analysis`. The **Operating note** stops saying freshness is `add-done`'s job alone. Must NOT lose: the repo-resolution procedure, the grep-vs-graph rule, the intent-not-command-name rule.
  - **Produces:** `add--gitnexus § Freshness`, `add--gitnexus § Small answers`
- **F2** [product] — `framwork/.codeadd/plugins/gitnexus/fragments/add-plan.md`, `add-hotfix.md`, `add-diagnose.md`: each gains a `graph-fresh` section carrying the exact commands (`gitnexus status --json`, the `up-to-date`/`stale` verdicts, `gitnexus analyze --skip-agents-md`) and pointing at `add--gitnexus § Freshness` for the error cases. Each existing section (`graph-plan`, `graph-impact`, `graph-trace`) gains: `impact` with `summaryOnly` then paged (pointing at `add--gitnexus § Small answers`); and the bridge — the files of the symbols `impact` returned go to `add--knowledge-discovery`'s GRAPH step as the question *"which delivered work items touch these files?"*, and the hits join `RELATED_WORK` (`add-plan`, `add-diagnose`) or, in `add-hotfix`, are carried from `STEP add-hotfix.implement` (where `graph-impact` sits) to the blast radius `STEP add-hotfix.review-input` assembles — the section says that destination by STEP id. Deduplicated against what the command already asked. `graph-plan` drops "if the graph is stale, re-analyze first" (moved to `graph-fresh`). Each `<!-- uses: -->` block adds `skill: add--knowledge-discovery`. Must NOT lose: the repo rule (`list_repos`, `repo`) in each section; "say so and fall back to grep — do not block".
  - **Consumes:** `add--gitnexus § Freshness`, `add--gitnexus § Small answers` (F1)
  - **Produces:** fragment section `graph-fresh`
- **F3** [product] — `framwork/.codeadd/commands/add-plan.md`, `add-hotfix.md`, `add-diagnose.md`: one new slot each, `<!-- slot:gitnexus.graph-fresh fallback="fallbacks/empty.md" -->` wrapping `plugin:gitnexus:graph-fresh`, placed **before every other `plugin:gitnexus:` marker in that command and before the first dispatch of any agent in `plugins.json` → `gitnexus.agents`**. Anchors decided now: `add-plan` → end of `STEP add-plan.context` (before `@discovery-agent` in `STEP add-plan.recent`); `add-hotfix` → end of `STEP add-hotfix.context` — the one step both the normal path and `STEP add-hotfix.resume-review` pass through, so the `@reviewer-agent` a resumed run dispatches also queries a checked graph. `gitnexus status`/`analyze` index the repo; they put no code in the agent's context, so the command's no-code-before-history rule is not touched, and the fragment says so in one clause; `add-diagnose` → end of `STEP add-diagnose.context` (before the `graph-trace` slot in `STEP add-diagnose.dispatch`). The line around each slot keeps its blank-line contract per `add-framework-injection` → Render. Mechanical count updates: `cli/tests/delivery-index.test.js` injection-point total (+3 here), with a comment line naming this plan.
  - **Consumes:** fragment section `graph-fresh` (F2)
- **F4** [product] — new `framwork/.codeadd/plugins/gitnexus/fragments/add-review.md`, `framwork/.codeadd/commands/add-review.md`, `cli/src/plugins.json` (`injects` gains `add-review`). The fragment has two sections. `graph-fresh` — as F2. `graph-review` — run `detect_changes` once with `scope: "compare"` and `base_ref` = the main branch printed by `node .codeadd/scripts/get-main-branch.cjs` (exit 0; on exit 1 or 2, skip `detect_changes`, say why, and keep the existing path-based GRAPH step only). GitNexus runs `compare` as `git diff <base_ref>`, which covers committed, staged and unstaged changes to tracked files in one call; untracked files are not in it, so they stay covered only by the existing path-based GRAPH step over `FILES_TO_REVIEW`, and the block says so when there are any; run `impact` with `summaryOnly` only on the symbols `detect_changes` ranks high risk; send the files of the changed and impacted symbols that the existing GRAPH step did not already ask about to the same GRAPH question; print the three-part block of the card's example (symbols and processes; deliveries that touched those files; the graph's freshness line); and pass that block as `GRAPH_IMPACT` in every `@reviewer-agent` dispatch payload of `STEP add-review.dispatch`. Slots: `gitnexus.graph-fresh` at the start of `STEP add-review.bootstrap`; `gitnexus.graph-review` after the `RELATED_WORK` guard block that closes `STEP add-review.baseline`. The existing `playwright.drive` slot is untouched. Count updates: `cli/tests/delivery-index.test.js` (+2), `cli/tests/build-artefact-graph.test.js` fragment count (+1, and whatever node/edge totals the build reports, each with a comment naming this plan).
  - **Consumes:** `add--gitnexus § Freshness`, `add--gitnexus § Small answers` (F1)
  - **Produces:** `GRAPH_IMPACT`
- **F5** [product] — `framwork/.codeadd/plugins/gitnexus/fragments/agents/reviewer-agent.md`: `graph` section rewritten. When the dispatch carries `GRAPH_IMPACT`, start from it and do not re-query what it answers. Otherwise run `detect_changes` with `scope: "compare"` and `base_ref` = the base the dispatcher gave, else the main branch printed by `node .codeadd/scripts/get-main-branch.cjs` — never `all` alone, because `add-build` commits once per F-block and its final audit sees a clean working tree, where `all` returns nothing. This replaces enumerating callers symbol by symbol; `impact` with `summaryOnly` only to drill into a symbol `detect_changes` flagged. Never run `gitnexus analyze` or `gitnexus status` — freshness is the dispatching command's job. Must NOT lose: the repo rule; the merge-risk and missing-test-coverage purpose; the fall-back-to-grep line. This fragment also reaches `add-build` and `add-hotfix` dispatches, which do not pass `GRAPH_IMPACT` — the `else` branch covers them.
  - **Consumes:** `GRAPH_IMPACT` (F4), `add--gitnexus § Small answers` (F1)
- **F6** [product] — `framwork/.codeadd/plugins/gitnexus/fragments/add-done.md`: the re-index runs `gitnexus analyze --skip-agents-md`. Must NOT lose: "do not block the done flow"; the repo rule.
- **F7** [product] — `cli/src/plugins.json` → `gitnexus.postEnableHint` and `installHint`. The hint: (1) register the MCP server by hand — `claude mcp add gitnexus -- npx -y gitnexus@latest mcp` for Claude Code, and GitNexus's `docs/editor-setup.md` URL for other editors; **do not run `gitnexus setup`, which installs editor hooks**; (2) `gitnexus analyze --skip-agents-md` from the repo root; (3) the existing `list_repos` verification line; (4) one clause saying `analyze` writes GitNexus's own `gitnexus-*` skills under `.claude/skills/` and `.agents/skills/` and nothing into `AGENTS.md` or `CLAUDE.md`; (5) the license line: GitNexus is licensed PolyForm Noncommercial 1.0.0 and commercial use needs a license from its author. `installHint` gains the same license line, since it is what a user reads before enabling. Must NOT lose: the `npm install -g gitnexus` install route; the "silently fall back to grep" warning.
- **F8** [product] — `framwork/.codeadd/commands/add-setup.md`: three places — the STEP list summary line for `STEP add-setup.execute` (today "→ gitnexus setup/analyze →", becomes "→ gitnexus MCP + analyze --skip-agents-md →"), the `gitnexus` row in the offer table, and `STEP add-setup.execute` item 3 (its trailing "If `gitnexus setup` prompts, show it…" clause is removed) — switch from `gitnexus setup` + `gitnexus analyze` to: register the MCP server by hand for each installed provider (the commands in F7, per GitNexus's editor-setup doc; a provider without a CLI command gets the config entry shown for the user to add), then `gitnexus analyze --skip-agents-md`; and the row states the license in one clause, so it is read before the user accepts. Must NOT lose: the fixed execute order, the MCP checkpoint in item 5. `cli/tests/add-setup.test.js` and `cli/tests/agent-mode-notion.test.js` order arrays replace `'gitnexus setup'` with `'gitnexus analyze --skip-agents-md'`.
- **F9** [internal] — `web/src/pages/docs.astro`, `web/src/i18n/en.ts`, `web/src/i18n/pt-br.ts` (the plugin's documentation; there is no per-plugin README, and `README.md` points here for the plugin catalog): the wire step shows the manual MCP registration and `gitnexus analyze --skip-agents-md` instead of `gitnexus setup` + `gitnexus analyze`; one license sentence per locale (EN and PT-BR in the same edit). Must NOT lose: the other plugin cards, the install and enable steps.

### Does NOT Include (important!)

- Any change to `mcp/`, `touched_by`, `add--knowledge-discovery` or the delivery index — the bridge is a question asked of what exists
- Any GitNexus fragment for `add-build`, `add-new` or `add-wiki` beyond what F5/F6 change — freshness is scoped by the card to plan, hotfix, review (and diagnose by Decision 8)
- Removing hooks a user already installed with `gitnexus setup` — `gitnexus uninstall` also removes the MCP entry and skills, so recommending it is a separate decision
- CLI code that registers the GitNexus MCP server
- A section in `review-NNN.md` — the block lives in chat and in the reviewers' payload
- GitNexus hooks, watch mode, generated wiki, embeddings, repository groups (card, Fora do escopo)
- A `framwork/.codeadd/plugins/gitnexus/README.md` — nothing builds or ships one; the docs site is the plugin's documentation
- `add-framework--sync` — the next sync picks up the catalog change; F9 edits only the gitnexus card's text

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Can the native `gitnexus-*` skills stay without hooks and without the `AGENTS.md` block? (Decision 7) | **Yes.** `gitnexus analyze --skip-agents-md` installs the six standard skills and writes no block; hooks come only from `gitnexus setup`, which we stop recommending | GitNexus 1.6.12 source (Context table); card's recommendation |
| Which skills may the dispatcher name? | Only the six `analyze` installs; the review row becomes `detect_changes` + `gitnexus-impact-analysis` | `gitnexus-pr-review`/`gitnexus-review` exist only after `setup` |
| How is "stale" detected? | `gitnexus status --json` → `status` field; `error` key → no auto-index, grep fallback; unparseable → "freshness unknown", query anyway | `dist/cli/status.js`; never block, as every fragment already says |
| Auto-index a never-indexed repo? | No | The user enables the plugin and indexes once per the hint; a first full index in the middle of a plan or review is the user's call |
| Where does the freshness check sit? | A new `graph-fresh` slot per command, before the first GitNexus use, including dispatches of injected agents | Decision 3 says "before the first query"; the existing slots come after `@discovery-agent` (plan) and `@architecture-agent` (hotfix) |
| Do agents check freshness? | No — the command does, once | Parallel reviewers would run `analyze` concurrently |
| Does the bridge name `touched_by`? | No — it states the GRAPH question over paths; `add--knowledge-discovery` resolves it | That skill's rule; the printed block may label the result as the card shows |
| How does `add-review` share its result with reviewers? | `GRAPH_IMPACT` in the dispatch payload | One `detect_changes` per review, not one per reviewer |
| Where is the license shown? | `postEnableHint` (acceptance), `installHint` and `/add-setup`'s offer (read before enabling), docs site in EN and PT-BR | Card: "the user knows the license before enabling"; Decision 6 |
| Do the six skill folders `analyze` writes count as "our files"? | No. The card names `AGENTS.md` and `CLAUDE.md` as ours; the `gitnexus-*` folders under `.claude/skills/` and `.agents/skills/` are GitNexus's own, kept by Decision 7. The hint says they appear; L4.1–L4.2 hash only `AGENTS.md`, `CLAUDE.md` and `~/.claude/settings.json` | Card, Decisions 5 and 7 |
| What is "the plugin's README"? | The gitnexus card on the docs site (`docs.astro` + i18n) | No per-plugin README exists; `README.md` sends readers there for the plugin catalog |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A fresh graph on every plan, hotfix, diagnose and review | A stale graph costs an `analyze` run (seconds to minutes) inside the command |
| No hooks, no `AGENTS.md` writes | A manual MCP registration step per editor instead of one `gitnexus setup` |
| One `detect_changes` per review | Reviewers dispatched outside `add-review` still query on their own |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A future GitNexus changes the `status --json` shape | Medium | F1's "freshness unknown → query anyway" branch; L4.3 records the version tested |
| A freshness check lands after an injected agent already queried | Medium | F3/F4 anchors decided above; L1.4 asserts the order in all four commands |
| An `analyze` instruction somewhere still lacks `--skip-agents-md`, or `gitnexus setup` is still recommended | Medium | F6–F9; L1.8 scans every instruction surface |
| Parallel reviewers re-index concurrently | Low | F5 forbids agents from running `analyze`/`status`; L1.7 |
| `touched_by` unreachable (no docs MCP, no shell) | Low | `add--knowledge-discovery`'s existing `NOT VERIFIED` rule applies to the bridge unchanged; F2/F4 route through it |
| GitNexus text leaks into a command with the plugin off | Low | L3.1 renders with the plugin disabled and asserts zero matches |
| New slot breaks blank-line rendering | Low | L3 round-trip and order-independence |

## Impact

**Graph gate (STEP 3.2, `scripts/graph.js impact --depth 1`):**

| Artefact | Layer | Direct callers (depth 1) | Risk |
|---|---|---|---|
| `add--gitnexus` | product | 17 (the 16 fragments + `plugin/gitnexus`) | HIGH |
| `add-review` | product | 18 | HIGH |
| `add-plan` | product | 26 | HIGH |
| `add-hotfix` | product | 11 | HIGH |
| `add-diagnose` | product | 7 | HIGH |
| `reviewer-agent` (its fragment is the change) | product | 10 dispatchers; fragment → 1 (`reviewer-agent`) | HIGH (reaches every reviewer dispatch) |
| gitnexus fragments `add-plan.md`, `add-hotfix.md`, `add-diagnose.md`, `add-done.md` | product | 1 each (the command it injects into) | MEDIUM |
| `add-setup` | product | 2 (`add-help`, `add--settings`) | MEDIUM |
| `cli/src/plugins.json` | product | NOT VERIFIED — CLI source is outside the artefact graph | — |
| `web/` docs | internal | NOT VERIFIED — outside the graph | — |
| `AGENTS.md` | — | Not changed | — |

**Delivery index (STEP 3.3):** product layer, "gitnexus plugin fragment": 13 live, 4 dead. The two dead
entries (`…-the-impact-question-which-deliveries-touched-this-file`, `…-product-knowledge-discovery-answers-the-question`)
are `superseded_by` `2026-10-05T152826-PLAN--native-node-framework-scripts` — the move from shell scripts to
`.cjs`. `touched_by` itself is live. Internal layer: one superseded entry, unrelated. Nothing GitNexus-related was dropped.

**STEP 3.4:** not run — the subject is a product-layer plugin, not an internal artefact.

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/plugins/gitnexus/skills/add--gitnexus/SKILL.md` | product | modify | F1 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add-plan.md` | product | modify | F2 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add-hotfix.md` | product | modify | F2 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add-diagnose.md` | product | modify | F2 |
| `framwork/.codeadd/commands/add-plan.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add-hotfix.md` | product | modify | F3 |
| `framwork/.codeadd/commands/add-diagnose.md` | product | modify | F3 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add-review.md` | product | create | F4 |
| `framwork/.codeadd/commands/add-review.md` | product | modify | F4 |
| `cli/src/plugins.json` | product | modify | F4 (`injects`), F7 (hints) |
| `framwork/.codeadd/plugins/gitnexus/fragments/agents/reviewer-agent.md` | product | modify | F5 |
| `framwork/.codeadd/plugins/gitnexus/fragments/add-done.md` | product | modify | F6 |
| `framwork/.codeadd/commands/add-setup.md` | product | modify | F8 |
| `web/src/pages/docs.astro`, `web/src/i18n/en.ts`, `web/src/i18n/pt-br.ts` | internal | modify | F9 |
| `cli/tests/gitnexus-plugin.test.js` | product | modify | L1 (RED first) |
| `cli/tests/injection-roundtrip.integration.test.js` | product | modify | L3 |
| `cli/tests/delivery-index.test.js` | product | modify | F3, F4 count updates |
| `cli/tests/build-artefact-graph.test.js` | product | modify | F4 count updates |
| `cli/tests/add-setup.test.js`, `cli/tests/agent-mode-notion.test.js` | product | modify | F8 order arrays |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every L1 and L3 assertion BEFORE the F-block it covers lands, run it,
and record in the ledger that it fails against the current tree — that is the proof the test bites. Then
drive it GREEN. A test written after its F-block proves nothing.

**Expected end-state injection map (`gitnexus` namespace):**

| Resource | Sections |
|---|---|
| `add-plan` | `graph-fresh`, `graph-plan` |
| `add-hotfix` | `graph-fresh`, `graph-impact` |
| `add-diagnose` | `graph-fresh`, `graph-trace` |
| `add-review` | `graph-fresh`, `graph-review` |
| `add-build`, `add-new`, `add-done`, `add-wiki` | unchanged |
| 9 agents | `graph`, unchanged list |

`injects` has 8 commands; the plugin has 17 fragment files; the gitnexus command-section total grows by 5.

### L1 — Unit (vitest, `cli/tests/gitnexus-plugin.test.js` unless noted) (RED → GREEN)

1. `injects` sorted equals `['add-build','add-diagnose','add-done','add-hotfix','add-new','add-plan','add-review','add-wiki']`. *RED today: seven, no `add-review`.*
2. The fragment count is 17 and every fragment still states `list_repos` and `` `repo` `` inside an injected section. *RED today: 16.*
3. `add-plan.md`, `add-hotfix.md`, `add-diagnose.md`, `add-review.md` fragments each have a `graph-fresh` section containing `gitnexus status --json`, `stale`, `up-to-date` and `gitnexus analyze --skip-agents-md`. *RED today: no such section.*
4. In each of `add-plan`, `add-hotfix`, `add-diagnose`, `add-review`, the `slot:gitnexus.graph-fresh` opening marker sits inside the STEP named in F3/F4, and its offset is lower than (a) every other `plugin:gitnexus:` marker and (b) the first line that dispatches an agent listed in `gitnexus.agents` (a `DISPATCH` line or an `**Agent:** @…` line naming it). *RED today: no slot.*
5. The four fragments of L1.3 each carry a section containing `GRAPH question`, `add--knowledge-discovery` and `summaryOnly`, and their `<!-- uses: -->` block lists `skill: add--knowledge-discovery`. *RED today.*
6. `add--gitnexus` SKILL.md contains a `Freshness` heading and a `Small answers` heading; names `summaryOnly`, `limit`, `offset`, `maxTokens` and `detect_changes`; does not contain `gitnexus-pr-review`; every `gitnexus-*` skill name it contains is one of the six standard skills. *RED today: `gitnexus-pr-review` present, no headings.*
7. `add-review.md` fragment and `agents/reviewer-agent.md` fragment both contain `detect_changes`, `compare`, `base_ref`, `get-main-branch.cjs` and `GRAPH_IMPACT`, and neither tells the agent to use `scope: "all"` as its only scope; the reviewer fragment contains no instruction to run `gitnexus analyze` or `gitnexus status` (only a sentence forbidding it). *RED today.*
8. Across every file under `framwork/.codeadd/plugins/gitnexus/`, every string in `cli/src/plugins.json` → `gitnexus`, and `framwork/.codeadd/commands/add-setup.md`: every occurrence of `gitnexus analyze` is followed by `--skip-agents-md`; every line containing `gitnexus setup` also contains `do not` or `never` (case-insensitive). *RED today: `add-done.md`, `postEnableHint` and `add-setup.md` fail.*
9. `gitnexus.postEnableHint` and `gitnexus.installHint` both contain `PolyForm Noncommercial`; `postEnableHint` contains `mcp add gitnexus`, `gitnexus analyze --skip-agents-md` and `.claude/skills`; `add-setup.md`'s gitnexus offer row contains `PolyForm Noncommercial`. *RED today.*
10. `cli/tests/add-setup.test.js` and `cli/tests/agent-mode-notion.test.js`: the execute-order arrays use `'gitnexus analyze --skip-agents-md'` and still assert the order install → modify → gitnexus → QA setup → wiki. *RED once the array changes, before F8.*

### L2 — Build and graph

1. `node scripts/build.js` exits 0 with no new warning (no marker outside a slot, no unresolved `{{skill:}}`).
2. `node scripts/run-tests.js` (framework default) green, including the count updates in F3/F4 with their comment lines.
3. `NODE_OPTIONS= node scripts/graph.js impact add--gitnexus --depth 1` lists 18 dependants (the new `add-review.md` fragment added). `dependencies` on each of the four fragments of L1.3 lists `add--knowledge-discovery`.
4. `npm --prefix web run build` exits 0; `docs.astro` has no `command="gitnexus setup"`; `en.ts` and `pt-br.ts` each contain `PolyForm Noncommercial` exactly once inside the `gitnexus` block.

### L3 — Combination matrix (`cli/tests/injection-roundtrip.integration.test.js`, over the real build output)

1. **Plugin off** — installed `add-plan`, `add-hotfix`, `add-diagnose`, `add-review` commands and `reviewer-agent` contain no `/gitnexus/i` match. *Locks the card's "nothing changes with the plugin off".*
2. **Plugin on** — each section in the end-state map lands exactly once in its resource.
3. **Shared resource** — `gitnexus` and `playwright` both on: `add-review` carries `graph-fresh`, `graph-review` and `drive`, each once.
4. **Partial disable** — disabling `gitnexus` leaves the `playwright` section of `add-review` byte-identical.
5. **Order independence** — enabling `playwright` then `gitnexus` and the reverse give identical bytes.
6. **Full round-trip** — enable both, disable both: bytes equal the pristine baseline.

### L4 — Behavioural acceptance (manual, evidence recorded in the ledger)

Run in a scratch git repo with real code, `gitnexus` installed (record `gitnexus --version`), and codeadd installed from this branch's build.

1. `codeadd plugins enable gitnexus` prints the license line. `sha256sum AGENTS.md CLAUDE.md ~/.claude/settings.json` (whichever exist) is equal before and after.
2. Follow the printed hint (manual MCP registration, then `gitnexus analyze --skip-agents-md`): the same three hashes are unchanged; `.claude/skills/gitnexus-exploring/SKILL.md` exists; `~/.claude/settings.json` has no `gitnexus` hook entry.
3. Commit a change after indexing so `gitnexus status --json` reports `stale`. Run `/add-review`: the transcript shows `gitnexus status --json`, then `gitnexus analyze --skip-agents-md`, then `detect_changes`, and the chat prints the three-part block — the affected symbols, the deliveries that touched those files (or `none`/`NOT VERIFIED` per `add--knowledge-discovery`), and the freshness line — with no caller enumerated by hand.
4. Disable the plugin: `grep -ri gitnexus` over the installed commands and agents returns nothing.

**RED expectations against the current tree:** L1.1–L1.9 fail (reasons inline). L1.10 fails once the array is edited and before F8. L3.1 passes today (no review fragment yet) and must stay green; L3.2–L3.3 fail. L2 and L4 are run after the F-blocks.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product] → F5 [product] → F6 [product] → F7 [product] → F8 [product] → F9 [internal]

- **F1 first** because every fragment points at `§ Freshness` and `§ Small answers`.
- **F2 and F3 are one working unit**: a fragment section with no marker fails L1. The tree is green after F3, not after F2 alone; commit them in order and run the suite after F3.
- **F4 before F5** because the reviewer fragment consumes `GRAPH_IMPACT`.
- **F6–F8** are independent of each other and each leaves the tree green; they close L1.8 together, so L1.8 goes GREEN after F8.
- **F9 last**: internal, no test depends on it.

Working-state boundaries: after F1, after F3, after F4, after each of F5–F9.

Per-F-block validation beyond the layer default: F3 and F4 run `node scripts/build.js` and L3 before committing (a slot change breaks rendering, not just text). F4 also runs L2.3.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched with the F-block id; the validation
levels covering it and their RED-then-GREEN state; any decision changed, with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertion was never RED.
2. A `graph-fresh` slot placed after a dispatch of an injected agent, or off a path that dispatches one — check `add-plan`'s `@discovery-agent`, `add-hotfix`'s `@architecture-agent`, and `add-hotfix`'s resume path (`STEP add-hotfix.resume-review` → review) by hand, not only through L1.4.
3. A fragment that names `touched_by` as an action to call, instead of stating the GRAPH question.
4. Any remaining `gitnexus setup` recommendation or bare `gitnexus analyze` — including the docs site and the i18n strings.
5. The reviewer fragment losing the `else` branch: `add-build` and `add-hotfix` dispatch `@reviewer-agent` without `GRAPH_IMPACT`.
6. The PT-BR license sentence missing or not a translation of the EN one.

## References

- Prior art: `2026-09-17T132658-PLAN--opencode-dispatch-and-gitnexus-repo` (the repo rule in every fragment); `2026-09-14T145149-PLAN--the-impact-question-which-deliveries-touched-this-file` (`touched_by`, derived relations stay in-session); `2026-10-25T063045-PLAN--add-setup` (tools installed only after the user confirms)
- Sibling v1.10.0 draft: `2026-11-16T203957-PLAN--docs-search-precision` changes MCP search ranking; this plan does not touch `mcp/`, so the two do not overlap in files
- GitNexus: https://github.com/abhigyanpatwari/GitNexus · CLI reference `docs/cli-reference.md` · `docs/editor-setup.md` · PR #1818

---

## Next Steps

/add-framework--build .codeadd/docs/plans/2026-11-16T205432-PLAN--gitnexus-integration.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-11-16 | Initial creation |
| 2026-11-16 | Review fix-then-ok applied: F8 names the STEP-list line and drops the "if `gitnexus setup` prompts" clause (B1); `detect_changes` always uses `compare` against `get-main-branch.cjs`, never `all` alone, in `add-review`, the reviewer fragment and the skill, with the untracked-files gap stated (A1, A2); `add-hotfix`'s `graph-fresh` moves to the end of `STEP add-hotfix.context` so the resume path is covered (A3); the hint says `analyze` writes GitNexus's own skills, and a decision row says they are not our files (A4); the hotfix bridge names its carry from implement to review-input (N1) |
| 2026-11-16 | Implemented on feat/gitnexus-integration (F1-F9); review findings applied, see ledger |
