# Plan: Next-step command carries the path — brainstorm, plan and build close on a paste-ready `/<command> <path>` line

> **Status:** implemented
> **Layers:** both
> **Type:** workflow
> **Created:** 2026-10-07
> **Delivery:** confirm
> **Ticket:** 0024B

---

## Objective

When brainstorm, plan or build closes, its last line is the next command carrying the full relative path of the file it just wrote (`/<command> <path>`), so the user copies one line and pastes it — no argument to assemble, no guessing which file of a same-timestamp set is meant.

[Copied from the intent file's `## Objective`, with one change: the `@` before `<path>` is dropped, by
the user's decision of 2026-10-07 (see Plan Changelog). No design document exists — this is a `bounded` path.]

**When this build is done:** the three internal closings print one paste-ready continuation line, under
one rule owned by `add-final-report`, and every stage that receives a plan argument (plan, build, done)
resolves a plain relative path exactly as it resolves a slug today.

**Ticket done when:** Cada fechamento de brainstorm, plan e build imprime o próximo comando com o caminho relativo completo do arquivo escrito (formato `/<comando> @<caminho>`), e um teste ou checagem do workbench prova que o caminho impresso existe em disco.

[The line above is the ticket's `done_when`, quoted verbatim. Its `@` is superseded by the user's
decision of 2026-10-07: the format delivered is `/<comando> <caminho>`.]

## Context

Today the internal closings print a placeholder the user must fill: `/add-framework--plan [idea]`
(brainstorm), `/add-framework--build [slug]` and `/add-framework--plan [slug]` (plan). The build prints
no next command at all. A plan set shares one timestamp, so a slug fragment is ambiguous by
construction. The product layer solved the same pain in ticket 0018B; this is the internal equivalent
and does not touch the product.

**Every decision here was taken in the intent file below and confirmed at STEP 4, except the `@`
prefix, which the user dropped on 2026-10-07. This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-07T132126-next-step-command-carries-path-intent.md` | The `bounded` path, the single owner (`add-final-report`), the per-stage lines, the Argument Resolution change, the proof approach, the exclusions. Its `@<path>` format is superseded — see Validated Decisions |

## Global Constraints

- Nothing under `framwork/` changes — `git status --porcelain framwork/` lists only the gitignored `artefact-graph.json` (intent `## Decided`: "Out of scope: product `framwork/.codeadd/skills/add--final-report/SKILL.md`"; ticket 0024B note: "não pede para mudar o product")
- Line format `/<command> <relative path>` — plain path, no `@` (user decision 2026-10-07, superseding intent `## Decided` "Format `/<command> @<relative path>`")
- The printed path is the file the step itself wrote, checked with `test -f` before printing, never rebuilt from the slug (intent `## Decided`)
- Argument Resolution keeps every STOP branch exactly as written today (`add-plan-authoring/SKILL.md:591-593`; compatible with `planless-close-out.md:98`)
- The build never loads `/add-framework--done` (`add-framework--build/SKILL.md:623`: "Neither state hands off to `/add-framework--done`.")
- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)

## Problem

1. **The next command arrives incomplete** — brainstorm and plan print `[idea]` / `[slug]`, which the
   user must replace by hand; build prints no next command.
2. **A slug is ambiguous inside a set** — every member of a plan set shares one timestamp, so a slug
   fragment can match several files.
3. **A path argument stops two stages today** — Argument Resolution matches the argument as a
   substring of a basename (`add-plan-authoring/SKILL.md:586-593`). `docs/plans/<file>.md` is not a
   substring of any basename, so build (`:162`) and done (`:129`) fall into "No match → STOP". The plan
   stage tolerates a `docs/brainstorming/` path only by interpretation (`add-framework--plan/SKILL.md:118-123, 156`).

## Proposal

One rule, one owner. `add-final-report` gains **The Continuation Line**: the format, the `test -f`
check, the provider spelling, the plan-set case, and its position as the last line of the metadata.
Brainstorm, plan and build point at it from the closing step they already load it at. Argument
Resolution learns to normalise a plain path first, so every line the closings print resolves on arrival.

**Sequencing:** the failing test first; then the resolution, because without it the new plan and build
lines make build and done STOP; then the rule; then the closings that point at it.

## Scope

### Includes

