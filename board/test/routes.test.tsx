// The route tree over a mocked /api/board (plan F3, L2.3). RED-FIRST.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { makeRouter } from '@/router';
import type { BoardData } from '@/api/types';

const data: BoardData = {
  present: true,
  statuses: [
    { name: 'open', order: 1, means: 'decided, not started' },
    { name: 'doing', order: 2, means: 'in progress' },
    { name: 'done', order: 3, means: 'delivered' },
  ],
  columns: [
    { name: 'open', order: 1 },
    { name: 'doing', order: 2 },
    { name: 'done', order: 3 },
  ],
  tickets: [
    { id: '0001B', title: 'Doctor for schemas', theme: 'graph', labels: ['product'], tldr: 't', notes: [], done_when: 'x', paths: [], grounded: true, status: 'open', created_at: '', updated_at: '', comments: [], work_id: null, feature: null },
    { id: '0002B', title: 'Sweep prompt density', theme: 'prompts', labels: ['both'], tldr: 't', notes: [], done_when: 'x', paths: [], grounded: false, status: 'doing', created_at: '', updated_at: '', comments: [], work_id: null, feature: null },
  ],
  damagedLines: [],
  undefinedStatuses: [],
  readAt: '2026-09-21T00:00:00Z',
};

class NoEventSource { addEventListener() {} removeEventListener() {} close() {} }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })));
  vi.stubGlobal('EventSource', NoEventSource);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function open(url: string) {
  const { router, queryClient } = makeRouter(createMemoryHistory({ initialEntries: [url] }));
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>);
  await router.load();
  return router;
}

describe('L2.3 routes', () => {
  it('/ redirects to /board', async () => {
    const router = await open('/');
    expect(router.state.location.pathname).toBe('/board');
  });

  it('/board renders one column per status, in order', async () => {
    await open('/board');
    const cols = await screen.findAllByRole('region');
    expect(cols.map((c) => c.getAttribute('aria-label'))).toEqual(['open', 'doing', 'done']);
  });

  it('/board?status=doing keeps only the matching tickets', async () => {
    await open('/board?status=doing');
    expect(await screen.findByText('Sweep prompt density')).toBeInTheDocument();
    expect(screen.queryByText('Doctor for schemas')).not.toBeInTheDocument();
  });

  it('/board/0002B opens the ticket as a dialog over the board', async () => {
    await open('/board/0002B');
    expect(await screen.findByRole('dialog')).toHaveTextContent('Sweep prompt density');
  });
});

// Plan 2026-09-23T193550-PLAN--board-pipeline-phase-statuses, F40 / L15.5. RED-FIRST.
describe('L15 the board by column', () => {
  const phased: BoardData = {
    ...data,
    statuses: [
      { name: 'in-review', order: 1, means: 'PR open', column: 'review', label: 'In review' },
      { name: 'done', order: 2, means: 'delivered', column: 'review', label: 'Done' },
    ],
    columns: [{ name: 'review', order: 1, label: 'Review' }],
    tickets: [
      { ...data.tickets[0]!, id: '0010B', title: 'Awaiting review', status: 'in-review' },
      { ...data.tickets[0]!, id: '0011B', title: 'Already merged', status: 'done' },
    ],
  };
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(phased), { headers: { 'content-type': 'application/json' } })));
  });

  it('two statuses sharing a column render as one column, by its label', async () => {
    await open('/board');
    const cols = await screen.findAllByRole('region');
    expect(cols.map((c) => c.getAttribute('aria-label'))).toEqual(['Review']);
  });

  it('each card carries its own status badge', async () => {
    await open('/board');
    const card = (await screen.findByText('Awaiting review')).closest('a')!;
    expect(card.querySelector('[data-status="in-review"]')).not.toBeNull();
  });

  it('L15.5 QUIET dims the done card and not the in-review card beside it', async () => {
    await open('/board');
    const running = (await screen.findByText('Awaiting review')).closest('a')!;
    const finished = screen.getByText('Already merged').closest('a')!;
    expect(finished.getAttribute('data-quiet')).toBe('true');
    expect(running.getAttribute('data-quiet')).toBeNull();
  });
});
