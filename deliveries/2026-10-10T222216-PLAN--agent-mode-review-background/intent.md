---
path: fix
topic: agent-mode-review-background
delivery: confirm
ticket: 0044B
---
## Problem
Under agent-mode with `claude -p --json-schema`, /add-review 0035F (OMF, session 654b3de4-f52b-43ce-8ab0-8ac58873aff2) ran the validation gates (Bash run_in_background) and two spec-audit agents (Agent, background). It then ended its turn to wait. Claude Code injected '[structured-output-enforce] You MUST call the StructuredOutput tool', so it emitted status=stopped. The agents and gates finished 2-7 minutes later; the model kept re-emitting stopped, so the reviewers were never dispatched and review-004.md was never written.
Verified 10/10: `-p` itself waits for background subagents. The failure is ending the turn while long background work is pending; with --json-schema, the end of the turn forces the final answer. No command asks for background execution; the model chose it.

QA_CONTRACT_MATCH (Engineer investigation 10/10, overrides the PM's premise in decision 5): the broken was CORRECT, not false. qa-preflight.cjs:315-340 compares `setup-shape:` in docs/qa/qa-setup.md (readSetupShape:197) with the "add-qa-setup" shape in .codeadd/contracts.json (readCurrentShape:210). OMF's receipt (commit d799509) still had `setup-shape: sha256:d599ad3ab3c9f345`, `framework-version: 1.2.4`; the installed shape was `sha256:2326519b34fdd1fe` (same in v1.4.0, v1.5.0, v1.5.1). The shape changed between 1.2.x and 1.4.0 and OMF had not re-run setup since. After /add-qa-setup, OMF now reports QA_CONTRACT_MATCH=ok. The real gap is the message: `broken` does not say why or since which version.
## Decided
1. One rule in `framwork/.codeadd/skills/add--subagent-driven-development/references/dispatch-rules.md`, which every dispatching command already reads. It applies to all commands and both modes: dispatch agents in the foreground; parallel agents go out as several calls in ONE message; long shell commands (gates, builds, tests) run in the foreground with an adequate timeout; never end the turn or emit the result while any agent or command is pending.
2. One line in `add--agent-interaction` reinforcing this for agent-mode: the result is emitted only after all work finished, and ending a turn to wait is forbidden, because --json-schema turns it into the final answer.
3. No per-command edits unless a command text actually suggests background or waiting; check add-review, add-build, add-plan, add-audit and fix only those.
4. Test: a build/lint check that dispatch-rules.md carries the rule and that no product command or skill instructs run_in_background. Live proof (manual, after merge/release): re-run `/add-review 0035F` headless with --json-schema in OMF and confirm review-NNN.md is written and status is not stopped.
5. QA_CONTRACT_MATCH: keep the automatic shape fingerprint (no manual version number). Do NOT change the comparison: broken on a real shape change is correct. Improve only the signal: when broken, the preflight prints the receipt shape, the shipped shape and the action (run /add-qa-setup).
6. Record the version in which the shipped QA shape last changed (in the install metadata/manifest or next to the shipped shape, whichever is simpler), so the broken warning says: 'the QA setup changed in version X; run /add-qa-setup'.
7. Smallest change possible; no over-engineering; build and tests pass.
## Open
None