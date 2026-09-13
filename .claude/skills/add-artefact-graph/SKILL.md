---
name: add-artefact-graph
description: "Use when a command, skill or agent needs to ask what an artefact relates to — the eleven query verbs, the two interfaces that answer them identically, and the standing list of what the graph still cannot see."
---

# Artefact Graph — Querying It

Owns HOW the artefact graph is queried: the verbs, the two interfaces, and what the answer does not
cover. WHAT a given command does with the answer belongs to that command.

**The graph is emitted by `node scripts/build.js` into `framwork/.codeadd/artefact-graph.json`, and it
covers `.claude/` as well as `framwork/.codeadd/`.** It is rebuilt from scratch on every build and is
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

## What the Graph Cannot See

⛔ **This section is permanent. It is not a defect list to be emptied — it is the shape of the
instrument.** Every entry below was once invisible enough that someone trusted an incomplete answer.

| Not visible | Why, and what to do instead |
|---|---|
| **A fragment's edge, from the command's side** | A fragment's `DISPATCHES` originates at the **fragment** node, not at the command it is injected into, and `INJECTS_INTO` runs fragment → command. So `dependencies <command>` walks the wrong way and never traverses it, and `impact <command>` reaches the fragment but keeps going in reverse, never showing what the fragment dispatches. **It takes TWO queries:** `impact <command> --depth 1` to find the fragments, then `dependencies <fragment>` on each |
| **`transforms/`** | Not a node, deliberately: it does not ship. `release.yml` packages `.codeadd/scripts`, `fragments`, `templates` and `plugins` — not `transforms`, which is build-time input like the provider registry |
| **`CLAUDE.md`** | Not a node at all. Nothing in `build.js` inspects it, so a stale pointer there survives every gate. After a rename or a removal, grep it by hand |
| **Top-level `scripts/`** | `scripts/build.js`, `graph.js` and `inventory.js` produce no nodes, so nothing reports what depends on them |
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

NEVER:
- Reconstruct a relationship from prose with grep
- Call the CLI a fallback for the MCP — they answer the same
- Report a graph answer as complete without reading what the graph cannot see
