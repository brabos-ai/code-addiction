---
name: dev-environment-setup
description: Use when user needs to set up bash/git/jq/gh CLI to run add-pro scripts, environment tools are missing, or VS Code terminal is not WSL — detects OS, diagnoses gaps silently, confirms with user, installs missing tools in correct order, and merges WSL profile into .vscode/settings.json on Windows
---

# Dev Environment Setup

## Overview

Detect OS → diagnose silently → confirm → install → configure VS Code.
**Never assume what's installed. Never install without confirmation. Never overwrite settings.json.**

---

## When to Use

- User asks about environment setup or "how do I run the scripts"
- `bash`, `git`, `jq`, or `gh` not found
- `feature-status.sh` fails due to missing tool
- VS Code terminal opens PowerShell/Git Bash instead of WSL

## When NOT to Use

- All tools already installed and verified
- User is on Linux with working environment

---

## ⛔ ABSOLUTE PROHIBITIONS

```
⛔ DO NOT USE Bash tool to run sudo, apt, dnf, pacman, brew install, curl|bash, wsl --install, or gh auth login
⛔ DO NOT USE Bash tool to run ANY command that requires password input or interactive prompts
⛔ DO NOT install WSL without confirming admin privileges first
⛔ DO NOT use `apt-get install gh` — outdated, use official gh repo
⛔ DO NOT reinstall WSL if Ubuntu or any real distro already exists — use existing
⛔ DO NOT suggest Git Bash as a bash alternative — WSL only
⛔ DO NOT overwrite .vscode/settings.json — always READ → MERGE → WRITE
⛔ DO NOT install anything if user says N to confirmation

INSTALLATION RULE:
  ⛔ DO NOT USE: Bash tool for install/auth commands (sudo hangs waiting for password)
  ✅ DO: SHOW commands in a code block → user copies and runs manually
  ✅ DO: AFTER user confirms execution → VERIFY with non-sudo checks (--version)
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

| Tool | Check | Windows note |
|------|-------|-------------|
| WSL | `wsl -l -v` | `docker-desktop` only = NOT ready |
| bash | `bash --version` | Must be inside WSL, not Git Bash |
| git | `git --version` | Inside WSL |
| gh | `gh --version` | Inside WSL |
| claude | `claude --version` | Optional — check if Claude Code is installed |
| opencode | `opencode --version` | Optional — check if OpenCode is installed |

WSL check logic:
- `wsl -l -v` shows a real distro (Ubuntu, Debian, etc.) → WSL is ready, use existing distro
- `wsl -l -v` shows only `docker-desktop` or nothing → WSL NOT ready, install Debian
⛔ DO NOT reinstall WSL if a real distro already exists — use whatever is installed.

---

## STEP 3: REPORT

Show what is missing vs already installed:

```
✅ WSL2: Debian installed
❌ git: not found inside WSL
✅ gh: installed
```

---

## STEP 4: CONFIRM

SAY: "Vou te mostrar os comandos para instalar. Você executa no terminal e me avisa quando terminar."

⛔ IF user says N → STOP.

**Windows only — admin check:**
⛔ IF `wsl --install` is needed → SAY first:
"Para instalar o WSL você precisa de um terminal com privilégios de Administrador. Abra o PowerShell como Administrador e execute o comando que vou te mostrar."
⛔ DO NOT USE Bash tool to run `wsl --install`.

---

## STEP 5: INSTRUCT USER TO INSTALL

⛔ DO NOT USE Bash tool for ANY command in this step.
⛔ ALL commands below are SHOWN to the user in code blocks — user copies and runs manually.
✅ AFTER user confirms execution → proceed to STEP 6 (VERIFY) using non-sudo checks.

### Windows

**5.1 — WSL2 + Debian** (only if no real distro found in STEP 2)
⛔ IF user already has Ubuntu, Debian, or any real distro → SKIP this step, use existing distro.

SAY: "Execute no PowerShell como Administrador:"

```powershell
wsl --install -d Debian
```

SAY: "Reinicie o Windows. Abra o terminal Debian para completar o setup e me avise."

⛔ WAIT for user confirmation before proceeding.

**5.2 — Tools inside WSL**

SAY: "Execute no terminal WSL:"

```bash
sudo apt update && sudo apt install -y git curl
```

⛔ WAIT for user confirmation before proceeding.

**5.3 — gh CLI (official repo — NOT `apt-get install gh`)**

SAY: "Execute estes comandos no terminal WSL, um bloco de cada vez:"

```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" \
  | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install -y gh
