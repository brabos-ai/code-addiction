import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, spinner, log } from '@clack/prompts';
import { promptConfirm } from './prompt.js';

const ADD_DIRS = ['.add', '.claude', '.agent', '.agents', '.kilocode', '.opencode'];

/**
 * Read and parse .add/manifest.json.
 * @param {string} cwd
 * @returns {{ version: string, providers: string[], files: string[], corrupted?: boolean } | null}
 *   Returns null if manifest does not exist.
 *   Returns object with corrupted=true if file exists but JSON is invalid.
 */
export function readManifest(cwd) {
  const manifestPath = path.join(cwd, '.add', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return { corrupted: true, version: 'unknown', providers: [], files: [] };
  }
}

/**
 * Walk a directory and return all file paths relative to cwd.
 * @param {string} dir
 * @param {string} cwd
 * @returns {string[]}
 */
function walkDir(dir, cwd) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        results.push(path.relative(cwd, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(dir);
  return results;
}

/**
 * Remove empty directories recursively (bottom-up).
 * @param {string} dir
 */
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyDirs(path.join(dir, entry.name));
    }
  }
  try {
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
      fs.rmdirSync(dir);
    }
  } catch {
    // ignore
  }
}

/**
 * Main uninstall flow.
 * @param {string} cwd
 * @param {boolean} force  skip confirmation
 */
export async function uninstall(cwd, force = false) {
  intro('ADD CLI - Uninstall');

  const manifest = readManifest(cwd);

  if (!manifest) {
    throw new Error('No ADD installation found. Run `npx add install` first.');
  }

  if (manifest.corrupted) {
    log.warn('Manifest is corrupted. Falling back to directory-based removal.');

    const allPresent = [];
    for (const dir of ADD_DIRS) {
      allPresent.push(...walkDir(path.join(cwd, dir), cwd));
    }

    if (allPresent.length === 0) {
      outro('No ADD files found. Nothing to remove.');
      return;
    }

    log.info(`Found ${allPresent.length} file(s) in ADD directories.`);

    if (!force) {
      await promptConfirm(
        `Remove all ${allPresent.length} files found in ADD directories? This cannot be undone.`
      );
    }

    const s = spinner();
    s.start('Removing...');
    let removed = 0;
    for (const rel of allPresent) {
      const full = path.join(cwd, rel);
      try {
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
          removed++;
        }
      } catch (err) {
        log.warn(`Could not remove ${rel}: ${err.message}`);
      }
    }
    s.stop(`Removed ${removed} files.`);

    for (const dir of ADD_DIRS) {
      removeEmptyDirs(path.join(cwd, dir));
    }

    outro('ADD removed successfully.');
    return;
  }

  const manifestFiles = new Set(manifest.files ?? []);

  const allPresent = [];
  for (const dir of ADD_DIRS) {
    allPresent.push(...walkDir(path.join(cwd, dir), cwd));
  }

  const userFiles = allPresent.filter((f) => !manifestFiles.has(f));

  log.info(`Files installed by ADD: ${manifestFiles.size}`);
  if (userFiles.length > 0) {
    log.warn(`Found ${userFiles.length} file(s) not installed by ADD (will be kept):`);
    for (const f of userFiles) log.warn(`  ${f}`);
  }

  if (!force) {
    await promptConfirm(`Remove ${manifestFiles.size} ADD files? (user files will be kept)`);
  }

  const s = spinner();
  s.start('Removing...');

  let removed = 0;
  for (const rel of manifest.files ?? []) {
    const full = path.join(cwd, rel);
    try {
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        removed++;
      }
    } catch (err) {
      log.warn(`Could not remove ${rel}: ${err.message}`);
    }
  }

  const manifestPath = path.join(cwd, '.add', 'manifest.json');
  try {
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
      removed++;
    }
  } catch {
    // ignore
  }

  s.stop(`Removed ${removed} files.`);

  for (const dir of ADD_DIRS) {
    removeEmptyDirs(path.join(cwd, dir));
  }

  outro('ADD removed successfully.');
}