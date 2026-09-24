/**
 * The colour scheme. "system" follows the OS; "light" and "dark" are a choice
 * made in the header, kept in localStorage so it survives a reload.
 *
 * index.html runs the same resolution inline before the first paint, so the
 * page never flashes the wrong scheme. The key and the resolution here must
 * match that script; board/test/theme.test.ts holds them together.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_KEY = 'board-theme';

// null where there is no matchMedia (jsdom): "system" then reads as light.
const media = (): MediaQueryList | null =>
  typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // Storage blocked (private window, policy): the OS decides.
  }
  return 'system';
}

export function resolveScheme(choice: ThemeChoice, systemDark: boolean): 'light' | 'dark' {
  return choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;
}

/** Puts the scheme on <html> and keeps the browser chrome on the page's --bg. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  root.dataset.theme = resolveScheme(choice, media()?.matches ?? false);
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (bg) document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', bg));
}

export function saveChoice(choice: ThemeChoice): void {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Not saved; it still applies for this page.
  }
  applyTheme(choice);
}

/** Re-applies "system" when the OS scheme changes. Returns the unsubscribe. */
export function followSystem(choice: ThemeChoice): () => void {
  const m = media();
  if (choice !== 'system' || !m) return () => {};
  const on = () => applyTheme('system');
  m.addEventListener('change', on);
  return () => m.removeEventListener('change', on);
}
