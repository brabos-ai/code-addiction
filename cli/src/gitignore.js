import fs from 'node:fs';
import path from 'node:path';
import { PROVIDERS } from './providers.js';

const BLOCK_START = '# ADD - managed by code-addiction';
const BLOCK_END = '# END ADD';

/**
 * Get the list of directories to add to .gitignore.
 * Always includes .codeadd/. Adds provider dest dirs for each selected key.
 * @param {string[]} selectedKeys
 * @returns {string[]}
 */
export function getInstalledDirs(selectedKeys) {
  const dirs = new Set(['.codeadd/']);
  for (const key of selectedKeys) {
    if (PROVIDERS[key]) {
      const dest = PROVIDERS[key].dest;
      dirs.add(dest.endsWith('/') ? dest : `${dest}/`);
    }
  }
  return [...dirs];
}

/**
 * Write or update the ADD-managed block in .gitignore.
 * Creates .gitignore if it doesn't exist.
 * Only operates inside the # ADD ... # END ADD block.
 * Entries outside the block are not touched.
 * @param {string} cwd
 * @param {string[]} dirs
 */
export function writeGitignoreBlock(cwd, dirs) {
  const gitignorePath = path.join(cwd, '.gitignore');

  let existing = '';
  if (fs.existsSync(gitignorePath)) {
    existing = fs.readFileSync(gitignorePath, 'utf8');
  }

  const blockContent = [BLOCK_START, ...dirs, BLOCK_END].join('\n');

  const startIdx = existing.indexOf(BLOCK_START);
  const endIdx = existing.indexOf(BLOCK_END);

  let newContent;
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing block in-place
    newContent =
      existing.slice(0, startIdx) +
      blockContent +
      existing.slice(endIdx + BLOCK_END.length);
  } else {
    // Append block to end of file
    const trailingNewlines = existing.length === 0 ? '' : existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
    newContent = existing + trailingNewlines + blockContent + '\n';
  }

  fs.writeFileSync(gitignorePath, newContent, 'utf8');
}

/**
 * Remove the ADD-managed block from .gitignore if present.
 * Leaves user content outside the block untouched.
 * Deletes .gitignore if the file becomes empty after removal.
 * @param {string} cwd
 */
export function removeGitignoreBlock(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return;

  const existing = fs.readFileSync(gitignorePath, 'utf8');
  const blockRegex = new RegExp(
    `(?:^|\\n)${escapeRegex(BLOCK_START)}\\n[\\s\\S]*?\\n${escapeRegex(BLOCK_END)}\\n?`,
    'm'
  );

  if (!blockRegex.test(existing)) return;

  const updated = existing
    .replace(blockRegex, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (updated.length === 0) {
    fs.unlinkSync(gitignorePath);
    return;
  }

  fs.writeFileSync(gitignorePath, `${updated}\n`, 'utf8');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