- **F1** [product] — `cli/tests/next-step-command-carries-path.test.js` (new): the text-assertion suite
  specified as L1 below, same approach as `cli/tests/chat-continuation-handoff.test.js`. Written RED
  against the current tree before F2. Tagged `[product]` because `cli/` is a product path; it tests
  only `workbench/` text and changes nothing under `framwork/`.

- **F2** [internal] — `workbench/skills/add-plan-authoring/SKILL.md` § Argument Resolution: before the
  match, strip any directory part and a trailing `.md`; then run the existing basename substring
  match. A bare slug passes through unchanged. The three outcome bullets (one match / more than one →
  STOP / no match → STOP) and the companion exclusions stay byte-identical. Serves plan, build and done.
  - **Produces:** Argument Resolution accepts a plain relative path

- **F3** [internal] — `workbench/skills/add-final-report/SKILL.md`: new section `## The Continuation Line`.
  It states: the format `/<command> <relative path>`, with no `@`; that the path is the file the
  closing step itself wrote, checked with `test -f` before printing and never rebuilt from a slug —
  **the check binds a chat closing; a document's own `## Next Steps` names its own path without it**,
  because that file is still being composed when the line is written; spelling by the provider's
  `slashCommands` capability — `/<name> <path>` where it is `true` (claude, opencode), and the bare
  skill name `<name> <path>` where it is `false` (codex, which loads a command as a skill by name) —
  with the path identical on all three, and the next stage reading it as a literal argument; that it
  is the **last line of the metadata** — L94's "next-step commands" is reworded to point at this
  section so the two do not become two owners; that other command lines (such as
  `/add-framework--plan <path>` to revise) may precede it and use the same plain-path form; a plan set
  prints one line per plan that has F-blocks, in set order; automatic delivery prints the same line
  before loading the next stage; and who never prints one (a closing that wrote no file the next stage
  reads — backlog, release, sync, done, a direct build, a spike).
  - **Produces:** `## The Continuation Line`

- **F4** [internal] — `workbench/skills/add-final-report/SKILL.md`, **ruler item 3 (Mandatory form)**.
  Evidence from the audit: L17 "**Load this at the closing step, not at STEP 1.**" is a plain sentence
  rather than an `IF … ⛔ DO NOT … ✅ DO` gate. Fix: turn it into that gate block near the top. The LANG
  header the auditor also asked for is NOT added — no internal skill carries one (see Validated
  Decisions).

