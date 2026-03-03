import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLatestTag,
  downloadZip,
  downloadTagZip,
  downloadBranchZip,
} from '../src/github.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('getLatestTag', () => {
  it('returns tag_name from GitHub API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ tag_name: 'v2.0.1' }),
    });

    const tag = await getLatestTag();
    expect(tag).toBe('v2.0.1');
  });

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(getLatestTag()).rejects.toThrow(
      'Could not reach GitHub. Check your connection.'
    );
  });

  it('throws on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getLatestTag()).rejects.toThrow('not found or has no releases');
  });

  it('throws on non-ok non-404 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getLatestTag()).rejects.toThrow('GitHub API error: 500');
  });
});

describe('downloadTagZip', () => {
  it('returns a Buffer on success', async () => {
    const fakeData = new Uint8Array([1, 2, 3, 4]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    const result = await downloadTagZip('v2.0.1');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(fakeData));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://github.com/xmaiconx/product-flow-factory/archive/refs/tags/v2.0.1.zip',
      expect.any(Object)
    );
  });

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(downloadTagZip('v2.0.1')).rejects.toThrow(
      'Could not reach GitHub. Check your connection.'
    );
  });

  it('throws on 404 with hint message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(downloadTagZip('v9.9.9')).rejects.toThrow(
      'Try without version for latest'
    );
  });
});

describe('downloadBranchZip', () => {
  it('returns a Buffer on success', async () => {
    const fakeData = new Uint8Array([8, 9, 10]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    const result = await downloadBranchZip('main');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(fakeData));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://github.com/xmaiconx/product-flow-factory/archive/refs/heads/main.zip',
      expect.any(Object)
    );
  });

  it('throws on 404 for missing branch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(downloadBranchZip('does-not-exist')).rejects.toThrow(
      'Branch does-not-exist not found.'
    );
  });
});

describe('downloadZip (alias)', () => {
  it('delegates to tag download', async () => {
    const fakeData = new Uint8Array([1, 1, 2, 3]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    const result = await downloadZip('v1.2.3');
    expect(result).toEqual(Buffer.from(fakeData));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://github.com/xmaiconx/product-flow-factory/archive/refs/tags/v1.2.3.zip',
      expect.any(Object)
    );
  });
});
