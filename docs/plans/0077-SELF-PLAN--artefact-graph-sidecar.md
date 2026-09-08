# Plan: Artefact Graph — Sidecar, Gates, Query Surface and Consumers

> **Status:** implemented (all five waves, one PR)
> **Scope:** internal (`scripts/`, `cli/tests/`, `.claude/`, `.opencode/`, `framwork/.gitignore`, `release.yml`, `CLAUDE.md`, `web/`) + all 97 declaring artefacts
> **Created:** 2026-09-06
> **Spec:** `docs/brainstorming/2026-09-06-artefact-graph-umbrella.md`

---

## How to read this plan

**This plan states contracts and required behaviour. It does not ship the implementation.**

That is deliberate, and it is the repo's existing convention (see plan 0074's Red-Green Validation Matrix). Each F-block says *what must be true* and *why*; the Red-Green matrix says *what must be proved and what must fail first*. Signatures, data shapes and file formats are given exactly, because a wrong name is a real defect. Function bodies are not, because an implementer who cannot derive the body from the contract has not understood the contract — and a plan that is pasteable is a plan nobody reads.

Where an example appears, it is an **example of a data shape or a failure message**, never a solution to copy.

---

## Context

`scripts/build.js` already emits two content-derived sidecars, `injection-points.json` and `contracts.json`. Both follow one pattern: extract from raw content before `stripHtmlComments()`, hold in a module-level accumulator, write a deterministically sorted `{ version: 1, ... }` envelope with no timestamp.

The framework's 97 declaring artefacts reference each other only in prose. There is no machine-readable relationship map, and no gate compares what exists on disk against what `framwork/provider-map.json` registers. An unregistered artefact is silently never built, for any provider.

This is not hypothetical. `readback-agent.md` and `add-feature-readback/` are untracked in the working tree as this plan is written. If they land without `provider-map.json` entries, they will read correctly, be referenced in prose, and ship to nobody. Nothing in the build, the test suite or CI would say a word.

Wave 1 builds the extractor, the sidecar and the two zero-false-positive gates. It is preventive: **nothing is unregistered today, so this cleans nothing up.** What it buys is that the next one fails a PR.

## Problem (wave 1 scope only)

1. No machine-readable node inventory exists, so no later wave (MCP, visualisation, internal-command consumption) has anything to read.
2. Nothing detects an artefact on disk that `provider-map.json` does not register.
3. Nothing detects a reference to an artefact that does not exist.
4. Adding a sidecar has **four** consumers and the build checks none of them. Commit `56bc22d` fixed exactly this failure mode at three consumers; this change makes it four.

## Current State

| Fact | Location | Value |
|---|---|---|
| Sidecar envelope | `writeInjectionPoints()`, `writeContracts()` | `{ version: 1, ... }`, sorted, no timestamp, trailing newline |
| Fence-aware H2 slicer | `sliceContractBlock()` | reusable as-is |
| Raw-content extraction precedent | `extractInjectionPoints()` | runs before `stripHtmlComments()` |
| Existing sidecar #1 | `framwork/.codeadd/injection-points.json` | 39 points — 29 command, 10 agent |
| Existing sidecar #2 | `framwork/.codeadd/contracts.json` | 1 contract |
| Sidecar gitignore | `framwork/.gitignore:2-3` | **one explicit line per sidecar** |
| Sidecar packaging | `.github/workflows/release.yml:112-113` | **one explicit line per sidecar** |
| Build runs in CI | `.github/workflows/ci.yml:34` | every PR and push, Node 20 + 22 matrix |
| Test convention | `cli/tests/build-contracts.test.js`, `build-injection-points.test.js` | the shape to mirror |

## Scope

### Includes

