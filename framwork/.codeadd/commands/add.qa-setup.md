---
description: QA prerequisites + project config bootstrap — installs the @playwright/test runner (mandatory) + chromium + Playwright MCP (optional, confirm-then-execute), generates a project-specific qa-project skill, and scaffolds docs/qa/config.json + reachability-aware FEATURE_DIR/_tests/screens.json so /add.qa can run
argument-hint: "[feature-id]  (optional — scaffolds that feature's screen catalog; e.g. /add.qa-setup 0001F)"
---

# QA Setup - Prerequisites & Project Config Bootstrap

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Conversational bootstrap for QA validation. Diagnoses the environment, installs the `@playwright/test` runner (mandatory) + chromium + `@playwright/mcp` (optional) with confirmation, generates a project-specific `qa-project` skill (conventions + managed app lifecycle), and scaffolds the **project-specific QA config** (`docs/qa/config.json`) + per-feature reachability-aware screen catalog (`FEATURE_DIR/_tests/screens.json`) so `/add.qa` can drive the app. Runs BEFORE the `playwright` plugin is enabled — it is the base, non-injected setup.

---

## Required Skills

Load `{{skill:add-dev-environment-setup/SKILL.md}}` before STEP 2 (OS detection + confirm-before-install methodology).
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 6 (feature doc layout, `_tests/` per-run path + `screens.json` reachability schema, `qa-validation` conventions).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load context            → status.sh + add-dev-environment-setup
STEP 2: Diagnose environment    → OS, pkg manager, node, runner + MCP + chromium (no install yet)
STEP 3: Install prerequisites   → runner (mandatory) + chromium + MCP (optional) → CONFIRM → execute → verify
STEP 4: Generate qa-project     → <provider skills dir>/qa-project/SKILL.md (conventions + managed app lifecycle)
STEP 5: Scaffold QA config      → docs/qa/config.json (interactive, project-wide)
STEP 6: Scaffold catalog        → FEATURE_DIR/_tests/screens.json (reachability-aware: route OR open-recipe)
STEP 7: Hand-off                → enable plugin (optional) + run /add.qa
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 2** | Environment not diagnosed | Bash install commands, downloads | Detect OS/pkg-manager/node, probe existing prereqs |
| **STEP 3** | User has not confirmed the shown commands | Bash to run any install/download | Show exact commands + WAIT for explicit confirmation |
| **STEP 3** | Install runs | Silent/unattended install | Confirm-then-execute, one command set at a time, verify after |
| **STEP 3** | Runner not installed | Authoring/running specs | Install `@playwright/test` first |
| **STEP 4-6** | Always | Edit/Write on source code, app files, migrations | Write only under `docs/qa/`, `FEATURE_DIR/_tests/`, and the resolved provider skills dir (`qa-project/`) |
| **STEP 6** | `design.md` not read | Invent screens/routes | Derive each screen entry from the design docs |

---

## STEP 1: Load Context

### 1.1 Run status.sh
```bash
bash .codeadd/scripts/status.sh
```
Parse: OWNER (name + level), PROJECT_DOCS, package manager hints, features under `docs/features/`.

### 1.2 Load install methodology
Read {{skill:add-dev-environment-setup/SKILL.md}} — reuse its OS-detection + confirm-before-install discipline. This command installs (confirm-then-execute), it does NOT merely instruct.

### 1.3 Resolve target feature (optional)
- If a `feature-id` arg was given → `FEATURE_DIR = docs/features/<feature-id>-*`.
- Else → list features under `docs/features/` and ask which feature's screen catalog to scaffold (STEP 6). Config (STEP 5) is project-wide regardless.

---

## STEP 2: Diagnose Environment (silent — no installs)

