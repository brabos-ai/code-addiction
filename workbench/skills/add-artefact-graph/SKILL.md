---
name: add-artefact-graph
description: "Use when a command, skill or agent needs to ask what an artefact relates to — resolving a stated question to the verb that answers it, the eleven verbs, the two interfaces that answer them identically, the case of an agent with no route at all, and the standing list of what the graph still cannot see."
---

# Artefact Graph — Querying It

Owns HOW the artefact graph is queried: which verb answers which question, the two interfaces, the
case of an agent that can reach neither, and what the answer does not cover. WHAT a given command
does with the answer belongs to that command.

**A command states its question and points here.** It does not name a verb, because a named verb is
what holds an agent to one query when the question needed two.

**The graph is emitted by `node scripts/build.js` into `framwork/.codeadd/artefact-graph.json`, and it
covers `workbench/` as well as `framwork/.codeadd/`.** It is rebuilt from scratch on every build and is
gitignored, so it holds no history — `history` is the one verb that reads something else.

## When to Use

- About to ask what an artefact relates to, depends on, or would break.
- Grading the blast radius of a change before planning or executing it.
- Checking whether an artefact still has a consumer.

## When NOT to Use

- Looking for TEXT. Grep is the right tool for finding a phrase, and this skill never says otherwise.
- Asking what SHIPPED and was later dropped. That is the delivery index, reached through `history`.

---

## The Rule

```
IF THE QUESTION IS "WHAT DOES THIS ARTEFACT RELATE TO":
  ⛔ DO NOT USE: Grep to reconstruct a relationship from prose
  ✅ DO: Ask the graph
  ✅ DO: Report the answer as NOT VERIFIED when the graph does not answer
```

⛔ **The rule is "ask the graph", never "use the MCP instead of grep".** Those are different claims
and only the first is true. Grep remains correct for finding text; it is wrong for reconstructing
relationships, because prose that names an artefact and prose that depends on one look identical.

## Two Interfaces, One Answer

| Interface | Reach | Verbs |
|---|---|---|
| `node scripts/graph.js <verb>` | Every provider. All five can shell out | `impact`, `dependencies`, `neighbors`, `path`, `orphans`, `stats`, `history` — plus `mermaid`, which is CLI-only |
| The artefact-graph MCP (`mcp/server.mjs --corpus=artefacts`) | Only where MCP is configured | all eleven |

**Where both implement a verb, they answer identically — by design and by assertion.** Both read the
same emitted sidecar, and `cli/tests/mcp-engine.test.js` asserts equality rather than sharing code.
**The CLI is therefore not a fallback for the MCP on those seven: it is the same answer.** An agent
whose tool allowlist blocks MCP is not degraded for any of them.

⛔ **Clear `NODE_OPTIONS` before shelling out, or read a corrupted answer.** An editor that injected
a debugger prints `Debugger listening on ws://…` onto stdout, ahead of the verb's output. Run
`NODE_OPTIONS= node scripts/graph.js <verb>`.

```
IF YOU PARSE scripts/graph.js OUTPUT AND IT LOOKS MALFORMED:
  ⛔ DO NOT: Treat it as a failed query and fall back to guessing
  ✅ DO: Clear NODE_OPTIONS and run it again — the answer was fine, the stream was not
```

**This matters most to a caller that falls back on error.** A banner on stdout reads as a broken
query, so a fallback rule silently downgrades to whatever it does when the graph is unreachable —
and the graph was reachable the whole time.

⛔ **That reassurance assumes the agent can shell out. An agent whose allowlist carries neither the
MCP tools nor `Bash` has no route to the graph at all**, and no verb on either interface is reachable
from it. It is not "degraded on four verbs" — it is blind to all eleven.

```
IF YOUR ALLOWLIST CARRIES NEITHER THE artefact-graph MCP TOOLS NOR Bash:
  ⛔ DO NOT: Reconstruct the relationship from filenames, prose or keyword scoring and present it
             as the answer
  ⛔ DO NOT: Report the question as answered
  ✅ DO: Say the answer is NOT VERIFIED, and say it is the allowlist that blocked it
  ✅ DO: Report whatever you did find, labelled as what it is — a guess from names, not an edge
```

