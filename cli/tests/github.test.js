import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLatestTag, downloadZip } from '../src/github.js';

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

describe('downloadZip', () => {
  it('returns a Buffer on success', async () => {
    const fakeData = new Uint8Array([1, 2, 3, 4]).buffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => fakeData,
    });

    const result = await downloadZip('v2.0.1');
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(fakeData));
  });

  it('throws on network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline'));

    await expect(downloadZip('v2.0.1')).rejects.toThrow(
      'Could not reach GitHub. Check your connection.'
    );
  });

  it('throws on 404 with hint message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(downloadZip('v9.9.9')).rejects.toThrow(
      'Try without version for latest'
    );
  });
});
