import fs from 'node:fs';
import path from 'node:path';

/**
 * The agent-mode feature's injection points, counted from its fragment files.
 *
 * Several suites freeze the absolute injection-point total of the features that
 * existed before agent-mode (71). agent-mode adds one point per fragment
 * section, and its slots land one command at a time (plan
 * 2026-10-09T184411-PLAN--agent-mode-feature, F10-F21), so those suites assert
 * `BASELINE_POINTS + agentModePoints()` instead of a number that would move
 * twelve times. A fragment with a section the sidecar lacks, or a sidecar
 * point with no section, still fails them.
 */
export const BASELINE_POINTS = 71;

const FRAGMENTS = path.resolve(import.meta.dirname, '..', '..', '..', 'framwork', '.codeadd', 'fragments', 'agent-mode');

export function agentModePoints() {
  if (!fs.existsSync(FRAGMENTS)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(FRAGMENTS)) {
    if (!f.endsWith('.md')) continue;
    n += (fs.readFileSync(path.join(FRAGMENTS, f), 'utf8').match(/<!-- section:[^\s]+ -->/g) || []).length;
  }
  return n;
}

export const TOTAL_POINTS = () => BASELINE_POINTS + agentModePoints();

/** Fragment files under fragments/agent-mode/ -- one artefact-graph node each. */
export function agentModeFragments() {
  if (!fs.existsSync(FRAGMENTS)) return 0;
  return fs.readdirSync(FRAGMENTS).filter((f) => f.endsWith('.md')).length;
}