- **F1** — `extractUses(rawContent, resourceName, resourceKind)` in `scripts/build.js`. Parses the `<!-- uses: -->` block from **raw** content, before `stripHtmlComments()` runs, exactly as `extractInjectionPoints()` does. Returns the declared edges. The block is an HTML comment, so it is stripped by machinery that already exists — **F1 adds no stripping logic, and a diff that adds any is wrong.**

  Entry grammar, one per line: `- <kind>: <target>` with an optional trailing `(<modifier>)`. Kinds are `skill`, `agent`, `command`, `script`. A `skill` target may name a reference file (`add-doc-schemas/references/new-feature.md`). A `command` target carries its leading slash (`/add.review`). Modifiers are free text except `conditional`, which is reserved and load-bearing (see F4).

  Malformed entries fail the build naming file and line. Silently skipping an unparseable line is the failure mode here — it turns a typo into a missing edge, which is invisible.

- **F2** — `collectNodes(map, codeaddDir)` in `scripts/build.js`. Builds the node inventory across both layers.

  **Node identity is what the build can transform, never a path's position.** A skill is a directory *containing* `SKILL.md`. This rule is load-bearing: three separate probes written while specifying this change misread `skills/*/` as the skill set, and a gate built that way fails the build on its first run against perfectly correct files. (The two eval workspaces that caused those misreads were deleted in the commit preceding this plan; the rule stands regardless, because `add-skill-creator` has no convention forbidding the next one.)

- **F3** — `writeArtefactGraph(outPath)` in `scripts/build.js` → `framwork/.codeadd/artefact-graph.json`. Deterministic sort, `{ version: 1, nodes, edges }`, no timestamp. `INJECTS_INTO` edges are **derived from the existing `INJECTION_POINTS` accumulator**, not re-extracted. A diff that re-parses fragment markers is wrong.

- **F4** — The guard, in `scripts/build.js`. Three levels, and the split matters more than the checks:

  | Condition | Verdict | Why this level |
  |---|---|---|
  | A declared entry names an artefact absent from the node inventory | **FAIL** — dangling reference | Compared against disk; no false-positive path exists |
  | A node exists but is in no `provider-map.json` entry | **FAIL** — unregistered | Same, **given F2's identity rule** |
  | A known artefact name appears in prose but is not declared | **WARN** | Sniffing is measurably unreliable — see Risks |
  | An entry is declared, absent from prose, and unmarked | **WARN** | Same, and the inverse case |

  The two WARN levels become FAIL in wave 2, once all 97 blocks exist. **Shipping them as FAIL in wave 1 blocks every build**, because almost no artefact declares anything yet.

- **F5** — `cli/tests/build-artefact-graph.test.js` (new). The RED-first suite, mirroring `build-contracts.test.js` in structure and fixture style.

- **F6** — `framwork/.gitignore`: one new line for `artefact-graph.json`, beside lines 2-3.

- **F7** — `.github/workflows/release.yml`: one new packaging line beside 112-113.

- **F8** — A test asserting **every** sidecar the build emits is both gitignored and packaged. This is the `56bc22d` guard generalised: it must fail when a fourth sidecar is added and any consumer is forgotten. A test that hardcodes three names does not do this and is wrong.

- **F9** — Three pilot `<!-- uses: -->` blocks: one command, one skill, one agent. These prove the extractor end to end against real files and give F5's integration level something true to assert. Pick artefacts with unambiguous, greppable references.

- **F10** — `CLAUDE.md`: document the third sidecar and the `<!-- uses: -->` convention in the Pipeline section, beside the existing sidecar prose.

### Does NOT Include

- The remaining 94 `<!-- uses: -->` blocks. Wave 2, split by layer.
- Flipping either WARN to FAIL. Wave 2.
- The MCP server (wave 3), the Mermaid/D2 emitter (wave 4), internal-command consumption (wave 5).
- Any change to how `provider-map.json` is structured or read.
- Any graph database, embedding or vector index. See the spec's rejected alternatives.

## Contracts

### Sidecar shape

