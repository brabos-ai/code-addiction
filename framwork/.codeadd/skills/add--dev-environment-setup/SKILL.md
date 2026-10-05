---
name: add--dev-environment-setup
description: Use when Node, git or gh CLI are missing, or Node is older than 22.19.0 — detects OS, diagnoses gaps, installs missing tools.
---

# Dev Environment Setup

<!-- uses:
- script: status.cjs
-->

## Overview

Detect OS → diagnose silently → confirm → install → verify.
**Node (>=22.19.0) is the one runtime every shipped entry needs — no Bash, WSL or Git Bash. Never
assume what's installed. Never install without confirmation. Never overwrite settings.json.**

---

## When to Use

- User asks about environment setup or "how do I run the scripts"
- `node`, `git`, or `gh` not found
- Node is present but older than 22.19.0
- `status.cjs` fails because Node is missing or too old

## When NOT to Use

- All tools already installed and verified
- Container or CI environment (ephemeral; tools provisioned by image/workflow)

---

## ⛔ ABSOLUTE PROHIBITIONS

```
⛔ NEVER use Bash tool for sudo/apt/dnf/pacman/brew/curl|bash/gh auth login (hangs on password or interactive prompt)
⛔ NEVER overwrite .vscode/settings.json, or proceed after user says N
✅ ALWAYS show install commands in code blocks → user runs manually → verify with non-sudo `--version` checks
```

---

## STEP 1: DETECT OS (MANDATORY FIRST)

```bash
uname -s          # macOS → Darwin | Linux → Linux
$env:OS           # Windows PowerShell → Windows_NT
```

⛔ DO NOT proceed without `TARGET_OS = windows | macos | linux`.

---

## STEP 2: DIAGNOSE (silent — no prompts yet)

| Tool | Check | Note |
|------|-------|------|
| node | `node --version` | MUST be >= 22.19.0 — the shipped entries are native CommonJS and need no other runtime |
| git  | `git --version` | branches, worktrees and commits |
| gh   | `gh --version` | pull requests; optional if the user never opens one |

**No shell is a dependency.** Bash, WSL and Git Bash are not required to run any shipped entry:
`node .codeadd/scripts/<entry>.cjs` is the one invocation form on every platform.

---

## STEP 3: REPORT

Show what is missing vs already installed:

```
✅ node: v24.11.0 (>= 22.19.0)
❌ git: not found
✅ gh: installed
```

---

## STEP 4: CONFIRM

SAY: "I'll show you the commands to install. You run them in the terminal and let me know when you're done."

⛔ IF user says N → STOP.

---

## STEP 5: INSTRUCT USER TO INSTALL

⛔ DO NOT USE Bash tool for ANY command in this step.
⛔ ALL commands below are SHOWN to the user in code blocks — user copies and runs manually.
⛔ AFTER each sub-step, WAIT for user confirmation before proceeding to the next.
✅ AFTER user confirms execution → proceed to STEP 6 (VERIFY) using non-sudo checks.

### Windows

**5.1 — Node (>=22.19.0; Node 24 LTS recommended)**

SAY: "Run in PowerShell:"

```powershell
winget install OpenJS.NodeJS.LTS
```

If `winget` is unavailable, direct the user to the official installer at
<https://nodejs.org/en/download>. Open a NEW terminal after install so `node` reaches `PATH`.

**5.2 — git and gh**

```powershell
winget install --id Git.Git
winget install --id GitHub.cli
```

**5.3 — gh auth login**

SAY: "Run in the terminal:"

```bash
gh auth login
```

SAY: "Select: GitHub.com → HTTPS → Login with a web browser. Paste the code in the browser."

### Unix (macOS + Linux)

⛔ DO NOT USE Bash tool. SHOW all commands to user.

| OS | Install command |
|----|-----------------|
| macOS (Homebrew) | `brew install node git gh` (install Homebrew first if missing — see below) |
| Debian/Ubuntu | `sudo apt update && sudo apt install -y nodejs npm git curl` then the official gh repo (below) |
| Fedora/RHEL | `sudo dnf install -y nodejs git gh` |
| Arch | `sudo pacman -S nodejs npm git github-cli` |

**Node version matters.** A distro package older than 22.19.0 must be replaced by nvm or the
official installer:

```bash
# nvm — the version-manager route when the distro package is too old
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

```bash
# macOS — install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, in all cases:

```bash
gh auth login
```

---

## STEP 6: VERIFY

✅ This step CAN use Bash tool — verification commands are non-sudo, non-interactive.

```bash
node --version && git --version && gh --version && echo "✅ All tools ready"
```

⛔ IF `node` is older than 22.19.0, or any tool is still missing → diagnose the installation error.
DO NOT declare success.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Distro `nodejs` older than 22.19.0 | Replace it with nvm or the official installer — check `node --version` |
| `sudo apt-get install gh` | Use the official gh CLI repo — the apt version is outdated |
| `node` not found after install on Windows | Open a NEW terminal so `PATH` is refreshed |
| Overwriting settings.json | Always READ → MERGE → WRITE |
| Proceeding after user says N | Stop immediately, show manual commands only |
| Declaring success before verifying | Run STEP 6 first, including the Node floor |
| Running sudo/apt/brew via Bash tool | Agent hangs — sudo requires password. SHOW commands, user runs manually |
| Running `gh auth login` via Bash tool | Agent hangs — interactive prompt. SHOW command, guide user step by step |
| Running `curl \| bash` via Bash tool | Agent hangs — interactive installer. SHOW command, user runs manually |