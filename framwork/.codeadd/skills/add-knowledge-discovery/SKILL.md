---
name: add-knowledge-discovery
description: Use at the context/discovery step of add.plan, add.hotfix, add.new, add.diagnose, add.review, add.brainstorm — consult the delivery index, then the project wiki (and code knowledge graph), for minimal token cost before dispatching agents.
---

# Knowledge Discovery — Delivery Index and Wiki Consumption Procedure

<!-- uses:
- skill: add-wiki-maintenance
- command: /add.wiki
- mention: /add.done
- script: delivered.sh
- script: status.sh
-->

## Overview

Defines the ONE procedure for consulting the delivery index and `{{addpath:wiki/}}` at a command's existing context step. Six commands load this skill: `add.plan`, `add.hotfix`, `add.new`, `add.diagnose`, `add.review` and `add.brainstorm`. Loading happens where the command already gathers context — never a new preamble.

## When to Use

- `add.plan` after status.sh, alongside recent-context load
- `add.hotfix` at "Consult Knowledge Base" (former "Check Project Patterns")
- `add.new` at Deep Discovery, beside the Codebase Discovery agent
- `add.diagnose` at Load Context
- `add.review` at Bootstrap Context, Gate 2 "Knowledge base" row
- `add.brainstorm` at STEP 1, for the ranked prior-work lookup that replaced its unranked directory sweep
- **`add.hotfix` at STEP 4, the INDEX and GRAPH steps ALONE, INDEX called with `--no-verify`** — triage needs the ranked candidate list before the history agents are dispatched, and that is four steps before the full load at 8.1. Load STEPs 1 and 2 by themselves there; nothing below them runs

## When NOT to Use

- `add.build`, `add.plan-to-ready` — these read `{{addpath:wiki/index.md}}` + the already-known `domains/<area>.md` directly (pages were selected upstream by `add.plan`); do not load this full skill, it duplicates SELECT work already done
- Bug-cause investigation in `add.hotfix` STEPs 4-6 — diagnosis stays history/code-driven and **wiki-blind**; the wiki portion of this skill enters only at fix time. **The INDEX and GRAPH steps are exempt and do enter, INDEX with `--no-verify`.** The rule guards diagnosis against narrative documentation that can lie about the code; neither is narrative about the code — the index records what shipped, in anchored items, and the graph records what delivered documents declare about each other — so withholding them inverts the rule's purpose. **Both are used at that step to RANK what the history agents look at, never to conclude anything about current behaviour**, which is the same use the index already had there. `--no-verify` is what keeps the exemption honest: a verifying read greps source, and that command forbids reading code before its history agents are dispatched. *(The rationale is inferred: no source states why hotfix is wiki-blind. If its author ever writes the reason down, revisit this exemption.)*
- No wiki exists → this skill still runs (PRESENCE handles absence); do not skip the command's context step waiting for a wiki
- No index exists → same; INDEX no-ops with a note

## The 9-Step Procedure

### 1. INDEX

Ask the cheap question first: **was this built before, and is it still there?** `delivered.sh` answers it from `docs/delivered.jsonl` — one file, one grep — while the wiki costs several pages and answers a different question entirely.

```bash
bash .codeadd/scripts/delivered.sh read "<terms from the task>"
```

Add `--no-verify` when the calling command forbids reading source at that point. Results arrive **already ordered** `live` → `changed` → `superseded` → `gone`, with the latest line per entry applied.

| What you get | What to do with it |
|---|---|
| `live` entries | This exists. Read its `origin` before proposing to build it again |
| `changed` entries | It exists but moved. Documentation elsewhere probably still points at the old path |
| `superseded` entries | It was replaced. Follow `superseded_by` |
| `gone` entries | It was built and is now absent. **The most valuable answer available** — it says this was tried and dropped |

**The read cuts in two buckets — 5 live and 2 dead — and tells you what it cut.** `live` and `changed` fill the live bucket, `superseded` and `gone` the dead one, and the dead slots are never backfilled with live entries. Six keys come back:

