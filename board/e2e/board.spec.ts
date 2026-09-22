// The board in a real browser, at 360, 768 and 1080 px (plan F4, L3).
// Every test runs once per viewport project in playwright.config.ts.
import { expect, test, type Page } from '@playwright/test';

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

async function noSidewaysScroll(page: Page) {
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.scrollingElement!.scrollWidth,
    client: document.scrollingElement!.clientWidth,
  }));
  expect(scroll, 'page scrolls sideways').toBeLessThanOrEqual(client);
}

async function shot(page: Page, name: string) {
  // Let entrance animations finish, or the picture shows a sheet half-way in.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity));
  const project = test.info().project.name;
  await page.screenshot({ path: `test-results/screens/${project}--${name}.png`, fullPage: true });
}

test('L3.1/L3.2 /board renders with no sideways scroll', async ({ page }) => {
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  await noSidewaysScroll(page);
  await shot(page, 'board');
});

test('L3.1/L3.2 /list renders every ticket in priority order', async ({ page }) => {
  await page.goto('/list');
  const rows = page.getByRole('list').locator(':scope > li');
  await expect(rows).toHaveCount(7);
  await expect(rows.first()).toContainText('A doctor for document schemas');
  await noSidewaysScroll(page);
  await shot(page, 'list');
});

test('L3.3 opening a card changes the URL; Esc and Back close it', async ({ page }) => {
  await page.goto('/board');
  await page.getByRole('link', { name: /A doctor for document schemas/ }).click();
  await expect(page).toHaveURL(/\/board\/0001B/);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Done when');
  await noSidewaysScroll(page);
  await shot(page, 'ticket');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/board$/);

  await page.getByRole('link', { name: /A doctor for document schemas/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('L3.4 a filter reaches the URL and survives a reload', async ({ page }) => {
  await page.goto('/list');
  await page.getByRole('searchbox', { name: 'Search tickets' }).fill('sweep');
  await expect(page).toHaveURL(/q=sweep/);
  await expect(page.getByRole('list').locator(':scope > li')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox', { name: 'Search tickets' })).toHaveValue('sweep');
  await expect(page.getByRole('list').locator(':scope > li')).toHaveCount(1);
  await shot(page, 'list-filtered');
});

test('L3.5 the detail header holds only the close button; no Runs item renders', async ({ page }) => {
  // The navigation is checked first: an open dialog hides the page behind it
  // from the accessibility tree, as it should.
  await page.goto('/board');
  await expect(page.getByRole('navigation', { name: 'Views' }).getByRole('link')).toHaveCount(2);
  await expect(page.getByText(/\bruns?\b/i)).toHaveCount(0);

  await page.goto('/board/0003B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
});

test('L3.6 at 360 px the kanban shows one column and a status switcher', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-360', 'phone layout only');
  await page.goto('/board');
  const tabs = page.getByRole('tablist', { name: 'Status' });
  await expect(tabs).toBeVisible();
  await expect(page.getByRole('region').filter({ visible: true })).toHaveCount(1);
  await tabs.getByRole('tab', { name: /doing/ }).click();
  await expect(page.getByRole('link', { name: /backward compatibility/ })).toBeVisible();
  await noSidewaysScroll(page);
  await shot(page, 'board-doing');
});

test('keyboard: "/" focuses the search', async ({ page }) => {
  await page.goto('/board');
  await page.getByRole('heading', { name: 'open' }).or(page.getByRole('tablist')).first().waitFor();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search tickets' })).toBeFocused();
});

test('dark mode follows the system and keeps every route readable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(17, 19, 23)');
  await shot(page, 'board-dark');
  await page.goto('/board/0004B');
  await expect(page.getByRole('dialog')).toBeVisible();
  await shot(page, 'ticket-dark');
});
