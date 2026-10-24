# Plan: Remove generic skills — five skills no command or agent loads leave the framework

> **Status:** implemented
> **Layers:** both
> **Type:** product
> **Created:** 2026-10-24
> **Delivery:** confirm
> **Ticket:** 0060B

---

## Objective

[from conversation, no design document] Five skills in `framwork/.codeadd/skills/` are generic, not part
of the Code Addiction flow, and no command or agent loads them: `add--stripe`, `add--plan-based-features`,
`add--optimizing-git-workflow`, `add--project-scaffolding`, `add--skill-creator`. They ship to every
install and widen the surface without serving the framework. Remove them, and every live reference to them.

**When this build is done:** the five skills are no longer in the source, the registry, the build output,
the artefact graph, the ecosystem index, the skills that cited them or the web docs. The graph tests use a
real leaf. The workbench tells a skill author to install the native `skill-creator` plugin. The delivery's
changelog warns that `codeadd update` removes the five skills.

**Ticket done when:** the five generic skills (add--stripe, add--plan-based-features, add--optimizing-git-workflow, add--project-scaffolding, add--skill-creator) are gone from the package, registry, ecosystem index, citing skills and web docs; the graph-query leaf test uses a real leaf; build and test:all pass; the workbench points to the native skill-creator plugin; the release note warns that update removes them.

## Context

The skills came from the early framework, before the flow settled on its own commands. The graph confirms
none is load-bearing: each has 0 dependants at depth 1, and every inbound edge is a `MENTIONS`.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive them —
it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-24T183001-remove-generic-skills-intent.md` | Path `bounded`; decisions 1–13 (scope, every reference to fix, what NOT to touch, no migration, release-note warning, acceptance criteria, risks); `## Open` reads `None` |

## Global Constraints

- Keep every row in the `add--ecosystem` `uses:` block `mention:` (intent decision 3; `workbench/commands/add-framework--sync.md`, the catalogue rule)
- Do NOT touch the legacy-orphan path `skills/add-skill-creator/render-graphs.js` in `cli/src/migrations.js`, `scripts/build.js`, `cli/tests/updater.test.js`, `cli/tests/install.e2e.test.js`, `cli/tests/migrations.test.js` (intent decision 6)
- No rename of any remaining skill (intent decision 2)
- No migration script — `pruneObsolete` removes the files on update (intent decision 9)
- Native install command, verbatim: `/plugin install skill-creator@claude-plugins-official`; marketplace fallback `/plugin marketplace add anthropics/claude-plugins-official`; shell form `claude plugin install skill-creator@claude-plugins-official` (intent decision 8)
- Anchor every edit by quoted text, never by line number — five other cards (0061B–0065B) edit the same files and shift the lines (planning rule from Maicon)
- No deploy, publish, tag or release step in this plan (planning rule from Maicon)

## Problem

1. **Dead weight in every install** — about 670K of skills (`add--stripe` ~460K, `add--skill-creator` ~208K, plus three small ones) ship to all six providers and are loaded by nothing.
2. **They teach a stack the framework does not own** — Stripe, Node.js scaffolding, plan gating, git aliases. Cards 0063B and 0064B make the dev skills stack-agnostic, and these pointers work against that.

## Proposal

Delete the five folders and their registry keys. Remove every reference the intent lists, by quoted text.
Swap the two tests that use a removed name. Point skill authors at the native `skill-creator` plugin.
Write the user warning in the delivery's changelog, which is where the release notes are assembled from.

