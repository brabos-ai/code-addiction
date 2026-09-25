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
  // A tripwire on the EXACT set, not a cap. What this guards is the action
  // region for running or refining a ticket, which ticket-sheet.tsx:19-22 says
  // is designed and deliberately not rendered — so any button arriving here
  // still trips this and has to be argued for, as the id copy was.
  await expect(dialog.getByRole('button')).toHaveCount(2);
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /^Copy ticket id/ })).toBeVisible();
});

test('L3.6 at 360 px the kanban shows one column and a column switcher', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-360', 'phone layout only');
  await page.goto('/board');
  const tabs = page.getByRole('tablist', { name: 'Column' });
  await expect(tabs).toBeVisible();
  await expect(page.getByRole('region').filter({ visible: true })).toHaveCount(1);
  await tabs.getByRole('tab', { name: /Building/ }).click();
  await expect(page.getByRole('link', { name: /backward compatibility/ })).toBeVisible();
  await noSidewaysScroll(page);
  await shot(page, 'board-doing');
});

test('keyboard: "/" focuses the search', async ({ page }) => {
  await page.goto('/board');
  await page.getByRole('heading', { name: 'Backlog' }).or(page.getByRole('tablist')).first().waitFor();
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search tickets' })).toBeFocused();
});

test('dark mode follows the system and keeps every route readable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(27, 28, 31)');
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

test('L4.3 dark mode separates the page from what sits on it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const planes = await Promise.all(['--bg', '--surface'].map((t) => token(page, t)));
  const [bg, surface] = planes.map(luminance) as [number, number];
  expect(planes, 'both planes declared').not.toContain('');
  // A card reads as raised without a shadow, which is what lets the sheet drop
  // its own and still be legible as a separate surface.
  expect(bg).toBeLessThan(surface);
});

test('L4.3 the sheet is a pane, not a slab dropped on the board', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'a phone bottom sheet keeps its radius and shadow');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const style = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return { shadow: s.boxShadow, radius: s.borderTopLeftRadius, border: s.borderLeftWidth, bg: s.backgroundColor };
  });
  // It shared the app's lightest surface, a drop shadow, an inset highlight and
  // a radius all at once. What separates it now is one rule.
  //
  // Tailwind's shadow-none paints a zero-alpha shadow rather than resolving to
  // the keyword, so what is asserted is that nothing is painted: every colour
  // in the value carries alpha 0.
  const painted = (style.shadow.match(/rgba?\([^)]*\)/g) ?? []).filter((c) => !/,\s*0\s*\)$/.test(c));
  expect(painted, 'no drop shadow above sm').toEqual([]);
  expect(parseFloat(style.radius), 'square against the edge').toBe(0);
  expect(parseFloat(style.border), 'separated by a rule').toBeGreaterThan(0);
  expect(luminance(style.bg)).toBeCloseTo(luminance(await token(page, '--surface')), 4);
});

test('L4 opt-in theme and layer chip read as two treatments in dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${test.info().config.metadata.layersURL}/board`);
  const card = page.getByRole('link', { name: /A doctor for document schemas/ });
  await expect(card).toBeVisible();
  // A theme is where a ticket belongs, a label is a tag on it. Two chips side
  // by side read as two tags, so the theme is plain text and the label is the
  // one outlined chip.
  const theme = card.getByTitle('Delivered-work relationships');
  const label = card.getByText('product', { exact: true });
  const style = (l: Locator) => l.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, ring: s.boxShadow };
  });
  const [t, l] = [await style(theme), await style(label)];
  expect(t.bg, 'the theme has no fill').toMatch(/rgba?\(0, 0, 0, 0\)|transparent/);
  expect(t.ring, 'the theme has no outline').toBe('none');
  await expect(theme.locator('svg'), 'the theme is text, not an icon').toHaveCount(0);
  expect(l.ring, 'the label is outlined').not.toBe('none');
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

    const rank = card.getByLabel(/^Priority \d/);
    if (route === '/list') {
      // In the list the rank is its own Priority column, set as #n like the card.
      expect(contrast(await composited(rank, surface, 'color'), surface)).toBeGreaterThanOrEqual(3);
      const sizes = await card.evaluate((el) =>
        Array.from(el.querySelectorAll('*')).map((n) => parseFloat(getComputedStyle(n).fontSize)),
      );
      const rankSize = await rank.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(rankSize, 'the rank is still the largest type in the row').toBe(Math.max(...sizes));
    } else {
      // On the card the rank is small text in a badge, so it takes the text floor.
      const badge = await composited(rank, surface);
      expect(contrast(await composited(rank, badge, 'color'), badge)).toBeGreaterThanOrEqual(4.5);
      // And it takes no column: the title starts at the card's content edge,
      // where the status line starts. It sat 36px in, behind the rank.
      const left = (l: Locator) => l.evaluate((el) => Math.round(el.getBoundingClientRect().left));
      const statusLine = rank.locator('xpath=..');
      expect(await left(card.getByRole('heading')), 'the title uses the full width').toBe(await left(statusLine));
    }
  });
}
}

