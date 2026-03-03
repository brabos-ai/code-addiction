import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { intro, outro, spinner, log } from '@clack/prompts';

/**
 * Check if Node version is >= 18.
 * @returns {{ok: boolean, version: string}}
 */
function checkNode() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  return {
    ok: major >= 18,
    version,
  };
}

/**
 * Check if Git is installed and accessible.
 * @returns {Promise<{ok: boolean, version: string | null}>}
 */
function checkGit() {
  return new Promise((resolve) => {
    const child = spawn('git', ['--version'], { stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    child.on('close', (code) => {
      if (code === 0) {
        const version = output.trim().split(' ')[2];
        resolve({ ok: true, version });
      } else {
        resolve({ ok: false, version: null });
      }
    });
    child.on('error', () => {
      resolve({ ok: false, version: null });
    });
  });
}

/**
 * Check if .add/ directory exists and is non-empty.
 * @param {string} cwd
 * @returns {{ok: boolean, exists: boolean, hasFiles: boolean}}
 */
function checkAddDir(cwd) {
  const addDir = path.join(cwd, '.add');
  const exists = fs.existsSync(addDir);
  let hasFiles = false;
  if (exists) {
    try {
      const entries = fs.readdirSync(addDir);
      hasFiles = entries.length > 0;
    } catch {
      // ignore
    }
  }
  return {
    ok: exists && hasFiles,
    exists,
    hasFiles,
  };
}

/**
 * Check if manifest.json exists and is valid JSON.
 * @param {string} cwd
 * @returns {{ok: boolean, exists: boolean, valid: boolean}}
 */
function checkManifest(cwd) {
  const manifestPath = path.join(cwd, '.add', 'manifest.json');
  const exists = fs.existsSync(manifestPath);
  let valid = false;
  if (exists) {
    try {
      JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      valid = true;
    } catch {
      // invalid JSON
    }
  }
  return {
    ok: exists && valid,
    exists,
    valid,
  };
}

/**
 * Main doctor flow - checks environment health.
 * @param {string} cwd
 */
export async function doctor(cwd) {
  intro('ADD CLI - Doctor');

  const s = spinner();
  s.start('Checking environment...');

  const nodeCheck = checkNode();
  const gitCheck = await checkGit();
  const addCheck = checkAddDir(cwd);
  const manifestCheck = checkManifest(cwd);

  s.stop('Checks complete.');

  log.info('');
  log.info('Environment Health Check:');
  log.info('');

  const nodeIcon = nodeCheck.ok ? 'OK' : 'ERROR';
  log.info(`${nodeIcon} Node.js: ${nodeCheck.version} ${nodeCheck.ok ? '(>= 18)' : '(< 18 required)'}`);

  const gitIcon = gitCheck.ok ? 'OK' : 'ERROR';
  log.info(`${gitIcon} Git: ${gitCheck.ok ? gitCheck.version : 'not found'}`);

  const addIcon = addCheck.ok ? 'OK' : addCheck.exists ? 'WARN' : 'ERROR';
  const addStatus = addCheck.ok ? 'present' : addCheck.exists ? 'empty' : 'missing';
  log.info(`${addIcon} .add/ directory: ${addStatus}`);

  let manifestIcon;
  let manifestStatus;
  if (manifestCheck.ok) {
    manifestIcon = 'OK';
    manifestStatus = 'valid';
  } else if (manifestCheck.exists) {
    manifestIcon = 'WARN';
    manifestStatus = 'invalid JSON';
  } else {
    manifestIcon = 'ERROR';
    manifestStatus = 'missing';
  }
  log.info(`${manifestIcon} manifest.json: ${manifestStatus}`);

  log.info('');

  const allOk = nodeCheck.ok && gitCheck.ok && addCheck.ok && manifestCheck.ok;

  if (allOk) {
    outro('OK All checks passed! ADD is properly installed.');
    process.exit(0);
  } else {
    const issues = [];
    if (!nodeCheck.ok) issues.push('Node.js >= 18 required');
    if (!gitCheck.ok) issues.push('Git not found');
    if (!addCheck.ok) issues.push('.add/ directory missing or empty');
    if (!manifestCheck.ok) issues.push('manifest.json missing or invalid');

    outro(`ERROR Issues found:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
    process.exit(1);
  }
}