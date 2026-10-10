import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { intro, outro, spinner, log } from '@clack/prompts';
import { promptProviders, promptScope, promptConfirm, promptGitignore, promptExistingInstall } from './prompt.js';
import { getInstalledDirs, writeGitignoreBlock } from './gitignore.js';
import { applyEnabledFeatures, getFeatureStates, FEATURES } from './features.js';
// modify.js and updater.js import this module back. Both are function-only
// imports, used at call time, so the cycle is safe in either load order.
import { modify, applyDesiredState, validateDesired, assertPluginsEnabled } from './modify.js';
import { readChangeFlags } from './change-flags.js';
import { update } from './updater.js';
import { applyEnabledPluginsDetailed } from './plugins.js';
import { resolveSelected } from './providers.js';
import { copyRelease, pruneObsolete, PRESERVE_PATTERNS, shouldPreserve } from './release-copy.js';
import { writeMcpRegistration } from './mcp-registration.js';
import { getLatestTag, getLatestPrerelease, downloadReleaseAsset } from './github.js';
import { readManifest, captureBaselines } from './injection-core.js';
import { allMigrationIds } from './migrations.js';

// The single definition of "never delete this" lives in release-copy.js, next to
// the copy and prune passes that apply it. Re-exported so importers of this
// module (updater.js, the tests) do not change.
export { PRESERVE_PATTERNS, shouldPreserve };

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
 * Does .codeadd/ hold an installation? A fresh clone of a project whose board has moved
 * carries exactly one tracked file there, board.json, and that is not something an
 * install would overwrite.
 * @param {string} dir
 * @returns {boolean}
 */
function addDirHoldsInstall(dir) {
  try {
    return fs.existsSync(dir) && fs.readdirSync(dir).some((name) => name !== 'board.json');
  } catch {
    return false;
  }
}

/**
 * What the install menu shows about the installation already in `targetDir`.
 * @param {string} targetDir
 * @param {object} manifest
 * @returns {{version: string, scope: string, providers: string[], features: string[], plugins: string[]}}
 */
function describeInstall(targetDir, manifest) {
  return {
    version: manifest.version ?? 'unknown',
    scope: manifest.scope ?? 'project',
    providers: manifest.providers ?? [],
    features: getFeatureStates(targetDir).filter((f) => f.enabled).map((f) => f.name),
    plugins: Object.entries(manifest.plugins ?? {}).filter(([, s]) => s?.enabled).map(([name]) => name),
  };
}

const NO_TTY_PROVIDERS =
  'install needs --providers when there is no terminal to ask: --providers <a,b|none>, where "none" installs the core only. ' +
  'Example: codeadd install --providers claude,codex --enable-feature board';

/**
 * Everything install can refuse WITHOUT a person to ask, before anything is
 * downloaded or written. Each failure is a plain Error (exit 1): a prompt here
 * would hang a bot, and USER_CANCEL would exit 0 with nothing installed.
 *
 * @returns {object} the validated request, feature names resolved to their canonical keys
 */
function preflightWithoutTty(targetDir, scope, flags) {
  if (readManifest(targetDir)) {
    throw new Error(
      'An ADD installation already exists here, and install cannot choose what to do with it without a terminal. ' +
        'Run "codeadd update" to update it, or "codeadd modify --providers <a,b> --enable-feature <name> ..." to change providers, features or plugins.',
    );
  }
  if (flags.providers === undefined) throw new Error(NO_TTY_PROVIDERS);

  const checked = validateDesired({ providers: flags.providers, features: flags.features, plugins: flags.plugins }, scope, []);

  if (!flags.force) {
    const clashes = [];
    if (addDirHoldsInstall(path.join(targetDir, '.codeadd'))) clashes.push('.codeadd/');
    for (const p of resolveSelected(flags.providers, scope)) {
      if (dirExists(path.join(targetDir, p.dest))) clashes.push(`${p.dest}/`);
    }
    if (clashes.length > 0) {
      throw new Error(`${clashes.join(', ')} already exist(s) and would be overwritten. There is no terminal to ask: pass --force to overwrite.`);
    }
  }
  return checked;
}

/**
 * Main install flow.
 *
 * Without a TTY nothing is asked: `--providers` is required, the rest takes the
 * documented defaults (scope project, gitignore on, registry-default features, no
 * plugins), and an overwrite needs `--force`. With a TTY each flag only answers its
 * own question, and what is not given is asked as it always was.
 *
 * @param {string} cwd
 * @param {{version?: string, channel?: string, global?: boolean, args?: string[]}} [options]
 *   `args` is the raw argument list, read for the change flags (`--providers`, `--force`, ...)
 */
