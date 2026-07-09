---
description: End-to-end-verified QA bootstrap — functionally verifies + installs the @playwright/test runner (mandatory) + chromium + Playwright MCP (optional, confirm-then-execute), generates a project-specific qa-project skill, scaffolds docs/qa/config.json + FEATURE_DIR/_tests/screens.json, migrates an existing QA flow on first run (confirm-then-dogfood), and ends with a /add.qa smoke test + bounded correction loop
argument-hint: "[feature-id]  (optional — scaffolds that feature's screen catalog; e.g. /add.qa-setup 0001F)"
---

# QA Setup - Prerequisites, Config Bootstrap & End-to-End Verification

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Conversational bootstrap for QA validation that proves it works end-to-end. Functionally verifies (not merely detects) the `@playwright/test` runner + chromium + `@playwright/mcp`, installs missing prerequisites with confirmation, generates a project-specific `qa-project` skill, scaffolds the **project-specific QA config** (`docs/qa/config.json`) + per-feature reachability-aware screen catalog (`FEATURE_DIR/_tests/screens.json`), autonomously migrates an existing QA flow on a project's first run (confirm-then-dogfood), and closes the loop with a universal `/add.qa` smoke test plus a bounded auto-correction loop. Runs BEFORE the `playwright` plugin is enabled — it is the base, non-injected setup.

---

## Required Skills

Load `{{skill:add-dev-environment-setup/SKILL.md}}` before STEP 2 (OS detection + confirm-before-install methodology).
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 7 (feature doc layout, `_tests/` per-run path + `screens.json` reachability schema, `qa-validation` conventions).
Load `{{skill:add-qa-migration/SKILL.md}}` before STEP 4 (existing-QA migration sequence + checkpoints).
Load `{{skill:add-subagent-driven-development/SKILL.md}}` before STEP 8 (dispatch template, decision log, review gates — the mechanism reused by migration + correction dispatch).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load context             → status.sh + add-dev-environment-setup + FIRST_RUN flag
STEP 2: Diagnose + verify        → OS/pkg/node; FUNCTIONALLY invoke runner + chromium + MCP (no install yet)
STEP 3: Install prerequisites    → runner (mandatory) + chromium + MCP (optional) → CONFIRM → execute → functionally verify
STEP 4: Detect migration         → FIRST_RUN only: scan existing QA tooling → CONFIRM → set MIGRATE
STEP 5: Generate qa-project      → <provider skills dir>/qa-project/SKILL.md (conventions + managed app lifecycle)
STEP 6: Scaffold QA config       → docs/qa/config.json (interactive, project-wide)
STEP 7: Scaffold catalog         → FEATURE_DIR/_tests/screens.json (reachability-aware: route OR open-recipe)
STEP 8: Autonomous migration     → IF MIGRATE: dispatch add.new→add.plan→add.build→add.review (checkpoints only)
STEP 9: Smoke test + correction  → dispatch /add.qa, analyze; on failure dispatch /add.build qa (max 3), else defer/escalate
STEP 10: Hand-off                → enable plugin (optional) + run /add.qa + migration/smoke summary
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 2** | Environment not diagnosed | Bash install commands, downloads | Detect OS/pkg-manager/node; functionally probe existing prereqs |
| **STEP 3** | User has not confirmed the shown commands | Bash to run any install/download | Show exact commands + WAIT for explicit confirmation |
| **STEP 3** | Install runs | Silent/unattended install | Confirm-then-execute, one command set at a time, functionally verify after |
| **STEP 3** | Runner not installed | Authoring/running specs | Install `@playwright/test` first |
| **STEP 4** | Existing tooling found | Entering migration mode silently | Ask the user; set MIGRATE only on explicit confirmation |
| **STEP 4** | `FIRST_RUN` is false (config.json present) | Scanning for tooling / offering migration | Skip STEP 4 and STEP 8 entirely |
| **STEP 5-7** | Always | Edit/Write on source code, app files, migrations | Write only under `docs/qa/`, `FEATURE_DIR/_tests/`, and the resolved provider skills dir (`qa-project/`) |
| **STEP 7** | `design.md` not read | Invent screens/routes | Derive each screen entry from the design docs |
| **STEP 8** | Dispatched subagent hits an install or a file overwrite | Proceeding autonomously | Pause and surface the decision to the user |
| **STEP 8** | Migration branch produced | Merging autonomously | Hand the branch back for user review |
| **STEP 9** | No feature with a scaffolded `screens.json` exists | Forcing a synthetic feature to smoke-test | Defer the smoke test; note it in hand-off |
| **STEP 9** | Smoke test still failing after 3 correction attempts | Looping again | Escalate to the user with accumulated findings |