**The label is the whole point.** A caller that receives a filename-derived list with no marking
cannot tell it from a graph answer, and will act on it as though an edge existed. NOT VERIFIED costs
the caller one more query; an unmarked guess costs it the wrong decision.

⛔ **Four verbs are MCP-only: `search`, `get`, `touched_by` and `reindex`.** `scripts/graph.js` has no
case for them and exits 2 with its usage header.

```
IF YOU HAVE NO MCP AND THE QUESTION NEEDS search, get, touched_by OR reindex:
  ⛔ DO NOT: Shell out to scripts/graph.js for it — you get exit 2, not an answer
  ✅ DO: Reach it with a verb the CLI does implement where one fits — `impact`,
         `dependencies` and `neighbors` cover most of what `get` is asked for
  ✅ DO: Report it as NOT VERIFIED when none does
```

## The Eleven Verbs

| Verb | The question it answers |
|---|---|
| `impact` | What breaks if I change this? Walks dependants transitively |
| `dependencies` | What does this need? The inverse of `impact` |
| `neighbors` | What are this node's immediate edges, both directions, weak ones included? |
| `path` | How do these two artefacts connect? |
| `orphans` | What has no consumer left? |
| `search` | Which artefacts match these keywords? |
| `get` | One node in full — its relations, its files, its attachments |
| `stats` | Counts by kind, by edge type, and the hubs |
| `touched_by` | Which nodes does this file belong to? |
| `reindex` | Rebuild the index for a corpus that is not build-emitted |
| `history` | Has this shipped before and been dropped? |

**`impact --depth 1` is what a risk grade reads.** The command layer cross-references itself densely,
so the transitive closure saturates and a hub becomes indistinguishable from a leaf. The unbounded run
is context, never a score.

**`history` does not read the graph.** It reads the delivery index, which is the only thing here with
a time axis — the graph is rebuilt from nothing on every build. A `gone` or `superseded` entry is the
most useful answer it gives, because it names what replaced something.

## Which Verb Answers Which Question

**This is the table above, read from the other end.** A command states the question it must answer and
points here; this resolves it to a verb. The two orientations are not redundant — the table above is
read by someone holding a verb and wondering what it gives, this one by someone holding a question and
needing the verb. The second is the direction every command actually arrives from.

| The question, as a command asks it | Verb | A complete answer |
|---|---|---|
| Who calls this artefact today? | `impact <name> --depth 1` | Every direct dependant named. **Plus the fragment rule below** — a command's fragments take a second query |
| What breaks if I change or remove this? | `impact --depth 1` grades it; the unbounded run is context | The grade comes from depth 1. An unbounded count is not a score |
| What does this artefact need to work? | `dependencies <name>` | Every declared target, each resolving to something that exists |
| What touches this node at all, either direction? | `neighbors <name>` | Both directions, weak edges included — the widest single view of one node |
| How do these two artefacts connect? | `path <a> <b>` | A route, or the fact that there is none. "No path" is an answer |
| Does anything still consume this? | `orphans` | A list to judge, not a verdict — see Reading an Answer |
| Has this shipped before and been dropped? | `history <name>` | A `gone` or `superseded` entry naming what replaced it, or nothing — but **at most 2 of them**: the underlying read caps dead entries, and its `MATCHED_DEAD` key is what says whether more matched |
| Which artefacts are about this topic? | `search` — **MCP only** | Ranked matches. With no MCP, no verb substitutes: report NOT VERIFIED |
| What is this one node, in full? | `get` — **MCP only** | With no MCP, `neighbors` plus `dependencies` covers most of it |
| Which nodes does this file belong to? | `touched_by` — **MCP only** | With no MCP, no verb substitutes: report NOT VERIFIED |
| What is the overall shape, and what are the hubs? | `stats` | Counts by kind and edge type, and the hub list |

