import type { Status, Ticket } from '@/api/types';
import type { BoardSearch } from './search';

/** Filters in board order. Fields combine with AND; the values inside one field with OR. */
export function filterTickets(tickets: Ticket[], s: BoardSearch): Ticket[] {
  const q = s.q?.toLowerCase();
  return tickets.filter((t) => {
    if (q) {
      const hay = [t.id, t.title, t.tldr, ...t.notes].join('\n').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (s.theme && t.theme !== s.theme) return false;
    if (s.label?.length && !t.labels.some((l) => s.label!.includes(l))) return false;
    if (s.status?.length && !s.status.includes(t.status)) return false;
    return true;
  });
}

export type StatusGroup = { status: Status; tickets: Ticket[]; undefined: boolean };

/**
 * One group per status, in vocabulary order, each keeping board line order —
 * the priority. A status in use that the vocabulary does not define gets its
 * own trailing group rather than vanishing from the board.
 */
export function groupByStatus(tickets: Ticket[], statuses: Status[]): StatusGroup[] {
  const groups: StatusGroup[] = statuses.map((status) => ({ status, tickets: [], undefined: false }));
  const byName = new Map(groups.map((g) => [g.status.name, g]));
  for (const t of tickets) {
    let g = byName.get(t.status);
    if (!g) {
      g = { status: { name: t.status, order: Number.MAX_SAFE_INTEGER, means: '' }, tickets: [], undefined: true };
      byName.set(t.status, g);
      groups.push(g);
    }
    g.tickets.push(t);
  }
  return groups;
}

export function facets(tickets: Ticket[]): { themes: string[]; labels: string[] } {
  const themes = new Set<string>();
  const labels = new Set<string>();
  for (const t of tickets) {
    if (t.theme) themes.add(t.theme);
    for (const l of t.labels) if (l) labels.add(l);
  }
  return { themes: [...themes].sort(), labels: [...labels].sort() };
}

/** The 1-based priority of a ticket: its position on the board, unfiltered. */
export function rankOf(tickets: Ticket[]): Map<string, number> {
  return new Map(tickets.map((t, i) => [t.id, i + 1]));
}
