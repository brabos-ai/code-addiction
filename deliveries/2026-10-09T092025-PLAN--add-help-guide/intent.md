---
path: bounded
topic: add-help-guide
doc: none
delivery: confirm
ticket: 0012B
---

## Decided
- Objective: `/add--help` answers, read from the real sources, which command to use and in what order; what each feature and plugin is, whether it is on in this project and how to turn it on; how to run the framework from a bot; and the CLI lifecycle — none of which `/add` covers today beyond flows.
- Rename `framwork/.codeadd/commands/add.md` to `add--help.md`, provider-map key `add` to `add--help`; layer [product]. No `/add` alias — the installer's `pruneObsolete` already removes the old file; the rename goes in the release note.
- Rename the internal STEP IDs `add.*` to `add--help.*` to match the command name — nothing injects into this command (graph: 0 dependants), so no marker breaks.
- Type A (commands) also reads `add--ecosystem` → `Main Flows` and `Command Next-Steps Routing` for "which command, in what order". No new type for flow questions.
- New Type G — features and plugins: what each is from `add--ecosystem` → `Features` / `Plugins`; whether it is on from `.codeadd/manifest.json` → `features` / `plugins` (read-only, no npx); how to turn it on is `codeadd features enable <name>` / `codeadd plugins enable <name>`. The plugin install steps are NOT copied — `plugins enable` already checks the tool and prints `installHint` / `postEnableHint` from `cli/src/plugins.json`.
- New Type H — bot / agent mode: read `.codeadd/agent-mode/README.md` at answer time and answer from it, never summarise it into the help (same pattern `add-wiki` already uses).
- New Type I — CLI lifecycle (install, update, uninstall, modify, providers add/remove, features, plugins, doctor, validate, migrate): the source is the CLI's own help, `npx codeadd --help`, which prints `USAGE` from `cli/src/cli.js` — the one existing list of CLI commands. The help runs it and answers from it; if it cannot run (no npx, offline), it says so and tells the user to run it. Chosen over copying `USAGE` into `add--ecosystem`, which would drift.
- What to run after `codeadd update`: no existing source states it. Add it ONCE as a row in `add--ecosystem` → `Command Next-Steps Routing` (After `codeadd update`, `.codeadd/wiki/` exists → `/add-wiki update`); Type I reads that table, so the fact lives where the help already reads routing.
- `/add--help` with no question: a short overview — what the framework is in two lines, the `Main Flows` table, and the list of topics one can ask (flows, features, plugins, bot, CLI, environment).
- `add--ecosystem` changes only for the rename plus the one routing row: its `description` ("Loaded by /add"), the `add` row in `Commands`, the router-exemption line naming `add`, and the `mention: /add`. The `Features` / `Plugins` tables already answer "what is GitNexus".
- The rename sweep includes `cli/src/installer.js:364` (install outro prints "run: /add") and the example comment in `cli/src/release-copy.js:30`, plus README and the web docs `add-framework--sync` regenerates.
- Proof: `npm run build` emits `add--help` and no command named `add`; a grep finds no bare `/add` in `framwork/.codeadd/`, `cli/src/`, README and web docs; one small test in `cli/tests` checks that `add--help.md` names its sources — `manifest.json`, `agent-mode/README.md`, `codeadd --help`, and the `add--ecosystem` sections it reads.
- Ticket done-when gains two answers beyond QA and GitNexus: "how do I run this from a bot" and "what do I run after `codeadd update`".

## Open
None
