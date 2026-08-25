<!-- section:drive -->

**Driving is via Playwright MCP — no test-runner code.** With the plugin on, the `@qa-agent` half of the dual judge additionally drives the live app at `baseUrl` through the Playwright MCP server (`@playwright/mcp`): `browser_navigate` to each route, `browser_resize` to project each viewport (1440 / 768 / 375), `browser_take_screenshot` (full page, settled) for extra evidence, and `browser_click` / `browser_type` / `browser_fill_form` / `browser_select_option` to exercise the functional checklist. Functional diagnostics come from `browser_console_messages` and `browser_network_requests`. Pass it the `baseUrl` + `authSeed` from `config.json` so it can reach `auth:true` screens. `@ux-agent` (review) does not drive — it judges from the persisted screenshots. If the MCP server is not connected, the agent cannot drive — re-check the STEP 8 preflight rather than letting it fall back to guessing.

<!-- /section:drive -->