```json
{
  "version": 1,
  "nodes": [
    {
      "id": "command/add.review",
      "kind": "command",
      "layer": "product",
      "name": "add.review",
      "path": "framwork/.codeadd/commands/add.review.md",
      "registered": true,
      "providers": ["claude", "codex", "antigrav", "opencode", "cursor"]
    }
  ],
  "edges": [
    {
      "from": "command/add.review",
      "to": "skill/add-qa/references/coordinator.md",
      "type": "USES_SKILL",
      "origin": "declared",
      "modifier": null
    }
  ]
}
```

`id` is **`<layer>/<kind>/<name>`** and is the join key everywhere. `origin` is `declared` (from F1) or `sidecar` (from `INJECTION_POINTS`). `registered` is what F4's unregistered gate reads; it is recorded on the node rather than recomputed by consumers.

**Correction, found during execution.** This plan originally specified `id` as `<kind>/<name>`. That scheme is broken: `add-commit` exists as **both** a product skill (`framwork/.codeadd/skills/add-commit/`) and an internal skill (`.claude/skills/add-commit/`), so the two collide on one id. The node-uniqueness test caught it on the first green run. Layer is part of identity, not decoration.

Consequently `extractUses()` takes a fourth argument, the declaring artefact's layer, and resolves every target **within that layer** — a bare name is ambiguous across layers and unambiguous within one. A genuine cross-layer edge has no syntax yet; the dangling gate will name one concretely if it ever appears, which beats inventing a syntax for a case that may not exist.

### Node kinds and who declares

| Kind | Identity rule | Count today | Declares a block |
|---|---|---|---|
| `command` | `commands/*.md` | 24 | yes |
| `skill` | directory **containing `SKILL.md`** | 45 | yes |
| `agent` | `agents/*.md` | 28 | yes |
| `reference` | `skills/*/references/*.md` and siblings | 68 | no — edge target only |
| `script` | `.codeadd/scripts/*` (excluding `tests/`) | 14 | no — edge target only |
| `fragment` | `fragments/**`, `plugins/**/fragments/**` | 23 | no — edges come from `INJECTION_POINTS` |

**202 nodes today, 97 of which declare.** These are a snapshot, not a frozen contract. They already moved once during planning: commit `824233f` deleted `doc-reviewer-agent` and the `add-doc-reviewer` skill while adding `readback-agent` and `add-feature-readback`, taking references from 73 to 68 and fragments from 24 to 23. The declaring total happened to stay at 97 because the additions balanced the deletions — which is exactly why the suite asserts invariants and keeps the numbers in one tripwire.

So F5 asserts **invariants, not magic numbers**:

- Every node has a `kind` from the six above, a non-empty `path`, and a `layer` of `product` or `internal`.
- Total node count equals the sum of the per-kind counts. No node is orphaned from its kind bucket.
- Exactly the kinds `command`, `skill` and `agent` declare; the other three never carry a declared edge.
- Every edge's `from` and `to` resolve to a node in the same graph.

The snapshot belongs in **one** place — a single tripwire test that prints expected-vs-actual and says in its failure message that a moved count is fine when intended and needs the number updated. A count duplicated across several assertions produces several failures for one legitimate change, which is how a suite teaches people to ignore it.

### Edge types

| Type | Declared as | Target kind | Origin |
|---|---|---|---|
| `USES_SKILL` | `skill:` | skill or reference | declared |
| `DISPATCHES` | `agent:` | agent | declared |
| `HANDS_OFF_TO` | `command:` | command | declared |
| `RUNS_SCRIPT` | `script:` | script | declared |
| `MENTIONS` | `mention:` | any | declared |
| `INJECTS_INTO` | — | command / agent | sidecar (39 today) |

**The type is derived from the TARGET kind, not from relationship semantics, and
any declaring kind may be the source.** That is why 139 edges read as
`DISPATCHES: skill → agent` or `HANDS_OFF_TO: skill → command`: a rubric skill
does not dispatch anything — the command that loads it does — but the skill
names the agent, so an edge exists and it is typed by what it points at.

This is honest for reachability, which is what `impact` needs, and imprecise for
semantics, which is what a reader of `neighbors` might assume. Enforcing a
source kind per type, with a generic `REFERENCES` for the rest, is the
follow-up; it was not done here because it re-types 139 existing edges and every
consumer would need re-checking.

