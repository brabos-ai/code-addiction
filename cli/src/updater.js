import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { resolveSelected, agentDest } from './providers.js';
import { getLatestTag, getLatestPrerelease, downloadReleaseAsset } from './github.js';
import { fixLineEndings, writeManifest, resolveInstallSource, shouldPreserve } from './installer.js';
import { applyEnabledFeatures } from './features.js';
import { applyEnabledPlugins } from './plugins.js';
import { runMigrations } from './migrations.js';
import { getInstalledDirs, writeGitignoreBlock } from './gitignore.js';

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
 * @param {string} cwd  the target base (bin passes the scope-resolved targetDir)
 * @param {{version?: string, channel?: string}} [options]
 * @param {'project'|'global'} [scope]  fallback scope when manifest has none
 */
export async function update(cwd, options = {}, scope = 'project') {
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
  // Authoritative scope: manifest wins; fall back to the flag-derived scope.
  const installScope = manifest.scope ?? scope;

  // Channel priority: explicit --channel flag > manifest channel > stable
  const channel = options.channel || manifest.channel || 'stable';

  const s = spinner();

  s.start('Resolving update target...');
  const installSource = await resolveInstallSource(
    options.version,
    { latestTagResolver: getLatestTag, latestPrereleaseResolver: getLatestPrerelease },
    channel
  );
  s.stop(`Source: ${installSource.source} (${installSource.downloadValue})`);

  if (installSource.channel === 'beta') {
    log.warn('⚠ Updating to a beta (pre-release) version. It may contain bugs or incomplete features.');
  }

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

  const providers = resolveSelected(providerKeys, installScope);
  for (const p of providers) {
    const destDir = path.join(cwd, p.dest);
    const pFiles = copyFromZip(zip, p.src, destDir, cwd);
    allFiles.push(...pFiles);

    // A provider whose agents live outside its main root (Codex: skills under
    // .agents/, agents under .codex/agents/) needs a second copy pass.
    if (p.agentsSrc) {
      const agentDir = path.join(cwd, agentDest(p));
      allFiles.push(...copyFromZip(zip, p.agentsSrc, agentDir, cwd));
    }
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

  // Preserve feature + plugin states from previous manifest
  const previousFeatures = manifest.features ?? {};
  const previousPlugins = manifest.plugins ?? {};

  // Repairs the release payload cannot carry. Runs AFTER the new files land, so
  // a migration sees the version it was written against, and BEFORE
  // writeManifest, so its ledger is threaded through the same metadata argument
  // that already preserves features and plugins — one write, no field dropped.
  const previousMigrations = Array.isArray(manifest.migrations) ? manifest.migrations : [];
  const migrationResult = runMigrations({ cwd, providers }, previousMigrations);
  for (const change of migrationResult.changes) log.success(`Migration removed ${change}`);
  for (const failure of migrationResult.failed) {
    // Reported, not recorded, not fatal: the next update retries it.
    log.warn(`Migration ${failure.id} failed: ${failure.error}`);
  }
  if (migrationResult.applied.length > 0) {
    log.success(`Applied ${migrationResult.applied.length} migration(s).`);
  }
  const nextMigrations = [...previousMigrations, ...migrationResult.applied].sort();

  writeManifest(
    cwd,
    installSource.manifestVersion,
    providerKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref, channel: installSource.channel, scope: installScope, features: previousFeatures, plugins: previousPlugins, migrations: nextMigrations }
  );

  // Re-apply enabled features on updated commands (files were overwritten by the new version)
  const featuresApplied = applyEnabledFeatures(cwd);
  if (featuresApplied > 0) {
    log.success(`Re-applied ${featuresApplied} feature injection(s).`);
  }

  // Re-apply enabled plugins (mirrors installer; marker-free files need re-injection post-update)
  const pluginsApplied = applyEnabledPlugins(cwd);
  if (pluginsApplied > 0) {
    log.success(`Re-applied ${pluginsApplied} plugin injection(s).`);
  }

  // Sync .gitignore block if opted-in during install (project scope only — never gitignore the home dir)
  if (installScope === 'project' && manifest.gitignore === true) {
    writeGitignoreBlock(cwd, getInstalledDirs(providerKeys));
    log.success('.gitignore synced.');
  }

  log.success(`Updated from v${currentVersion} to ${installSource.manifestVersion}`);
  outro('ADD updated successfully!');
}
