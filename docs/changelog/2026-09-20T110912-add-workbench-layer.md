# The workbench layer — the framework's own pipeline gets a source root, a build and a second provider

> **Date:** 2026-09-20
> **Plan:** `docs/plans/2026-09-20T110912-PLAN--workbench-layer.md`
> **Layer:** internal

The internal layer's artefacts — the pipeline stages, their support skills, the eight internal
agents — moved off `.claude/` as source and onto `workbench/`. A second, registry-driven build
compiles that source into `.claude/` and `.opencode/` at the repository root, generated and
gitignored. Development of code-addiction itself is now workable from OpenCode, inside this
repository, not only from Claude Code.

## Added

- **`workbench/`** — the internal layer's source root: `commands/`, `skills/`, `agents/`, holding
  the 25 artefacts moved from `.claude/`. `workbench/provider-map.json` is a second registry,
  targeting claude and opencode only, each declaring its own `structuredQuestions` capability.
- **`scripts/build-workbench.js`** — a second build entry point, `require`-ing `scripts/build.js`
  and reusing `buildResources` unchanged. It supplies its own three source strategies pointed at
  `workbench/`, asserts the registry and the tree agree before writing anything
  (`assertRegistryMatchesTree`), and emits 56 files across the two providers. `npm run
  build:workbench` runs it.
- **`cli/tests/build-workbench.test.js`** — the coverage the new entry point gets: registry/tree
  parity, the output paths, `.claude/settings.json` left byte-identical, and the four internal
  agents' dialect translation asserted directly.
- **A markdown fallback for the structured-question gate** in the brainstorm stage, selected on the
  `structuredQuestions` capability — the sharpest portability case in the set, because that stage
  had no fallback before this and said so in its own text.

## Changed

- **`scripts/build.js`** — the internal graph corpus now reads `workbench/`, not `.claude/`
  (`collectNodes`, `buildArtefactGraph`); `lintResourcePaths` warns on a raw `.claude/` or
  `.opencode/` path in workbench source, the way it already warned on a raw `.codeadd/` path; the
  cross-layer gate's wording states the reason that still holds — a distributed artefact must not
  name a workbench artefact, because the user never receives one. `buildResources` and the three
  product strategies are untouched.
- **`mcp/corpora.mjs`** — the docs corpus indexes `workbench/`, not the generated `.claude/` output.
  Left pointed at the output, the corpus reads edge-free nodes and reports a graph with no
  relations in it — every `<!-- uses: -->` block is stripped at build.
- **The four internal agents** (`framework-discovery-agent`, `plan-readback-agent`,
  `plan-review-agent`, `prompt-review-agent`) now pass through `AGENT_DIALECTS` for the first time:
  `model:` is stripped for opencode, `readonly:` is translated per dialect, and their hand-written
  rationale for those choices moved into a source-only HTML block instead of leaking into built
  frontmatter.
- **`.gitignore`** — the generated provider trees are ignored by their three subdirectories
  (`/.claude/commands/`, `/.claude/skills/`, `/.claude/agents/`, and the `.opencode/` equivalents),
  never by the provider directory itself — `.claude/settings.json` stays tracked.
- **`.github/workflows/ci.yml`** — runs `node scripts/build-workbench.js` on every push, right
  after the product build. Deliberately absent from `release.yml`: nothing under `workbench/` ships,
  so a failure here can never block a product release, and this is the only place its correctness
  is enforced — its output is gitignored, so it is invisible both locally and in review otherwise.
- **`CLAUDE.md`** — the Internal Layer section now describes `workbench/` as the source, the
  generated output, and the "has a provider mirror and reaches no user" rule that replaces "NOT
  distributed, no provider mirror".
- **`workbench/skills/add-framework-internal-layer/SKILL.md`** — the decision node, rewritten
  rather than extended: the invariant it stated is what this delivery changes.
- **Claude tool names given way to the action they perform** in
  `workbench/skills/add-framework-development/SKILL.md`, pointing at the provider-neutral
  vocabulary `building-commands/references/agent-dispatch.md` already owns, instead of restating it.

## Fixed

**`git-history-agent` declared `readonly: true` with `tools: Bash, Read`**, was described as
"read-only git", and shipped with `bash: deny` — its only route closed while its own declaration
said otherwise. Found while wiring `AGENT_DIALECTS` over the internal agents; it is a product
artefact, not a workbench one. One line over 22 product agents; `edit: deny` stays unconditional.

**`workbench/skills/add-framework-development/SKILL.md` carried two H2s both numbered `## 8.`**
(`Patterns to Enforce`, `Declaring Relationships`), so the two citations of "§ 8" — in
`add-framework-internal-layer` and in `CLAUDE.md` — resolved to neither. Found by a
`@prompt-review-agent` audit of `add-framework-internal-layer` run after the rest of this plan was
built. The second heading becomes `§ 9`; `building-commands:480`, the ruler's own worked example of
this exact defect, was left reading "§ 8" on purpose — it quotes the failure, it does not point at
a section.

## Not included

Any provider beyond claude and opencode — cursor, codex and antigrav become rows in
`workbench/provider-map.json` later. No ZIP packaging, no `npx` flag, no `cli/src/` change: the
target is this repository only, so the build **is** the install. `framwork/` keeps its name and
`mcp/` stays where it is, at the repository root, still product. `buildResources` and the three
product strategies were not modified.