- **F5** [internal] — `workbench/skills/add-final-report/SKILL.md`, **ruler item 7 (No filler)**.
  Evidence from the audit: "Write the Deleted row even when none" at L73, L167, L183, L191; "Report
  before metadata" at L46, L190; "Name host and step" at L75, L168, L192; "Print the command's own
  artefact whole" at L87-90, L185, L193; "Never load at the start" at L17, L196. Fix, copy by copy:
  **`## Rules` loses L190, L191, L192, L193 and L196**; it keeps L197 ("Trade a mandatory fact for the
  shape") and L198 ("Merge this skill with its product sibling") under `NEVER:`, and the empty
  `ALWAYS:` heading goes. Kept as the stated copy: L46 (report before metadata), L73 + self-check L167
  + rationalization L183 (Deleted row), L75 + self-check L168 (host and step), L87-90 + rationalization
  L185 (artefact whole), F4's gate (load at closing). The self-check and the rationalization table are
  untouched — each is a decision-point tool, not a restatement. **Behaviour-preserving: no rule is
  removed or changed** — each of the five rules is still stated at least once.

- **F6** [internal] — `workbench/skills/add-plan-authoring/references/plan-template.md:188` and
  `workbench/skills/add-plan-authoring/SKILL.md` § Completion — The Closing Report: the template's
  `## Next Steps` replaces `/add-framework--build [slug]` with `/add-framework--build docs/plans/<this plan's basename>.md`
  and points at the rule; the Completion section's "next-step commands" points at it too.
  - **Consumes:** `## The Continuation Line` (F3)

- **F7** [internal] — `workbench/skills/add-framework--plan/SKILL.md`:
  (a) Operation Mode (L118-119) shows a plain `<path>` is accepted for a plan; the free-text
  `/add-framework--plan [idea]` form stays;
  (b) **Operation Mode, before the "resolve the argument BEFORE reading anything else" sentence
  (L123-124)**, gains a written routing rule: a bare slug or a path under `docs/plans/` goes to Argument
  Resolution (Continue Mode); a path outside `docs/plans/` never reaches Argument Resolution — it is the
  new-idea input read from that file. An intent file is read as the intent file at STEP 1.2; a design
  document is read as the design, and its intent file is the `<design basename>-intent.md` beside it
  when `test -f` finds one (the architectural pair shares one timestamp), otherwise there is no intent
  file and STEP 4 runs in full. STEP 1.2 points back at this rule. It must sit before the resolution,
  because F2 strips the directory and an intent path would otherwise fall into "No match → STOP". This
  replaces today's interpretation-only behaviour;
  (c) STEP 7 metadata (L491) prints `/add-framework--build docs/plans/<basename>.md` and
  `/add-framework--plan docs/plans/<basename>.md` to revise, per the rule, the build line last; on a
  plan set, one build line per plan with F-blocks, in set order. On `automatic`, the same line is
  printed before loading the build.
  - **Consumes:** Argument Resolution accepts a plain relative path (F2); `## The Continuation Line` (F3)

- **F8** [internal] — `workbench/skills/add-framework--build/SKILL.md`: Operation Mode (L143) shows a
  plain `<path>` is accepted; STEP 10 metadata ends with `/add-framework--done <the plan path resolved
  at STEP 1.1>`, per the rule. A direct build prints no such line. L623's "Neither state hands off to
  `/add-framework--done`" stays verbatim — the line is printed, done is never loaded.
  - **Consumes:** Argument Resolution accepts a plain relative path (F2); `## The Continuation Line` (F3)

- **F9** [internal] — `workbench/skills/add-framework--brainstorm/SKILL.md`: STEP 7.3 replaces
  `Run: /add-framework--plan [idea]` and the `Intent:` line with `/add-framework--plan <the intent file
  written above>`, printed last per the rule; the `Design:` line stays on `architectural` as a
  reference; the "brainstorm stops here" line moves above the command line; on `automatic` the same
  line is printed before loading the plan. The design template's `## Next Steps` (L622) prints
  `/add-framework--plan <this design document's path>` — the intent file does not exist yet when the
  design is written, and F7(b) routes a design path to its intent pair. Spike unchanged: no line.
  - **Consumes:** `## The Continuation Line` (F3)

- **F10** [internal] — `workbench/skills/add-framework--done/SKILL.md` Operation Mode L106 and its
  examples at L109-111: show that `[plan]` may be given as a plain path, with one `docs/plans/…` example.
  L131 (the no-argument branch) is unchanged. Done only receives the form; it emits no continuation line.
  - **Consumes:** Argument Resolution accepts a plain relative path (F2)

### Does NOT Include (important!)

- `framwork/.codeadd/skills/add--final-report/SKILL.md` and anything else under `framwork/` — ticket
  0018B delivered the product side; the ticket asks not to change it.
- Done as an emitter of a continuation line — it is the terminal stage.
- A continuation line on a direct build — there is no plan to point at; planless close-out is plan
  `2026-09-16T100332-PLAN--planless-close-out`.
- Any new script — the `test -f` check is a step instruction, the proof is a test.
- A LANG header on `add-final-report`.
- An `@` prefix on the path, in any provider — dropped by the user on 2026-10-07.
- **Recorded, not fixed:** `add-framework--build/SKILL.md:23` declares `- handoff: add-framework--done`
  while `:623` says neither state hands off to it. The `uses:` line creates a `HANDS_OFF_TO` edge the
  body denies. Out of scope here; a candidate ticket of its own.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where the rule lives | `add-final-report`, once | Intent `## Decided`; the three closings already load it |
| Position vs L94 | Last line of the metadata; L94 points at the section | Audit note, item 5/6 |
| Path prefix | Plain path, no `@` | User decision 2026-10-07, superseding the intent's `@<relative path>` |
| Path handling | Strip directory and `.md`; then the existing substring match; STOPs unchanged | User decision 2026-10-07; `planless-close-out.md:98` |
| `docs/brainstorming/` vs `docs/plans/` path at plan | Written routing rule in plan's Operation Mode | Tech lead decision |
| Plan set | One build line per plan with F-blocks, in set order | Confirmed at STEP 4 |
| Direct build / spike | No line | Confirmed at STEP 4 |
| Build line path | The plan resolved at STEP 1.1, never rebuilt | Confirmed at STEP 4 |
| Design template Next Steps | Points at the design's own path; plan finds its intent pair | The intent file is written at 7.3, after the design at 5.3, so it cannot be named with `test -f` at design time |
| LANG header (audit item 3) | Rejected | No internal skill carries one (`add-plan-authoring`, `add-artefact-graph`) |
| Item 7 dedupe | Remove repetition only, change no rule | Tech lead decision |
| This plan's own Next Steps | Slug form, not a path | The build that executes this plan runs the current skill, which cannot yet resolve a path |
| Codex spelling | Bare skill name, `<name> <path>` | `slashCommands: false` (`workbench/provider-map.json:53`); codex loads a command as a skill by its name; the product sibling says "command-as-skill" and names no literal |
| `test -f` scope | Chat closings only; a document's own Next Steps names its own path unchecked | The plan and design files are still being composed when their Next Steps line is written |
| Where plan routes a non-plan path | Operation Mode, before Argument Resolution | Otherwise F2's directory strip sends an intent path into "No match → STOP" |
| F1's layer tag | `[product]` | Derived from the `cli/` path (add-plan-authoring, Layer Tags); the intent's "all `[internal]`" covers artefacts, and a test is not one |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `cli/tests/next-step-command-carries-path.test.js` | product | create | F1 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F2, F6 |
| `workbench/skills/add-plan-authoring/references/plan-template.md` | internal | modify | F6 |
| `workbench/skills/add-final-report/SKILL.md` | internal | modify | F3, F4, F5 |
| `workbench/skills/add-framework--plan/SKILL.md` | internal | modify | F7 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F8 |
| `workbench/skills/add-framework--brainstorm/SKILL.md` | internal | modify | F9 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F10 |

Graph, depth 1 (STEP 3.2): `add-final-report` 9 callers (HIGH), `add-plan-authoring` 4 (HIGH),
`add-framework--build` 3 (HIGH), `add-framework--plan` 2 (MEDIUM), `add-framework--brainstorm` 0 (LOW).
No `uses:` edge is added or removed. `AGENTS.md` does not change.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** F1 writes L1 before F2 lands and runs it against the current tree.

### L1 — Text assertions, `cli/tests/next-step-command-carries-path.test.js` (RED → GREEN)

1. `add-final-report/SKILL.md` contains `## The Continuation Line`, the string `<relative path>`,
   `test -f`, and states the line is the last line of the metadata. *RED today: no such section.*
2. `add-framework--brainstorm`, `add-framework--plan` and `add-framework--build` each name
   `The Continuation Line`. *RED today.*
3. No closing or Next Steps line uses a placeholder argument: no match of
   `/add-framework--\w+ \[(slug|idea)\]` in `add-framework--brainstorm/SKILL.md` or
   `add-plan-authoring/references/plan-template.md`, and none in `add-framework--plan/SKILL.md` outside
   its Operation Mode code block (where `/add-framework--plan [idea]` is a legitimate free-text form).
   *RED today: brainstorm L622/L801, plan L491, template L188.*
4. Argument Resolution in `add-plan-authoring/SKILL.md` states that the directory part and `.md` are
   stripped before the match; its two STOP bullets (`**More than one** → ⛔ STOP` and
   `**No match** → list \`docs/plans/\` and STOP.`) are still present verbatim. *RED today on the first half.*
5. The Operation Mode blocks contain `/add-framework--plan docs/`, `/add-framework--build docs/plans/`
   and `/add-framework--done docs/plans/`. *RED today.*
6. Build STEP 10 contains `/add-framework--done <`; build still contains
   ``Neither state hands off to `/add-framework--done`.`` *RED today on the first half.*
7. `workbench/commands/add-framework--backlog.md`, `-release.md` and `-sync.md` contain neither
   `The Continuation Line` nor a match of `/add-framework--\w+ docs/`. *GREEN today — a preservation guard.*
8. Plan's Operation Mode contains a rule distinguishing a `docs/plans/` path from any other path, and
   it appears BEFORE the "resolve the argument BEFORE reading anything else" sentence (index
   comparison). *RED today.*
9. `add-final-report`'s `## Rules` no longer contains "Write the Deleted row even when it reads" and
   still contains "Merge this skill with its product sibling"; the body still contains the Deleted-row,
   host-and-step, report-before-metadata and artefact-whole statements. *RED today on the first half.*
10. No `@` prefix on a path anywhere the change touches: no match of `/add-framework--\w+ @` and no
    match of `\s@docs/` in the six changed `workbench/skills/*/SKILL.md` files and `plan-template.md`. *GREEN
    today — a guard that the dropped form is not reintroduced.*

### L2 — Build and suite

1. `node scripts/build-workbench.js` exits 0; `node scripts/build.js` exits 0 with no warning beyond the baseline.
2. The full CLI suite via `node scripts/run-tests.js` stays green.
3. `git status --porcelain framwork/` lists nothing but `artefact-graph.json`.
4. `@prompt-review-agent` `mode: confirm` on `add-final-report` for **items 3 and 7** (plus 1 and 2):
   F4 and F5 are the F-blocks citing them. Each of the five rules F5 names is still stated at least once.

### L3 — Behavioural acceptance

1. The build that executes this plan loaded today's text, so its own STEP 10 does NOT print the new
   line — that is expected. After `node scripts/build-workbench.js`, the operator invokes
   `/add-framework--done docs/plans/2026-10-07T144204-PLAN--next-step-command-carries-path.md` by hand,
   and done resolves it to this plan instead of stopping.

**Ticket done-when mapping:** "imprime o próximo comando com o caminho relativo completo" → L1.2, L1.3,
L1.5, L1.6; "prova que o caminho impresso existe em disco" → L1.1 (the `test -f` instruction is in the
rule every closing points at) plus L3.1 (a printed path resolved on disk), as the intent's Proof
decision accepted.

**RED expectations against the current tree:** L1 items 1-6, 8 and 9 fail; items 7 and 10 pass.
**GREEN = all levels pass after F1–F10.**

---

## Execution Order

F1 [product] → F2 [internal] → F3 [internal] → F4 [internal] → F5 [internal] → F6 [internal] →
F7 [internal] → F8 [internal] → F9 [internal] → F10 [internal]

- **F1 first** — the suite must be RED before anything it checks lands.
- **F2 before every closing** — without plain-path resolution, the new plan and build lines make build
  and done STOP.
- **F3 before F6-F9** — they point at the section F3 creates.
- **F4, F5 after F3** — same file; the dedupe must see the new section so it does not cut into it.
- Every boundary from F2 on leaves the tree working: the resolution accepts both forms, and a closing
  not yet updated still prints a resolvable slug.

## Reviewer Handoff

For each F-block the build leaves in its ledger: the files touched, the L1 items covering it and their
state, and any decision altered.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 item was never RED.
2. F5 dropping a rule while "removing repetition" — check each of the five rules still appears once.
3. A STOP bullet in Argument Resolution reworded while F2 added the normalisation.
4. A closing whose continuation line is not the last line of its metadata.
5. An `@` reintroduced before a path, in any closing or usage line.

---

## Next Steps

/add-framework--build next-step-command-carries-path

[Slug form on purpose: the build that executes this plan runs today's Argument Resolution, which does
not yet accept a path. One command executes every F-block, whichever layer each is tagged.]

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-07 | Initial creation |
| 2026-10-07 | Review (fix-then-ok): B1 L1.3 scoped away from plan's Operation Mode `[idea]`; B2 plan's path routing moved into Operation Mode before Argument Resolution (+ L1.8 order check); A1 L3.1 reworded — this run's STEP 10 does not emit; A2 codex spelling fixed as bare skill name; A3 F3 allows preceding command lines; A4 `test -f` scoped to chat closings; A5 ticket done-when mapped to L items; A6 F5 names each kept copy (+ L1.9); N1 line numbers; N2 F10 cites L109-111; N3 F1 tag rationale |
| 2026-10-07 | User decision: the `@` prefix is dropped everywhere — continuation lines print the plain relative path. Title, Objective (marked as a departure from the intent), Context, Global Constraints, Problem 3, Proposal, F2 (strip directory and `.md` only; STOPs unchanged), F3 (format, codex line `<name> <path>`, preceding lines), F6 (template line), F7 (usage, STEP 7 lines), F8 (usage, STEP 10 line), F9 (7.3 and design-template lines), F10 (usage), Does NOT Include, Validated Decisions, L1.1/4/5/6/7 rewritten for the plain path, L1.10 added (no `@` reintroduced), L3.1, Execution Order, Reviewer Handoff gap 5. The ticket's `done_when` stays quoted verbatim with a note. Not re-reviewed — `add-review-discipline` allows `@plan-review-agent` one pass per subject |
| 2026-10-07 | Implemented: F1-F10 in commits 5ecba12, 9fdd3c0, f66496b, 340db69, e226c5c, bdf59d7, eb79339, 5bd6b65, b0e261e, 9c61bca; review fixes F11 in 9e1bb79 |
