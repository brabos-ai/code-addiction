# Plan: Plain Language Rule — a managed CLAUDE.md block plus a Voice rule that bans invented figures of speech

> **Status:** implemented
> **Type:** skill + command
> **Created:** 2026-09-08
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

The framework tells agents how to structure what they write (`add-doc-schemas`), how to compress it
(`add-token-efficiency`) and what belongs in a project's `CLAUDE.md` (`add-claude-md-style`). None of
them says anything about **figurative language**. An agent is free to write "confirm the tests bite"
instead of "run the tests and check they fail against the broken code", and no rule stops it.

That costs the reader a translation step, and it costs it worst in a non-English session, where an
invented figure has no equivalent and lands as noise.

**No design doc exists.** The exploration ran inside `/add-framework--shared-brainstorm` and was cut
short when the user asked for the plan directly, so this plan carries the decisions inline. It states
what the text must contain and must not contain — never the text itself.

Owner decisions taken during that exploration, before this plan was written:

| Question | Answer |
|---|---|
| Which layer | Product — the rule ships to every project that installs codeadd |
| Which outputs it binds | All of them, including code comments and identifiers |
| How it is delivered | A managed block in the project's `CLAUDE.md`, plus the rule in the skills that govern writing |

## Global Constraints

- Managed-block markers are link-reference-definitions `[//]: # (name:start)` / `[//]: # (name:end)`, **never** HTML comments: "the build pipeline strips HTML comments (`<!-- -->`) from command sources uniformly" (add-claude-md-style/SKILL.md, Project Knowledge Base (managed block))
- `CLAUDE.md` budget: "Target: 80-150 lines total (the managed Project Knowledge Base block is ~15 lines and is accounted for within this budget)." (add-claude-md-style/SKILL.md, Format Rules)
- "numeric advisories (`<200 words`, etc.) are prohibited in any rule constraining agent output" (add-doc-schemas/SKILL.md, Output Length Doctrine)
- Doc prose language: "Follow the `language` field in `owner.md` (e.g. `pt-br`, `en-us`); default to English when the field is unset" — while "Technical terms (commit, branch, frontmatter, chunk, schema, hook) stay in English regardless of the owner's language setting." (add-doc-schemas/SKILL.md, Universal Rules → Language)
- `add-token-efficiency` already routes this class of concern away from itself: "CLAUDE.md style and content rules → use `{{skill:add-claude-md-style/SKILL.md}}`" and "This skill covers compression *patterns* only" (add-token-efficiency/SKILL.md, When NOT to use / Overview)
- `add-wiki-maintenance` will not do this work: "This skill never touches CLAUDE.md (owned by `/add.wiki` STEP 6)." (add-wiki-maintenance/SKILL.md)
- A name appearing in an artefact's prose with no declared relationship to it **fails the build** (CLAUDE.md, Build Transform Details)
- `lintResourcePaths()` warns on raw `.codeadd/` paths; `{{cmd:}}` / `{{skill:}}` variables resolve **per provider** at build time (CLAUDE.md, Pipeline / Resource Path Variables)
- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- No new artefact is created, so `framwork/provider-map.json` is not touched (CLAUDE.md, Distribution rules)

## Problem

1. **No rule exists.** Searched both layers: no command, skill or agent carries any guidance on
   metaphor, simile, analogy or figurative language. `add-doc-schemas` → `### Voice` bans aspirational
   language, marketing copy and abstractive summarization — and stops there.
2. **The gap is worst across languages.** An invented English figure has no counterpart in `pt-br` or
   any other `owner.md` language. It is the one class of writing that breaks on translation, and the
   framework already ships a language switch (`add-doc-schemas` → `### Language`) with nothing
   constraining the writing itself.
3. **A naive ban would be destructive.** `branch`, `tree`, `cache`, `pipeline`, `parent`, `orphan`,
   `handler`, `race` are all figurative in origin and are the literal names of their concepts. A rule
   that does not carve them out would forbid `parentNode` and be discarded on first contact.
