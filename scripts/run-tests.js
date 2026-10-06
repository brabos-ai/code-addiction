#!/usr/bin/env node
/**
 * Canonical repository test dispatcher. All local hosts use Linux Docker, never native fallback.
 * Usage: node scripts/run-tests.js <framework|cli|vitest|scripts|bats|package|board|board-e2e|all> [--watch|--coverage] [tool arguments...]
 * Framework selects CLI + scripts + package smoke; all adds board typecheck/unit + built Chromium E2E.
 * Only individual suites accept filters. Watch/coverage are CLI-only and preserve CLI-local scope.
 * Authorized workers require strict Linux context predicates in test-context.cjs; CI=true/copy/native flags alone never authorize them.
 * Docker source is copied into an isolated filesystem, dependencies/browser come from the hashed image,
 * Git metadata is read-only/worktree-remapped. Watch sync excludes generated/dependency state and stops on manifest changes.
 * Reports export to .test-artifacts/<suite>/<run-id>/, including failures. No build/generated sources are copied back.
 * Exit: suite's first nonzero status; 2 for refusal/preparation/export unavailability, 130 for cancellation.
 * Missing Docker means no tests ran. Ordinary builds and development servers are unrestricted.
 */
const path = require('node:path');
const context = require('./test-context.cjs');
const worker = require('./test-worker.cjs');
function parseArgs(argv) {
  const [value, ...args] = argv; const suite = context.canonicalSuite(value);
  context.leavesFor(suite);
  let mode = 'run';
  if (args[0] === '--watch' || args[0] === '--coverage') mode = args.shift().slice(2);
  worker.validateRequest({ selection: suite, extra: args, mode });
  return { suite, mode, extra: args };
}
async function main() {
  try {
    const { suite, mode, extra } = parseArgs(process.argv.slice(2));
    // Explicit context must match this outer request, not merely some inherited selection.
    const env = process.env;
    const result = context.resolveRunner({ platform: process.platform, env });
    const root = path.resolve(__dirname, '..');
    console.log(`tests runner: ${suite} (${mode}) on ${result.runner} — ${result.reason}`);
    process.exitCode = result.runner === 'worker' ? await worker.runSelection({ selection: suite, mode, extra, root }) : await require('./test-transport.cjs').runDocker({ root, selection: suite, mode, extra });
  } catch (error) { console.error(`REFUSED/UNAVAILABLE: ${error.message}`); process.exitCode = 2; }
}
module.exports = { parseArgs, canonicalSuite: context.canonicalSuite, resolveRunner: context.resolveRunner, combineExitCodes: codes => codes.find(code => code !== 0) ?? 0, exitCodeFrom: result => result.status ?? 1 };
if (require.main === module) main();