| Key | Says |
|---|---|
| `MATCHED_LIVE` / `MATCHED_DEAD` | How many entries matched, per bucket |
| `RETURNED_LIVE` / `RETURNED_DEAD` | How many survived the cut, per bucket |
| `LIVE_CAP` / `DEAD_CAP` | The caps in force. `--limit N` sets the live one only |

```
IF MATCHED_DEAD IS GREATER THAN RETURNED_DEAD:
  ⛔ DO NOT: Conclude the returned dead entries are all there were
  ✅ DO: Narrow the query, or read again with the terms that name the area more exactly
```

**A `gone` result is what stops a plan from rebuilding something the project already abandoned**, which is why it gets reserved slots instead of competing with live entries for one cut. It is not unfiltered: a matching dead set larger than `DEAD_CAP` IS cut, and `MATCHED_DEAD` is how you find out. **You never re-rank what comes back** — the ordering is the read contract's, not yours, and several consumers each sorting one shared result is how two of them come to disagree.

**Pass the terms, not a sentence.** The query is split on whitespace and each term is matched on its own, so an entry hitting more of them ranks higher. A full sentence works; its filler words simply score nothing.

**The index answers *whether*, never *how*.** An entry carries anchored items and, by its format's own rule, no explanation of what the code does. Do NOT stop here and call the area understood: a match tells you where to look next, and the wiki and the code are still what explain it.

**This step is STANDALONE.** It loads and runs on its own, without PRESENCE and without the wiki, for a command that needs the index at a step where the wiki is out of bounds. Nothing below is a precondition for it.

**Index absent → no-op.** Note ONCE: "no delivery index yet — /add.done writes one on the next delivery", then continue to PRESENCE. No project is broken by not having one, exactly as with the wiki.

### 2. GRAPH

The index answered *whether* it shipped. **The graph answers what it connects to** — which other work items caused it, depend on it or belong with it, and which reference pages document the files it touched.

**STATE YOUR QUESTION FIRST, then resolve it below.** Do not reach for an action you remember: a remembered action is what holds a run to one call when the question needed a different one, and the docs corpus answers eleven questions, not two.

```
⛔ BEFORE RUNNING ANYTHING HERE:
  ⛔ DO NOT: Run an action because another command ran it, or because it is the one you know
  ⛔ DO NOT: Stop at the first answer when your question had two halves
  ✅ DO: Write down what you must find out, in one sentence ending in a question mark
  ✅ DO: Resolve that sentence to an action in the table below, and run that one
```

### Which Action Answers Which Question

**Two routes reach these actions, and they answer identically.** Where the `codeadd-docs` MCP server is registered — `codeadd` writes that registration for the providers whose config supports it — call the action as an MCP tool. Where it is not, the one-shot CLI form below runs the same engine in a fresh process. Neither is a degraded version of the other.

```
IF YOU HAVE NEITHER THE codeadd-docs MCP TOOLS NOR A SHELL:
  ⛔ DO NOT: Reconstruct the answer by grepping `docs/` and present it as the graph's
  ✅ DO: Write `NOT VERIFIED` into `RELATED_WORK`, and say the route was missing
```

Every row is reached with the same call, changing only `--action` and `--args`:

```bash
npx codeadd mcp --corpus=docs --action=<action> --args='<json>'
```

| The question, as a command asks it | Action | `--args` |
|---|---|---|
| What work already exists about this topic? | `search` | `{"terms":"<terms from the task>"}` |
| Which deliveries and pages cover the files I am holding? | `touched_by` | `{"files":["<path>","<path>"]}` |
| What is this one work item, in full? | `get` | `{"id":"<id>"}` |
| What breaks if I change this work item's area? | `impact` | `{"id":"<id>"}` |
| What does this work item need to make sense? | `dependencies` | `{"id":"<id>"}` |
| What touches this item at all, either direction? | `neighbors` | `{"id":"<id>"}` |
| How do these two work items connect? | `path` | `{"from":"<id>","to":"<id>"}` |
| Which documents have no incoming link left? | `orphans` | `{}` |
| What is the overall shape of this project's docs? | `stats` | `{}` |
| When was this delivered, and what replaced it? | `history` | `{"id":"<id>"}` |
| The graph is stale after documents changed | `reindex` | `{}` |

