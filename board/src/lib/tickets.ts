import type { Column, Status, Ticket } from '@/api/types';
import type { BoardSearch } from './search';

/** Filters in board order. Fields combine with AND; the values inside one field with OR. */
export function filterTickets(tickets: Ticket[], s: BoardSearch): Ticket[] {
  const q = s.q?.toLowerCase();
  return tickets.filter((t) => {
    if (q) {
      const hay = [t.id, t.title, t.tldr, ...t.notes].join('\n').toLowerCase();
      if (!hay.includes(q)) return false;
    }
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

export type ColumnGroup = {
  column: Column;
  /** The per-status groups this column holds, in vocabulary order — what each card's badge reads. */
  statuses: StatusGroup[];
  /** Every ticket in the column, in board line order: the priority, across its statuses. */
  tickets: Ticket[];
  /** A status names this column and the columns list does not define it. */
  undefined: boolean;
  /** No status declared this column: a status with no column, shown under its own name. */
  implicit: boolean;
};

/**
 * One group per column, in column order, wrapping groupByStatus. Three ways a
 * status can fail to land stay apart: a status the vocabulary does not define
 * (its StatusGroup is undefined), a column the columns list does not define
 * (the ColumnGroup is undefined), and a status that names no column (the
 * ColumnGroup is implicit, named after the status). Each gets a trailing
 * column rather than vanishing from the board.
 */
export function groupByColumn(tickets: Ticket[], statuses: Status[], columns: Column[]): ColumnGroup[] {
  const groups: ColumnGroup[] = columns.map((column) => ({ column, statuses: [], tickets: [], undefined: false, implicit: false }));
  const byName = new Map(groups.map((g) => [g.column.name, g]));
  const home = new Map<string, ColumnGroup>();
  for (const sg of groupByStatus(tickets, statuses)) {
    const name = sg.status.column ?? sg.status.name;
    let g = byName.get(name);
    if (!g) {
      const named = sg.status.column !== undefined;
      g = { column: { name, order: Number.MAX_SAFE_INTEGER }, statuses: [], tickets: [], undefined: named, implicit: !named };
      byName.set(name, g);
      groups.push(g);
    }
    g.statuses.push(sg);
    home.set(sg.status.name, g);
  }
  for (const t of tickets) home.get(t.status)?.tickets.push(t);
  return groups;
}

/** A column shows unless it is hidden by default and the `column` param does not name it. */
export function columnVisible(column: Column, param: string[] | undefined): boolean {
  return !column.hidden || Boolean(param?.includes(column.name));
}

/** The 1-based priority of a ticket: its position on the board, unfiltered. */
export function rankOf(tickets: Ticket[]): Map<string, number> {
  return new Map(tickets.map((t, i) => [t.id, i + 1]));
}