test('L4.5 a lane with cards is wider than an empty one, and an empty one shows only its header', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone layout shows one column at a time');
  // The fixture puts a ticket in five of the six visible columns, so this filter
  // is what empties them — the state a real board sits in most of the time.
  await page.goto('/board?q=sweep');
  await expect(page.getByRole('link', { name: /Sweep the artefacts/ })).toBeVisible();

  const columns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('section[id^="col-"]')).map((el) => ({
      id: el.id,
      width: Math.round(el.getBoundingClientRect().width),
      items: el.querySelectorAll('li').length,
    })),
  );
  // Equal shares made the one column with cards the narrowest thing on the
  // board at 1080-1536px. The lane with cards gets the room; the empty ones
  // share one narrower width, and their tint keeps them reading as columns.
  const full = columns.filter((c) => c.items > 0);
  const empty = columns.filter((c) => c.items === 0);
  expect(full.length, `one lane holds the match: ${JSON.stringify(columns)}`).toBe(1);
  expect(new Set(empty.map((c) => c.width)).size, 'empty lanes share one width').toBe(1);
  expect(full[0]!.width).toBeGreaterThan(empty[0]!.width);
  await noSidewaysScroll(page);
  await shot(page, 'board-filtered');
});

test('L4 the sheet shows how to close it, and the Esc hint is not a control', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'a phone has no Esc key, so the hint is hidden there');
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Esc is the gesture people actually use, so the sheet says so. It must stay
  // a hint: the header carries the close control and nothing else (L3.5).
  const hint = dialog.getByText('Esc', { exact: true });
  await expect(hint).toBeVisible();
  expect(await hint.evaluate((el) => el.tagName)).not.toBe('BUTTON');
  // The exact set, pinned in L3.5 too: Close and the id copy, nothing else.
  await expect(dialog.getByRole('button')).toHaveCount(2);
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

