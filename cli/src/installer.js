import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { promptProviders, promptScope, promptConfirm, promptFeatures, promptGitignore } from './prompt.js';
import { getInstalledDirs, writeGitignoreBlock } from './gitignore.js';
import { applyEnabledFeatures, FEATURES } from './features.js';
import { applyEnabledPlugins } from './plugins.js';
import { resolveSelected } from './providers.js';
import { getLatestTag, getLatestPrerelease, downloadReleaseAsset } from './github.js';

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
 * Resolve installation source from requested version and channel.
 * - no version + stable channel (default): latest GitHub release tag
 * - no version + beta channel: latest GitHub prerelease tag
 * - explicit version: use that tag regardless of channel
 *
 * @param {string | undefined} requestedVersion
 * @param {object} [resolvers]
 * @param {() => Promise<string>} [resolvers.latestTagResolver]
 * @param {() => Promise<string>} [resolvers.latestPrereleaseResolver]
 * @param {string} [channel]  "stable" (default) or "beta"
 * @returns {Promise<{
 *   source: 'release' | 'tag',
 *   manifestVersion: string,
 *   releaseTag: string,
 *   channel: 'stable' | 'beta',
 *   ref: null,
 *   downloadValue: string
 * }>}
 */
export async function resolveInstallSource(
  requestedVersion,
  resolvers = {},
  channel = 'stable'
) {
  // Support legacy call signature: resolveInstallSource(version, fn)
  if (typeof resolvers === 'function') {
    const fn = resolvers;
    resolvers = { latestTagResolver: fn };
    // channel stays default 'stable'
  }

  const {
    latestTagResolver = getLatestTag,
    latestPrereleaseResolver = getLatestPrerelease,
  } = resolvers;

  if (!requestedVersion) {
    const isBeta = channel === 'beta';
    const resolver = isBeta ? latestPrereleaseResolver : latestTagResolver;
    const tag = await resolver();
    return {
      source: 'release',
      manifestVersion: tag,
      releaseTag: tag,
      channel: isBeta ? 'beta' : 'stable',
      ref: null,
      downloadValue: tag,
    };
  }

  const tag = requestedVersion.startsWith('v')
    ? requestedVersion
    : `v${requestedVersion}`;
  const isBeta = channel === 'beta' || tag.includes('-beta');
  return {
    source: 'tag',
    manifestVersion: tag,
    releaseTag: tag,
    channel: isBeta ? 'beta' : 'stable',
    ref: null,
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
 * The release asset zip uses `framwork/` prefix (e.g. "framwork/.claude/commands/add.md").
 * Returns array of relative paths (from cwd) of files copied.
 *
 * @param {AdmZip} zip
 * @param {string} srcPrefix path inside zip (e.g. "framwork/.codeadd")
 * @param {string} destDir   absolute destination directory
 * @param {string} cwd       project root
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
 * @param {{version?: string, channel?: string, global?: boolean}} [options]
 */
export async function install(cwd, options = {}) {
  intro('ADD CLI - Install');

  // --global forces global scope; otherwise prompt (defaults to project).
  const scope = options.global ? 'global' : await promptScope();
  const targetDir = scope === 'global' ? os.homedir() : cwd;

  const channel = options.channel || 'stable';

  const s = spinner();
  s.start('Resolving install source from GitHub...');
  const installSource = await resolveInstallSource(options.version, {}, channel);
  if (installSource.source === 'release') {
    s.stop(`Latest release: ${installSource.downloadValue}`);
  } else {
    s.stop(`Selected tag: ${installSource.downloadValue}`);
  }

  if (installSource.channel === 'beta') {
    log.warn('⚠ You are installing a beta (pre-release) version. It may contain bugs or incomplete features.');
  }

  const addDir = path.join(targetDir, '.codeadd');
  if (dirExists(addDir)) {
    await promptConfirm('.codeadd/ already exists. Overwrite with latest version?');
  }

  const selectedKeys = await promptProviders(scope);
  const providers = resolveSelected(selectedKeys, scope);

  const selectedFeatures = await promptFeatures();
  // gitignore is meaningful only for project installs (you don't gitignore your home dir).
  const addToGitignore = scope === 'project' ? await promptGitignore() : false;

  for (const p of providers) {
    const destDir = path.join(targetDir, p.dest);
    if (dirExists(destDir)) {
      await promptConfirm(`${p.dest}/ already exists. Overwrite?`);
    }
  }

  s.start('Downloading...');
  const zipBuffer = await downloadReleaseAsset(installSource.downloadValue);
  s.stop('Downloaded.');

  s.start('Installing...');
  const zip = new AdmZip(zipBuffer);

  const allFiles = [];

  const coreFiles = copyFromZip(zip, 'framwork/.codeadd', addDir, targetDir);
  allFiles.push(...coreFiles);

  for (const p of providers) {
    const destDir = path.join(targetDir, p.dest);
    const pFiles = copyFromZip(zip, p.src, destDir, targetDir);
    allFiles.push(...pFiles);
  }

  s.stop(`Installed ${allFiles.length} files.`);

  fixLineEndings(path.join(addDir, 'scripts'));

  // gitignore write still uses cwd deliberately — only meaningful for project scope (targetDir === cwd).
  if (scope === 'project' && addToGitignore) {
    writeGitignoreBlock(cwd, getInstalledDirs(selectedKeys));
    log.success('.gitignore updated.');
  }

  // Initialize features based on user selection
  const defaultFeatures = {};
  for (const name of Object.keys(FEATURES)) {
    defaultFeatures[name] = selectedFeatures.includes(name);
  }

  writeManifest(
    targetDir,
    installSource.manifestVersion,
    selectedKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref, channel: installSource.channel, scope, features: defaultFeatures, plugins: {}, gitignore: addToGitignore }
  );

  // Apply enabled features (inject fragment content into commands)
  const featuresApplied = applyEnabledFeatures(targetDir);
  if (featuresApplied > 0) {
    log.success(`Applied ${featuresApplied} feature injection(s).`);
  }

  // Apply enabled plugins (disabled by default — no-op on fresh install)
  const pluginsApplied = applyEnabledPlugins(targetDir);
  if (pluginsApplied > 0) {
    log.success(`Applied ${pluginsApplied} plugin injection(s).`);
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
      `  1. Open your AI editor and run: /add.init\n` +
      `  2. Follow the onboarding to configure your project\n\n` +
      `Docs: https://github.com/brabos-ai/code-addiction`
  );
}
