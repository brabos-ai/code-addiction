/** Repository test execution policy. This module is not shipped in CLI runtime. */
const fs = require('node:fs');
const RECEIPT = '/run/codeadd-tests/context.json';
const GROUPS = { framework: ['cli', 'scripts', 'package'], all: ['cli', 'scripts', 'package', 'board', 'board-e2e'] };
const LEAVES = GROUPS.all;
function canonicalSuite(value) { return ({ vitest: 'cli', bats: 'scripts' })[value] || value; }
function leavesFor(selection) {
  const canonical = canonicalSuite(selection);
  if (GROUPS[canonical]) return [...GROUPS[canonical]];
  if (LEAVES.includes(canonical)) return [canonical];
  throw new Error(`Unknown test selection: ${selection}`);
}
function readReceipt() { try { return JSON.parse(fs.readFileSync(RECEIPT, 'utf8')); } catch { return null; } }
function refusal({ platform = process.platform, env = process.env, selection = env.CODEADD_TESTS_SELECTION, leaf, receipt } = {}) {
  if (platform !== 'linux') return 'Authorized test workers require Linux';
  if (env.CODEADD_TESTS_RUNNER === 'native') return 'Local native override is prohibited; use the public npm test commands';
  let leaves;
  try { leaves = leavesFor(selection); } catch (error) { return error.message; }
  if (env.CODEADD_TESTS_CONTEXT === 'github-actions') {
    if (env.GITHUB_ACTIONS !== 'true' || env.CI !== 'true') return 'github-actions requires GITHUB_ACTIONS=true and CI=true';
  } else if (env.CODEADD_TESTS_CONTEXT === 'container') {
    const record = receipt === undefined ? readReceipt() : receipt;
    if (!record || record.v !== 1 || record.context !== 'container') return 'Missing or incomplete container context receipt';
    if (record.selection !== canonicalSuite(selection)) return 'Receipt selection does not match worker request';
    if (env.CODEADD_TESTS_SELECTION !== record.selection) return 'Propagated selection does not match receipt';
    if (JSON.stringify(record.leaves) !== JSON.stringify(leaves)) return 'Receipt leaves do not match deterministic selection';
  } else return `Unauthorized test context: ${env.CODEADD_TESTS_CONTEXT || 'absent'}; use the public npm test commands`;
  if (leaf && (!leaves.includes(leaf) || env.CODEADD_TESTS_LEAF !== leaf)) return 'Active leaf does not match authorized selection/tool';
  return null;
}
function authorize(options) { const why = refusal(options); if (why) throw new Error(`REFUSED: ${why}`); }
function resolveRunner({ platform = process.platform, env = process.env } = {}) {
  if (env.CODEADD_TESTS_RUNNER && env.CODEADD_TESTS_RUNNER !== 'docker') throw new Error(`CODEADD_TESTS_RUNNER=${env.CODEADD_TESTS_RUNNER} is prohibited; local native execution is unavailable`);
  if (env.CODEADD_TESTS_CONTEXT) {
    const why = refusal({ platform, env });
    if (why) throw new Error(why);
    return { runner: 'worker', reason: `authorized ${env.CODEADD_TESTS_CONTEXT}` };
  }
  return { runner: 'docker', reason: 'all local platforms run in isolated Linux Docker' };
}
module.exports = { RECEIPT, GROUPS, LEAVES, canonicalSuite, leavesFor, readReceipt, refusal, authorize, resolveRunner };
