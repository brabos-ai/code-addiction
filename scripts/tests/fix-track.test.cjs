'use strict';
// Static suite for the plan-less fix track: `/add-framework--done --fix <slug>` and the clauses
// `add-plan-authoring` carries for it. Both are skills, so this reads their text. Nothing here writes
// in the checkout. The runtime path is proved by the build's L4 refusals and by the first real fix
// close-out (recorded as pending in the ledger).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const DONE = 'workbench/skills/add-framework--done/SKILL.md';
const AUTHORING = 'workbench/skills/add-plan-authoring/SKILL.md';

// The planned path, pinned verbatim. Copied from the tree before the fix track landed: each is a
// paragraph the `--fix` text sits BESIDE, and a run of done without `--fix` reads exactly these.
const PLANNED_PATH = [
  {
    "name": "gate 2.2 body",
    "text": "### 2.2 The ledger gate — BEFORE the four commands\n\n**Every F-block in the plan's Execution Order must have a `complete` line in the ledger.** A block that recorded only a ruling is not complete.\n\n**`add-build-ledger` owns those line shapes. This gate reads them and does not define them** — a second copy of a format drifts from the first, and the drift is invisible until the two disagree about what counts as delivered.\n\nA build may add F-blocks the plan did not have — a ruling records why. Those are reported, never required: this gate asks whether the PLAN was delivered, not whether the build stayed inside it.\n\nIf any block is missing its `complete` line → report which ones and STOP.\n\n**This runs first for a reason: unwritten code breaks no test.** A `/add-framework--build` run that stopped halfway passes all four commands below and would merge and index as fully delivered — the exact lie the index exists to prevent. **It is the only gate here that can catch that, which is why it is the one that stays.** The gate that used to sit beside it asked whether the delivery had been graded; this one asks whether it happened at all, and those are not the same question.\n\n"
  },
  {
    "name": "1.2 argument resolution paragraph",
    "text": "**Resolve `[plan]` by `add-plan-authoring`'s Argument Resolution.** Load it and apply it as written: it owns the substring match, the companions it excludes, the naming forms that resolve, and the stop on more than one match or none.\n\n"
  },
  {
    "name": "1.2 derive-from-branch paragraph",
    "text": "When no `[plan]` was given, derive the candidate from the branch name and confirm it with the user before proceeding.\n\n"
  },
  {
    "name": "STEP 4 changelog lookup paragraph",
    "text": "⛔ **`/add-framework--build` STEP 8 normally wrote one already.** Look for this delivery's changelog before writing anything: when one exists, EDIT it and keep its filename. Allocating a second timestamp puts two files on `main` for one delivery, each telling part of its story.\n\n"
  },
  {
    "name": "6.1 plan and ledger stop block",
    "text": "IF THE PLAN OR THE LEDGER CANNOT BE READ FROM THIS WORKING TREE:\n  ⛔ DO NOT USE: Bash to run git commit\n  ⛔ DO NOT: Assemble a directory holding only the half that was readable\n  ✅ DO: Report which document is missing and STOP — a delivery archived without its ledger loses every ruling it made\n```\n\n"
  },
  {
    "name": "STEP 8 ticket paragraph",
    "text": "**When the plan header carries `> **Ticket:**`, make the `done` write now.** `add-plan-authoring` owns when\nit is skipped, how it is made and every degradation, under **The Ticket** — load it rather than acting\nfrom memory.\n\nIt runs here because this is the first point every route shares with the delivery already on `main`: the\nnormal and resume paths after STEP 7's merge, the recovery path at 2.4 where STEP 7 was skipped. Not\nbefore the merge — a ticket reading `done` for work that never landed is a lie a refused merge would\nleave behind. It reads the plan before the third removal below deletes the local copy.\n\n"
  },
  {
    "name": "STEP 8 removal list",
    "text": "**Order is forced**, because a branch checked out in a worktree cannot be deleted:\n\n1. **The worktree**, if one exists. **Its absence is the normal case, not an error** — work done on a branch in the main clone has none, and STEP 8 skips this silently.\n2. **The branch**, local and remote.\n3. **The local originals this delivery archived** — the plan, its ledger and any `--review-v*` companion in `docs/plans/`, the design doc in `docs/brainstorming/`, and this plan's files in `docs/evidence/`. **Every member `add-plan-authoring` lists, and nothing else.**\n\n"
  }
];

test('the planned path of done is still present, byte for byte', () => {
  const done = read(DONE);
  for (const { name, text } of PLANNED_PATH) assert.ok(done.includes(text), `changed or lost: ${name}`);
});

test('add-plan-authoring names the fix record, its changelog key, its archive member and its ticket carrier', () => {
  const a = read(AUTHORING);
  assert.match(a, /^\| The fix record \| `docs\/plans\/YYYY-MM-DDTHHMMSS-FIX--<slug>\.md` /m);
  assert.match(a, /written only by `\/add-framework--done --fix`, never by hand/);
  assert.match(a, /`-fix-<slug>`/);
  const home = a.split('## The Delivered Home')[1].split(/^## /m)[0];
  assert.match(home, /^\| `fix\.md` \|/m);
  assert.match(home, /in place of `plan\.md` and `ledger\.md`/);
  const ticket = a.split('## The Ticket')[1].split(/^## /m)[0];
  assert.match(ticket, /fix record/);
  assert.match(ticket, /only from `--ticket`/);
});

test('add-plan-authoring resolves --fix through the three sources and keeps plans on PLAN-- only', () => {
  const a = read(AUTHORING);
  const res = a.split('## Argument Resolution')[1].split(/^## /m)[0];
  assert.match(res, /`--fix <slug>` resolves `\*-FIX--<slug>`/);
  assert.match(res, /docs\/delivered\.jsonl/);
  assert.match(res, /docs\/deliveries\/\*-FIX--<slug>\//);
  assert.match(res, /docs\/plans\/\*-FIX--<slug>\.md/);
  assert.match(res, /never resolves as a plan/);
  assert.match(res, /docs\/deliveries\/<id>\/fix\.md/);
});
