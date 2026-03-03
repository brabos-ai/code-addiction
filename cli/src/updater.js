import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { resolveSelected } from './providers.js';
import { getLatestTag, downloadZip } from './github.js';
import { fixLineEndings, writeManifest } from './installer.js';

const PRESERVE_PATTERNS = [/\/history\//, /\.local\.json$/];

/**
 * Check if a relative path should be preserved during update.
 * @param {string} relPath
 * @returns {boolean}
 */
function shouldPreserve(relPath) {
  return PRESERVE_PATTERNS.some((p) => p.test(relPath));
}

/**
 * Copy entries from zip that match a source prefix to a destination directory,
 * skipping files matching PRESERVE_PATTERNS.
 *
 * @param {AdmZip} zip
 * @param {string} zipRoot
 * @param {string} srcPrefix
 * @param {string} destDir
 * @param {string} cwd
 * @returns {string[]}
 */
function copyFromZip(zip, zipRoot, srcPrefix, destDir, cwd) {
  const copied = [];
  const prefix = `${zipRoot}/${srcPrefix}/`;

  for (const entry of zip.getEntries()) {
    if (!entry.entryName.startsWith(prefix)) continue;
    if (entry.isDirectory) continue;

    const relativeToDest = entry.entryName.slice(prefix.length);
    if (!relativeToDest) continue;

    if (shouldPreserve(relativeToDest)) continue;

    const destFile = path.join(destDir, relativeToDest);
    const destFileDir = path.dirname(destFile);

    fs.mkdirSync(destFileDir, { recursive: true });
    fs.writeFileSync(destFile, entry.getData());

    const relFromCwd = path.relative(cwd, destFile).replace(/\\/g, '/');
    copied.push(relFromCwd);
  }

  return copied;
}

/**
 * Main update flow.
 * @param {string} cwd
 */
export async function update(cwd) {
  intro('ADD CLI - Update');

  const manifestPath = path.join(cwd, '.add', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('No ADD installation found. Run `npx add install` first.');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error('Manifest is corrupted. Run `npx add install` to reinstall.');
  }

  const currentVersion = manifest.version ?? 'unknown';
  const providerKeys = manifest.providers ?? [];

  const s = spinner();
  s.start('Fetching latest release from GitHub...');
  const tag = await getLatestTag();
  const newVersion = tag.replace(/^v/, '');
  s.stop(`Current: v${currentVersion} -> Latest: ${tag}`);

  if (currentVersion === newVersion) {
    outro(`Already up to date (v${currentVersion}).`);
    return;
  }

  s.start('Downloading...');
  const zipBuffer = await downloadZip(tag);
  s.stop('Downloaded.');

  s.start('Updating...');
  const zip = new AdmZip(zipBuffer);
  const zipRoot = zip.getEntries()[0]?.entryName.split('/')[0] ?? '';
  if (!zipRoot) throw new Error('Unexpected zip structure.');

  const allFiles = [];
  const addDir = path.join(cwd, '.add');

  const coreFiles = copyFromZip(zip, zipRoot, 'framwork/.add', addDir, cwd);
  allFiles.push(...coreFiles);

  const providers = resolveSelected(providerKeys);
  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, zipRoot, p.src, destDir, cwd);
    allFiles.push(...pFiles);
  }

  s.stop(`Updated ${allFiles.length} files.`);

  fixLineEndings(path.join(addDir, 'scripts'));

  writeManifest(cwd, tag, providerKeys, allFiles);

  log.success(`Updated from v${currentVersion} to v${newVersion}`);
  outro('ADD updated successfully!');
}