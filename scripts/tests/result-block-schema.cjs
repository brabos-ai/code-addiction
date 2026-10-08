'use strict';
// Validator for the result block, shared by result-block.test.cjs and by a caller checking a captured
// `claude -p --output-format json --json-schema` stdout. The contract is the JSON Schema file
// beside the call doc; this module reads it and walks the keywords it uses (type, enum, const,
// properties, required, additionalProperties, items). It carries no key list and no rule of its own.
// Not a *.test.cjs on purpose: the runner must not pick it up on its own.

const fs = require('node:fs');
const path = require('node:path');

const SCHEMA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'workbench', 'skills', 'add-final-report', 'references', 'result-block.schema.json'), 'utf8'));
const RESULT_KEYS = SCHEMA.required;
const STATUSES = SCHEMA.properties.status.enum;

const typeOf = v => (v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v);
const isType = (v, t) => typeOf(v) === t || (t === 'number' && typeof v === 'number') || (t === 'integer' && Number.isInteger(v));

function walk(schema, value, at, reasons) {
  const name = at || 'value';
  if (schema.type !== undefined) {
    const types = [].concat(schema.type);
    if (!types.some(t => isType(value, t))) { reasons.push(`${name} must be ${types.join(' or ')}`); return; }
  }
  if ('const' in schema && value !== schema.const) reasons.push(`${name} must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) reasons.push(`${name} is not one of ${JSON.stringify(schema.enum)}`);
  if (typeOf(value) === 'object') {
    const where = at ? `${at}: ` : '';
    for (const k of schema.required || []) if (!(k in value)) reasons.push(`${where}missing key ${k}`);
    if (schema.additionalProperties === false) for (const k of Object.keys(value)) if (!(k in (schema.properties || {}))) reasons.push(`${where}extra key ${k}`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) walk(sub, value[k], at ? `${at}.${k}` : k, reasons);
  }
  if (typeOf(value) === 'array' && schema.items) value.forEach((item, i) => walk(schema.items, item, `${name}[${i}]`, reasons));
}

/** Takes the raw JSON text (CLI stdout). Returns `{ ok, reasons }`; each reason names the broken keyword. */
function validateResultBlock(text) {
  let body;
  try { body = JSON.parse(text); } catch { return { ok: false, reasons: ['body is not valid JSON'] }; }
  if (typeOf(body) !== 'object') return { ok: false, reasons: ['body is not a JSON object'] };
  const reasons = [];
  walk(SCHEMA, body, '', reasons);
  return { ok: reasons.length === 0, reasons };
}

module.exports = { SCHEMA, RESULT_KEYS, STATUSES, validateResultBlock };