---

## STEP 1: Load Context

### 1.1 Run status.sh
```bash
bash .codeadd/scripts/status.sh
```
Parse: OWNER (name + level), PROJECT_DOCS, package manager hints, features under `docs/features/`.

### 1.2 Load install methodology
Read {{skill:add-dev-environment-setup/SKILL.md}} — reuse its OS-detection + confirm-before-install discipline. This command installs (confirm-then-execute), it does NOT merely instruct.

### 1.3 Capture FIRST_RUN
Set `FIRST_RUN = true` iff `docs/qa/config.json` is ABSENT. This flag gates migration detection (STEP 4) and autonomous migration (STEP 8) — a re-run (config present) skips both. Capture it now, before any config is written.

### 1.4 Resolve target feature (optional)
- If a `feature-id` arg was given → `FEATURE_DIR = docs/features/<feature-id>-*`.
- Else → list features under `docs/features/` and ask which feature's screen catalog to scaffold (STEP 7). Config (STEP 6) is project-wide regardless.

---

## STEP 2: Diagnose + Functionally Verify (silent — no installs)

Detect the environment, then **functionally verify** each prerequisite — invoke it trivially, do not stop at "present in package.json." A prerequisite counts as present ONLY if its trivial invocation works:

- OS + package manager + node/npx availability (per `add-dev-environment-setup`).
- **`@playwright/test` runner** — resolvable AND runnable: a trivial `npx playwright --version` / spec-list invocation succeeds (not just listed in devDependencies).
- **chromium for Playwright** — actually launchable: a trivial headless launch/health probe succeeds (not just present in the browsers cache).
- **`@playwright/mcp`** — the server binary responds to a trivial invocation, and if already wired for the active provider, the MCP tool answers a trivial call (for Claude Code, `claude mcp list` shows it AND it is reachable).
- **`add.qa` / `add.test` working dependencies** — confirm the pieces those commands rely on (runner + browsers + config surface) are functionally available, not merely declared.

Build a gap list distinguishing **missing** from **present-but-non-functional** (declared yet failing invocation) — the runner is mandatory, chromium/MCP optional. Present it before proposing any command.

---

## STEP 3: Install Prerequisites (confirm-then-execute + functional verify)

For each missing or non-functional prerequisite, show the EXACT command, explain what it does, then **WAIT for explicit confirmation** before running it. Never batch-run without confirmation. After each install, **functionally verify** it (re-run the STEP 2 trivial invocation) — a successful install is one whose invocation now works, not one that merely completed.

