/**
 * THE TYPE REGISTRY — the single declaration of what a document is.
 *
 * ⛔ THIS FILE IS THE SOURCE OF TRUTH FOR `mcp/reference.md`.
 *    `renderTypeTable()` and `renderRelationTable()` below emit that document's
 *    tables. A hand-copied table drifts from its source and the drift is
 *    invisible until the two disagree — which is what this whole registry
 *    exists to stop. `cli/tests/mcp-document-model.test.js` L4.1 asserts the
 *    reference contains exactly what these functions emit.
 *
 * WHAT IT REPLACED, AND WHY: `classify()` used to decide whether a document was
 * an indexable node by testing whether its `type` string ended in `-about`. A
 * naming convention was doing a type system's job. Measured consequences, each
 * against a fixture: every `how-to` and `explanation` wiki page was dropped
 * (the command writes three Diátaxis types, the indexer knew one); a typo in a
 * type name became an attachment; and four document kinds that are plainly
 * things you look up were demoted because their names did not end in `-about`.
 *
 * ⛔ NO DEPENDENCIES, `yaml` INCLUDED. `--corpus=artefacts` runs from the
 *    repository root, where the CLI's `node_modules` is off the resolution
 *    path. `.mjs` because the root is CommonJS and `cli/` is ESM.
 */

/**
 * The three roles a document can play in the graph.
 *
 * These are the values the engine emits as `kind` and accepts as the `kind`
 * filter on `search` and `orphans`. Declaring them here is what the suffix test
 * was badly imitating: the engine already SAID `kind` on the way out while
 * guessing it on the way in.
 */
export const KINDS = ['work-item', 'page', 'attachment'];

/**
 * How an attachment finds the work item it belongs to.
 *
 * Declared per type, never attempted in sequence. The old loader tried the
 * directory, then a `part_of` line, then `related:`, in an order written
 * nowhere — so one message, `attachment resolves to no work item`, covered
 * three different failures and a reader could not tell which had happened.
 */
export const OWNER_MODES = {
  dir: 'the work item whose `*-about` document sits in the same directory',
  related: 'the first id in `## Relations` or `related:` that resolves to a work item',
};

/** The root a page must live under to be one. */
export const WIKI_ROOT = '.codeadd/wiki';

/**
 * Every type this framework writes.
 *
 * `requires` lists the frontmatter keys a document of that type must carry.
 * `id` is on every entry rather than assumed: a page used to be identified by
 * its file path, which broke the moment anyone moved it — the same reason the
 * delivery index treats an item's `at` as a hint and never as identity.
 *
 * ⛔ A TYPE ABSENT FROM THIS TABLE IS NOT DROPPED. A document may declare
 *    `kind:` in its own frontmatter and it then counts, whatever its type. That
 *    is deliberate and it is OKF's rule: "consumers MUST NOT reject a bundle
 *    because of ... unknown `type` values". A project names its own document
 *    types and this framework does not maintain an eternal list of them. A type
 *    that is in neither place is REPORTED, by name, never silently demoted.
 */
export const TYPES = {
  // ---- work items: a thing you look up -----------------------------------
  feature: { kind: 'work-item', requires: ['id', 'slug', 'status'] },
  hotfix: { kind: 'work-item', requires: ['id', 'severity'] },
  prd: { kind: 'work-item', requires: ['id'] },
  brainstorm: { kind: 'work-item', requires: ['id'] },
  'audit-report': { kind: 'work-item', requires: ['id'] },
  'diagnose-report': { kind: 'work-item', requires: ['id'] },
  'setup-receipt': { kind: 'work-item', requires: ['id'] },

  // ---- attachments: an annex, returned on its owner and never alone -------
  'feature-plan': { kind: 'attachment', owner: 'dir', requires: ['id'] },
  'feature-design': { kind: 'attachment', owner: 'dir', requires: ['id'] },
  epic: { kind: 'attachment', owner: 'dir', requires: ['id'] },
  review: { kind: 'attachment', owner: 'dir', requires: ['id'] },
  'qa-validation': { kind: 'attachment', owner: 'dir', requires: ['id'] },
  changelog: { kind: 'attachment', owner: 'related', requires: ['id'] },

  // ---- pages: the four Diátaxis types, all of them ------------------------
  tutorial: { kind: 'page', root: WIKI_ROOT, requires: ['id'] },
  'how-to': { kind: 'page', root: WIKI_ROOT, requires: ['id'] },
  reference: { kind: 'page', root: WIKI_ROOT, requires: ['id'] },
  explanation: { kind: 'page', root: WIKI_ROOT, requires: ['id'] },
};

/**
 * The relation vocabulary, and the published term each one is.
 *
 * Four of the five are DCMI Metadata Terms with the same meaning. The names are
 * NOT renamed to the DCMI spellings: renaming rewrites every document already
 * written to buy interoperability with a consumer that does not exist, and
 * `depends_on` reads better to an agent than `requires`. Declaring the mapping
 * is what makes the graph exportable without a migration.
 */
export const RELATIONS = {
  caused_by: { dcmi: null, note: 'local extension; nearest published term is `prov:wasInfluencedBy`' },
  depends_on: { dcmi: 'dcterms:requires', note: 'the described resource requires the referenced one to function' },
  part_of: { dcmi: 'dcterms:isPartOf', note: 'a related resource in which the described resource is included' },
  links_to: { dcmi: 'dcterms:references', note: 'the described resource points to the referenced one' },
  superseded_by: { dcmi: 'dcterms:isReplacedBy', note: 'a related resource that supplants or supersedes this one' },
};

/**
 * Resolve a type to its registry entry, or `null` when it is not declared.
 * @param {string} type
 */
export function lookup(type) {
  return Object.prototype.hasOwnProperty.call(TYPES, type) ? TYPES[type] : null;
}

/** Every declared type of one kind, sorted. @param {string} kind */
export function typesOfKind(kind) {
  return Object.keys(TYPES).filter((t) => TYPES[t].kind === kind).sort();
}

const cell = (v) => (v ? `\`${v}\`` : '—');

/**
 * The registry as a markdown table. `mcp/reference.md` contains this verbatim.
 * @returns {string}
 */
export function renderTypeTable() {
  const rows = KINDS.flatMap((kind) =>
    typesOfKind(kind).map((type) => {
      const e = TYPES[type];
      return `| \`${type}\` | \`${kind}\` | ${cell(e.owner)} | ${cell(e.root)} | ${e.requires
        .map((r) => `\`${r}\``)
        .join(', ')} |`;
    }),
  );
  return [
    '| `type:` | `kind` | owner mode | root | required frontmatter |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

/**
 * The relation vocabulary as a markdown table, with its DCMI mapping.
 * @returns {string}
 */
export function renderRelationTable() {
  const rows = Object.entries(RELATIONS).map(
    ([name, r]) => `| \`${name}\` | ${r.dcmi ? `\`${r.dcmi}\`` : '**none**'} | ${r.note} |`,
  );
  return ['| codeadd | DCMI term | meaning |', '|---|---|---|', ...rows].join('\n');
}