// Text inside the sheet is measured against the sheet's OWN rendered
// background rather than a token, so the assertion survives the surface being
// changed under it — which is exactly what direction A did to it.
for (const scheme of ['light', 'dark'] as const) {
  test(`L4 text inside the sheet clears 4.5:1 on its own plane in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/board/0001B');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const plane = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
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
    // Every status on the page, not a fixed four: shaped and in-review took
    // phase hues of their own, and each has to clear the floor on its chip.
    const present = [...new Set(await table.locator('span[data-status]').evaluateAll((els) => els.map((e) => e.getAttribute('data-status') ?? '')))];
    expect(present.length, `statuses on the page: ${present.join(', ')}`).toBeGreaterThanOrEqual(6);
    for (const status of present) {
      const pill = table.locator(`span[data-status="${status}"]`).first();
      await expect(pill, `a ${status} pill is on the page`).toBeVisible();
      const surface = await token(page, '--surface');
      const bg = await composited(pill, surface);
      const fg = await composited(pill, bg, 'color');
      expect(contrast(fg, bg), `the ${status} pill`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('L4.5 a full board: the page stays put and every column is reachable along the row', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-1080', 'the narrower projects scroll by design');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // This asserted that every column fit 1080 with no scrolling at all. That held
  // at four columns; the shipped phase model puts six on the board, and at the
  // 15rem floor six do not fit 1080. The user chose, on 2026-09-23, to ship the
  // six with the ROW scrolling rather than shrink the floor or merge columns
  // (plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses, L16.2); a
  // layout that fits them is its own delivery. What stays guarded: the page
  // never scrolls sideways, and scrolling the row brings every column in.
  await noSidewaysScroll(page);
  const unreachable = await page.evaluate(() => {
    const view = document.documentElement.clientWidth;
    const columns = Array.from(document.querySelectorAll('section[id^="col-"]'));
    const row = columns[0]!.parentElement!;
    row.scrollLeft = row.scrollWidth;
    return columns.filter((el) => el.getBoundingClientRect().right > view + 1).map((el) => el.id);
  });
  expect(unreachable, 'the last column is in view once the row is scrolled to its end').toEqual([]);
});

test('L5.2 the sheet keeps status and id in view while the body scrolls', async ({ page }) => {
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const id = dialog.getByText('0001B');
  await expect(id).toBeInViewport();
  // 0001B carries long notes, so its body scrolls at every viewport.
  await dialog.locator('[data-sheet-body]').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(dialog.locator('[data-sheet-body]')).not.toHaveJSProperty('scrollTop', 0);
  await expect(id, 'the id is still in view at the bottom of the notes').toBeInViewport();
  await expect(dialog.locator('[data-status]').first()).toBeInViewport();
});

test('L5.1/L5.4 the sheet shows what a ticket IS without scrolling', async ({ page }) => {
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Theme and labels lived in a Details section after every note, so learning
  // what area a ticket belonged to meant scrolling past all of it.
  await expect(dialog.getByText('Delivered-work relationships')).toBeInViewport();
  await expect(dialog.getByRole('heading', { name: 'Details' })).toHaveCount(0);
});

test('L5.3 no prose in the sheet runs past 70 characters a line', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop-1080', 'the narrow panels are already under the cap');
  await page.goto('/board/0001B');
  await expect(page.getByRole('dialog')).toBeVisible();
  // Measured in the element's own font rather than guessed from a class: a
  // 70-character sample is drawn on a canvas at the computed font and its width
  // is the ceiling. Anything wider is a line the eye has to track back across.
  const tooWide = await page.evaluate(() => {
    const sample = 'n'.repeat(70);
    const ctx = document.createElement('canvas').getContext('2d')!;
    return Array.from(document.querySelectorAll('[data-sheet-body] p'))
      .filter((el) => (el.textContent ?? '').trim().length > 90)
      .map((el) => {
        const style = getComputedStyle(el);
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const ceiling = ctx.measureText(sample).width;
        const width = el.getBoundingClientRect().width;
        return { width: Math.round(width), ceiling: Math.round(ceiling), text: (el.textContent ?? '').slice(0, 40) };
      })
      .filter((m) => m.width > m.ceiling);
  });
  expect(tooWide, 'prose blocks past the 70-character ceiling').toEqual([]);
});

test('L5.6 the filter row sits on one rhythm', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone collapses the refine controls');
  await page.goto('/list');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const box = (l: Locator) => l.evaluate((el) => Math.round(el.getBoundingClientRect().height));
  const search = await box(page.getByRole('searchbox', { name: 'Search tickets' }));
  const filter = await box(page.getByRole('button', { name: 'open', exact: true }));
  // The search was taller than every control beside it, which is what made it
  // the heaviest thing in a row where it is the least used.
  expect(search, 'search matches the height of the controls beside it').toBe(filter);
});

test('L5.7 the four statuses are told apart with colour removed', async ({ page }) => {
  await page.goto('/list');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const table = page.locator('section[aria-label="Tickets by priority"]');
  const shapes: string[] = [];
  for (const status of ['open', 'doing', 'done', 'dropped']) {
    const glyph = table.locator(`span[data-status="${status}"] [data-glyph]`).first();
    await expect(glyph, `the ${status} pill carries a glyph`).toBeAttached();
    // The markup, not the computed colour: hue comes from a CSS variable, so a
    // difference here is a difference in shape.
    shapes.push(await glyph.evaluate((el) => el.innerHTML));
  }
  expect(new Set(shapes).size, `four statuses, ${new Set(shapes).size} distinct shapes`).toBe(4);
});

test('L5.8 J and K move between tickets without closing the sheet', async ({ page }) => {
  await page.goto('/board/0001B?q=e');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/\/board\/0002B/);
  await expect(dialog, 'the sheet stays open across the move').toBeVisible();
  await expect(page, 'the filter survives the move').toHaveURL(/q=e/);
  await page.keyboard.press('k');
  await expect(page).toHaveURL(/\/board\/0001B/);
  // Esc still closes, which is the gesture this must not have taken over.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('L5.9 ? opens the shortcut list and Esc closes it', async ({ page }) => {
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  await page.keyboard.press('?');
  const help = page.getByRole('dialog', { name: /shortcut/i });
  await expect(help).toBeVisible();
  await expect(help).toContainText('Esc');
  await page.keyboard.press('Escape');
  await expect(help).toHaveCount(0);
  // The one shortcut that already existed still works and is not swallowed.
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search tickets' })).toBeFocused();
});

test('L5.10 the sheet id copies itself when clicked', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /copy ticket id/i }).click();
  await expect(dialog.getByText('Copied')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0001B');
});

for (const scheme of ['light', 'dark'] as const) {
  test(`L5 the shortcut keys clear 4.5:1 in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/board');
    await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
    await page.keyboard.press('?');
    const key = page.getByRole('dialog', { name: /shortcut/i }).locator('kbd').first();
    await expect(key).toBeVisible();
    // The kbd is a translucent film on the sheet plane, so its backdrop is the
    // composite, not the token. Both layers are resolved before measuring.
    const plane = await page.getByRole('dialog', { name: /shortcut/i }).evaluate((el) => getComputedStyle(el).backgroundColor);
    const behind = await composited(key, plane);
    expect(contrast(await composited(key, behind, 'color'), behind)).toBeGreaterThanOrEqual(4.5);
  });
}

