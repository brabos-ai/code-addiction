import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { promptProviders, promptConfirm, promptFeatures } from './prompt.js';
import { applyEnabledFeatures, FEATURES } from './features.js';
import { resolveSelected } from './providers.js';
import { getLatestTag, downloadTagZip, downloadBranchZip } from './github.js';

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
 * Write .codeadd/manifest.json
 * @param {string} cwd
 * @param {string} version
 * @param {string[]} providers
 * @param {string[]} files  relative paths from cwd
 * @param {string} [releaseTag]  e.g. "v2.0.1"
 * @param {object} [metadata]
 */
export function writeManifest(cwd, version, providers, files, releaseTag, metadata = {}) {
  const manifestPath = path.join(cwd, '.codeadd', 'manifest.json');

  const hashes = {};
  for (const file of files) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      hashes[file] = calculateHash(fullPath);
    }
  }

  const resolvedReleaseTag = releaseTag === undefined ? version : releaseTag;

  const manifest = {
    version: version.replace(/^v/, ''),
    releaseTag: resolvedReleaseTag,
    installedAt: new Date().toISOString(),
    providers,
    files,
    hashes,
    ...metadata,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

/**
 * Resolve installation source from requested version.
 * - no version: latest GitHub release tag
 * - "main": GitHub main branch
 * - any other value: explicit tag
 *
 * @param {string | undefined} requestedVersion
 * @param {() => Promise<string>} [latestTagResolver]
 * @returns {Promise<{
 *   source: 'release' | 'branch' | 'tag',
 *   manifestVersion: string,
 *   releaseTag: string | null,
 *   ref: string | null,
 *   downloadType: 'tag' | 'branch',
 *   downloadValue: string
 * }>}
 */
export async function resolveInstallSource(requestedVersion, requestedBranch, latestTagResolver = getLatestTag) {
  if (requestedBranch) {
    return {
      source: 'branch',
      manifestVersion: requestedBranch,
      releaseTag: null,
      ref: requestedBranch,
      downloadType: 'branch',
      downloadValue: requestedBranch,
    };
  }

  if (!requestedVersion) {
    try {
      const tag = await latestTagResolver();
      return {
        source: 'release',
        manifestVersion: tag,
        releaseTag: tag,
        ref: null,
        downloadType: 'tag',
        downloadValue: tag,
      };
    } catch (error) {
      // Repositories without releases should still be installable via main branch.
      if (error instanceof Error && /not found or has no releases/i.test(error.message)) {
        return {
          source: 'branch',
          manifestVersion: 'main',
          releaseTag: null,
          ref: 'main',
          downloadType: 'branch',
          downloadValue: 'main',
        };
      }
      throw error;
    }
  }

  if (requestedVersion === 'main') {
    return {
      source: 'branch',
      manifestVersion: 'main',
      releaseTag: null,
      ref: 'main',
      downloadType: 'branch',
      downloadValue: 'main',
    };
  }

  const tag = requestedVersion.startsWith('v')
    ? requestedVersion
    : `v${requestedVersion}`;
  return {
    source: 'tag',
    manifestVersion: tag,
    releaseTag: tag,
    ref: null,
    downloadType: 'tag',
    downloadValue: tag,
  };
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
 * @param {string} zipRoot   top-level folder name inside zip (e.g. "code-addiction-2.0.1")
 * @param {string} srcPrefix path inside zip after zipRoot (e.g. "framwork/.add")
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
 * @param {{version?: string}} [options]
 */
export async function install(cwd, options = {}) {
  intro('ADD CLI - Install');

  const s = spinner();
  s.start('Resolving install source from GitHub...');
  const installSource = await resolveInstallSource(options.version, options.branch);
  if (installSource.source === 'release') {
    s.stop(`Latest release: ${installSource.downloadValue}`);
  } else if (installSource.source === 'branch') {
    s.stop(`Selected branch: ${installSource.downloadValue}`);
  } else {
    s.stop(`Selected tag: ${installSource.downloadValue}`);
  }

  const addDir = path.join(cwd, '.codeadd');
  if (dirExists(addDir)) {
    await promptConfirm('.codeadd/ already exists. Overwrite with latest version?');
  }

  const selectedKeys = await promptProviders();
  const providers = resolveSelected(selectedKeys);

  const selectedFeatures = await promptFeatures();

  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    if (dirExists(destDir)) {
      await promptConfirm(`${p.dest}/ already exists. Overwrite?`);
    }
  }

  s.start('Downloading...');
  const zipBuffer = installSource.downloadType === 'branch'
    ? await downloadBranchZip(installSource.downloadValue)
    : await downloadTagZip(installSource.downloadValue);
  s.stop('Downloaded.');

  s.start('Installing...');
  const zip = new AdmZip(zipBuffer);

  const zipRoot = zip.getEntries()[0]?.entryName.split('/')[0] ?? '';
  if (!zipRoot) throw new Error('Unexpected zip structure.');

  const allFiles = [];

  const coreFiles = copyFromZip(zip, zipRoot, 'framwork/.codeadd', addDir, cwd);
  allFiles.push(...coreFiles);

  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, zipRoot, p.src, destDir, cwd);
    allFiles.push(...pFiles);
  }

  s.stop(`Installed ${allFiles.length} files.`);

  fixLineEndings(path.join(addDir, 'scripts'));

  // Initialize features based on user selection
  const defaultFeatures = {};
  for (const name of Object.keys(FEATURES)) {
    defaultFeatures[name] = selectedFeatures.includes(name);
  }

  writeManifest(
    cwd,
    installSource.manifestVersion,
    selectedKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref, features: defaultFeatures }
  );

  // Apply enabled features (inject fragment content into commands)
  const featuresApplied = applyEnabledFeatures(cwd);
  if (featuresApplied > 0) {
    log.success(`Applied ${featuresApplied} feature injection(s).`);
  }

  const enabledFeatures = Object.entries(defaultFeatures)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (enabledFeatures.length > 0) {
    log.info(`Features enabled: ${enabledFeatures.join(', ')}`);
    log.info('Toggle with: codeadd features enable|disable <name>');
  }

  const providerList = selectedKeys.length > 0 ? selectedKeys.join(', ') : 'none (core only)';
  log.success(`Providers installed: ${providerList}`);

  outro(
    `ADD installed successfully!\n\n` +
      `Next steps:\n` +
      `  1. Open your AI editor and run: /add-init\n` +
      `  2. Follow the onboarding to configure your project\n\n` +
      `Docs: https://github.com/brabos-ai/code-addiction`
  );
}