The order is: product source first (folders, registry, citing skills, ecosystem, web), then the tests, then
the workbench, then the inventory and the changelog. Each step leaves a tree that builds.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/skills/{add--stripe,add--plan-based-features,add--optimizing-git-workflow,add--project-scaffolding,add--skill-creator}/` and `framwork/provider-map.json`: delete the five folders whole (every file, every subdir). Remove the five keys from the `skills` object in `provider-map.json`, anchored by the key strings `"add--optimizing-git-workflow"`, `"add--plan-based-features"`, `"add--project-scaffolding"`, `"add--skill-creator"`, `"add--stripe"`. Keep the JSON valid and the column alignment of the remaining rows. Must NOT touch any other key. (Intent decision 2.)
  - **Produces:** the five skill folders and registry keys are gone
- **F2** [product] — the four skills that cite a removed one (intent decision 4):
  - `framwork/.codeadd/skills/add--backend-development/SKILL.md`: remove the line `- mention: add--project-scaffolding`. In the bullet `- **Project scaffolding** — use \`add--project-scaffolding\` for initial setup`, drop the pointer clause; the out-of-scope bullet stays as `- **Project scaffolding**` with no pointer.
  - `framwork/.codeadd/skills/add--backend-architecture/SKILL.md`: remove `- mention: add--project-scaffolding`; the bullet `- **Project scaffolding / file generation** — use \`add--project-scaffolding\` instead` keeps its label and loses the pointer.
  - `framwork/.codeadd/skills/add--frontend-architecture/SKILL.md`: remove `- mention: add--project-scaffolding`; the checklist item `User wants to **scaffold** a new project from scratch — use \`add--project-scaffolding\`` keeps the item and loses the pointer.
  - `framwork/.codeadd/skills/add--agents-md-style/SKILL.md`: remove `- mention: add--skill-creator`; the line `Authoring or editing skill files (\`SKILL.md\`) — use \`add--skill-creator\` and \`add--token-efficiency\`` keeps `add--token-efficiency` only.
  - Must NOT leave an empty `<!-- uses: -->` block: if a block ends up with no row, remove the whole block. Must NOT change any other row.
- **F3** [product] — `framwork/.codeadd/skills/add--ecosystem/SKILL.md` (intent decision 3): remove the five `- mention: add--<name>` rows in the `uses:` block and the five Skills-table rows that start `| add--optimizing-git-workflow |`, `| add--plan-based-features |`, `| add--project-scaffolding |`, `| add--skill-creator |`, `| add--stripe |`. Rewrite the line `Not for authoring new skills/commands → use \`add--skill-creator\`.` to point at the native Claude Code `skill-creator` plugin. Every remaining `uses:` row stays `mention:`. Must NOT touch any other row — 0061B, 0063B, 0064B and 0065B edit other rows of this file.
- **F4** [product] — `web/src/pages/docs.astro` (intent decision 5): remove the five entries anchored by `{ name: "stripe",`, `{ name: "project-scaffolding",`, `{ name: "plan-based-features",`, `{ name: "optimizing-git-workflow",`, `{ name: "skill-creator",`. Keep the array syntax valid (trailing commas as the array already uses them). Must NOT touch any other entry.
- **F5** [product] — `cli/tests/graph-query.test.js` (intent decision 6): in the test `impact --depth 1 tells a leaf from a hub`, swap `product/skill/add--stripe` for a product skill that the regenerated graph shows with 0 depth-1 dependants. Pick it after `npm run build` with `NODE_OPTIONS= node scripts/graph.js impact <name> --depth 1`, never by guess. Expected, to be confirmed on the rebuilt graph: `add--delivery-validation` (on the stale graph of 2026-10-12 it was the only product skill left with 0 once the five are gone; 0061B–0065B may change that). If no product skill has 0, use any product node the rebuilt graph shows with 0 and say so in the ledger. In the catalogue test above it, the comment line `` `impact add--stripe` — a leaf nothing uses — `` is history; reword it so it does not read as a current skill (e.g. "a leaf skill, since removed,"). The `expect(eco.length).toBeGreaterThan(50)` stays: the ecosystem keeps more than 50 rows after F3.
  - **Consumes:** the five skill folders and registry keys are gone (F1) — read through the graph that `npm run build` regenerates after F1 (a build step, not an F-block)
- **F6** [product] — `cli/tests/build-artefact-graph.test.js` (intent decision 6): in the call `extractUses(src, 'add--skill-creator', 'skill')`, swap the name for a neutral one that names no real artefact (e.g. `'add--example'`). The test's meaning (a fenced declaration is not a declaration) must not change.
- **F7** [internal] — the workbench (intent decision 8):
  - `workbench/skills/add-framework-development/SKILL.md`: rewrite the paragraph that starts `⛔ **One convention only: \`references/\`.** It is what \`add--skill-creator\` prescribes` so it states the convention directly, drops `add--skill-creator` from the example list, and tells the author to install the native plugin with the three commands from Global Constraints. In the line `**Flat siblings are legacy**, not an alternative:`, remove `` `add-stripe` `` from the list.
  - `workbench/skills/add-framework-product-layer/SKILL.md`: the line `framwork/.codeadd/skills/add-skill-creator/SKILL.md              # IF the artefact is a skill` becomes a pointer to the native `skill-creator` plugin plus `add-framework-development`.
  - `workbench/commands/add-framework--sync.md`: in `` `graph.js impact` degrades into a constant — `add-stripe`, `` reword the example to "a leaf skill".
  - `scripts/build.js`: in the doc comment `` A declaration shown inside a fence is documentation — `add-skill-creator` ``, replace the name with a neutral description (e.g. "a skill teaching the convention"). The comment that names `skills/add-skill-creator/render-graphs.js` stays (Global Constraints).
  - Then run `node scripts/build-workbench.js`.
