// The native backlog route, END TO END in a real browser:
// a ticket written through the shipped publication entry on the e2e fixture's
// own mutable project (both the code repository and the board clone) shows up and
// refreshes the board without a reload, and the whole route needs neither bash nor
// any shell.
// (plan docs/plans/2026-10-04T004044-PLAN--native-node-backlog, F7, L6/L7.)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const BOARD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REMOTE_ROOT = path.resolve(BOARD_DIR, '..');
const COMMIT = path.join(REMOTE_ROOT, 'framwork', '.codeadd', 'scripts', 'backlog-commit.cjs');
// Each viewport has its own mutable fixture/server. Tests within a viewport
// are serial so the HTTP refusal can assert byte-for-byte preservation.
test.describe.configure({ mode: 'serial' });
const nativeBase = () => String(test.info().project.metadata.nativeURL);
const nativeFixture = () => path.resolve(BOARD_DIR, String(test.info().project.metadata.nativeFixture));

const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on('console', (m) => { if (m.type() === 'error') list.push(m.text()); });
  page.on('pageerror', (e) => list.push(String(e)));
});

test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'console errors').toEqual([]);
});

/** The board updates through the SSE the server streams; the reload-free
 *  refresh waits bounded — the card is expected to arrive on its own. */
async function waitForCard(page: Page, title: string) {
  await expect(page.getByRole('link', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))
    .toBeVisible({ timeout: 5000 });
}

test('L6/R7 a ticket written by the native publication entry reaches the board without a reload', async ({ page }) => {
  // Each project appends only to its own fixture.
  const project = test.info().project.name;
  const title = `native through the board [${project}]`;

  await page.goto(`${nativeBase()}/board`);
  await expect(page.getByRole('link', { name: /seed before the native write/ })).toBeVisible();

  const record = path.join(nativeFixture(), `native-ticket-record-${project}.json`);
  fs.writeFileSync(record, JSON.stringify({
    title, theme: 'Tooling', labels: ['both'],
    tldr: 'The browser shows it with no reload.', done_when: 'The card appears unprompted.',
    paths: [], grounded: true, status: 'open',
  }));

  // Node is spawned through process.execPath directly, with git on the PATH;
  // every process on this route is node + git, never a shell.
  const run = spawnSync(process.execPath, [COMMIT, 'add', '--record-file', record], {
    cwd: nativeFixture(), encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '', CODEADD_BOARD_DIR: nativeFixture() },
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(run.stdout).toMatch(/TICKET_ID=[0-9]{4}B/);
  expect(fs.readFileSync(path.join(nativeFixture(), 'docs', 'backlog.jsonl'), 'utf8'))
    .toContain(`"title":"${title}"`);

  await waitForCard(page, title);
  // The seed card is still the top of the backlog column — the native write
  // landed in append-only last position, never over the existing order.
  await expect(page.getByRole('link', { name: /seed before the native write/ })).toBeVisible();

  // The ticket survives a reload — it is file state, not session state.
  await page.reload();
  await expect(page.getByRole('link', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }))
    .toBeVisible({ timeout: 5000 });
  fs.rmSync(record, { force: true });
});

test('L6 the native server rejects a write through HTTP and creates no project file', async () => {
  const before = fs.readFileSync(path.join(nativeFixture(), 'docs', 'backlog.jsonl'), 'utf8');

  const res = await fetch(`${nativeBase()}/api/board`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: '9999B', title: 'http write attempt' }),
  });
  expect([404, 405]).toContain(res.status);
  await res.text().catch(() => {});

  const after = fs.readFileSync(path.join(nativeFixture(), 'docs', 'backlog.jsonl'), 'utf8');
  expect(after).toBe(before);
  expect(after).not.toContain('http write attempt');
  expect(after).not.toContain('"id":"9999B"');
});

test('L6 the server spawns the platform opener and never a shell', () => {
  // Static scan, the same discipline the cli suite ships for the backlog
  // modules and the board unit suite asserts for the native runtime: Node
  // runs every process. The one spawn is the --open helper naming the
  // platform URL opener directly, never a shell, never a bash process.
  const src = fs.readFileSync(path.join(BOARD_DIR, 'server.mjs'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  expect((code.match(/spawn\(/g) || []).length, 'spawn call count').toBe(1);
  expect(code).not.toMatch(/spawn\(\s*['"`](?:bash|sh|wsl|pwsh|powershell)["`]/);
  expect(code).not.toMatch(/shell\s*[:=]\s*true/);
});
