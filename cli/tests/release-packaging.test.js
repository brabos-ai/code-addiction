import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Release packaging guard.
 *
 * The release ZIP is assembled by the "Package framework zip" step in
 * .github/workflows/release.yml via a `for subdir in <list>; do ... zip` loop.
 * Only the directories named in that list ship to users. The installer then
 * copies everything under `framwork/.codeadd/` from the ZIP, so any post-install
 * runtime asset dir under `.codeadd/` that is omitted from the packaging list is
 * silently never delivered.
 *
 * Regression: `.codeadd/plugins` was missing from the list, so `plugins enable`
 * found no fragments/skills and no-op'd (0 commands, 0 skills). This locks the
 * runtime `.codeadd/*` dirs into the packaging list.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const RELEASE_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release.yml');
const CATALOG = path.join(ROOT, 'cli', 'src', 'plugins.json');

/**
 * Extract the token list from the packaging `for subdir in <list>; do` loop.
 * @returns {string[]}
 */
function packagedSubdirs() {
  const yml = fs.readFileSync(RELEASE_WORKFLOW, 'utf8');
  const match = yml.match(/for subdir in ([^;]+); do/);
  if (!match) throw new Error('packaging loop `for subdir in ...; do` not found in release.yml');
  return match[1].trim().split(/\s+/);
}

describe('release packaging', () => {
  it('ships every post-install runtime .codeadd/* dir', () => {
    const subdirs = packagedSubdirs();
    // These hold assets consumed AFTER install (not build-source compiled into
    // provider dirs). Each must be in the ZIP or the feature breaks at runtime.
    for (const required of ['.codeadd/scripts', '.codeadd/fragments', '.codeadd/templates', '.codeadd/plugins']) {
      expect(subdirs, `release.yml packaging list missing ${required}`).toContain(required);
    }
  });

  it('ships .codeadd/plugins whenever the catalog defines plugins', () => {
    const raw = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
    const { '$schema-doc': _doc, ...plugins } = raw;
    if (Object.keys(plugins).length === 0) return; // no plugins → nothing to ship
    expect(packagedSubdirs()).toContain('.codeadd/plugins');
  });

  it('ships the contracts.json sidecar (setup-shape for status.sh)', () => {
    // Gitignored + build-emitted like injection-points.json, so the directory list
    // never sweeps it up and it must be added to the zip explicitly. Without it,
    // every SETUP_QA_STALE check in every installed project is permanently blind.
    const yml = fs.readFileSync(RELEASE_WORKFLOW, 'utf8');
    expect(yml).toContain('framwork/.codeadd/contracts.json');
  });

  it('ships the injection-points.json sidecar (anchors for post-install injection)', () => {
    // The sidecar is a single file (not a subdir), so it must be added to the
    // zip explicitly. Without it, every feature/plugin enable becomes a no-op.
    const yml = fs.readFileSync(RELEASE_WORKFLOW, 'utf8');
    expect(yml).toContain('framwork/.codeadd/injection-points.json');
  });
});
