import { useMemo, useState } from 'react';
import { Outlet, useSearch } from '@tanstack/react-router';
import type { BoardData, Ticket } from '@/api/types';
import { AppShell } from '@/components/app-shell';
import { FilterBar } from '@/components/filter-bar';
import { EmptyBoard, ErrorPanel, HealthBanner, NoMatches } from '@/components/states';
import { TicketCard } from '@/components/ticket-card';
import { useBoard } from '@/hooks/use-board';
import { hasFilters } from '@/lib/search';
import { columnVisible, facets, filterTickets, groupByColumn, rankOf, type ColumnGroup } from '@/lib/tickets';
import { cn } from '@/lib/utils';

// Dimmed per card, not per column: a column can hold a running status and a
// finished one, and only the finished card steps back.
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
  const groups = groupByColumn(visible, data.statuses, data.columns).filter(
    (g) => columnVisible(g.column, search.column)
      && (!search.status?.length || g.statuses.some((sg) => search.status!.includes(sg.status.name))),
  );

  const toolbar = data.present ? (
    <FilterBar
      to="/board"
      search={search}
      themes={themes}
      labels={labels}
      statuses={data.statuses}
      hiddenColumns={data.columns.filter((c) => c.hidden)}
    />
  ) : undefined;

  return (
    <AppShell view="board" data={data} toolbar={toolbar}>
      <HealthBanner data={data} />
      {!data.present ? (
        <EmptyBoard />
      ) : visible.length === 0 && hasFilters(search) ? (
        <NoMatches to="/board" />
      ) : (
        <Columns groups={groups} ranks={ranks} />
      )}
      <Outlet />
    </AppShell>
  );
}

function Columns({ groups, ranks }: { groups: ColumnGroup[]; ranks: Map<string, number> }) {
  // On a phone one column shows at a time, picked by a column switcher. The
  // choice is this screen's own and not view state worth a URL: it does not
  // survive a rotation to a wider screen, where every column shows.
  const firstFull = groups.find((g) => g.tickets.length)?.column.name ?? groups[0]?.column.name ?? '';
  const [picked, setPicked] = useState<string | null>(null);
  const current = groups.some((g) => g.column.name === picked) ? picked! : firstFull;

  return (
    <>
      <div
        role="tablist"
        aria-label="Column"
        className="scrollbar-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:hidden"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const i = groups.findIndex((g) => g.column.name === current);
          const next = groups[(i + (e.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length];
          if (!next) return;
          e.preventDefault();
          setPicked(next.column.name);
          document.getElementById(`tab-${next.column.name}`)?.focus();
        }}
      >
        {groups.map((g) => {
          const on = g.column.name === current;
          return (
            <button
              key={g.column.name}
              id={`tab-${g.column.name}`}
              role="tab"
              type="button"
              tabIndex={on ? 0 : -1}
              aria-selected={on}
              aria-controls={`col-${g.column.name}`}
              onClick={() => setPicked(g.column.name)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium',
                'transition-[background-color,color,box-shadow] duration-200 ease-spring',
                on ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-muted',
              )}
            >
              {columnLabel(g)}
              <span className="tabular text-xs text-faint">{g.tickets.length}</span>
            </button>
          );
        })}
      </div>

      {/*
        A scrolling row of lanes at every size. A lane holding cards is 20rem;
        an empty one is 11rem and shows its header and zero. Equal shares gave
        the six columns 245px each at 1080-1536px, so the one column with cards
        was the narrowest thing on the board while four empty ones took the
        same room. The lane's tint is what keeps an empty column reading as a
        column rather than a gap.

        The overflow stays on this row, never the page: the e2e suite measures
        document.scrollingElement.
      */}
      <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-10 lg:scroll-px-10 lg:px-10">
        {groups.map((g) => (
          <Column key={g.column.name} group={g} ranks={ranks} hiddenOnPhone={g.column.name !== current} />
        ))}
      </div>
    </>
  );
}

/** A column reads by its label; a column the definitions never named reads by its name. */
function columnLabel(g: ColumnGroup): string {
  return g.column.label ?? g.column.name;
}

function Column({ group, ranks, hiddenOnPhone }: {
  group: ColumnGroup; ranks: Map<string, number>; hiddenOnPhone: boolean;
}) {
  // The status each card carries, and whether the vocabulary defines it.
  const undefinedStatus = new Set(group.statuses.filter((sg) => sg.undefined).map((sg) => sg.status.name));
  const means = group.statuses.map((sg) => sg.status.means && `${sg.status.label ?? sg.status.name}: ${sg.status.means}`).filter(Boolean).join('\n');
  return (
    <section
      id={`col-${group.column.name}`}
      aria-label={columnLabel(group)}
      className={cn(
        'w-full shrink-0 snap-start sm:rounded-2xl sm:bg-lane sm:p-2',
        group.tickets.length ? 'sm:w-80' : 'sm:w-44',
        hiddenOnPhone && 'hidden sm:block',
      )}
    >
      <header className="hidden items-center gap-2 px-2 pt-1.5 pb-2.5 sm:flex" title={means || undefined}>
        <h2 className="truncate text-sm font-semibold">{columnLabel(group)}</h2>
        <span className="tabular text-xs text-faint">{group.tickets.length}</span>
        {(group.undefined || undefinedStatus.size > 0) && <span className="text-xs text-warn">not defined</span>}
      </header>
      {/* An empty column renders its header and stops. The count in that header
          already says nothing is here, and three dashed boxes saying it again
          were the largest objects on the board. */}
      <ol className="flex flex-col gap-2">
        {group.tickets.map((t: Ticket) => (
          <li key={t.id}>
            <TicketCard
              ticket={t}
              rank={ranks.get(t.id) ?? 0}
              from="/board"
              quiet={QUIET.has(t.status) || undefinedStatus.has(t.status)}
              showStatus
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
