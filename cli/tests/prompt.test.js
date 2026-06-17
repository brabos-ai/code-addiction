import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  multiselect: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

vi.mock('@clack/prompts', () => ({
  multiselect: mocks.multiselect,
  select: mocks.select,
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
}));

import { promptScope, promptProviders } from '../src/prompt.js';

beforeEach(() => {
  mocks.multiselect.mockReset();
  mocks.select.mockReset();
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
  it('project scope offers all five providers', async () => {
    mocks.multiselect.mockResolvedValue(['claude']);
    await promptProviders();
    const options = mocks.multiselect.mock.calls[0][0].options;
    expect(options.map((o) => o.value).sort()).toEqual(
      ['antigrav', 'claude', 'codex', 'cursor', 'opencode']
    );
  });

  it('global scope excludes cursor and antigrav', async () => {
    mocks.multiselect.mockResolvedValue(['claude']);
    await promptProviders('global');
    const options = mocks.multiselect.mock.calls[0][0].options;
    const values = options.map((o) => o.value);
    expect(values).not.toContain('cursor');
    expect(values).not.toContain('antigrav');
    expect(values.sort()).toEqual(['claude', 'codex', 'opencode']);
  });

  it('global scope hints show the home-rooted path', async () => {
    mocks.multiselect.mockResolvedValue(['opencode']);
    await promptProviders('global');
    const options = mocks.multiselect.mock.calls[0][0].options;
    const opencode = options.find((o) => o.value === 'opencode');
    expect(opencode.hint).toBe('~/.config/opencode/');
  });
});
