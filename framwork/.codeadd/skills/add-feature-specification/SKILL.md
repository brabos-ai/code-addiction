---
name: add-feature-specification
description: Single writer of about.md — reads the brainstorm intent file, extracts closed decisions without asking, and asks only what is still open. Loaded by /add.new and by /add.brainstorm when it continues into authoring.
---

# Feature Specification

<!-- uses:
- skill: add-doc-schemas
- command: /add.new
- command: /add.brainstorm
- mention: add-feature-discovery
- mention: /add.plan
-->

**The single writer of `about.md`.** Two entry points load this skill and both produce the same
document from the same rules: `/add.new`, and `/add.brainstorm` when the user accepts its offer to
continue straight into authoring.

**Principle:** Document WHAT and WHY, not HOW.

## When to Use

- Writing or completing `about.md`, from either entry point.
- Requirements changed, or scope expanded, and the document must follow.

### When NOT to Use

- Technical analysis of the codebase — that is `add-feature-discovery`.
- Technical implementation planning — that is `/add.plan`, which writes `plan.md`.
- Allocating a feature id, creating its directory, running the schema gate or dispatching a reviewer.
  **All four are orchestration and belong to the command that loaded this skill**, never here. A skill
  that allocates an id behaves differently depending on who called it, which is the one thing a single
  writer exists to prevent.

---

## Phase 1: Check State

Read `docs/features/[FEATURE_ID]/about.md`.

| State | Action |
|---|---|
| Does not exist / empty | Phase 2 |
| Partially filled | Phase 2, for the missing sections only |
| Complete | Phase 2 decides whether anything changed |

## Phase 2: Read the Intent File, Then Ask Only What It Left Open

**The calling command resolves the intent file and hands it over.** It is
`docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>-intent.md`, written by `/add.brainstorm`, and its shape is
the `brainstorm-intent` schema in `{{skill:add-doc-schemas/SKILL.md}}`.

### 2.1 Extract, do not re-ask

```
IF A DECISION APPEARS UNDER `## Decided` IN THE INTENT FILE:
  ⛔ DO NOT: Put it to the user again, in any form
  ⛔ DO NOT: Re-derive it, re-word it as a confirmation question, or offer alternatives to it
  ✅ DO: Carry it into about.md as a settled decision, with the rationale the file gave it
```

**This prohibition is the reason this skill exists.** A question already answered, asked again, is
what made the old questionnaire feel like an interrogation about things the user had just decided.

`## Prior art` fills the document's account of what already exists. `/add.brainstorm` STEP 1 already
ran the INDEX and GRAPH steps that produced it, so nothing here runs them again for an entry the file
already names.

### 2.2 What to ask

| `## Open` reads | Ask |
|---|---|
| The literal `None` | Nothing. Go to 2.3 |
| One or more bullets | Those items, and only those — one question per turn |
| The section is absent, empty, or the file is missing | The full set of questions this skill would ask with no input at all |

⛔ **A `## Open` section that is present but empty is read as absent.** A missing signal means "not
closed", never "closed". Falling the wrong way here produces a document built from decisions nobody
made.

**Every question carries a concrete recommendation** — which option this skill would take and why,
drawn from the codebase and from what the intent file already settled. Ask through the provider's
structured-question tool where the `structuredQuestions` capability says one exists; otherwise present
an option table with the recommendation marked.

### 2.3 The confirmation screen

**With nothing left open, the user still sees what is about to be written — once, in one screen.**

It restates the decisions being carried into `about.md` and stops, so an extraction error can be
corrected. It is not a questionnaire and must not become one: it asks for a correction, not for
answers.

⛔ **The approval never scales away, only the interrogation does.** The calling command owns the
`[STOP]` around this screen.

### 2.4 The three-fact test — how much document this work needs

Run it when the intent file names no `path:`, or when there is no intent file. Three facts:

1. **Intent gaps** — is there a decision a builder would have to guess?
2. **Irreversible actions** — a migration, a data deletion, a public contract change, an external
   integration?
3. **Footprint** — more than a handful of files, or an area no delivered feature has touched?