Prerequisites (adapt commands to the detected OS/provider):
- **`@playwright/test` runner (mandatory)** — e.g. `npm i -D @playwright/test` (adapt to detected pkg manager). Powers the deterministic layer + plugin-off degradation. If declined → record as a blocking manual step; downstream authoring cannot run.
- **chromium for Playwright** — e.g. `npx playwright install chromium`. Verify with a trivial headless launch.
- **Playwright MCP server (optional — only the live-driving arm of `/add.qa` needs it)** — the server runs via `npx @playwright/mcp@latest`; wire it as an MCP server for the active provider. For Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`. For other providers, add the equivalent MCP server entry to that provider's MCP config (the same `npx @playwright/mcp@latest` command).

⛔ Skip a prerequisite only if STEP 2 proved it already **functional**. ⛔ If the user declines a command, stop that install and record it as a remaining manual step in the hand-off (STEP 10).

After installs, confirm the MCP server is reachable AND answers a trivial call. If it does not, the wiring is incomplete — surface it; `/add.qa` cannot drive without it.

---

## STEP 4: Detect Migration (first-run only)

⛔ IF `FIRST_RUN` is false → SKIP this step and STEP 8 entirely (avoid repeat-run friction).

On a project's first setup run, scan for an existing QA/test flow — Cypress (`cypress.config.*`), Jest (`jest.config.*`), Vitest (`vitest.config.*`), standalone Playwright, or a custom runner (test scripts in `package.json`, a `tests/`/`e2e/`/`cypress/` dir).

- **If tooling is found** → describe what was detected and **ask the user** whether to migrate/adapt it into the code-addiction QA pipeline. Set `MIGRATE = true` ONLY on explicit confirmation. Never enter migration mode silently; a false positive costs nothing when confirmation is mandatory.
- **If nothing is found, or the user declines** → `MIGRATE = false`; continue with normal scaffolding.

---

## STEP 5: Generate Project QA Skill (`qa-project`)

Resolve the target skills dir for **each installed provider** (from the manifest / the engine's skills path) and write `qa-project/SKILL.md` there — e.g. `.claude/skills/qa-project/SKILL.md` on Claude Code. If the active engine exposes no skills dir, note it and skip (the QA pipeline is agent-driven and functions where agents build — Claude today; other providers are out of scope per the v1 distribution decision). If the file exists → regenerate only drifted sections after confirmation.

Detect the stack (runner, test dir + extension, pkg manager, boot command, screenshot API, axe wiring) and emit the SKILL.md using the skeleton below. Replace every `<…>` placeholder with the detected value; keep the fixed frontmatter, the three `##` headings, and the **Managed App Lifecycle procedure verbatim** (it is stack-independent). Then **verify the run command works** (dry `--help`/list) before finalizing, and flag any convention you had to guess for user confirmation.

The verbatim skeleton to write:
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
- **a11y:** `<axe-core wiring, e.g. @axe-core/playwright>`

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

## STEP 6: Scaffold Project QA Config

Target: `docs/qa/config.json` (git-tracked, project-wide).

If it exists → read, confirm/refresh values with the user, bump only what changed. If absent → create it interactively, asking for the project-specific values (do NOT guess base URL or auth/seed flow).

Write this shape (values are free-text hints; viewports default to the v1 set):
```json
{
  "baseUrl": "http://localhost:5173",
  "viewports": { "desktop": [1440, 900], "tablet": [768, 1024], "mobile": [375, 812] },
  "bootHint": "how to start the app's dev server (free text, project-specific)",
  "authSeed": "how an authenticated session is obtained for auth:true screens (free text / steps)"
}
```

⛔ `baseUrl` MUST point at a local/throwaway environment — `/add.qa` actively exercises flows (submits forms, creates records). Never a production URL.

---

## STEP 7: Scaffold Per-Feature Screen Catalog

Target: `FEATURE_DIR/_tests/screens.json` (the reachability-aware route map for the UX axis).

Read every `design.md` under the feature (feature-level and each subfeature). For each screen the design describes, derive one entry. Flag screens that require an authenticated session with `auth: true`. Do NOT store functional intent here — the functional axis is read from each SF's `about.md` at run time.

Each entry gains `kind` (`route` | `modal` | `overlay` | `portal`) and, for non-route surfaces, an ordered `open` recipe. Write this shape:
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

Route surfaces keep `path`; non-route (`modal`/`overlay`/`portal`) declare `kind` + `open`. Both forms coexist.