4. **`/add.wiki update` never touches `CLAUDE.md`.** Update mode hands the whole run to
   `add-wiki-maintenance`, which states it never touches that file. So a project that already has a
   wiki — that is, every existing installation — would never receive the block, and today never
   receives a refresh of the Project Knowledge Base block either. This is a pre-existing defect that
   this change would otherwise inherit.

## Proposal

Three moves, in dependency order.

**One canonical rule, in the skill with the widest reach.** `add-doc-schemas` is loaded by 13 of the
16 product commands (`graph.js impact add-doc-schemas --depth 1` → 20 direct dependants). Its
`## Universal Rules` → `### Voice` already holds the sibling bans. The rule goes there, with the
carve-out for established technical vocabulary and an explicit statement that it binds the output
regardless of the language `owner.md` selects.

**One managed block in the project's `CLAUDE.md`, following the mechanism already in place.**
`CLAUDE.md` is injected into every session, which is what a rule binding chat, docs, commits and code
comments needs — a skill is loaded on demand, `CLAUDE.md` is not. The block reuses the Project
Knowledge Base pattern exactly: `[//]: # ()` markers, replace-or-append, template text owned by
`add-claude-md-style`, written verbatim by `/add.wiki` STEP 6, copied to `AGENTS.md` and `GEMINI.md`
by STEP 7 at no extra cost.

**Repair the update path, because without it the change reaches nobody who already installed.**
Update mode gains the managed-block portion of STEP 6 and all of STEP 7 — and only that. Architecture
Contract and Technical Spec stay untouched in update mode, so `add-wiki-maintenance`'s surgical-edit
discipline is not violated.

Two decisions here narrow what the owner approved during exploration, and both are recorded in
**Validated Decisions** below: `add-token-efficiency` does not receive the rule text, and the rule
targets invented figures rather than every figurative word.

## Scope

### Includes

- **F1** — `framwork/.codeadd/skills/add-doc-schemas/SKILL.md`: `## Universal Rules` → `### Voice` gains
  the figurative-language rule. It must state four things: the rule itself (describe the action,
  mechanism or state directly; do not substitute a figure of speech for it); that it binds every text
  the agent produces, including code comments and identifiers; that it binds the output whatever
  language `### Language` selects; and the carve-out — established technical terms with figurative
  origins are the literal names of their concepts and are kept, the rule targets figures invented to
  stand in for a mechanism. **Must NOT lose** the four existing `### Voice` bullets. **Must NOT**
  introduce a numeric advisory (Global Constraints), and **must NOT** be a list of banned words.
  - **Produces:** `VOICE_NO_FIGURATIVE` — the canonical rule statement in `### Voice`
- **F2** — `framwork/.codeadd/skills/add-claude-md-style/SKILL.md`: a new `### Writing Style (managed
  block)` subsection under `## Section Templates`, carrying the verbatim block exactly as the Project
  Knowledge Base subsection carries its own. The block's required elements are fixed by this plan (see
  **Block content contract** below); its marker pair is `[//]: # (codeadd-style:start)` /
  `[//]: # (codeadd-style:end)`; its H2 inside `CLAUDE.md` is `## Writing Style`; its replace-or-append
  semantics are identical to the existing block's. **Must NOT lose** the existing Project Knowledge
  Base subsection or its rationale paragraph on why HTML comments cannot be used. The 14-line cap in
  the contract below governs a **literal, verbatim, non-generated** template block — the same category
  as the 17-line Project Knowledge Base block already carried here — and is therefore not the kind of
  numeric advisory the Output Length Doctrine bans, which targets agent-generated prose.
  - **Consumes:** `VOICE_NO_FIGURATIVE` (F1) — the block says the same thing in fewer lines and must
    not contradict it
  - **Produces:** `codeadd-style:start` — the marker pair and the verbatim block text
