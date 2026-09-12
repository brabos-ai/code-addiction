# Code-Addiction (ADD Framework)

Open-source framework that distributes AI-assisted development commands, skills, and agents to 5 MCP-capable providers (Claude Code, Codex, Cursor, Antigravity, OpenCode).

**This file is an overview.** It says what exists and where. The mechanics of each thing live in the command or skill that owns it — see **Where the details live** at the bottom.

## Project Anatomy

Two layers with distinct purposes.

### Product Layer — `framwork/.codeadd/`

Source of truth for distributed artefacts. Users consume these via CLI install. Commands live at
`commands/*.md`, skills at `skills/<name>/SKILL.md`, agents at `agents/*-agent.md`, scripts at
`scripts/*.sh`.

The inventory below is **generated** — `node scripts/inventory.js` writes it from disk and
`/add-framework--done` keeps it current. Do not hand-edit it, and do not add a count anywhere: an
array has a length.

[//]: # (codeadd-inventory:start)
{"commands":["add","add.audit","add.brainstorm","add.build","add.diagnose","add.done","add.hotfix","add.init","add.new","add.plan","add.plan-to-ready","add.pull-request","add.qa-setup","add.review","add.ux","add.wiki"]}
{"skills":["add-architecture-discovery","add-backend-architecture","add-backend-development","add-claude-md-style","add-code-review","add-commit","add-cross-sf-consistency","add-database-development","add-delivery-validation","add-dev-environment-setup","add-doc-schemas","add-ecosystem","add-feature-discovery","add-feature-readback","add-feature-specification","add-final-report","add-frontend-architecture","add-frontend-development","add-health-check","add-id-convention","add-investigation","add-knowledge-discovery","add-optimizing-git-workflow","add-plan-based-features","add-plan-review","add-product-discovery","add-project-scaffolding","add-qa","add-qa-migration","add-qa-spec","add-resource-path-convention","add-review-discipline","add-security-audit","add-setup-contract","add-skill-creator","add-stripe","add-subagent-driven-development","add-tasks-checklist","add-tdd","add-test-specification","add-token-efficiency","add-ux-design","add-wiki-maintenance"]}
{"agents":["architecture","backend","conformance","consistency","database","discovery","e2e","failure-analysis","feature-history","fix","frontend","git-history","plan-reviewer","qa","readback","reviewer","security","system-design","test","ux","ux-flow","ux-layout"]}
{"scripts":["build-ledger.sh","build-setup.sh","converge-gates.sh","delivered.sh","done.sh","get-branch-metadata.sh","get-main-branch.sh","init.sh","log-iteration.sh","log-jsonl.sh","migrate-ids.sh","next-id.sh","qa-evidence.sh","qa-preflight.sh","review-package.sh","status.sh","task-brief.sh"]}
{"templates":["feature-about-template","feature-discovery-template","hotfix","hotfix-template"],"fragments":["docs-pruning","qa-pipeline","tdd-pipeline"],"plugins":["gitnexus","playwright"],"transforms":["gemini/commands.md"],"sidecars":["artefact-graph.json","contracts.json","injection-points.json"]}
[//]: # (codeadd-inventory:end)

### Product Layer — `mcp/`

**A product-layer directory at the repository ROOT, and the only one.** It holds the knowledge-graph
MCP server: the corpus registry, the two parsers, the query engine and the stdio transport.

```
⛔ THE ROOT-MEANS-INTERNAL RULE DOES NOT REACH IT:
  ⛔ DO NOT: Tag an F-block touching `mcp/` as [internal] because it sits at the root
  ✅ DO: Tag it [product] — `scripts/build.js` copies it to `cli/src/mcp/` and it ships in the
         npm package, which is what decides the layer
```

Nothing under `mcp/` is registered in `provider-map.json`: it is CLI source, like `cli/src/`, not an
artefact the build distributes to providers. It takes **no dependency at all**, `yaml` included,
because `--corpus=artefacts` runs from the repository root where the CLI's `node_modules` is off the
resolution path. Its files are `.mjs` for the same reason — the root is CommonJS and `cli/` is ESM,
and one source has to read the same way in both.

### Internal Layer — `.claude/`

Development tools that build and maintain the framework itself. One file per artefact, no provider mirror. NOT distributed to users, and absent from `provider-map.json`.

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md` — flat namespace `add-framework--*`, no sub-prefix |
| Skills | `.claude/skills/<name>/SKILL.md`, subdocs in `references/` |
| Agents | `.claude/agents/*.md` |
| Plans | `docs/plans/` — gitignored working artefacts, local only |
| Deliveries | `docs/deliveries/<plan-basename>/` — tracked. A closed-out plan's documents, archived by `add-framework--done` STEP 6 |

### Internal commands

| Command | Purpose | Operates on |
|---------|---------|-------------|
| `add-framework--plan` | Strategic consultant; generates one plan for both layers | Both layers |
| `add-framework--build` | Executes a plan; each F-block's layer tag selects the rules. Dispatches a cold readback before the first F-block and one adversarial audit after the last | Both layers |
| `add-framework--brainstorm` | Collaborative ideation; precedes `add-framework--plan` | Both layers |
| `add-framework--sync` | Regenerates ecosystem map, README, web docs | `README.md`, `web/`, SVGs |
| `add-framework--release` | Tags, GitHub releases, CLI publish | Git tags, `cli/` |
| `add-framework--done` | Close-out — gates, `gh` merge, index entry, cleanup | Branches, PRs, `docs/delivered.jsonl` |
| `add-framework--roadmap` | Records what to do next — add, update or remove an item, then commits and pushes straight to `main` | `docs/roadmap/index.md` |

## Pipeline

```
framwork/.codeadd/  (source of truth)
  ↓
node scripts/build.js  (reads framwork/provider-map.json)
  ↓  lintResourcePaths → stripHtmlComments → resolveResourcePaths → TRANSFORMER[format] → write
framwork/.claude/, framwork/.agents/, framwork/.gemini/, ...  (15 provider dirs)
  ↓
cli/src/installer.js  (downloads release ZIP, installs to user's project)
  ↓  applyEnabledFeatures (injects feature fragments post-install)
user's project (.claude/, .gemini/, .cursor/, ...)
```

Two rules bind anyone editing an artefact:

- **HTML comments (`<!-- -->`) are stripped at build.** Use them for source-only notes. Injection markers and `<!-- uses: -->` blocks rely on this.
- **Never write a raw `.codeadd/` path.** Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; `lintResourcePaths()` warns otherwise. Scripts are the exception — always `.codeadd/scripts/`.

Key files:

| File | Role |
|---|---|
| `framwork/provider-map.json` | Single registry of every command, skill, agent and its provider distribution |
| `scripts/build.js` | Compiles `.codeadd/` source → 15 provider output dirs, and emits the sidecars |
| `scripts/graph.js` | Queries the artefact graph — `impact`, `dependencies`, `path`, `orphans`, `history`, `mermaid` |
| `mcp/` | The knowledge-graph MCP server — one binary over two corpora, selected by `--corpus`. `scripts/graph.js` stays the shell-out surface; the two read one emitted sidecar and `cli/tests/mcp-engine.test.js` asserts they answer identically |
| `scripts/run-bats.js` | Backs `npm run test:scripts` — runs the suite natively, or in a Linux container on Windows |
| `cli/` | npm package (`npx code-addiction`) that installs the framework |
| `framwork/.codeadd/scripts/*.sh` | Shipped verbatim. Each documents its own usage and exit codes in its header |

### Build-emitted sidecars

All three are gitignored and packaged explicitly by `release.yml`. `SIDECARS` in `scripts/build.js` is the single list every consumer is checked against.

| Sidecar | Carries | Read by |
|---|---|---|
| `injection-points.json` | Content anchors for feature/plugin injection | `cli/src/features.js`, `plugins.js` |
| `contracts.json` | The `shape` of every `## Materializes` block | `status.sh` |
| `artefact-graph.json` | Typed relationship map over `framwork/.codeadd/` and `.claude/` | `scripts/graph.js` only |

### Providers

The 5 supported providers (claude, codex, cursor, antigrav, opencode) are all MCP-capable and markdown-native. Commands and skills build to all 5 by default; agents only to providers declaring an `agents` pattern. Antigravity agents are deliberately deferred — its native `.agents/agents/` collides with the Codex skills root. Per-provider capabilities and distribution overrides live in `provider-map.json` → `providers.{name}`.

## Feature Injection System

Optional features inject content into commands **post-install**, so they can be toggled with `codeadd features enable|disable <name>`. Command source carries `<!-- feature:FEATURE:SECTION -->` markers; the build strips them into `injection-points.json` and installed files ship marker-free.

| Component | Path |
|-----------|------|
| Fragment source | `framwork/.codeadd/fragments/{feature}/{command}.md` |
| Feature registry | `cli/src/features.js` |
| Injection helpers | `cli/src/injection-core.js` |
| Manifest state | `.codeadd/manifest.json` → `features` |

| Feature | Default | Affected commands |
|---------|---------|-------------------|
| `tdd-pipeline` | enabled | add.plan, add.build, add.review, add.hotfix |
| `qa-pipeline` | disabled | add.plan, add.build |
| `docs-pruning` | disabled | add.done |

## Plugin System

A `plugin` integrates an **external MCP tool** — distinct from a feature. codeadd owns utilization, never installation: it validates the tool is present, injects additive guidance into commands **and agent definitions**, activates plugin-bound skills, and points at the tool's own installer. Disabled by default.

| Component | Path |
|-----------|------|
| Catalog (baked into CLI) | `cli/src/plugins.json` |
| Command fragments | `framwork/.codeadd/plugins/{plugin}/fragments/{command}.md` |
| Agent fragments | `framwork/.codeadd/plugins/{plugin}/fragments/agents/{agent}.md` |
| Plugin skills | `framwork/.codeadd/plugins/{plugin}/skills/{skill}/SKILL.md` |
| Plugin module | `cli/src/plugins.js` |
| Manifest state | `.codeadd/manifest.json` → `plugins` |

Agent injection carries plugin capability across the command→subagent boundary, so a fragment travels with the agent into every command that dispatches it. An agent is excluded by carrying no marker — that is how the read-only allowlist agents stay MCP-free.

## Setup Contracts

A command that materializes state into a user's project declares a `## Materializes` H2. The build hashes it into `contracts.json` as a `shape`; the command writes a **receipt** carrying the same hash. Equal → current. Different → stale.

| Component | Path |
|---|---|
| Contract declaration | `## Materializes` H2 in the command source |
| Receipt schema | `add-doc-schemas/references/receipt.md` |
| Receipt in user project | `docs/qa/qa-setup.md` |
| Comparison procedure | `add-setup-contract` skill |
| Signal | `SETUP_QA:` / `SETUP_QA_STALE:` from `status.sh` |

Current consumer: `add.qa-setup` only. `add.wiki` keeps its own git-based `.meta.json` staleness — the two coexist deliberately.

## Web / Documentation

| File | Purpose |
|------|---------|
| `web/src/pages/index.astro` | Landing page |
| `web/src/pages/docs.astro` | Documentation page |
| `web/public/commands.svg` | Visual command map |
| `web/public/flows.svg` | Workflow flows diagram |
| `web/public/flowchart.svg` | Architecture flowchart |
| `README.md` | Repository documentation |

Auto-updated by `add-framework--sync` before releases (4 analyzer agents in parallel).

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Push/PR | Tests and validation |
| `.github/workflows/release.yml` | Tag push (`v*`) | Build + create GitHub release |
| `.github/workflows/deploy-web.yml` | Push/PR | Deploy web documentation |

## Where the details live

This file deliberately stops at the overview. Load the owner when you need the mechanics.

| Topic | Owner |
|---|---|
| Authoring a command, skill or agent | `building-commands`, `add-framework-development` |
| The prompt quality ruler — its eight items, and the reviewer that ticks them | `building-commands`, `@prompt-review-agent` |
| Writing or revising a plan document, and the changelog filename | `add-plan-authoring` |
| Ledger, rulings, hard stops, one commit per F-block | `add-build-ledger` |
| Product-layer build mechanics | `add-framework-product-layer` |
| Internal-layer build mechanics | `add-framework-internal-layer` |
| `<!-- uses: -->` syntax, graph gates, node identity | `add-framework-development` § 8 |
| `{{cmd:}}` / `{{skill:}}` resolution | `add-resource-path-convention` |
| What belongs in a `CLAUDE.md` | `add-claude-md-style` |
| Doc schemas, voice, output length | `add-doc-schemas` |
| How a command closes its final report | `add-final-report` — one per layer, deliberately not shared |
| Setup-contract comparison | `add-setup-contract` |
| A script's contract and exit codes | that script's own header, plus its `.bats` suite |
| Injection anchor internals | `cli/src/injection-core.js` |
