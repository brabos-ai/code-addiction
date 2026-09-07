---
name: add-feature-readback
description: "Use when a feature's docs are closed and you need a cold reader to say back what they understood before anyone builds — catches docs that pass every review and still make the reader build the wrong thing."
metadata:
  category: technique
  triggers: readback, comprehension, cold read, doc ambiguity, before building, what did you understand
---

# add-feature-readback — Cold-Read Comprehension Readback

<!-- uses:
- skill: add-plan-review
- mention: add-code-review
- mention: add-doc-schemas
- mention: add-qa
- agent: consistency-agent
- agent: plan-reviewer-agent
- agent: readback-agent
-->

## Overview

A **readback** is the aviation protocol: the tower gives an instruction, the pilot repeats it back in their own words, and the tower listens for the mismatch. Nobody asks the pilot "was the instruction clear?" — the pilot's own restatement is the test.

This skill applies that to feature documentation. You read a feature's docs cold, with nothing else, and report **what you understood is going to be built**. You do not grade the docs. You do not ask questions. You say it back.

The signal lives in the parent's hands, not yours. The parent agent has the conversation that produced the docs; you do not. Where your readback diverges from what was actually decided, **the document is what failed** — you are the instrument, not the suspect. A doc can satisfy every rubric in this repo and still steer a reader into building something else; that class of failure is invisible to a reviewer that asks "is this well written?" and visible only to a reader who says what they'd go build.

Your blindness is the whole mechanism. Reading the source code, the referenced features, or the originating conversation would let you repair a gap in your head and report a comprehension the document never actually delivered. That is the one way to make this skill worthless.

## When to Use

- A feature's documentation set is closed (`about.md` + `epic.md` + subfeature docs written and fixed) and the flow is about to move into building.
- Dispatched as a subagent **after** the adversarial reviewer's fixes land, so the parent holds two independent reports — see [Pairing](#pairing--the-two-report-setup). Four commands do this today, each at the step that closes a document:

| Command | Step | `scope` |
|---|---|---|
| `add.new` | STEP 8, after the plan-reviewer verdict, before Completion | `feature` |
| `add.plan` | STEP 13, after the verdict, before STEP 14 | `subfeature` |
| `add.brainstorm` | STEP 5, after the verdict, before STEP 6 | `document` |
| `add.plan-to-ready` | STEP 3 plan leg, after the verdict **and** after the consistency pass | `subfeature` |

- Manual: the user asks "read this and tell me what you understood" or wants a comprehension check before building.

## When NOT to Use

- **Docs still being drafted.** The point is testing the final text. A mid-edit doc produces findings that are already being fixed.
- **In parallel with the rubric review.** Run AFTER `@plan-reviewer-agent` and after its fixes are applied. Running alongside tests a version of the document that will not exist.
- **Judging code, schema compliance, or delivery.** Not this skill — `add-code-review`, the gate in `add-doc-schemas`, `add-qa`.
- **Grading one document against a rubric or a schema.** That is `add-plan-review`, which returns a verdict and required fixes. Reading one document *cold, for comprehension* is squarely this skill — that is what `scope: document` is for, and `add.brainstorm` dispatches exactly that. The line is not how many documents you get; it is whether you are grading them or saying them back.

## Boundary — this vs. the pre-delivery reviewer

Two artefacts read closed docs in fresh context. They split on the question each one asks:

| Question asked | Owner | Output shape |
|---|---|---|
| "Can this be executed? What breaks?" | `@plan-reviewer-agent` (`add-plan-review`) | Verdict — `ok` / `fix-then-ok` / `blocked`, plus required fixes |
| **"Will whoever reads this build the right thing?"** | **this skill** | **A restatement + every gap the reader silently filled** |

⛔ **You never ask a question.** That is the hard line, and the easiest one to cross by accident. Where a reviewer writes *"What happens when the provider is down?"*, you write *"The docs don't say what happens when the provider is down. I assumed the turn fails with an error message. If it should retry instead, I'd build the wrong thing."* You answer your own question, out loud, and expose the answer for checking. A questionnaire hands the work back; a readback shows what the work would have produced.

## Input

The caller passes a **target** and a **scope**. No schema name and no doc type — you are never told what to check against, only what to read.

| `scope` | Target | Reading set |
|---|---|---|
| `feature` (default) | a feature folder, or a feature ID under `docs/features/` | the whole folder, recursively |
| `subfeature` | a feature folder plus the subfeature id in play | the folder's top-level `.md` plus that one subfeature's subtree — **no sibling subfeature** |
| `document` | one file path | that file alone |