test('L5 the copy acknowledgement does not follow you to the next ticket', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/board/0001B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /copy ticket id/i }).click();
  await expect(dialog.getByText('Copied')).toBeVisible();
  // J within the acknowledgement's second: the panel re-renders with a new id
  // rather than unmounting, so the check can stay lit on a ticket nobody copied.
  await page.keyboard.press('j');
  await expect(page).toHaveURL(/0002B/);
  await expect(dialog.getByText('Copied'), 'the tick belongs to the id that was copied').toHaveCount(0, { timeout: 400 });
});

test('L5 ? works with a ticket already open, and Esc unstacks one layer at a time', async ({ page }) => {
  await page.goto('/board/0001B');
  // Radix points aria-labelledby at Dialog.Title, which wins over aria-label,
  // so the sheet's accessible name is the ticket's own title.
  const sheet = page.getByRole('dialog', { name: /A doctor for document schemas/ });
  await expect(sheet).toBeVisible();
  await page.keyboard.press('?');
  const help = page.getByRole('dialog', { name: /shortcut/i });
  await expect(help).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(help, 'Esc closes the top layer').toHaveCount(0);
  await expect(sheet, 'and leaves the ticket open under it').toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet, 'the next Esc closes the ticket').toHaveCount(0);
});

test('Escape closes shortcuts immediately after mounting without closing the ticket', async ({ page }) => {
  await page.goto('/board/0001B');
  const sheet = page.getByRole('dialog', { name: /A doctor for document schemas/ });
  await expect(sheet).toBeVisible();
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      const help = document.querySelector('[role="dialog"][aria-label="Keyboard shortcuts"]');
      if (!help) return;
      observer.disconnect();
      help.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      document.documentElement.dataset.immediateEscape = 'sent';
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
  await page.keyboard.press('?');
  await expect(page.locator('html')).toHaveAttribute('data-immediate-escape', 'sent');
  await expect(page.getByRole('dialog', { name: /shortcut/i })).toHaveCount(0);
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/\/board\/0001B$/);
});

test('L4.4 the light scheme is cool throughout, ground and type alike', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // "Cool" is blue >= green in the raw channels. A warm ground under cool type
  // is what the stylesheet's own "cool neutrals" direction rules out.
  const names = ['--bg', '--lane', '--surface-2', '--line', '--line-strong', '--muted', '--faint', '--ink'];
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

// Plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses, F43 / L15-L16.
// L16.1 is a MEASUREMENT: the shipped definitions put six columns on the board
// by default and seven with ?column=dropped, and the page must not scroll
// sideways at either count on any of the three viewports.
for (const [url, count] of [['/board', 6], ['/board?column=dropped', 7]] as const) {
  test(`L16.1 ${count} columns: no sideways scroll`, async ({ page }) => {
    await page.goto(url);
    await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
    await expect(page.locator('section[id^="col-"]')).toHaveCount(count);
    await noSidewaysScroll(page);
    await shot(page, `board-${count}-columns`);
  });
}

test('L15.2-L15.4 show dropped is additive and survives a reload', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone collapses the refine controls');
  await page.goto('/board');
  await expect(page.locator('#col-dropped')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show dropped' }).first().click();
  // The router writes a list param as JSON: column=%5B%22dropped%22%5D.
  await expect(page).toHaveURL(/column=.*dropped/);
  await expect(page.locator('section[id^="col-"]')).toHaveCount(7);
  await page.reload();
  await expect(page.locator('#col-dropped')).toBeVisible();
  await expect(page.getByRole('link', { name: /Cache the provider map/ })).toBeVisible();
});

test('L15.6 a shaped ticket shows its feature, and Work is still not picked up', async ({ page }) => {
  await page.goto('/board/0002B');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('dt', { hasText: /^Feature$/ }).locator('xpath=following-sibling::dd[1]')).toHaveText('0042F');
  await expect(dialog.locator('dt', { hasText: /^Work$/ }).locator('xpath=following-sibling::dd[1]')).toHaveText('Not picked up');
});

