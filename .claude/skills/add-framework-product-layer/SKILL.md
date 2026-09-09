---
name: add-framework-product-layer
description: "Use when an F-block touches the product layer — framwork/.codeadd/, provider-map.json or cli/. Registration, build.js, the cli test suite, artefact structures, and the CLAUDE.md count sync."
---

# Product Layer Mechanics

<!-- uses:
- skill: building-commands
- skill: add-framework-development
- mention: add-build-ledger
- mention: add-framework-internal-layer
-->

Loaded on the first `[product]` F-block of a build. Everything here is about artefacts that ship to
users. WHAT gets recorded about execution is `add-build-ledger`'s job; the internal layer has its own
skill.

## When to Use

- An F-block naming `framwork/.codeadd/`, `framwork/provider-map.json`, or `cli/`.

## When NOT to Use

- An F-block naming `.claude/`, `scripts/` or the repo root.

**`CLAUDE.md` is the one shared file.** This skill owns the parts a product change makes stale — the
derived Project Anatomy counts and the rows describing what shipped. Every other part of it belongs
to `add-framework-internal-layer`.

---

## Also Read, Before Writing

```
framwork/.codeadd/skills/add-resource-path-convention/SKILL.md   # ALWAYS — path references
framwork/.codeadd/skills/add-ecosystem/SKILL.md                  # ALWAYS — ecosystem overview
framwork/.codeadd/skills/add-token-efficiency/SKILL.md           # ALWAYS
framwork/.codeadd/skills/add-skill-creator/SKILL.md              # IF the artefact is a skill
framwork/.codeadd/skills/add-documentation-style/SKILL.md        # IF generating docs
framwork/.codeadd/skills/add-claude-md-style/SKILL.md            # BEFORE any CLAUDE.md write
```

`add-framework-development` carries the artefact anatomies, the `<!-- uses: -->` syntax and the
build-pipeline internals. Read it when creating a new artefact type or changing how the build works.

## Source of Truth

| Type | Path | Built by `build.js`? |
|------|------|----------------------|
| Command | `framwork/.codeadd/commands/*.md` | Yes — provider files generated |
| Skill | `framwork/.codeadd/skills/*/SKILL.md` | Yes — provider files generated |
| Agent | `framwork/.codeadd/agents/*-agent.md` | Yes — only for providers declaring an `agents` pattern |
| Script | `framwork/.codeadd/scripts/*` | No — shipped verbatim |
| CLI source | `cli/src/*.js` + `cli/tests/*.test.js` | No — published as the npm package |

```
IF TEMPTED TO EDIT A framwork/ PROVIDER DIRECTORY:
  ⛔ DO NOT USE: Write or Edit on framwork/.claude/, .codex/, .cursor/, .agents/, .opencode/, …
  ✅ DO: Edit framwork/.codeadd/ and let build.js generate the rest
```

## Two Rules That Bind Every Source Edit

- **HTML comments are stripped at build.** Use them for source-only notes. `<!-- uses: -->` and
  injection markers depend on this.
- **Never write a raw `.codeadd/` path.** Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`;
  `lintResourcePaths()` warns otherwise. Scripts are the exception — always `.codeadd/scripts/`.

---

## Registration (MANDATORY for a new command, skill or agent)

An artefact absent from `framwork/provider-map.json` **fails the build** — it is built for no provider.

```json
"commands": { "<name>": { "description": "<from the command frontmatter>" } }
"skills":   { "<name>": { "providers": ["claude","antigrav","cursor","opencode"] } }
```

Default providers = all. Omit the `providers` field to get all. Use `["antigrav"]` for a skill not
exposed to the end user.

```
⛔ cli/ IS NOT IN THE REGISTRY:
  ⛔ DO NOT: Register a cli/ module in provider-map.json
  ⛔ DO NOT: Expect build.js to emit cli/ output — it never touches cli/
  ⛔ DO NOT: Apply the building-commands checklist to JavaScript — it governs .md only
  ⛔ DO NOT: Bump cli/package.json — that belongs to the release command
  ✅ DO: Edit cli/src/ and cli/tests/ directly; they ship as written
```

## Artefact Structures

**Command** — the mandatory skeleton, gates and checklist are `building-commands`. Create ONLY in
`framwork/.codeadd/commands/`.

**Skill** — frontmatter `name` + `description`, then When to Use / When NOT to Use / content /
validation checklist. Subdocs go in `references/`, never flat.

**Script** — header block naming usage, dependencies and exit codes; then detection, execution,
structured output. The header is the script's contract and its `.bats` suite pins it.

**CLI module** — one concern per module, owning its registry, its state helpers and its
`export async function <name>(cwd, args, scope)` entry. Follow `cli/src/features.js` and
`cli/src/plugins.js`. **A new subcommand is unreachable until it is registered in the dispatch AND
the help text of `cli/src/cli.js`.**

---

## Validation

### Every product F-block

```bash
node scripts/build.js
```

Exit 0, no new LINT warning. This also runs the three graph gates: a `uses:` target that does not
exist fails, an artefact missing from `provider-map.json` fails, and a name in prose with no declared
relationship fails.

### Markdown artefacts

Simulate execution against three scenarios: happy path, gate violation, edge case. Then:

- [ ] Can the agent skip a gate? Must be impossible
- [ ] Are prohibitions tool-specific, not generic?
- [ ] Is the order bypassable? Must not be

### CLI artefacts — a mental test is NOT evidence

```bash
cd cli && npx vitest run --no-file-parallelism
```

```
IF type=cli AND THE SUITE HAS NOT BEEN RUN SERIALLY:
  ⛔ DO NOT: Report the F-block complete
  ⛔ DO NOT: Claim a validation level passed
  ✅ DO: Run it and read the result
