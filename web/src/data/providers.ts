// The six providers the installer supports, in display order. One source for the
// home "Runs everywhere" tiles, the docs "What gets installed" tree and the docs
// Providers table. `key`, `dir` and `agentsDir` mirror framwork/provider-map.json
// -> providers (the `framwork/` prefix stripped); scripts/tests/web-site.test.cjs
// fails when they drift. `name` is the authored display name.
// One entry per line: the test reads this file with a line-based pattern.

export interface Provider {
  key: string;
  name: string;
  dir: string;
  agentsDir?: string;
  /** What the provider's commands are installed as. */
  format: "commands/" | "skills/";
}

export const providers: Provider[] = [
  { key: "claude", name: "Claude Code", dir: ".claude/", format: "commands/" },
  { key: "codex", name: "Codex (OpenAI)", dir: ".agents/", agentsDir: ".codex/", format: "skills/" },
  { key: "cursor", name: "Cursor", dir: ".cursor/", format: "commands/" },
  { key: "antigrav", name: "Google Antigravity", dir: ".agent/", format: "skills/" },
  { key: "opencode", name: "OpenCode", dir: ".opencode/", format: "commands/" },
  { key: "zcode", name: "ZCode (Z.ai)", dir: ".agents/", agentsDir: ".zcode/", format: "skills/" },
];

/** Directories the installer writes, one row each, with the providers that share it. */
export function installDirs(): { dir: string; labels: string[] }[] {
  const rows = new Map<string, string[]>();
  for (const p of providers) {
    rows.set(p.dir, [...(rows.get(p.dir) ?? []), p.name]);
    if (p.agentsDir) rows.set(p.agentsDir, [...(rows.get(p.agentsDir) ?? []), `${p.name} agents`]);
  }
  return [...rows].map(([dir, labels]) => ({ dir, labels }));
}
