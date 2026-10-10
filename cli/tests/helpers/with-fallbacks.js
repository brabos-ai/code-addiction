import fs from 'node:fs';
import path from 'node:path';

const CODEADD = path.resolve(import.meta.dirname, '..', '..', '..', 'framwork', '.codeadd');
const SLOT = /<!-- slot:agent-mode\.[^\s]+ fallback="(fallbacks\/agent-mode\.[A-Za-z0-9._-]+\.md)" -->[\s\S]*?<!-- \/slot:agent-mode\.[^\s]+ -->/g;

/**
 * A command's text as the user reads it with agent-mode OFF: the source, with
 * every agent-mode slot replaced IN PLACE by its fallback.
 *
 * The human-only passages of a command moved out of its source and into
 * fallbacks/agent-mode.<command>.<subject>.md (plan
 * 2026-10-09T184411-PLAN--agent-mode-feature). A suite that pins what a command
 * SAYS, or the order in which it says it, must read the text the installer
 * renders, not the source with its slots empty. The substitution is in place so
 * a test that slices a step out of the command still finds the moved text
 * inside that step.
 * @param {string} text  the command source
 * @returns {string}
 */
export function withFallbacks(text) {
  return text.replace(SLOT, (_, rel) => fs.readFileSync(path.join(CODEADD, rel), 'utf8').replace(/\n$/, ''));
}
