# Plan: agent-mode-notion-simplify — one instruction-only agent-mode skill replaces the two Notion skills, and an update removes the old skill folders

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-10-30
> **Delivery:** confirm

---

## Objective

[from conversation, no design document] v1.8.0 over-built the Notion integration: two skills, a
`notion` item in `/add-setup` with an MCP check, and a `notion` key in the settings schema. Maicon
wanted only that agent-mode agents get instructions to build and use a board in Notion. This patch
(v1.8.1) replaces the two skills with ONE instruction-only agent-mode skill, linked only from the
agent-mode guide section 10 and the two role files, removes every other trace of the old skills and of
the setup item, and gives projects that had the old local board an ordered migration: send the open
cards to Notion first, delete the local board last.

**When this build is done:** an agent-mode PM (or the engineer when there is no PM) loads
`add--agent-notion`, builds the Notion board with the user (columns, labels, how a card is filled, a
"How it works" page the user owns) and keeps cards current at each pipeline milestone, always naming
work `<id>-<slug>`. `/add-setup` offers no Notion item and the settings schema has no `notion` key.
No framework command or command agent says anything about a board or Notion. A consumer that runs
`codeadd update` from v1.8.0 ends with no `add--notion/` and no `add--notion-setup/` folder in any
provider directory.

## Context

Ticket 0077F (`0077F-agent-mode-notion-simplify`). The id is a label only: the intent file carries no
`ticket:` field, and the board that held tickets was removed by `remove-board` (0075B), so no stage
writes a ticket and the header carries no `> **Ticket:**` line. Fixes 0076B
(`docs/deliveries/2026-10-30T003247-PLAN--agent-mode-notion/`), delivered in v1.8.0 by PR #166.

**Every decision here was taken and reviewed in the document below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-30T121500-agent-mode-notion-simplify-intent.md` | Problem, scope, decisions 1-7, acceptance criteria, risks and paths. `## Open: None`. No `path:`, `delivery:` or `ticket:` field |

What the analysis found that the intent did not say:

- **`codeadd update` today leaves both old folders behind, empty.** `pruneObsolete` in
  `cli/src/release-copy.js` unlinks every file the previous manifest listed and the new release did not
  write, but it never removes a directory. A v1.8.0 consumer updating to v1.8.1 keeps
  `.claude/skills/add--notion/` (and the same in every provider) as an empty folder. That is the
  intent's first risk, and it is real. `install` (`installer.js`) and `modify` (`modify.js`) call the
  same function. `modify.js` and `uninstaller.js` each have a private empty-directory sweep, and
  neither is reachable from `pruneObsolete`.
- **The existing guards forbid the word "board" in the guide and the role files.**
  `cli/tests/agent-mode.test.js` L2.4 fails the guide on `/board/i`, and T1.5 fails each role file on
  `/board|backlog-(cli|commit)|shaped|ticket/i`. The suggested name `add--agent-notion-board` would put
  "board" in both role files, and the migration text of decision 4 has to name `board.json` and the
  `board` branch in section 10.
- **The delivery index answers "no delivery recorded"** for `add--notion`, `add--notion-setup` and
  `add-setup` under the product layer, though `docs/delivered.jsonl` holds the 0076B entry
  `2026-10-30T003247-PLAN--agent-mode-notion` (status `live`). The index stores the delivery, not a
  node per artefact. Nothing on the record says the shape tried here was tried and dropped before.

## Global Constraints