```

**Serial is not a preference.** Parallel workers race on shared fixtures and report failures that
vanish serially. Never diagnose a failure without re-running serially, and never accept a green
parallel run as proof.

**If stdout carries `Debugger listening on ws://…`**, an editor injected `NODE_OPTIONS`. Clear it
(`unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS`) before trusting any assertion on stdout or stderr.

**Baseline before blaming the change.** This suite has pre-existing flakiness. Compare against a clean
tree (`git stash`) and report the delta, never the raw count.

**TESTS ARE MANDATORY.** Every changed module needs coverage in `cli/tests/`. Where the plan specifies
a RED-first matrix, write each assertion and CONFIRM IT FAILS before the implementation — a test
authored after the fix proves nothing.

---

## CLAUDE.md — Finish the Job Here

`CLAUDE.md` is loaded into every session. A build that adds a command, flag or plugin and leaves it
describing a framework that no longer exists has not finished. **This is bookkeeping of facts the
product layer already changed — it never needs its own plan.**

### The Project Anatomy counts are DERIVED

Compute them. Never carry a number over by hand:

```bash
ls framwork/.codeadd/commands/*.md | wc -l          # Commands
ls framwork/.codeadd/skills/*/SKILL.md | wc -l      # Skills
ls framwork/.codeadd/agents/*-agent.md | wc -l      # Agents
```

**Three copies of these numbers exist, not two.** The filesystem, `provider-map.json`, and
`cli/tests/build.test.js`, which hardcodes the expected agent list and asserts `agents × providers` as
a literal. Other suites assert prose inside the command files themselves.

```
IF THE FILESYSTEM COUNT AND provider-map.json DISAGREE:
  ⛔ DO NOT: Write either number into CLAUDE.md
  ⛔ DO NOT: Report the F-block complete
  ✅ DO: Name the artefacts in the difference and fix the registration
```

An artefact on disk but unregistered ships to nobody; an entry with no file breaks the build. Either
way the disagreement is a real defect in what you just built, not a documentation nit.

Run the cli suite after any registry change. **A test encoding an OLD rule this build deliberately
replaced is UPDATED, not deleted** — with the reason in a comment above it, so the next reader does
not "restore" the bug that assertion was guarding.

### The rest of CLAUDE.md

| If this F-block… | Update |
|---|---|
| added or removed a command | the command table, and its row's purpose |
| added or removed a skill or agent | the cross-reference table, and any "used by" column naming it |
| changed the pipeline or a transform | the Pipeline section and its transform table |
| added or changed a feature flag | the Feature Injection System table |
| added or changed a plugin, fragment or injection point | the Plugin System section |
| added a schema, contract or sidecar | the section documenting that mechanism |

```
IF A CLAUDE.md SECTION IS UNRELATED TO WHAT YOU BUILT:
  ⛔ DO NOT USE: Edit to reword, reorganise or "improve" it
  ✅ DO: Leave it byte-identical
```

A build that rewrites the plugin section because it added a skill produces a diff nobody can review.

## Changelog

New or major work writes `docs/changelog/YYYY-MM-DD-<action>-<what>.md`.
Actions: `add` | `update` | `refactor` | `remove`.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "I'll edit the provider file directly, it's faster" | build.js overwrites it. Edit `.codeadd/` |
| "The suite is flaky, this failure is noise" | Baseline against a clean tree, report the delta |
| "Parallel vitest was green" | Not proof. Serial or nothing |
| "It's a small artefact, registration can wait" | Unregistered ships to nobody and fails the gate |
| "The count looks right, I'll keep it" | Compute it. Three copies must agree |
| "That test asserts the old rule, delete it" | Update it, and comment why |
| "CLAUDE.md is another command's job" | This build finishes it |

## Rules

ALWAYS:
- Edit `framwork/.codeadd/`, never a generated provider directory
- Register a new command, skill or agent in `provider-map.json`
- Run the cli suite serially after any registry change
- Compute the Project Anatomy counts and cross-check all three copies

NEVER:
- Register a `cli/` artefact in `provider-map.json`
- Bump `cli/package.json`
- Report a cli F-block complete on a mental test alone
- Reword a `CLAUDE.md` section this F-block did not invalidate
