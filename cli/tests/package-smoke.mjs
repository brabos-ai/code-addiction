#!/usr/bin/env node
/**
 * Package smoke test: pack cli/, install the exact tarball into a temporary
 * consumer project, and execute the npm-generated bin directly.
 *
 * Runs standalone (not under vitest) so it can gate publication with a hard
 * exit code. All temporary data lives outside the repository and is removed
 * on every path (success and failure).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI_DIR = fileURLToPath(new URL('..', import.meta.url));
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const USAGE = 'Usage: codeadd <command>';

function run(cmd, args, options = {}) {
  const shell = process.platform === 'win32' && cmd.endsWith('.cmd');
  const result = spawnSync(cmd, args, { encoding: 'utf8', timeout: 120000, shell, ...options });
  if (result.error) {
    throw new Error(`could not run ${cmd} ${args.join(' ')}: ${result.error.message}`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codeadd-smoke-'));
let exitCode = 0;

try {
  const repoVersion = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf8')).version;
  const lockVersion = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package-lock.json'), 'utf8')).version;
  assert(lockVersion === repoVersion, `package-lock.json version ${lockVersion} != package.json version ${repoVersion}`);

  const pack = run(NPM, ['pack', '--json', '--pack-destination', tmpRoot], { cwd: CLI_DIR });
  assert(pack.status === 0, `npm pack failed (status ${pack.status})`);
  const packInfoRaw = JSON.parse(pack.stdout);
  const packInfo = Array.isArray(packInfoRaw) ? packInfoRaw[0] : Object.values(packInfoRaw)[0];
  assert(packInfo.name === 'codeadd', `packed package name is ${packInfo.name}, expected codeadd`);
  assert(packInfo.version === repoVersion, `packed version ${packInfo.version} != repo version ${repoVersion}`);
  const tarball = path.join(tmpRoot, packInfo.filename);
  assert(fs.existsSync(tarball), `tarball missing: ${tarball}`);

  const projDir = path.join(tmpRoot, 'proj');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(
    path.join(projDir, 'package.json'),
    JSON.stringify({ name: 'smoke-consumer', version: '0.0.0', private: true }, null, 2),
  );

  const install = run(NPM, ['install', tarball, '--no-audit', '--no-fund'], { cwd: projDir });
  assert(install.status === 0, `npm install of tarball failed (status ${install.status})`);

  const installedPkg = JSON.parse(
    fs.readFileSync(path.join(projDir, 'node_modules', 'codeadd', 'package.json'), 'utf8'),
  );
  assert(installedPkg.version === repoVersion, `installed version ${installedPkg.version} != ${repoVersion}`);
  assert(installedPkg.bin && installedPkg.bin.codeadd === './bin/codeadd.js', 'bin metadata missing in installed package');
  assert(
    fs.existsSync(path.join(projDir, 'node_modules', 'codeadd', 'src', 'cli.js')),
    'src/cli.js missing from tarball (files allowlist)',
  );

  const binLink = path.join(projDir, 'node_modules', '.bin', process.platform === 'win32' ? 'codeadd.cmd' : 'codeadd');
  assert(fs.existsSync(binLink), `npm bin not created: ${binLink}`);

  const help = run(binLink, ['--help'], { cwd: projDir, shell: process.platform === 'win32' });
  assert(help.status === 0, `installed bin --help exited ${help.status}, expected 0`);
  assert(help.stdout.includes(USAGE), `installed bin --help did not print usage (stdout: ${JSON.stringify(help.stdout.slice(0, 120))})`);

  const invalid = run(binLink, ['does-not-exist'], { cwd: projDir, shell: process.platform === 'win32' });
  assert(invalid.status === 1, `installed bin invalid command exited ${invalid.status}, expected 1`);
  assert(invalid.stdout.includes(USAGE), 'installed bin invalid command did not print usage');

  console.log(`PASS: package smoke (${repoVersion}) — pack, install, bin --help, bin invalid, exit propagation`);
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  exitCode = 1;
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

process.exit(exitCode);
