import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { promptProviders, promptConfirm } from './prompt.js';
import { resolveSelected } from './providers.js';
import { getLatestTag, downloadZip } from './github.js';

/**
 * Force LF line endings on all .sh files under a directory.
 * @param {string} dir  absolute path
 */
export function fixLineEndings(dir) {
  if (!fs.existsSync(dir)) return;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.sh')) {
        const content = fs.readFileSync(full, 'utf8');
        const fixed = content.replace(/\r\n/g, '\n');
        if (fixed !== content) fs.writeFileSync(full, fixed, 'utf8');
      }
    }
  };
  walk(dir);
}

/**
 * Calculate SHA-256 hash of a file.
 * @param {string} filePath
 * @returns {string} hex digest
 */
function calculateHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Write .fnd/manifest.json
 * @param {string} cwd
 * @param {string} version
 * @param {string[]} providers
 * @param {string[]} files  relative paths from cwd
 * @param {string} [releaseTag]  e.g. "v2.0.1"
 */
export function writeManifest(cwd, version, providers, files, releaseTag) {
  const manifestPath = path.join(cwd, '.fnd', 'manifest.json');

  const hashes = {};
  for (const file of files) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      hashes[file] = calculateHash(fullPath);
    }
  }

  const manifest = {
    version: version.replace(/^v/, ''),
    releaseTag: releaseTag || version,
    installedAt: new Date().toISOString(),
    providers,
    files,
    hashes,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

/**
 * Check if a directory exists and is non-empty.
 * @param {string} dir
 * @returns {boolean}
 */
function dirExists(dir) {
  try {
    return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
  } catch {
    return false;
  }
}

/**
 * Copy entries from zip that match a source prefix to a destination directory.
 * Returns array of relative paths (from cwd) of files copied.
 *
 * @param {AdmZip} zip
 * @param {string} zipRoot   top-level folder name inside zip (e.g. "fnd-commands-scripts-2.0.1")
 * @param {string} srcPrefix path inside zip after zipRoot (e.g. "framwork/.fnd")
 * @param {string} destDir   absolute destination directory
 * @param {string} cwd       project root
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
 * Main install flow.
 * @param {string} cwd
 */
export async function install(cwd) {
  intro('PFF CLI - Install');

  const s = spinner();
  s.start('Fetching latest release from GitHub...');
  const tag = await getLatestTag();
  s.stop(`Latest release: ${tag}`);

  const fndDir = path.join(cwd, '.fnd');
  if (dirExists(fndDir)) {
    await promptConfirm('.fnd/ already exists. Overwrite with latest version?');
  }

  const selectedKeys = await promptProviders();
  const providers = resolveSelected(selectedKeys);

  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    if (dirExists(destDir)) {
      await promptConfirm(`${p.dest}/ already exists. Overwrite?`);
    }
  }

  s.start('Downloading...');
  const zipBuffer = await downloadZip(tag);
  s.stop('Downloaded.');

  s.start('Installing...');
  const zip = new AdmZip(zipBuffer);

  const zipRoot = zip.getEntries()[0]?.entryName.split('/')[0] ?? '';
  if (!zipRoot) throw new Error('Unexpected zip structure.');

  const allFiles = [];

  const coreFiles = copyFromZip(zip, zipRoot, 'framwork/.fnd', fndDir, cwd);
  allFiles.push(...coreFiles);

  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, zipRoot, p.src, destDir, cwd);
    allFiles.push(...pFiles);
  }

  s.stop(`Installed ${allFiles.length} files.`);

  fixLineEndings(path.join(fndDir, 'scripts'));

  writeManifest(cwd, tag, selectedKeys, allFiles, tag);

  const providerList = selectedKeys.length > 0 ? selectedKeys.join(', ') : 'none (core only)';
  log.success(`Providers installed: ${providerList}`);

  outro(
    `PFF installed successfully!\n\n` +
      `Next steps:\n` +
      `  1. Open your AI editor and run: /fnd-init\n` +
      `  2. Follow the onboarding to configure your project\n\n` +
      `Docs: https://github.com/xmaiconx/fnd-commands-scripts`
  );
}