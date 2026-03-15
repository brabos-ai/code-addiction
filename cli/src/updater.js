import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { resolveSelected } from './providers.js';
import { getLatestTag, downloadReleaseAsset } from './github.js';
import { fixLineEndings, writeManifest, resolveInstallSource } from './installer.js';
import { applyEnabledFeatures } from './features.js';
import { getInstalledDirs, writeGitignoreBlock } from './gitignore.js';

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
 * The release asset zip uses `framwork/` prefix (e.g. "framwork/.claude/commands/add.md").
 *
 * @param {AdmZip} zip
 * @param {string} srcPrefix
 * @param {string} destDir
 * @param {string} cwd
 * @returns {string[]}
 */
function copyFromZip(zip, srcPrefix, destDir, cwd) {
  const copied = [];
  const prefix = `${srcPrefix}/`;

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
 * @param {{version?: string}} [options]
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
  const providerKeys = manifest.providers ?? [];

  const s = spinner();

  s.start('Resolving update target...');
  const installSource = await resolveInstallSource(options.version, getLatestTag);
  s.stop(`Source: ${installSource.source} (${installSource.downloadValue})`);

  const newVersion = installSource.manifestVersion.replace(/^v/, '');
  if (currentVersion === newVersion) {
    outro(`Already up to date (v${currentVersion}).`);
    return;
  }

  s.start('Downloading...');
  const zipBuffer = await downloadReleaseAsset(installSource.downloadValue);
  s.stop('Downloaded.');

  s.start('Updating...');
  const zip = new AdmZip(zipBuffer);

  const allFiles = [];
  const addDir = path.join(cwd, '.codeadd');

  const coreFiles = copyFromZip(zip, 'framwork/.codeadd', addDir, cwd);
  allFiles.push(...coreFiles);

  const providers = resolveSelected(providerKeys);
  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, p.src, destDir, cwd);
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

  // Preserve feature states from previous manifest
  const previousFeatures = manifest.features ?? {};

  writeManifest(
    cwd,
    installSource.manifestVersion,
    providerKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref, features: previousFeatures }
  );

  // Re-apply enabled features on updated commands
  const featuresApplied = applyEnabledFeatures(cwd);
  if (featuresApplied > 0) {
    log.success(`Re-applied ${featuresApplied} feature injection(s).`);
  }

  // Sync .gitignore block if opted-in during install (backward compat: skip if key absent)
  if (manifest.gitignore === true) {
    writeGitignoreBlock(cwd, getInstalledDirs(providerKeys));
    log.success('.gitignore synced.');
  }

  log.success(`Updated from v${currentVersion} to ${installSource.manifestVersion}`);
  outro('ADD updated successfully!');
}
