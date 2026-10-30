---
description: Guided onboarding — diagnoses the project, offers each feature and plugin with its benefit in one batch, and runs the setup pieces for the accepted items
---

# Setup - Guided Onboarding

<!-- uses:
- command: /add-brainstorm
- command: /add-new
- command: /add-qa-setup
- command: /add-wiki
- script: status.cjs
- skill: add--delivery-mode
- skill: add--dev-environment-setup
- skill: add--ecosystem
- skill: add--final-report
- skill: add--settings
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Thin orchestrator for a fresh or updated install. It diagnoses the project, offers every feature and plugin with its benefit in ONE numbered batch, and for the items the user accepts, and only those, installs the external tools, runs one `codeadd modify`, then runs `/add-qa-setup` and `/add-wiki` inline. It records every decision and its reason in the `setup` section of `.codeadd/settings.json`. It reimplements none of the pieces it runs.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP add-setup.diagnose: Diagnose (read-only)   → status.cjs + manifest + greenfield + frontend + gitnexus --version + the setup record
STEP add-setup.greenfield: Greenfield stop      → GREENFIELD=yes: no batch, next command is /add-brainstorm
STEP add-setup.batch: One batch, one wait       → diagnosis + one numbered item per feature, plugin, qa-setup, wiki, version-record → WAIT
STEP add-setup.answers: Read the reply          → per-item answers → print the `## Setup answers` block
STEP add-setup.execute: Run accepted items      → installs → one codeadd modify → gitnexus setup/analyze → QA setup → MCP checkpoint → wiki
STEP add-setup.record: Write the record         → `setup` section of .codeadd/settings.json, at the end of EVERY run
STEP add-setup.close: Close                     → final report + one next command
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF THE BATCH HAS NOT BEEN ANSWERED:
  ⛔ DO NOT USE: Bash to install a tool, run codeadd modify, or write any file (the one exception is the record of STEP add-setup.record, which the greenfield stop and the nothing-to-ask path write without a reply)
  ⛔ DO NOT: Enable, install or run anything — the diagnosis is read-only
  ✅ DO: Print the batch and WAIT for the reply

IF AN ITEM WAS NOT ACCEPTED:
  ⛔ DO NOT: Run any command of that item, or re-ask it in the same run
  ✅ DO: List it as declined in the report

IF GREENFIELD=yes:
  ⛔ DO NOT: Print the batch or run any install
  ✅ DO: Go to STEP add-setup.greenfield

IF .codeadd/settings.json DOES NOT PARSE:
  ⛔ DO NOT: Overwrite it, recreate it or write any section — it also holds other sections
  ✅ DO: Report it and STOP

IF A STEP FAILS:
  ⛔ DO NOT: Roll back, retry blindly or go on to the next item
  ✅ DO: Stop, name the failing command and its output, list what already ran, then go to STEP add-setup.record
```

**Named exception — the one command allowed to run the `codeadd` CLI.** This command alone may run `codeadd modify`, `codeadd features list` and `codeadd plugins list`, and only in STEP add-setup.execute. The help command keeps its rule of running no `codeadd` command but `--help`, and so does every other command.

**This command runs no git staging or commit command.** Versioning `.codeadd/settings.json` is reported, never done here.

---

## STEP add-setup.diagnose: Diagnose (read-only)

Load `{{skill:add--ecosystem/SKILL.md}}`. Its `## Features`, `## Plugins` and `## Commands` tables are the only source of what an item is and what it gains. Read the `Purpose` or `Description` cell and the `Benefit` cell from it now. Never write benefit text from memory and never copy it into this file.

Collect these signals. None of them changes anything.