**Two rows are the ones a discovery step usually wants**, and neither replaces the other: `search` starts from words, `touched_by` starts from paths. A command holding a diff has paths and should not reduce them to keywords first.

**`touched_by` answers in TWO LAYERS, and they are not the same claim.** `complete` comes from the delivery's own commit — every file it changed. `curated` comes from the delivery's anchors, which are capped at five and carry a verified status, so they say which change was load-bearing and whether it is still there.

```
IF YOU READ A `curated` HIT AS THE DELIVERY'S WHOLE FILE SET:
  ⛔ DO NOT: Conclude those are the only files it touched
  ✅ DO: Read `answer` on every hit before acting on it — five anchors are a sample
  ✅ DO: Read `matched` accordingly — it is a path list on `complete`, an anchor list on `curated`

IF THE RESULT CARRIES AN `unavailable` KEY:
  ⛔ DO NOT: Write `none` into `RELATED_WORK` — that claims no delivery touched the path
  ✅ DO: Write `NOT VERIFIED` plus the reason, exactly as for an unreachable graph
```

**This step says WHICH DELIVERIES touched a path. It does not say what is around that path now.** That is a structural question, and STEP 7 owns it: a code knowledge graph answers it where one is available, over the code as it stands rather than over history. It is **additive** — it enriches an answer this step already produced in full, and every leg here works with no such plugin installed, which is the default. Tool-neutral here for the same reason STEP 7 is: which plugin, if any, arrives through its own injection.

```
IF ONE ACTION ANSWERED ONLY HALF YOUR QUESTION:
  ⛔ DO NOT: Report it answered
  ✅ DO: Run the second action the question needs, then report both
```

**`reindex` is the one row that is not a question.** It is an operation with exactly one call, and `{{cmd:add.done}}` already runs it after a delivery. Run it here only when a read came back describing documents you know have changed.

**Produces `RELATED_WORK`:** the hits, each carrying its `id`, `kind`, `status`, `tags`, `path`, the first sentence of its TL;DR and its typed relations. Every command that loads this skill names where `RELATED_WORK` goes; none of them may leave it unused.

| What you get | What to do with it |
|---|---|
| A hit whose first sentence rules it out | Discard it. That sentence is the rejection surface — do not open the document to decide |
| A hit that survives | Read its `path`. The TL;DR's first sentence is a filter, never the answer |
| `relations` on a hit | Follow `caused_by` and `depends_on` before proposing anything that touches the same area |
| `touched_by` work items, `answer: complete` | These deliveries changed the files in hand, from the delivery's own commit. Exact and whole |
| `touched_by` work items, `answer: curated` | The path is one of that delivery's anchors — at most five per delivery, carrying each anchor's verified status. A sample of what mattered, not a diff |
| `touched_by` `curatedOnly` above zero | That many of THESE HITS answered from anchors alone, because their delivery's commit could not be derived. Narrower coverage, not an error |
| `touched_by` with an `unavailable` key | ⛔ **NOT an empty answer.** The delivery half could not run at all — no script, no shell, no repository. `workItems: []` beside it means the question went unasked, never that no delivery touched the path |
| `touched_by` pages | These wiki pages document those files. They are the SELECT result, already narrowed |

**Status is returned, never filtered here.** Two work items in flight that touch one area are exactly the pair that most needs to see each other. Filter on the field if the command wants to; do not ask this step to hide anything.

### What a Hit's `kind` Tells You

Every hit carries a `kind`, and it decides what the hit can answer.

| `kind` | The question it answers | Asking it the other question gets |
|---|---|---|
| `work-item` | **What was done** — a feature, a hotfix, a PRD, a report | Nothing. A delivery record does not describe how an area works today |
| `page` | **How this area works now** — a wiki page, one of the four Diátaxis types | Nothing. A reference page carries no history |

