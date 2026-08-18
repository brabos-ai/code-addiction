---
description: End-to-end-verified QA bootstrap — verifies + installs the QA runner, generates qa-project, scaffolds config/screens, ignores ephemeral working evidence under a setup contract, migrates existing QA, and smoke-tests /add.qa
argument-hint: "[feature-id] [--migrate] [--upgrade]  (feature-id scaffolds that feature's screen catalog, e.g. /add.qa-setup 0001F; --migrate reopens the migration decision; --upgrade forces contract reconciliation)"
---

# QA Setup - Prerequisites, Config Bootstrap & End-to-End Verification

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Conversational bootstrap for QA validation that proves it works end-to-end. Functionally verifies (not merely detects) the `@playwright/test` runner + chromium + `@playwright/mcp`, installs missing prerequisites with confirmation, generates a project-specific `qa-project` skill, scaffolds the **project-specific QA config** (`docs/qa/config.json`) + per-feature reachability-aware screen catalog (`FEATURE_DIR/_tests/screens.json`), autonomously migrates an existing QA flow on a project's first run (confirm-then-dogfood), and closes the loop with a universal `/add.qa` smoke test plus a bounded auto-correction loop. Runs BEFORE the `playwright` plugin is enabled — it is the base, non-injected setup.

---

## Required Skills

