<!-- uses:
- skill: add--agent-interaction
- skill: add--delivery-mode
- command: /add-build
-->

<!-- section:interaction -->

**LOAD `{{skill:add--agent-interaction/SKILL.md}}`.** It owns how this command asks a bot, what each kind of stop does, and how the closing ends.

<!-- /section:interaction -->

<!-- section:stop-kinds -->

**Stop kind** follows `{{skill:add--delivery-mode/SKILL.md}}`: a **deciding** stop waits on every
delivery mode and sends its questions as one numbered batch; a **confirming** stop never waits — it
prints what it would have shown and continues, on `confirm` and on `automatic` alike. Every gate above
that stops is deciding — each presents a failure or a choice no approval covered.

<!-- /section:stop-kinds -->

<!-- section:preview-wait -->

**Stop kind — confirming.** The preview reports a plan the brainstorm's approval already covered. Print
it in full on every delivery mode and continue; a correction arrives with the next call. **On an
automatic delivery it is the one moment the user can see what is being decided without them** — which
is why it prints in full.
<!-- /section:preview-wait -->

<!-- section:closing-route -->

**Stop kind — confirming.** The report describes a plan the brainstorm's approval already covered.

| `DELIVERY` | Do |
|---|---|
| `confirm` | Print the report, then the next command — `/add-build` with this feature's id — as the last line, and stop. No continuation offer |
| `automatic` | Print the report and the line `(delivering automatically — continuing to /add-build.)`, then follow {{cmd:add-build}} with this feature's id, from its first step, as `add--delivery-mode` describes |

<!-- /section:closing-route -->

<!-- section:offer -->

**On `confirm`, finish the report and its metadata, and end on the next command as the last line.** Ask no
yes/no question and offer no continuation: the bot starts the next session from that line by itself.
This step supplies only the next activity and its documents. A plan that was not written — the light
path, a blocked review — names no next command.

<!-- /section:offer -->
