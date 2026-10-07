import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  multiselect: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  log: { message: vi.fn(), info: vi.fn() },
}));

vi.mock('@clack/prompts', () => ({
  multiselect: mocks.multiselect,
  select: mocks.select,
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
  log: mocks.log,
}));

import {
  promptScope,
  promptProviders,
  promptExistingInstall,
  promptModify,
  promptApplyDiff,
} from '../src/prompt.js';

beforeEach(() => {
  mocks.multiselect.mockReset();
  mocks.select.mockReset();
  mocks.confirm.mockReset();
  mocks.log.message.mockReset();
  mocks.log.info.mockReset();
  mocks.isCancel.mockReset();
  mocks.isCancel.mockReturnValue(false);
});

describe('promptScope', () => {
  it('offers project and global, defaulting to project', async () => {
    mocks.select.mockResolvedValue('project');
    const result = await promptScope();
    expect(result).toBe('project');

    const callArgs = mocks.select.mock.calls[0][0];
    expect(callArgs.initialValue).toBe('project');
    expect(callArgs.options.map((o) => o.value).sort()).toEqual(['global', 'project']);
  });

  it('returns the chosen scope', async () => {
    mocks.select.mockResolvedValue('global');
    expect(await promptScope()).toBe('global');
  });

  it('throws USER_CANCEL when cancelled', async () => {
    mocks.select.mockResolvedValue(Symbol('cancel'));
    mocks.isCancel.mockReturnValue(true);
    await expect(promptScope()).rejects.toThrow('USER_CANCEL');
  });
});

describe('promptProviders (scope-filtered)', () => {
  it('project scope offers all six providers', async () => {
    mocks.multiselect.mockResolvedValue(['claude']);
    await promptProviders();
    const options = mocks.multiselect.mock.calls[0][0].options;
    expect(options.map((o) => o.value).sort()).toEqual(
      ['antigrav', 'claude', 'codex', 'cursor', 'opencode', 'zcode']
    );
  });

  it('global scope excludes cursor and antigrav', async () => {
    mocks.multiselect.mockResolvedValue(['claude']);
    await promptProviders('global');
    const options = mocks.multiselect.mock.calls[0][0].options;
    const values = options.map((o) => o.value);
    expect(values).not.toContain('cursor');
    expect(values).not.toContain('antigrav');
    expect(values.sort()).toEqual(['claude', 'codex', 'opencode', 'zcode']);
  });

  it('global scope hints show the home-rooted path', async () => {
    mocks.multiselect.mockResolvedValue(['opencode']);
    await promptProviders('global');
    const options = mocks.multiselect.mock.calls[0][0].options;
    const opencode = options.find((o) => o.value === 'opencode');
    expect(opencode.hint).toBe('~/.config/opencode/');
  });
});

// ---------------------------------------------------------------------------
// The prompts behind `modify` and the install menu (L1.5)
// ---------------------------------------------------------------------------
describe('promptExistingInstall (L1.5)', () => {
  const state = {
    version: '1.2.3',
    scope: 'project',
    providers: ['claude', 'cursor'],
    features: ['tdd-pipeline'],
    plugins: ['gitnexus'],
  };

  it('offers exactly modify, update, reinstall and cancel, defaulting to the safe one', async () => {
    mocks.select.mockResolvedValue('modify');

    await promptExistingInstall(state);

    const args = mocks.select.mock.calls[0][0];
    expect(args.options.map((o) => o.value)).toEqual(['modify', 'update', 'reinstall', 'cancel']);
    expect(args.initialValue).toBe('modify');
  });

  it('says what reinstall costs', async () => {
    mocks.select.mockResolvedValue('modify');
    await promptExistingInstall(state);
    const reinstall = mocks.select.mock.calls[0][0].options.find((o) => o.value === 'reinstall');
    expect(reinstall.label).toMatch(/loses features and plugins/);
  });

  it('prints the current state before asking', async () => {
    mocks.select.mockResolvedValue('modify');

    await promptExistingInstall(state);

    const printed = mocks.log.message.mock.calls.map((c) => c[0]).join('\n');
    for (const piece of ['1.2.3', 'project', 'claude, cursor', 'tdd-pipeline', 'gitnexus']) {
      expect(printed).toContain(piece);
    }
    expect(mocks.log.message.mock.invocationCallOrder[0]).toBeLessThan(mocks.select.mock.invocationCallOrder[0]);
  });

  it('shows "none" for an empty list rather than a blank', async () => {
    mocks.select.mockResolvedValue('cancel');
    await promptExistingInstall({ ...state, providers: [], features: [], plugins: [] });
    expect(mocks.log.message.mock.calls.map((c) => c[0]).join('\n')).toMatch(/Providers: none/);
  });

  it('returns the choice, and treats a cancelled prompt as cancel rather than throwing', async () => {
    mocks.select.mockResolvedValue('update');
    expect(await promptExistingInstall(state)).toBe('update');

    mocks.select.mockResolvedValue(Symbol('cancel'));
    mocks.isCancel.mockReturnValue(true);
    expect(await promptExistingInstall(state)).toBe('cancel');
  });
});

