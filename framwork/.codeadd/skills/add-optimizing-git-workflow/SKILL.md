---
name: add-optimizing-git-workflow
description: Git global cfg setup — colors, performance, merge conflicts, aliases for new machines
---

# Optimizing Git Workflow

## Overview
Complete Git cfg setup: colors, auto-correction, smart defaults, time-saving aliases.

## When to Use
{"triggers":["new machine setup","improve output readability","reduce repetitive typing","better merge conflicts","optimize pull/push"]}

## When NOT to Use
- Per-repo cfg (use `--local` instead of `--global`)
- GUI-only users (aliases/pager target CLI workflows)
- CI configs (ephemeral envs don't need global cfg)

## Complete Setup
```bash
git config --global color.ui auto && git config --global color.status.added green && git config --global color.status.changed yellow && git config --global color.status.untracked red && git config --global format.pretty "format:%C(yellow)%h%C(reset) %s %C(cyan)<%an>%C(reset) %C(green)(%cr)%C(reset)" && git config --global help.autocorrect 20 && git config --global pull.rebase true && git config --global push.default current && git config --global push.autoSetupRemote true && git config --global diff.algorithm histogram && git config --global core.pager "less -FRX" && git config --global merge.conflictstyle diff3 && git config --global rerere.enabled true && git config --global alias.st "status -sb" && git config --global alias.lg "log --graph --oneline --decorate --all" && git config --global alias.last "log -1 HEAD" && git config --global alias.undo "reset HEAD~1 --mixed" && git config --global alias.recent "branch --sort=-committerdate"
```

## Verify & Reset
```bash
git config --global --list
git config --global --unset alias.lg
git config --global --remove-section alias
```

## Common Errors
| Symptom | Fix |
|---------|-----|
| Alias not working | Check quotes in cfg cmd |
| No colors | Test: `git -c color.ui=always status` |
| Autocorrect annoying | Reduce: `help.autocorrect 10` |
| Rebase problems | Disable: `pull.rebase false` |
