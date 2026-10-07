import { multiselect, select, confirm, isCancel, log } from '@clack/prompts';
import { PROVIDERS, PROVIDER_PRIORITY, globalCapable } from './providers.js';
import { FEATURES } from './features.js';

/**
 * Ask the user to choose install scope. Defaults to 'project' (backward-compatible).
 * Throws 'USER_CANCEL' if cancelled.
 * @returns {Promise<'project'|'global'>}
 */
export async function promptScope() {
  const scope = await select({
    message: 'Install scope',
    options: [
      { value: 'project', label: 'Project', hint: 'this repo only (.codeadd/, .claude/ …)' },
      { value: 'global', label: 'User (global)', hint: 'all projects (~/.codeadd/, ~/.claude/ …)' },
    ],
    initialValue: 'project',
  });
  if (isCancel(scope)) {
    throw new Error('USER_CANCEL');
  }
  return scope;
}

/**
 * The providers a scope offers, priority ones first and the rest alphabetical.
 * In global scope a provider with no global dest is not offered at all.
 * @param {'project'|'global'} scope
 * @returns {{value: string, label: string, hint: string}[]}
 */
function providerOptions(scope) {
  const prioritySet = new Set(PROVIDER_PRIORITY);
  const orderedKeys = [
    ...PROVIDER_PRIORITY.filter((k) => PROVIDERS[k]),
    ...Object.keys(PROVIDERS).filter((k) => !prioritySet.has(k)).sort(),
  ].filter((k) => (scope === 'global' ? globalCapable(k) : true));

  return orderedKeys.map((value) => ({
    value,
    label: PROVIDERS[value].label,
    hint: scope === 'global' ? `~/${PROVIDERS[value].globalDest}/` : PROVIDERS[value].hint,
  }));
}

/**
 * Show interactive multi-select for AI providers.
 * Priority providers appear first; remaining sorted alphabetically.
 * In global scope, providers without a global dest are filtered out.
 * Returns the selected provider keys.
 * Throws with message 'USER_CANCEL' if user cancels.
 * @param {'project'|'global'} [scope]
 * @returns {Promise<string[]>}
 */
export async function promptProviders(scope = 'project') {
  const options = providerOptions(scope);

  const selected = await multiselect({
    message: scope === 'global' ? 'Select AI providers to install globally' : 'Select AI providers to install',
    options,
    initialValues: ['claude'],
    required: false,
  });

  if (isCancel(selected)) {
    throw new Error('USER_CANCEL');
  }

  return selected;
}

/**
 * Show interactive multi-select for optional features.
 * Returns the selected feature names.
 * @param {string[]} [initialValues] - pre-selected feature names (defaults to features with default: true)
 * @returns {Promise<string[]>}
 */
export async function promptFeatures(initialValues) {
  const defaults = initialValues ?? Object.entries(FEATURES)
    .filter(([, meta]) => meta.default)
    .map(([name]) => name);

  const options = Object.entries(FEATURES).map(([value, { description }]) => ({
    value,
    label: `${value} — ${description}`,
  }));

  const selected = await multiselect({
    message: 'Select features to enable',
    options,
    initialValues: defaults,
    required: false,
  });

  if (isCancel(selected)) {
    throw new Error('USER_CANCEL');
  }

  return selected;
}

/**
 * Ask the user which install to remove when both project and global are found.
 * Throws 'USER_CANCEL' if cancelled.
 * @returns {Promise<'project'|'global'|'both'>}
 */
export async function promptUninstallScope() {
  const choice = await select({
    message: 'Which installation to remove?',
    options: [
      { value: 'project', label: 'Project', hint: 'this repo (.codeadd/, .claude/ …)' },
      { value: 'global', label: 'User (global)', hint: 'all projects (~/.codeadd/, ~/.claude/ …)' },
      { value: 'both', label: 'Both', hint: 'remove project and user installs' },
    ],
  });
  if (isCancel(choice)) {
    throw new Error('USER_CANCEL');
  }
  return choice;
}

/**
 * Ask user to confirm an action.
 * Throws with message 'USER_CANCEL' if user cancels or declines.
 * @param {string} message
 * @returns {Promise<void>}
 */
export async function promptConfirm(message) {
  const ok = await confirm({ message });

  if (isCancel(ok) || !ok) {
    throw new Error('USER_CANCEL');
  }
}

/**
 * Ask user whether to add installed directories to .gitignore.
 * Returns boolean. Defaults to true (opt-out model).
 * Throws with message 'USER_CANCEL' if user cancels.
 * @returns {Promise<boolean>}
 */
