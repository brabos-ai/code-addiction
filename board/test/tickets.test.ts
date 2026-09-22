// Pure data functions and the shared search schema (plan F3, L2.1–L2.2). RED-FIRST.
import { describe, expect, it } from 'vitest';
import type { Status, Ticket } from '@/api/types';
import { filterTickets, groupByStatus, facets } from '@/lib/tickets';
import { parseBoardSearch } from '@/lib/search';

function t(id: string, over: Partial<Ticket> = {}): Ticket {
  return {
    id, title: `title ${id}`, theme: '', labels: [], tldr: `tldr ${id}`, notes: [], done_when: 'x', paths: [],
    grounded: false, status: 'open', created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
    comments: [], work_id: null, ...over,
  };
}

const statuses: Status[] = [
  { name: 'open', order: 1, means: '' },
  { name: 'doing', order: 2, means: '' },
  { name: 'done', order: 3, means: '' },
];

describe('L2.1 filterTickets', () => {
  const all = [
    t('0001B', { theme: 'graph', labels: ['product'], status: 'open' }),
    t('0002B', { theme: 'prompts', labels: ['both'], status: 'doing', notes: ['sweep the artefacts'] }),
    t('0003B', { theme: 'graph', labels: ['internal'], status: 'done', title: 'Doctor for schemas' }),
  ];

  it('returns every ticket, in line order, with no filter', () => {
    expect(filterTickets(all, {}).map((x) => x.id)).toEqual(['0001B', '0002B', '0003B']);
  });
  it('matches q against title, tldr and notes, case-insensitively', () => {
    expect(filterTickets(all, { q: 'SWEEP' }).map((x) => x.id)).toEqual(['0002B']);
    expect(filterTickets(all, { q: 'doctor' }).map((x) => x.id)).toEqual(['0003B']);
  });
  it('matches q against the id', () => {
    expect(filterTickets(all, { q: '0003b' }).map((x) => x.id)).toEqual(['0003B']);
  });
  it('filters by theme, by any of several labels, and by any of several statuses', () => {
    expect(filterTickets(all, { theme: 'graph' }).map((x) => x.id)).toEqual(['0001B', '0003B']);
    expect(filterTickets(all, { label: ['both', 'internal'] }).map((x) => x.id)).toEqual(['0002B', '0003B']);
    expect(filterTickets(all, { status: ['open', 'done'] }).map((x) => x.id)).toEqual(['0001B', '0003B']);
  });
  it('combines filters with AND', () => {
    expect(filterTickets(all, { theme: 'graph', status: ['done'] }).map((x) => x.id)).toEqual(['0003B']);
  });
});

describe('L2.1 groupByStatus', () => {
  it('keeps one group per status in order, and line order inside a group', () => {
    const groups = groupByStatus(
      [t('0004B', { status: 'doing' }), t('0001B'), t('0002B', { status: 'doing' }), t('0003B')],
      statuses,
    );
    expect(groups.map((g) => g.status.name)).toEqual(['open', 'doing', 'done']);
    expect(groups[0]!.tickets.map((x) => x.id)).toEqual(['0001B', '0003B']);
    expect(groups[1]!.tickets.map((x) => x.id)).toEqual(['0004B', '0002B']);
    expect(groups[2]!.tickets).toEqual([]);
  });
  it('adds a trailing group for a status the vocabulary does not define', () => {
    const groups = groupByStatus([t('0001B', { status: 'ghost' })], statuses);
    expect(groups.map((g) => g.status.name)).toEqual(['open', 'doing', 'done', 'ghost']);
    expect(groups[3]!.undefined).toBe(true);
  });
});

describe('facets', () => {
  it('lists the themes and labels in use, sorted, without blanks', () => {
    const f = facets([t('1', { theme: 'b', labels: ['y'] }), t('2', { theme: '', labels: ['x', 'y'] }), t('3', { theme: 'a' })]);
    expect(f.themes).toEqual(['a', 'b']);
    expect(f.labels).toEqual(['x', 'y']);
  });
});

describe('L2.2 parseBoardSearch', () => {
  it('keeps valid params', () => {
    expect(parseBoardSearch({ q: 'abc', theme: 'graph', label: ['a'], status: ['open'] })).toEqual({
      q: 'abc', theme: 'graph', label: ['a'], status: ['open'],
    });
  });
  it('accepts a single string where an array is expected', () => {
    expect(parseBoardSearch({ label: 'a', status: 'open' })).toEqual({ label: ['a'], status: ['open'] });
  });
  it('drops an invalid param and keeps the valid ones', () => {
    expect(parseBoardSearch({ q: 42, theme: 'graph', label: [1, 2], extra: 'x' })).toEqual({ theme: 'graph' });
  });
  it('drops empty strings and empty arrays', () => {
    expect(parseBoardSearch({ q: '', label: [] })).toEqual({});
  });
});
