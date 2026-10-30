/**
 * 0075B, F9: a feature is named by its folder, `<id>-<slug>`, wherever a command prints it to a
 * person or to a bot — report, next-step and result-block text. A bare id there is something the
 * reader has to look up. Paths and globs elsewhere (branch patterns, frontmatter `id:`, `[[<id>]]`
 * links) legitimately carry the bare id and are not scanned.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = path.resolve(import.meta.dirname, '..', '..', 'framwork', '.codeadd');
const COMMANDS = ['add-brainstorm', 'add-new', 'add-plan', 'add-build', 'add-done', 'add-hotfix', 'add-setup'];
const FILES = [...COMMANDS.map((name) => path.join(SOURCE, 'commands', `${name}.md`)), path.join(SOURCE, 'agent-mode', 'result.schema.json')];

const BARE_ID = /\[NNNN\](\[L\]|[A-Z])?(?![A-Za-z\]-])/;
const BARE_PLACEHOLDER = /<id>(?!-<slug>)/;
const REPORT_LINE = /\b(print|prints|report|reports|summary|next[_ -]step|Next:)\b/i;
const FEATURE_PATH_WITH_BARE_ID = /docs\/features\/<id>(?!-<slug>)/;

describe('0075B F9 report text names a feature as <id>-<slug>', () => {
  it.each(FILES.map((file) => [path.basename(file), file]))('%s has no bare id in a path or a report line', (_name, file) => {
    const hits = [];
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
      if (FEATURE_PATH_WITH_BARE_ID.test(line)) hits.push(`${index + 1}: path ${line.trim().slice(0, 100)}`);
      else if (REPORT_LINE.test(line) && (BARE_ID.test(line) || BARE_PLACEHOLDER.test(line))) hits.push(`${index + 1}: report ${line.trim().slice(0, 100)}`);
    });
    expect(hits).toEqual([]);
  });
});
