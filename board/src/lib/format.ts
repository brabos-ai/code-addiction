// The interface copy is English, so its dates are too — a mixed-language line
// ("Live, read este minuto") reads as a bug.
const LOCALE = 'en';
const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800], ['day', 86_400], ['hour', 3_600], ['minute', 60],
];

/** "2 days ago", or the empty string for a missing or unparsable time. */
export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const secs = Math.round((t - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return rtf.format(0, 'minute');
}

export function absoluteTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(t);
}

/**
 * What a work id reads as on a card. Internal work is named by its plan
 * basename (`2026-09-21T145331-PLAN--backlog-board-002-board-app`), whose
 * timestamp says nothing at a glance; the slug after `PLAN--` does.
 */
export function workLabel(workId: string): string {
  const m = workId.match(/^\d{4}-\d{2}-\d{2}T\d{6}-PLAN--(.+)$/);
  return m ? m[1]! : workId;
}
