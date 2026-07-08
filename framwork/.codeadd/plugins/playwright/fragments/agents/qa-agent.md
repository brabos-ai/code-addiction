<!-- section:drive -->

**Playwright MCP tool playbook.** Drive the live app at `baseUrl` with these exact MCP tools:

| Need | Tool | Notes |
|---|---|---|
| Go to a route | `browser_navigate` | Prefix the screen `path` with `baseUrl`. Use `browser_navigate_back` to retrace. |
| Project a viewport | `browser_resize` | Set width×height per viewport (desktop 1440×900, tablet 768×1024, mobile 375×812) BEFORE capturing. |
| Capture evidence | `browser_take_screenshot` | Full page, after the view settles (`browser_wait_for`). Name files `<screen>.<viewport>.png`. |
| Inspect structure | `browser_snapshot` | Accessibility tree — use to locate elements before interacting. |
| Exercise a flow | `browser_click` · `browser_type` · `browser_fill_form` · `browser_select_option` · `browser_press_key` | Drive each functional-checklist item end-to-end; screenshot the resulting state. |
| Console diagnostics | `browser_console_messages` | Collect errors/warnings/page errors throughout the run. |
| Network diagnostics | `browser_network_requests` | Collect failed requests + 4xx–5xx. |

Settle before judging (`browser_wait_for`) so you screenshot the final rendered state, not a loading frame. For `auth:true` screens, establish the session per the `authSeed` hint first. Prefer non-destructive interactions; note any state you mutate. If a tool surface differs from the above, fall back to the closest available `browser_*` tool and note the substitution — do not abort the axis.

In live mode this is **purely additive** over read-PNG judgment: beyond the scripted PNG set the run persisted, you may additionally capture unscripted states and read console/network interactively for richer evidence. The read-PNG axes (UX / functional / responsiveness / a11y) still stand on the persisted screenshots + axe/assertion artifacts.

<!-- /section:drive -->
