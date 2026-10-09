import fs from 'node:fs';
import path from 'node:path';
import { agentDest } from './providers.js';

/**
 * The copy pass and the obsolete-file prune that install, update and the
 * modify core all run. A leaf module on purpose: it imports only providers.js,
 * so installer.js, updater.js and modify.js can all import it without a cycle.
 */

/**
 * Paths that survive an overwrite. This is the single definition of "never
 * delete this" for install, update AND modify — installer.js re-exports it, and
 * updater.js imports it rather than keeping a copy, because two definitions
 * will diverge and the one that diverges deletes someone's session history.
 */
export const PRESERVE_PATTERNS = [/\/history\//, /\.local\.json$/, /(^|\/)\.codeadd\/baselines\//];

/**
 * @param {string} relPath  path relative to the install root
 * @returns {boolean}
 */
export function shouldPreserve(relPath) {
  return PRESERVE_PATTERNS.some((p) => p.test(relPath));
}

/**
 * Copy entries from the release zip that match a source prefix to a destination
 * directory. The release asset zip uses `framwork/` prefix (e.g.
 * "framwork/.claude/commands/add-help.md").
 *
 * @param {import('adm-zip')} zip
 * @param {string} srcPrefix  path inside zip (e.g. "framwork/.codeadd")
 * @param {string} destDir    absolute destination directory
 * @param {string} cwd        install root the returned paths are relative to
 * @param {boolean} skipPreserved  leave PRESERVE_PATTERNS matches untouched
 * @returns {string[]} relative paths (from cwd) of files copied
 */
function copyFromZip(zip, srcPrefix, destDir, cwd, skipPreserved) {
  const copied = [];
  const prefix = `${srcPrefix}/`;

  for (const entry of zip.getEntries()) {
    if (!entry.entryName.startsWith(prefix)) continue;
    if (entry.isDirectory) continue;

    const relativeToDest = entry.entryName.slice(prefix.length);
    if (!relativeToDest) continue;

    if (skipPreserved && shouldPreserve(relativeToDest)) continue;

    const destFile = path.join(destDir, relativeToDest);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.writeFileSync(destFile, entry.getData());

    copied.push(path.relative(cwd, destFile).replace(/\\/g, '/'));
  }

  return copied;
}

/**
 * Copy `.codeadd/` and every given provider out of the release zip.
 *
 * `skipPreserved` is the one place install and update differ: install copies
 * everything, update leaves PRESERVE_PATTERNS matches alone. Each keeps its
 * current behaviour by passing its own value.
 *
 * @param {import('adm-zip')} zip
 * @param {string} targetDir  install root (project dir or home dir)
 * @param {{src: string, dest: string, agentsSrc?: string, agentsDest?: string}[]} providers  resolveSelected() entries
 * @param {{skipPreserved?: boolean}} [options]
 * @returns {string[]} relative paths written
 */
export function copyRelease(zip, targetDir, providers, { skipPreserved = false } = {}) {
  const written = [];

  written.push(...copyFromZip(zip, 'framwork/.codeadd', path.join(targetDir, '.codeadd'), targetDir, skipPreserved));

  for (const p of providers) {
    written.push(...copyFromZip(zip, p.src, path.join(targetDir, p.dest), targetDir, skipPreserved));

    // A provider whose agents live outside its main root (Codex: skills under
    // .agents/, agents under .codex/agents/) needs a second copy pass.
    if (p.agentsSrc) {
      written.push(...copyFromZip(zip, p.agentsSrc, path.join(targetDir, agentDest(p)), targetDir, skipPreserved));
    }
  }

  return written;
}

/**
 * Delete every file the prior install wrote that this one did not.
 *
 * @param {string} targetDir
 * @param {string[]} priorFiles    the previous manifest's `files`
 * @param {string[]|Set<string>} writtenFiles  what the copy just wrote
 * @returns {number} files removed
 */
export function pruneObsolete(targetDir, priorFiles, writtenFiles) {
  const written = writtenFiles instanceof Set ? writtenFiles : new Set(writtenFiles);
  let removed = 0;
  for (const old of priorFiles ?? []) {
    if (written.has(old) || shouldPreserve(old)) continue;
    try {
      const full = path.join(targetDir, old);
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        removed++;
      }
    } catch {
      // A file we cannot remove is not worth failing an install over.
    }
  }
  return removed;
}
