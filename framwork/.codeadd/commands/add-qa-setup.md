---
description: End-to-end-verified QA bootstrap — verifies + installs the QA runner, generates qa-project, scaffolds config/screens, ignores ephemeral working evidence under a setup contract, migrates existing QA, and proves the setup with the QA preflight
argument-hint: "[feature-id] [--migrate] [--upgrade]  (feature-id scaffolds that feature's screen catalog, e.g. /add-qa-setup 0001F; --migrate reopens the migration decision; --upgrade forces a full re-materialize even when the shape matches)"
---

# QA Setup - Prerequisites, Config Bootstrap & End-to-End Verification

<!-- uses:
- skill: add--human-interaction (conditional)
- skill: add--dev-environment-setup
- skill: add--doc-schemas
- skill: add--delivery-mode (conditional)
- skill: add--final-report
- skill: add--qa
- skill: add--qa-migration
- skill: add--settings
- skill: add--setup-contract
- skill: add--subagent-driven-development
- skill: add--subagent-driven-development/references/dispatch-rules.md
- agent: e2e-agent
- command: /add-build
- command: /add-review
- script: qa-evidence.cjs
- script: qa-preflight.cjs
- script: status.cjs
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Conversational bootstrap for QA validation that proves it works end-to-end. Functionally verifies (not merely detects) the `@playwright/test` runner + chromium + `@playwright/mcp`, installs missing prerequisites with confirmation, generates a project-specific `qa-project` skill, scaffolds the **project-specific QA config** (the `qa` section of `.codeadd/settings.json`) + per-feature reachability-aware screen catalog (`FEATURE_DIR/_tests/screens.json`), autonomously migrates an existing QA flow when the scan finds tooling it has no recorded decision for (confirm-then-dogfood), and proves the setup with the deterministic QA preflight — the first real `/add-review` is what proves QA end to end. Runs BEFORE the `playwright` plugin is enabled — it is the base, non-injected setup.

---

<!-- slot:agent-mode.interaction fallback="fallbacks/agent-mode.interaction.md" -->
<!-- feature:agent-mode:interaction -->
<!-- /feature:agent-mode:interaction -->
<!-- /slot:agent-mode.interaction -->

## Required Skills

