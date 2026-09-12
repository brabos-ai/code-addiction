/**
 * corpora.mjs — the corpus registry and the two parsers.
 *
 * One declarative table with two rows. Each row carries its roots, its presence
 * probe, its membership rule, its node rule, its edge sources and its index
 * path. A third corpus later is a row here, not a redesign.
 *
 * THE TWO CORPORA NEVER SHARE AN INDEX OR A NODE NAMESPACE.
 * `product/command/add.done` and `0053H` do not belong in one graph: the
 * questions differ and so do the ids. Merging them is the one change this file
 * exists to prevent.
 *
 * ZERO DEPENDENCIES, deliberately, and that includes `yaml`. Two reasons, and
 * the second is the load-bearing one:
 *   1. The server this replaces made and justified the same call for an SDK.
 *   2. `--corpus=artefacts` runs from the repository root, where the CLI's
 *      node_modules is not on the resolution path. A dependency here would work
 *      in a user's project and fail in the repository that ships it.
 * The frontmatter reader below is a READER only. Decision 23 promotes `yaml` to
 * a direct CLI dependency for the MIGRATION, which writes user files back; this
 * never writes YAML, so the mangling risk that decision names does not apply.
 *
 * `.mjs` and not `.js`: the repository root has no `"type"` field (so `.js` is
 * CommonJS there) while `cli/package.json` declares `"type": "module"`. The same
 * source is copied into `cli/src/mcp/` at build time and must be read the same
 * way in both places.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * The closed relation vocabulary, per design decision 10.
 *
 * A line carrying anything else is not an edge. It is reported, never guessed
 * at: inventing a type for an unrecognised word is how a graph acquires edges
 * nobody wrote.
 */
export const RELATION_TYPES = new Set(['caused_by', 'depends_on', 'part_of', 'links_to']);

/** Edge kinds that mean "this would break if that changed". */
const DEPENDENCY_TYPES = new Set(['caused_by', 'depends_on', 'part_of']);

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    if ((first === '"' || first === "'") && trimmed.endsWith(first)) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseFlowSequence(value) {
  const inner = value.slice(1, -1).trim();
  if (!inner) return [];
  return inner.split(',').map(stripQuotes).filter(Boolean);
}

/**
 * Read the YAML subset the schemas actually use: scalars, flow sequences
 * (`[a, b]`) and block sequences (`  - a`).
 *
 * A key whose value this cannot read is SKIPPED, never guessed. The caller's
 * decisions all rest on `type:`, `id:` and a handful of lists; a nested map it
 * cannot parse must not become a wrong value.
 *
 * @param {string} content  the whole file
 * @returns {Record<string, unknown> | null}  null when there is no block at all
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;

  const block = content.slice(content.indexOf('\n') + 1, end + 1);
  const out = {};
  const lines = block.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    // Only a top-level key opens an entry. An indented line belongs to the key
    // above it and is consumed there.
    if (/^\s/.test(line)) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    if (!key) continue;
    const raw = line.slice(colon + 1).trim();

    if (raw.startsWith('[') && raw.endsWith(']')) {
      out[key] = parseFlowSequence(raw);
      continue;
    }

    if (raw === '') {
      const items = [];
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        const next = lines[j];
        if (!next.trim()) continue;
        const item = next.match(/^\s+-\s+(.*)$/);
        if (!item) break;
        items.push(stripQuotes(item[1]));
      }
      if (items.length) {
        out[key] = items;
        i = j - 1;
      }
      continue;
    }

    out[key] = stripQuotes(raw);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Body sections
// ---------------------------------------------------------------------------

/** The body of one H2 section, or '' when the section is absent. */
export function section(content, heading) {
  const re = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = re.exec(content);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = content.slice(start);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/**
 * The first sentence of a TL;DR — the rejection surface a search hit carries.
 *
 * Decision 29: the section runs 41 to 173 words, median 107, so returning it
 * whole for ten hits costs about 1,500 tokens. The thesis sits in the first
 * sentence and `get` returns the rest.
 */
export function firstSentence(text) {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  const match = flat.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : flat;
}

/** `- <type> [[<id>]] — <why>` lines, per the closed vocabulary. */
export function parseRelations(content) {
  const body = section(content, 'Relations');
  if (!body || body.trim() === 'None') return { relations: [], malformed: [] };

  const relations = [];
  const malformed = [];
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('-')) continue;
    const match = trimmed.match(/^-\s+([A-Za-z_]+)\s+\[\[([^\]]+)\]\]\s*(?:[—–-]\s*(.+))?$/);
    if (!match) {
      malformed.push(trimmed);
      continue;
    }
    const [, type, to, why] = match;
    if (!RELATION_TYPES.has(type)) {
      malformed.push(trimmed);
      continue;
    }
    relations.push({ type, to: to.trim(), why: why ? why.trim() : null });
  }
  return { relations, malformed };
}

