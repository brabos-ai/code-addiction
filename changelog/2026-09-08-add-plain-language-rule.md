# Plain language rule — no invented figures of speech

**Date:** 2026-09-08
**Plan:** `docs/plans/2026-09-08T121115-PLAN--plain-language-rule.md`
**Layer:** product

## What changed

The framework had rules for how an agent structures what it writes and how it compresses
it, and none for figurative language. An agent could write "confirm the tests bite" instead
of "run the tests and check they fail against the broken code", and nothing stopped it. That
costs the reader a translation step, and it costs most in a session that is not in English,
where an invented figure has no equivalent at all.

Two deliveries, one rule.

**`add-doc-schemas` → Universal Rules → Voice** now carries the canonical statement. That
skill is loaded by 13 of the 16 product commands, which is why it owns the rule rather than
the block that compresses it.

**A user project's `CLAUDE.md`** gets a `## Writing Style` managed block, written by
`/add.wiki` STEP 6 and delimited by `[//]: # (codeadd-style:start)` / `end`. It reuses the
Project Knowledge Base mechanism unchanged — same marker syntax, same replace-or-append
semantics, same verbatim-copy constraint — and STEP 7 carries it into `AGENTS.md` and
`GEMINI.md` at no extra cost.

## The two things that make the rule usable

**It binds the writing, not the language of the writing.** One statement in English governs
output in every language. This is not incidental: an invented figure is precisely the class
of writing with no counterpart to translate into, so the rule and the multi-language
requirement are the same requirement.

**Established technical terms of figurative origin are kept.** `branch`, `tree`, `cache`,
`pipeline`, `parent`, `orphan`, `handler`, `race` are the literal names of their concepts.
A rule without this carve-out would forbid `parentNode` and be discarded on first contact.
The rule targets a figure the writer invents to stand in for a mechanism.

The block says outright that it is **not a list of banned words** and must not be turned into
one. A word list holds in one language only, which is the failure the rule exists to prevent.

## A defect fixed on the way

`/add.wiki update` handed its whole run to `add-wiki-maintenance`, which never writes
`CLAUDE.md` by its own rule. So the managed blocks only ever landed on a first generation —
every project that had already run the command once would never have received them, and
never received a refresh of the Project Knowledge Base block either.

Update mode now runs items 1, 4 and 5 of the STEP 6 prompt plus all of STEP 7, and is
forbidden everything else by name: no Architecture Contract, no Technical Spec, no recomputed
app table. It was surgical everywhere else and it stays surgical here.

## Files

| Action | File |
|---|---|
| Created | `cli/tests/plain-language-rule.test.js` |
| Modified | `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` |
| Modified | `framwork/.codeadd/skills/add-claude-md-style/SKILL.md` |
| Modified | `framwork/.codeadd/commands/add.wiki.md` |
| Modified | `framwork/.codeadd/skills/add-token-efficiency/SKILL.md` |
| Deleted | none |

`add-token-efficiency` gets a routing line only, no rule text: its own Overview limits it to
compression patterns, and a second copy of a rule is a second thing to drift.

## Validation

21 levels, written RED before any of it landed: 16 failed against the pre-change tree, 5 are
regression guards that passed by design and say so in their test names. All 21 pass now.
`node scripts/build.js` exits 0 with no warning. The full CLI suite is 38 files and 855
tests, all passing.

## What this does not do

Nothing enforces the rule. `add.review`, `add.audit` and `add-health-check` were not taught
to flag a violation — this is guidance in context, not a gate. And a project that never runs
`/add.wiki` has no framework-written `CLAUDE.md`, so it receives the rule only through
`add-doc-schemas`, whenever a command loads it.
