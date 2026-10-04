---
path: architectural
topic: board-pipeline-phase-statuses
doc: docs/brainstorming/2026-09-23T164422-board-pipeline-phase-statuses-000-umbrella.md
delivery: automatic
ticket: 0005B
set: umbrella
---

**This is an umbrella's intent file.** Its four subtopics each have a refined design and each gets its own
plan. `delivery: automatic` was chosen once, here, and every subtopic inherits it — it is not re-asked.

## Decided

**The premise everything else rests on**

- **Nobody is using the board in a project today**, so this set carries no backward-compatibility obligation on the product layer. No migration, no injection into an existing definitions file, and `backlog.bats` L3.2 `DEFS_PRESERVED` stays exactly as delivered.
- The one repository with a four-status definitions file is this one. It is a hand-edit in subtopic 003, not a mechanism.

**The model**

- Status, label and column are three separate things. `column`, `label`, `columns` and `hidden` are new optional fields, each with a declared fallback — so a hand-edited file missing a key degrades instead of breaking the board.
- Nine reserved status names ship in `DEFAULT_DEFS` along with the seven columns. `open`, `doing`, `done` and `dropped` keep their `name`; the five new ones are `refining`, `shaped`, `planning`, `planned`, `in-review`.
- **"Reserved" is a documented contract, never enforced in the script.** A user who renames one gets `REFUSED=unknown-status` and seven reported lines; a fresh install cannot reach it.
- `order` sorts within a column; columns sort by their own `order`. Nothing reads `order` as a meaning.
- No transition validation, ever. It is what lets `add.hotfix` jump straight to `doing`.

**How it moves**

- Each phase has an entry and an exit status. The entry write is skipped when the ticket is already in that phase's entry **or** exit; the exit write keeps the single-field skip rule.
- **The `work_id` stop:** once the ticket's `work_id` equals this run's, only `in-review` and `done` may still be written. It is what stops an epic's second subfeature writing `planning` over the first's `in-review`, and it covers a re-run plan, a resumed build and the close-out's Resume route for free.
- **Every exit write sits in the command's final report step**, reading the outcome the command already recorded — because `add.new`'s Continue Mode skips its validation gate, and a write anchored there is lost by a resume.
- `in-review` only where a PR exists: `add.build` STEP 18 on `pr-opened` or `pr-updated`, and internally only when `add-framework--build` STEP 9 is answered yes.
- `add.hotfix` resolves its ticket from the invocation, writes `doing` at STEP 3 and persists `ticket:` at STEP 12. It opens no PR, so it goes `open` → `doing` → `done`.
- Every write is a STEP the agent runs. No platform hook, and the phase check stays as text in `lifecycle.md`, never in `backlog.sh`.
- **Known limitation, recorded not fixed:** the `work_id` stop does not bridge a plan set, because the internal `work_id` is the plan basename. This set is its own example. Fixing it means redefining a field the ledger and the delivery index read.

**The gate**

- A `board` feature in `cli/src/features.js`, **`default: false`**, with every ticket instruction living in `fragments/board/{command}.md`. Nothing to preserve, and a fresh install has no board app and no backlog.
- A feature gates commands and nothing else. The `add-backlog` skill, its two references, `backlog.sh`, `backlog-commit.sh` and everything in `workbench/` ship regardless.
- The `- skill: add-backlog…` declarations move into each fragment's own `uses:` block, so a disabled command stops declaring a dependency it does not have.
- `add.build`'s ticket work leaves STEP 2's numbered list, and the two references that named it "STEP 2 item 5" by position name the work instead.
- Acceptance in two halves: the nine verbatim-moved sites byte-identical, the six reworded ones semantically equivalent under `@prompt-review-agent`.

**The board**

- Column is the layout unit; status is the per-card badge — which keeps F18, F1, F5 and F8 from the palette delivery untouched. `QUIET` moves from per-column to per-card.
- `BoardSkeleton` takes a literal six, not a derived count: it is the router's `pendingComponent` and renders before any payload exists.
- The `column` URL param is an additive union with the default-visible set, not an override list.
- F13's equal-share sizing is not re-opened. The `noSidewaysScroll` e2e assertion at three viewports is the gate; on failure the plan reports and stops.

**Order**

- Four subtopics: 001 the model and the script, 002 the feature gate, 003 the seven writes, 004 the board. 002 before 003 so the new writes land in fragments that already exist.
- `add.hotfix` joins the feature's `commands` list in 003, with its fragment.

## Open

None