- **F3** — `framwork/.codeadd/skills/add-claude-md-style/SKILL.md`: `## Format Rules` budget line
  updated so it accounts for **both** managed blocks instead of one and states their **combined total**
  as a single figure, and `## Validation Checklist`
  gains one item asserting the Writing Style block is present with its markers. The 80-150 target
  itself does not change. The same edit corrects the stale figure in that line: the Project Knowledge
  Base block is **17 lines**, markers included, not the "~15" currently written. **Must NOT** turn the
  budget note into a per-block numeric rule on generated prose — it describes fixed verbatim blocks,
  which is what the existing note already does.
  - **Consumes:** `codeadd-style:start` (F2)
- **F4** — `framwork/.codeadd/commands/add.wiki.md`: STEP 6's agent prompt gains a fifth numbered task
  writing the Writing Style managed block, with the same replace-or-append instruction and the same
  "copied verbatim from this prompt — do not paraphrase it" constraint the Project Knowledge Base block
  carries; its `## REPORT FORMAT` gains one line. STEP 7's three-file verification list gains an
  assertion that both marker pairs survive into `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`. STEP 6's
  existing `## OUTPUT FORMAT` bullet — "Managed block copied verbatim from this prompt — do not
  paraphrase it" — is singular and must be pluralised to cover both blocks. **Must NOT lose** the
  legacy "Implementation Patterns" deletion instruction, the `NEVER use HTML-comment syntax` warning,
  or the existing ordering of the prompt's numbered tasks.
  - **Consumes:** `codeadd-style:start` (F2)
  - **Produces:** `WRITING_STYLE_BLOCK` — the STEP 6 report line reporting `WRITTEN` or `REPLACED`
- **F5** — `framwork/.codeadd/commands/add.wiki.md`: `## Invocation Modes` — after
  `add-wiki-maintenance` returns, update mode runs the managed-block portion of STEP 6 and all of
  STEP 7. **Must NOT** regenerate `## Architecture Contract` or `## Technical Spec` in update mode, and
  **must NOT** move `CLAUDE.md` ownership out of `/add.wiki` STEP 6 — `add-wiki-maintenance`'s own text
  asserts it never touches that file and stays true.
  ⚠️ **This F-block WIDENS scope beyond the three owner decisions.** It is a plan-author call, the
  mirror image of the two narrowing calls in **Validated Decisions**. It repairs a pre-existing defect
  that predates this work (update mode never refreshing `CLAUDE.md`), and it is included because
  without it the block reaches only projects that have never run `/add.wiki` — which is the opposite of
  the intended audience. Drop F5 and the delivery still works for new projects only.
  - **Consumes:** `codeadd-style:start` (F2), `WRITING_STYLE_BLOCK` (F4)
- **F6** — `framwork/.codeadd/skills/add-token-efficiency/SKILL.md`: one routing line added to
  `## When NOT to use`, sending prose voice and figurative-language questions to `add-doc-schemas`.
  **No rule text here.** **Must NOT** restate the rule — the skill's own Overview limits it to
  compression patterns, and a second copy is a second thing to drift.
  - **Consumes:** `VOICE_NO_FIGURATIVE` (F1)
- **F7** — `cli/tests/plain-language-rule.test.js` (new): the Red-Green Validation Matrix below, in the
  established shape of `cli/tests/loop-consolidation-0070.test.js` — vitest, reading the product-layer
  markdown off disk and asserting its content. **Must NOT** be written after the F-blocks it covers.

#### Block content contract (fixes F2, asserted by F7)

The Writing Style block MUST contain, each identifiable by an assertion:

1. The rule: describe the action, mechanism or state directly; do not substitute a figure of speech.
2. Its reach: chat replies, generated docs, commit messages, PR descriptions, code comments, identifiers.
3. Language independence: it binds the writing, not the language of the rule; it holds in whatever
   language the output uses.
4. The carve-out for established technical vocabulary, with concrete examples of kept terms.
5. A self-test phrased without language-specific vocabulary — a question of the form *does this sentence
   name the action, or name something the action resembles?*
6. Exactly one bad-to-good pair, labelled as an illustration of the device.
7. An explicit statement that this is not a list of banned words.

