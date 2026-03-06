import { multiselect, confirm, isCancel } from '@clack/prompts';
import { PROVIDERS } from './providers.js';
import { FEATURES } from './features.js';

/**
 * Show interactive multi-select for AI providers.
 * Returns the selected provider keys.
 * Throws with message 'USER_CANCEL' if user cancels.
 * @returns {Promise<string[]>}
 */
export async function promptProviders() {
  const options = Object.entries(PROVIDERS).map(([value, { label, hint }]) => ({
    value,
    label,
    hint,
  }));

  const selected = await multiselect({
    message: 'Select AI providers to install',
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