**`open` recipe grammar (fixed mini-schema):** an ordered array of step objects, each exactly one of — `{ "goto": "<path>" }`, `{ "click": "<selector>" }`, `{ "fill": ["<selector>", "<value>"] }`, `{ "select": ["<selector>", "<value>"] }`, `{ "wait": "<selector | ms>" }`. Selectors use Playwright role/testid syntax (`role=button[name=…]`, `testid=…`) — never brittle CSS.

Setup scaffolds the recipe **intent** from **`design.md` only** (the plan's QA axis does not exist yet at setup time); **selectors are finalized post-implementation by the `e2e-agent`**, which merges the richer intent from `plan.md`'s `## QA/E2E Specification`. This STEP stores thin intent, flags thin/missing designs rather than inventing routes.

If a design doc is missing or thin, list the screen with a note rather than inventing routes — flag it for the user.

---

## STEP 8: Autonomous Migration (IF MIGRATE)

⛔ IF `MIGRATE` is false → SKIP this step.

Run the migration per {{skill:add-qa-migration/SKILL.md}}, which defines the full sequence (`add.new → add.plan → add.build → add.review`), the checkpoints, the Decision Log, and the branch isolation. Pass it the detected tooling so `add.new`'s `about.md` frames the feature as "migrate the existing QA flow (`<detected tooling>`) to the code-addiction QA pipeline."

Dispatch each command in the chain as a subagent via the Agent tool — autonomous dispatch is **Claude-only in v1** (per the pipeline's distribution decision). Direct autonomy through the **dispatch prompt only**; never edit a dispatched command's source.

⛔ Do NOT merge the migration branch — hand it back for review in STEP 10.

---

## STEP 9: Universal Smoke Test + Bounded Correction Loop

⛔ IF no feature with a scaffolded `screens.json` exists → DEFER the smoke test (there is nothing for `/add.qa` to validate). Do NOT scaffold a synthetic feature to force it. Note the deferral in STEP 10, then skip to hand-off.

Otherwise, close the loop on every run:

### 9.1 Smoke test
Autonomously dispatch `/add.qa <feature-id>` (Agent tool) against the scaffolded feature. Analyze whether it: ran cleanly, produced the correct assets (screenshots, run artefacts), and whether `qa-agent` produced valid analysis documentation. Record PASS or FAIL with the specific findings.

### 9.2 Correction loop (max 3 attempts)
On FAIL, compose a correction instruction from the findings and autonomously dispatch `/add.build qa` to fix it, then re-run 9.1.

- Guard: `/add.build qa` requires the `qa-pipeline` feature. If that dispatch reports the feature is disabled, do NOT keep looping — surface it and instruct the user to run `codeadd features enable qa-pipeline`.
- ⛔ Cap at **3** correction attempts. If the smoke test still fails after the third, STOP looping and escalate to the user in STEP 10 with the accumulated findings from all attempts.

---

## STEP 10: Hand-off

Tell the user, in order:
1. Any prerequisite they declined / must finish manually (from STEP 3).
2. Migration outcome (if `MIGRATE` ran): the branch `add.new` created, the Decision Log location, and that it awaits their review before merge.
3. Smoke-test outcome: PASS, or the deferral reason (no feature/`screens.json` yet), or the escalation with accumulated findings after 3 failed corrections.
4. Enable the capability (optional — `/add.qa` degrades without it): `codeadd plugins enable playwright`.
5. Verify the MCP server is connected (`/mcp` lists `playwright`).
6. Run the audit: `/add.qa <feature-id> [SFxx]` (or `/add.qa @docs/features/.../about.md`).

`/add.qa-setup` does NOT modify application code, and does NOT merge the migration branch.

---

## Rules

ALWAYS:
- Point `baseUrl` at a local/throwaway environment (functional QA mutates state)

NEVER:
- Edit the source of a dispatched command (`add.new`/`add.plan`/`add.build`/`add.review`/`add.qa`) — autonomy is layered via the dispatch prompt, never by rewriting them
- Modify application source, app config, or migrations
- Enable the `playwright` plugin on the user's behalf (instruct them to)