- **F8** [internal] — `AGENTS.md`: run `node scripts/inventory.js` so the generated `{"skills":[...]}` line drops the five names. Do not hand-edit the block. `node scripts/inventory.js --check` exits 0 afterwards.
  - **Consumes:** the five skill folders and registry keys are gone (F1)
- **F9** [internal] — the delivery's changelog under `docs/changelog/` (the one file the build writes at its STEP 8; name per `add-plan-authoring`: verb `remove` + slug `remove-generic-skills` — the repeat is intended): it carries a user-facing warning (intent decision 10): `codeadd update` removes `add--stripe`, `add--plan-based-features`, `add--optimizing-git-workflow`, `add--project-scaffolding` and `add--skill-creator`, local edits inside those folders are deleted with them, empty folders may remain and are harmless, and skill authors install the native plugin with the commands in Global Constraints. This is text in the changelog only — no tag, no release, no publish.

### Does NOT Include (important!)

- Slimming `add--ux-design` — card 0061B.
- Making the dev skills stack-agnostic — card 0063B.
- Greenfield guidance in the brainstorm — card 0064B.
- The legacy-orphan path `skills/add-skill-creator/render-graphs.js` and its tests — it cleans up old installs and must keep working.
- A migration script, or removing empty skill folders after `update` (intent decisions 9 and 13).
- `cli/tests/fixtures/slot-membership-map-v2.json` — a frozen snapshot holding none of the five (intent decision 7).
- `artefact-graph.json` by hand — it is build output, regenerated by `npm run build`.
- Tagging, publishing or releasing.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Scope, every reference, what to keep | As intent decisions 1–9 | Approved by Maicon (intent `## Decided`) |
| Which leaf replaces `add--stripe` in the test | The one the rebuilt graph shows with 0 depth-1 dependants | Intent decision 6. `add--delivery-validation` is a candidate from a stale graph, not a checked fact |
| What if no product skill is a leaf | Use any product node with 0 depth-1 dependants and record it | Planner's call: the test checks the leaf/hub property, not the kind |
| Where the release-note warning lives | The delivery's changelog in `docs/changelog/` | `add-framework--release` writes notes from the changelog and commits, and this plan has no release step |
| Add a permanent test that the five stay gone | No. The RED check is the reference search in L1, run once | A test pinned to five removed names guards nothing that can come back by accident; the registry and build already fail on a dangling `uses:` row |
| Regenerate the AGENTS.md inventory in this build | Yes, F8 | `add-framework--build` lists it as a build duty; leaving it to done means `--check` is stale on the branch |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/skills/add--stripe/` | product | remove | F1 |
| `framwork/.codeadd/skills/add--plan-based-features/` | product | remove | F1 |
| `framwork/.codeadd/skills/add--optimizing-git-workflow/` | product | remove | F1 |
| `framwork/.codeadd/skills/add--project-scaffolding/` | product | remove | F1 |
| `framwork/.codeadd/skills/add--skill-creator/` | product | remove | F1 |
| `framwork/provider-map.json` | product | modify | F1 — five keys out |
| `framwork/.codeadd/skills/add--backend-development/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--backend-architecture/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--frontend-architecture/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--agents-md-style/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F3 |
| `web/src/pages/docs.astro` | product | modify | F4 |
| `cli/tests/graph-query.test.js` | product | modify | F5 |
| `cli/tests/build-artefact-graph.test.js` | product | modify | F6 |
| `workbench/skills/add-framework-development/SKILL.md` | internal | modify | F7 |
| `workbench/skills/add-framework-product-layer/SKILL.md` | internal | modify | F7 |
| `workbench/commands/add-framework--sync.md` | internal | modify | F7 |
| `scripts/build.js` | internal | modify | F7 — one doc comment |
| `AGENTS.md` | internal | modify | F8 — generated inventory line |
| `docs/changelog/<ts>-remove-remove-generic-skills.md` | internal | create | F9 — written at build STEP 8 |

**Risk (graph, `impact --depth 1`, graph of 2026-10-12):** all five skills LOW — 0 direct dependants each;
every inbound edge is `MENTIONS` (`add--ecosystem` for all five; `add--backend-architecture`,
`add--backend-development`, `add--frontend-architecture` for `add--project-scaffolding`; `add--agents-md-style`
for `add--skill-creator`). The four citing skills and `add--ecosystem` only lose `mention:` rows, which carry
no dependency. `AGENTS.md` changes (F8). Delivery index: `history` has no delivery recorded for any of the five.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Run each check against the current tree before F1 and record that it fails.

