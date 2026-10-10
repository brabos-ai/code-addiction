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
    "text": "**When the plan header carries `> **Ticket:**`, make the close-out write now — `awaiting-release` when the ticket read prints `RELEASE_FLOW=yes`, `done` otherwise.** `add-plan-authoring` owns when\nit is skipped, how it is made and every degradation, under **The Ticket** — load it rather than acting\nfrom memory.\n\nThe read is the exact `get <id>` one, and the write is skipped when the ticket already reads `done` or `awaiting-release`. The `--fix` track follows the same rule.\n\nIt runs here because this is the first point every route shares with the delivery already on `main`: the\nnormal and resume paths after STEP 7's merge, the recovery path at 2.4 where STEP 7 was skipped. Not\nbefore the merge — a ticket reading `done` or `awaiting-release` for work that never landed is a lie a refused merge would\nleave behind. It reads the plan before the third removal below deletes the local copy.\n\n"
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

// ---- done: the --fix track ------------------------------------------------------------------------

const section = (text, from, to) => { const i = text.indexOf(from); assert.ok(i >= 0, `no ${from}`); const j = to ? text.indexOf(to, i + from.length) : -1; return text.slice(i, j === -1 ? undefined : j); };

test('Operation Mode carries the --fix line, an example and the one reading rule', () => {
  const done = read(DONE);
  const op = section(done, '## Operation Mode', '## STEP 1');
  assert.match(op, /^\/add-framework--done --fix <slug> \[--ticket <id>\]/m);
  assert.match(op, /^\/add-framework--done --fix \S+ --ticket \d{4}B$/m);
  assert.match(op, /"the plan" in this skill reads "the fix record"/);
});

