# Build end to end outside Claude

**Date:** 2026-09-17
**Plan:** `2026-09-17T124433-PLAN--build-end-to-end-non-claude`
**Layers:** product (script, command, cli test), internal (build dialects, one skill note)

## TL;DR

`/add.build` no longer halts on OpenCode with a non-Claude model on Windows. A resumed build passes
setup, subagents dispatch on the session model, and the shell policy `/add.wiki` writes works when the
engine's shell is already bash.

## What changed

- **`build-setup.sh` lets a resumed build through.** The dirty-tree guard now runs only when the current
  branch differs from the target branch — the only case where a checkout happens. On the feature branch
  with uncommitted work it exits 0 with `STATE:current`. Off the branch it still exits 5. New bats case
  pins it.
- **Non-Claude agents no longer carry `model`.** `AGENT_DIALECTS.opencode`, `.cursor` and `.codex` in
  `scripts/build.js` stop emitting it. The sources pin `sonnet`, `haiku` and `inherit`, which name
  nothing outside Claude, so a subagent dispatch on Grok failed. Without the key each provider uses the
  session model. The claude dialect is unchanged. A test in `cli/tests/build.test.js` asserts both sides.
- **The Windows shell policy names both shell forms.** `/add.wiki` STEP 7.2 used to write only
  `& "<bash.exe>" -lc "<command>"`. `&` is PowerShell's call operator, so on a bash shell every script
  call was a syntax error. The policy now says: shell already bash → run the command as is; PowerShell →
  the `&` form.
- **`add-framework-development`'s agent passthrough note** now says only Claude keeps `model`.

## Not included

- AGENTS.md files already written in user projects keep the old policy until `/add.wiki` runs again.
- The `MODEL: Use haiku` guidance line in `add.pull-request`.
- The stale tracked `framwork/.agent/skills/add.wiki/SKILL.md`.