### Failure message shape

Gates must name the file, the line where applicable, and the fix. Illustrative — match the *information*, not the wording:

```
artefact-graph: dangling reference
  framwork/.codeadd/commands/add.review.md:14
  declares  skill: add-qa/references/coordinatr.md
  no such node. Did you mean add-qa/references/coordinator.md?

artefact-graph: unregistered artefact
  framwork/.codeadd/agents/readback-agent.md
  exists on disk, absent from framwork/provider-map.json → never built for any provider
  add an entry under "agents", or delete the file.
```

A gate that fails without naming the path costs more than it saves.

## Validated Decisions

| Decision | Rationale | Source |
|---|---|---|
| JSON, not SQLite or a graph DB | CI runs a **Node 20** leg; `node:sqlite` needs 22.5+, `better-sqlite3` is a native module inside an `npx`-distributed CLI. The sidecar ships in the release ZIP, where a binary is neither diffable nor inspectable | Spec, owner-confirmed |
| Declaration distributed, index centralised | Locality — a declaration beside what it describes enters the same diff and the same review | Spec, owner-confirmed |
| Block is source-only, stripped at build | `## Materializes` ships because it is an instruction; `<!-- uses: -->` is build metadata the runtime agent never needs | Spec, owner-confirmed |
| Both layers in one graph, `layer` per node | Cross-layer edges are real, and the commands that will consume the graph are internal | Spec, owner-confirmed |
| Sniff levels ship as WARN | Measured false-positive rate makes a hard gate unusable in wave 1 | Spec, owner-confirmed |
| Eval workspaces deleted, not relocated | Owner call during planning: no value in the skill itself | This session |

## Red-Green Validation Matrix

**RED first.** Every level below is written and shown failing before the F-block that satisfies it lands.

### L1 — `extractUses()` unit — RED → GREEN

1. A well-formed block yields one edge per entry, with `kind`, `target` and `modifier` correct. *RED: the function does not exist.*
2. **The block never reaches output.** Build a fixture artefact carrying a block; assert the built file for every provider contains no `uses:` text. *This is the level that proves F1 rides existing stripping instead of adding its own.*
3. An artefact with no block yields zero edges and no error. Most artefacts are in this state during wave 1.
4. A malformed entry fails, naming file and line. Assert per malformation: unknown kind, missing colon, empty target.
5. `(conditional)` parses into `modifier`, and any other parenthesised text parses as a free-text modifier without error.
6. **Two blocks in one file fail.** Ambiguity must not resolve to "first wins" silently.
7. A block inside a fenced code region — an artefact documenting this convention — is **not** an injection point. `sliceContractBlock()`'s fence-awareness is being reused; this level proves it was.

### L2 — `collectNodes()` unit — RED → GREEN

1. **Invariants hold** (see Contracts): every node has a legal `kind`, non-empty `path` and legal `layer`; total equals the sum of per-kind counts; only `command`, `skill` and `agent` carry declared edges; every edge endpoint resolves to a node in the graph. **One** separate tripwire test carries the 2026-09-06 snapshot (24 / 45 / 28 / 68 / 14 / 23 = 202, 97 declaring) and its failure message must state that an intended change means updating the number here.
2. **A directory under `skills/` with no `SKILL.md` produces no node and no failure.** *This is the single highest-consequence level in wave 1.* Build the fixture directly — do not rely on the deleted eval workspaces, which are gone.
3. Internal-layer artefacts carry `layer: "internal"`; product artefacts carry `layer: "product"`. Assert one of each kind.
4. `registered` is `true` for a `provider-map.json` entry and `false` otherwise, asserted on a fixture that has one of each.
5. `providers` on a node matches what the build actually emits for it, including a skill restricted via `"providers": [...]`.

### L3 — Guard behaviour — RED → GREEN

