---
description: QA prerequisites + project config bootstrap — installs chromium + Playwright MCP (confirm-then-execute) and scaffolds docs/qa/config.json + per-feature screens.json so /add.qa can run
argument-hint: "[feature-id]  (optional — scaffolds that feature's screen catalog; e.g. /add.qa-setup 0001F)"
---

# QA Setup - Prerequisites & Project Config Bootstrap

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Conversational bootstrap for QA validation. Diagnoses the environment, installs the Playwright MCP prerequisites (chromium + `@playwright/mcp`) with confirmation, and scaffolds the **project-specific QA config** (`docs/qa/config.json`) + per-feature screen catalog (`_qa-report/screens.json`) so `/add.qa` can drive the app. Runs BEFORE the `playwright` plugin is enabled — it is the base, non-injected setup.

---

## Required Skills

Load `{{skill:add-dev-environment-setup/SKILL.md}}` before STEP 2 (OS detection + confirm-before-install methodology).
Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 5 (feature doc layout, `_qa-report/` path, `qa-validation` conventions).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load context            → status.sh + add-dev-environment-setup
STEP 2: Diagnose environment    → OS, pkg manager, node, existing prereqs (no install yet)
STEP 3: Install prerequisites   → show commands → CONFIRM → execute → verify
STEP 4: Scaffold QA config      → docs/qa/config.json (interactive)
STEP 5: Scaffold screen catalog → FEATURE_DIR/_qa-report/screens.json from design.md
STEP 6: Hand-off                → enable plugin + run /add.qa
```

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 2** | Environment not diagnosed | Bash install commands, downloads | Detect OS/pkg-manager/node, probe existing prereqs |
| **STEP 3** | User has not confirmed the shown commands | Bash to run any install/download | Show exact commands + WAIT for explicit confirmation |
| **STEP 3** | Install runs | Silent/unattended install | Confirm-then-execute, one command set at a time, verify after |
| **STEP 4-5** | Always | Edit/Write on source code, app files, migrations | Write only under `docs/qa/` and `FEATURE_DIR/_qa-report/` |
| **STEP 5** | `design.md` not read | Invent screens/routes | Derive each screen entry from the design docs |

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
- Else → list features under `docs/features/` and ask which feature's screen catalog to scaffold (STEP 5). Config (STEP 4) is project-wide regardless.

---

## STEP 2: Diagnose Environment (silent — no installs)

Detect, without installing anything:
- OS + package manager + node/npx availability (per `add-dev-environment-setup`).
- chromium for Playwright present? (`npx playwright install --dry-run chromium` or check the Playwright browsers cache).
- `@playwright/mcp` resolvable? (`npx --yes @playwright/mcp@latest --version`).
- Is a Playwright MCP server already wired for the active provider? (check the provider's MCP config; for Claude Code `claude mcp list`).

Build a gap list: what is present vs missing. Present it before proposing any command.

---

## STEP 3: Install Prerequisites (confirm-then-execute)

For each missing prerequisite, show the EXACT command, explain what it does, then **WAIT for explicit confirmation** before running it. Never batch-run without confirmation. After each install, verify it succeeded.

Prerequisites (adapt commands to the detected OS/provider):
- **chromium for Playwright** — e.g. `npx playwright install chromium`.
- **Playwright MCP server** — the server runs via `npx @playwright/mcp@latest`; wire it as an MCP server for the active provider. For Claude Code: `claude mcp add playwright -- npx @playwright/mcp@latest`. For other providers, add the equivalent MCP server entry to that provider's MCP config (the same `npx @playwright/mcp@latest` command).

⛔ Skip a prerequisite only if STEP 2 proved it already present. ⛔ If the user declines a command, stop that install and record it as a remaining manual step in the hand-off (STEP 6).

After installs, confirm the MCP server is reachable (e.g. `/mcp` shows `playwright`). If it does not appear, the wiring is incomplete — surface it; `/add.qa` cannot drive without it.

---

## STEP 4: Scaffold Project QA Config

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

## STEP 5: Scaffold Per-Feature Screen Catalog

Target: `FEATURE_DIR/_qa-report/screens.json` (the route map for the UX axis).

Read every `design.md` under the feature (feature-level and each subfeature). For each screen the design describes, derive one entry. Flag screens that require an authenticated session with `auth: true`. Do NOT store functional intent here — the functional axis is read from each SF's `about.md` at run time.

Write this shape:
```json
{
  "feature": "<feature-id>",
  "screens": [
    {
      "id": "login",
      "sf": "SF02",
      "name": "Login",
      "path": "/login",
      "auth": false,
      "design": "docs/features/<feature-id>-.../subfeatures/SF02-.../design.md",
      "expect": "what a correct render / expected state looks like"
    }
  ]
}
```

If a design doc is missing or thin, list the screen with a note rather than inventing routes — flag it for the user.

---

## STEP 6: Hand-off

Tell the user, in order:
1. Any prerequisite they declined / must finish manually (from STEP 3).
2. Enable the capability: `codeadd plugins enable playwright`.
3. Verify the MCP server is connected (`/mcp` lists `playwright`).
4. Run the audit: `/add.qa <feature-id> [SFxx]` (or `/add.qa @docs/features/.../about.md`).

`/add.qa-setup` does NOT run the audit and does NOT modify application code.

---

## Rules

ALWAYS:
- Show the exact install command and confirm before executing it
- Verify each prerequisite after installing
- Point `baseUrl` at a local/throwaway environment (functional QA mutates state)
- Derive screen entries from `design.md`, flagging gaps instead of inventing routes
- Write only under `docs/qa/` and `FEATURE_DIR/_qa-report/`

NEVER:
- Run an install command before showing it and getting confirmation
- Install silently or unattended
- Modify application source, app config, or migrations
- Enable the `playwright` plugin on the user's behalf (instruct them to)
- Run the QA audit (that is `/add.qa`)
