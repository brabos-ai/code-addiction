<!-- uses:
- skill: add--agent-interaction
- command: /add-review
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:install-confirm -->

For each missing or non-functional prerequisite, show the EXACT command and explain what it does — all of them together, as one numbered batch with a RECOMMENDED line each — and end the turn there. Run nothing before the answer, and after it run each confirmed command one at a time. After each install, **functionally verify** it (re-run the STEP add-qa-setup.diagnose trivial invocation) — a successful install is one whose invocation now works, not one that merely completed.
<!-- /section:install-confirm -->

<!-- section:config-values -->

If it exists → per-key merge: keep every existing key (including extras the user added). Fill missing declared keys with defaults. Never drop a user key. Put every value that needs a refresh in one numbered batch with a RECOMMENDED line each; do not silently overwrite a user-edited value with the default. If absent → create it, asking for every project-specific value in one numbered batch (do NOT guess base URL or auth/seed flow).

<!-- /section:config-values -->

<!-- section:offer -->

**Item 8 above is a real next activity whenever the audit can run.** Where it cannot — no feature
yet, no `screens.json`, an unavailable MCP server — the remaining steps are the user's own manual
work and there is nothing to continue into.

| State | Next activity |
|---|---|
| Feature exists and the audit can run | `/add-review` on the feature, scoped to the SFxx subfeature when one exists — its QA sections validate the rendered result (UX + functional) |
| No feature or no `screens.json` yet | none — build the feature first |
| Migration branch awaiting review | none — that is a human review of an open PR |

Finish the ordered hand-off list, then its metadata, then end on the next command as the last line, on
the first row only. Offer no continuation and ask no yes/no question: the bot starts the next session
from that line by itself.

<!-- /section:offer -->
