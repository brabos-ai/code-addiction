import fs from 'node:fs';
import path from 'node:path';

/**
 * Write the MCP registration for the knowledge-graph server into each selected
 * provider's configuration.
 *
 * Its own module because TWO callers need it: `install` introduces it and
 * `update` calls the same writer. Registration only in `install` would leave
 * every existing project with the migration applied and no server configured,
 * and a second copy in the updater is how the two come to disagree about a
 * shape they both write.
 *
 * ⛔ NOTHING IS INSTALLED INTO THE USER'S TREE BY THIS.
 * The server runs from the npm package through `npx`, so a project gets a
 * config entry and no source file. Source `.js` in their tree enters ESLint,
 * Prettier, tsconfig, coverage and bundlers; a config entry enters none of them.
 */

/** The server key, in every provider's config. */
export const SERVER_NAME = 'codeadd-docs';

/**
 * Where each provider keeps its MCP configuration, and in what shape.
 *
 * `format` is what decides whether this writes at all:
 *
 * | format       | Written | Why |
 * |--------------|---------|-----|
 * | `mcpServers` | yes | the common object: `{ mcpServers: { <name>: {command, args} } }` |
 * | `opencode`   | yes | JSON, different shape: `{ mcp: { <name>: {type, command[], enabled} } }` |
 * | `toml`       | **no, printed** | writing TOML by hand into a config the user already edited is the same shortcut that mangles a multi-line YAML value, and this runs unattended |
 *
 * A provider absent from this table is printed too. Printing the exact line is
 * the `postEnableHint` floor both plugins already use — it is the degraded
 * path, never the default.
 */
export const MCP_CONFIG = {
  claude: { file: '.mcp.json', format: 'mcpServers' },
  cursor: { file: '.cursor/mcp.json', format: 'mcpServers' },
  antigrav: { file: '.agent/mcp_config.json', format: 'mcpServers' },
  opencode: { file: 'opencode.json', format: 'opencode' },
  codex: { file: '.codex/config.toml', format: 'toml' },
};

/**
 * The registration, in the standard form.
 * @param {string} version  the installed package version, pinned
 * @param {string} corpus
 */
export function registrationFor(version, corpus = 'docs') {
  return { command: 'npx', args: ['-y', `codeadd@${version}`, 'mcp', `--corpus=${corpus}`] };
}

/** The same thing as a line a user can paste, for the degraded path. */
export function registrationLine(version, corpus = 'docs') {
  return JSON.stringify({ [SERVER_NAME]: registrationFor(version, corpus) });
}

function readJson(file) {
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // A config the user broke, or one this cannot read, is NOT overwritten.
    // Returning {} here and writing would delete every server they configured.
    return null;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/**
 * Register the server for one provider.
 *
 * IDEMPOTENT, AND IT REWRITES THE PIN. Three requirements with three distinct
 * failure modes: an entry written twice duplicates on every update; a pin of
 * `codeadd@1.0.0` never rewritten leaves the server on 1.0.0 after the user
 * moves to 1.1.0; and no registration at all leaves a migrated project
 * unserved.
 *
 * @returns {{provider: string, status: 'written'|'current'|'print'|'unreadable', file: string|null, line: string|null}}
 */
export function registerProvider(cwd, providerKey, version, corpus = 'docs') {
  const config = MCP_CONFIG[providerKey];
  const line = registrationLine(version, corpus);

  if (!config || config.format === 'toml') {
    return { provider: providerKey, status: 'print', file: config?.file ?? null, line };
  }

  const file = path.join(cwd, config.file);
  const current = readJson(file);
  if (current === null) {
    return { provider: providerKey, status: 'unreadable', file: config.file, line };
  }

  const entry = registrationFor(version, corpus);

  if (config.format === 'mcpServers') {
    const servers = { ...(current.mcpServers ?? {}) };
    if (JSON.stringify(servers[SERVER_NAME]) === JSON.stringify(entry)) {
      return { provider: providerKey, status: 'current', file: config.file, line };
    }
    servers[SERVER_NAME] = entry;
    writeJson(file, { ...current, mcpServers: servers });
    return { provider: providerKey, status: 'written', file: config.file, line };
  }

  // opencode: same information, its own shape.
  const opencodeEntry = {
    type: 'local',
    command: [entry.command, ...entry.args],
    enabled: true,
  };
  const servers = { ...(current.mcp ?? {}) };
  if (JSON.stringify(servers[SERVER_NAME]) === JSON.stringify(opencodeEntry)) {
    return { provider: providerKey, status: 'current', file: config.file, line };
  }
  servers[SERVER_NAME] = opencodeEntry;
  writeJson(file, { ...current, mcp: servers });
  return { provider: providerKey, status: 'written', file: config.file, line };
}

/**
 * Register for every selected provider.
 *
 * NEVER THROWS. A provider whose config cannot be written degrades to a printed
 * line and the rest still register — an install must not fail because one
 * config file is in a shape this does not write.
 *
 * @param {string} cwd
 * @param {{key: string}[]} providers  resolveSelected() entries
 * @param {string} version
 * @returns {{results: object[], written: number, printed: number}}
 */
export function writeMcpRegistration(cwd, providers, version, corpus = 'docs') {
  const results = [];
  for (const provider of providers) {
    try {
      results.push(registerProvider(cwd, provider.key, version, corpus));
    } catch (err) {
      results.push({
        provider: provider.key,
        status: 'print',
        file: MCP_CONFIG[provider.key]?.file ?? null,
        line: registrationLine(version, corpus),
        error: err.message,
      });
    }
  }
  return {
    results,
    written: results.filter((r) => r.status === 'written').length,
    printed: results.filter((r) => r.status === 'print' || r.status === 'unreadable').length,
  };
}