1. A declared entry naming a nonexistent artefact fails, naming path and line. *RED today: nothing reads declarations.*
2. **An unregistered artefact fails.** Fixture: an agent file with no `provider-map.json` entry. *RED today: it builds silently — this is the `readback-agent` shape.*
3. **The unregistered gate does not fire on a `SKILL.md`-less directory.** L2.2 from the gate's side. A build that fails here fails on correct files.
4. A prose mention with no declaration **warns and does not fail**, and the build exits 0. *Shipping this as a failure blocks every build in wave 1.*
5. A declaration absent from prose and unmarked **warns and does not fail**. Same reason.
6. `(conditional)` suppresses the L3.5 warning; nothing else does.
7. **A clean tree produces zero failures and zero warnings from the pilot artefacts.** Run against the real repo after F9. If the three pilots warn, their declarations are wrong.

### L4 — Sidecar and consumers — RED → GREEN

1. The emitted file parses, carries `version: 1`, and has no timestamp field.
2. **Byte-identical across two consecutive builds.** Determinism is what makes "did the graph change" answerable; a set iteration order that varies breaks it invisibly.
3. `INJECTS_INTO` edge count equals `INJECTION_POINTS.length` — 39 today. Asserted against the accumulator, not a constant, so it tracks.
4. **Every sidecar the build emits is gitignored and packaged.** Derived from what the build actually writes, never a hardcoded list. *RED: add a fourth fake sidecar to the fixture and confirm this level fails.* This is F8, and a version that enumerates three names does not satisfy it.
5. The real `artefact-graph.json` is ignored by `framwork/.gitignore` — `git check-ignore` exits 0 on it.

### L5 — Behavioural acceptance

1. **The `readback` reproduction.** Recreate the current working-tree shape: an agent and a skill on disk, neither in `provider-map.json`. The build fails, naming both. *This is the acceptance test for wave 1.* It is also the exact situation that exists in the repo today and that ships silently.
2. The full suite passes and `node scripts/build.js` still reports **42 skills, 22 agents, 723 files** on the real tree — unchanged by this plan.
3. `npm test` and `npm run test:scripts` pass on Node 20 **and** Node 22. The Node 20 leg is not optional: it is the constraint that decided the storage format.

**RED expectations against the current tree:** L1 and L2 entirely (neither function exists); L3.1 and L3.2 have no gate to fire; L4.4 has no test; L5.1 is the reproduction of the live defect. L5.2 passes today and must keep passing — it is a regression guard, not a RED level.

**GREEN = every level passes after F1–F10.**

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| Node identity keyed on directory position — the unregistered gate fails the build on correct files | **High if unspecified.** It happened three times while writing the spec | F2 states the rule; L2.2 and L3.3 assert it from both sides |
| Sniff warnings are noisy enough to be ignored, then ignored in wave 2 when they turn into failures | Medium | Wave 1 ships them as warnings **and** F9's three pilots must produce zero (L3.7). If clean artefacts warn, the sniffer is wrong and wave 2 must not proceed |
| The `56bc22d` failure repeats at four consumers | Medium | F8 derives the consumer check from what the build emits; L4.4 proves it fails on a fourth |
| Non-deterministic output from set/object iteration | Medium | L4.2 builds twice and compares bytes |
| F1 reimplements stripping instead of riding the existing pass | Medium | L1.2 asserts absence from built output for every provider |
| The pilot artefacts are chosen for convenience and prove nothing | Low | F9 requires one of each kind; L3.7 asserts they are clean |

## Ecosystem Impact

| Component | Impact | F-block |
|---|---|---|
| `scripts/build.js` | Three new functions plus the guard | F1-F4 |
| `cli/tests/` | New suite; existing suites untouched | F5, F8 |
| `framwork/.gitignore` | One line | F6 |
| `.github/workflows/release.yml` | One line | F7 |
| `.github/workflows/ci.yml` | **None** — already runs the build | — |
| `framwork/provider-map.json` | Becomes gated; content unchanged | — |
| 3 product artefacts | Gain a pilot block | F9 |
| `CLAUDE.md` | Documents sidecar #3 and the convention | F10 |
| Built provider files | **Must be byte-identical** except the three pilots' stripped blocks | L1.2, L5.2 |