export async function install(cwd, options = {}) {
  intro('ADD CLI - Install');

  const flags = readChangeFlags(options.args ?? []);
  const interactive = Boolean(process.stdin.isTTY);

  // --global forces global scope; otherwise prompt (defaults to project).
  const scope = options.global ? 'global' : interactive ? await promptScope() : 'project';
  const targetDir = scope === 'global' ? os.homedir() : cwd;

  // Names are refused here, before the menu and before the download, in either mode.
  const requested = interactive
    ? validateDesired({ providers: flags.providers, features: flags.features, plugins: flags.plugins }, scope, [])
    : preflightWithoutTty(targetDir, scope, flags);

  // An installation is already here: show it and ask, BEFORE anything is resolved
  // or written. A reinstall resets features and plugins and deletes the files of any
  // provider not re-ticked, so it is one choice among four rather than the only road.
  const existing = readManifest(targetDir);
  if (existing) {
    const choice = await promptExistingInstall(describeInstall(targetDir, existing));
    // The manifest's scope is authoritative for Modify and Update, as `update()` already treats it.
    const installScope = existing.scope ?? scope;
    if (choice === 'cancel') {
      outro('Cancelled. Nothing was changed.');
      return;
    }
    if (choice === 'modify') {
      if (options.version || options.channel) {
        log.info('--version and --channel are ignored by Modify: it never changes the installed version. Use Update for that.');
      }
      if (flags.any) {
        log.warn('The change flags (--providers, --enable-feature, ...) are not applied by this menu. To apply them without it, run `codeadd modify` with the same flags.');
      }
      await modify(targetDir, [], installScope);
      return;
    }
    if (choice === 'update') {
      await update(targetDir, { version: options.version, channel: options.channel }, installScope);
      return;
    }
    // 'reinstall' continues into today's flow, behind its own overwrite confirmation.
  }

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

  // --force answers both overwrite questions. Without a TTY the preflight already refused
  // any clash that --force did not cover, so no prompt is reachable there.
  const addDir = path.join(targetDir, '.codeadd');
  if (addDirHoldsInstall(addDir) && !flags.force) {
    await promptConfirm('.codeadd/ already exists. Overwrite with latest version?');
  }

  const selectedKeys = flags.providers ?? (await promptProviders(scope));
  const providers = resolveSelected(selectedKeys, scope);

  // gitignore is meaningful only for project installs (you don't gitignore your home dir).
  // --no-gitignore answers it; with no TTY and no flag the interactive default (on) is used.
  const addToGitignore = scope !== 'project' ? false : (flags.gitignore ?? (interactive ? await promptGitignore() : true));

  for (const p of providers) {
    const destDir = path.join(targetDir, p.dest);
    if (dirExists(destDir) && !flags.force) {
      await promptConfirm(`${p.dest}/ already exists. Overwrite?`);
    }
  }

  // Read BEFORE the overwrite. Without this the prior file list is lost and
  // any file the new release stopped shipping becomes invisible to every
  // future manifest diff — the install-path blind spot update never had.
  // readManifest returns null for both a missing and an unparseable manifest,
  // and null means "no prior list", therefore no prune.
  const priorManifest = readManifest(targetDir);

  s.start('Downloading...');
  const zipBuffer = await downloadReleaseAsset(installSource.downloadValue);
  s.stop('Downloaded.');

  s.start('Installing...');
  const zip = new AdmZip(zipBuffer);

  // Install copies everything: a reinstall overwrites even the preserved paths'
  // release counterparts. Update is the one that passes skipPreserved.
  const allFiles = copyRelease(zip, targetDir, providers, { skipPreserved: false });

  s.stop(`Installed ${allFiles.length} files.`);

  fixLineEndings(path.join(addDir, 'scripts'));

  // gitignore write still uses cwd deliberately — only meaningful for project scope (targetDir === cwd).
  if (scope === 'project' && addToGitignore) {
    writeGitignoreBlock(cwd, getInstalledDirs(selectedKeys));
    log.success('.gitignore updated.');
  }

  // Mirror of the update-path prune (updater.js): anything the prior install
  // wrote that this one did not is obsolete. Same shared preservation rules.
  if (priorManifest) {
    const removed = pruneObsolete(targetDir, priorManifest.files ?? [], allFiles);
    if (removed > 0) log.success(`Removed ${removed} obsolete file(s).`);
  }

  // A pristine project has nothing to migrate, so stamp the back-catalogue as
  // applied. An existing project keeps its ledger verbatim — baseline-stamping
  // it would erase migrations it still needs. readManifest() === null is the
  // only signal that authorises the stamp.
  const migrations = priorManifest ? (priorManifest.migrations ?? []) : allMigrationIds();

  // Features default to their registry defaults (no install-time prompt).
  // Users toggle post-install via `codeadd features enable|disable <name>`.
  // The feature flags are deltas on top of those defaults, so naming one feature never
  // switches the others off.
  const defaultFeatures = {};
  for (const [name, meta] of Object.entries(FEATURES)) {
    defaultFeatures[name] = meta.default;
  }
  Object.assign(defaultFeatures, requested.features);

  writeManifest(
    targetDir,
    installSource.manifestVersion,
    selectedKeys,
    allFiles,
    installSource.releaseTag,
    { source: installSource.source, ref: installSource.ref, channel: installSource.channel, scope, features: defaultFeatures, plugins: {}, gitignore: addToGitignore, migrations }
  );

  // Snapshot pristine provider files before composition. A v1 sidecar has no
  // slots, so this is a no-op until the source emits v2.
  const baselines = captureBaselines(targetDir);
  for (const w of baselines.warnings) log.warn(`${w.resource} ${w.slot} ${w.member}: ${w.reason}`);

  // Apply enabled features (inject fragment content into commands)
  const featuresApplied = applyEnabledFeatures(targetDir);
  if (featuresApplied > 0) {
    log.success(`Applied ${featuresApplied} feature injection(s).`);
  }

  log.info('The tdd-pipeline feature is enabled by default. Run `codeadd features` to adjust.');

  // Apply enabled plugins (disabled by default — no-op on fresh install)
  const plugins = applyEnabledPluginsDetailed(targetDir);
  if (plugins.modified > 0) {
    log.success(`Applied ${plugins.modified} plugin injection(s).`);
  }
  reportNotDetectedPlugins(plugins.notDetected);

  const enabledFeatures = Object.entries(defaultFeatures)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (enabledFeatures.length > 0) {
    log.info(`Features enabled: ${enabledFeatures.join(', ')}`);
    log.info('Toggle with: codeadd features enable|disable <name>');
  }

  // MCP registration, AFTER the manifest so a failed install leaves no config
  // entry pointing at a package that was never recorded as installed.
  reportMcpRegistration(
    writeMcpRegistration(targetDir, resolveSelected(selectedKeys, scope), installSource.manifestVersion.replace(/^v/, '')),
  );

  const providerList = selectedKeys.length > 0 ? selectedKeys.join(', ') : 'none (core only)';
  log.success(`Providers installed: ${providerList}`);

  // Requested plugins go through the same core `modify` uses, now that the manifest exists.
  // A plugin whose tool is missing fails the command AFTER everything above is on disk.
  if (Object.keys(requested.plugins ?? {}).length > 0) {
    const applied = await applyDesiredState(targetDir, { plugins: requested.plugins }, { force: true });
    assertPluginsEnabled(applied.pluginsNotEnabled);
  }

  outro(
    `ADD installed successfully!\n\n` +
      `Next steps:\n` +
      `  1. Open your AI editor and run: /add-help\n` +
      `  2. Ask what you want to build\n\n` +
      `Docs: https://github.com/brabos-ai/code-addiction`
  );
}