The block MUST NOT contain: a list of forbidden words; a `{{cmd:}}` / `{{skill:}}` / `{{addpath:}}`
variable of any form (it would resolve per provider and land wrong in the user's file); the name of any
framework artefact (the build's prose gate would fail on an undeclared relationship); an HTML comment.

Hard cap: **14 lines**, both markers included — a fixed verbatim block, sized against the 17-line
Project Knowledge Base block that precedes it.

**The cap was checked against a draft layout before being fixed, and it fits in 13 lines**, so the
builder is not being asked to invent a silent trade-off: two markers, one blank line after each, one
H2, one rule sentence, and five bullets. Elements **6 and 7 share one bullet** — the bad-to-good pair
and the statement that it illustrates the device rather than listing banned words are one sentence.
Elements 1 through 5 take one line each. If the builder's prose genuinely cannot fit, the element to
merge is 2 into 1 (reach folded into the rule sentence); **dropping any element is not a permitted
trade-off** — every one of the seven is asserted individually by L1.3.

### Does NOT Include (important!)

- **This repository's own `CLAUDE.md`.** The owner scoped the work to the product layer. No artefact is
  created or deleted and no pipeline stage changes, so the derived Project Anatomy counts stay correct
  and nothing here needs `/add-framework--self-plan`.
- **`.claude/` internal commands and skills.** Same reason, and `/add-framework--build` cannot reach
  them.
- **A `## Materializes` contract for `/add.wiki`.** The command declares none today, and `CLAUDE.md`
  records the coexistence as deliberate: contract-based staleness for materialized state, git-based
  `.meta.json` for corpus-derived docs. Adding one is a separate change.
- **Any new skill, command or agent.** The rule lands in artefacts that already exist.
- **Enforcement in review or audit.** `add.review`, `add.audit` and `add-health-check` are not taught to
  flag violations. The rule is guidance in context, not a gate.
- **Projects that never run `/add.wiki`.** They have no `CLAUDE.md` written by the framework, so they get
  the rule only through F1 — `add-doc-schemas`, whenever a command loads it. That is the fallback the
  owner's delivery choice already implies, not a defect introduced here.
- **Retrofitting existing user `CLAUDE.md` files automatically.** F5 makes `/add.wiki update` deliver the
  block, but the user still has to run it.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| Which layer | Product | Owner call during exploration |
| Which outputs the rule binds | Every text the agent produces, code comments and identifiers included | Owner call during exploration |
| How it is delivered | Managed `CLAUDE.md` block **and** the rule in the writing-governing skills | Owner call during exploration |
| Which skill owns the canonical rule | `add-doc-schemas` → `### Voice` | 20 direct dependants, 13 of 16 commands (`graph.js impact --depth 1`); `### Voice` already holds the sibling bans |
| Does `add-token-efficiency` carry the rule text | **No** — one routing line only | **Narrows an owner-approved decision.** The skill's Overview limits it to compression patterns and its `When NOT to use` already routes style questions elsewhere. Rule text there contradicts its stated boundary and creates a third copy to drift |
| Does the rule ban every figurative word | **No** — only figures invented to stand in for a mechanism | **Narrows an owner-approved decision.** `branch`, `cache`, `parent`, `pipeline` are figurative in origin and are the literal names of their concepts; a blanket ban would forbid `parentNode` |
| How "any language" is guaranteed | By banning the *device* and stating the rule binds the output language, never by listing words | A word list is English-only; it is dead weight in a `pt-br` or `ja` session and cannot be extended to every language |
| Marker syntax | `[//]: # (codeadd-style:start)` / `end` | HTML comments are stripped from command sources at build (Global Constraints) |
| Where the block sits in `CLAUDE.md` | After the Project Knowledge Base block | Both are machine-owned; keeping them adjacent keeps the hand-written region contiguous |
| Who writes it | `/add.wiki` STEP 6, in both invocation modes | Single writer already established; `add-wiki-maintenance` explicitly refuses the file |
| Does update mode regenerate the whole file | No — managed blocks and STEP 7 only | Preserves the surgical-edit discipline of update mode |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| The rule sits in context every session, not only when a skill loads | ~14 lines of the 80-150 `CLAUDE.md` budget, on top of the 17 already spent |
| The block reaches `AGENTS.md` and `GEMINI.md` for free via STEP 7 | The block text exists in two files (skill template + command prompt), like the Project Knowledge Base block already does — mitigated by the L2 drift assertion |
| Existing installations finally get `CLAUDE.md` refreshed on `/add.wiki update` | Update mode stops being purely wiki-scoped; it now also rewrites two blocks in `CLAUDE.md` |
| One canonical rule in the skill 13 commands load | Nothing enforces it — a violation is invisible to every gate |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| The block is read as a word blacklist and someone extends it into one | Medium | Contract item 7 requires the block to say it is not one; F1 forbids a word list in the skill; L1 asserts both |
| The rule forbids `parentNode`, `branch`, `cache` and gets ignored wholesale | Medium | The carve-out is contract item 4 and an F1 requirement; L1 asserts the carve-out and at least three kept examples |
| A `{{...}}` variable inside the block resolves per provider and lands wrong in the user's file | Medium | F2 bans it; L1 asserts the block contains no `{{` |
| Markers written as HTML comments are stripped at build; the block silently never lands | Low | F2 fixes the syntax, F4 keeps the existing warning; L2 asserts no HTML-comment form of either marker exists in either source |
| The skill template and the command prompt drift apart | Medium | L2 asserts both managed blocks are byte-identical between the two files after trailing-space normalisation (verified identical for the wiki block today, 17 lines) |
| `CLAUDE.md` exceeds its line budget once two fixed blocks are in it | Medium | F3 updates the budget note and the checklist; the 14-line cap is contract-fixed and asserted by L1 |
| Update mode starts regenerating Architecture Contract and breaks surgical-edit discipline | Medium | F5 restricts it to the managed blocks and STEP 7; L3 asserts the update routing names only those |
| An artefact name inside the block trips the build's prose relationship gate | Low | F2 bans artefact names in the block; L4 runs the build and asserts exit 0 with no new warning |

## Ecosystem Impact

| Component | Necessary action |
|---|---|
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | `### Voice` gains the canonical rule (F1) |
| `framwork/.codeadd/skills/add-claude-md-style/SKILL.md` | New `### Writing Style (managed block)` template (F2); budget note and validation checklist updated (F3) |
| `framwork/.codeadd/commands/add.wiki.md` | STEP 6 prompt + report line, STEP 7 verification (F4); `## Invocation Modes` update path (F5) |
| `framwork/.codeadd/skills/add-token-efficiency/SKILL.md` | One routing line in `## When NOT to use` (F6) |
| `cli/tests/plain-language-rule.test.js` | Created — the validation matrix (F7) |
| `framwork/provider-map.json` | No change — no artefact created, renamed or removed |
| `<!-- uses: -->` blocks of the three touched skills and `add.wiki` | No change — no new relationship is introduced; `add-claude-md-style` already declares `mention: add-doc-schemas` and `add-token-efficiency` already declares `skill: add-doc-schemas`. Verified by L4 |
| A user project's `AGENTS.md` / `GEMINI.md` | Receive the block with no code change, via the existing STEP 7 copy. Asserted by F4's verification list |
| This repository's `CLAUDE.md`, `.claude/`, `.opencode/` | No change — see **Does NOT Include** |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** F7 is written and every level below is confirmed failing against the current
tree before F1 lands. A level that passes today does not bite.

### L1 — Block content contract (RED → GREEN)

Against `framwork/.codeadd/skills/add-claude-md-style/SKILL.md`:

1. A `### Writing Style (managed block)` subsection exists under `## Section Templates`. *RED today: absent.*
2. The block delimited by `[//]: # (codeadd-style:start)` and `[//]: # (codeadd-style:end)` exists and is **≤ 14 lines**, markers included. *RED today: the markers do not exist.*
3. Each of the seven contract elements is present and separately identifiable. *RED today: none exist.*
4. The carve-out names **at least three** kept technical terms. *RED today: no carve-out.*
5. The block contains no `{{` sequence. *Coupled to L1.2 — it can only bite once the block exists, so it is asserted in the same test and is not counted as an independently RED level.*
6. The block contains no `<!--`. Same coupling as L1.5.
7. The block contains no framework artefact name, checked against the node names emitted by `scripts/graph.js`. Same coupling as L1.5.
8. `## Format Rules`'s budget line names **both** managed blocks and states their **combined** line count as a single total, and no longer carries the stale "~15 lines" figure for the Project Knowledge Base block. *RED today: the line names one block and says "~15".* **F3's first coverage — F3 has no coverage outside L1.8 and L1.9, so neither is optional.**
9. `## Validation Checklist` contains an item asserting the Writing Style block is present with its `codeadd-style` markers, and the pre-existing Project Knowledge Base checklist item survives unchanged. *RED today: the item is absent.* **F3's second coverage.**

### L2 — No drift between the two copies

1. The Project Knowledge Base block is byte-identical between `add-claude-md-style/SKILL.md` and `add.wiki.md` after trailing-space normalisation. *GREEN today (17 lines each) — a regression guard, not a RED level.*
2. The Writing Style block is byte-identical between the same two files. *RED today: it exists in neither.*
3. Neither source file contains `<!-- codeadd-style:start -->` or `<!-- codeadd-wiki:start -->` in any form. *GREEN today for the wiki marker; the style marker becomes meaningful after F2.*

### L3 — `add.wiki` wiring

1. STEP 6's agent prompt contains a numbered task for the Writing Style block, carrying both the replace-or-append instruction and the verbatim-copy constraint. *RED today: absent.*
2. STEP 6's `## REPORT FORMAT` declares `WRITING_STYLE_BLOCK`. *RED today: absent.*
3. STEP 7's verification list asserts both marker pairs in all three context files. *RED today: it verifies existence only.*
4. `## Invocation Modes` update routing names the managed-block portion of STEP 6 and STEP 7, and names **neither** `Architecture Contract` **nor** `Technical Spec`. *RED today: update mode names neither STEP.*
5. `add-wiki-maintenance/SKILL.md` still states it never touches `CLAUDE.md`. *GREEN today — asserted so F5 cannot silently move ownership.*

### L4 — Canonical rule and build health

1. `add-doc-schemas/SKILL.md` → `### Voice` contains the rule, the reach statement, the language-independence statement and the carve-out, and contains no list of banned words. *RED today: absent.*
2. `### Voice`'s four pre-existing bullets are all still present. *GREEN today — regression guard.*
3. `add-doc-schemas/SKILL.md` introduces no numeric advisory on agent output. *GREEN today — regression guard.*
4. `add-token-efficiency/SKILL.md` → `## When NOT to use` routes voice questions to `add-doc-schemas`, and the file contains no copy of the rule statement. *RED today on the first half.*
5. `node scripts/build.js` exits 0 and emits no warning absent from a baseline captured before F1. *GREEN today — regression guard against the prose relationship gate and `lintResourcePaths`.*
6. `cd cli && npm test` passes, and `npm run test:package` passes. *GREEN today — regression guard.*

### L5 — Behavioural acceptance

1. Given a `CLAUDE.md` with no `codeadd-style` markers, STEP 6's instruction set produces one appended block; given one with the markers, it produces a replacement and no duplicate. Asserted by reading the prompt's instruction, not by running the agent.
2. Given a project with an existing wiki, the update routing reaches the managed-block work — traced through `## Invocation Modes` into STEP 6 and STEP 7 with no dead end.
3. The block, read alone with no surrounding framework context, tells a reader what to do without naming any framework file. Asserted as L1.7 plus a manual read recorded in the evidence file.

**RED expectations against the current tree:** L1.1–L1.4, L1.8, L1.9, L2.2, L3.1–L3.4 and L4.1/L4.4 fail before any
F-block lands. L2.1, L2.3, L3.5, L4.2, L4.3, L4.5 and L4.6 are regression guards and pass today — the
evidence file must record that distinction, because a guard mistaken for a RED level is a level nobody
proved. **GREEN = every level passes after F1–F6.**

---

## Execution Order

`F7 (RED) → F1 → F2 → F3 → F4 → F5 → F6`

- **F7 first**, and confirmed failing, because the whole matrix is the proof the rest is correct.
- **F1 before F2** because F2's block is a compression of F1's rule; writing the short form first
  invites the long form to be reverse-engineered from it and lose the carve-out.
- **F2 before F3 and F4** because both consume the marker pair and the block text F2 fixes.
- **F4 before F5** because F5 routes into the STEP 6 work F4 adds.
- **F6 last** — it is a one-line pointer at a rule that must already exist to be pointed at.

The framework is in a working state after F1 (the canonical rule stands alone), after F4 (full
generation delivers the block) and after F6. A build that must stop should stop at one of those.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-reading anything. For each
F-block the build leaves, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state, with RED levels and regression guards
  listed separately.
- **The exact block text as shipped**, once, so the reviewer can check it against the seven contract
  elements without reconstructing it.
- **Any decision deferred or altered**, with the plan line it departs from and why.

Specific gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — L2.1, L2.3, L3.5, L4.2, L4.3, L4.5 and
   L4.6 pass today by design, and a build that lists them as proof of new work is hiding an untested
   change.
2. **A rule that reads as a word blacklist.** The single most likely failure. If the shipped block or
   the `### Voice` bullet enumerates forbidden words in any language, contract item 7 was written and
   then contradicted by the surrounding text.
3. **A missing or token carve-out.** A carve-out naming fewer than three concrete terms, or naming them
   without saying they are kept, fails the purpose while passing a careless read of L1.4.
4. **Update mode over-reaching.** F5 passing L3.4 while the prose still implies a full `CLAUDE.md`
   regeneration in update mode.
5. **The two block copies diverging by a character** that trailing-space normalisation hides — check
   L2.2 asserts on content, not on line count.

## References

- Design set: none — exploration ran inside `/add-framework--shared-brainstorm` and was cut short; decisions are carried in **Validated Decisions** above
- Prior art this plan builds on: the Project Knowledge Base managed block in `add-claude-md-style` and `add.wiki` STEP 6 — the marker syntax, the replace-or-append semantics and the two-copy layout are taken from it unchanged
- Test shape: `cli/tests/loop-consolidation-0070.test.js`
- `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` — `## Universal Rules` → `### Voice`, `### Language`
- `framwork/.codeadd/skills/add-wiki-maintenance/SKILL.md` — the `CLAUDE.md` ownership statement F5 must not invalidate

---

## Next Steps

/add-framework--build plain-language-rule

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-08 | Initial creation |
| 2026-09-08 | Implemented on `feat/plain-language-rule`, F7 → F1 → F2 → F3 → F4 → F5 → F6, commits `df7064e..df60fd6`. Matrix 21/21 green, build.js clean, CLI suite 38 files / 855 tests passing. Three rulings in the build ledger, two of them corrections to this plan's own validation spec (L2.3 and L3.4). |
| 2026-09-08 | Review v02 fixes: L1.8 no longer claims to be F3's "only" coverage (it contradicted L1.9's "second coverage" label); F3 and L1.8 now agree that the budget line states a single combined total, not two separate figures |
| 2026-09-08 | Review v01 fixes: L1.8/L1.9 added so F3 has validation coverage (was the only uncovered F-block); F5 flagged as a plan-author scope *widening*, mirroring the two narrowing flags; F2 states why the 14-line cap is not the numeric advisory the Output Length Doctrine bans; the cap's feasibility recorded (13-line draft layout, elements 6+7 share a bullet, dropping an element is not a permitted trade-off); F3 also corrects the stale "~15 lines" figure to 17; F4 pluralises STEP 6's verbatim-copy bullet |
