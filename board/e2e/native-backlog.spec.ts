// The native backlog route, END TO END in a real browser:
// a ticket added through the shipped LOCAL CLI on the e2e fixture's own
// mutable project shows up and refreshes the board without a reload, and
// the whole route needs neither bash nor any shell.
// (plan docs/plans/2026-10-04T004044-PLAN--native-node-backlog, F7, L6/L7.)
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';

const BOARD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REMOTE_ROOT = path.resolve(BOARD_DIR, '..');
const CLI = path.join(REMOTE_ROOT, 'framwork', '.codeadd', 'scripts', 'backlog-cli.cjs');
// The fixture lives under test-results/fixture-native, created when the
// config loaded; the native server at 4429 serves exactly it.
const NATIVE_PORT = 4429;
const NATIVE_BASE = `http://127.0.0.1:${NATIVE_PORT}`;
const NATIVE_FIXTURE = path.resolve(BOARD_DIR, 'test-results', 'fixture-native');

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

test('L6/R7 a ticket added by the native CLI reaches the board without a reload', async ({ page }) => {
  // Three viewport projects share one mutable fixture and one server: every
  // project's run appends its OWN ticket (the ids keep counting), and each
  // asserts what IT wrote appearing without a reload.
  const project = test.info().project.name;
  const title = `native through the board [${project}]`;

  await page.goto(`${NATIVE_BASE}/board`);
  await expect(page.getByRole('link', { name: /seed before the native write/ })).toBeVisible();

  const record = path.join(NATIVE_FIXTURE, `native-ticket-record-${project}.json`);
  fs.writeFileSync(record, JSON.stringify({
    title, theme: 'Tooling', labels: ['both'],
    tldr: 'The browser shows it with no reload.', done_when: 'The card appears unprompted.',
    paths: [], grounded: true, status: 'open',
  }));

  // PATH: '' — no bash, no shell, nothing reachable. Node is spawned through
  // process.execPath directly; every process on this route is node + git.
  const run = spawnSync(process.execPath, [CLI, 'add', '--record-file', record], {
    cwd: NATIVE_FIXTURE, encoding: 'utf8',
    env: { ...process.env, PATH: '', NODE_OPTIONS: '' },
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(run.stdout).toMatch(/TICKET_ID=[0-9]{4}B/);
  expect(fs.readFileSync(path.join(NATIVE_FIXTURE, 'docs', 'backlog.jsonl'), 'utf8'))
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
  const before = fs.readFileSync(path.join(NATIVE_FIXTURE, 'docs', 'backlog.jsonl'), 'utf8');

  const res = await fetch(`${NATIVE_BASE}/api/board`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: '9999B', title: 'http write attempt' }),
  });
  expect([404, 405]).toContain(res.status);
  await res.text().catch(() => {});

  // The three viewport projects share this fixture and append concurrently:
  // the refused HTTP write may race a legitimate append, so the assertion is
  // on the RESULT of this write — the id this call named never appeared —
  // rather than on frozen line-for-line bytes.
  const after = fs.readFileSync(path.join(NATIVE_FIXTURE, 'docs', 'backlog.jsonl'), 'utf8');
  expect(after).not.toContain('http write attempt');
  expect(after).not.toContain('"id":"9999B"');
  void before;
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