Load `{{skill:add--dev-environment-setup/SKILL.md}}` before STEP add-qa-setup.diagnose (OS detection + confirm-before-install methodology).
Load `{{skill:add--doc-schemas/SKILL.md}}` before STEP add-qa-setup.catalog (feature doc layout, `_tests/` per-run path + `screens.json` reachability schema, `qa-validation` conventions).
Load `{{skill:add--qa-migration/SKILL.md}}` before STEP add-qa-setup.migration (existing-QA migration sequence + checkpoints).
Load `{{skill:add--subagent-driven-development/SKILL.md}}` before STEP add-qa-setup.migrate (dispatch template, decision log, review gates — the mechanism the migration dispatch uses).
Load {{skill:add--setup-contract/SKILL.md}} before STEP add-qa-setup.context (receipt classification, shape comparison, receipt rewrite).
Load {{skill:add--settings/SKILL.md}} before STEP add-qa-setup.config (the `.codeadd/settings.json` rules, the `qa` section schema, the receipt fields and the `log`). It stays in force through STEP add-qa-setup.receipt and STEP add-qa-setup.validate.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP add-qa-setup.context: Load context             → status.cjs + add--dev-environment-setup + flags + receipt classification
STEP add-qa-setup.feature-gate: Feature gate             → qa-pipeline opt-in: probe state → CONFIRM → enable → VERIFY the fragment landed
STEP add-qa-setup.diagnose: Diagnose + verify        → OS/pkg/node; FUNCTIONALLY invoke runner + chromium + MCP (no install yet)
STEP add-qa-setup.install: Install prerequisites    → runner (mandatory) + chromium + MCP (optional) → CONFIRM → execute → functionally verify
STEP add-qa-setup.migration: Detect migration         → ALWAYS scan; ask only when the detected fingerprint differs from the receipt
STEP add-qa-setup.qa-project: Generate qa-project      → <provider skills dir>/qa-project/SKILL.md (shape from ## Materializes)
STEP add-qa-setup.config: Scaffold QA config       → .codeadd/settings.json, `qa` value fields (interactive, project-wide; shape from ## Materializes)
STEP add-qa-setup.catalog: Scaffold catalog         → FEATURE_DIR/_tests/screens.json (shape from ## Materializes)
STEP add-qa-setup.ignore: Ignore working evidence  → materialize the dedicated QA block in .gitignore
STEP add-qa-setup.migrate: Autonomous migration    → IF MIGRATE: dispatch add-new→add-plan→add-build→add-review (checkpoints only)
STEP add-qa-setup.proof: Setup proof              → qa-preflight.cjs a (+ b when a feature has screens.json); no nested review or build
STEP add-qa-setup.receipt: Write the receipt       → .codeadd/settings.json, `qa` receipt fields + `qa.log` (rewritten even on a no-op)
STEP add-qa-setup.validate: Validation gate         → JSON check of the `qa` section against the add--settings schema
STEP add-qa-setup.handoff: Hand-off                → enable plugin (optional) + /add-review for the QA judgement + migration/proof/contract summary
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP add-qa-setup.feature-gate** | User has not confirmed the enable | Running `codeadd features enable` | Show the command + what stays broken with the feature off; WAIT for explicit confirmation |
| **STEP add-qa-setup.feature-gate** | User declined the enable | Re-asking, marking QA as on | Record it as a remaining manual step for the STEP add-qa-setup.handoff hand-off; continue setup |
| **STEP add-qa-setup.feature-gate** | Enable ran but the injected section is absent (pre-sidecar no-op) | Reporting QA as on | Route to `codeadd update` / re-install; record QA as NOT active |
| **STEP add-qa-setup.diagnose** | Environment not diagnosed | Bash install commands, downloads | Detect OS/pkg-manager/node; functionally probe existing prereqs |
| **STEP add-qa-setup.install** | User has not confirmed the shown commands | Bash to run any install/download | Show exact commands + WAIT for explicit confirmation |
| **STEP add-qa-setup.install** | Install runs | Silent/unattended install | Confirm-then-execute, one command set at a time, functionally verify after |
| **STEP add-qa-setup.install** | Runner not installed | Authoring/running specs | Install `@playwright/test` first |
| **STEP add-qa-setup.migration** | Existing tooling found | Entering migration mode silently | Ask the user; set MIGRATE only on explicit confirmation |
| **STEP add-qa-setup.migration** | Always | Skipping the scan because the project is not first-run | Scan on every run; compare against `migration.detected` in the receipt; ASK only on a fingerprint change or `--migrate` |
| **STEP add-qa-setup.migration** | Fingerprint unchanged and a decision is recorded | Re-asking the user | Stay silent; the recorded decision stands |
| **STEP add-qa-setup.qa-project-9** | Always | Edit/Write on source code, app files, migrations | Write only the `qa` section of `.codeadd/settings.json` (read, merge, write — never another section), `FEATURE_DIR/_tests/`, the resolved provider skills dir (`qa-project/`), and STEP add-qa-setup.ignore's root `.gitignore`. Single named exception: STEP add-qa-setup.feature-gate's CLI-mediated `codeadd features enable qa-pipeline`, which rewrites installed provider command files via the CLI — never via direct Edit/Write |
| **STEP add-qa-setup.catalog** | `FEATURE_DIR/_tests/screens.json` already exists | Overwriting catalog content | Leave the file — `{{cmd:add-plan}}` owns content |
| **STEP add-qa-setup.ignore** | QA evidence block not materialized exactly once | Running migration | Normalize the QA block while preserving installer-managed and user-authored content |
| **STEP add-qa-setup.migrate** | Dispatched subagent hits an install or a file overwrite | Proceeding autonomously | Pause and surface the decision to the user |
| **STEP add-qa-setup.migrate** | Migration branch produced | Merging autonomously | Hand the branch back for user review |
| **STEP add-qa-setup.proof** | No feature with a scaffolded `screens.json` exists | Forcing a synthetic feature, or running preflight `b` | Run `a` only; note in hand-off that `b` was not run |
| **STEP add-qa-setup.proof** | A preflight row still fails | Dispatching `/add-review` or `/add-build` to prove setup, or looping | Fix it here when install or config can; otherwise report the row and its remedy in the hand-off |
| **STEP add-qa-setup.context** | Receipt absent but materialized state present | Treating the project as FIRST-RUN | Classify STALE and re-materialize under the merge rules |
| **STEP add-qa-setup.feature-gate Phase A rows 8–9** | `QA_RECEIPT` or `QA_CONTRACT_MATCH` is not `ok` | Stopping the setup run | Treat as work-to-do — this command is the remedy |
| **STEP add-qa-setup.receipt** | Always | Editing or deleting an existing `qa.log` entry | Append only |

---

## Materializes

> **Single source of truth for every shape this command writes.** STEP add-qa-setup.qa-project through STEP add-qa-setup.ignore write exactly what is declared here — they do not restate a shape. The framework build extracts this block into `.codeadd/contracts.json`; changing anything below moves `shape` and every installed project will need `/add-qa-setup`. Resource-path variables (`{{cmd:}}`, `{{skill:}}`, `{{addpath:}}`) are FORBIDDEN inside this block — they resolve per provider and would produce a different `shape` per build target.

```yaml
contract: add-qa-setup
shape: sha256:5a8b5405851bf4d8
changed-in: 1.7.0
paths:
  - path: .codeadd/settings.json#qa
    owner: shared
    step: 7
  - path: <provider skills dir>/qa-project/SKILL.md
    owner: setup
    step: 6
  - path: FEATURE_DIR/_tests/screens.json
    owner: shared
    step: 8
  - path: .gitignore
    owner: shared
    step: 9
```

### .codeadd/settings.json#qa

The value fields of the `qa` section. The receipt fields are written by STEP add-qa-setup.receipt and are not part of this shape.

```json
{
  "qa": {
    "baseUrl": "http://localhost:5173",
    "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
    "bootHint": "how to start the app's dev server (free text, project-specific)",
    "authSeed": "how an authenticated session is obtained for auth:true screens (free text / steps)"
  }
}
```

### FEATURE_DIR/_tests/screens.json

```json
{
  "feature": "<feature-id>",
  "screens": [
    { "id": "login", "sf": "SF02", "name": "Login", "kind": "route",
      "path": "/login", "auth": false,
      "design": "docs/features/<id>-.../subfeatures/SF02-.../design.md" },
    { "id": "entry-form", "sf": "SF01", "name": "Entry form", "kind": "modal",
      "open": [{ "goto": "/entries" }, { "click": "role=button[name=New entry]" }],
      "auth": true,
      "design": "docs/features/<id>-.../subfeatures/SF01-.../design.md" }
  ]
}
```

### .gitignore

```gitignore
# ADD QA evidence - managed by add-qa-setup
docs/features/**/_tests/run-*/
# END ADD QA evidence
```

### `<provider skills dir>/qa-project/SKILL.md`

```markdown
---
name: qa-project
description: Use when authoring E2E specs (/add-build) or judging QA (/add-review) in this project — carries the project-specific runner conventions + managed app lifecycle.
---

# Project QA Conventions

## Conventions
- **Runner:** <e.g. @playwright/test>
- **Run one spec:** `<command to run a single spec>`
- **Run full suite:** `<command to run all specs>`
- **Spec location + naming:** `<dir>` · `<surface>.qa.spec.<ext>`
- **Selectors:** MANDATORY `getByRole` / `data-testid` — never brittle CSS/xpath.
- **Screenshots:** `<screenshot API>` → `_tests/run-NNN/screenshots/<screen>.<state>.<viewport>.png` (one file per screen × state × viewport; `<state>` from the spec's `capture states`, `default` when single-state)
- **Computed styles:** `_tests/run-NNN/computed-styles/<screen>.<viewport>.json` (minified; one file per screen × viewport, capturing the resolved values for each `## Design Contract` dimension verified by computed style)
- **a11y:** <axe-core wiring, e.g. @axe-core/playwright>
- **Evidence lifecycle:** allocate with `.codeadd/scripts/qa-evidence.cjs next`; new runs write only to `_tests/run-NNN/`. `/add-done` alone promotes the reviewed baseline to immutable `_tests/final/run-NNN/`.

## Managed App Lifecycle
Both `/add-build` (E2E green-confirm) and `/add-review` (QA run) invoke this procedure:
1. **Probe** `qa.baseUrl` (from `.codeadd/settings.json`).
2. If **down**: boot the app as a managed process (this step owns it and tears it down in step 4 — it is not pending work) using `<boot command / qa.bootHint in .codeadd/settings.json>`, then **wait-for-ready** by polling `baseUrl` with a bounded timeout.
3. **Run** the spec(s).
4. **Teardown** the app **iff we booted it** — never kill a dev server the user already had running.
5. On **boot failure / timeout**: do NOT hang — author-only and **defer the run to `/add-review`** with a flagged note.

## Auth / Seed
- `<how an authenticated session is obtained for auth:true surfaces, from qa.authSeed in .codeadd/settings.json>`
```
---

## STEP add-qa-setup.context: Load Context

### STEP add-qa-setup.run-status Run status.cjs
```bash
node .codeadd/scripts/status.cjs
```
Parse: PROJECT_DOCS, package manager hints, features under `docs/features/`.

### STEP add-qa-setup.load-install-methodology Load install methodology
Read {{skill:add--dev-environment-setup/SKILL.md}} — reuse its OS-detection + confirm-before-install discipline. This command installs (confirm-then-execute), it does NOT merely instruct.

### STEP add-qa-setup.parse-flags Parse flags
- `--migrate` → `FORCE_MIGRATE = true`: STEP add-qa-setup.migration asks about migration even when the fingerprint is unchanged and a decision is already recorded.
- `--upgrade` → `FORCE_UPGRADE = true`: STEP add-qa-setup.context re-materializes even when the recorded shape matches the shipped one, and performs the drift check unconditionally.
- Neither flag is required for normal operation. Stale-detection and migration re-offer are automatic.

### STEP add-qa-setup.resolve-target-feature Resolve target feature (optional)
- If a `feature-id` arg was given → `FEATURE_DIR = docs/features/<feature-id>-*`.
- Else → list features under `docs/features/` and ask which feature's screen catalog to scaffold (STEP add-qa-setup.catalog). Config (STEP add-qa-setup.config) is project-wide regardless.

### STEP add-qa-setup.classify-receipt Classify + compare (add--setup-contract)
Read `SETUP_QA:` / `SETUP_QA_STALE:` from the STEP add-qa-setup.context output, then run the {{skill:add--setup-contract/SKILL.md}} procedure against the `qa` section of `.codeadd/settings.json`.

Outcome sets `SETUP_STATE` for the rest of the run:
- `FIRST-RUN` — no receipt AND no `owner: setup` path exists. Materialize normally; STEP add-qa-setup.receipt creates the receipt.
- `CURRENT` — recorded `setup-shape` equals the shipped sidecar `shape`. Drift check only (unless `--upgrade`).
- `STALE` — anything else: no receipt but state present, unreadable `setup-shape`, or hash mismatch. Re-materialize under the merge rules (per-key `qa` value fields, regenerate `qa-project`, create-if-absent empty `screens.json`).

Phase A rows 8–9 (`QA_RECEIPT`, `QA_CONTRACT_MATCH`) from `qa-preflight.cjs a` are **work-to-do in this command**, never a stop. The QA preflight `qa-pipeline` injects into `{{cmd:add-review}}` interprets the same rows as `block`.

⛔ `FIRST_RUN` (the old config-presence proxy) is RETIRED. Do not reintroduce it. Do not backfill a missing receipt. Do not walk a versioned delta list.

---

## STEP add-qa-setup.feature-gate: Feature Gate — qa-pipeline opt-in

Running this command is unambiguous QA intent, and everything it installs is inert while the `qa-pipeline` feature is off: `add-plan` authors no QA spec, `add-build` dispatches no `@e2e-agent`, and `add-review` carries no QA steps at all — its preflight, evidence capture and judge pair arrive with the feature, so with the feature off there is no judgement either. The feature/plugin split is canonical in `{{skill:add--qa/SKILL.md}}` ("Feature vs plugin").

⛔ **The receipt this command writes does not restore judgement on its own.** Two gates, and the canonical statement in `{{skill:add--qa/SKILL.md}}` says which one decides what. The consequence here: a project with the receipt and the feature off gets a code review and nothing else.

### STEP add-qa-setup.probe-feature Probe the feature state
```bash
node .codeadd/scripts/qa-preflight.cjs a
```
Read `QA_FEATURE_STATE` — the RAW manifest value. Resolve `unset` / `no-manifest` by the feature's default: `qa-pipeline` defaults to **disabled**. (The manifest lives at `{{addpath:manifest.json}}`; never probe the raw `features` field alone — a project that never toggled a feature has no `features` key at all.)

### STEP add-qa-setup.offer-enable Offer the enable (confirm-then-execute)
IF the feature resolves to disabled → explain what stays broken while it is off, show the exact command `codeadd features enable qa-pipeline`, and run it ONLY after explicit confirmation — the same discipline as the STEP add-qa-setup.install installs.
On decline → record it for the STEP add-qa-setup.handoff hand-off and continue setup.
Record the outcome for STEP add-qa-setup.receipt as `qa-pipeline-feature`: `enabled` | `already-enabled` | `declined` | `enable-noop`.

### STEP add-qa-setup.verify-enable Verify the enable actually landed
After a confirmed enable, probe the installed plan command ({{cmd:add-plan}}) for the injected `STEP qa-pipeline.qa-spec` section. Four outcomes, and they are not the same:

- Section present → the enable landed. Record QA as active.
- The feature resolves disabled, or the user declined the enable → the section is absent because qa-pipeline is off. That is not a failed injection. Continue setup and say so at the hand-off.
- The feature is enabled, `injection-points.json` is v2, and the member warned (missing file, missing section, or bad payload) → the flag stays on. This is not a silent no-op and it is not "QA is off". Record the warning, keep the request, and do not tell the user to disable the feature. Same distinction as the QA axis self-check in {{cmd:add-plan}}.
- `injection-points.json` is absent or is not v2 → an unsupported install. The CLI warns and injects nothing. Route the user to `codeadd update` / re-install, record QA as NOT active for the hand-off, and continue.

---

## STEP add-qa-setup.diagnose: Diagnose + Functionally Verify (silent — no installs)

Detect the environment, then **functionally verify** each prerequisite — invoke it trivially, do not stop at "present in package.json." For the deterministic rows (config presence, runner, chromium, `qa-project` skill), reuse the shared probe: `node .codeadd/scripts/qa-preflight.cjs a` — do not re-derive what it already reports. A prerequisite counts as present ONLY if its trivial invocation works:

- OS + package manager + node/npx availability (per `add--dev-environment-setup`).
- **`@playwright/test` runner** — resolvable AND runnable: a trivial `npx playwright --version` / spec-list invocation succeeds (not just listed in devDependencies).
- **chromium for Playwright** — actually launchable: a trivial headless launch/health probe succeeds (not just present in the browsers cache).
- **`@playwright/mcp`** — the server binary responds to a trivial invocation, and if already wired for the active provider, the MCP tool answers a trivial call (for Claude Code, `claude mcp list` shows it AND it is reachable).
- **`add-review` / `add-build` QA working dependencies** — confirm the pieces those commands rely on (runner + browsers + config surface) are functionally available, not merely declared.

Build a gap list distinguishing **missing** from **present-but-non-functional** (declared yet failing invocation) — the runner is mandatory, chromium/MCP optional. Present it before proposing any command.

---

## STEP add-qa-setup.install: Install Prerequisites (confirm-then-execute + functional verify)

<!-- slot:agent-mode.install-confirm fallback="fallbacks/agent-mode.add-qa-setup.install-confirm.md" -->
<!-- feature:agent-mode:install-confirm -->
<!-- /feature:agent-mode:install-confirm -->
<!-- /slot:agent-mode.install-confirm -->

**Who runs the install.** This command runs `npm`/`npx` installs itself (`npm i -D @playwright/test`, `npx playwright install chromium`, `@playwright/mcp`) after the confirmation above. Anything that needs `sudo` or an interactive installer follows `{{skill:add--dev-environment-setup/SKILL.md}}` instead: show the command, the user runs it, then verify it functionally.

Prerequisites (adapt commands to the detected OS/provider):
- **`@playwright/test` runner (mandatory)** — e.g. `npm i -D @playwright/test` (adapt to detected pkg manager). Powers the deterministic layer + plugin-off degradation. If declined → record as a blocking manual step; downstream authoring cannot run.
- **chromium for Playwright** — e.g. `npx playwright install chromium`. Verify with a trivial headless launch.
- **Playwright MCP server (optional — only the live-driving arm of `/add-review` needs it)** — the server runs via `npx @playwright/mcp@latest`; wire it as an MCP server for the active provider. For Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`. For other providers, add the equivalent MCP server entry to that provider's MCP config (the same `npx @playwright/mcp@latest` command).

⛔ Skip a prerequisite only if STEP add-qa-setup.diagnose proved it already **functional**. ⛔ If the user declines a command, stop that install and record it as a remaining manual step in the hand-off (STEP add-qa-setup.handoff).

After installs, confirm the MCP server is reachable AND answers a trivial call. If it does not, the wiring is incomplete — surface it; the QA judgement cannot drive without it.

Record each prerequisite's outcome for STEP add-qa-setup.receipt as `installed` | `already-present` | `declined` | `failed` | `not-offered`. A declined prerequisite is a recorded decision, not an unfinished install — it must never be re-asked on a later run unless the user passes `--upgrade`.

---

## STEP add-qa-setup.migration: Detect Migration (fingerprint-gated)

Scan on **every** run — the scan is a few globs and costs nothing. The friction this step must avoid is **re-asking**, not re-scanning.

### STEP add-qa-setup.scan Scan
Detect existing QA/test tooling: Cypress (`cypress.config.*`), Jest (`jest.config.*`), Vitest (`vitest.config.*`), standalone Playwright, or a custom runner (test scripts in `package.json`, a `tests/`/`e2e/`/`cypress/` dir). Produce `DETECTED` — the sorted list of tooling ids found. `[]` when nothing is found.

### STEP add-qa-setup.compare-against-receipt Compare against the receipt fingerprint
Read `migration.detected` + `migration.decision` from the receipt (empty when `SETUP_STATE` is `FIRST-RUN`).

| Recorded `detected` | `DETECTED` now | Recorded decision | Behaviour |
|---|---|---|---|
| — (first run) | non-empty | — | **ASK** |
| — (first run) | `[]` | — | Silent; record `decision: none-found` |
| equal | equal | `declined` | **Silent.** The decision stands |
| equal | equal | `migrated` \| `none-found` | Silent |
| differs (new tooling appeared) | any | any | **ASK** — the situation changed |
| any | any | any | **ASK** when `FORCE_MIGRATE` is true |

### STEP add-qa-setup.decide Decide
- **ASK** → describe what was detected and ask whether to migrate it into the code-addiction QA pipeline. Set `MIGRATE = true` ONLY on explicit confirmation. Never enter migration mode silently.
- Record for STEP add-qa-setup.receipt: `migration.detected = DETECTED`, `migration.decision` = `migrated` | `declined` | `none-found`, `migration.decided-at` = today (omit when `none-found`).

⛔ Do NOT gate this step on whether the `qa` section of `.codeadd/settings.json` exists. That proxy is what made migration permanently unreachable for a project that adopted a test runner after its first setup run.

---

## STEP add-qa-setup.qa-project: Generate Project QA Skill (`qa-project`)

Resolve the target skills dir for **each installed provider** (from the manifest / the engine's skills path) and write `qa-project/SKILL.md` there — e.g. `.claude/skills/qa-project/SKILL.md` on Claude Code. If the active engine exposes no skills dir, note it and skip (the QA pipeline is agent-driven and functions where agents build — Claude today; other providers are out of scope per the v1 distribution decision). If the file exists → regenerate it (generated file, not user-authored).

Detect the stack (runner, test dir + extension, pkg manager, boot command, screenshot API, axe wiring). Then **verify the run command works** (dry `--help`/list) before finalizing, and flag any convention you had to guess for user confirmation.

The skeleton to write is declared in `## Materializes` → `<provider skills dir>/qa-project/SKILL.md`. Copy it verbatim, replacing every `<…>` placeholder with the detected value; keep the frontmatter, the three `##` headings, and the Managed App Lifecycle procedure unchanged.

---

## STEP add-qa-setup.config: Scaffold Project QA Config

Target: the `qa` section of `.codeadd/settings.json` (git-tracked, project-wide). A file with no `qa` section counts as absent: read the file, merge the value fields into `qa`, and write it back without touching any other section.

<!-- slot:agent-mode.config-values fallback="fallbacks/agent-mode.add-qa-setup.config-values.md" -->
<!-- feature:agent-mode:config-values -->
<!-- /feature:agent-mode:config-values -->
<!-- /slot:agent-mode.config-values -->

Write the shape declared in `## Materializes` → `.codeadd/settings.json#qa`. Values are free-text hints; viewports default to the declared set.

⛔ `baseUrl` MUST point at a local/throwaway environment — the QA judgement actively exercises flows (submits forms, creates records). Never a production URL.

---

## STEP add-qa-setup.catalog: Scaffold Per-Feature Screen Catalog (empty bootstrap)

Target: `FEATURE_DIR/_tests/screens.json`.

> **Ownership:** `{{cmd:add-plan}}` STEP qa-pipeline.qa-spec is the sole writer of catalog **content**. THIS step creates the file only when it is absent.

IF `FEATURE_DIR/_tests/screens.json` exists → leave it. Do not merge, do not derive, do not rewrite.

IF it is absent → write the empty scaffold:

```json
{ "feature": "<feature-id>", "screens": [] }
```

`{{cmd:add-plan}}` fills entries. Each entry carries a `design:` path as the only contract pointer — there is no `expect` key. Visual values live in `design.md` `## Design Contract` only.

A missing or pre-schema `design.md` is a planning gap. Remedy: re-run `{{cmd:add-plan}}` (STEP add-plan.ux-design regenerates the contract). Do not invent screens here.

---

## STEP add-qa-setup.ignore: Ignore Working QA Evidence

Target: root `.gitignore` (shared, co-owned state; never receipt-hashed).

Execute `node .codeadd/scripts/qa-evidence.cjs ensure-ignore "."`. The deterministic operation materializes the exact block declared in `## Materializes` → `.gitignore`, keeps it separate from the installer-owned block, preserves unrelated lines, normalizes duplicates, and is byte-idempotent.

The pattern intentionally ignores only working `docs/features/**/_tests/run-*/` directories. Do NOT add a `!final/` exception: `_tests/final/run-NNN/` does not match the working-run pattern and remains trackable.

⛔ Do NOT continue to migration or the setup proof until the canonical QA block exists exactly once.

---

## STEP add-qa-setup.migrate: Autonomous Migration (IF MIGRATE)

⛔ IF `MIGRATE` is false → SKIP this step.

Run the migration per {{skill:add--qa-migration/SKILL.md}}, which defines the full sequence (`add-new → add-plan → add-build → add-review`), the checkpoints, the Decision Log, and the branch isolation. Pass it the detected tooling so `add-new`'s `about.md` frames the feature as "migrate the existing QA flow (`<detected tooling>`) to the code-addiction QA pipeline."

**Before any dispatch in this command:** read `{{skill:add--subagent-driven-development/references/dispatch-rules.md}}` — agents run in the foreground and no turn ends with work pending.

Dispatch each command in the chain as a subagent via the Agent tool — autonomous dispatch is **Claude-only in v1** (per the pipeline's distribution decision). Direct autonomy through the **dispatch prompt only**; never edit a dispatched command's source.

⛔ Do NOT merge the migration branch — hand it back for review in STEP add-qa-setup.handoff.

---

## STEP add-qa-setup.proof: Setup Proof

**Setup proves its own prerequisites with the deterministic preflight. It dispatches no `/add-review` and no `/add-build`.** The first real `{{cmd:add-review}}` proves QA end to end; running one here would spend a whole review on a catalog this same run has just created.

Run Phase A again, after every file above has been written:

```bash
node .codeadd/scripts/qa-preflight.cjs a
```

The proof holds when `QA_CONFIG`, `QA_BASEURL_LOCAL`, `QA_BASEURL_REACHABLE`, `QA_RUNNER`, `QA_CHROMIUM` and `QA_PROJECT_SKILL` are all `ok`. `QA_BASEURL_REACHABLE` means the app is up: a proof that skips it is green with the app down. Do not read `QA_RECEIPT` or `QA_CONTRACT_MATCH` yet: STEP add-qa-setup.receipt writes the receipt next.

When a feature with a scaffolded `FEATURE_DIR/_tests/screens.json` exists, also run Phase B:

```bash
node .codeadd/scripts/qa-preflight.cjs b "<FEATURE_DIR>" "<spec glob from the qa-project skill>"
```

`QA_SCREENS` must be `ok`; `QA_SPECS` reads `not-probed` or `missing` until `{{cmd:add-build}}` authors the specs, and that is expected. ⛔ IF no such feature exists, do NOT scaffold a synthetic one and do NOT run `b` — record that it was not run.

```
IF A ROW STILL FAILS:
  ⛔ DO NOT: Dispatch /add-review or /add-build to find out more, or loop
  ✅ DO: Fix it here when STEP add-qa-setup.install or STEP add-qa-setup.config can, otherwise
         record the row and its remedy for STEP add-qa-setup.handoff, and continue to STEP add-qa-setup.receipt
```

---

## STEP add-qa-setup.receipt: Write the Receipt

Target: the receipt fields of the `qa` section of `.codeadd/settings.json`. Schema: {{skill:add--settings/SKILL.md}}. Procedure: {{skill:add--setup-contract/SKILL.md}} step 5.

Write it on **every** run — including a run that changed nothing. A verified-current run is information, not nothing.

Read the file, merge into `qa`, write it back. ⛔ Never replace the whole file, never touch another section, never drop a key you do not know.

1. **Receipt fields.** `qa["setup-shape"]` = the shipped hash from `.codeadd/contracts.json` → `contracts["add-qa-setup"].shape` (bare `sha256:<16 hex>`). `qa["framework-version"]` from the manifest (informational). `qa["first-run"]` preserved byte-identically, or set to today on a true first run. `qa["last-run"]` = today.
2. **`qa.materialized`.** One entry per path declared in `## Materializes` that this project actually holds. `owner: setup` entries carry `hash: sha256:<hex>` of the current content; `owner: shared` entries carry `hash: null` — ⛔ never hash a co-owned file, it produces permanent false drift. `.codeadd/settings.json` itself is `owner: shared`.
3. **`qa.prereqs`** from STEP add-qa-setup.install, `qa["qa-pipeline-feature"]` from STEP add-qa-setup.feature-gate, `qa.migration` from STEP add-qa-setup.migration. Record `.gitignore` in `qa.materialized` with `owner: shared` and `hash: null`.
4. **`qa.log`.** APPEND one entry `{date, item, decision, reason, shape}` per behaviour-changing decision taken this run: a declined prerequisite, a declined feature enable, a migration decision, a STALE re-materialize. ⛔ Never edit or delete an existing entry. ⛔ Never log narration or instructions — an entry records a choice, not a step.

---

## STEP add-qa-setup.validate: Validation Gate (add--settings)

Run these checks against `.codeadd/settings.json` as you just wrote it. DO NOT skip. DO NOT mark the command complete until every check passes.

1. **It parses.** Read the file and parse it as JSON. If it does not parse: STOP. Fix the file. Re-run this gate.
2. **Required keys.** `schema` is `1`; `qa` is an object holding `baseUrl`, `viewports`, `setup-shape`, `framework-version`, `first-run`, `last-run`, `materialized`, `prereqs`, `qa-pipeline-feature`, `migration` and `log`. `setup-shape` is a bare `sha256:` + 16 hex. `first-run` and `last-run` are ISO dates (YYYY-MM-DD). A missing key: STOP, fix, re-run.
3. **Vocabularies.** Every `prereqs.<name>`, `qa-pipeline-feature`, `migration.decision` and `materialized[].owner` holds a value declared in {{skill:add--settings/SKILL.md}}. `migration.detected` is sorted alphabetically.
4. **No hash on a shared entry.** Every `materialized` entry with `owner: shared` — `.codeadd/settings.json` and `.gitignore` among them — carries `hash: null`. Every `owner: setup` entry carries a `sha256:` hash.
5. **`log` is append-only.** Compare with the file as it was before this run (the copy read at STEP add-qa-setup.config, or `git show HEAD:.codeadd/settings.json`): every previous entry is present, unchanged and in the same order; new entries only at the end. Each entry holds `date`, `item`, `decision`, `reason` and `shape`, and records a choice, never a step.
6. **Other sections untouched.** Every top-level key except `qa` — and every key inside `qa` this command does not own — is identical to the file as it was before this run.
7. **Hard bans absent.** None of the hard bans in {{skill:add--settings/SKILL.md}} is present, `first-run` was not rewritten, and no `log` entry carries narration or aspirational language.

Output at end:
- `gate: PASS` or `gate: FAIL`
- list of warnings
- list of fixes applied (if any)

---

## STEP add-qa-setup.handoff: Hand-off

**LOAD `{{skill:add--final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the ordered hand-off list below comes after it, whole and in
its own order.

Fill `How it works` with what the QA pipeline now does on a run: what it captures, what judges it,
and what the judgement gates. `⚠️ Needs your attention` carries every step the user still has to do
by hand, because none of them happen on their own.

Then, after the seven blocks, tell the user, in order:
1. The `qa-pipeline` feature outcome (from STEP add-qa-setup.feature-gate): enabled + verified, declined (remaining manual step: `codeadd features enable qa-pipeline`), or enable no-op detected (route: `codeadd update` / re-install).
2. Any prerequisite they declined / must finish manually (from STEP add-qa-setup.install).
3. Migration outcome (if `MIGRATE` ran): the migration branch (created at the add-build step), the Decision Log location, and that it awaits their review before merge.
4. Setup proof outcome: preflight `a` all ok, or the rows that still fail with their remedies; and whether `b` ran or was not run (no feature/`screens.json` yet). QA is proven end to end by the first real `{{cmd:add-review}}`, not by setup.
5. Shape state: current (hashes match), or re-materialized from STALE, or FIRST-RUN receipt written. Never report a version integer.
6. Enable the capability (optional — the QA judgement degrades without it): `codeadd plugins enable playwright`.
7. Verify the MCP server is connected (`/mcp` lists `playwright`).
8. The audit is the next activity: `/add-review` on the feature, scoped to the SFxx subfeature when one exists. Its QA sections judge the rendered result. Name it here; `STEP add-qa-setup.offer` puts the full invocation behind the offer.

`/add-qa-setup` does NOT modify application code, and does NOT merge the migration branch.

### STEP add-qa-setup.offer Offer the continuation

<!-- slot:agent-mode.offer fallback="fallbacks/agent-mode.add-qa-setup.offer.md" -->
<!-- feature:agent-mode:offer -->
<!-- /feature:agent-mode:offer -->
<!-- /slot:agent-mode.offer -->

**The documents the block points at**, each with the role it plays:

| Document | Role in the next activity |
|---|---|
| The `qa` section of `.codeadd/settings.json` | The receipt whose shape hash decides whether setup is current |
| `${FEATURE_DIR}/about.md` | The feature the audit judges |
| {{skill:add--qa/SKILL.md}} | What the audit's QA sections measure |

---

## Rules

ALWAYS:
- Point `baseUrl` at a local/throwaway environment (functional QA mutates state)

NEVER:
- Edit the source of a dispatched command (`add-new`/`add-plan`/`add-build`/`add-review`) — autonomy is layered via the dispatch prompt, never by rewriting them
- Modify application source, app config, or migrations
- Enable the `playwright` plugin on the user's behalf (instruct them to)