/** `- [<category>] <text> #tag` lines. */
export function parseObservations(content) {
  const body = section(content, 'Observations');
  if (!body) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const match = line.trim().match(/^-\s+\[([^\]]+)\]\s+(.+)$/);
    if (!match) continue;
    const [, category, rest] = match;
    const tags = [...rest.matchAll(/#([\w-]+)/g)].map((m) => m[1]);
    out.push({ category, text: rest.replace(/\s*#[\w-]+/g, '').trim(), tags });
  }
  return out;
}

/**
 * The file list a brownfield node carries, from `related.md`'s Impacted Files.
 *
 * Decision 36: 18 of 19 measured documents already carry it, so `touched_by`
 * answers on the day a project upgrades rather than from its first new delivery.
 */
export function parseImpactedFiles(content) {
  const body = section(content, 'Impacted Files');
  if (!body) return [];
  const out = [];
  for (const line of body.split('\n')) {
    const match = line.trim().match(/^-\s+`?([^\s`:]+)/);
    if (!match) continue;
    const file = match[1].replace(/[.,;]$/, '');
    if (file && !out.includes(file)) out.push(file);
  }
  return out;
}

/**
 * `{{doc:ID}}` body references with the sentence around each.
 *
 * The richest source in a brownfield corpus and the only one that arrives with
 * its own `why`: the reference sits inline, so the surrounding text is the
 * reason, recovered with no model.
 */
export function parseDocRefs(content) {
  const body = content.replace(/^---[\s\S]*?\n---\n/, '');
  const out = [];
  for (const match of body.matchAll(/\{\{doc:([^}]+)\}\}/g)) {
    const id = match[1].trim();
    const before = body.slice(0, match.index);
    // THE BOUNDARY IS A TERMINATOR FOLLOWED BY ANY WHITESPACE, newline
    // included. Matching '. ' alone swallows every earlier sentence of a
    // paragraph that wraps — which an extractive document always does — and the
    // reason then carries three sentences and names the wrong document.
    const boundary = [...before.matchAll(/[.!?]\s/g)].pop();
    const start = Math.max(
      boundary ? boundary.index + boundary[0].length : 0,
      before.lastIndexOf('\n\n') + 2,
      0,
    );
    const after = body.slice(match.index);
    const stop = after.search(/[.!?](\s|$)/);
    const sentence = (before.slice(start) + (stop === -1 ? after : after.slice(0, stop + 1)))
      .replace(/\s+/g, ' ')
      .replace(/^[-*\s]+/, '')
      .trim();
    out.push({ id, why: sentence || null });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Walking
// ---------------------------------------------------------------------------

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

function walkMarkdown(root, rel = '', out = []) {
  const dir = path.join(root, rel);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const next = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walkMarkdown(root, next, out);
    } else if (entry.name.endsWith('.md')) {
      out.push(next);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// The docs corpus
// ---------------------------------------------------------------------------

/**
 * Membership is decided by the `type:` frontmatter key, never by a path glob.
 *
 * A real `docs/` holds the user's own material beside codeadd's — `chat-gpt/`,
 * `images/`, `critical-findings.md` — and a glob would need an exclusion list
 * somebody maintains forever. Every document codeadd writes carries `type:`;
 * a file without one is the user's and is skipped and reported.
 */
function classify(relPath, frontmatter) {
  if (!frontmatter) return { kind: null, reason: 'no frontmatter block' };
  const type = frontmatter.type;
  if (!type) return { kind: null, reason: 'frontmatter carries no type: key' };
  if (String(type).endsWith('-about')) return { kind: 'work item', type };
  if (type === 'reference' && relPath.includes('.codeadd/wiki/')) {
    return { kind: 'reference page', type };
  }
  return { kind: 'attachment', type };
}

function wikiNodeId(relPath) {
  const after = relPath.slice(relPath.indexOf('.codeadd/wiki/') + '.codeadd/wiki/'.length);
  return `wiki/${after.replace(/\.md$/, '')}`;
}

function loadDocsCorpus(root) {
  const files = [];
  for (const corpusRoot of CORPORA.docs.roots) {
    for (const rel of walkMarkdown(path.join(root, corpusRoot))) {
      files.push(`${corpusRoot}/${rel}`);
    }
  }

  const nodes = [];
  const attachments = [];
  const skipped = [];

  for (const relPath of files.sort()) {
    const content = fs.readFileSync(path.join(root, relPath), 'utf8');
    const frontmatter = parseFrontmatter(content);
    const verdict = classify(relPath, frontmatter);

    if (!verdict.kind) {
      skipped.push({ path: relPath, reason: verdict.reason });
      continue;
    }

    if (verdict.kind === 'attachment') {
      attachments.push({ path: relPath, type: verdict.type, content, frontmatter });
      continue;
    }

    const tldr = section(content, 'TL;DR');
    const isPage = verdict.kind === 'reference page';
    const id = isPage ? wikiNodeId(relPath) : String(frontmatter.id ?? '').trim();
    if (!id) {
      skipped.push({ path: relPath, reason: 'work item carries no id: value' });
      continue;
    }

    nodes.push({
      id,
      kind: verdict.kind,
      type: verdict.type,
      path: relPath,
      status: frontmatter.status ?? null,
      slug: frontmatter.slug ?? null,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      area: frontmatter.area ?? null,
      sources: Array.isArray(frontmatter.sources) ? frontmatter.sources : [],
      tldr,
      // A reference page's `description` is already a one-line summary, so
      // decision 29's first-sentence derivation applies to work items only.
      summary: isPage ? (frontmatter.description ?? firstSentence(tldr)) : firstSentence(tldr),
      attachments: [],
      files: [],
      observations: parseObservations(content),
      _content: content,
      _frontmatter: frontmatter,
    });
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const byDir = new Map();
  for (const node of nodes) {
    if (node.kind === 'work item') byDir.set(path.posix.dirname(node.path), node);
  }

  // Attach each attachment to its work item: the directory answers for the
  // in-feature layout, and a `part_of` or `related:` id answers for
  // `docs/changelog/CHG[NNNN].md`, which has no *-about sibling.
  for (const attachment of attachments) {
    const dirOwner = byDir.get(path.posix.dirname(attachment.path));
    let owner = dirOwner;
    if (!owner) {
      const { relations } = parseRelations(attachment.content);
      const declared = relations.find((r) => byId.has(r.to));
      const related = Array.isArray(attachment.frontmatter.related)
        ? attachment.frontmatter.related.find((id) => byId.has(id))
        : null;
      owner = declared ? byId.get(declared.to) : related ? byId.get(related) : null;
    }
    if (!owner) {
      skipped.push({ path: attachment.path, reason: 'attachment resolves to no work item' });
      continue;
    }
    owner.attachments.push({ path: attachment.path, type: attachment.type });
    // Remember which work item this attachment belongs to. The edge pass below
    // needs the SAME answer, and deriving it there from the directory alone is
    // what left a `docs/changelog/CHG[NNNN].md` contributing no edges: that
    // layout has no *-about sibling, so only the part_of line resolves it.
    attachment.ownerId = owner.id;
    if (attachment.type === 'hotfix-related') {
      for (const file of parseImpactedFiles(attachment.content)) {
        if (!owner.files.includes(file)) owner.files.push(file);
      }
    }
  }

  const { edges, unresolved, malformed } = buildDocsEdges(nodes, attachments, byId);

  for (const node of nodes) {
    delete node._content;
    delete node._frontmatter;
  }

  return { corpus: 'docs', nodes, edges, skipped, unresolved, malformed };
}

/**
 * Every edge source the design's Vehicle 1 table names, in precedence order.
 *
 * An authored `## Relations` type always wins over a mechanically derived one:
 * a `{{doc:}}` reference and a `related:` id both mean "connected" and neither
 * knows why, so overwriting a typed edge with `links_to` would lose intent
 * somebody wrote down.
 */
function buildDocsEdges(nodes, attachments, byId) {
  const edges = new Map();
  const unresolved = [];
  const malformed = [];

  const seenUnresolved = new Set();
  const record = (from, to) => {
    const key = `${from}->${to}`;
    if (seenUnresolved.has(key)) return;
    seenUnresolved.add(key);
    unresolved.push({ from, to });
  };

  const add = (from, to, type, why, authored) => {
    if (from === to) return;
    if (!byId.has(to)) {
      record(from, to);
      return;
    }
    const key = `${from}->${to}`;
    const existing = edges.get(key);
    if (existing && (existing.authored || !authored)) {
      if (!existing.why && why) existing.why = why;
      return;
    }
    edges.set(key, { from, to, type, why: why ?? null, authored });
  };

  // Each attachment's references are attributed to the work item it belongs to.
  const sourcesFor = new Map(nodes.map((n) => [n.id, [{ content: n._content, fm: n._frontmatter }]]));
  for (const attachment of attachments) {
    // BOTH CHANGELOG LAYOUTS ARE READ, per design decision 30. The in-feature
    // one resolves by directory and the `docs/changelog/` one resolves through
    // its own `part_of` line — the attachment pass settled that already, and
    // this reads its answer rather than re-deriving a narrower one.
    const owner = attachment.ownerId ? byId.get(attachment.ownerId) : null;
    if (!owner) continue;
    sourcesFor.get(owner.id).push({ content: attachment.content, fm: attachment.frontmatter });
  }

  for (const node of nodes) {
    for (const { content, fm } of sourcesFor.get(node.id)) {
      const { relations, malformed: bad } = parseRelations(content);
      for (const line of bad) malformed.push({ from: node.id, line });
      for (const relation of relations) add(node.id, relation.to, relation.type, relation.why, true);

      if (fm.superseded_by) add(node.id, String(fm.superseded_by), 'superseded_by', null, true);

      for (const ref of parseDocRefs(content)) add(node.id, ref.id, 'links_to', ref.why, false);

      if (Array.isArray(fm.related)) {
        for (const id of fm.related) add(node.id, id, 'links_to', null, false);
      }
    }
  }

  return {
    edges: [...edges.values()].map(({ authored, ...edge }) => edge),
    unresolved,
    malformed,
  };
}

// ---------------------------------------------------------------------------
// The artefact corpus
// ---------------------------------------------------------------------------

/**
 * Adapt the sidecar `scripts/build.js` already emits.
 *
 * It does NOT re-parse `framwork/.codeadd/` and `.claude/`. Parity with
 * `scripts/graph.js` is the level that gates the retirement of the old server,
 * and two parsers over one tree is exactly how two surfaces come to disagree.
 * One file, read by both.
 */
function loadArtefactCorpus(root) {
  const indexPath = path.join(root, CORPORA.artefacts.index);
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `No artefact graph at ${CORPORA.artefacts.index}. Run \`node scripts/build.js\` first.`,
    );
  }
  const graph = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  const nodes = graph.nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    type: n.kind,
    path: n.path,
    layer: n.layer,
    name: n.name,
    status: null,
    tags: [],
    area: n.layer,
    sources: [],
    tldr: '',
    summary: '',
    attachments: [],
    files: n.path ? [n.path] : [],
    observations: [],
  }));

  const edges = graph.edges.map((e) => ({
    from: e.from,
    to: e.to,
    type: e.type,
    why: null,
  }));

  return { corpus: 'artefacts', nodes, edges, skipped: [], unresolved: [], malformed: [] };
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const CORPORA = {
  artefacts: {
    name: 'artefacts',
    roots: ['framwork/.codeadd', '.claude'],
    // Absent from the release ZIP, which is the whole point: without this probe
    // an installed `.claude/` — its `uses:` blocks stripped at build — would
    // index as dozens of edge-free nodes and report an empty graph, which is
    // worse than reporting that the corpus is not here.
    probe: 'framwork/provider-map.json',
    membership: 'registered in the provider map, or carrying a `uses:` block',
    nodeRule: '<layer>/<kind>/<name>',
    edgeSources: ['the <!-- uses: --> block, five kinds'],
    index: 'framwork/.codeadd/artefact-graph.json',
    // The delivery index reader, for the `history` verb. The path differs per
    // corpus because this repository keeps the shipped scripts under
    // `framwork/.codeadd/` while a user's project has them at `.codeadd/`.
    deliveredScript: 'framwork/.codeadd/scripts/delivered.sh',
    // Written by `node scripts/build.js`, never by `reindex`.
    generated: true,
    load: loadArtefactCorpus,
  },
  docs: {
    name: 'docs',
    roots: ['docs', '.codeadd/wiki'],
    probe: 'docs',
    membership: 'frontmatter carries a `type:` key',
    nodeRule: 'the `id:` value, or `wiki/<page>` for a reference page',
    edgeSources: ['## Relations', '{{doc:ID}}', 'related:', 'superseded_by', 'sources globs'],
    index: '.codeadd/docs-index.json',
    deliveredScript: '.codeadd/scripts/delivered.sh',
    generated: false,
    load: loadDocsCorpus,
  },
};

/** The flag selects. An unknown name names what is available, never a default. */
export function resolveCorpus(name) {
  const corpus = CORPORA[name];
  if (!corpus) {
    throw new Error(
      `Unknown corpus "${name}". Available: ${Object.keys(CORPORA).join(', ')}.`,
    );
  }
  return corpus;
}

/**
 * The probe validates what the flag selected.
 *
 * An absent corpus is an ERROR naming the reason, never a silent empty result —
 * an empty graph and a missing one look identical to a caller and mean opposite
 * things.
 */
export function probe(corpus, root) {
  const target = path.join(root, corpus.probe);
  if (fs.existsSync(target)) return { present: true, reason: null };
  return {
    present: false,
    reason: `corpus "${corpus.name}" is not present here: ${corpus.probe} does not exist under ${root}`,
  };
}

export { DEPENDENCY_TYPES };