## Execution Order

Strict. Each step ends with the build green and the suite passing.

1. **F5 skeleton + L1/L2 RED.** Write the failing levels first; run them; see them fail for the stated reason. A level that fails for a different reason is not RED, it is broken.
2. **F1** → L1 green.
3. **F2** → L2 green. Commit.
4. **F3** → L4.1-L4.3 green. Commit.
5. **F4** → L3 green. Commit.
6. **F6, F7, F8** → L4.4, L4.5 green. Commit.
7. **F9** → L3.7 green.
8. **L5.1** — build the reproduction fixture, watch it fail correctly, keep it in the suite.
9. **F10** → documentation. Commit.
10. Full suite, Node 20 and 22. Then open the PR.

Run `node scripts/build.js` after every step, not once at the end. The sidecar guards fail loudly, which only helps while the change is still small.

## Pull Request

Opened after step 10, never before — a PR whose CI has not run locally wastes a review cycle.

- **Branch:** `feat/artefact-graph-wave-1` off `main`. `main` is the development branch; `production` is releases.
- **Title:** `feat(build): emit artefact-graph sidecar and gate unregistered artefacts`
- **Body must carry:**
  1. What wave 1 does and, plainly, **what it does not**: no declarations beyond three pilots, both sniff levels are warnings, no MCP, no visualisation.
  2. **That it is preventive.** Nothing is unregistered today; this cleans nothing up. Reviewers who expect a cleanup diff will look for one.
  3. The L5.1 reproduction and its output — the `readback` shape is the concrete argument for the change.
  4. The four consumers of a new sidecar, and that F8 now derives the check rather than listing them.
  5. A link to the spec.
- **Merge only when** CI is green on **both** Node legs.
- Follow the repo's commit trailer convention already in use on `main`.

## Reviewer Handoff

Beyond the usual:

1. **Is node identity keyed on `SKILL.md` presence, or on directory position?** Read F2's implementation directly. This is the defect most likely to ship, and L2.2 is the only thing standing between it and a build that fails on correct files.
2. **Did F1 add stripping logic?** It must not. The block is an HTML comment; existing machinery removes it. Check the built output for one pilot artefact, on more than one provider.
3. **Does F8 enumerate sidecar names?** If it does, it is not the `56bc22d` guard — it is the bug that commit fixed, rewritten. It must derive the list from what the build emits.
4. **Are both sniff levels warnings?** If either fails the build, wave 1 blocks every build in the repo.
5. **Was the sidecar built twice and compared?** L4.2 must have been run, not assumed. Non-determinism here is invisible until wave 4 starts diffing graphs.
6. **Did the pilot artefacts produce warnings?** If yes, the sniffer is wrong and wave 2 must not start.
7. **Is the node-count snapshot in exactly one test?** If the counts are asserted in several places, `add-feature-readback` landing produces a scatter of failures for one correct change — and a suite that cries wolf gets ignored. The invariants (L2.1) are what should be asserted broadly; the numbers are one tripwire.
8. **Did the built provider files change beyond the three pilots?** They must not. L5.2 is the guard; confirm it ran against the real tree, not a fixture.

## Next Steps

Wave 2 crosses both layers and must be split into two layer-scoped topics before planning — `--self-plan` cannot reach `framwork/.codeadd/`, and `--plan` cannot reach `.claude/`.

```
/add-framework--self-plan artefact-graph wave 2, internal layer blocks -> ref: 2026-09-06-artefact-graph-umbrella.md
/add-framework--plan       artefact-graph wave 2, product layer blocks  -> ref: 2026-09-06-artefact-graph-umbrella.md
```

## Execution Record

Wave 1 shipped on `feat/artefact-graph-wave-1` in six commits, one per F-group, each green before the next. What the plan did **not** foresee, in the order it surfaced:

