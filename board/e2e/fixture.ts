// The e2e fixture: a project whose docs/ holds a board varied enough to stress
// the layout — every status, long titles, several labels, comments, a picked-up
// ticket, markdown notes. Written synchronously when the Playwright config loads,
// so it exists before the web server answers its first request.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type T = Record<string, unknown>;

function ticket(id: string, over: T): T {
  return {
    id, title: '', theme: '', labels: [], tldr: '', notes: [], done_when: '', paths: [], grounded: true,
    status: 'open', created_at: '2026-09-18T10:00:00Z', updated_at: '2026-09-20T15:30:00Z', comments: [], work_id: null,
    ...over,
  };
}

export const FIXTURE_TICKETS: T[] = [
  ticket('0001B', {
    title: 'A doctor for document schemas, and an opt-in pass that makes a project’s documents fit',
    theme: 'Delivered-work relationships', labels: ['product'],
    tldr: 'Report which of a project’s documents the MCP can read, and offer to fix the headers of the ones it cannot.',
    notes: [
      'Formerly item 1.4 of docs/backlog/index.md.',
      '**The doctor reports, and writes nothing.** For every document in the docs corpus: fit, off-standard, or unreadable.',
      '**The open question.** Where does the doctor live?\n- **An MCP action**, beside `search` and `history`\n- **A CLI verb**, `codeadd doctor`\n- **Both, over one implementation.**',
    ],
    done_when: 'A project holding a mix of current-format and off-standard documents gets a per-file verdict naming the missing field.',
    paths: ['scripts/graph.js', 'mcp/'],
    comments: [{ content: 'Blocks 0002B — do this first.', created_at: '2026-09-19T09:12:00Z' }],
  }),
  ticket('0002B', {
    title: 'Migration command: initial relationship graph for old installs', theme: 'Delivered-work relationships',
    labels: ['product'], status: 'open', tldr: 'Build a relationship structure over features delivered before the typed-relation format existed.',
    done_when: 'Running the command on a project whose deliveries declare no relationship produces the grouped structure.',
    paths: ['cli/src/migrations.js'],
  }),
  ticket('0003B', {
    title: 'Treat obsolete code and backward compatibility as first-class concerns', theme: 'Obsolescence and backward compatibility',
    labels: ['product'], status: 'doing', grounded: false, work_id: '2026-09-21T145331-PLAN--backward-compat',
    tldr: 'Build and hotfix ask whether the work must stay backward compatible, and done surfaces dead code before merging.',
    done_when: 'A feature that rewrites a model records `backward compatibility: no` plus a migration script path.',
  }),
  ticket('0004B', {
    title: 'Sweep the artefacts for text that informs without instructing', theme: 'Prompt density',
    labels: ['both', 'quality'], status: 'open',
    tldr: 'Remove passages that explain rather than instruct, and name the rule that keeps them out.',
    done_when: 'Ruler item 7 names the shapes with examples.',
    comments: [
      { content: 'Start with the product layer — it is read on every run.', created_at: '2026-09-20T08:00:00Z' },
      { content: 'Count is 106 artefacts today.', created_at: '2026-09-20T12:00:00Z' },
    ],
  }),
  ticket('0005B', {
    title: 'Board: a read-only view of the backlog', theme: 'Tooling', labels: ['internal'], status: 'done',
    tldr: 'Kanban, list and ticket detail over docs/backlog.jsonl.', done_when: 'npm run board serves the tickets.',
    work_id: '2026-09-21T145331-PLAN--backlog-board-002-board-app',
  }),
  ticket('0006B', {
    title: 'Cache the provider map', theme: 'Performance', labels: ['product'], status: 'dropped', grounded: false,
    tldr: 'Stop re-reading provider-map.json on every artefact.', done_when: 'build.js reads it exactly once.',
  }),
  ticket('0007B', {
    title: 'Averyveryverylongunbrokenidentifierthatmustnotpushthelayoutsidewaysonaphone', theme: 'Tooling',
    labels: ['internal'], status: 'open', tldr: 'A stress case for wrapping.', done_when: 'It wraps.',
  }),
];

export function writeFixture(root: string): void {
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  writeFileSync(join(root, 'docs/backlog.jsonl'), FIXTURE_TICKETS.map((t) => `${JSON.stringify(t)}\n`).join(''));
  writeFileSync(
    join(root, 'docs/backlog.definitions.json'),
    JSON.stringify({
      statuses: [
        { name: 'open', order: 1, means: 'decided, not started' },
        { name: 'doing', order: 2, means: 'work is in progress' },
        { name: 'done', order: 3, means: 'delivered' },
        { name: 'dropped', order: 4, means: 'decided against' },
      ],
    }, null, 2),
  );
}
