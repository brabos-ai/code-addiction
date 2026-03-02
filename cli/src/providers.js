/**
 * Map of AI provider keys to their source (inside zip) and destination paths.
 * Source is relative to the extracted zip root (e.g. fnd-commands-scripts-2.0.1/framwork/).
 * Destination is relative to the user's project root (cwd).
 */
export const PROVIDERS = {
  claude: {
    label: 'Claude Code',
    hint: '.claude/commands/',
    src: 'framwork/.claude',
    dest: '.claude',
  },
  codex: {
    label: 'Codex (OpenAI)',
    hint: '.agent/workflows/',
    src: 'framwork/.agent',
    dest: '.agent',
  },
  antigrav: {
    label: 'Google Antigravity',
    hint: '.agents/skills/',
    src: 'framwork/.agents',
    dest: '.agents',
  },
  kilocode: {
    label: 'KiloCode',
    hint: '.kilocode/workflows/',
    src: 'framwork/.kilocode',
    dest: '.kilocode',
  },
  opencode: {
    label: 'OpenCode',
    hint: '.opencode/commands/',
    src: 'framwork/.opencode',
    dest: '.opencode',
  },
};

/**
 * Resolve selected provider keys to { src, dest } pairs.
 * @param {string[]} keys
 * @returns {{ key: string, label: string, src: string, dest: string }[]}
 */
export function resolveSelected(keys) {
  return keys.map((key) => ({ key, ...PROVIDERS[key] }));
}