- **Status:** run `node .codeadd/scripts/status.cjs` and read `WIKI`, `WIKI_STALE_COUNT`, `SETUP_QA` and `SETUP_QA_STALE`. When it fails, report why and treat those four as unknown.
- **What is on:** read `.codeadd/manifest.json` in the project root. When there is none, read the one in the user's home folder (a `--global` install). Use the first found; never merge the two. A feature is on when `features.<name>` is `true`, and when the key is absent use the `Default` column of the `Features` table. A plugin is on when `plugins.<name>.enabled` is `true`, and when the key is absent it is off. With neither manifest, say the framework is not installed here and STOP. When only the home manifest exists, every `codeadd` call in STEP add-setup.execute carries `--global`, and the batch says so.
- **Greenfield:** apply the "Greenfield check" of `{{cmd:add-brainstorm}}` (STEP add-brainstorm.load-context) exactly as written there. This command does not restate the rule. Evaluate it once.
- **Frontend present:** true when the code serves a UI in a browser, judged from the package manifests and the source tree. On a repo with no code yet, true when the `## Stack Conventions` table in `.codeadd/wiki/conventions.md` names a frontend stack. When `conventions.md` is absent, read `### Stack Conventions` in `.codeadd/wiki/index.md` the same way.
- **Code present:** true when the repo has source files beyond docs and configuration.
- **Codebase graph tool:** run `gitnexus --version`. Probe no other tool.
- **Dev tools:** use `{{skill:add--dev-environment-setup/SKILL.md}}`'s detection when an install is going to be offered.
- **The record:** read `.codeadd/settings.json` and its `setup` section. A missing file or section means a first run. A file that does not parse: report it and STOP, never overwrite it.

### Classify every item

The items are every row of `Features`, every row of `Plugins`, and `qa-setup`, `wiki` and `version-record`. Put each in exactly one group:

| Group | When | Does |
|---|---|---|
| **on** | The manifest, `SETUP_QA:present` (not stale), `WIKI:present`, or `git ls-files --error-unmatch .codeadd/settings.json` says it is already in place | Listed once as on. Not asked. A first-run item in this group is recorded `already-on` |
| **new** | The item name is absent from `offered` (or there is no record) | Asked in the batch, with its benefit |
| **decided** | The name is in `offered`, nothing drifted | One summary line: name, `offered` value, latest `log` reason, date. Not asked |
| **drift** | `offered` says `enabled` or `already-on` but the item is now off in the manifest (a fresh clone, or a manual disable) | Asked again, showing both states |
| **removed** | An `offered` key is no longer in the tables or the item list | One note line: "no longer offered by this version". Not asked. The key stays |

Three exceptions to the table: `tdd-pipeline` is on by default, but on a first run (name absent from `offered`) it is still asked, as keep on or turn off. `qa-setup` with `SETUP_QA_STALE:yes` counts as **drift**, so a stale QA setup is offered again as a re-run of `/add-qa-setup` only. A legacy value that `{{skill:add--settings/SKILL.md}}` no longer writes is treated as new, so the item is asked again.

Newness is the item NAME absent from `offered`. Never compare `framework-version` to decide it. A release that adds no item asks nothing. A `declined` item is never re-asked unless the user names it to revisit in the reply.

---

## STEP add-setup.greenfield: Greenfield stop

IF GREENFIELD IS NOT yes → skip this step.

IF GREENFIELD=yes: print the diagnosis, say there is nothing to analyze yet, propose nothing, and run no install. Go to STEP add-setup.record, then STEP add-setup.close with the next command `/add-brainstorm`. After the foundations are written the user runs `/add-setup` again, and the repo is then no longer greenfield.

---

## STEP add-setup.batch: One batch, one wait

Print the diagnosis, then ONE numbered message. Every question goes out at once, each with a RECOMMENDED answer and the reason. WAIT once.

IF A STEP ASKS THE USER ONE OR MORE QUESTIONS:
  ⛔ DO NOT: Ask one item, wait, then ask the next
  ⛔ DO NOT USE: A structured-question tool, or an option table printed apart from the numbered list
  ✅ DO: Send the whole batch in one message and WAIT

The batch opens with the diagnosis: what is on, the one-line summary of each decided item, each removed-item note, the recorded `framework-version` for context only, and the `--global` note when it applies. Then one numbered item per **new** or **drift** item. Each item shows:

- what it is and its benefit, from the `Purpose` or `Description` cell and the `Benefit` cell of the ecosystem tables, plus one clause tying it to this project when a signal supports it;
- the recommendation, yes or no, with the detected reason;
- the exact install commands and the CLI flag it implies if accepted;
- the question "use it? (yes/no)".

If nothing is new, drifted or named to revisit, say the project is fully set up and go to STEP add-setup.record.

### Recommendations

| Item | Recommend | Reason shown |
|---|---|---|
| `qa-pipeline` | yes when a frontend is present and `SETUP_QA:absent`; else no | "guarantees the quality of UI deliveries" |
| `playwright` and `qa-setup` | yes with `qa-pipeline`. Offered only when `qa-pipeline` is accepted or already on | `playwright` adds live driving to the judge the feature supplies. `SETUP_QA_STALE:yes` re-runs `qa-setup` only |
| `gitnexus` | yes when `gitnexus --version` fails and the repo has code. Not offered on a repo with no code: nothing to index | Install: `npm install -g gitnexus`, then `gitnexus setup` and `gitnexus analyze` from the repo root, then the plugin flag |
| `design` | yes when a frontend is present | When ui-ux-pro-max is not installed, show `npm install -g ui-ux-pro-max-cli` then `uipro init --ai <provider>`. Python 3 is a soft requirement. The CLI's own check stays the authority |
| `agent-mode` | no | Asked as "will a bot drive the commands headless?" |
| `tdd-pipeline` | yes (keep on) | Asked as keep on or turn off |
| `docs-pruning` | no | It deletes feature scaffolding, so it is the user's call |
| `wiki` | yes when `WIKI:absent`, and it runs last | When `WIKI_STALE_COUNT` is above zero, add a report line recommending `/add-wiki update`; it is not run |
| `version-record` | recommended: yes | "Version `.codeadd/settings.json` with the project: teammates and future updates see what was enabled and why, and the QA setup travels with it." On no, the line `.codeadd/settings.json` is appended after the `# END ADD` line of `.gitignore`, which also keeps the `qa` section local. Without a managed `.gitignore` block, only report the `git check-ignore` result |

### Values the sub-commands would ask

