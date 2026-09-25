import { useMemo } from 'react';
import { Link, Outlet, useSearch } from '@tanstack/react-router';
import type { BoardData, LayerFilter, Ticket } from '@/api/types';
import { AppShell } from '@/components/app-shell';
import { FilterBar, useLayerSearch } from '@/components/filter-bar';
import { EmptyBoard, ErrorPanel, HealthBanner, NoMatches } from '@/components/states';
import { TicketMeta } from '@/components/ticket-card';
import { StatusPill } from '@/components/ui';
import { useBoard } from '@/hooks/use-board';
import { absoluteTime, relativeTime } from '@/lib/format';
import { hasFilters } from '@/lib/search';
import { filterTickets, rankOf } from '@/lib/tickets';
import { cn } from '@/lib/utils';

export function ListView() {
  const board = useBoard();
  if (board.kind === 'error') {
    return <AppShell view="list"><ErrorPanel error={board.error} /></AppShell>;
  }
  return <List data={board.data} />;
}

function List({ data }: { data: BoardData }) {
  const search = useLayerSearch(useSearch({ from: '/list' }), data.layerFilter);
  const ranks = useMemo(() => rankOf(data.tickets), [data.tickets]);
  const visible = filterTickets(data.tickets, search, data.layerFilter);

  const toolbar = data.present ? (
    <FilterBar to="/list" search={search} statuses={data.statuses} layerFilter={data.layerFilter} showStatus />
  ) : undefined;

  return (
    <AppShell view="list" data={data} toolbar={toolbar}>
      <HealthBanner data={data} />
      {!data.present ? (
        <EmptyBoard />
      ) : visible.length === 0 && hasFilters(search, data.layerFilter) ? (
        <NoMatches to="/list" />
      ) : (
        <section aria-label="Tickets by priority" className="overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line">
          <div
            aria-hidden
            className="hidden grid-cols-[3.5rem_minmax(0,1fr)_7rem_6.5rem] gap-4 border-b border-line px-4 py-2.5 text-xs font-medium text-faint md:grid lg:grid-cols-[3.5rem_minmax(0,1fr)_7rem_14rem_6.5rem]"
          >
            <span>Priority</span>
            <span>Ticket</span>
            <span>Status</span>
            <span className="hidden lg:block">Theme</span>
            <span className="text-right">Updated</span>
          </div>
          <ol>
            {visible.map((t) => <Row key={t.id} ticket={t} rank={ranks.get(t.id) ?? 0} layerFilter={data.layerFilter} />)}
          </ol>
        </section>
      )}
      <Outlet />
    </AppShell>
  );
}

function Row({ ticket, rank, layerFilter }: { ticket: Ticket; rank: number; layerFilter?: LayerFilter }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        to="/list/$ticketId"
        params={{ ticketId: ticket.id }}
        search={(prev) => prev}
        className={cn(
          'group grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 gap-y-2 px-4 py-3.5',
          'md:grid-cols-[3.5rem_minmax(0,1fr)_7rem_6.5rem] md:items-center md:gap-4 lg:grid-cols-[3.5rem_minmax(0,1fr)_7rem_14rem_6.5rem]',
          'transition-colors duration-200 ease-spring hover:bg-surface-hover focus-visible:bg-surface-hover',
        )}
      >
        <span
          aria-label={`Priority ${rank}`}
          className="tabular row-span-2 text-section leading-none font-semibold tracking-tight text-ink md:row-span-1"
        >
          #{rank}
        </span>
        <div className="min-w-0">
          {/* Hover lands on the title here too, matching the board card. */}
          <p className="line-clamp-2 text-body font-medium text-ink transition-colors duration-200 group-hover:text-accent [overflow-wrap:anywhere] md:line-clamp-1">{ticket.title}</p>
          {ticket.tldr && <p className="mt-0.5 line-clamp-1 text-meta text-faint">{ticket.tldr}</p>}
          <TicketMeta ticket={ticket} layerFilter={layerFilter} showTheme={false} showId={false} className="mt-2 md:hidden" />
        </div>
        <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
          <StatusPill status={ticket.status} />
          <span translate="no" className="tabular text-micro tracking-[0.04em] text-muted md:hidden">{ticket.id}</span>
        </div>
        <span className="hidden min-w-0 truncate text-meta text-muted lg:block">{ticket.theme || "—"}</span>
        <span className="hidden text-right text-xs text-faint md:block" title={absoluteTime(ticket.updated_at)}>
          {relativeTime(ticket.updated_at)}
        </span>
      </Link>
    </li>
  );
}
