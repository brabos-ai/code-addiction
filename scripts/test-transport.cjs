/** Linux Docker transport: copied source, image-owned dependencies, synchronized watch and allowlisted reports. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const context = require('./test-context.cjs');
const INPUTS = ['package.json', 'package-lock.json', 'cli/package.json', 'cli/package-lock.json', 'board/package.json', 'board/package-lock.json'];
const EXCLUDES = ['.git', '.worktrees', '.test-artifacts', 'docs/plans', 'docs/brainstorming', 'docs/evidence', 'board/runtime', 'board/src/routeTree.gen.ts', 'cli/src/mcp', 'framwork/.codeadd/artefact-graph.json', 'framwork/.codeadd/contracts.json', 'framwork/.codeadd/injection-points.json'];
function excluded(rel) {
  const parts = rel.split('/');
  return parts.some(p => ['node_modules', 'dist', 'coverage', 'test-results', 'playwright-report', '.vitest', '.vite', '.cache'].includes(p)) || rel.endsWith('.tsbuildinfo') || EXCLUDES.some(e => rel === e || rel.startsWith(e + '/')) || /^(?:framwork\/)?\.(?:claude|opencode|agents|codex|cursor|gemini|github)\/(?:commands|skills|agents|worktrees)(?:\/|$)/.test(rel);
}
function snapshot(root, { initial = false } = {}) {
  const result = new Map();
  function walk(dir, rel = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = rel ? `${rel}/${entry.name}` : entry.name;
      if (excluded(name) && !(initial && name === 'board/src/routeTree.gen.ts')) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (fs.existsSync(path.join(file, '.git'))) continue; walk(file, name); }
      else if (entry.isFile()) result.set(name, createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
      // Never copy host symlinks into dependency-owned container state.
    }
  }
  walk(root); return result;
}
function diffSnapshots(before, after) { return { changed: [...after.keys()].filter(name => before.get(name) !== after.get(name)), deleted: [...before.keys()].filter(name => !after.has(name)) }; }
function imageTag(inputs) {
  const hash = createHash('sha256');
  for (const key of Object.keys(inputs).sort()) { const value = inputs[key]; hash.update(`${key}:${Buffer.byteLength(value)}:`).update(value); }
  return `codeadd-tests:${hash.digest('hex').slice(0, 12)}`;
}
function command(file, args, options = {}) {
  const result = spawnSync(file, args, { env: { ...process.env, NODE_OPTIONS: '' }, ...options });
  if (result.error || result.status !== 0) throw new Error(`${file} ${args[0] || ''} unavailable (exit ${result.status}): ${result.error?.message || result.stderr?.toString() || ''}`);
  return result.stdout?.toString() || '';
}
function ensureImage(root) {
  const inputs = { dockerfile: fs.readFileSync(path.join(root, 'scripts/tests.Dockerfile'), 'utf8') };
  for (const file of INPUTS) inputs[file] = fs.readFileSync(path.join(root, file), 'utf8');
  const tag = imageTag(inputs);
  const inspect = spawnSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' });
  if (!inspect.error && inspect.status === 0) return tag;
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-image-'));
  try {
    fs.writeFileSync(path.join(scratch, 'Dockerfile'), inputs.dockerfile);
    for (const file of INPUTS) { fs.mkdirSync(path.dirname(path.join(scratch, file)), { recursive: true }); fs.writeFileSync(path.join(scratch, file), inputs[file]); }
    command('docker', ['build', '-t', tag, scratch], { stdio: 'inherit' }); return tag;
  } finally { fs.rmSync(scratch, { recursive: true, force: true }); }
}
function worktreeGit(root) {
  const dot = path.join(root, '.git');
  if (!fs.existsSync(dot) || !fs.statSync(dot).isFile()) return null;
  const match = /^gitdir:\s*(.+?)\s*$/m.exec(fs.readFileSync(dot, 'utf8'));
  if (!match) throw new Error('Malformed worktree .git');
  const admin = path.resolve(root, match[1]);
  const commonDir = path.resolve(admin, fs.readFileSync(path.join(admin, 'commondir'), 'utf8').trim());
  return { commonDir, gitFile: `gitdir: /gitcommon/${path.relative(commonDir, admin).split(path.sep).join('/')}\n` };
}
function gitMounts(root, scratch) {
  const wt = worktreeGit(root);
  if (wt) { const file = path.join(scratch, 'dotgit'); fs.writeFileSync(file, wt.gitFile); return ['-v', `${dockerPath(wt.commonDir)}:/gitcommon:ro`, '-v', `${dockerPath(file)}:/code/.git:ro`]; }
  return fs.existsSync(path.join(root, '.git')) ? ['-v', `${dockerPath(root)}/.git:/code/.git:ro`] : [];
}
function dockerPath(value) { return value.replaceAll('\\', '/'); }
function pack(root, names, file, scratch) {
  // A separate staging copy avoids tar option/path parsing and sync races with deleted source files.
  const staged = fs.mkdtempSync(path.join(scratch, 'pack-'));
  try {
    for (const name of names) { const dest = path.join(staged, name); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(root, name), dest); }
    command('tar', ['-c', '-f', file, '.'], { cwd: staged });
  } finally { fs.rmSync(staged, { recursive: true, force: true }); }
}
function exportStatus(code, failed) { return code !== 0 ? code : failed ? 2 : 0; }
function exportReports(container, selection, root, id, mode) {
  const paths = context.leavesFor(selection).flatMap(leaf => leaf === 'cli' && mode === 'coverage' ? [['cli', '/code/cli/coverage', 'coverage']] : leaf === 'board-e2e' ? [['board-e2e', '/code/board/test-results/runs', 'test-results'], ['board-e2e', '/code/board/playwright-report', 'playwright-report']] : []);
  let failed = false;
  for (const [suite, source, name] of paths) {
    // Stopped containers cannot exec: docker cp itself reports a missing path explicitly.
    const dest = path.join(root, '.test-artifacts', suite, id, name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const copied = spawnSync('docker', ['cp', `${container}:${source}`, dest], { encoding: 'utf8' });
    if (copied.error || copied.status !== 0) {
      if (/Could not find|No such file/.test(copied.stderr || '') && mode !== 'coverage') continue;
      failed = true; console.error(`EVIDENCE EXPORT FAILED: ${source} -> ${dest}: ${copied.error?.message || copied.stderr}; rerun after checking output permissions`);
    } else console.log(`Test evidence: ${dest}`);
  }
  return failed;
}
async function runDocker({ root, selection, extra = [], mode = 'run' }) {
  command('docker', ['info', '--format', '{{.OSType}}'], { encoding: 'utf8' }).trim() === 'linux' || (() => { throw new Error('Docker must provide Linux containers'); })();
  const tag = ensureImage(root); const id = randomUUID(); const container = `codeadd-tests-${id}`;
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-run-'));
  let timer; let syncBusy = false; let watchFailure = null; let canceled = false; let child;
  const stop = () => { canceled = true; spawnSync('docker', ['stop', '-t', '2', container], { stdio: 'ignore' }); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    let previous = snapshot(root);
    const tar = path.join(scratch, 'tree.tar'); pack(root, [...snapshot(root, { initial: true }).keys()], tar, scratch);
    const receipt = path.join(scratch, 'context.json');
    fs.writeFileSync(receipt, JSON.stringify({ v: 1, context: 'container', selection, leaves: context.leavesFor(selection) }));
    const args = ['create', '--name', container, '-i', '-v', `${dockerPath(tar)}:/src/tree.tar:ro`, ...gitMounts(root, scratch), '-v', `${dockerPath(receipt)}:${context.RECEIPT}:ro`, '-e', 'NODE_OPTIONS=', '-e', 'GIT_OPTIONAL_LOCKS=0', '-e', 'CODEADD_TESTS_COPY=1', '-e', 'CODEADD_TESTS_CONTEXT=container', '-e', `CODEADD_TESTS_SELECTION=${selection}`, '-w', '/code', tag, 'sh', '-c', 'tar -x --no-same-owner -f /src/tree.tar -C /code || exit 2; exec node scripts/test-worker.cjs "$@"', 'worker', selection, mode, ...extra];
    command('docker', args, { encoding: 'utf8' });
    if (mode === 'watch') {
      timer = setInterval(() => {
        if (syncBusy || watchFailure || canceled) return;
        syncBusy = true;
        try {
          const next = snapshot(root); const delta = diffSnapshots(previous, next);
          if ([...delta.changed, ...delta.deleted].some(file => INPUTS.includes(file) || file === 'scripts/tests.Dockerfile')) {
            watchFailure = 'Dependency/image inputs changed. Restart watch to resolve matching Linux dependencies.'; stop(); return;
          }
          if (delta.changed.length || delta.deleted.length) {
            const archive = path.join(scratch, 'sync.tar'); pack(root, delta.changed, archive, scratch);
            command('docker', ['cp', archive, `${container}:/tmp/codeadd-sync.tar`]);
            command('docker', ['exec', container, 'tar', '-x', '--no-same-owner', '-f', '/tmp/codeadd-sync.tar', '-C', '/code']);
            if (delta.deleted.length) command('docker', ['exec', container, 'node', '-e', 'const fs=require("fs"),path=require("path"); for(const p of JSON.parse(process.argv[1])) { const target=path.resolve("/code",p); if(!target.startsWith("/code/")) throw Error("Invalid sync path"); fs.rmSync(target,{force:true}); }', JSON.stringify(delta.deleted)]);
            console.log(`Watch synchronized: ${delta.changed.length} changed, ${delta.deleted.length} deleted`);
          }
          previous = next;
        } catch (error) { watchFailure = `Watch synchronization unavailable: ${error.message}. Restart watch.`; stop(); }
        finally { syncBusy = false; }
      }, 500);
    }
    const code = await new Promise(resolve => {
      child = spawn('docker', ['start', '-a', '-i', container], { stdio: 'inherit', env: { ...process.env, NODE_OPTIONS: '' } });
      child.on('error', error => { console.error(`UNAVAILABLE: ${error.message}`); });
      child.on('close', (status, signal) => resolve(signal ? 130 : status ?? 2));
    });
    if (timer) clearInterval(timer);
    if (watchFailure) console.error(watchFailure);
    const exported = exportReports(container, selection, root, id, mode);
    return watchFailure ? 2 : canceled ? 130 : exportStatus(code, exported);
  } finally {
    if (timer) clearInterval(timer);
    process.off('SIGINT', stop); process.off('SIGTERM', stop);
    spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
module.exports = { INPUTS, EXCLUDES, excluded, snapshot, diffSnapshots, imageTag, worktreeGit, gitMounts, pack, exportStatus, exportReports, runDocker };