test('the theme switch overrides the OS, survives a reload, and System hands it back', async ({ page }) => {
  // The scheme followed the OS and nothing else: on a dark desktop there was no
  // way to see the board light.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/board');
  const theme = page.getByRole('radiogroup', { name: 'Theme' });
  await expect(theme.getByRole('radio', { name: 'System theme' })).toHaveAttribute('aria-checked', 'true');
  const scheme = () => page.evaluate(() => document.documentElement.dataset.theme);
  expect(await scheme()).toBe('dark');

  await theme.getByRole('radio', { name: 'Light theme' }).click();
  expect(await scheme()).toBe('light');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(241, 242, 245)');
  await page.reload();
  expect(await scheme(), 'the choice survives a reload').toBe('light');
  await expect(theme.getByRole('radio', { name: 'Light theme' })).toHaveAttribute('aria-checked', 'true');

  await theme.getByRole('radio', { name: 'System theme' }).click();
  expect(await scheme(), 'System follows the OS again').toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(scheme, { message: 'and keeps following it' }).toBe('light');
});

test('the filter toggles and the view switch render at the meta size', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone collapses the refine controls');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // tailwind-merge read text-meta as a colour and dropped it beside text-muted,
  // so these rendered at the browser's 16px, bigger than the search beside them.
  const size = (l: Locator) => l.evaluate((el) => getComputedStyle(el).fontSize);
  expect(await size(page.getByRole('button', { name: 'Show dropped' }))).toBe('13px');
  expect(await size(page.getByRole('link', { name: 'Board', exact: true }))).toBe('13px');
});

test('each phase has a hue of its own, and a status takes its phase hue', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone shows one lane at a time');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // Only four of nine statuses had a hue, so every lane but Done read grey.
  const markers = await page.evaluate(() =>
    Array.from(document.querySelectorAll('section[data-phase]')).map((el) => ({
      phase: el.getAttribute('data-phase'),
      colour: getComputedStyle(el.querySelector('header > span[aria-hidden]')!).backgroundColor,
    })),
  );
  expect(new Set(markers.map((m) => m.colour)).size, JSON.stringify(markers)).toBe(markers.length);
  // A card's status line carries its lane's hue. Shaping holds two statuses,
  // so its cards name theirs.
  const lane = page.locator('section[data-phase="shaping"]');
  const status = lane.locator('a [data-status]').first();
  await expect(status).toBeVisible();
  const [ph, st] = await Promise.all([
    lane.locator('header > span[aria-hidden]').evaluate((el) => getComputedStyle(el).backgroundColor),
    status.evaluate((el) => getComputedStyle(el).color),
  ]);
  expect(st).toBe(ph);
});

test('the board is one screen tall, so the sideways scrollbar is always in view', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone shows one lane at a time and scrolls the page');
  await page.setViewportSize({ width: 1080, height: 500 });
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // The row's scrollbar sat under the tallest lane, far below the fold.
  const m = await page.evaluate(() => {
    const row = document.querySelector('section[id^="col-"]')!.parentElement!;
    return {
      rowBottom: row.getBoundingClientRect().bottom,
      view: innerHeight,
      page: document.scrollingElement!.scrollHeight - document.scrollingElement!.clientHeight,
      lane: Array.from(document.querySelectorAll('section[id^="col-"] ol')).map((ol) => getComputedStyle(ol).overflowY),
    };
  });
  expect(m.rowBottom, 'the row ends inside the screen').toBeLessThanOrEqual(m.view);
  expect(m.page, 'the page does not scroll down').toBe(0);
  // Wider populated lanes wrap less, so a short viewport may not overflow; the
  // lane still owns vertical scrolling when the cards do not fit.
  expect(m.lane.some((o) => o === 'auto' || o === 'scroll'), 'lanes scroll their own cards').toBe(true);
});