```
IF A COMMAND STATED A QUESTION AND YOU RAN ONE VERB:
  ⛔ DO NOT: Report the answer complete before checking What the Graph Cannot See below
  ⛔ DO NOT: Stop at one query when the subject is a command that fragments inject into
  ✅ DO: Run the second query the fragment rule requires, then say what the answer does not cover
```

**A question is not answered by a verb alone.** Three of the rows above are wrong on their own for a
command with fragments, and every row is incomplete until the table below has been read against it.
That is why a command points here instead of naming a verb: the verb is the first step of the answer,
never the whole of it.

## What the Graph Cannot See

⛔ **This section is permanent. It is not a defect list to be emptied — it is the shape of the
instrument.** Every entry below was once invisible enough that someone trusted an incomplete answer.

| Not visible | Why, and what to do instead |
|---|---|
| **A fragment's edge, from the command's side** | A fragment's `DISPATCHES` originates at the **fragment** node, not at the command it is injected into, and `INJECTS_INTO` runs fragment → command. So `dependencies <command>` walks the wrong way and never traverses it, and `impact <command>` reaches the fragment but keeps going in reverse, never showing what the fragment dispatches. **It takes TWO queries:** `impact <command> --depth 1` to find the fragments, then `dependencies <fragment>` on each |
| **`transforms/`** | Not a node, deliberately: it does not ship. `release.yml` packages `.codeadd/scripts`, `fragments`, `templates` and `plugins` — not `transforms`, which is build-time input like the provider registry |
| **`AGENTS.md`** | Not a node at all. Nothing in `build.js` inspects it, so a stale pointer there survives every gate. After a rename or a removal, grep it by hand |
| **Top-level `scripts/`** | `scripts/build.js`, `graph.js` and `inventory.js` produce no nodes, so nothing reports what depends on them |
| **Any file that is not an artefact** | `.gitignore`, `package.json`, a workflow under `.github/`, a test under `cli/tests/` — none is a node. **This row is the answer to "is this path a node", and the list above it is not exhaustive for that question**: the rows above name blind spots worth calling out, not every non-artefact path. If it is not a command, skill, agent, script, fragment, plugin, template or feature, it has no node |
| **Anything two files must keep equal** | `ENTRY_POINT_KINDS`, `DEPENDENCY_TYPES` and `ORPHAN_DEPENDENCY_TYPES` each exist in both `scripts/graph.js` and `mcp/engine.mjs`, which cannot import each other. No edge records that. Only `cli/tests/mcp-engine.test.js` holds them together, and the third is the one whose divergence silently breaks `orphans` |

```
IF THE GRAPH RETURNED AN ANSWER THAT LOOKS COMPLETE:
  ⛔ DO NOT: Treat "the graph did not list it" as "nothing else depends on it"
  ✅ DO: Check this table first, then say what the answer does not cover
```

## Reading an Answer

- **`MENTIONS` is excluded from `impact` and `dependencies`.** It records one artefact naming another
  while pointing AWAY from it, so counting it would inflate every blast radius with relationships that
  cannot break.
- **`CONTAINS` is excluded from `orphans`, and only from `orphans`.** A feature or plugin contains
  every file in its directory; counting that as a dependency would make nothing under `fragments/` or
  `plugins/` reportable as dead weight ever again.
- **An orphan is a question, not a verdict.** The four shipped templates report as orphans because
  nothing names them. That is true and worth knowing; whether they are dead is a human's call.
- **A name is matched exactly.** `add-qa` does not match inside `add-qa-migration`.

## Rules

ALWAYS:
- Grade risk on `impact --depth 1`, never on the unbounded run
- Say what an answer does not cover when the question touches a row of the table above
- Check which interface implements a verb before telling an agent to shell out for it
- Check the fragments injected into a command before concluding what that command dispatches

- Resolve a stated question to its verb here, rather than running whichever verb a caller named
- Clear `NODE_OPTIONS` before shelling out to `scripts/graph.js`

NEVER:
- Reconstruct a relationship from prose with grep
- Call the CLI a fallback for the MCP — they answer the same
- Report a graph answer as complete without reading what the graph cannot see
- Present a filename-derived list as a graph answer when the allowlist left no route
