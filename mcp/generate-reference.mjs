/**
 * Regenerate the two tables inside `mcp/reference.md` from `mcp/types.mjs`.
 *
 * ⛔ THE REFERENCE IS NOT HAND-EDITED BETWEEN THE MARKERS. A hand-kept copy of
 *    a machine-readable table drifts from it, and the drift is invisible until
 *    the two disagree — which is the failure the registry itself exists to stop.
 *    `cli/tests/mcp-document-model.test.js` L4.1 fails in CI when they differ,
 *    so forgetting to run this is caught rather than shipped.
 *
 * Usage: node mcp/generate-reference.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderTypeTable, renderRelationTable } from './types.mjs';

const REF = path.join(import.meta.dirname, 'reference.md');
const BLOCKS = [
  ['TYPES', renderTypeTable()],
  ['RELATIONS', renderRelationTable()],
];

let doc = fs.readFileSync(REF, 'utf8');
for (const [name, table] of BLOCKS) {
  const open = `<!-- generated:${name} -->`;
  const close = `<!-- /generated:${name} -->`;
  const re = new RegExp(`${open}[\\s\\S]*?${close}`);
  if (!re.test(doc)) throw new Error(`reference.md carries no ${open} block`);
  doc = doc.replace(re, `${open}\n${table}\n${close}`);
}
fs.writeFileSync(REF, doc, 'utf8');
console.log('mcp/reference.md regenerated from mcp/types.mjs');