Detect, without installing anything:
- OS + package manager + node/npx availability (per `add-dev-environment-setup`).
- `@playwright/test` runner resolvable / present in `package.json` devDependencies?
- chromium for Playwright present? (`npx playwright install --dry-run chromium` or check the Playwright browsers cache).
- `@playwright/mcp` resolvable? (`npx --yes @playwright/mcp@latest --version`).
- Is a Playwright MCP server already wired for the active provider? (check the provider's MCP config; for Claude Code `claude mcp list`).

Build a gap list: the runner (mandatory) vs chromium/MCP (optional) — what is present vs missing. Present it before proposing any command.

---

## STEP 3: Install Prerequisites (confirm-then-execute)

For each missing prerequisite, show the EXACT command, explain what it does, then **WAIT for explicit confirmation** before running it. Never batch-run without confirmation. After each install, verify it succeeded.

Prerequisites (adapt commands to the detected OS/provider):
- **`@playwright/test` runner (mandatory)** — e.g. `npm i -D @playwright/test` (adapt to detected pkg manager). Powers the deterministic layer + plugin-off degradation. If declined → record as a blocking manual step; downstream authoring cannot run.
- **chromium for Playwright** — e.g. `npx playwright install chromium`.
- **Playwright MCP server (optional — only the live-driving arm of `/add.qa` needs it)** — the server runs via `npx @playwright/mcp@latest`; wire it as an MCP server for the active provider. For Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`. For other providers, add the equivalent MCP server entry to that provider's MCP config (the same `npx @playwright/mcp@latest` command).

⛔ Skip a prerequisite only if STEP 2 proved it already present. ⛔ If the user declines a command, stop that install and record it as a remaining manual step in the hand-off (STEP 7).

After installs, confirm the MCP server is reachable (e.g. `/mcp` shows `playwright`). If it does not appear, the wiring is incomplete — surface it; `/add.qa` cannot drive without it.

---

## STEP 4: Generate Project QA Skill (`qa-project`)

Resolve the target skills dir for **each installed provider** (from the manifest / the engine's skills path) and write `qa-project/SKILL.md` there — e.g. `.claude/skills/qa-project/SKILL.md` on Claude Code. If the active engine exposes no skills dir, note it and skip (the QA pipeline is agent-driven and functions where agents build — Claude today; other providers "paciência" per the v1 distribution decision). If the file exists → regenerate only drifted sections after confirmation.

Detect the stack (runner, test dir + extension, pkg manager, boot command, screenshot API, axe wiring) and emit the SKILL.md using the skeleton below. Replace every `<…>` placeholder with the detected value; keep the fixed frontmatter, the three `##` headings, and the **Managed App Lifecycle procedure verbatim** (it is stack-independent). Then **verify the run command works** (dry `--help`/list) before finalizing, and flag any convention you had to guess for user confirmation.

The verbatim skeleton to write:
```markdown
---
name: qa-project
description: Project-specific QA conventions + managed app lifecycle for /add.test E2E authoring and /add.qa execution.
---

# Project QA Conventions

## Conventions
- **Runner:** <e.g. @playwright/test>
- **Run one spec:** `<command to run a single spec>`
- **Run full suite:** `<command to run all specs>`
- **Spec location + naming:** `<dir>` · `<surface>.qa.spec.<ext>`
- **Selectors:** MANDATORY `getByRole` / `data-testid` — never brittle CSS/xpath.
- **Screenshots:** `<screenshot API>` → `_tests/run-NNN/screenshots/<screen>.<viewport>.png`
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

## STEP 5: Scaffold Project QA Config

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

## STEP 6: Scaffold Per-Feature Screen Catalog

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

## STEP 7: Hand-off

Tell the user, in order:
1. Any prerequisite they declined / must finish manually (from STEP 3).
2. Enable the capability (optional — `/add.qa` degrades without it): `codeadd plugins enable playwright`.
3. Verify the MCP server is connected (`/mcp` lists `playwright`).
4. Run the audit: `/add.qa <feature-id> [SFxx]` (or `/add.qa @docs/features/.../about.md`).

`/add.qa-setup` does NOT run the audit and does NOT modify application code.

---

## Rules

ALWAYS:
- Show the exact install command and confirm before executing it
- Install the `@playwright/test` runner (mandatory) — confirm first
- Verify each prerequisite after installing
- Point `baseUrl` at a local/throwaway environment (functional QA mutates state)
- Derive screen entries from `design.md`, flagging gaps instead of inventing routes
- Write only under `docs/qa/`, `FEATURE_DIR/_tests/`, and the resolved provider skills dir (`qa-project/`)

NEVER:
- Run an install command before showing it and getting confirmation
- Install silently or unattended
- Modify application source, app config, or migrations
- Enable the `playwright` plugin on the user's behalf (instruct them to)
- Run the QA audit (that is `/add.qa`)
