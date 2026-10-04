import { queryOptions } from '@tanstack/react-query';
import type { BoardResponse, Ticket } from './types';

async function fetchBoard(): Promise<BoardResponse> {
  const res = await fetch('/api/board', { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET /api/board answered ${res.status}`);
  return (await res.json()) as BoardResponse;
}

/**
 * The one query every screen reads. Loaders call ensureQueryData with it, so a
 * navigation never renders empty; the live-update hook invalidates it.
 */
export const boardQueryOptions = queryOptions({
  queryKey: ['board'],
  queryFn: fetchBoard,
  staleTime: 5_000,
  refetchOnWindowFocus: true,
});

// Tickets come back with any optional field possibly absent on a hand-edited
// board; the screens rely on arrays being arrays.
export function normaliseTicket(t: Partial<Ticket> & { id: string }): Ticket {
  return {
    title: '', theme: '', tldr: '', done_when: '', status: '', created_at: '', updated_at: '', grounded: false, work_id: null, feature: null,
    ...t,
    labels: Array.isArray(t.labels) ? t.labels : [],
    notes: Array.isArray(t.notes) ? t.notes : [],
    paths: Array.isArray(t.paths) ? t.paths : [],
    comments: Array.isArray(t.comments) ? t.comments : [],
  };
}
