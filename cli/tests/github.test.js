import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLatestTag,
  getLatestPrerelease,
  downloadReleaseAsset,
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

describe('getLatestPrerelease', () => {
  it('returns tag_name of the first prerelease', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { tag_name: 'v0.3.0', prerelease: false },
        { tag_name: 'v0.4.0-beta.2', prerelease: true },
        { tag_name: 'v0.4.0-beta.1', prerelease: true },
      ],
    });

    const tag = await getLatestPrerelease();
    expect(tag).toBe('v0.4.0-beta.2');
  });

  it('throws when no prereleases exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { tag_name: 'v0.3.0', prerelease: false },
      ],
    });

    await expect(getLatestPrerelease()).rejects.toThrow('No beta releases found');
  });

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    await expect(getLatestPrerelease()).rejects.toThrow(
      'Could not reach GitHub. Check your connection.'
    );
  });

  it('throws on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getLatestPrerelease()).rejects.toThrow('not found or has no releases');
  });

  it('throws on non-ok non-404 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getLatestPrerelease()).rejects.toThrow('GitHub API error: 500');
  });
});

describe('downloadReleaseAsset', () => {
  it('returns a Buffer on success', async () => {
    const fakeData = new Uint8Array([1, 2, 3, 4]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    const result = await downloadReleaseAsset('v2.0.1');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(fakeData));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://github.com/brabos-ai/code-addiction/releases/download/v2.0.1/code-addiction-v2.0.1.zip',
      expect.any(Object)
    );
  });

  it('normalizes tag without v prefix', async () => {
    const fakeData = new Uint8Array([1, 2]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    await downloadReleaseAsset('2.0.1');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://github.com/brabos-ai/code-addiction/releases/download/v2.0.1/code-addiction-v2.0.1.zip',
      expect.any(Object)
    );
  });

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(downloadReleaseAsset('v2.0.1')).rejects.toThrow(
      'Could not reach GitHub. Check your connection.'
    );
  });

  it('throws on 404 with hint message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(downloadReleaseAsset('v9.9.9')).rejects.toThrow(
      'Try without version for latest'
    );
  });

  it('throws on non-ok non-404 status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(downloadReleaseAsset('v2.0.1')).rejects.toThrow(
      'Download failed: 500'
    );
  });
});
