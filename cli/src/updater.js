import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { resolveSelected } from './providers.js';
import { getLatestTag, downloadTagZip, downloadBranchZip } from './github.js';
import { fixLineEndings, writeManifest, resolveInstallSource } from './installer.js';

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
 * @param {{version?: string, branch?: string}} [options]
 */
export async function update(cwd, options = {}) {
  intro('ADD CLI - Update');

  const manifestPath = path.join(cwd, '.codeadd', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('No ADD installation found. Run `npx codeadd install` first.');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    throw new Error('Manifest is corrupted. Run `npx codeadd install` to reinstall.');
  }

  const currentVersion = manifest.version ?? 'unknown';
  const currentSource = manifest.source ?? 'release';
  const currentRef = manifest.ref ?? null;
  const providerKeys = manifest.providers ?? [];

  const s = spinner();

  // Determine target source:
  // - explicit --branch or --version → use that
  // - no flags + currently on a branch → stay on same branch (re-pull)
  // - no flags + currently on release/tag → fetch latest release
  let targetVersion = options.version;
  let targetBranch = options.branch;

  if (!targetVersion && !targetBranch && currentSource === 'branch' && currentRef) {
    targetBranch = currentRef;
  }

  s.start('Resolving update target...');
  const installSource = await resolveInstallSource(targetVersion, targetBranch, getLatestTag);
  s.stop(`Source: ${installSource.source} (${installSource.downloadValue})`);

  // For release/tag updates, skip if already on same version
  if (installSource.source !== 'branch') {
    const newVersion = installSource.manifestVersion.replace(/^v/, '');
    if (currentVersion === newVersion) {
      outro(`Already up to date (v${currentVersion}).`);
      return;
    }
  }

  s.start('Downloading...');
  const zipBuffer = installSource.downloadType === 'branch'
    ? await downloadBranchZip(installSource.downloadValue)
    : await downloadTagZip(installSource.downloadValue);
  s.stop('Downloaded.');

  s.start('Updating...');
  const zip = new AdmZip(zipBuffer);
  const zipRoot = zip.getEntries()[0]?.entryName.split('/')[0] ?? '';
  if (!zipRoot) throw new Error('Unexpected zip structure.');

  const allFiles = [];
  const addDir = path.join(cwd, '.codeadd');

  const coreFiles = copyFromZip(zip, zipRoot, 'framwork/.codeadd', addDir, cwd);
  allFiles.push(...coreFiles);

  const providers = resolveSelected(providerKeys);
  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, zipRoot, p.src, destDir, cwd);
    allFiles.push(...pFiles);
  }

  s.stop(`Updated ${allFiles.length} files.`);

  // Remove files that existed in the previous installation but are no longer in the new version
  const oldFiles = new Set(manifest.files ?? []);
  const newFiles = new Set(allFiles);
  let removed = 0;
  for (const old of oldFiles) {
    if (!newFiles.has(old) && !shouldPreserve(old)) {
      const full = path.join(cwd, old);
      try {
        if (fs.existsSync(full)) {
          fs.unlinkSync(full);
          removed++;
        }
      } catch {
        // ignore removal errors
      }
    }
  }
  if (removed > 0) log.success(`Removed ${removed} obsolete file(s).`);

  fixLineEndings(path.join(addDir, 'scripts'));

  writeManifest(
    cwd,
    installSource.manifestVersion,
    providerKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref }
  );

  const fromLabel = currentSource === 'branch' ? currentRef ?? currentVersion : `v${currentVersion}`;
  const toLabel = installSource.source === 'branch'
    ? installSource.ref
    : installSource.manifestVersion;
  log.success(`Updated from ${fromLabel} to ${toLabel}`);
  outro('ADD updated successfully!');
}