test('1.2 refuses --fix together with a [plan], resolves the record, and still refuses main', () => {
  const s = section(read(DONE), '### 1.2', '### 1.3');
  assert.match(s, /IF `--fix` AND A `\[plan\]` ARE BOTH GIVEN:\n  ⛔ DO NOT USE: Write on anything\n[\s\S]*?✅ DO: Report the conflict and STOP/);
  assert.match(s, /`--fix <slug>` clause of `add-plan-authoring`'s Argument Resolution/);
  assert.match(s, /derive-from-branch rule does not run/);
  assert.match(s, /refusal to run on `main` still applies/);
  for (const needle of ['> **Kind:** fix', '> **Branch:**', '> **PR:**', '> **Ticket:** <id>', '## What changed', 'git log --oneline main..HEAD', 'git diff --name-status main...HEAD']) assert.ok(s.includes(needle), needle);
});

test('both refusals sit before any resolution, and the redirect paragraph follows the two it sets aside', () => {
  const s = section(read(DONE), '### 1.2', '### 1.3');
  const at = needle => { const i = s.indexOf(needle); assert.ok(i >= 0, needle); return i; };
  const resolve = at("**Resolve `[plan]` by");
  assert.ok(at('IF `--fix` AND A `[plan]` ARE BOTH GIVEN:') < resolve, 'plan refusal after plan resolution');
  assert.ok(at('IF `--ticket` WAS GIVEN WITHOUT `--fix`:') < resolve, 'ticket refusal after plan resolution');
  assert.match(s, /IF `--ticket` WAS GIVEN WITHOUT `--fix`:\n  ⛔ DO NOT USE: Write on anything\n[\s\S]*?✅ DO: Report that `--ticket` belongs to `--fix` and STOP/);
  const between = s.slice(at('When no `[plan]` was given'), at('**With `--fix`, 1.2 resolves'));
  assert.ok(!between.includes('```'), 'something sits between the two paragraphs and the reference to them');
  assert.match(s, /The two paragraphs above do not run/);
});

test('1.2 rebuilds the fix record on every run, reuse included, and stamps the head SHA', () => {
  const s = section(read(DONE), '### 1.2', '### 1.3');
  assert.match(s, /It runs on every normal-path run, including when source 3 returned a local record/);
  assert.match(s, /keeps its `id`/);
  assert.match(s, /`## Validation` it carries is dropped/);
  assert.match(s, /`> \*\*Head:\*\*` the output of `git rev-parse HEAD`/);
  assert.match(s, /On the resume path \(2\.5\) the record is the committed one and is not rebuilt/);
});

test('--fix is named in the description, the intro and the STEP summary', () => {
  const done = read(DONE);
  assert.match(done.split('\n')[2], /With --fix, closes a plan-less fix/);
  assert.match(section(done, 'Closes out a delivered plan', '---'), /with `--fix`, a plan-less fix/);
  const steps = section(done, 'STEP 1: Collect context', '**⛔ ABSOLUTE');
  for (const needle of ['the fix record with --fix', 'the fix gate with --fix', 'fix.md with --fix']) assert.ok(steps.includes(needle), needle);
});

test('1.3 reads no ledger on the fix track', () => {
  assert.match(section(read(DONE), '### 1.3', '## STEP 2'), /On the fix track there is no ledger: skip that bullet/);
});

test('the fix gate replaces 2.2 and 2.3 writes ## Validation', () => {
  const done = read(DONE);
  const g = section(done, '### 2.2', '### 2.3');
  assert.match(g, /\*\*The fix gate \(`--fix` only\), in place of the ledger gate\.\*\*/);
  assert.match(g, /non-empty `## What changed`/);
  assert.match(g, /at least one commit/);
  assert.match(g, /`> \*\*Head:\*\*` SHA \*\*equals\*\* `git rev-parse HEAD`/);
  assert.match(g, /A non-empty SHA is not enough/);
  assert.match(g, /ancestor of HEAD/);
  assert.match(g, /IF `--fix` WAS GIVEN:\n  ⛔ DO NOT USE: Read on a ledger/);
  const ci = section(done, '### 2.3', '### 2.4');
  assert.match(ci, /write `## Validation` into the fix record/);
});

test('2.4 is unavailable on the fix track', () => {
  const s = section(read(DONE), '### 2.4', '### 2.5');
  assert.match(s, /2\.4 is unavailable on the fix track/);
  assert.match(s, /IF `--fix` AND 2\.1 ROUTED TO THE RECOVERY PATH:\n  ⛔ DO NOT USE: Write on docs\/delivered\.jsonl/);
});

test('2.5 resume reads the record from the archive when no local copy exists', () => {
  const s = section(read(DONE), '### 2.5', '## STEP 3');
  assert.match(s, /docs\/deliveries\/<id>\/fix\.md/);
  assert.match(s, /no local copy exists/);
});

test('STEP 4 looks up -fix-<slug> and writes verb fix', () => {
  const s = section(read(DONE), '## STEP 4', '## STEP 5');
  assert.match(s, /`docs\/changelog\/\*-fix-<slug>\.md`/);
  assert.match(s, /verb `fix`/);
});

test('6.1 archives fix.md with its own stop and sets the plan + ledger stop aside', () => {
  const s = section(read(DONE), '### 6.1', '### 6.2');
  assert.match(s, /the archive holds `fix\.md`/);
  assert.match(s, /`cmp`/);
  assert.match(s, /IF `--fix` AND THE FIX RECORD CANNOT BE READ FROM THIS WORKING TREE:\n  ⛔ DO NOT USE: Bash to run git commit/);
  assert.match(s, /With `--fix`, the plan \+ ledger stop above does not apply/);
});

test('STEP 8 reads the ticket from the fix record and removes the local fix record as the one original', () => {
  const s = section(read(DONE), '## STEP 8', '## STEP 9');
  assert.match(s, /fix record's `> \*\*Ticket:\*\*` line/);
  assert.match(s, /third removal's member list is the local fix record/);
});

test('STEP 9 names the track', () => {
  assert.match(section(read(DONE), '## STEP 9', '## Rules'), /\*\*The track, when `--fix` was given\*\*/);
});

test('--merge is still the only merge method', () => {
  const done = read(DONE);
  assert.match(done, /gh pr merge --merge/);
  assert.doesNotMatch(done, /gh pr merge[^\n]*--(squash|rebase)/);
});
