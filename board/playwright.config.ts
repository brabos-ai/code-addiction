import { defineConfig, devices } from '@playwright/test';
import { writeFixture } from './e2e/fixture';
import fs from 'node:fs';
import { join } from 'node:path';
import testContext from '../scripts/test-context.cjs';

// Refuse before fixtures are written or any test server starts.
testContext.authorize({ selection: process.env.CODEADD_TESTS_SELECTION, leaf: 'board-e2e' });

// The e2e suite runs the BUILT app through server.mjs over a fixture project,
// so what it proves is what `npm run board` serves. The fixture is written when
// this config loads — before the web server starts. The port is fixed away from
// the default 4317 so a board already open on this machine does not answer.
const PORT = 4399;
const LAYERS_PORT = 4419;
const FIXTURE = "./test-results/fixture";
const NATIVE_PROJECTS = ['mobile-360', 'tablet-768', 'desktop-1080'].map((name, i) => ({
  name, port: 4429 + i,
  fixture: `./test-results/fixture-native-${name}`,
}));
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
if (process.env.TEST_WORKER_INDEX === undefined) {
  for (const project of NATIVE_PROJECTS) writeNativeFixture(project.fixture);
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  outputDir: './test-results/runs',
  fullyParallel: true,
  reporter: [['list']],
  metadata: {
    layersURL: `http://127.0.0.1:${LAYERS_PORT}`,
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
  }, ...NATIVE_PROJECTS.map((project) => ({
    // Every viewport owns its mutable fixture/server: native add is not a
    // concurrent reservation protocol, so tests must not share its files.
    command: `node server.mjs --root ${project.fixture} --port ${project.port} --no-open`,
    url: `http://127.0.0.1:${project.port}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }))],
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 900 } } },
  ].map((project) => {
    const native = NATIVE_PROJECTS.find((p) => p.name === project.name)!;
    return { ...project, metadata: {
      nativeURL: `http://127.0.0.1:${native.port}`,
      nativeFixture: native.fixture,
    } };
  }),
});