**Why `subfeature` excludes siblings.** Divergence between two subfeatures belongs to `@consistency-agent`, which judges it on five named dimensions. Reading siblings here would duplicate that owner and make the read grow quadratically across an epic. The exclusion is a boundary, not a shortcut.

**What goes empty under `document`.** A single file cannot support a build order, a disagreement between documents, or a fact that fails to reach the builder's document. Those three sections are omitted — never filled with "none". The restatement, the gaps you filled, the forks and your confidence all still apply, and they are the part that catches a reader heading down the wrong line.

## What you read — and what you must not

**Read every `.md` in the feature folder, recursively**, including `subfeatures/*/`. Typically: `about.md`, `discovery.md`, `epic.md`, `past-features.md`, and per subfeature `about.md`, `design*.md`, `plan*.md`, `tasks.md`.

Two directories are excluded, always:

| Excluded | Why |
|---|---|
| `_superseded/` (when present) | Replaced drafts. Reading them makes you report a comprehension built partly on text no builder will ever see. Not every project has this directory. |
| `_tests/` | QA run evidence (JSON captures, screenshots). Delivery output, not specification. |

Non-`.md` files (`iterations.jsonl`) are process telemetry — skip them.

Where several docs disagree in weight, the specification docs (`about.md`, `epic.md`, `design.md`, `plan*.md`) define what will be built. A `changelog.md` or `review-NNN.md` in the folder describes what already happened; read it, but never let it become your account of the scope.

### ⛔ Out of bounds — no exceptions

- **Source code.** Even when a doc cites `file.ts:539`. Especially then — whether the doc stands up without the reader opening that file IS the measurement.
- **Other features' docs.** A `{{doc:0027H}}` reference you cannot follow is not an obstacle; it is a finding. Report what you could and could not infer about it from the local text.
- **`.codeadd/wiki/`, `CLAUDE.md`, git history, GitNexus, memory, the web.**
- **The conversation that produced the docs**, even if it is in your context or summarized in a doc.

**Anti-rationalization.** Every one of these will feel justified in the moment: *"I'll just confirm what `runTurn` does"*, *"one grep and this reference resolves"*, *"the wiki would clear this up in a second"*. Each of those looks like diligence and is the exact opposite: the moment you fill a gap from outside the folder, you report comprehension the document did not produce, and the gap ships to the builder unrecorded. **A reference you cannot resolve from the folder alone is a result, not a blocker.** Write it down and move on.

## How you work

### 1. Read the whole folder before writing anything

Read every in-bounds file front to back first. A readback written while reading reports the first doc's framing and rationalizes the rest into it.

### 2. Say it back in your own words — never the doc's

**The paraphrase test:** if you quote or lightly reword the doc's sentence, you have proved nothing. Copying is what a reader does when they did not understand. Restating in different words is the only thing that can fail — and its failing is the point.

When you catch yourself unable to say something without the doc's own phrasing, that is not a style problem. It means you did not understand it. Say so, and drop the confidence rating for that area. Do not smooth it over by copying.

### 3. Mark every gap you filled

You will fill gaps automatically — that is what reading is. The job is catching yourself doing it. Each time you needed a fact the docs did not give and you supplied it yourself, record three lines:

- **What the docs don't say**
- **What I assumed**
- **What I'd build wrong if the assumption is wrong** ← the line that makes it actionable

Without the third line it is a list of doubts. With it, the parent sees the cost of the ambiguity and can rank it.

### 4. Report every fork

A gap is the docs saying *nothing*. A fork is the docs saying something that carries two readings. For each: quote the phrase (short), give both readings plainly, say which one you took and why. Do not resolve it silently because one reading seems obviously intended — "obviously intended" is exactly the assumption that gets built wrong.

### 5. Check that each concrete fact survives to the doc that will actually be read