export async function promptGitignore() {
  const result = await confirm({
    message: 'Add installed directories to .gitignore?',
    initialValue: true,
  });

  if (isCancel(result)) {
    throw new Error('USER_CANCEL');
  }

  return result;
}

const list = (items) => (items.length > 0 ? items.join(', ') : 'none');

/**
 * Show an existing installation and ask what to do with it.
 *
 * The state is printed BEFORE the question, so the user sees what a reinstall
 * would cost before choosing it. A cancelled prompt is `cancel`, not an error:
 * every outcome of this prompt writes nothing until the caller acts on it.
 *
 * @param {{version: string, scope: string, providers: string[], features: string[], plugins: string[]}} state
 * @returns {Promise<'modify'|'update'|'reinstall'|'cancel'>}
 */
export async function promptExistingInstall(state) {
  log.message(
    [
      'ADD is already installed here.',
      `Version: ${state.version}`,
      `Scope: ${state.scope}`,
      `Providers: ${list(state.providers)}`,
      `Features: ${list(state.features)}`,
      `Plugins: ${list(state.plugins)}`,
    ].join('\n'),
  );

  const choice = await select({
    message: 'What do you want to do?',
    options: [
      { value: 'modify', label: 'Modify (keep everything)', hint: 'add or remove providers, toggle features and plugins' },
      { value: 'update', label: 'Update to the latest version (keep everything)' },
      { value: 'reinstall', label: 'Reinstall from scratch (loses features and plugins)' },
      { value: 'cancel', label: 'Cancel' },
    ],
    initialValue: 'modify',
  });
  return isCancel(choice) ? 'cancel' : choice;
}

/**
 * Edit an installation: three multiselects pre-filled from what is installed.
 * Returns the desired state — a boolean for EVERY feature and plugin offered —
 * for `diffState` to compare. The prompt reads nothing itself; the caller
 * passes the current state in.
 *
 * @param {{
 *   providers: string[],
 *   features: {name: string, description: string, enabled: boolean}[],
 *   plugins: {name: string, description: string, enabled: boolean}[]
 * }} current
 * @param {'project'|'global'} [scope]
 * @returns {Promise<{providers: string[], features: Record<string, boolean>, plugins: Record<string, boolean>}>}
 */
export async function promptModify(current, scope = 'project') {
  const offered = providerOptions(scope);
  const providers = await multiselect({
    message: 'Providers',
    options: offered,
    initialValues: current.providers.filter((key) => offered.some((o) => o.value === key)),
    required: false,
  });
  if (isCancel(providers)) throw new Error('USER_CANCEL');

  const toggles = async (message, items) => {
    if (items.length === 0) return {};
    const selected = await multiselect({
      message,
      options: items.map(({ name, description }) => ({ value: name, label: `${name} — ${description}` })),
      initialValues: items.filter((i) => i.enabled).map((i) => i.name),
      required: false,
    });
    if (isCancel(selected)) throw new Error('USER_CANCEL');
    return Object.fromEntries(items.map(({ name }) => [name, selected.includes(name)]));
  };

  const features = await toggles('Features', current.features);
  const plugins = await toggles('Plugins', current.plugins);
  return { providers, features, plugins };
}

/**
 * Print what a modify run would change and ask once whether to apply it.
 * Nothing to change asks nothing. Declining returns false; only a cancelled
 * prompt throws.
 *
 * @param {{providers: {add: string[], remove: string[]}, features: {enable: string[], disable: string[]}, plugins: {enable: string[], disable: string[]}, isEmpty: boolean}} diff
 * @returns {Promise<boolean>}
 */
export async function promptApplyDiff(diff) {
  if (diff.isEmpty) {
    log.message('Nothing to change.');
    return false;
  }

  const lines = [
    ...diff.providers.add.map((n) => `+ ${n} (provider)`),
    ...diff.providers.remove.map((n) => `- ${n} (provider)`),
    ...diff.features.enable.map((n) => `+ ${n} (feature)`),
    ...diff.features.disable.map((n) => `- ${n} (feature)`),
    ...diff.plugins.enable.map((n) => `+ ${n} (plugin)`),
    ...diff.plugins.disable.map((n) => `- ${n} (plugin)`),
  ];
  log.message(lines.join('\n'));
  if (diff.providers.add.length > 0) {
    log.info('Adding a provider re-copies every provider from the installed release; local edits to provider files are overwritten.');
  }
  if (diff.providers.remove.length > 0) {
    log.info("A removed provider's files are deleted from this project.");
  }

  const ok = await confirm({ message: 'Apply these changes?' });
  if (isCancel(ok)) throw new Error('USER_CANCEL');
  return ok === true;
}