### L1 — Reference search (RED → GREEN)

1. `grep -rnE "add-?-(stripe|plan-based-features|optimizing-git-workflow|project-scaffolding|skill-creator)" framwork/.codeadd framwork/provider-map.json cli/src web/src workbench scripts/build.js` (the build may use `rg --hidden`) returns only the legacy-orphan `render-graphs.js` lines in `cli/src/migrations.js` and `scripts/build.js`. Plus `grep -nE '"(stripe|project-scaffolding|plan-based-features|optimizing-git-workflow|skill-creator)"' web/src/pages/docs.astro` returns nothing. *RED today: about 30 lines match.* Covers F1–F4, F7.
2. `ls framwork/.codeadd/skills/` lists none of the five. *RED today: all five present.* Covers F1.
3. `node scripts/inventory.js --check` exits 0, and the `skills` line in `AGENTS.md` holds none of the five. *RED after F1, before F8: the block is stale.* Covers F8.

### L2 — Build and graph

1. `npm run build` exits 0 with no new warning. No provider output dir holds a folder named after any of the five. Covers F1–F3.
2. `NODE_OPTIONS= node scripts/graph.js impact add--stripe` (and each of the other four) fails with `No node matches`. *RED today: each resolves.* Covers F1.
3. `NODE_OPTIONS= node scripts/graph.js impact <chosen leaf> --depth 1` prints `0 artefact(s)`. Covers F5.
4. `node scripts/build-workbench.js` exits 0. Covers F7.

### L3 — Tests

1. The `graph-query.test.js` leaf test goes RED once F1 lands and the graph is rebuilt (`add--stripe` no longer resolves), then GREEN after F5. Record both runs. Covers F5.
2. `build-artefact-graph.test.js` passes with the neutral name. Covers F6.
3. `npm run test:all` passes (in the container, per `scripts/run-tests.js`). Covers F1–F8.

### L4 — Behavioural acceptance

1. `workbench/skills/add-framework-development/SKILL.md` carries the three install commands from Global Constraints, verbatim. Covers F7.
2. The changelog carries the update warning naming all five skills and the native plugin command. Covers F9.
3. The four citing skills still carry their out-of-scope bullet, now with no pointer. Covers F2.

**RED expectations against the current tree:** L1.1, L1.2 and L2.2 fail today; L1.3 and L3.1 fail mid-build, after F1.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

1. **F1** [product] — removes the source. The build may break on F2/F3's dangling rows only if they are declared as dependencies; they are `mention:`, so the tree still builds.
2. **F2** [product], **F3** [product], **F4** [product] — the references, in any order.
3. **F5** [product], **F6** [product] — after `npm run build` regenerates the graph, so F5 picks the leaf from the real graph.
4. **F7** [internal] — the workbench, then `node scripts/build-workbench.js`.
5. **F8** [internal] — after F1, so the inventory reads the final skill set.
6. **F9** [internal] — at build STEP 8.

`test:all` is red on purpose from F1 (once the graph is rebuilt) until F5 fixes the leaf test; the tree still
builds at every boundary. Between F1 and F4 run only the L1 and L2 checks; run `test:all` only after F5.

## Reviewer Handoff

For each F-block the build leaves in the ledger: files touched, the validation level and its pass state,
and any departure from the intent with the reason.

Gaps a reviewer must hunt:

1. An F-block marked done whose validation level was never RED — L1.1 and L3.1 must show a RED run.
2. The leaf in F5 picked by name instead of by the `impact --depth 1` output on the rebuilt graph.
3. A legacy-orphan line (`skills/add-skill-creator/render-graphs.js`) edited or removed by an over-wide search-and-replace.
4. An `add--ecosystem` row flipped from `mention:` to `skill:` during the edit.
5. A merge collision with 0061B–0065B in `add--ecosystem/SKILL.md` or `docs.astro` resolved by dropping the other card's row.

---

## Next Steps

/add-framework--build docs/plans/2026-10-24T182329-PLAN--remove-generic-skills.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-24 | Initial creation |
| 2026-10-24 | Review fix-then-ok: F1 Produces added and Consumes aligned; red window F1→F5 stated; leaf candidate marked unconfirmed; L1.1 covers `scripts/build.js`; changelog name note |
