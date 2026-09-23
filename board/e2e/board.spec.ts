// The board in a real browser, at 360, 768 and 1080 px (plan F4, L3).
// Every test runs once per viewport project in playwright.config.ts.
import { expect, test, type Locator, type Page } from '@playwright/test';

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
  expect(bg).toBe('rgb(12, 14, 18)');
  await shot(page, 'board-dark');
  await page.goto('/board/0004B');
  await expect(page.getByRole('dialog')).toBeVisible();
  await shot(page, 'ticket-dark');
});

/** A token's computed value, read off :root in whatever scheme is emulated. */
async function token(page: Page, name: string) {
  return page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
}

/** A colour as [r, g, b], from #rrggbb or any rgb()/rgba() string. */
function channels(colour: string): [number, number, number] {
  if (colour.startsWith('#')) {
    return [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16)) as [number, number, number];
  }
  const n = [...colour.matchAll(/[\d.]+/g)].map((m) => Number(m[0]));
  return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0];
}

/** Relative luminance per WCAG, from an OPAQUE colour. */
function luminance(colour: string): number {
  const [r, g, b] = channels(colour).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * What the eye actually receives from a translucent fill, as opaque rgb().
 *
 * getComputedStyle reports the DECLARED colour, and Chromium reports a Tailwind
 * alpha utility as oklab(L a b / α) — so parsing it as rgb reads the lightness
 * channel as red and silently drops the sign. Painting it over its backdrop on
 * a 1×1 canvas hands the blend to the browser's own colour engine instead.
 */
async function composited(target: Locator, backdrop: string): Promise<string> {
  return target.evaluate((el, back) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = back;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = getComputedStyle(el).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  }, backdrop);
}

test('L4.3 dark mode separates page, card and sheet into three planes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const planes = await Promise.all(['--bg', '--surface', '--surface-3'].map((t) => token(page, t)));
  const [bg, surface, sheet] = planes.map(luminance) as [number, number, number];
  // Elevation must read as elevation: each plane lighter than the one below it.
  expect(planes, 'all three planes declared').not.toContain('');
  expect(bg).toBeLessThan(surface);
  expect(surface).toBeLessThan(sheet);
});

test('L4.3 the sheet sits on its own plane, not the card plane', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const [panel, surface, sheet] = await Promise.all([
    dialog.evaluate((el) => getComputedStyle(el).backgroundColor),
    token(page, '--surface'),
    token(page, '--surface-3'),
  ]);
  // A floating panel drawn at the card's own lightness is not a layer.
  expect(luminance(panel)).toBeCloseTo(luminance(sheet), 4);
  expect(luminance(panel)).not.toBeCloseTo(luminance(surface), 4);
});

test('L4 the theme chip and the label chip read as two treatments in dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  const card = page.getByRole('link', { name: /A doctor for document schemas/ });
  await expect(card).toBeVisible();
  const surface = await token(page, '--surface');
  // The theme's text sits in an inner truncating span; the Chip is its parent.
  const themeChip = card.getByText('Delivered-work relationships').locator('xpath=..');
  const labelChip = card.getByText('product', { exact: true });

  // Filled vs outlined is the theme/label distinction. In dark both fell below
  // perception, so the markup was right and nothing could be seen.
  const label = await labelChip.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(label, 'the label chip is outlined, so it has no fill').toMatch(/rgba?\(0, 0, 0, 0\)|transparent/);
  const lift = luminance(await composited(themeChip, surface)) - luminance(surface);
  expect(lift, 'the theme chip is filled enough to see').toBeGreaterThan(0.012);
});

test('L4.4 the light scheme is cool throughout, ground and type alike', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // "Cool" is blue >= green in the raw channels. A warm ground under cool type
  // is what the stylesheet's own "cool neutrals" direction rules out.
  const warm: string[] = [];
  for (const name of ['--bg', '--surface-2', '--line', '--line-strong', '--muted', '--faint', '--ink']) {
    const hex = await token(page, name);
    const [, r, g, b] = /^#(\w\w)(\w\w)(\w\w)$/.exec(hex) ?? [];
    if (r && g && b && parseInt(b, 16) < parseInt(g, 16)) warm.push(`${name}: ${hex}`);
  }
  expect(warm).toEqual([]);
});
