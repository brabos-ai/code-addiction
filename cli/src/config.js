import fs from 'node:fs';
import path from 'node:path';
import { intro, outro, spinner, log } from '@clack/prompts';
import { getLatestTag } from './github.js';

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
 * Format date to human-readable string.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return 'unknown';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Main config flow - displays installation info.
 * @param {string} cwd
 * @param {boolean} verbose  if true, checks for updates
 */
export async function config(cwd, verbose = false) {
  intro('ADD CLI - Config');

  const manifest = readManifest(cwd);

  if (!manifest) {
    outro('ERROR: ADD not installed. Run `npx add install` first.');
    process.exit(1);
  }

  log.info('');
  log.info('Installation Configuration:');
  log.info('');
  log.info(`Version:        ${manifest.version || 'unknown'}`);
  log.info(`Release Tag:    ${manifest.releaseTag || 'unknown'}`);
  log.info(`Installed At:   ${formatDate(manifest.installedAt)}`);
  log.info(`Providers:      ${manifest.providers?.join(', ') || 'none'}`);
  log.info(`Total Files:    ${manifest.files?.length || 0}`);

  const hasHashes = manifest.hashes && Object.keys(manifest.hashes).length > 0;
  log.info(`Hash Support:   ${hasHashes ? 'OK enabled' : 'WARN not available (run update to enable)'}`);

  if (verbose) {
    log.info('');
    const s = spinner();
    s.start('Checking for updates...');

    try {
      const latestTag = await getLatestTag();
      const currentVersion = manifest.version?.replace(/^v/, '') || '';
      const latestVersion = latestTag.replace(/^v/, '');

      s.stop('Update check complete.');

      if (latestTag === manifest.releaseTag || latestVersion === currentVersion) {
        log.success('OK You are running the latest version!');
      } else {
        log.warn(`WARN Update available: ${latestTag} (current: ${manifest.releaseTag || manifest.version})`);
        log.info('   Run `npx add update` to upgrade.');
      }
    } catch (err) {
      s.stop('Update check failed.');
      log.warn(`WARN Could not check for updates: ${err.message}`);
    }
  }

  log.info('');
  outro('Config display complete.');
  process.exit(0);
}