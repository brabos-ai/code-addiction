/**
 * Map of AI provider keys to their source (inside zip) and destination paths.
 * Source is relative to the extracted zip root (e.g. framwork/.claude).
 * Destination is relative to the user's project root (cwd).
 * commandsSubdir is the subdirectory within dest that holds command/workflow files
 * eligible for feature injection (null means feature injection not supported).
 * skillsSubdir is the subdirectory within dest that holds skill files
 * (used by plugin-bound skill activation).
 */
export const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    hint: '.claude/commands/',
    src: 'framwork/.claude',
    dest: '.claude',
    commandsSubdir: 'commands',
    skillsSubdir: 'skills',
  },
  codex: {
    label: 'Codex (OpenAI)',
    hint: '.agents/skills/',
    src: 'framwork/.agents',
    dest: '.agents',
    commandsSubdir: null,
    skillsSubdir: 'skills',
  },
  cursor: {
    label: 'Cursor',
    hint: '.cursor/commands/',
    src: 'framwork/.cursor',
    dest: '.cursor',
    commandsSubdir: 'commands',
    skillsSubdir: 'skills',
  },
  antigrav: {
    label: 'Antigravity (Google)',
    hint: '.agent/skills/',
    src: 'framwork/.agent',
    dest: '.agent',
    commandsSubdir: null,
    skillsSubdir: 'skills',
  },
};

/**
 * Priority-ordered provider keys shown first in the install prompt.
 * Remaining providers are sorted alphabetically after these.
 */
export const PROVIDER_PRIORITY = ['claude', 'codex', 'cursor', 'antigrav'];

/**
 * Resolve selected provider keys to { src, dest, commandsSubdir, ... } pairs.
 * @param {string[]} keys
 * @returns {{ key: string, label: string, src: string, dest: string, commandsSubdir: string | null, skillsSubdir: string | null }[]}
 */
export function resolveSelected(keys) {
  return keys.map((key) => ({ key, ...PROVIDERS[key] }));
}