describe('promptModify (L1.5)', () => {
  const current = {
    providers: ['claude'],
    features: [
      { name: 'tdd-pipeline', description: 'TDD', enabled: true },
      { name: 'qa-pipeline', description: 'QA', enabled: false },
    ],
    plugins: [{ name: 'gx', description: 'graph', enabled: true }],
  };

  it('pre-fills three multiselects from the current state', async () => {
    mocks.multiselect
      .mockResolvedValueOnce(['claude'])
      .mockResolvedValueOnce(['tdd-pipeline'])
      .mockResolvedValueOnce(['gx']);

    await promptModify(current, 'project');

    const [providers, features, plugins] = mocks.multiselect.mock.calls.map((c) => c[0]);
    expect(providers.initialValues).toEqual(['claude']);
    expect(features.initialValues).toEqual(['tdd-pipeline']);
    expect(plugins.initialValues).toEqual(['gx']);
    expect(features.options.map((o) => o.value)).toEqual(['tdd-pipeline', 'qa-pipeline']);
  });

  it('returns the desired state as booleans for every feature and plugin offered', async () => {
    mocks.multiselect
      .mockResolvedValueOnce(['claude', 'cursor'])
      .mockResolvedValueOnce(['qa-pipeline'])
      .mockResolvedValueOnce([]);

    const desired = await promptModify(current, 'project');

    expect(desired).toEqual({
      providers: ['claude', 'cursor'],
      features: { 'tdd-pipeline': false, 'qa-pipeline': true },
      plugins: { gx: false },
    });
  });

  it('in global scope offers no cursor or antigrav', async () => {
    mocks.multiselect.mockResolvedValue([]);

    await promptModify(current, 'global');

    const values = mocks.multiselect.mock.calls[0][0].options.map((o) => o.value);
    expect(values).not.toContain('cursor');
    expect(values).not.toContain('antigrav');
    expect(values.sort()).toEqual(['claude', 'codex', 'opencode', 'zcode']);
  });

  it('skips the plugin question when the catalog is empty', async () => {
    mocks.multiselect.mockResolvedValueOnce(['claude']).mockResolvedValueOnce(['tdd-pipeline']);

    const desired = await promptModify({ ...current, plugins: [] }, 'project');

    expect(mocks.multiselect).toHaveBeenCalledTimes(2);
    expect(desired.plugins).toEqual({});
  });

  it('throws USER_CANCEL when any of the three is cancelled', async () => {
    mocks.multiselect.mockResolvedValueOnce(['claude']).mockResolvedValueOnce(Symbol('cancel'));
    mocks.isCancel.mockImplementation((v) => typeof v === 'symbol');

    await expect(promptModify(current, 'project')).rejects.toThrow('USER_CANCEL');
  });
});

describe('promptApplyDiff (L1.5)', () => {
  const diff = {
    providers: { add: ['cursor'], remove: ['codex'] },
    features: { enable: ['qa-pipeline'], disable: [] },
    plugins: { enable: [], disable: ['gx'] },
    isEmpty: false,
  };

  it('prints a + or - line for every change, then asks once and returns the answer', async () => {
    mocks.confirm.mockResolvedValue(true);

    expect(await promptApplyDiff(diff)).toBe(true);

    const printed = mocks.log.message.mock.calls.map((c) => c[0]).join('\n');
    for (const line of ['+ cursor', '- codex', '+ qa-pipeline', '- gx']) expect(printed).toContain(line);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  it('returns false when the user declines', async () => {
    mocks.confirm.mockResolvedValue(false);
    expect(await promptApplyDiff(diff)).toBe(false);
  });

  it('asks nothing and returns false when there is nothing to apply', async () => {
    const empty = {
      providers: { add: [], remove: [] },
      features: { enable: [], disable: [] },
      plugins: { enable: [], disable: [] },
      isEmpty: true,
    };

    expect(await promptApplyDiff(empty)).toBe(false);
    expect(mocks.confirm).not.toHaveBeenCalled();
  });

  it('throws USER_CANCEL when the confirmation is cancelled', async () => {
    mocks.confirm.mockResolvedValue(Symbol('cancel'));
    mocks.isCancel.mockImplementation((v) => typeof v === 'symbol');
    await expect(promptApplyDiff(diff)).rejects.toThrow('USER_CANCEL');
  });
});
