/** Authorized internal workers. Public npm scripts must never invoke tool workers recursively. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const context = require('./test-context.cjs');
function validateRequest({ selection, extra = [], mode = 'run' }) {
  context.leavesFor(selection);
  if (!['run', 'watch', 'coverage'].includes(mode)) throw new Error(`Unknown test mode: ${mode}`);
  if (mode !== 'run' && selection !== 'cli') throw new Error('Watch and coverage are CLI-only');
  if ((context.GROUPS[selection] || selection === 'package') && extra.length) throw new Error('Group/package filters are unsupported; use test:cli, test:scripts, test:board or test:board:e2e with arguments');
  if (extra.includes('--passWithNoTests')) throw new Error('No-test passing overrides are prohibited');
  if (extra.some(arg => /^--(?:test-reporter|reporter|reporters|outputFile|output-file)(?:[=.].*)?$/.test(arg))) throw new Error('Custom test reporters are unsupported: selection evidence requires the configured reporter');
}
function scriptArgs(extra, root) {
  const flags = []; const files = [];
  const valued = new Set(['--require', '-r', '--import', '--test-name-pattern', '--test-skip-pattern', '--test-concurrency', '--test-timeout', '--test-shard', '--test-isolation', '--test-coverage-exclude', '--test-coverage-include']);
  const boolean = new Set(['--experimental-test-coverage', '--test-only', '--test-force-exit', '--no-warnings', '--disable-warning', '--trace-warnings']);
  for (let i = 0; i < extra.length; i++) {
    const arg = extra[i];
    if (!arg.startsWith('-')) { files.push(arg); continue; }
    if (!valued.has(arg.split('=')[0]) && !boolean.has(arg)) throw new Error(`Unsupported Node test option: ${arg}; use a supported option with an explicit value`);
    flags.push(arg);
    if (valued.has(arg)) { if (!extra[i + 1]) throw new Error(`${arg} requires a value`); flags.push(extra[++i]); }
  }
  // Expand ourselves: Node 22.19 does not expand test file globs reliably.
  const targets = files.length ? files : fs.readdirSync(path.join(root, 'scripts/tests')).filter(f => f.endsWith('.test.cjs')).map(f => `scripts/tests/${f}`);
  return ['--test', ...flags, ...targets];
}
function toolSpec({ leaf, root, extra = [], mode = 'run' }) {
  const cwd = leaf === 'cli' || leaf === 'package' ? path.join(root, 'cli') : leaf.startsWith('board') ? path.join(root, 'board') : root;
  const args = leaf === 'scripts' ? scriptArgs(extra, root)
    : leaf === 'package' ? [path.join(root, 'cli/tests/package-smoke.mjs')]
    : leaf === 'board-e2e' ? [path.join(root, 'board/node_modules/@playwright/test/cli.js'), 'test', ...extra]
    : [path.join(cwd, 'node_modules/vitest/vitest.mjs'), ...(mode === 'watch' ? ['--watch'] : ['run']), ...(mode === 'coverage' ? ['--coverage', '--coverage.reportOnFailure'] : []), ...extra];
  return { file: process.execPath, args, cwd, shell: false };
}
function preparations(leaf, root) {
  const node = (args, cwd = root) => ({ file: process.execPath, args, cwd, shell: false });
  if (leaf === 'package') return [node([path.join(root, 'scripts/build.js')])];
  if (leaf === 'board' || leaf === 'board-e2e') {
    const cwd = path.join(root, 'board');
    return [node([path.join(root, 'scripts/build-board-runtime.js')]), node([path.join(cwd, 'node_modules/typescript/bin/tsc'), '-b', ...(leaf === 'board' ? ['--noEmit'] : [])], cwd), ...(leaf === 'board-e2e' ? [node([path.join(cwd, 'node_modules/vite/bin/vite.js'), 'build'], cwd)] : [])];
  }
  return [];
}
function noTestsSelected(leaf, output) {
  if (leaf === 'package') return false;
  output = output.replace(/\u001b\[[0-9;]*m/g, '');
  if (leaf === 'scripts') {
    if (/^1\.\.0$/m.test(output)) return true;
    const pass = /# pass (\d+)/.exec(output); const fail = /# fail (\d+)/.exec(output);
    return Boolean(pass && fail && +pass[1] === 0 && +fail[1] === 0);
  }
  if (leaf === 'board-e2e') return !/\b[1-9]\d* passed\b/.test(output);
  return !/Tests\s+[1-9]\d* passed/.test(output);
}
function executeProcess(spec, env, { watch = false } = {}) {
  return new Promise(resolve => {
    const childEnv = { ...env };
    delete childEnv.NODE_TEST_CONTEXT;
    const child = spawn(spec.file, spec.args, { cwd: spec.cwd, shell: false, env: childEnv, stdio: ['inherit', 'pipe', 'pipe'] });
    let output = '';
    const forward = (stream, target) => stream.on('data', data => { output = (output + data.toString()).slice(-1024 * 1024); target.write(data); });
    forward(child.stdout, process.stdout); forward(child.stderr, process.stderr);
    const interrupt = signal => child.kill(signal);
    const int = () => interrupt('SIGINT'); const term = () => interrupt('SIGTERM');
    process.on('SIGINT', int); process.on('SIGTERM', term);
    const finish = (code, canceled = false) => { process.off('SIGINT', int); process.off('SIGTERM', term); resolve({ code, output, canceled }); };
    child.once('error', error => { process.stderr.write(`UNAVAILABLE: ${error.message}\n`); });
    child.once('close', (code, signal) => finish(signal ? 130 : code ?? 2, Boolean(signal)));
  });
}
async function runSelection({ selection, extra = [], mode = 'run', root, authorize = context.authorize, execute }) {
  selection = context.canonicalSuite(selection);
  validateRequest({ selection, extra, mode }); authorize({ selection });
  const codes = [];
  let canceled = false;
  const cancel = () => { canceled = true; };
  process.on('SIGINT', cancel); process.on('SIGTERM', cancel);
  try {
  for (const leaf of context.leavesFor(selection)) {
    if (canceled) return 130;
    const env = { ...process.env, NODE_OPTIONS: '', CODEADD_TESTS_SELECTION: selection, CODEADD_TESTS_LEAF: leaf };
    let prepared = true;
    for (const spec of preparations(leaf, root)) {
      const result = execute ? await execute({ ...spec, leaf, preparation: true, env }) : await executeProcess(spec, env);
      const code = typeof result === 'number' ? result : result.code;
      if (canceled || result.canceled) return 130;
      if (code) { process.stderr.write(`UNAVAILABLE: ${leaf} preparation exited ${code}\n`); codes.push(2); prepared = false; break; }
    }
    if (!prepared) continue;
    const spec = toolSpec({ leaf, root, extra, mode });
    const result = execute ? await execute({ ...spec, leaf, preparation: false, env }) : await executeProcess(spec, env, { watch: mode === 'watch' });
    let code = typeof result === 'number' ? result : result.code;
    if (canceled || result.canceled) return 130;
    if (mode !== 'watch' && code === 0 && typeof result === 'object' && noTestsSelected(leaf, result.output)) { process.stderr.write(`REFUSED: ${leaf} selected no tests\n`); code = 2; }
    codes.push(code);
  }
  return codes.find(code => code !== 0) ?? 0;
  } finally { process.off('SIGINT', cancel); process.off('SIGTERM', cancel); }
}
module.exports = { validateRequest, scriptArgs, toolSpec, preparations, noTestsSelected, executeProcess, runSelection };
if (require.main === module) {
  if (process.env.CODEADD_TESTS_CONTEXT === 'container') fs.writeFileSync('/tmp/codeadd-worker-ready', 'ready');
  const [selection, mode = 'run', ...extra] = process.argv.slice(2);
  runSelection({ selection, mode, extra, root: path.resolve(__dirname, '..') }).then(code => { process.exitCode = code; }).catch(error => { console.error(`REFUSED: ${error.message}`); process.exitCode = 2; });
}