test('a card names its status only where its lane holds more than one', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'checked on the lanes side by side');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  // Backlog holds only open: every card saying "open" there was noise.
  await expect(page.locator('#col-backlog a [data-status]')).toHaveCount(0);
  // Shaping holds refining and shaped, so the card says which.
  await expect(page.locator('#col-shaping a [data-status]').first()).toBeVisible();
});

test('an empty lane keeps its status meanings on the header tooltip', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone shows one lane at a time');
  await page.goto('/board?q=sweep');
  await expect(page.getByRole('link', { name: /Sweep the artefacts/ })).toBeVisible();
  // The definitions' own words sit on the header title, not as body text that
  // reads as a stub ticket in the lane.
  await expect(page.locator('#col-building header')).toHaveAttribute('title', /add\.build running/);
  await expect(page.locator('#col-shaping header')).toHaveAttribute('title', /Refining/);
  await expect(page.locator('#col-building')).not.toContainText('add.build running');
});

for (const layers of [false, true]) {
test(`compact cards respect layer opt-in ${layers} and survive a reload`, async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the switch is not on a phone');
  await page.goto(layers ? `${test.info().config.metadata.layersURL}/board` : '/board');
  const card = page.getByRole('link', { name: /A doctor for document schemas/ });
  await expect(card).toBeVisible();
  const tall = await card.evaluate((el) => el.getBoundingClientRect().height);
  const summary = card.locator('p');
  await expect(summary).toBeVisible();

  const toggle = page.getByRole('button', { name: 'Compact cards' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(summary).toBeHidden();
  if (layers) await expect(card.getByText('product', { exact: true })).toBeVisible();
  else await expect(card.getByText('product', { exact: true })).toHaveCount(0);
  const short = await card.evaluate((el) => el.getBoundingClientRect().height);
  expect(short, 'a compact card is well under the comfortable one').toBeLessThan(tall * 0.6);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Compact cards' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ }).locator('p')).toBeHidden();
});
}


test('the filter row holds the search, Show dropped sits in the header, and nothing is built from labels or themes', async ({ page }) => {
  test.skip(test.info().project.name === 'mobile-360', 'the phone collapses the refine controls');
  await page.goto('/board');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  const form = page.getByRole('search');
  await expect(form.getByRole('searchbox', { name: 'Search tickets' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show dropped' }).first()).toBeVisible();
  await expect(form.getByRole('button', { name: 'Show dropped' })).toHaveCount(0);
  // Labels are a project's own tags, so toggles built from them meant nothing
  // on a board installed anywhere else; the theme dropdown repeated the search.
  await expect(form.getByRole('combobox')).toHaveCount(0);
  await expect(form.getByRole('group', { name: 'Labels' })).toHaveCount(0);
  await expect(form.getByRole('group', { name: 'Layer' })).toHaveCount(0);
  // An old URL with those params loads unfiltered, not filtered by a control
  // the page no longer shows.
  await page.goto('/board?label=%5B%22internal%22%5D&theme=Tooling');
  await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.has('label')).toBe(false);
});

async function expandFilters(page: Page) {
  await expect(page.getByRole('searchbox', { name: 'Search tickets' })).toBeVisible();
  const toggle = page.getByRole('button', { name: /^Filters/ });
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}

const ticketLinks = (page: Page) => page.locator('#content a[href^="/board/"], #content a[href^="/list/"]');

for (const route of ['/board', '/list'] as const) {
  test(`layers disabled ${route}: no summary chips, detail keeps all labels`, async ({ page }) => {
    await page.goto(route);
    const sweep = page.getByRole('link', { name: /Sweep the artefacts/ });
    await expect(sweep).toBeVisible();
    await expandFilters(page);
    await expect(page.getByRole('group', { name: 'Layer' })).toHaveCount(0);
    for (const label of ['product', 'internal', 'both', 'quality']) {
      await expect(ticketLinks(page).getByText(label, { exact: true })).toHaveCount(0);
    }
    await sweep.click();
    const detail = page.getByRole('dialog');
    await expect(detail.getByText('quality', { exact: true })).toBeVisible();
    await expect(detail.getByText('both', { exact: true })).toBeVisible();
  });

  test(`layers disabled ${route}: deep link is replaced, preserves other filters and stays clean on view switch`, async ({ page }) => {
    await page.goto(`${route}?label=%5B%22internal%22%5D&q=doctor&status=%5B%22open%22%5D&column=%5B%22dropped%22%5D`);
    const historyLength = await page.evaluate(() => history.length);
    await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.has('label')).toBe(false);
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    const params = new URL(page.url()).searchParams;
    expect(params.get('q')).toBe('doctor');
    expect(JSON.parse(params.get('status')!)).toEqual(['open']);
    expect(JSON.parse(params.get('column')!)).toEqual(['dropped']);
    await page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: route === '/board' ? 'List' : 'Board', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(route === '/board' ? '/list\\?' : '/board\\?'));
    expect(new URL(page.url()).searchParams.has('label')).toBe(false);
    await page.reload();
    await expect(page.getByRole('link', { name: /A doctor for document schemas/ })).toBeVisible();
    expect(new URL(page.url()).searchParams.has('label')).toBe(false);
  });

  test(`layers enabled ${route}: OR selection, reload, view switch, mobile counter and clear`, async ({ page }) => {
    await page.goto(`${test.info().config.metadata.layersURL}${route}`);
    await expandFilters(page);
    const group = page.getByRole('group', { name: 'Layer' });
    await expect(group).toBeVisible();
    await expect(group.getByRole('button')).toHaveText(['product', 'internal', 'both']);
    await group.getByRole('button', { name: 'product', exact: true }).click();
    await expect(page).toHaveURL(/label=%5B%22product%22%5D/);
    await expect(ticketLinks(page)).toHaveCount(route === '/board' ? 3 : 4);
    await expect(ticketLinks(page).filter({ hasText: 'Sweep the artefacts' })).toHaveCount(0);
    await group.getByRole('button', { name: 'both', exact: true }).click();
    await expect(page).toHaveURL(/label=%5B%22product%22%2C%22both%22%5D/);
    await expect(ticketLinks(page)).toHaveCount(route === '/board' ? 4 : 5);
    const sweep = ticketLinks(page).filter({ hasText: 'Sweep the artefacts' });
    await expect(sweep.getByText('quality', { exact: true })).toHaveCount(0);
    if (route === '/board' || test.info().project.name === 'mobile-360') {
      await expect(sweep.getByText('both', { exact: true })).toBeVisible();
    }
    if (test.info().project.name === 'mobile-360') {
      await expect(page.getByRole('button', { name: /^Filters/ })).toHaveText('Filters2');
    }
    await noSidewaysScroll(page);
    await shot(page, `layers-${route.slice(1)}`);
    await page.reload();
    await expandFilters(page);
    await expect(group.getByRole('button', { name: 'product', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(group.getByRole('button', { name: 'both', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: route === '/board' ? 'List' : 'Board', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(route === '/board' ? '/list\\?' : '/board\\?'));
    await expect(page).toHaveURL(/label=%5B%22product%22%2C%22both%22%5D/);
    await expect(ticketLinks(page)).toHaveCount(route === '/board' ? 5 : 4);
    await expandFilters(page);
    await page.getByRole('button', { name: test.info().project.name === 'mobile-360' ? 'Clear filters' : 'Clear', exact: true }).click();
    await expect.poll(() => new URL(page.url()).search).toBe('');
    await expect(ticketLinks(page)).toHaveCount(route === '/board' ? 7 : 6);
  });

  test(`layers enabled ${route}: mixed deep link keeps valid labels and detail retains quality`, async ({ page }) => {
    await page.goto(`${test.info().config.metadata.layersURL}${route}/0004B?label=%5B%22both%22%2C%22quality%22%5D&q=sweep&status=%5B%22open%22%5D`);
    const detail = page.getByRole('dialog');
    await expect(detail).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('label')).toBe('["both"]');
    expect(new URL(page.url()).pathname).toBe(`${route}/0004B`);
    expect(new URL(page.url()).searchParams.get('q')).toBe('sweep');
    expect(new URL(page.url()).searchParams.get('status')).toBe('["open"]');
    await expect(detail.getByText('quality', { exact: true })).toBeVisible();
    await expect(detail.getByText('both', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(ticketLinks(page)).toHaveCount(1);
    await expect(ticketLinks(page).getByText('quality', { exact: true })).toHaveCount(0);
  });
}
