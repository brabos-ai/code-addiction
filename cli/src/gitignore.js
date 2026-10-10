import fs from 'node:fs';
import path from 'node:path';
import { PROVIDERS } from './providers.js';

const BLOCK_START = '# ADD - managed by code-addiction';
const BLOCK_END = '# END ADD';

// .codeadd/ holds the installed framework AND one committed file, board.json,
// which says where the project's board lives. git cannot re-include a file
// inside an ignored DIRECTORY, so the directory line becomes a contents line
// plus an exception.
const CODEADD_DIR_LINE = '.codeadd/';
const CODEADD_PAIR = ['.codeadd/*', '!.codeadd/board.json'];

/**
 * Get the list of directories to add to .gitignore.
 * Always includes the .codeadd pair (`.codeadd/*` + `!.codeadd/board.json`).
 * Adds provider dest dirs for each selected key.
 * @param {string[]} selectedKeys
 * @returns {string[]}
 */
export function getInstalledDirs(selectedKeys) {
  const dirs = new Set(CODEADD_PAIR);
  for (const key of selectedKeys) {
    if (PROVIDERS[key]) {
      const { dest, agentsDest } = PROVIDERS[key];
      dirs.add(dest.endsWith('/') ? dest : `${dest}/`);
      // Codex installs agents outside its main dest; ignore that root too.
      if (agentsDest) dirs.add(agentsDest.endsWith('/') ? agentsDest : `${agentsDest}/`);
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

  // A bare `.codeadd/` line, in the caller's list or left in the file by an
  // older install or a hand edit, is the same thing as the pair: write the pair
  // once and drop the bare line, which would hide board.json again.
  const wanted = [];
  for (const dir of dirs) {
    const lines = dir === CODEADD_DIR_LINE ? CODEADD_PAIR : [dir];
    for (const line of lines) if (!wanted.includes(line)) wanted.push(line);
  }
  const blockContent = [BLOCK_START, ...wanted, BLOCK_END].join('\n');

  const startIdx = existing.indexOf(BLOCK_START);
  const endIdx = existing.indexOf(BLOCK_END);

  const hasBlock = startIdx !== -1 && endIdx !== -1 && endIdx > startIdx;
  const dropBareLine = (text) =>
    text.split('\n').filter((line) => line.trim() !== CODEADD_DIR_LINE).join('\n');

  let newContent;
  if (hasBlock) {
    // Replace existing block in-place
    newContent =
      dropBareLine(existing.slice(0, startIdx)) +
      blockContent +
      dropBareLine(existing.slice(endIdx + BLOCK_END.length));
  } else {
    existing = dropBareLine(existing);
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
