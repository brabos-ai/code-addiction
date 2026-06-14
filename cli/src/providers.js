/**
 * Map of AI provider keys to their source (inside zip) and destination paths.
 * Source is relative to the extracted zip root (e.g. framwork/.claude).
 * Destination is relative to the user's project root (cwd).
 * commandsSubdir is the subdirectory within dest that holds command/workflow files
 * eligible for feature injection (null means feature injection not supported).
 * skillsSubdir is the subdirectory within dest that holds skill files
 * (used by plugin-bound skill activation).
 * agentsSubdir is the subdirectory within dest that holds agent definition files
 * eligible for plugin agent-injection (null means the provider has no agents).
 */
export const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    hint: '.claude/commands/',
    src: 'framwork/.claude',
    dest: '.claude',
    commandsSubdir: 'commands',
    skillsSubdir: 'skills',
    agentsSubdir: 'agents',
  },
  codex: {
    label: 'Codex (OpenAI)',
    hint: '.agents/skills/',
    src: 'framwork/.agents',
    dest: '.agents',
    commandsSubdir: null,
    skillsSubdir: 'skills',
    agentsSubdir: null,
  },
  cursor: {
    label: 'Cursor',
    hint: '.cursor/commands/',
    src: 'framwork/.cursor',
    dest: '.cursor',
    commandsSubdir: 'commands',
    skillsSubdir: 'skills',
    agentsSubdir: null,
  },
  antigrav: {
    label: 'Antigravity (Google)',
    hint: '.agent/skills/',
    src: 'framwork/.agent',
    dest: '.agent',
    commandsSubdir: null,
    skillsSubdir: 'skills',
    agentsSubdir: null,
  },
  opencode: {
    label: 'OpenCode',
    hint: '.opencode/commands/',
    src: 'framwork/.opencode',
    dest: '.opencode',
    commandsSubdir: 'commands',
    skillsSubdir: 'skills',
    agentsSubdir: null,
  },
};

/**
 * Priority-ordered provider keys shown first in the install prompt.
 * Remaining providers are sorted alphabetically after these.
 */
export const PROVIDER_PRIORITY = ['claude', 'codex', 'cursor', 'antigrav', 'opencode'];

/**
 * Resolve selected provider keys to { src, dest, commandsSubdir, ... } pairs.
 * Keys not present in PROVIDERS are skipped — an install made before a provider
 * was removed may still list it in its manifest; emitting an entry with an
 * undefined `dest`/`src` would crash path.join during install/update.
 * @param {string[]} keys
 * @returns {{ key: string, label: string, src: string, dest: string, commandsSubdir: string | null, skillsSubdir: string | null, agentsSubdir: string | null }[]}
 */
export function resolveSelected(keys) {
  return keys.filter((key) => PROVIDERS[key]).map((key) => ({ key, ...PROVIDERS[key] }));
}
