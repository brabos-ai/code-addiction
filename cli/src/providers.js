/**
 * Map of AI provider keys to their source (inside zip) and destination paths.
 * Source is relative to the extracted zip root (e.g. framwork/.claude).
 * Destination is relative to the user's project root (cwd).
 * commandsSubdir is the subdirectory within dest that holds command/workflow files
 * eligible for feature injection (null means feature injection not supported).
 */
export const PROVIDERS = {
  // ── Priority providers (have full framework content) ────────────────────
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
    label: 'Antigravity (Google)',
    hint: '.agents/skills/',
    src: 'framwork/.agents',
    dest: '.agents',
    commandsSubdir: null,
  },
  opencode: {
    label: 'OpenCode',
    hint: '.opencode/commands/',
    src: 'framwork/.opencode',
    dest: '.opencode',
    commandsSubdir: 'commands',
  },
  // ── Additional providers (alphabetical) ─────────────────────────────────
  auggie: {
    label: 'Auggie (Augment Code)',
    hint: '.augment/commands/',
    src: 'framwork/.augment',
    dest: '.augment',
    commandsSubdir: 'commands',
  },
  bob: {
    label: 'Bob (IBM)',
    hint: '.bob/commands/',
    src: 'framwork/.bob',
    dest: '.bob',
    commandsSubdir: 'commands',
  },
  copilot: {
    label: 'GitHub Copilot',
    hint: '.github/agents/',
    src: 'framwork/.github',
    dest: '.github',
    commandsSubdir: 'agents',
  },
  cursor: {
    label: 'Cursor',
    hint: '.cursor/commands/',
    src: 'framwork/.cursor',
    dest: '.cursor',
    commandsSubdir: 'commands',
  },
  gemini: {
    label: 'Gemini CLI',
    hint: '.gemini/commands/',
    src: 'framwork/.gemini',
    dest: '.gemini',
    commandsSubdir: 'commands',
  },
  kiro: {
    label: 'Kiro CLI',
    hint: '.kiro/prompts/',
    src: 'framwork/.kiro',
    dest: '.kiro',
    commandsSubdir: 'prompts',
  },
  kilocode: {
    label: 'KiloCode',
    hint: '.kilocode/workflows/',
    src: 'framwork/.kilocode',
    dest: '.kilocode',
    commandsSubdir: 'workflows',
  },
  qwen: {
    label: 'Qwen Code',
    hint: '.qwen/commands/',
    src: 'framwork/.qwen',
    dest: '.qwen',
    commandsSubdir: 'commands',
  },
  roo: {
    label: 'Roo Code',
    hint: '.roo/commands/',
    src: 'framwork/.roo',
    dest: '.roo',
    commandsSubdir: 'commands',
  },
  shai: {
    label: 'SHAI (OVH)',
    hint: '.shai/commands/',
    src: 'framwork/.shai',
    dest: '.shai',
    commandsSubdir: 'commands',
  },
  windsurf: {
    label: 'Windsurf',
    hint: '.windsurf/workflows/',
    src: 'framwork/.windsurf',
    dest: '.windsurf',
    commandsSubdir: 'workflows',
  },
};

/**
 * Priority-ordered provider keys shown first in the install prompt.
 * Remaining providers are sorted alphabetically after these.
 */
export const PROVIDER_PRIORITY = ['claude', 'codex', 'antigrav', 'opencode'];

/**
 * Resolve selected provider keys to { src, dest, commandsSubdir, ... } pairs.
 * @param {string[]} keys
 * @returns {{ key: string, label: string, src: string, dest: string, commandsSubdir: string | null }[]}
 */
export function resolveSelected(keys) {
  return keys.map((key) => ({ key, ...PROVIDERS[key] }));
}
