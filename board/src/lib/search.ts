import { z } from 'zod';
import type { LayerFilter } from '@/api/types';

// ONE schema for the view state of /board and /list. The route's validateSearch
// and the filter form both use it, so the URL and the form cannot disagree.
// Each field is parsed on its own: an invalid param is dropped, never thrown at
// the user, and never takes the valid ones down with it.

const text = z.string().trim().min(1).max(200);
const list = z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(text).min(1).max(20));

// Theme stays ignored. Label is parsed here, then restricted to the server's
// opt-in capability before it can filter tickets or count as an active filter.
export const boardSearchSchema = z.object({
  q: text.optional(),
  status: list.optional(),
  // Columns to show ON TOP OF the ones visible by default — an additive union,
  // never an override list. A column the definitions mark hidden shows only
  // when this names it.
  column: list.optional(),
  label: list.optional(),
});

export type BoardSearch = z.infer<typeof boardSearchSchema>;

const FIELDS = { q: text, status: list, column: list, label: list } as const;

export function parseBoardSearch(input: Record<string, unknown>): BoardSearch {
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(FIELDS)) {
    if (!(key in input)) continue;
    const r = schema.safeParse(input[key]);
    if (r.success) out[key] = r.data;
  }
  return out as BoardSearch;
}

export function effectiveBoardSearch(s: BoardSearch, layerFilter?: LayerFilter): BoardSearch {
  const { label, ...rest } = s;
  const allowed = label?.filter((value) => layerFilter?.values.includes(value));
  return allowed?.length ? { ...rest, label: allowed } : rest;
}

export function hasFilters(s: BoardSearch, layerFilter?: LayerFilter): boolean {
  const effective = effectiveBoardSearch(s, layerFilter);
  return Boolean(effective.q || effective.status?.length || effective.column?.length || effective.label?.length);
}
