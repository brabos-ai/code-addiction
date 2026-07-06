<!-- section:drive -->

**Driving is via Playwright MCP — no test-runner code.** The dispatched `qa-agent`s drive the live app at `baseUrl` through the Playwright MCP server (`@playwright/mcp`): `browser_navigate` to each route, `browser_resize` to project each viewport (1440 / 768 / 375), `browser_take_screenshot` (full page, settled) for the UX axis, and `browser_click` / `browser_type` / `browser_fill_form` / `browser_select_option` to exercise the functional checklist. Functional diagnostics come from `browser_console_messages` and `browser_network_requests`. Pass each agent the `baseUrl` + `authSeed` from `config.json` so it can reach `auth:true` screens. If the MCP server is not connected, the agents cannot drive — re-check STEP 1 rather than letting them fall back to guessing.

<!-- /section:drive -->
