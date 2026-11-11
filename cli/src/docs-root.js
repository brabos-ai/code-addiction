import { createRequire } from 'node:module';
import path from 'node:path';

/**
 * The CLI's one door to the docs root: it loads the module the install wrote to
 * `<target>/.codeadd/scripts/` and holds no root of its own. A second copy of the
 * root in CLI source is how the CLI and the scripts would come to disagree about
 * where a doc lives.
 *
 * A target without that module has no docs root to resolve, so this throws the
 * explicit error — it never names another location.
 */
const nodeRequire = createRequire(import.meta.url);

/** The installed resolver module for `cwd`. @returns {object} its exports */
export function loadDocsRoot(cwd) {
  const file = path.join(cwd, '.codeadd', 'scripts', 'docs-root.cjs');
  try {
    return nodeRequire(file);
  } catch (err) {
    throw new Error(
      `DOCS_ROOT_MISSING: ${file} is not installed — run codeadd install or update first (${err.code || err.message})`,
    );
  }
}

/** Absolute docs root of the project at `cwd`; existence is not checked. */
export function docsRootOf(cwd) {
  return loadDocsRoot(cwd).docsRoot(cwd);
}

/** The installed git helper for `cwd` (prepare, commit, push, link). */
export function loadDocsBranch(cwd) {
  const file = path.join(cwd, '.codeadd', 'scripts', 'docs-branch.cjs');
  try {
    return nodeRequire(file);
  } catch (err) {
    throw new Error(`DOCS_ROOT_MISSING: ${file} is not installed — run codeadd install or update first (${err.code || err.message})`);
  }
}

/** The installed docs-guard module for `cwd`. */
export function loadDocsGuard(cwd) {
  const file = path.join(cwd, '.codeadd', 'scripts', 'docs-guard.cjs');
  try {
    return nodeRequire(file);
  } catch (err) {
    throw new Error(`DOCS_ROOT_MISSING: ${file} is not installed — run codeadd install or update first (${err.code || err.message})`);
  }
}

/**
 * Forget the installed docs modules this process already loaded. An update replaces them on
 * disk; without this the migrations and the re-prepare would still run the previous version's code.
 */
export function resetDocsModules(cwd) {
  for (const name of ['docs-root.cjs', 'docs-branch.cjs', 'docs-guard.cjs']) {
    delete nodeRequire.cache[path.join(cwd, '.codeadd', 'scripts', name)];
  }
}