Load `{{skill:add-dev-environment-setup/SKILL.md}}` before STEP 3 (OS detection + confirm-before-install methodology).
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 8 (feature doc layout, `_tests/` per-run path + `screens.json` reachability schema, `qa-validation` conventions).
Load `{{skill:add-qa-migration/SKILL.md}}` before STEP 5 (existing-QA migration sequence + checkpoints).
Load `{{skill:add-subagent-driven-development/SKILL.md}}` before STEP 10 (dispatch template, decision log, review gates — the mechanism reused by migration + correction dispatch).
Load {{skill:add-setup-contract/SKILL.md}} before STEP 1.5 (receipt classification, contract comparison, delta execution, receipt rewrite).
Load {{skill:add-doc-schemas/SKILL.md}} + its `references/receipt.md` before STEP 12 (the `setup-receipt` schema).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load context             → status.sh + add-dev-environment-setup + flags + receipt classification
STEP 2: Feature gate             → qa-pipeline opt-in: probe state → CONFIRM → enable → VERIFY the fragment landed
STEP 3: Diagnose + verify        → OS/pkg/node; FUNCTIONALLY invoke runner + chromium + MCP (no install yet)
STEP 4: Install prerequisites    → runner (mandatory) + chromium + MCP (optional) → CONFIRM → execute → functionally verify
STEP 5: Detect migration         → ALWAYS scan; ask only when the detected fingerprint differs from the receipt
STEP 6: Generate qa-project      → <provider skills dir>/qa-project/SKILL.md (shape from ## Materializes)
STEP 7: Scaffold QA config       → docs/qa/config.json (interactive, project-wide; shape from ## Materializes)
STEP 8: Scaffold catalog         → FEATURE_DIR/_tests/screens.json (shape from ## Materializes)
STEP 9: Ignore working evidence  → materialize the dedicated QA block in .gitignore
STEP 10: Autonomous migration    → IF MIGRATE: dispatch add.new→add.plan→add.build→add.review (checkpoints only)
STEP 11: Smoke test + correction → dispatch /add.qa, analyze; on failure dispatch /add.build qa (max 3), else defer/escalate
STEP 12: Write the receipt       → docs/qa/qa-setup.md (state + decisions; rewritten even on a no-op)
STEP 13: Validation gate         → add-doc-schemas gate against the setup-receipt schema
STEP 14: Hand-off                → enable plugin (optional) + run /add.qa + migration/smoke/contract summary
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 2** | User has not confirmed the enable | Running `codeadd features enable` | Show the command + what stays broken with the feature off; WAIT for explicit confirmation |
| **STEP 2** | User declined the enable | Re-asking, marking QA as on | Record it as a remaining manual step for the STEP 14 hand-off; continue setup |
| **STEP 2** | Enable ran but the injected section is absent (pre-sidecar no-op) | Reporting QA as on | Route to `codeadd update` / re-install; record QA as NOT active |
| **STEP 3** | Environment not diagnosed | Bash install commands, downloads | Detect OS/pkg-manager/node; functionally probe existing prereqs |
| **STEP 4** | User has not confirmed the shown commands | Bash to run any install/download | Show exact commands + WAIT for explicit confirmation |
| **STEP 4** | Install runs | Silent/unattended install | Confirm-then-execute, one command set at a time, functionally verify after |
| **STEP 4** | Runner not installed | Authoring/running specs | Install `@playwright/test` first |
| **STEP 5** | Existing tooling found | Entering migration mode silently | Ask the user; set MIGRATE only on explicit confirmation |
| **STEP 5** | Always | Skipping the scan because the project is not first-run | Scan on every run; compare against `migration.detected` in the receipt; ASK only on a fingerprint change or `--migrate` |
| **STEP 5** | Fingerprint unchanged and a decision is recorded | Re-asking the user | Stay silent; the recorded decision stands |
| **STEP 6-9** | Always | Edit/Write on source code, app files, migrations | Write only under `docs/qa/`, `FEATURE_DIR/_tests/`, the resolved provider skills dir (`qa-project/`), and STEP 9's root `.gitignore`. Single named exception: STEP 2's CLI-mediated `codeadd features enable qa-pipeline`, which rewrites installed provider command files via the CLI — never via direct Edit/Write |
| **STEP 8** | `design.md` not read | Invent screens/routes | Derive each screen entry from the design docs |
| **STEP 9** | QA evidence block not materialized exactly once | Running migration or smoke test | Normalize the QA block while preserving installer-managed and user-authored content |
| **STEP 10** | Dispatched subagent hits an install or a file overwrite | Proceeding autonomously | Pause and surface the decision to the user |
| **STEP 10** | Migration branch produced | Merging autonomously | Hand the branch back for user review |
| **STEP 11** | No feature with a scaffolded `screens.json` exists | Forcing a synthetic feature to smoke-test | Defer the smoke test; note it in hand-off |
| **STEP 11** | Smoke test still failing after 3 correction attempts | Looping again | Escalate to the user with accumulated findings |
| **STEP 1.5** | Receipt absent but materialized state present | Treating the project as first-run and re-materializing | Backfill the receipt at contract 1 per `add-setup-contract`, then continue |
| **STEP 1.5** | Recipe chain has a hole, or `RECORDED > CURRENT` | Improvising an upgrade | REFUSE and escalate to the user |
| **STEP 12** | Always | Editing or deleting an existing Decision Log row | Append only |

---

## Materializes

> **Single source of truth for every shape this command writes.** STEP 6 through STEP 9 write exactly what is declared here — they do not restate a shape. The framework build extracts this block into `.codeadd/contracts.json`; changing anything below moves `shape` and the build will demand a `version` bump. Resource-path variables (`{{cmd:}}`, `{{skill:}}`, `{{addpath:}}`) are FORBIDDEN inside this block — they resolve per provider and would produce a different `shape` per build target.

```yaml
contract: add.qa-setup
version: 2
shape: sha256:4352695bba17be46
recipes: skills/add-qa/references/setup-contract.md
paths:
  - path: docs/qa/config.json
    owner: setup
    step: 7
  - path: <provider skills dir>/qa-project/SKILL.md
    owner: setup
    step: 6
  - path: FEATURE_DIR/_tests/screens.json
    owner: shared
    co-owner: add.plan STEP 10.0
    step: 8
  - path: .gitignore
    owner: shared
    step: 9
```

### docs/qa/config.json

```json
{
  "baseUrl": "http://localhost:5173",
  "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
  "bootHint": "how to start the app's dev server (free text, project-specific)",
  "authSeed": "how an authenticated session is obtained for auth:true screens (free text / steps)"
}
```

### FEATURE_DIR/_tests/screens.json

```json
{
  "feature": "<feature-id>",
  "screens": [
    { "id": "login", "sf": "SF02", "name": "Login", "kind": "route",
      "path": "/login", "auth": false,
      "design": "docs/features/<id>-.../subfeatures/SF02-.../design.md",
      "expect": "what a correct render looks like" },
    { "id": "entry-form", "sf": "SF01", "name": "Entry form", "kind": "modal",
      "open": [{ "goto": "/entries" }, { "click": "role=button[name=New entry]" }],
      "auth": true,
      "design": "docs/features/<id>-.../subfeatures/SF01-.../design.md",
      "expect": "modal open with all fields visible" }
  ]
}
```

### .gitignore

```gitignore
# ADD QA evidence - managed by add.qa-setup
docs/features/**/_tests/run-*/
# END ADD QA evidence
```

### `<provider skills dir>/qa-project/SKILL.md`

```markdown
---
name: qa-project
description: Use when authoring E2E specs (/add.test) or running QA (/add.qa) in this project — carries the project-specific runner conventions + managed app lifecycle.
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
- **Evidence lifecycle:** allocate with `.codeadd/scripts/qa-evidence.sh next`; new runs write only to `_tests/run-NNN/`. `/add.done` alone promotes the reviewed baseline to immutable `_tests/final/run-NNN/`.

## Managed App Lifecycle
Both `/add.test` (green-confirm) and `/add.qa` (run) invoke this procedure:
1. **Probe** `baseUrl` (from `docs/qa/config.json`).
2. If **down**: boot the app **in the background** using `<boot command / config.json bootHint>`, then **wait-for-ready** by polling `baseUrl` with a bounded timeout.
3. **Run** the spec(s).
4. **Teardown** the app **iff we booted it** — never kill a dev server the user already had running.
5. On **boot failure / timeout**: do NOT hang — author-only and **defer the run to `/add.qa`** with a flagged note.

## Auth / Seed
- `<how an authenticated session is obtained for auth:true surfaces, from config.json.authSeed>`
```
---

## STEP 1: Load Context

### 1.1 Run status.sh
```bash
bash .codeadd/scripts/status.sh
```
Parse: OWNER (name + level), PROJECT_DOCS, package manager hints, features under `docs/features/`.

### 1.2 Load install methodology
Read {{skill:add-dev-environment-setup/SKILL.md}} — reuse its OS-detection + confirm-before-install discipline. This command installs (confirm-then-execute), it does NOT merely instruct.

### 1.3 Parse flags
- `--migrate` → `FORCE_MIGRATE = true`: STEP 5 asks about migration even when the fingerprint is unchanged and a decision is already recorded.
- `--upgrade` → `FORCE_UPGRADE = true`: STEP 1.5 runs reconciliation even when `status.sh` reports no `SETUP_QA_BEHIND`, and performs the drift check unconditionally.
- Neither flag is required for normal operation. Behind-detection and migration re-offer are automatic.

### 1.4 Resolve target feature (optional)
- If a `feature-id` arg was given → `FEATURE_DIR = docs/features/<feature-id>-*`.
- Else → list features under `docs/features/` and ask which feature's screen catalog to scaffold (STEP 8). Config (STEP 7) is project-wide regardless.

### 1.5 Classify + reconcile (add-setup-contract)
Read `SETUP_QA:` / `SETUP_QA_CONTRACT:` / `SETUP_QA_BEHIND:` from the STEP 1.1 output, then run the {{skill:add-setup-contract/SKILL.md}} procedure against `docs/qa/qa-setup.md`.

Outcome sets `SETUP_STATE` for the rest of the run:
- `FIRST-RUN` — no receipt, no materialized state. Materialize normally; STEP 12 creates the receipt.
- `UNRECEIPTED` — materialized state, no receipt. Backfill at contract 1 (⛔ never re-materialize over it), then reconcile.
- `CURRENT` — recorded contract equals the shipped one. Drift check only.
- `BEHIND` — present the declared deltas, CONFIRM, execute sequentially.
- `REFUSED` — chain hole or framework downgrade. Report and stop reconciliation; the rest of setup may still proceed.

⛔ `FIRST_RUN` (the old `docs/qa/config.json`-presence proxy) is RETIRED. It permanently locked out migration and could not distinguish "declined" from "never offered". Do not reintroduce it under any name.

---

## STEP 2: Feature Gate — qa-pipeline opt-in

Running this command is unambiguous QA intent, and everything it installs is inert while the `qa-pipeline` feature is off: `add.plan` authors no QA spec, `add.test` dispatches no `@e2e-agent`, `/add.build qa` refuses. The feature/plugin split is canonical in `{{skill:add-qa/SKILL.md}}` ("Feature vs plugin").

### 2.1 Probe the feature state
```bash
bash .codeadd/scripts/qa-preflight.sh a
```
Read `QA_FEATURE_STATE` — the RAW manifest value. Resolve `unset` / `no-manifest` by the feature's default: `qa-pipeline` defaults to **disabled**. (The manifest lives at `{{addpath:manifest.json}}`; never probe the raw `features` field alone — a project that never toggled a feature has no `features` key at all.)

### 2.2 Offer the enable (confirm-then-execute)
IF the feature resolves to disabled → explain what stays broken while it is off, show the exact command `codeadd features enable qa-pipeline`, and run it ONLY after explicit confirmation — the same discipline as the STEP 4 installs.
On decline → record it for the STEP 14 hand-off and continue setup.
Record the outcome for STEP 12 as `qa-pipeline-feature`: `enabled` | `already-enabled` | `declined` | `enable-noop`.

### 2.3 Verify the enable actually landed
After a confirmed enable, probe the installed plan command ({{cmd:add.plan}}) for the injected `STEP 10.0` QA-Spec section. On a pre-sidecar install (`injection-points.json` absent) the CLI reports success while injecting nothing.
IF the section is absent → the enable was a silent no-op: route the user to `codeadd update` / re-install, record QA as NOT active for the hand-off, and continue.

---

## STEP 3: Diagnose + Functionally Verify (silent — no installs)

Detect the environment, then **functionally verify** each prerequisite — invoke it trivially, do not stop at "present in package.json." For the deterministic rows (config presence, runner, chromium, `qa-project` skill), reuse the shared probe: `bash .codeadd/scripts/qa-preflight.sh a` — do not re-derive what it already reports. A prerequisite counts as present ONLY if its trivial invocation works:

- OS + package manager + node/npx availability (per `add-dev-environment-setup`).
- **`@playwright/test` runner** — resolvable AND runnable: a trivial `npx playwright --version` / spec-list invocation succeeds (not just listed in devDependencies).
- **chromium for Playwright** — actually launchable: a trivial headless launch/health probe succeeds (not just present in the browsers cache).
- **`@playwright/mcp`** — the server binary responds to a trivial invocation, and if already wired for the active provider, the MCP tool answers a trivial call (for Claude Code, `claude mcp list` shows it AND it is reachable).
- **`add.qa` / `add.test` working dependencies** — confirm the pieces those commands rely on (runner + browsers + config surface) are functionally available, not merely declared.

Build a gap list distinguishing **missing** from **present-but-non-functional** (declared yet failing invocation) — the runner is mandatory, chromium/MCP optional. Present it before proposing any command.

---

## STEP 4: Install Prerequisites (confirm-then-execute + functional verify)

For each missing or non-functional prerequisite, show the EXACT command, explain what it does, then **WAIT for explicit confirmation** before running it. Never batch-run without confirmation. After each install, **functionally verify** it (re-run the STEP 3 trivial invocation) — a successful install is one whose invocation now works, not one that merely completed.

Prerequisites (adapt commands to the detected OS/provider):
- **`@playwright/test` runner (mandatory)** — e.g. `npm i -D @playwright/test` (adapt to detected pkg manager). Powers the deterministic layer + plugin-off degradation. If declined → record as a blocking manual step; downstream authoring cannot run.
- **chromium for Playwright** — e.g. `npx playwright install chromium`. Verify with a trivial headless launch.
- **Playwright MCP server (optional — only the live-driving arm of `/add.qa` needs it)** — the server runs via `npx @playwright/mcp@latest`; wire it as an MCP server for the active provider. For Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`. For other providers, add the equivalent MCP server entry to that provider's MCP config (the same `npx @playwright/mcp@latest` command).

⛔ Skip a prerequisite only if STEP 3 proved it already **functional**. ⛔ If the user declines a command, stop that install and record it as a remaining manual step in the hand-off (STEP 14).

After installs, confirm the MCP server is reachable AND answers a trivial call. If it does not, the wiring is incomplete — surface it; `/add.qa` cannot drive without it.

Record each prerequisite's outcome for STEP 12 as `installed` | `already-present` | `declined` | `failed` | `not-offered`. A declined prerequisite is a recorded decision, not an unfinished install — it must never be re-asked on a later run unless the user passes `--upgrade`.

---

## STEP 5: Detect Migration (fingerprint-gated)

Scan on **every** run — the scan is a few globs and costs nothing. The friction this step must avoid is **re-asking**, not re-scanning.

### 5.1 Scan
Detect existing QA/test tooling: Cypress (`cypress.config.*`), Jest (`jest.config.*`), Vitest (`vitest.config.*`), standalone Playwright, or a custom runner (test scripts in `package.json`, a `tests/`/`e2e/`/`cypress/` dir). Produce `DETECTED` — the sorted list of tooling ids found. `[]` when nothing is found.

### 5.2 Compare against the receipt fingerprint
Read `migration.detected` + `migration.decision` from the receipt (empty when `SETUP_STATE` is `FIRST-RUN`).

| Recorded `detected` | `DETECTED` now | Recorded decision | Behaviour |
|---|---|---|---|
| — (first run) | non-empty | — | **ASK** |
| — (first run) | `[]` | — | Silent; record `decision: none-found` |
| equal | equal | `declined` | **Silent.** The decision stands |
| equal | equal | `migrated` \| `none-found` | Silent |
| differs (new tooling appeared) | any | any | **ASK** — the situation changed |
| any | any | any | **ASK** when `FORCE_MIGRATE` is true |

### 5.3 Decide
- **ASK** → describe what was detected and ask whether to migrate it into the code-addiction QA pipeline. Set `MIGRATE = true` ONLY on explicit confirmation. Never enter migration mode silently.
- Record for STEP 12: `migration.detected = DETECTED`, `migration.decision` = `migrated` | `declined` | `none-found`, `migration.decided-at` = today (omit when `none-found`).

⛔ Do NOT gate this step on whether `docs/qa/config.json` exists. That proxy is what made migration permanently unreachable for a project that adopted a test runner after its first setup run.

---

## STEP 6: Generate Project QA Skill (`qa-project`)

Resolve the target skills dir for **each installed provider** (from the manifest / the engine's skills path) and write `qa-project/SKILL.md` there — e.g. `.claude/skills/qa-project/SKILL.md` on Claude Code. If the active engine exposes no skills dir, note it and skip (the QA pipeline is agent-driven and functions where agents build — Claude today; other providers are out of scope per the v1 distribution decision). If the file exists → regenerate only drifted sections after confirmation.

Detect the stack (runner, test dir + extension, pkg manager, boot command, screenshot API, axe wiring). Then **verify the run command works** (dry `--help`/list) before finalizing, and flag any convention you had to guess for user confirmation.

The skeleton to write is declared in `## Materializes` → `<provider skills dir>/qa-project/SKILL.md`. Copy it verbatim, replacing every `<…>` placeholder with the detected value; keep the frontmatter, the three `##` headings, and the Managed App Lifecycle procedure unchanged.

---

## STEP 7: Scaffold Project QA Config

Target: `docs/qa/config.json` (git-tracked, project-wide).

If it exists → read, confirm/refresh values with the user, bump only what changed. If absent → create it interactively, asking for the project-specific values (do NOT guess base URL or auth/seed flow).

Write the shape declared in `## Materializes` → `docs/qa/config.json`. Values are free-text hints; viewports default to the declared set.

⛔ `baseUrl` MUST point at a local/throwaway environment — `/add.qa` actively exercises flows (submits forms, creates records). Never a production URL.

---

## STEP 8: Scaffold Per-Feature Screen Catalog (bootstrap path)

Target: `FEATURE_DIR/_tests/screens.json` (the reachability-aware route map for the UX axis).

> **Ownership:** `{{cmd:add.plan}}` STEP 10.0 owns the catalog on an ongoing basis — it writes `screens.json` by read-merge-write after consolidating `design.md`, so features planned with `qa-pipeline` on are born with their entries. THIS step is the **bootstrap path**: it seeds the catalog for features that already exist at setup time. Both write the same shape; 10.0 preserves out-of-scope entries byte-identically.

Read every `design.md` under the feature (feature-level and each subfeature). For each screen the design describes, derive one entry. Flag screens that require an authenticated session with `auth: true`. Do NOT store functional intent here — the functional axis is read from each SF's `about.md` at run time.

Each entry gains `kind` (`route` | `modal` | `overlay` | `portal`) and, for non-route surfaces, an ordered `open` recipe. Write the shape declared in `## Materializes` → `FEATURE_DIR/_tests/screens.json`.

Route surfaces keep `path`; non-route (`modal`/`overlay`/`portal`) declare `kind` + `open`. Both forms coexist.

**`expect` is never freehand:** derive it from the screen's `## Design Contract` rows and layout tree in `design.md` (see `add-qa-spec`) — the example values in the declared shape stand for "the derived one-liner," not invented prose. A screen whose `design.md` carries no contract or layout tree gets a gap note instead.

**`open` recipe grammar (fixed mini-schema):** an ordered array of step objects, each exactly one of — `{ "goto": "<path>" }`, `{ "click": "<selector>" }`, `{ "fill": ["<selector>", "<value>"] }`, `{ "select": ["<selector>", "<value>"] }`, `{ "wait": "<selector | ms>" }`. Selectors use Playwright role/testid syntax (`role=button[name=…]`, `testid=…`) — never brittle CSS.

Setup scaffolds the recipe **intent** from **`design.md` only** (the plan's QA axis does not exist yet at setup time); **selectors are finalized post-implementation by the `e2e-agent`**, which merges the richer intent from `plan.md`'s `## QA/E2E Specification`. This STEP stores thin intent, flags thin/missing designs rather than inventing routes.

If a design doc is missing or thin, list the screen with a note rather than inventing routes — flag it for the user.

**Name the remedy, don't just flag it.** A `design.md` that carries no `## Design Contract` or layout tree predates the current design schema — the gap is NOT fixable by hand-editing `screens.json`, because `expect` is derived from the contract. For every screen in that state, tell the user to regenerate the design: `/add.design <feature-id> [SFxx]` (or re-run `/add.plan`, whose STEP 8.1.0 check 4 detects the same drift and regenerates automatically). Carry the list into the STEP 14 hand-off — until those designs are regenerated, `@qa-agent`'s deterministic conformance axis has nothing to compare against.

---

## STEP 9: Ignore Working QA Evidence

Target: root `.gitignore` (shared, co-owned state; never receipt-hashed).

Execute `bash .codeadd/scripts/qa-evidence.sh ensure-ignore "."`. The deterministic operation materializes the exact block declared in `## Materializes` → `.gitignore`, keeps it separate from the installer-owned block, preserves unrelated lines, normalizes duplicates, and is byte-idempotent.

The pattern intentionally ignores only working `docs/features/**/_tests/run-*/` directories. Do NOT add a `!final/` exception: `_tests/final/run-NNN/` does not match the working-run pattern and remains trackable.

⛔ Do NOT continue to migration or smoke testing until the canonical QA block exists exactly once.

---

## STEP 10: Autonomous Migration (IF MIGRATE)

⛔ IF `MIGRATE` is false → SKIP this step.

Run the migration per {{skill:add-qa-migration/SKILL.md}}, which defines the full sequence (`add.new → add.plan → add.build → add.review`), the checkpoints, the Decision Log, and the branch isolation. Pass it the detected tooling so `add.new`'s `about.md` frames the feature as "migrate the existing QA flow (`<detected tooling>`) to the code-addiction QA pipeline."

Dispatch each command in the chain as a subagent via the Agent tool — autonomous dispatch is **Claude-only in v1** (per the pipeline's distribution decision). Direct autonomy through the **dispatch prompt only**; never edit a dispatched command's source.

⛔ Do NOT merge the migration branch — hand it back for review in STEP 14.

---

## STEP 11: Universal Smoke Test + Bounded Correction Loop

⛔ IF no feature with a scaffolded `screens.json` exists → DEFER only the smoke dispatch and correction loop (there is nothing for `/add.qa` to validate). Do NOT scaffold a synthetic feature. Record the deferral, then continue to STEP 12 so the receipt is written and validated before hand-off.

Otherwise, close the loop on every run:

### 11.1 Smoke test
Autonomously dispatch `/add.qa <feature-id>` (Agent tool) against the scaffolded feature. Analyze whether it: ran cleanly, produced the correct assets (screenshots, run artefacts), and whether `qa-agent` produced valid analysis documentation. Record PASS or FAIL with the specific findings.

### 11.2 Correction loop (max 3 attempts)
On FAIL, compose a correction instruction from the findings and autonomously dispatch `/add.build qa` to fix it, then re-run 11.1.

- Guard: `/add.build qa` requires the `qa-pipeline` feature. If that dispatch reports the feature is disabled, do NOT keep looping — surface it and instruct the user to run `codeadd features enable qa-pipeline` (or re-run this command, whose STEP 2 offers the enable).
- ⛔ Cap at **3** correction attempts. If the smoke test still fails after the third, STOP looping and escalate to the user in STEP 14 with the accumulated findings from all attempts.

---

## STEP 12: Write the Receipt

Target: `docs/qa/qa-setup.md`. Schema: `setup-receipt` in {{skill:add-doc-schemas/SKILL.md}} → `references/receipt.md`. Procedure: {{skill:add-setup-contract/SKILL.md}} step 5.

Write it on **every** run — including a run that changed nothing. A verified-current run is information, not nothing.

1. **Frontmatter.** `setup-contract` = the contract version now in force (from `.codeadd/contracts.json`, or the highest version fully applied if reconciliation stopped mid-chain). `framework-version` from the manifest (informational). `first-run` preserved byte-identically, or set to today on a true first run. `last-run` = today.
2. **`materialized`.** One entry per path declared in `## Materializes` that this project actually holds. `owner: setup` entries carry `hash: sha256:<hex>` of the current content; `owner: shared` entries carry `hash: null` — ⛔ never hash a co-owned file, it produces permanent false drift.
3. **`prereqs`** from STEP 4, `qa-pipeline-feature` from STEP 2, `migration` from STEP 5. Record `.gitignore` in `materialized` with `owner: shared` and `hash: null`.
4. **`## Decision Log`.** APPEND one row per behaviour-changing decision taken this run: a declined prerequisite, a declined feature enable, a migration decision, an accepted or declined upgrade, a backfill. ⛔ Never edit or delete an existing row. ⛔ Never log narration or instructions — a row records a choice, not a step.
5. **`## TL;DR`.** State what the doc is, why it exists, and whether the project is current or behind.

---

## STEP 13: Validation Gate (add-doc-schemas)

Run these checks against the doc you just wrote. DO NOT skip. DO NOT mark the command complete until every check passes or warns.

1. **Frontmatter presence.** Grep `^---$` at line 1. Confirm YAML block closes. Required fields for `setup-receipt`:
   - `id:` matches the prefix rule in the ID Convention section of this skill
   - `type: setup-receipt` exact match
   - `created:` and `updated:` are ISO dates (YYYY-MM-DD)
   - `related:` is a YAML list (may be empty `[]`)
   - **`feature-about` only** — `branch:` present, matches `^[a-z]+/[0-9]{4}[A-Z]-[a-z0-9-]+$`, and its post-`/` slug equals the docs dir name (Hard Invariant). Legacy docs predating this field: **warn**, do not FAIL.
   If any field is missing: STOP. Fix the doc. Re-run this gate.

2. **TL;DR present and complete.** Grep `^## TL;DR$`. The body MUST convey: what the doc is, why it exists, and the headline outcome/decision. If any is missing: rewrite extractively — do NOT summarize abstractively, do NOT shrink by dropping the headline.

3. **TOC rule.** Count H2 sections (`^## `). If >3 and no `## TOC` / anchor list right after TL;DR: add it. Flat bullets only.

4. **Depth floors met.** For each H2/H3 in the schema, walk the schema's depth-floor list and confirm every required fact is present in the chunk. A section that looks clean but omits required facts is INCOMPLETE. If a floor is unmet: add the missing content. If a fact is genuinely unknowable, write `unknown — <why>` rather than omit.

5. **Non-redundancy / density.** Apply Universal Rules → Voice: every sentence is fact, decision, constraint, link, or signal — never filler. Delete restatements, paraphrase, repetition. Numeric length caps are prohibited.

6. **Doc refs resolve.** For every `{{doc:<ID>}}` in the doc, run reverse grep: `grep -rE "^id: <ID>$" docs/`. Each ref MUST return ≥1 hit. Unresolved refs = WARNING (not error); print them in the command output for the user to fix.

7. **Hard bans absent.** Confirm none of the schema's "Hard bans" items are present (emojis in headers, ASCII art where forbidden, aspirational language, abstractive paraphrase, forbidden content types).

8. **Metadata footer.** Confirm `updated:` in frontmatter matches today's date. If editing an existing doc, confirm original `created:` was preserved.

DO NOT use abstractive summarization to trim a section — summarization loses information the depth floor requires. DO NOT delete required content to make the gate pass — split into linked docs instead, or mark items `unknown — <why>`. DO NOT silently drop unresolved refs — surface them as warnings. DO NOT introduce numeric length caps (e.g. `<200 words`, `~100-150 words`) anywhere in the doc body.

Output at end:
- `gate: PASS` or `gate: FAIL`
- list of warnings (orphan refs, `unknown` markers)
- list of fixes applied (if any)

---

## STEP 14: Hand-off

Tell the user, in order:
1. The `qa-pipeline` feature outcome (from STEP 2): enabled + verified, declined (remaining manual step: `codeadd features enable qa-pipeline`), or enable no-op detected (route: `codeadd update` / re-install).
2. Any prerequisite they declined / must finish manually (from STEP 4).
3. Migration outcome (if `MIGRATE` ran): the migration branch (created at the add.build step), the Decision Log location, and that it awaits their review before merge.
4. Smoke-test outcome: PASS, or the deferral reason (no feature/`screens.json` yet), or the escalation with accumulated findings after 3 failed corrections.
5. Contract state: `setup-contract vN` — current, or upgraded from vM (list the applied deltas), or reconciliation refused (state why), or a backfill was written for a project that predates receipts.
6. Enable the capability (optional — `/add.qa` degrades without it): `codeadd plugins enable playwright`.
7. Verify the MCP server is connected (`/mcp` lists `playwright`).
8. Run the audit: `/add.qa <feature-id> [SFxx]` (or `/add.qa @docs/features/.../about.md`).

`/add.qa-setup` does NOT modify application code, and does NOT merge the migration branch.

---

## Rules

ALWAYS:
- Point `baseUrl` at a local/throwaway environment (functional QA mutates state)

NEVER:
- Edit the source of a dispatched command (`add.new`/`add.plan`/`add.build`/`add.review`/`add.qa`) — autonomy is layered via the dispatch prompt, never by rewriting them
- Modify application source, app config, or migrations
- Enable the `playwright` plugin on the user's behalf (instruct them to)