A folder can hold every fact and still fail, because **nobody reads the folder — they read one document.** A concrete mechanism (a function name, an env-var format, an API, a column) often appears once at the top level (`epic.md`, the feature's `about.md`) and never again in the `about.md`/`plan.md` of the subfeature that has to implement it. For the person building that subfeature from its own document, the fact does not exist.

For every concrete mechanism you found anywhere in the folder, note where it lives and whether it reappears in the document of the subfeature that implements it. When it does not, that is a finding — even though the folder as a whole is complete.

This is not a gap and must not be filed as one. A gap is *the folder does not say it*; this is *the folder says it in a place the builder will not open*. Filing it as a gap sends the parent looking for missing content that is actually already written.

### 6. Derive the build order yourself

State what you would build, in what order, and what each piece delivers. If the folder has an `epic.md` with subfeatures, do not copy its order — derive one from the dependencies you understood, then note any disagreement with the stated order. Matching orders is a good signal; a divergence is a strong one.

### 7. Rate your confidence per area

Per subfeature (or per theme, when there are none): high / medium / low, one line of why. Low confidence with a reason is more useful than a fluent summary that hides it.

## Language rules

The user reads this report. Write for them, not for a rubric.

- **Same language as the docs you read — section headings included.** This skill is written in English; your report is written in whatever language the doc set is written in. Do not assume it matches this skill.
- Short sentences, one idea each. Plain everyday words.
- A technical term from the docs is allowed once you explain it in one line. An unexplained term is a term you may not have understood.
- No hedging filler ("it appears that", "presumably"). You either understood it, assumed it, or didn't — all three have their own place in the report, and none of them is a hedge.
- Never pad a section to look thorough. Two real gaps beat nine invented ones.

## Output format

Markdown, prose inside the sections. No JSON — the consumers are a reasoning agent and a human. Omit any section that would be empty; never write "none" filler.

The skeleton below is written in English because this skill is. **Emit it in the language of the documents you read, headings included** — if the doc set is written in Portuguese, `### What I understood is going to be built` goes out as `### O que eu entendi que vai ser construido`. Translating the structure is expected; a report in a language the reader does not use is a failed report no matter how correct it is.

```markdown
## Readback: <feature id> — <feature name>

**Read:** <N> documents (<short list: about, epic, N subfeatures...>)

### What I understood is going to be built

<One or two paragraphs, your own words, plain language. What the feature
delivers and for whom. If you cannot say it without copying the doc, say so.>

### How I would build it

<The order you derived and what each piece delivers. If the docs state an
order and yours differs, say where and why.>

### Where I filled a gap myself

1. **<subject>**
   - The docs don't say: <the missing fact>
   - I assumed: <your assumption>
   - If I'm wrong: <what would get built wrong>

### Phrases that carry more than one reading

1. **<doc>#<section>** — "<short excerpt>"
   - Reading A: <...>
   - Reading B: <...>
   - I took: <A or B>, because <...>

### Where two documents disagree

1. **<docA>#<section>** says <...>; **<docB>#<section>** says <...>. I followed <...>.

### Facts that never reach the builder's document

1. **<the concrete mechanism>** — lives in **<doc>#<section>**, absent from
   **<doc of the subfeature that implements it>**. Whoever builds <SF> from
   its own document alone never learns <what>.

### What would stop me before the first line of code

<Only what genuinely blocks. If nothing blocks, say so in one sentence.>

### Confidence

| Area | Confidence | Why |
|---|---|---|
| <subfeature or theme> | high/medium/low | <one line> |

### In one sentence

<What you would build, in one sentence. This is the line the parent agent
compares against what was actually decided.>
```

## Example

**Input:** `docs/features/0042F-notifications` (about.md + 2 subfeatures).

**Excerpt of the emitted report.** Note that it ships in the documents' language, not this skill's — that is the rule working, not a slip:

```markdown
### Onde eu preenchi lacuna sozinho

1. **Quem recebe a notificação**
   - Os documentos não dizem: se a notificação vai para o dono do item ou
     para todos que comentaram nele.
   - Eu assumi: só o dono, porque a seção Usuários só cita o dono.
   - Se eu estiver errado: eu construiria a tabela sem lista de destinatários,
     e incluir os comentaristas depois viraria migração de schema.

### Frases que aceitam mais de uma leitura

1. **about.md#Escopo** — "notificações são marcadas como lidas"
   - Leitura A: o usuário marca, com um clique.
   - Leitura B: o sistema marca sozinho quando a tela é aberta.
   - Eu segui: A, porque a SF02 fala em "ação de marcar". Mas a SF01 lista
     `read_at` como preenchido na abertura, o que é a leitura B.
```

```markdown
### Fatos que não chegam ao documento de quem vai construir

1. **O canal de entrega (websocket, e não polling)** — está em **epic.md#Subfeatures**,
   na linha da SF02, e não aparece em **subfeatures/SF02-entrega/about.md**. Quem
   construir a SF02 lendo só o documento dela escolheria o mecanismo por conta
   própria, e o épico já decidiu.
```

The gap item is worth more than any summary paragraph: it names a decision nobody made, and prices it as a future migration. The fork item found a real contradiction between two subfeatures while doing nothing but restating them. The third item is the subtlest of the three — nothing is missing from the folder, and the folder is exactly what nobody reads.

## Pairing — the two-report setup

This skill is the second of two independent reports over the same closed docs. The order is fixed, not a preference:

| # | Agent | Reads | Returns |
|---|---|---|---|
| 1 | `@plan-reviewer-agent` (`add-plan-review`) | The doc + its schema | A verdict + required fixes |
| 2 | `@readback-agent` (this skill) | The doc set | What it understood + what it filled in |

**The reviewer runs first and its fixes are applied before this skill is dispatched.** Running the two together would have the readback report on text that is about to be edited — a comprehension of a version that never ships. Both run in clean context and neither sees the other's output. The parent agent — the only one holding the original conversation — reads both and edits the docs.

**How the parent reads the pair:**

| Readback | Adversarial | Meaning |
|---|---|---|
| Matches what was decided | clean | Docs are coherent. Proceed. |
| Matches what was decided | blockers | Docs communicate well but have execution holes. Fix the holes. |
| **Diverges** | clean | **The dangerous case.** Docs read fine and steer wrong. Nothing but a readback finds this. |
| Diverges | blockers | Docs are not ready. Rewrite the diverging section before anything else. |

⛔ **A divergence is a defect in the document, never in the agent.** Treating a readback miss as "the subagent misread it" throws away the only signal this skill produces — the reader on the other end of the real handoff gets exactly as much context as this agent got, and no chance to be corrected.

### Variant — inside an autonomous loop

`add.plan-to-ready` dispatches this skill from a loop that is forbidden to stop for the user. Three things change there, and nothing else does:

| | Interactive parent | Autonomous loop |
|---|---|---|
| Compared against | the conversation that produced the docs | the **Decision Log** — never the docs just read, which is circular and always matches |
| On divergence | present it and stop for the user | apply the fix, re-run the schema gate, re-dispatch once, carry on |
| Can it end the run? | the user decides | **no.** This skill issues no verdict, so there is nothing to block on. A real blocker still has to come from the reviewer or the consistency judge |

The report itself is identical in both. The difference lives entirely in what the parent does with it.

## Constraints

- **Read-only.** Never edit any file, including the docs you read.
- **Bound to the doc set you were given.** Nothing outside it: no code, no sibling subfeature the scope excluded, no other feature, no wiki, no version history, no memory, no conversation.
- **No questions.** Answer your own, out loud, as marked assumptions.
- **No fixes, no advice.** You do not propose wording, scope, or design. The parent decides.
- **No verdict.** No pass/fail, no severity scale, no score. You report comprehension; grading belongs to the other two agents.
- **One readback per invocation.** Any loop belongs to the dispatching command.

## Anti-Patterns

| Wrong | Right |
|---|---|
| Opening `assistant.service.ts` because the doc cites a line in it | The doc citing a line you cannot read IS the test — report what you got from the local text |
| Following `{{doc:0027H}}` to another feature folder | Report what you could and couldn't infer about that reference from here |
| "The doc says the engine is replaced by the SDK" (quoting) | "The bot's conversation loop stops being project code and moves to a third-party library" (paraphrasing) |
| "What happens if the provider is down?" | "The docs don't say what happens if the provider is down. I assumed the turn errors out. If it should fail over, I'd build it wrong." |
| A fluent summary with no gaps section | The gaps section is the deliverable; the summary is the setup for it |
| Copying `epic.md`'s subfeature order into "How I would build it" | Derive the order from what you understood, then compare it to the stated one |
| Treating the folder as one document, so a fact stated anywhere counts as stated | Ask where each concrete mechanism lives, and whether the subfeature that implements it repeats it — the builder opens one document, not the folder |
| Filing "the epic names it but the subfeature doesn't" as a gap | That is its own section — the content exists; it just never reaches the reader who needs it |
| Padding to nine gaps to look thorough | Report the real count, even if it is one |
| Softening low confidence into confident prose | Say "baixa" and why — the honest rating is the useful one |

## Checklist

```
[ ] Read every in-bounds .md in the folder, recursively, before writing
[ ] _superseded/ and _tests/ never opened (neither is guaranteed to exist)
[ ] No source code, no other feature's docs, no wiki, no git, no memory, no conversation
[ ] Unresolvable {{doc:...}} references reported as findings, not chased
[ ] Understanding written in own words — no doc sentence copied or lightly reworded
[ ] Output written in the docs' language, section headings included, short sentences, terms explained
[ ] Every gap carries all three lines, including "what I'd build wrong"
[ ] Every fork quotes the phrase and states both readings plus the one taken
[ ] Every concrete mechanism traced to whether it reaches the subfeature doc that implements it
[ ] Facts that stop at the top level reported in their own section, never as gaps
[ ] Build order derived independently, then compared against the doc's stated order
[ ] Confidence rated per area with a one-line reason
[ ] Closing one-sentence statement present — it is what the parent compares
[ ] Zero questions asked; zero fixes proposed; zero verdict issued
[ ] Empty sections omitted, no "none" filler, no padded counts
```
