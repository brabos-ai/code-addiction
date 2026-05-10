---
name: add-dev-environment-setup
description: Use when bash/git/jq/gh CLI are missing or VS Code terminal is not WSL — detects OS, diagnoses gaps, installs missing tools.
---

# Dev Environment Setup

## Overview

Detect OS → diagnose silently → confirm → install → configure VS Code.
**Never assume what's installed. Never install without confirmation. Never overwrite settings.json.**

---

## When to Use

- User asks about environment setup or "how do I run the scripts"
- `bash`, `git`, `jq`, or `gh` not found
- `status.sh` fails due to missing tool
- VS Code terminal opens PowerShell/Git Bash instead of WSL

## When NOT to Use

- All tools already installed and verified
- User is on Linux with working environment
- Container or CI environment (ephemeral; tools provisioned by image/workflow)

---

## ⛔ ABSOLUTE PROHIBITIONS

```
⛔ NEVER use Bash tool for sudo/apt/dnf/pacman/brew/curl|bash/wsl --install/gh auth login (hangs on password or interactive prompt)
⛔ NEVER overwrite .vscode/settings.json, reinstall WSL when a real distro exists, suggest Git Bash, use `apt-get install gh`, or proceed after user says N
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

| Tool | Check | Windows note |
|------|-------|-------------|
| WSL | `wsl -l -v` | `docker-desktop` only = NOT ready |
| bash | `bash --version` | Must be inside WSL, not Git Bash |
| git | `git --version` | Inside WSL |
| gh | `gh --version` | Inside WSL |

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

SAY: "I'll show you the commands to install. You run them in the terminal and let me know when you're done."

⛔ IF user says N → STOP.

**Windows only — admin check:**
⛔ IF `wsl --install` is needed → SAY first:
"To install WSL you need a terminal with Administrator privileges. Open PowerShell as Administrator and run the command I'll show you."
⛔ DO NOT USE Bash tool to run `wsl --install`.

---

## STEP 5: INSTRUCT USER TO INSTALL

⛔ DO NOT USE Bash tool for ANY command in this step.
⛔ ALL commands below are SHOWN to the user in code blocks — user copies and runs manually.
⛔ AFTER each sub-step, WAIT for user confirmation before proceeding to the next.
✅ AFTER user confirms execution → proceed to STEP 6 (VERIFY) using non-sudo checks.

### Windows

**5.1 — WSL2 + Debian** (only if no real distro found in STEP 2)
⛔ IF user already has Ubuntu, Debian, or any real distro → SKIP this step, use existing distro.

SAY: "Run in PowerShell as Administrator:"

```powershell
wsl --install -d Debian
```

SAY: "Restart Windows. Open the Debian terminal to complete the setup and let me know."

**5.2 — Tools inside WSL**

SAY: "Run in the WSL terminal:"

```bash
sudo apt update && sudo apt install -y git curl
```

**5.3 — gh CLI (official repo — NOT `apt-get install gh`)**

SAY: "Run these commands in the WSL terminal, one block at a time:"

```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" \
  | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install -y gh
```

**5.4 — gh auth login**

SAY: "Run in the WSL terminal:"

```bash
gh auth login
```

SAY: "Select: GitHub.com → HTTPS → Login with a web browser. Paste the code in the browser."

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

---

### Unix (macOS + Linux)

⛔ DO NOT USE Bash tool. SHOW all commands to user.

Pick the package manager that matches the user's OS:

| OS | Install command |
|----|-----------------|
| macOS (Homebrew) | `brew install git gh` (install Homebrew first if missing — see below) |
| Debian/Ubuntu | `sudo apt update && sudo apt install -y git curl` then official gh repo (same flow as Windows 5.3) |
| Fedora/RHEL | `sudo dnf install -y git gh` |
| Arch | `sudo pacman -S git github-cli` |

SAY: "Run in the terminal:"

```bash
# macOS — install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# macOS — bash upgrade if < 4.0
bash --version
brew install bash   # if needed
```

After install, in all cases:

```bash
gh auth login
```

---

## STEP 6: VERIFY

✅ This step CAN use Bash tool — verification commands are non-sudo, non-interactive.

```bash
git --version && gh --version && echo "✅ All tools ready"
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
| Running sudo/apt/brew via Bash tool | Agent hangs — sudo requires password. SHOW commands, user runs manually |
| Running `gh auth login` via Bash tool | Agent hangs — interactive prompt. SHOW command, guide user step by step |
| Running `curl \| bash` via Bash tool | Agent hangs — interactive installer. SHOW command, user runs manually |
