import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { downloadZip } from './github.js';

/**
 * Read and parse .add/manifest.json.
 * @param {string} cwd
 * @returns {{ version: string, releaseTag: string, installedAt: string, providers: string[], files: string[], hashes?: object } | null}
 */
function readManifest(cwd) {
  const manifestPath = path.join(cwd, '.add', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Calculate SHA-256 hash of a file.
 * @param {string} filePath
 * @returns {string | null} hex digest or null if file doesn't exist
 */
function calculateHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validate file integrity by comparing hashes.
 * @param {string} cwd
 * @param {object} hashes  map of filePath -> expected hash
 * @returns {{ok: string[], missing: string[], modified: string[]}}
 */
function validateFiles(cwd, hashes) {
  const ok = [];
  const missing = [];
  const modified = [];

  for (const [filePath, expectedHash] of Object.entries(hashes)) {
    const fullPath = path.join(cwd, filePath);
    const actualHash = calculateHash(fullPath);

    if (actualHash === null) {
      missing.push(filePath);
    } else if (actualHash !== expectedHash) {
      modified.push(filePath);
    } else {
      ok.push(filePath);
    }
  }

  return { ok, missing, modified };
}

/**
 * Repair files by downloading and restoring from release ZIP.
 * @param {string} cwd
 * @param {string[]} filesToRepair
 * @param {string} releaseTag
 */
async function repairFiles(cwd, filesToRepair, releaseTag) {
  const s = spinner();
  s.start(`Downloading release ${releaseTag}...`);

  const zipBuffer = await downloadZip(releaseTag);
  s.stop('Downloaded.');

  s.start('Restoring files...');
  const zip = new AdmZip(zipBuffer);
  const zipRoot = zip.getEntries()[0]?.entryName.split('/')[0] ?? '';

  if (!zipRoot) {
    throw new Error('Unexpected zip structure.');
  }

  let restored = 0;
  for (const filePath of filesToRepair) {
    const possiblePaths = [
      `${zipRoot}/framwork/${filePath}`,
      `${zipRoot}/${filePath}`,
    ];

    let entry = null;
    for (const zipPath of possiblePaths) {
      entry = zip.getEntry(zipPath);
      if (entry) break;
    }

    if (entry) {
      const fullPath = path.join(cwd, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, entry.getData());
      restored++;
    }
  }

  s.stop(`Restored ${restored}/${filesToRepair.length} files.`);
  return restored;
}

/**
 * Main validate flow.
 * @param {string} cwd
 * @param {boolean} repair  if true, restore missing/modified files
 */
export async function validate(cwd, repair = false) {
  intro('ADD CLI - Validate');

  const manifest = readManifest(cwd);

  if (!manifest) {
    outro('ERROR: ADD not installed. Run `npx add install` first.');
    process.exit(1);
  }

  if (!manifest.hashes || Object.keys(manifest.hashes).length === 0) {
    log.warn('');
    log.warn('WARN Hash not available for this install.');
    log.warn('     Run `npx add update` to enable validation.');
    log.warn('');
    outro('Validation skipped.');
    process.exit(0);
  }

  const s = spinner();
  s.start('Validating file integrity...');

  const result = validateFiles(cwd, manifest.hashes);

  s.stop('Validation complete.');

  log.info('');
  log.info('File Integrity Report:');
  log.info('');
  log.info(`OK   OK:       ${result.ok.length} files`);
  log.info(`ERROR Missing:  ${result.missing.length} files`);
  log.info(`WARN Modified: ${result.modified.length} files`);

  const hasIssues = result.missing.length > 0 || result.modified.length > 0;

  if (hasIssues) {
    log.info('');
    if (result.missing.length > 0) {
      log.info('Missing files:');
      for (const f of result.missing.slice(0, 5)) {
        log.info(`  - ${f}`);
      }
      if (result.missing.length > 5) {
        log.info(`  ... and ${result.missing.length - 5} more`);
      }
    }
    if (result.modified.length > 0) {
      log.info('Modified files:');
      for (const f of result.modified.slice(0, 5)) {
        log.info(`  - ${f}`);
      }
      if (result.modified.length > 5) {
        log.info(`  ... and ${result.modified.length - 5} more`);
      }
    }

    if (repair) {
      log.info('');
      const filesToRepair = [...result.missing, ...result.modified];
      const releaseTag = manifest.releaseTag;

      if (!releaseTag) {
        log.warn('');
        log.warn('WARN Cannot repair: releaseTag not found in manifest.');
        outro('Validation complete with errors.');
        process.exit(1);
      }

      try {
        const restored = await repairFiles(cwd, filesToRepair, releaseTag);
        log.info('');
        log.success(`OK Repaired ${restored} files.`);
        outro('Validation and repair complete.');
        process.exit(0);
      } catch (err) {
        log.error(`ERROR Repair failed: ${err.message}`);
        outro('Validation complete with errors.');
        process.exit(1);
      }
    }

    log.info('');
    outro('ERROR Validation failed. Run with --repair to fix issues.');
    process.exit(1);
  } else {
    log.info('');
    outro('OK All files validated successfully!');
    process.exit(0);
  }
}