<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/skills/optimizing-git-workflow/SKILL.md -->
---
name: optimizing-git-workflow
description: Use when setting up Git on new machine, configuring aliases, or optimizing workflow - provides complete cfg for colors, performance, merge conflicts, and aliases
---

# Optimizing Git Workflow

## Overview
Complete Git cfg setup: colors, auto-correction, smart defaults, time-saving aliases.

## When to Use
{"triggers":["new machine setup","improve output readability","reduce repetitive typing","better merge conflicts","optimize pull/push"]}

## Aliases
{"st":"status -sb","lg":"log --graph --oneline --decorate --all","last":"log -1 HEAD","undo":"reset HEAD~1 --mixed","recent":"branch --sort=-committerdate"}

## Complete Setup
```bash
git config --global color.ui auto && git config --global color.status.added green && git config --global color.status.changed yellow && git config --global color.status.untracked red && git config --global format.pretty "format:%C(yellow)%h%C(reset) %s %C(cyan)<%an>%C(reset) %C(green)(%cr)%C(reset)" && git config --global help.autocorrect 20 && git config --global pull.rebase true && git config --global push.default current && git config --global push.autoSetupRemote true && git config --global diff.algorithm histogram && git config --global core.pager "less -FRX" && git config --global merge.conflictstyle diff3 && git config --global rerere.enabled true && git config --global alias.st "status -sb" && git config --global alias.lg "log --graph --oneline --decorate --all" && git config --global alias.last "log -1 HEAD" && git config --global alias.undo "reset HEAD~1 --mixed" && git config --global alias.recent "branch --sort=-committerdate"
```

## Cfg Details
{"colors":{"color.ui":"auto","status.added":"green","status.changed":"yellow","status.untracked":"red"},"perf":{"help.autocorrect":"20 (2s delay, auto-fix typos)","pull.rebase":"true (avoid merge commits)","push.autoSetupRemote":"true (auto tracking)","diff.algorithm":"histogram (better diffs)"},"merge":{"conflictstyle":"diff3 (show original)","rerere.enabled":"true (remember resolutions)"}}

## Verify & Reset
```bash
git config --global --list
git config --global --unset alias.lg
git config --global --remove-section alias
```

## Common Errors
{"alias_not_working":"check quotes in cfg cmd","no_colors":"test: git -c color.ui=always status","autocorrect_annoying":"reduce: help.autocorrect 10","rebase_problems":"disable: pull.rebase false"}