| # | Found by | Defect | Resolution |
|---|---|---|---|
| 1 | L1 RED run | A bare `.toThrow()` passed vacuously against "extractUses is not a function" — it could not tell a correct rejection from a missing implementation | Assert the message names the artefact |
| 2 | L2.1 uniqueness | `id = <kind>/<name>` **collides**: `add-commit` is both a product and an internal skill | Id is `<layer>/<kind>/<name>`; `extractUses()` takes the layer and resolves targets within it |
| 3 | Editing `build.js` | The edge sort key picked up **raw control bytes** as separators — first NUL, which made git treat `build.js` as binary and the PR diff unreviewable | Separator written as a `` escape; file verified free of raw control bytes |
| 4 | L4.3 review | The injection-edge level read the module-level accumulator, empty in a fresh test process — `expect(0).toHaveLength(0)` proves nothing | Points passed explicitly, plus a level against the real emitted sidecar that asserts non-emptiness first |
| 5 | Proving F8 | The list-integrity level searched `build.js` source for each name, which the `SIDECARS` array satisfies by containing them | Compares against the build's real output directory, both directions |
| 6 | Choosing pilots | A target ending `/SKILL.md` resolved to a `reference` node that does not exist — the dangling gate would fail the build on a correct declaration | Strip the suffix; the target names the skill |
| 7 | Choosing pilots | `add-health-check`'s only sniffed mention was *"Security-only audit (use add-security-audit)"* — a pointer **away**, inside a list of when not to use the skill | Pilot rejected. **The sniffer cannot tell "uses X" from "explicitly does not use X"** — see below |

Four of these seven were **vacuous or wrong tests**, not wrong production code. That is the argument for the plan's rule that a level failing for the wrong reason is broken, not RED.

### Waves 2-5

All five waves shipped on the same branch, in one PR. Wave 1 alone is
infrastructure — it emits a sidecar nobody reads — and the framework's value
only appears once the declarations exist and something consumes them.

| Wave | Delivered |
|---|---|
| 2 | 97 artefacts declaring; 43 → **625 edges**; both sniff levels hardened from warning to failure |
| 3 | `scripts/graph.js` (impact, dependencies, neighbors, path, orphans, stats) + `scripts/artefact-graph-mcp.js` |
| 4 | `mermaid` emitter, `web/public/artefact-graph.mmd`, a docs section rendering it |
| 5 | `--self-plan` 2.1/2.2, `--sync` STEP 2, `--shared-review` STEP 3.1b — mirrored into `.opencode/` |

**Wave 2 was unblocked by `mention:`**, a fourth declaration kind that emits a
`MENTIONS` edge. It is a real typed edge rather than a side channel, so the
graph gains the fact and the dangling gate validates the target like any other,
while `impact` and `dependencies` exclude it. 49 of the 586 entries are
mentions, every one a "use X instead" or "do not use for" pointer.

Two further sniffer defects surfaced while generating the declarations, both of
which would have written invented edges into the graph:

- **A command was matched as a bare word.** The command named `add` matched
  inside `add.done`'s "DO NOT USE Bash for git add/commit/push". Commands are
  now matched only with their slash, which is how every genuine reference
  writes them.
- **The first classifier read a markdown table row as a catalogue listing**, and
  therefore a mention. In this repo those tables *are* the dispatch and routing
  tables, so the rule inverted the truth on exactly the edges that matter most.
  Negative detection is now section-aware, which is what the real cases need:
  the negation sits in a `## When NOT to Use` heading with the names underneath,
  and a line-only rule found none of them.

**Deviation from the spec, wave 3.** The spec called for an MCP server. What
shipped is a CLI *plus* an MCP wrapper. The callers are this framework's own
commands on five providers — all can shell out, only some have MCP configured —
and the official SDK measured at 89 transitive packages to wrap six pure
functions. Both surfaces call the same module, so they answer identically.