/**
 * Say which enabled plugins could not be applied because their tool is not
 * detected.
 *
 * Shared by install, update and modify so all three use one wording. (Install
 * calls it too, but a reinstall resets `plugins` to `{}` first, so today it has
 * nothing to report there; the call keeps the wording in one place.) A plugin
 * in this list stays enabled in the manifest; the line says it did not reach
 * ANY provider, not just a new one, because a recopy erases its old injections
 * too.
 *
 * @param {string[]} notDetected  plugin names from applyEnabledPluginsDetailed()
 */
export function reportNotDetectedPlugins(notDetected) {
  for (const name of notDetected) {
    log.warn(`plugin ${name} is enabled but not applied to any provider (tool not detected)`);
  }
}

/**
 * Report what the registration writer did, in the CLI's own voice.
 *
 * Shared with `update` so one install and one update say the same thing about
 * the same outcome. A provider whose config this does not write gets the exact
 * line printed — the `postEnableHint` floor both plugins already use, and the
 * degraded path rather than the default.
 *
 * @param {{results: object[], written: number, printed: number}} outcome
 */
export function reportMcpRegistration(outcome) {
  if (outcome.written > 0) {
    log.success(`Knowledge-graph MCP registered for ${outcome.written} provider(s).`);
  }
  for (const result of outcome.results) {
    if (result.status === 'print') {
      log.info(
        `${result.provider}: add this to ${result.file ?? 'your MCP configuration'} by hand —\n  ${result.line}`,
      );
    } else if (result.status === 'unreadable') {
      log.warn(
        `${result.provider}: ${result.file} could not be read and was left untouched. Add by hand —\n  ${result.line}`,
      );
    }
  }
}
