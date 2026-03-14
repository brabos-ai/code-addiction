/**
 * Map of AI provider keys to their source (inside zip) and destination paths.
 * Source is relative to the extracted zip root (e.g. framwork/.claude).
 * Destination is relative to the user's project root (cwd).
 * commandsSubdir is the subdirectory within dest that holds command/workflow files
 * eligible for feature injection (null means feature injection not supported).
 */
export const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    hint: '.claude/commands/',
    src: 'framwork/.claude',
    dest: '.claude',
    commandsSubdir: 'commands',
  },
  codex: {
    label: 'Codex (OpenAI)',
    hint: '.agent/workflows/ + .agent/skills/',
    src: 'framwork/.agent',
    dest: '.agent',
    commandsSubdir: 'workflows',
  },
  antigrav: {
    label: 'Google Antigravity',
    hint: '.agents/skills/',
    src: 'framwork/.agents',
    dest: '.agents',
    commandsSubdir: null,
  },
  kilocode: {
    label: 'KiloCode',
    hint: '.kilocode/workflows/',
    src: 'framwork/.kilocode',
    dest: '.kilocode',
    commandsSubdir: 'workflows',
  },
  opencode: {
    label: 'OpenCode',
    hint: '.opencode/commands/',
    src: 'framwork/.opencode',
    dest: '.opencode',
    commandsSubdir: 'commands',
  },
};

/**
 * Resolve selected provider keys to { src, dest, commandsSubdir, ... } pairs.
 * @param {string[]} keys
 * @returns {{ key: string, label: string, src: string, dest: string, commandsSubdir: string | null }[]}
 */
export function resolveSelected(keys) {
  return keys.map((key) => ({ key, ...PROVIDERS[key] }));
}
