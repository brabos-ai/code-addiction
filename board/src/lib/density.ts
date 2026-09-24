/**
 * Card density on the board. "comfortable" shows each card's summary and meta;
 * "compact" keeps the status line, a one-line title and the labels, so a lane
 * shows about three times as many cards.
 *
 * Kept in localStorage and put on <html data-density>, where the `compact:`
 * variant in index.css reads it. index.html sets it before the first paint,
 * with the same key; board/test/theme.test.ts holds the two together.
 */
export type Density = 'comfortable' | 'compact';

export const DENSITY_KEY = 'board-density';

export function readDensity(): Density {
  try {
    if (localStorage.getItem(DENSITY_KEY) === 'compact') return 'compact';
  } catch {
    // Storage blocked: the default applies.
  }
  return 'comfortable';
}

export function saveDensity(density: Density): void {
  try {
    if (density === 'compact') localStorage.setItem(DENSITY_KEY, density);
    else localStorage.removeItem(DENSITY_KEY);
  } catch {
    // Not saved; it still applies for this page.
  }
  document.documentElement.dataset.density = density;
}
