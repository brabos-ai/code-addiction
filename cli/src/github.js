const REPO = 'brabos-ai/code-addiction';
const API_BASE = 'https://api.github.com';

/**
 * Fetch the latest release tag from GitHub API.
 * @param {string} [repo]
 * @returns {Promise<string>} tag name, e.g. "v2.0.1"
 */
export async function getLatestTag(repo = REPO) {
  const url = `${API_BASE}/repos/${repo}/releases/latest`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'add-cli',
    },
  }).catch(() => {
    throw new Error('Could not reach GitHub. Check your connection.');
  });

  if (res.status === 404) {
    throw new Error(`Repository ${repo} not found or has no releases.`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.tag_name;
}

/**
 * Fetch the latest prerelease tag from GitHub API.
 * Lists recent releases and returns the first one marked as prerelease.
 * @param {string} [repo]
 * @returns {Promise<string>} tag name, e.g. "v0.3.0-beta.1"
 */
export async function getLatestPrerelease(repo = REPO) {
  const url = `${API_BASE}/repos/${repo}/releases?per_page=20`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'add-cli',
    },
  }).catch(() => {
    throw new Error('Could not reach GitHub. Check your connection.');
  });

  if (res.status === 404) {
    throw new Error(`Repository ${repo} not found or has no releases.`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const releases = await res.json();
  const prerelease = releases.find((r) => r.prerelease);
  if (!prerelease) {
    throw new Error('No beta releases found. Install a stable version or specify a version with --version.');
  }

  return prerelease.tag_name;
}

/**
 * Download the framework release asset ZIP for a given tag.
 * Asset URL: https://github.com/{repo}/releases/download/{tag}/code-addiction-{tag}.zip
 * @param {string} tag  e.g. "v2.0.1"
 * @param {string} [repo]
 * @returns {Promise<Buffer>}
 */
export async function downloadReleaseAsset(tag, repo = REPO) {
  const version = tag.startsWith('v') ? tag : `v${tag}`;
  const assetName = `code-addiction-${version}.zip`;
  const url = `https://github.com/${repo}/releases/download/${version}/${assetName}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'add-cli' },
  }).catch(() => {
    throw new Error('Could not reach GitHub. Check your connection.');
  });

  if (res.status === 404) {
    throw new Error(
      `Release asset for ${tag} not found. Try without version for latest.`
    );
  }
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
