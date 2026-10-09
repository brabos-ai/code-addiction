import fs from 'node:fs';
import path from 'node:path';

const FALLBACKS = path.resolve(import.meta.dirname, '..', '..', '..', 'framwork', '.codeadd');

/**
 * A command's text as the user reads it with agent-mode OFF: the source, plus
 * the bytes of every agent-mode fallback its slots name.
 *
 * The human-only passages of a command moved out of its source and into
 * fallbacks/agent-mode.<command>.<subject>.md (plan
 * 2026-10-09T184411-PLAN--agent-mode-feature). A suite that pins what a command
 * SAYS must read the same text the installer renders, not the source with its
 * slots empty.
 * @param {string} text  the command source
 * @returns {string}
 */
export function withFallbacks(text) {
  const named = [...text.matchAll(/fallback="(fallbacks\/agent-mode\.[A-Za-z0-9._-]+\.md)"/g)].map((m) => m[1]);
  const seen = new Set();
  let out = text;
  for (const rel of named) {
    if (seen.has(rel)) continue;
    seen.add(rel);
    out += `\n${fs.readFileSync(path.join(FALLBACKS, rel), 'utf8')}`;
  }
  return out;
}