**Local suite flakiness, fixed on the way.** Three full runs failed 8, then 6,
then 6 tests with almost no overlap while every one passed in isolation; `main`
with none of these changes failed 5. Several suites operate on the real built
tree and interleave under parallel workers, which on Windows surfaces as EBUSY
on a random test each run. `cli/vitest.config.js` serialises files and
`build.test.js` now builds into a temp root. 772 pass, 0 fail.

### Review round

An external review of the finished PR raised 20 issues. **None was a false
positive**; every number in it reproduced exactly. Two were critical, and both
destroyed the value the PR exists to deliver:

**C1 — the headline query was saturated.** `add-ecosystem` is a MAP of the
ecosystem (its body is `## Commands`, `## Skills`, `## Agents`, `## Dependency
Index`) and consumes none of it, but the generator wrote all 81 catalogue rows
as real dependency edges. Eight commands load that skill, so everything it lists
inherited ~83 transitive dependants: `impact add-stripe` — a leaf nothing uses —
returned **84**, one more than `add-doc-schemas`, the actual hub. Both wave-5
consumers grade on that number, so `--self-plan`'s risk table was a constant
function and `--shared-review` would have filed ~80 findings per review.

Fixed by re-declaring the catalogue as `mention:` (0 for the leaf now), by
grading on `--depth 1` — the transitive closure over a densely cross-referencing
command layer saturates no matter what — and by telling `--sync` STEP 2 that
regenerating this file must keep those rows as mentions, or the edges come
straight back.

**C2 — the documented regeneration command broke the docs.** `mermaid --write`
emitted 606 lines while the checked-in diagram was 92, because the CLI and the
test each carried their own options. Running the documented command failed the
test and replaced the docs diagram with a hairball. `--kinds` was also
unusable: its value was not excluded from the positionals, so it was read as the
root node. Both sides now render one shared `DOCS_PROFILE` constant.

Also fixed: the identity rule covered skills only, so a `README.md` in
`agents/` hard-failed the build (I3 — and the first fix for it matched
`readme-analyzer.md` as a prefix, dropping a real agent: a guard against false
positives that introduces one); three stale claims in `CLAUDE.md`; a docs page
promising skills, agents and dotted arrows the diagram does not contain (I4); a
dead `warnings` array (I2 — the phantom-edge half is a warning again, so a soft
level exists); 48 false orphans from relative reference links, which turned out
to hide 40 real edges the sniffer could not see (I5); and seven minor items
including a fifth vacuous assertion.

**Process note.** The plan's Reviewer Handoff asked "is node identity keyed on
`SKILL.md` presence?" — scoped to skills, because the plan's F2 was. That is why
I3 shipped. The right question was *"is identity keyed on transformability for
every kind?"*

### Carried forward

**Defect 7 was solved in wave 2 by the `mention:` kind.** Negative references ("use X instead", "not to be confused with X", "unlike X") are indistinguishable from dependencies to a name-matching sniffer. A `mention:` entry is exactly that waiver: acknowledged, reviewable in the diff, and a real `MENTIONS` edge rather than a silent exemption. The remaining follow-up is the hand-maintained cytoscape node list in `docs.astro`, which duplicates the graph and should be driven from the sidecar.

**Measured signal quality.** On the real tree the gate reports **0 failures and 655 warnings**. Spot-checking `add.audit.md`, the warnings name exactly the skills and script it really uses, so the sniffer is finding real references rather than noise. That is what makes wave 2 plausible; defect 7 is what makes it non-trivial.

## References

- Spec: `docs/brainstorming/2026-09-06-artefact-graph-umbrella.md`
- Sidecar precedent: `scripts/build.js` → `extractInjectionPoints()`, `extractContract()`, `writeInjectionPoints()`, `writeContracts()`
- Test precedent: `cli/tests/build-contracts.test.js`, `cli/tests/build-injection-points.test.js`
- Consumer-drift precedent: commit `56bc22d`
- Red-Green matrix convention: `docs/plans/0074-PLAN--autonomous-epic-convergence-001-convergence-gate.md`