- Strict TDD red-green for every behaviour change: a failing test first, then the implementation (invocation)
- Consumers updating from v1.8.0 lose the old `add--notion` and `add--notion-setup` skill folders (invocation)
- Do not change CLI migration `0006-retire-board` (invocation; intent decision 5)
- No secrets in code, commits, logs or docs (invocation)
- No deploy, rollout, publish or release task; no version bump (invocation; the v1.8.1 tag is `/add-framework--release`'s)
- Do not delete any git branch (invocation) — this includes Code Addiction's own `board` branch, intent decision 6
- Examples stay stack-agnostic (invocation)
- Edits are anchored by quoted text, not line numbers (invocation)
- The new skill is instructions only: no script, no MCP check, no token handling, nothing added to `cli/src/features.js` (intent decision 1)
- Framework commands and their agents keep zero board/Notion instructions (intent decision 3)
- `grep -r "add--notion"` over the repository, outside `docs/deliveries/`, `docs/changelog/`, `docs/brainstorming/`, `docs/plans/`, `docs/delivered.jsonl`, the existing `CHANGELOG.md` entries and gitignored build output, returns nothing (intent, Acceptance criteria)
- Migration order in every text: migrate in-progress and pending cards, then delete `board.json`, the local `~/.codeadd/<key>/board/` folder and the remote `board` branch, the branch last; done and dropped cards are not migrated (intent decision 4; Risks)
- Tests run only through `node scripts/run-tests.js`, in the container; no test writes in the checkout (memory: tests in the container)
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **Two skills and a setup item where instructions were asked for** — `add--notion-setup` checks the
   MCP, links six provider docs and is run by `/add-setup`; `add--notion` carries the daily flow;
   `/add-setup` offers `notion` and `add--settings` records `setup.offered.notion`. None of this was
   asked for.
2. **An update leaves the old skills on disk as empty folders** — `pruneObsolete` removes the files and
   never the folder they were in.
3. **Projects with the old local board have no written path to Notion** — migration `0006` only says
   the data stays and should be moved; nothing says how, or in what order.

## Proposal

One product skill, `add--agent-notion`, for agent-mode agents only. It has two parts: building the
board with the user once, and keeping it current each day, plus a section that migrates the old local
board. It is linked from the agent-mode guide section 10 and the two role files, and registered in
the inventories (provider-map, ecosystem, `AGENTS.md`). Everything else the two old skills touched is
reverted to its pre-0076B shape. `pruneObsolete` also removes the folders it empties, so the update
itself retires the old folders.

Sequencing: the CLI fix first, because it stands alone and it is what the consumer risk depends on.
Then remove the references to `add--notion-setup` (`/add-setup`, settings) so the old skill has no
caller. Then add the new skill, move the guide and roles onto it, delete the old skills, regenerate
the inventories, and write the changelog entry last. Every boundary leaves the suite green.

## Scope

### Includes

Every F-block starts with its tests: write or change them, run them, see them fail for the stated
reason, then implement and see them pass. New assertions about the skill live in
`cli/tests/agent-mode-notion.test.js`, which is rewritten across F2-F6; changed assertions stay in the
file that owns them today. Any test text that must hold the old id builds it by concatenation
(`'add--' + 'notion'`), so the acceptance scan in F6 does not match the tests themselves.

- **F1** [product] — `cli/src/release-copy.js`: `pruneObsolete` removes each directory it leaves empty.
  After it unlinks a file, it walks that file's parent directories upward and removes each one that is
  now empty. It stops at the first directory that is not empty, and it never removes the install root
  or a directory directly under it (`.claude`, `.codeadd`, `.agents` and the like). Depth is counted
  on the manifest path, which is relative to the install root and uses `/` (as `copyRelease` writes
  it): a directory is removable only when its relative path has at least two segments, so
  `.claude/skills/add--x` and `.claude/skills` may go, `.claude` never. The tests live in a new file,
  `cli/tests/release-copy.test.js`, named by this plan. A directory that
  still holds a user's file, or a preserved path (`shouldPreserve`), stays. The return value keeps
  meaning "files removed": directories are not counted, so the `Removed N obsolete file(s)` lines of
  `installer.js`, `updater.js` and `modify.js` stay correct with no change there. A directory that
  cannot be removed is skipped silently, the same way an unremovable file is today. Must NOT lose: the
  preserve rule, the catch-and-continue behaviour, the return count. Not in scope: merging the private
  sweeps of `modify.js` and `uninstaller.js` into this one.
  - **Produces:** `pruneObsolete` removes emptied directories below depth 1
- **F2** [product] — `framwork/.codeadd/commands/add-setup.md`: remove the `notion` item, restoring
  the text as it was before 0076B commit `cb3d13d` (`git show cb3d13d -- framwork/.codeadd/commands/add-setup.md`
  is the exact reverse diff). Quoted anchors:
  - drop the line `- skill: add--notion-setup` from `<!-- uses: -->`;
  - the batch line back to "one numbered item per feature, plugin, qa-setup, wiki, version-record → WAIT";
  - the execute line back to "installs → one codeadd modify → gitnexus setup/analyze → QA setup → MCP checkpoint → wiki";
  - the item list back to "and `qa-setup`, `wiki` and `version-record`. Put each in exactly one group:",
    dropping the sentence "`notion` has no manifest key, …";
  - delete the `| \`notion\` |` Recommendations row;
  - delete the sentence "For accepted `notion`, the batch also asks the values …" from the values paragraph;
  - drop "`{{skill:add--notion-setup/SKILL.md}}`, " from "Print the `## Setup answers` block" paragraph;
  - delete sub-step "3. **Notion setup** …", renumber the later sub-steps 3-6, and set the checkpoint
    back to "STOP after step 4".
  In `framwork/.codeadd/skills/add--ecosystem/SKILL.md`, the `## Commands` row `add-setup` drops
  `add--notion-setup` from its Skills Loaded cell. Must NOT lose: the fixed order of the remaining
  sub-steps, the gitnexus MCP checkpoint, "Wiki last". After this F-block `add--notion-setup` has no
  caller.
- **F3** [product] — `framwork/.codeadd/skills/add--settings/SKILL.md`: the `setup.offered.<item>` row
  back to "plus `qa-setup`, `wiki` and `version-record`. One of:", and the example `offered` object
  drops `, "notion": "enabled"`. A project that already holds `setup.offered.notion` keeps it: no item
  named `notion` exists any more, so nothing offers or reads it, and no text is added about it (intent,
  Risks). The `qa` section and every receipt rule stay untouched.
- **F4** [product] — new `framwork/.codeadd/skills/add--agent-notion/SKILL.md`, registered in
  `framwork/provider-map.json` → `skills` with `{}` (all six providers), with one row in the
  `add--ecosystem` `## Skills` table (Used By: the agent-mode guide and role files), one row in
  `## Dependency Index` (`add--agent-notion` → `agent-mode/README.md` section 10, `roles/product-pm.md`,
  `roles/chief-engineer.md`), and a `- mention: add--agent-notion` line in the ecosystem `uses:` block.
  The skill carries intent decisions 1 and 4, written for an agent-mode PM, or the engineer when the
  team has no PM:
  - **When to use / when not:** only agent-mode agents whose instructions say the project tracks work
    in Notion; never a framework command or its agents.
  - **Build the board, once, with the user:** propose in one batch the database (name, the parent page
    the user names), the Status columns (a recommended default set the user can rename), the labels
    (no default: the user's), the other properties (at least the `<id>-<slug>` title, Type, Priority,
    a link to the pull request), how a card is filled, and who moves which column. Create it through
    the Notion tools the agent already has; when it cannot, print the exact property list for the user.
    Then write a page named "How it works" beside the database (the user may give it another title):
    the columns and what moves a card into each, the labels and when to use each, the fill rules, who
    owns which column. That page is the source of truth and wins over the skill.
  - **Use it, each day:** read "How it works" before any write; find a card by `<id>-<slug>`; update it
    at each milestone, with a fallback table used only where the page has no rule (brainstorm → card
    created; new → id filled; plan → planned; build → in progress, then in review with the pull
    request; done → done; hotfix → Type Hotfix, same path); always show the id with the slug, as in
    `0075F-remove-board`.
  - **Migrate the old local board:** read the cards from `.codeadd/board.json`, the `board` branch or
    `~/.codeadd/<key>/board/`. `<key>` is the folder the removed board used for this project: the
    agent lists `~/.codeadd/`, takes the one folder holding a `board/` clone whose remote is this
    repository, and asks the user when it finds none or more than one; send only in-progress and pending cards (insert, or update when a card
    with the same `<id>-<slug>` exists); skip done and dropped; check each sent card is in Notion; show
    the user what was sent and the three deletions and wait for a yes; then delete `board.json`, the
    local folder, and the remote `board` branch, the branch last.
  - **Prohibitions:** no write before "How it works" is read; never ask for, print, write or log a
    token or key; never store the database or page URL in a repository file; never delete the board
    before every open card is confirmed in Notion.
  Must NOT carry: an MCP check step, a per-provider MCP link table, a `## Setup answers` reader, a
  `backlog-` script name, or any token-like literal. No stack-specific example.
  - **Produces:** skill id `add--agent-notion`; page title `How it works`
- **F5** [product] — `framwork/.codeadd/agent-mode/README.md` section `## 10. Track work in Notion
  (optional)` is rewritten (heading kept): Notion is optional; to start, tell the PM agent (or the
  engineer when there is no PM) to load `add--agent-notion` and build the board with you; agents keep
  cards current by the "How it works" page; migration for a project that had the old local board —
  move only in-progress and pending cards, then delete `.codeadd/board.json`, `~/.codeadd/<key>/board/`
  and the remote `board` branch, the branch last; without Notion, the handoff is the intent file and
  the feature folder (section 9). The lines about `/add-setup`, the MCP check and the per-provider links
  go. `framwork/.codeadd/agent-mode/roles/product-pm.md` and `roles/chief-engineer.md`: the paragraph
  "If the project tracks work in Notion, load `add--notion` and follow the 'Como funciona' page; …"
  becomes the same sentence naming `add--agent-notion` and the "How it works" page, keeping "otherwise
  the handoff is the intent + `docs/features/<id>-<slug>/` only". The role files gain no migration text
  and no "board" word.
  - **Consumes:** skill id `add--agent-notion` (F4); page title `How it works` (F4)
- **F6** [product] — delete `framwork/.codeadd/skills/add--notion/` and
  `framwork/.codeadd/skills/add--notion-setup/`, their two `framwork/provider-map.json` entries, their
  two `## Skills` rows, two `## Dependency Index` rows and two `- mention:` lines in `add--ecosystem`.
  `cli/tests/build-artefact-graph.test.js`: skill count and node count each drop by one net (two
  removed, one added in F4), and the declaring-node count follows; each changed number gets a comment
  line in the file's existing style (`// skill 61 -> 60: …(0077F, F4, F6)`). The build reads the RED
  values from the test run and does not guess them. The two existing comment lines that name the old
  ids ("add--notion-setup and add--notion (0076B, F1, F2)") are reworded to "the two Notion skills
  (0076B, F1, F2)", so the acceptance scan of L1.10 does not match a history comment.
  - **Consumes:** skill id `add--agent-notion` (F4)
- **F7** [internal] — `AGENTS.md`: regenerate the inventory with `node scripts/inventory.js`, so the
  `skills` array lists `add--agent-notion` and neither old id. No hand edit. Then regenerate
  `web/public/ecosystem.json` with `node scripts/graph.js ecosystem --write` after `node scripts/build.js`.
  - **Consumes:** skill id `add--agent-notion` (F4)
- **F8** [internal] — `CHANGELOG.md`: under `## [Unreleased]`, a `### Fixed` entry: the Notion
  integration is now one instruction-only agent-mode skill, `add--agent-notion`; `/add-setup` no longer
  offers `notion` and `add--settings` no longer has the key (a project that recorded it keeps a
  harmless key); `codeadd update` removes the folders it empties, so the two old Notion skill folders
  go; projects with the old local board find the migration order in the agent-mode guide section 10.
  The entry never spells the old skill ids, so L3.1 stays clean. The `## [1.8.0]` entry is history and
  is not edited. The `[1.8.1]`
  heading belongs to the release.

### Does NOT Include (important!)

- Any change to `cli/src/migrations.js` or migration `0006-retire-board` (intent decision 5)
- A new migration. The prune fix in F1 is what removes the old folders, for this release and every
  later one
- Deleting Code Addiction's own `board` branch (intent decision 6). The invocation forbids deleting a
  branch in this plan; Maicon does it by hand after checking no pending card lives only there
- Running the migration in other projects — each project's agents do it (intent, Out)
- Any script, MCP check, token handling or tracker code; anything in `cli/src/features.js` (intent decision 1)
- Board or Notion text in any framework command or its agents (intent decision 3)
- Merging the private empty-directory sweeps of `modify.js` and `uninstaller.js` into `release-copy.js`
- A version bump in `cli/package.json`, the `[1.8.1]` heading, a tag, a release or a publish
- `README.md`, `web/src/`, SVGs — they carry no Notion text today (checked); `/add-framework--sync` owns them
- The delivery changelog in `docs/changelog/` — the build's STEP 8 writes it
- Ticket writes: there is no board

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Scope, single skill, removals, links, migration order, `0006` untouched, patch | As intent decisions 1-5 and 7 | `docs/brainstorming/2026-10-30T121500-agent-mode-notion-simplify-intent.md` |
| Skill name | `add--agent-notion`, not the suggested `add--agent-notion-board` | The intent lets the engineer adjust it. T1.5 fails each role file on `/board/i` and L2.4 the guide; a name holding "board" would force a carve-out in both guards wherever the id appears. `add--agent-` marks it as agent-mode only, and it does not contain `add--notion`, so the acceptance grep stays clean |
| How the update removes the old folders | Fix `pruneObsolete` to remove the directories it empties (F1), not a migration | The file removal already works; only the folder stays. A migration would fix this one release; the prune fix covers every later removal of a skill folder too, and `0006` stays untouched |
| How far up the prune may remove | Up to, not including, depth 1 below the install root, and only empty directories | Never touches the root or a provider root; a folder holding anything — a user file, a preserved path — stays |
| `pruneObsolete` return value | Still counts files only | Three callers print "Removed N obsolete file(s)"; counting folders would change that message's meaning |
| Where "board" may appear in the guide | Only from `## 10.` on | Decision 4 needs `board.json` and the `board` branch named in section 10; before it, the 0075B ban holds as today |
| Page name | "How it works" by default, renamable by the user | The old `Como funciona` hard-coded one language into an English, locale-neutral framework |
| Card identity | The `<id>-<slug>` title; the `tracker:` line in `about.md` is dropped | Decision 1 makes `<id>-<slug>` the identity; a repository line pointing at Notion is one more thing to keep in sync |
| Remote `board` branch deletion | After the user's yes, once every open card is confirmed in Notion | Deleting a remote branch cannot be undone; the intent's third risk is exactly this loss |
| Tests for removed behaviour | Rewritten in place, never deleted silently | A removed test name needs a `Test-Removed:` commit trailer for `scripts/test-loss-guard.cjs` |
| Ticket header line | Omitted; 0077F named in Context only | The intent carries no `ticket:` and there is no board to write to |
| `delivery` | `confirm` | The intent file carries no `delivery:` |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| One skill, no setup item, no MCP check | `/add-setup` no longer walks a user through Notion; the PM agent does it on request |
| A prune that cleans folders for every future removal | A behaviour change in a function three commands share (covered by F1's tests) |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A v1.8.0 consumer keeps the old folders after `codeadd update` | High today | F1; L2.1 runs an update over a v1.8.0-shaped manifest and asserts both folders gone in every provider written |
| The prune removes a folder the user still uses | Low | F1 removes only empty folders and never depth ≤ 1; L1.2 and L1.3 assert a user file and a preserved path keep their folder |
| An agent deletes the `board` branch before the open cards reach Notion | Medium | F4 orders migrate → confirm → user yes → delete, branch last; L1.6 asserts the order in the skill and L1.9 in section 10 |
| A stale reference to an old id survives (ecosystem, inventory, ecosystem.json, tests) | Medium | L1.10 scans every tracked source location for the old ids |
| Removing the `notion` sub-step breaks the numbering of `/add-setup` | Low | F2 restores the pre-0076B text; L1.4 asserts order and "STOP after step 4" |
| Graph counts drift silently | Low | F6 updates `build-artefact-graph.test.js` from the RED values, each with a comment line |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/src/release-copy.js` | product | modify | F1. Not a graph node (graph cannot see `cli/src/`): NOT VERIFIED by the graph. Import search finds 3 callers — `installer.js`, `updater.js`, `modify.js`; treat as MEDIUM |
| `cli/tests/release-copy.test.js` | product | create | F1 — unit tests L1.1-L1.3 |
| `cli/tests/updater.test.js` | product | modify | F1 — L2.1, the v1.8.0 → v1.8.1 update |
| `framwork/.codeadd/commands/add-setup.md` | product | modify | F2. Graph depth 1: add-help, add--settings, add--notion-setup → HIGH (3); the third caller is removed in F6 |
| `framwork/.codeadd/skills/add--settings/SKILL.md` | product | modify | F3. Graph depth 1: add-qa-setup, add-setup, add--doc-schemas, add--qa, add--setup-contract → HIGH (5); one vocabulary key, which no script reads |
| `framwork/.codeadd/skills/add--agent-notion/SKILL.md` | product | create | F4. New node, no caller: LOW |
| `framwork/provider-map.json` | product | modify | F4 adds one `skills` entry, F6 removes two. Not a graph node; read by `scripts/build.js` |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F2 (Commands row), F4 (rows and mention added), F6 (rows and mentions removed). Graph depth 1: 7 callers → HIGH; table rows and `mention:` lines only |
| `framwork/.codeadd/agent-mode/README.md` | product | modify | F5. Not a graph node; held by `agent-mode.test.js` |
| `framwork/.codeadd/agent-mode/roles/product-pm.md` | product | modify | F5. Not a graph node |
| `framwork/.codeadd/agent-mode/roles/chief-engineer.md` | product | modify | F5. Not a graph node |
| `framwork/.codeadd/skills/add--notion/` | product | remove | F6. Graph depth 1: none → LOW |
| `framwork/.codeadd/skills/add--notion-setup/` | product | remove | F6. Graph depth 1: add-setup → MEDIUM; that edge is removed in F2 |
| `cli/tests/agent-mode-notion.test.js` | product | modify | F2-F6 — rewritten for the new skill and the removals |
| `cli/tests/add-setup.test.js` | product | modify | F2 — L1.6 order drops `skill:add--notion-setup` |
| `cli/tests/agent-mode.test.js` | product | modify | F5 — L2.4's `/board/i` ban stops at `## 10.` |
| `cli/tests/build-artefact-graph.test.js` | product | modify | F6 — counts and their comment lines |
| `AGENTS.md` | internal | modify | F7 — inventory regeneration. Not a graph node |
| `web/public/ecosystem.json` | internal | modify | F7 — regenerated, never hand-edited |
| `CHANGELOG.md` | internal | modify | F8 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first, per F-block.** Each level is written before the F-block it covers and seen
failing for the stated reason. Tests run only through `node scripts/run-tests.js` in the container; the
updater and prune tests work in a temp directory they delete; nothing calls Notion.

### L1 — Unit and content (RED → GREEN)

1. **F1** `pruneObsolete` over a temp root holding `.claude/skills/add--x/SKILL.md` and
   `.agents/skills/add--x/SKILL.md`, both in the prior list and absent from the written set, plus a kept
   `.claude/skills/add-help/SKILL.md`: returns 2, both `add--x` folders are gone, `.claude/skills/` and
   `.claude/skills/add-help/SKILL.md` remain. *RED: the folders stay today.*
2. **F1** A prior file whose folder also holds a file the user added: the listed file is removed, the
   folder and the user file stay. A folder emptied up to `.claude/` itself: `.claude/` and the root
   stay. A segment-count case: emptying `.claude/skills/add--x/` and then `.claude/skills/` removes both,
   and `.claude/` stays even when it is left empty. *RED for the `.claude/skills/` removal (nothing is
   removed today); GREEN today for the user file and for `.claude/` staying — guards, written first and kept.*
3. **F1** A preserved path (`.codeadd/history/…`) listed in the prior manifest: the file and its folder
   stay. *Guard, as in 2.*
4. **F2** `add-setup.md`: no `notion` text at all (case-insensitive), no `add--notion-setup` in
   `uses:`; the execute order is `Install the external tools` → `codeadd modify` → `gitnexus setup` →
   `cmd:add-qa-setup` → `cmd:add-wiki`; it contains "STOP after step 4" and not "STOP after step 5"; the
   ecosystem `add-setup` Commands row has no `add--notion-setup`. *RED: all present today.*
5. **F3** The `setup.offered.<item>` row reads "plus `qa-setup`, `wiki` and `version-record`. One of"
   and the example `offered` object has no `notion` key. *RED: both present today.*
6. **F4** `add--agent-notion/SKILL.md` exists, frontmatter `name` equals the folder, `provider-map.json`
   lists it as `{}`; it names `How it works`, `<id>-<slug>`, the milestones brainstorm, new, plan,
   build, done, hotfix, `board.json`, `~/.codeadd/<key>/board/` and the `board` branch; in the
   migration section the delete of the `board` branch comes after the in-progress/pending send and
   after the user's yes; it names no MCP check step, no provider MCP doc URL, no `## Setup answers`,
   no `backlog-`, no `tracker:`, and matches no token-like literal (the `TOKEN_LIKE` set of the current
   test file). The ecosystem has exactly one `## Skills` and one `## Dependency Index` row for it, and
   one `- mention: add--agent-notion`. *RED: no file.*
7. **F4** No file under `framwork/.codeadd/commands/` or `framwork/.codeadd/agents/` names
   `add--agent-notion` or `Notion` (case-insensitive). *Guard for intent decision 3. RED today —
   `add-setup.md` names `notion` until F2 — so it is written in F2's RED step and turns GREEN with F2;
   F4 re-runs it.*
8. **F5** Each role file names `add--agent-notion`, `How it works` and "otherwise the handoff is the
   intent", and not `add--notion` (built by concatenation). T1.5 stays as it is and passes. *RED: the
   roles name the old id.*
9. **F5** Guide: section 10 names `add--agent-notion`, `How it works`, `board.json`,
   `~/.codeadd/<key>/board/`, the `board` branch, "section 9", and states the branch deletion after the
   card move; it names no `/add-setup`, no `Como funciona` and no token-like literal. `agent-mode.test.js`
   L2.4: `/board/i` is banned in the text before `## 10.` only; `Mirror the board|backlog-cli|backlog-commit|board-management|awaiting-release`
   stays banned on the whole guide. *RED: section 10 names the old skills and no migration.*
10. **F6** Acceptance scan, source part: no file under `framwork/.codeadd/`, `cli/src/`, `cli/tests/`,
    `mcp/`, `scripts/`, `workbench/`, nor `framwork/provider-map.json`, contains the old id (the pattern
    built by concatenation), and `framwork/.codeadd/skills/` has no `add--notion` or
    `add--notion-setup` folder. *RED: about a dozen hits today.*
10b. **F7** Acceptance scan, generated part: `AGENTS.md` and `web/public/ecosystem.json` contain no old
    id. Written in F7's RED step, GREEN once the two files are regenerated. *RED: both list the old ids.*
11. **F6** `build-artefact-graph.test.js` passes with the new counts. *RED: old counts after the folders go.*

### L2 — Integration

1. **F1** `updater.test.js`: an update over a manifest that lists
   `.claude/skills/add--notion/SKILL.md`, `.claude/skills/add--notion-setup/SKILL.md` and the same two
   under the codex skills root, with a zip that writes neither: after `update`, none of the four folders
   exists, the manifest lists none of the four files, and a skill the zip does write is present.
   *RED: the folders stay.*
2. **F2-F7** `node scripts/build.js` exits 0 with no new warning; `node scripts/run-tests.js` (the
   framework default) is green.

### L3 — Behavioural acceptance

1. The intent's grep: `git grep -n "add--notion"` lists only `docs/deliveries/`, `docs/changelog/`,
   `docs/delivered.jsonl` and the `## [1.8.0]` entry of `CHANGELOG.md` (`docs/plans/` and
   `docs/brainstorming/` are gitignored and not listed).
2. The built output: after `node scripts/build.js`, no provider directory under `framwork/` holds an
   `add--notion` or `add--notion-setup` folder, and every provider skills root holds `add--agent-notion/SKILL.md`.
3. Read-through: the skill's migration section, followed in order, never reaches a deletion before the
   open cards are confirmed in Notion and the user said yes.

**RED expectations against the current tree:** L1.1, L1.4, L1.5, L1.6, L1.7, L1.8, L1.9, L1.10,
L1.10b, L1.11 and L2.1 fail (L1.2 on its `.claude/skills/` case only); L1.3 and the user-file and
`.claude/` cases of L1.2 are guards that pass today and must keep passing.
**GREEN = all levels pass after F1–F8.**

---

## Execution Order

F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8, all [product] except F7 and F8 [internal].

- **F1 first** — it stands alone, and it is what makes the consumer update lose the old folders.
- **F2 and F3 before F6** — they remove the only caller of `add--notion-setup`; deleting the skill first
  would leave `/add-setup` loading a skill that is gone and break the build's resource checks.
- **F4 before F5** — the guide and the roles link a skill that must exist.
- **F5 before F6** — the guide and the roles stop naming the old ids before the ids disappear.
- **F7 after F6** — the inventory and the ecosystem map are generated from the tree, so they follow it.
- **F8 last** — it describes the finished change.

Every boundary leaves the repository working and the suite green: the acceptance scan is split so
the source part lands with F6 and the generated part with F7. A build that must stop may stop after
any F-block.

Per-F-block validation beyond the layer default: F1 runs `cli/tests/release-copy.test.js` and
`cli/tests/updater.test.js` isolated first, then the suite; F6 and F7 run `node scripts/build.js`
before the suite; any test name removed from `agent-mode-notion.test.js` or `add-setup.test.js` goes in
a `Test-Removed:` trailer on that F-block's commit.

## Reviewer Handoff

For each F-block the build must leave, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the intent decision it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. F1 removing a folder at depth 1, or one that still held a file — read the stop condition, not just the tests.
3. A `board` word or `Notion` reference leaking into a framework command, a command agent or a role file
   outside the one sentence F5 allows.
4. A migration text, in the skill or the guide, that deletes anything before the open cards are
   confirmed, or that deletes the remote branch before the local data.
5. A token-like literal, or a stored Notion URL, anywhere in the new text.
6. `migrations.js` touched at all.

## References

- Prior art: `2026-10-30T003247-PLAN--agent-mode-notion` (0076B, v1.8.0) — what this replaces;
  `2026-10-29T223023-PLAN--remove-board` (0075B) — migration `0006` and the board/ticket bans in
  `agent-mode.test.js`.

---

## Next Steps

/add-framework--build docs/plans/2026-10-30T122030-PLAN--agent-mode-notion-simplify.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-30 | Initial creation |
| 2026-10-30 | Review fix-then-ok: F8 entry no longer spells the old ids (B1); acceptance scan split into L1.10 (F6) and L1.10b (F7) so every boundary is green (A1); L1.7 marked RED until F2 (A2); F4 says how `<key>` is found (A3); F1 defines depth by path segments, L1.2 gains the segment case (A4); F1 names its new test file (N1) |
| 2026-10-30 | Implemented by the build: F1-F8 committed on feat/0077f-agent-mode-notion-simplify (commits 138f8dd..HEAD, see the ledger) |
