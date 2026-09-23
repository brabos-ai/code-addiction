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

/**
 * A hex colour as #rrggbb, expanding the #rgb shorthand.
 *
 * The build minifies CSS, so an authored #ffffff is served as #fff and a
 * three-digit value reaches any test that reads a token back.
 */
function hex6(colour: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(colour);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : colour;
}

/** A colour as [r, g, b], from a hex or any rgb()/rgba() string. */
function channels(colour: string): [number, number, number] {
  if (colour.startsWith('#')) {
    const full = hex6(colour);
    return [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
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
async function composited(
  target: Locator,
  backdrop: string,
  prop: 'backgroundColor' | 'color' = 'backgroundColor',
): Promise<string> {
  return target.evaluate(
    (el, [back, which]) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = back as string;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = getComputedStyle(el)[which as 'color'];
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    },
    [backdrop, prop] as const,
  );
}

/** WCAG contrast ratio between two opaque colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
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

// The id and the rank render on the board card and on the list row alike, and a
// floor met on one surface and missed on the other is the same datum told two
// different ways.
for (const scheme of ['light', 'dark'] as const) {
for (const route of ['/board', '/list'] as const) {
  test(`L4.1/L4.2 ${route} id and rank clear their contrast floors in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(route);
    const card = page.getByRole('link', { name: /A doctor for document schemas/ });
    await expect(card).toBeVisible();
    const surface = await token(page, '--surface');

    // The id is what a person copies into a command. It carried --faint, at
    // ~2.8:1 on the light page, which is decoration contrast, not text contrast.
    const id = card.getByText('0001B');
    expect(contrast(await composited(id, surface, 'color'), surface)).toBeGreaterThanOrEqual(4.5);

    // The rank is the card's declared one bold element (board/src/index.css:3-5).
    // The size half of this assertion is deliberate: it stops the contrast floor
    // being met by shrinking the very thing the stylesheet nominates as bold.
    const rank = card.getByLabel(/^Priority \d/);
    expect(contrast(await composited(rank, surface, 'color'), surface)).toBeGreaterThanOrEqual(3);

    const sizes = await card.evaluate((el) =>
      Array.from(el.querySelectorAll('*')).map((n) => parseFloat(getComputedStyle(n).fontSize)),
    );
    const rankSize = await rank.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(rankSize, 'the rank is still the largest type here').toBe(Math.max(...sizes));
  });
}
}

test('L4.5 an empty column collapses, and the row still does not scroll the page', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone layout shows one column at a time');
  // The fixture deliberately fills every status, so the unfiltered board has no
  // empty column to measure. This filter narrows it to one open ticket.
  await page.goto('/board?q=sweep');
  await expect(page.getByRole('link', { name: /Sweep the artefacts/ })).toBeVisible();

  const width = (status: string) =>
    page.locator(`#col-${status}`).evaluate((el) => el.getBoundingClientRect().width);
  const [open, doing, done, dropped] = await Promise.all(
    ['open', 'doing', 'done', 'dropped'].map(width),
  );
  for (const [name, empty] of [['doing', doing], ['done', done], ['dropped', dropped]] as const) {
    expect(empty, `the empty ${name} column is narrower than the populated one`).toBeLessThan(open!);
  }
  // Fixed-width columns can exceed the viewport. That overflow must live on the
  // columns row, never on the document.
  await noSidewaysScroll(page);
  await shot(page, 'board-collapsed');
});

test('L4 the sheet shows how to close it without adding a second button', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'a phone has no Esc key, so the hint is hidden there');
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Esc is the gesture people actually use, so the sheet says so. It must stay
  // a hint: the header carries the close control and nothing else (L3.5).
  const hint = dialog.getByText('Esc', { exact: true });
  await expect(hint).toBeVisible();
  expect(await hint.evaluate((el) => el.tagName)).not.toBe('BUTTON');
  await expect(dialog.getByRole('button')).toHaveCount(1);
});

test('L4.6 green means done, and the accent is actually on the page', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the header hides the live stamp below sm');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();

  // The heartbeat read var(--s-done) directly, so green meant both "this ticket
  // is finished" and "the server is connected" in one viewport.
  const [heartbeat, done] = await Promise.all([
    page.locator('p[aria-live="polite"] span span').last().evaluate((el) => getComputedStyle(el).backgroundColor),
    token(page, '--s-done'),
  ]);
  expect(luminance(heartbeat)).not.toBeCloseTo(luminance(done), 4);

  // An accent that renders nowhere on either main view is not an accent. The
  // active view switch is a navigational role, never a status one.
  const [active, accent] = await Promise.all([
    page.getByRole('link', { name: 'Board', exact: true }).evaluate((el) => getComputedStyle(el).color),
    token(page, '--accent'),
  ]);
  expect(luminance(active)).toBeCloseTo(luminance(accent), 4);
});

// --surface-3 is a NEW plane and it is lighter than --surface, so every text
// token calibrated against the card has to be re-checked on it. The sheet is
// the only place it renders.
for (const scheme of ['light', 'dark'] as const) {
  test(`L4 text inside the sheet clears 4.5:1 on its own plane in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/board/0001B');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const plane = await token(page, '--surface-3');
    for (const text of [dialog.getByText('0001B'), dialog.getByText(/^Priority \d+ of \d+$/)]) {
      const colour = await composited(text, plane, 'color');
      expect(contrast(colour, plane), await text.innerText()).toBeGreaterThanOrEqual(4.5);
    }
  });

  test(`L4 every status pill clears 4.5:1 in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/list');
    await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
    // Scoped to the table: the filter bar's status toggles carry data-status
    // too, and they are plain buttons that clear any floor trivially.
    const table = page.locator('section[aria-label="Tickets by priority"]');
    for (const status of ['open', 'doing', 'done', 'dropped']) {
      const pill = table.locator(`span[data-status="${status}"]`).first();
      await expect(pill, `a ${status} pill is on the page`).toBeVisible();
      const surface = await token(page, '--surface');
      const bg = await composited(pill, surface);
      const fg = await composited(pill, bg, 'color');
      expect(contrast(fg, bg), `the ${status} pill`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('L4.4 the light scheme is cool throughout, ground and type alike', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // "Cool" is blue >= green in the raw channels. A warm ground under cool type
  // is what the stylesheet's own "cool neutrals" direction rules out.
  const names = ['--bg', '--surface-2', '--line', '--line-strong', '--muted', '--faint', '--ink'];
  const warm: string[] = [];
  const unread: string[] = [];
  for (const name of names) {
    const value = await token(page, name);
    if (!/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(value)) { unread.push(`${name}: ${value}`); continue; }
    const [, g, b] = channels(value);
    if (b < g) warm.push(`${name}: ${value}`);
  }
  // A token this test could not parse is a token it silently stopped checking.
  expect(unread, 'every neutral was read').toEqual([]);
  expect(warm).toEqual([]);
});