**Clean on all three takes the light path: a compact `about.md` and no decomposition.** Any flag takes
the full one. The ratchet is one-way — the classification may rise mid-run and never falls.

⛔ **This skill owns the test; the calling command applies its result.** The classification is
authoring input. What the command does with it — whether it dispatches discovery agents, whether it
runs a reviewer — is orchestration, and neither side restates the other's half.

## Phase 3: Write the Document

**Load the `feature` schema from `{{skill:add-doc-schemas/SKILL.md}}` and write against it.**

```
IF ABOUT TO WRITE THE DOCUMENT:
  ⛔ DO NOT: Carry a template in this skill, or reconstruct one from memory
  ✅ DO: Load the schema and follow its sections, depth floors and hard bans
```

⛔ **The schema is the single owner of that shape.** A template kept here drifts from it, and the
drift is invisible until the two disagree — at which point the validation gate rejects a document this
skill told someone to write.

Write extractively: requirements, not implementation. **`add-doc-schemas` owns the update discipline**
under its Cache Documental rule — follow it rather than a copy kept here.

### 3.1 `## Relations`, `## Observations` and `tags:`

**These are mandatory sections of the `feature` schema, so this skill writes them on BOTH entry
points.** A rule kept in the calling command would apply on one path and not the other, and produce
two different documents from one schema.

The calling command hands over whatever it has — a `past-features.md` Related Features table, a
`RELATED_WORK` set, a `discovery.md` naming prerequisites, and the intent file’s `## Prior art`.
Some entry points supply all four and some supply only the last. Write from what arrived.

| Material in hand | Becomes |
|---|---|
| A prerequisite this feature cannot ship without | `- depends_on [[<id>]] — <the one-line reason given>` |
| The parent epic, when this `about.md` is a subfeature | `- part_of [[<parent id>]]` |
| Any other related feature | Leave it out. `related:` already carries it, and an untyped edge is not this skill’s to invent |

```
IF NO PREREQUISITE AND NO PARENT EPIC ARRIVED:
  ⛔ DO NOT: Ask the user which feature this one depends on
  ⛔ DO NOT: Invent a `depends_on` from the conversation
  ✅ DO: Write `## Relations` carrying the single word `None`
```

⛔ **`add-doc-schemas` owns the rule that nobody is asked**, in its Relations & Observations section.
What is specific here is the provenance: every edge comes from material the caller handed over, never
from a question.

Write `tags:` from the domains the confirmed decisions settled — bare lowercase words. Write
`## Observations` from the same material: measurements and constraints no other section holds. Empty
is valid.

**A required layer is never excluded.** A new route needs a backend; a new field needs a database; a
feature the user must see needs a frontend. Excluding a layer the feature cannot work without
produces a document that reads complete and specifies something unusable.

## Phase 4: Persist

Write the file. **The validation gate is the calling command's**, and it runs after this skill
returns — see When NOT to Use.

---

## Checklist

- [ ] Intent file read, and every `## Decided` item carried in without being re-asked
- [ ] Only `## Open` items were put to the user
- [ ] Every question asked carried a concrete recommendation
- [ ] The confirmation screen was shown, and the user's corrections applied
- [ ] `about.md` written against the `feature` schema, with no template invented here
- [ ] Problem, users and value stated
- [ ] Requirements and business rules carry ids
- [ ] No required layer excluded
- [ ] Scope states what is included AND what is not
- [ ] Decisions carry their rejected alternative
- [ ] `## Relations` written from material handed over, or carrying `None`
- [ ] `## Observations` and `tags:` written from the same material
- [ ] No HOW mixed into the WHAT — technical analysis belongs to `add-feature-discovery`

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "I'll confirm the decided items just to be safe" | That is the interrogation this skill removed. They were decided |
| "`## Open` is empty, so everything is closed" | Empty is absent. Absent means not closed — ask the full set |
| "I'll keep a small template here for speed" | It drifts from the schema, and the gate rejects what this skill told someone to write |
| "The command didn't say which path, I'll assume light" | Run the three-fact test. An assumption is not a measurement |
| "I'll allocate the id since I'm already writing the file" | Orchestration. The command owns it, and a skill that does it behaves differently per caller |
