'use strict';
// Validator for the `codeadd-result` block (schema v1), shared by result-block.test.cjs and by the
// manual L4 check. The contract lives in workbench/skills/add-final-report/references/result-block.md;
// the test asserts that document's field table names exactly RESULT_KEYS, so the two cannot drift.
// Not a *.test.cjs on purpose: the runner must not pick it up on its own.

const RESULT_KEYS = ['v', 'status', 'stage', 'branch', 'commits', 'tests', 'pr', 'ci', 'ticket', 'next_step', 'needs_approval', 'reason'];
const STATUSES = ['done', 'stopped', 'needs-approval', 'failed'];
const CI_STATES = ['success', 'failure', 'pending', 'none'];
const FENCE = /^```codeadd-result[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm;

/** Every `codeadd-result` fence in the text, as the raw body between the fences. */
function extractBlocks(text) {
  return [...String(text).matchAll(FENCE)].map(m => m[1]);
}

const isInt = n => Number.isInteger(n) && n >= 0;
const isObj = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const sameKeys = (o, keys) => Object.keys(o).length === keys.length && keys.every(k => k in o);

function counts(c) { return isObj(c) && sameKeys(c, ['passed', 'failed', 'skipped']) && isInt(c.passed) && isInt(c.failed) && isInt(c.skipped); }

/** Returns `{ ok, reasons }`; each reason is a short phrase naming the broken rule. */
function validateResultBlock(text) {
  const reasons = [];
  const bodies = extractBlocks(text);
  if (bodies.length !== 1) return { ok: false, reasons: [`expected exactly one codeadd-result fence, found ${bodies.length}`] };
  let b;
  try { b = JSON.parse(bodies[0]); } catch { return { ok: false, reasons: ['body is not valid JSON'] }; }
  if (!isObj(b)) return { ok: false, reasons: ['body is not a JSON object'] };

  for (const k of RESULT_KEYS) if (!(k in b)) reasons.push(`missing key ${k}`);
  for (const k of Object.keys(b)) if (!RESULT_KEYS.includes(k)) reasons.push(`extra key ${k}`);
  if (reasons.length) return { ok: false, reasons };

  if (b.v !== 1) reasons.push('v must be 1');
  if (!STATUSES.includes(b.status)) reasons.push('status is not one of the four values');
  if (typeof b.stage !== 'string' || !b.stage) reasons.push('stage must be a non-empty string');
  if (b.branch !== null && typeof b.branch !== 'string') reasons.push('branch must be string or null');
  if (!Array.isArray(b.commits) || !b.commits.every(c => typeof c === 'string')) reasons.push('commits must be an array of strings');
  if (b.tests !== null) {
    const okTests = isObj(b.tests) && sameKeys(b.tests, ['before', 'after']) && [b.tests.before, b.tests.after].every(s => s === null || counts(s));
    if (!okTests) reasons.push('tests must be null or {before, after} of null or {passed, failed, skipped}');
  }
  if (b.pr !== null && !(isObj(b.pr) && sameKeys(b.pr, ['number', 'url']) && isInt(b.pr.number) && typeof b.pr.url === 'string')) reasons.push('pr must be null or {number, url}');
  if (b.ci !== null && !CI_STATES.includes(b.ci)) reasons.push('ci is not one of the four values or null');
  if (b.ticket !== null) {
    const t = b.ticket;
    const okTicket = isObj(t) && sameKeys(t, ['id', 'status', 'sha', 'pushed']) && typeof t.id === 'string' && typeof t.status === 'string' && (t.sha === null || typeof t.sha === 'string') && typeof t.pushed === 'boolean';
    if (!okTicket) reasons.push('ticket must be null or {id, status, sha, pushed}');
  }
  if (b.next_step !== null && typeof b.next_step !== 'string') reasons.push('next_step must be string or null');
  if (typeof b.needs_approval !== 'boolean') reasons.push('needs_approval must be a boolean');
  else if (b.needs_approval !== (b.status === 'needs-approval')) reasons.push('needs_approval must be true exactly when status is needs-approval');
  if (b.reason !== null && typeof b.reason !== 'string') reasons.push('reason must be string or null');
  else if (b.status !== 'done' && STATUSES.includes(b.status) && (b.reason === null || b.reason === '')) reasons.push('reason must be non-null when status is not done');
  return { ok: reasons.length === 0, reasons };
}

module.exports = { RESULT_KEYS, STATUSES, CI_STATES, extractBlocks, validateResultBlock };