```
IF A RESULT IS EMPTY AND YOU ASKED FOR THE WRONG KIND:
  ⛔ DO NOT: Report "nothing exists about this"
  ✅ DO: Ask the other kind before concluding anything — a legitimate empty from
         the wrong question reads exactly like an area nobody has touched
```

⛔ **AN ATTACHMENT NEVER COMES BACK ON ITS OWN.** A plan, a design, a changelog, a
review, a QA validation and an epic are attachments: they are listed **on the work
item that owns them**, and they are not search hits.

```
IF LOOKING FOR AN ATTACHMENT — a plan, a changelog, a review:
  ⛔ DO NOT: Search for it directly and conclude it does not exist when nothing comes back
  ✅ DO: Find its WORK ITEM, then read that hit's attachment list
```

**That conclusion is the failure this rule exists to stop.** An agent that searches
for "the review of the login feature", gets an empty result and reports no review
exists has asked a question the model cannot answer, and has read the answer as
evidence.

### When the Index Cannot Answer, There Is a Ladder

⛔ **index → git → nothing**, in that order, and each rung is reported as what it is.

| Rung | When | What it gives |
|---|---|---|
| **index** | a project that has run a close-out | The delivered work, its relations and its anchors |
| **git** | no index, or an index that answers empty | `git log --follow <path>` answers "who touched this" with no index and no plugin, always |
| **nothing** | no repository either | `NOT VERIFIED`, with the reason |

The rungs are not interchangeable and the answer says which one produced it. A git
answer names commits, not deliveries, and reading it as the index's answer claims a
relationship nobody recorded.

### An Empty Answer and a Missing Route Are Different

⛔ **These two are not the same outcome and must never be reported as one.**

| Outcome | What it means | What `RELATED_WORK` carries |
|---|---|---|
| **Empty answer** — the graph ran and returned nothing | A FINDING. Nothing in this project's delivered documents relates to the question. That is real information: it says the area is new | `none — the graph answered and had no match` |
| **No route** — the graph could not be reached | NOT a finding. The question is unanswered, and nothing about the project has been learned | `NOT VERIFIED — <why the route was missing>` |

```
IF THE GRAPH IS UNREACHABLE:
  ⛔ DO NOT: Report the question as answered
  ⛔ DO NOT: Reconstruct the answer by grepping docs/ and present it as the graph's
  ✅ DO: Write NOT VERIFIED into RELATED_WORK, and say what blocked the route
  ✅ DO: Report whatever you did find, labelled as what it is — a guess from filenames
```

**The label is the whole point.** A caller that receives a filename-derived list with no marking cannot tell it from a graph answer and will act as though an edge existed. `NOT VERIFIED` costs the caller one more look; an unmarked guess costs it the wrong decision.

**`RELATED_WORK` is never left blank.** Blank reads as "the step did not run". One of the three — hits, `none`, or `NOT VERIFIED` — always fills it, and that is what the commands gate on.

**Graph absent → no-op, and it is the NOT VERIFIED case.** A project with no index, or one whose `npx` cannot reach the package offline, notes ONCE: "knowledge graph unavailable — `codeadd update` builds it", writes `NOT VERIFIED` into `RELATED_WORK`, then continues to PRESENCE. No project is broken by not having one, exactly as with the index and the wiki.

**This step is STANDALONE, like INDEX.** It reads what delivered documents record about each other. It does not read the wiki and it does not read code.

### 3. PRESENCE

Read the WIKI fields from `status.sh`, which the command already ran for context: `WIKI:present`/`WIKI:absent`, `WIKI_COMMIT`, `WIKI_STALE_COUNT`, `WIKI_HINT`.

- `WIKI:absent` → note ONCE: "knowledge base unavailable — /add.wiki generates it", then proceed with code-first discovery (grep/glob/read). Do not repeat the note within the same run.
- `WIKI:present` → continue to ENTRY. `WIKI_STALE_COUNT` (if >0) primes suspicion for STEP 6 (FRESHNESS), it does not block anything here.

**Exception — `add.new`:** it never runs the full context mapper (only `status.sh next-id`, which emits no WIKI fields). Check presence directly:
```bash
test -f .codeadd/wiki/index.md
```

