import { useMemo, useState } from 'react';
import { Outlet, useSearch } from '@tanstack/react-router';
import type { BoardData, Ticket } from '@/api/types';
import { AppShell } from '@/components/app-shell';
import { FilterBar } from '@/components/filter-bar';
import { EmptyBoard, ErrorPanel, HealthBanner, NoMatches } from '@/components/states';
import { TicketCard } from '@/components/ticket-card';
import { useBoard } from '@/hooks/use-board';
import { hasFilters } from '@/lib/search';
import { facets, filterTickets, groupByStatus, rankOf, type StatusGroup } from '@/lib/tickets';
import { cn } from '@/lib/utils';

const QUIET = new Set(['done', 'dropped']);

export function BoardView() {
  const board = useBoard();

  if (board.kind === 'error') {
    return <AppShell view="board"><ErrorPanel error={board.error} /></AppShell>;
  }
  return <Board data={board.data} />;
}

function Board({ data }: { data: BoardData }) {
  const search = useSearch({ from: '/board' });
  const { themes, labels } = useMemo(() => facets(data.tickets), [data.tickets]);
  const ranks = useMemo(() => rankOf(data.tickets), [data.tickets]);
  const visible = filterTickets(data.tickets, search);
  const groups = groupByStatus(visible, data.statuses).filter(
    (g) => !search.status?.length || search.status.includes(g.status.name),
  );

  const toolbar = data.present ? (
    <FilterBar to="/board" search={search} themes={themes} labels={labels} statuses={data.statuses} />
  ) : undefined;

  return (
    <AppShell view="board" data={data} toolbar={toolbar}>
      <HealthBanner data={data} />
      {!data.present ? (
        <EmptyBoard />
      ) : visible.length === 0 && hasFilters(search) ? (
        <NoMatches to="/board" />
      ) : (
        <Columns groups={groups} ranks={ranks} total={data.tickets.length} />
      )}
      <Outlet />
    </AppShell>
  );
}

function Columns({ groups, ranks, total }: { groups: StatusGroup[]; ranks: Map<string, number>; total: number }) {
  // On a phone one column shows at a time, picked by a status switcher. The
  // choice is this screen's own and not view state worth a URL: it does not
  // survive a rotation to a wider screen, where every column shows.
  const firstFull = groups.find((g) => g.tickets.length)?.status.name ?? groups[0]?.status.name ?? '';
  const [picked, setPicked] = useState<string | null>(null);
  const current = groups.some((g) => g.status.name === picked) ? picked! : firstFull;

  return (
    <>
      <div
        role="tablist"
        aria-label="Status"
        className="scrollbar-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:hidden"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const i = groups.findIndex((g) => g.status.name === current);
          const next = groups[(i + (e.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length];
          if (!next) return;
          e.preventDefault();
          setPicked(next.status.name);
          document.getElementById(`tab-${next.status.name}`)?.focus();
        }}
      >
        {groups.map((g) => {
          const on = g.status.name === current;
          return (
            <button
              key={g.status.name}
              id={`tab-${g.status.name}`}
              role="tab"
              type="button"
              tabIndex={on ? 0 : -1}
              aria-selected={on}
              aria-controls={`col-${g.status.name}`}
              data-status={g.status.name}
              onClick={() => setPicked(g.status.name)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium',
                'transition-[background-color,color,box-shadow] duration-200 ease-spring',
                on ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted',
              )}
            >
              <span aria-hidden className="size-2 rounded-full bg-[var(--st)]" />
              {g.status.name}
              <span className="tabular text-xs text-faint">{g.tickets.length}</span>
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          'scrollbar-thin -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6',
          'lg:mx-0 lg:grid lg:snap-none lg:overflow-visible lg:px-0',
        )}
        style={{ gridTemplateColumns: `repeat(${Math.max(groups.length, 1)}, minmax(0, 1fr))` }}
      >
        {groups.map((g) => (
          <Column key={g.status.name} group={g} ranks={ranks} total={total} hiddenOnPhone={g.status.name !== current} />
        ))}
      </div>
    </>
  );
}

function Column({ group, ranks, total, hiddenOnPhone }: {
  group: StatusGroup; ranks: Map<string, number>; total: number; hiddenOnPhone: boolean;
}) {
  const quiet = QUIET.has(group.status.name) || group.undefined;
  return (
    <section
      id={`col-${group.status.name}`}
      aria-label={group.status.name}
      className={cn(
        'w-full shrink-0 snap-start sm:w-[300px] lg:w-auto lg:min-w-0',
        hiddenOnPhone && 'hidden sm:block',
      )}
    >
      <header className="mb-3 hidden items-center gap-2 px-0.5 sm:flex" data-status={group.status.name} title={group.status.means || undefined}>
        <span aria-hidden className="size-2 rounded-full bg-[var(--st)]" />
        <h2 className="text-sm font-semibold">{group.status.name}</h2>
        <span className="tabular text-xs text-faint">{group.tickets.length}</span>
        {group.undefined && <span className="text-xs text-warn">not defined</span>}
      </header>
      <ol className="flex flex-col gap-2.5">
        {group.tickets.map((t: Ticket) => (
          <li key={t.id}>
            <TicketCard ticket={t} rank={ranks.get(t.id) ?? 0} total={total} from="/board" quiet={quiet} />
          </li>
        ))}
        {group.tickets.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[13px] text-faint">
            Nothing {group.status.name}
          </li>
        )}
      </ol>
    </section>
  );
}
