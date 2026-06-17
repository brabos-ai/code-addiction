import { multiselect, select, confirm, isCancel } from '@clack/prompts';
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
 * Show interactive multi-select for AI providers.
 * Priority providers appear first; remaining sorted alphabetically.
 * In global scope, providers without a global dest are filtered out.
 * Returns the selected provider keys.
 * Throws with message 'USER_CANCEL' if user cancels.
 * @param {'project'|'global'} [scope]
 * @returns {Promise<string[]>}
 */
export async function promptProviders(scope = 'project') {
  const prioritySet = new Set(PROVIDER_PRIORITY);
  const orderedKeys = [
    ...PROVIDER_PRIORITY.filter((k) => PROVIDERS[k]),
    ...Object.keys(PROVIDERS).filter((k) => !prioritySet.has(k)).sort(),
  ].filter((k) => (scope === 'global' ? globalCapable(k) : true));

  const options = orderedKeys.map((value) => ({
    value,
    label: PROVIDERS[value].label,
    hint: scope === 'global' ? `~/${PROVIDERS[value].globalDest}/` : PROVIDERS[value].hint,
  }));

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