For accepted `qa-setup` only, the batch also asks the values `{{cmd:add-qa-setup}}` would otherwise ask: `baseUrl` (recommend it from the project's dev script, never a production URL), `bootHint`, `authSeed`, and the migration decision only when that command's migration scan list finds existing tooling (apply its list by reference, do not copy it). `{{cmd:add-wiki}}` needs nothing from the batch.

### The reply

The reply may be per item (`1 yes, 2 no`), `all recommended` (accepts exactly the items marked yes), or free text. The user may add `revisit <names>`; those decided items are then asked as normal items in this same run.

---

## STEP add-setup.answers: Read the reply

Map every answer to its item. An item the reply does not answer stays undecided: nothing runs, its `offered` value does not move and no `log` entry is written. Report it.

Print the `## Setup answers` block before executing: one line per item (accepted, declined, already on) and the sub-command values. `{{cmd:add-qa-setup}}` and `{{cmd:add-wiki}}` read this block from the session and ask nothing it covers.

Only accepted items run. When none is accepted, go to STEP add-setup.record.

---

## STEP add-setup.execute: Run accepted items

Enabling a feature or plugin rewrites the installed command files, so the order is fixed and restricted to the accepted items. Each sub-step runs only when it has an accepted item.

1. **Install the external tools** of the accepted items (gitnexus, ui-ux-pro-max). The per-item yes is the install confirmation, because the batch showed the exact commands. Follow `{{skill:add--dev-environment-setup/SKILL.md}}`: detect, run only non-interactive commands without elevated rights, verify each tool with its trivial check (`gitnexus --version`). A command that needs `sudo` or an interactive installer is shown for the user to run; WAIT, then verify.
2. **One `codeadd modify` call** carrying only the accepted items: `codeadd modify --enable-feature <a,b> --enable-plugin <c,d>`. Add `--disable-feature tdd-pipeline` only when the user turned it off, and `--global` when only the home manifest exists. When `codeadd` is not on the PATH, run `npx --yes codeadd` with the same arguments. Then run `codeadd features list` and `codeadd plugins list` and check they show every accepted item enabled, next to the items that were already on. Any mismatch is a failure.
3. **`gitnexus setup`** when gitnexus is accepted and not yet wired, then **`gitnexus analyze`** from the repo root. If `gitnexus setup` prompts, show it for the user to run, then verify.
4. **Re-read the installed command file from disk** (never a copy read before step 2) and run `{{cmd:add-qa-setup}}` inline, when `qa-setup` is accepted. Inline follows the same-session rule of `{{skill:add--delivery-mode/SKILL.md}}`: the same agent, the same session, read the command and run it from its first step, with the `## Setup answers` block in the session.
5. **MCP checkpoint.** When gitnexus is enabled, check that its MCP server answers in this session (ask it to list the indexed repos). A newly wired server usually loads only in a new session. If it does not answer, STOP after step 4: tell the user to restart the session or reload MCP and run `/add-setup` again, then go to STEP add-setup.record. The second run proposes only the wiki.
6. **Wiki last.** Re-read the installed command file again and run `{{cmd:add-wiki}}` inline, when `wiki` is accepted, so the wiki is generated with the graph slots filled.

---

## STEP add-setup.record: Write the record

Load `{{skill:add--settings/SKILL.md}}` before writing. It owns the file rules and the `setup` schema. This step runs at the end of EVERY run: also when nothing was accepted, when the run stopped at the MCP checkpoint and when it stopped on a failure. The two STOPs that precede any write (no manifest, a `.codeadd/settings.json` that does not parse) skip it.

Read the file (absent = `{ "schema": 1 }`), merge only the `setup` section, and write it back. Never touch another section, and never drop a key you do not know. Set:

- `setup-shape` to `"none"` — this command has no contract.
- `framework-version` to the `version` in the manifest. It is informational and never compared.
- `first-run` once, never rewritten. `last-run` to today.
- `offered.<item>` to one of the values `add--settings` lists for `offered`, for each item decided or run in this run. An item that did not run keeps its previous value. A removed item's key stays.
- Write one `log` entry per decided item: `{ date, item, decision, reason }`, `declined` included. The reason is the user's, or the detected one when the user gave none. A reversed decision on revisit updates `offered.<item>` and appends a NEW entry. An existing entry is never edited. Old reasons are never lost.

Then run this check over the file: it parses, the `setup` section matches the schema, and any `qa` section is unchanged.

**`version-record`.** On yes, list `.codeadd/settings.json` in the report as a file to commit and run no git command. On no, append the line `.codeadd/settings.json` after the `# END ADD` line of `.gitignore` (once). With no managed block, report the `git check-ignore` result and write nothing.

---

## STEP add-setup.close: Close

Load `{{skill:add--final-report/SKILL.md}}` now and report through it. State what was enabled, installed, generated and declined, what the record holds, and what is left for the user. State each failed or undecided item. List `.codeadd/settings.json` as a file to commit when the user said yes to `version-record`.

End on ONE next command:

| Situation | Next command |
|---|---|
| Greenfield | `/add-brainstorm` |
| Stopped at the MCP checkpoint, or on a failure | `/add-setup` |
| Done | `/add-new` (or `/add-brainstorm` when the user has no idea yet) |

---

## Rules

ALWAYS:
- Read every benefit from the ecosystem tables at run time
- Send the whole batch in one message and WAIT once
- Run the accepted items in the order of STEP add-setup.execute
- Write the record at the end of every run

NEVER:
- Run an item the user did not accept
- Re-ask a declined item unless the user names it to revisit
- Overwrite a `.codeadd/settings.json` that does not parse
- Write any section of `.codeadd/settings.json` but `setup`