```

⛔ WAIT for user confirmation before proceeding.

**5.4 — gh auth login**

SAY: "Execute no terminal WSL:"

```bash
gh auth login
```

SAY: "Selecione: GitHub.com → HTTPS → Login with a web browser. Cole o código no navegador."

⛔ WAIT for user confirmation before proceeding.

**5.5 — VS Code settings.json (mandatory)**

READ `.vscode/settings.json`. MERGE WSL profile. WRITE back.
⛔ DO NOT overwrite — preserve all existing profiles (Git Bash, PowerShell, Cmder, etc.).

Use the distro name detected in STEP 2 (e.g., `Debian`, `Ubuntu`, `Ubuntu-24.04`):

```json
{
  "terminal.integrated.defaultProfile.windows": "WSL",
  "terminal.integrated.profiles.windows": {
    "WSL": {
      "path": "C:\\WINDOWS\\System32\\wsl.exe",
      "args": ["-d", "<DETECTED_DISTRO>"],
      "icon": "terminal-linux"
    }
  }
}
```

Result: user opens VS Code normally (shortcut/taskbar/recent files) → new terminal opens WSL automatically. No workflow change needed.

**5.6 — AI Coding Tools in WSL (optional)**

ASK: "Quais ferramentas de AI você utiliza? Posso te mostrar como instalar no WSL:"
- [ ] Claude Code
- [ ] OpenCode
- [ ] Nenhuma — pular

⛔ ONLY show install commands for tools the user confirms.

SAY: "Execute no terminal WSL:"

```bash
# Claude Code (if confirmed)
# ⛔ DO NOT use `npm install -g @anthropic-ai/claude-code` — deprecated
curl -fsSL https://claude.ai/install.sh | bash

# OpenCode (if confirmed)
curl -fsSL https://opencode.ai/install | bash
```

⛔ WAIT for user confirmation before proceeding to STEP 6.

> ℹ️ **Performance tip (applies to both tools):** Projects at `/mnt/c/...` run slower than projects in the native WSL filesystem. For best performance, clone repos directly into WSL: `~/projects/`.

---

### macOS

⛔ DO NOT USE Bash tool. SHOW all commands to user.

SAY: "Execute no terminal:"

```bash
# Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install git gh
gh auth login

# Check bash version — upgrade if < 4.0
bash --version
brew install bash   # if needed
```

SAY for AI tools (if confirmed): "Execute no terminal:"

```bash
# Claude Code
curl -fsSL https://claude.ai/install.sh | bash

# OpenCode
curl -fsSL https://opencode.ai/install | bash
```

⛔ WAIT for user confirmation before proceeding to STEP 6.

---

### Linux

⛔ DO NOT USE Bash tool. SHOW all commands to user.

SAY: "Execute no terminal:"

```bash
# Debian/Ubuntu
sudo apt update && sudo apt install -y git curl
# Install gh via official repo (same as Windows/WSL flow above)
gh auth login

# Fedora/RHEL
sudo dnf install -y git gh && gh auth login

# Arch
sudo pacman -S git github-cli && gh auth login
```

SAY for AI tools (if confirmed): "Execute no terminal:"

```bash
# Claude Code
curl -fsSL https://claude.ai/install.sh | bash

# OpenCode
curl -fsSL https://opencode.ai/install | bash
```

⛔ WAIT for user confirmation before proceeding to STEP 6.

---

## STEP 6: VERIFY

✅ This step CAN use Bash tool — verification commands are non-sudo, non-interactive.

```bash
git --version && gh --version && echo "✅ All tools ready"
# If AI tools were installed:
claude --version 2>/dev/null && echo "✅ Claude Code ready" || true
opencode --version 2>/dev/null && echo "✅ OpenCode ready" || true
```

⛔ IF any tool still missing → diagnose installation error. DO NOT declare success.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `wsl --install` without admin | Confirm admin first → "Run as Administrator" |
| `sudo apt-get install gh` | Use official gh CLI repo — apt version is outdated |
| `wsl -l -v` shows only docker-desktop or empty | Install Debian: `wsl --install -d Debian` |
| Ubuntu already installed | Use it — do NOT reinstall with Debian |
| Overwriting settings.json | Always READ → MERGE → WRITE |
| Suggesting Git Bash as bash | Git Bash is NOT supported — WSL only |
| Skipping settings.json | It's mandatory — user won't change VS Code workflow |
| Proceeding after user says N | Stop immediately, show manual commands only |
| Declaring success before verifying | Run STEP 6 first |
| `npm install -g @anthropic-ai/claude-code` | Use native installer: `curl -fsSL https://claude.ai/install.sh \| bash` |
| Installing AI tools without asking | Always confirm which tools user wants: Claude Code / OpenCode / Nenhuma |
| Running sudo/apt/brew via Bash tool | Agent hangs — sudo requires password. SHOW commands, user runs manually |
| Running `gh auth login` via Bash tool | Agent hangs — interactive prompt. SHOW command, guide user step by step |
| Running `curl \| bash` via Bash tool | Agent hangs — interactive installer. SHOW command, user runs manually |
