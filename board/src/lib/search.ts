import { z } from 'zod';

// ONE schema for the view state of /board and /list. The route's validateSearch
// and the filter form both use it, so the URL and the form cannot disagree.
// Each field is parsed on its own: an invalid param is dropped, never thrown at
// the user, and never takes the valid ones down with it.

const text = z.string().trim().min(1).max(200);
const list = z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(text).min(1).max(20));

export const boardSearchSchema = z.object({
  q: text.optional(),
  theme: text.optional(),
  label: list.optional(),
  status: list.optional(),
  // Columns to show ON TOP OF the ones visible by default — an additive union,
  // never an override list. A column the definitions mark hidden shows only
  // when this names it.
  column: list.optional(),
});

export type BoardSearch = z.infer<typeof boardSearchSchema>;

const FIELDS = { q: text, theme: text, label: list, status: list, column: list } as const;

export function parseBoardSearch(input: Record<string, unknown>): BoardSearch {
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(FIELDS)) {
    if (!(key in input)) continue;
    const r = schema.safeParse(input[key]);
    if (r.success) out[key] = r.data;
  }
  return out as BoardSearch;
}

export function hasFilters(s: BoardSearch): boolean {
  return Boolean(s.q || s.theme || s.label?.length || s.status?.length || s.column?.length);
}