### 4. ENTRY

Read `{{addpath:wiki/index.md}}` — the hub, ≤150 lines, cheap. This is the ONLY entrypoint. Never grep the wiki directory before reading the hub.

### 5. SELECT

Match the task against the hub's per-link descriptions + Terminology section. Pick the MINIMAL page set — typically 1-3 pages:

- The task's domain page: `{{addpath:wiki/domains/<area>.md}}`
- Plus the spine page matching the question kind:

| Question kind | Spine page |
|---|---|
| Established patterns | `{{addpath:wiki/domains/<area>.md}}` |
| "How do we..." (dev workflow, gates, release) | `{{addpath:wiki/workflows.md}}` |
| Rule / convention / naming / error-handling | `{{addpath:wiki/conventions.md}}` |
| "Why is it built this way" | `{{addpath:wiki/architecture.md}}` |

**Fallback** when hub descriptions don't match the task: `grep -ril "<term>" .codeadd/wiki/`.

### 6. FRESHNESS

For each selected page, read its frontmatter `commit` + `sources`:
```bash
git diff --name-only <page.commit>..HEAD -- <page.sources>
```
- Empty → trust the page.
- Non-empty → the page is a MAP, not truth: verify load-bearing claims against current code before relying on them.

`status.sh` `WIKI_STALE_COUNT` primes suspicion (repo-wide signal) but this per-page check is authoritative — a nonzero repo count doesn't mean every selected page is stale, and a zero count doesn't skip this check.

### 7. STRUCTURE

Structural questions — callers, blast radius, dependency chains, execution flows — are NEVER answered from wiki pages. Derive from the code knowledge graph when available, else from the code directly. Pages point; they don't enumerate. (Tool-neutral: no hard reference to any specific graph plugin — mastery of a specific tool arrives via its own plugin injection, independent of this skill.)

### 8. HANDOFF

When dispatching subagents, pass lightweight identifiers — NOT content:
- Selected page path(s)
- One line each on why it's relevant
- The freshness verdict (trusted / stale-verify)

Subagents read the pages themselves (JIT). NEVER inline page content into a dispatch prompt — that multiplies every dispatch by hundreds of lines and defeats the purpose of SELECT.

### 9. CONFLICT

Wiki contradicts code → CODE WINS. Report the contradiction in the command's user-facing output — it becomes evidence for the next `{{skill:add-wiki-maintenance/SKILL.md}}` run.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|---|---|
| "I'll just read all wiki pages to be thorough" | 1-3 pages is the contract. Hub descriptions exist precisely so you don't need to read everything. |
| "Grepping the whole repo is easier than the hub" | Hub-first is cheaper AND the compliant path — the economical route and the correct route are the same route. |
| "The page is probably fine, skip the freshness check" | One `git diff --name-only` command. Skipping it turns a map into an unverified guess. |
| "I'll inline the page content into the dispatch prompt to save the subagent a read" | Handoff is paths + reasons + freshness verdict only. Inlining multiplies tokens across every dispatch. |
| "The wiki is wrong here, I'll just quietly work around it" | Report the contradiction — code wins locally, but the report is what fixes the wiki for next time. |
| "add.new can wait for status.sh to give me WIKI fields" | add.new never runs the full context mapper — check `.codeadd/wiki/index.md` existence directly. |
| "The graph returned no hit, so nothing related was ever built" | The graph answers from what documents DECLARE. A project mid-migration has edges nobody wrote yet — `orphans` is the list of them. An empty result narrows nothing on its own. |
| "The index returned a match, so I understand this area" | The index answers *whether* something shipped, never *how* it works. A match is where to look next, not the answer — keep going into the wiki and the code. |
| "The `gone` entries aren't relevant, I'll show the live ones" | A `gone` entry is often the most valuable result: it says this was tried and dropped. Dropping it repeats the failure this index exists to fix, inverted. |
| "I'll re-sort the results by what looks most relevant" | The order is the read contract's. Consumers render what they receive — several of them each re-ranking one shared result is how two of them come to disagree. |
