import { defineConfig, devices } from '@playwright/test';
import { writeFixture } from './e2e/fixture';
import fs from 'node:fs';
import { join } from 'node:path';

// The e2e suite runs the BUILT app through server.mjs over a fixture project,
// so what it proves is what `npm run board` serves. The fixture is written when
// this config loads — before the web server starts. The port is fixed away from
// the default 4317 so a board already open on this machine does not answer.
const PORT = 4399;
const LAYERS_PORT = 4419;
const NATIVE_PORT = 4429;
const FIXTURE = "./test-results/fixture";
const NATIVE_FIXTURE = "./test-results/fixture-native";
// Workers load this config too; only the main process may write the fixture,
// or a worker deletes it while the server is reading it.
if (process.env.TEST_WORKER_INDEX === undefined) writeFixture(FIXTURE);

/** The native spec's own fixture. Entirely separate from the read-only one:
 *  ONLY this mutable fixture ever sees a CLI mutation, and only its server
 *  serves it, so parallel projects never observe a file changing under them. */
function writeNativeFixture(root: string): void {
  writeFixture(root);
  const defs = join(root, 'docs/backlog.jsonl');
  fs.writeFileSync(defs, `${JSON.stringify({
    id: '0001B', title: 'seed before the native write', theme: 'general', labels: [],
    tldr: 'seed', notes: [], done_when: 'it works', paths: [], grounded: false,
    status: 'open', created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
    comments: [], feature: null, work_id: null,
  })}\n`);
}
if (process.env.TEST_WORKER_INDEX === undefined) writeNativeFixture(NATIVE_FIXTURE);

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  outputDir: './test-results/runs',
  fullyParallel: true,
  reporter: [['list']],
  metadata: {
    layersURL: `http://127.0.0.1:${LAYERS_PORT}`,
    nativeURL: `http://127.0.0.1:${NATIVE_PORT}`,
    nativeFixture: NATIVE_FIXTURE,
  },
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: [{
    command: `node server.mjs --root ${FIXTURE} --port ${PORT} --no-open`,
    url: `http://127.0.0.1:${PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }, {
    command: `node server.mjs --root ${FIXTURE} --port ${LAYERS_PORT} --no-open --layers`,
    url: `http://127.0.0.1:${LAYERS_PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }, {
    // The native-spec server. Its fixture is the ONLY mutable one; the
    // spec drives it with the shipped backlog entries and never reloads.
    command: `node server.mjs --root ${NATIVE_FIXTURE} --port ${NATIVE_PORT} --no-open`,
    url: `http://127.0.0.1:${NATIVE_PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }],
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 900 } } },
  ],
});
