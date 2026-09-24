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
        <Columns groups={groups} ranks={ranks} total={data.tickets.length} />
      )}
      <Outlet />
    </AppShell>
  );
}

function Columns({ groups, ranks, total }: { groups: ColumnGroup[]; ranks: Map<string, number>; total: number }) {
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
        A scrolling row of fixed-width columns at EVERY size. It used to become a
        grid of equal 1fr shares at lg, which spread four columns across the
        viewport however little they held — so a board whose tickets were all in
        one status rendered one column of content and three of empty space.

        lg:overflow-visible went with it. Fixed widths can exceed the viewport,
        and that overflow has to stay on this row: the e2e suite measures
        document.scrollingElement, and the 1080 project sits inside lg.
      */}
      <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {groups.map((g) => (
          <Column key={g.column.name} group={g} ranks={ranks} total={total} hiddenOnPhone={g.column.name !== current} />
        ))}
      </div>
    </>
  );
}

/** A column reads by its label; a column the definitions never named reads by its name. */
function columnLabel(g: ColumnGroup): string {
  return g.column.label ?? g.column.name;
}

function Column({ group, ranks, total, hiddenOnPhone }: {
  group: ColumnGroup; ranks: Map<string, number>; total: number; hiddenOnPhone: boolean;
}) {
  // The status each card carries, and whether the vocabulary defines it.
  const undefinedStatus = new Set(group.statuses.filter((sg) => sg.undefined).map((sg) => sg.status.name));
  const means = group.statuses.map((sg) => sg.status.means && `${sg.status.label ?? sg.status.name}: ${sg.status.means}`).filter(Boolean).join('\n');
  return (
    <section
      id={`col-${group.column.name}`}
      aria-label={columnLabel(group)}
      className={cn(
        'w-full shrink-0 snap-start',
        // Every column keeps its own territory, empty or not, at one width for
        // all of them. Collapsing the empty ones crowded the populated column
        // to one side and left the rest of the board a void — and no kanban
        // worth copying does it: an empty column shows its header and its zero.
        // The floor keeps a card legible; below it the row scrolls.
        'sm:w-auto sm:min-w-[15rem] sm:max-w-[26rem] sm:flex-1 sm:basis-0',
        hiddenOnPhone && 'hidden sm:block',
      )}
    >
      <header className="mb-3 hidden items-center gap-2 px-0.5 sm:flex" title={means || undefined}>
        <h2 className="text-sm font-semibold">{columnLabel(group)}</h2>
        <span className="tabular text-xs text-faint">{group.tickets.length}</span>
        {(group.undefined || undefinedStatus.size > 0) && <span className="text-xs text-warn">not defined</span>}
      </header>
      {/* An empty column renders its header and stops. The count in that header
          already says nothing is here, and three dashed boxes saying it again
          were the largest objects on the board. */}
      <ol className="flex flex-col gap-2.5">
        {group.tickets.map((t: Ticket) => (
          <li key={t.id}>
            <TicketCard
              ticket={t}
              rank={ranks.get(t.id) ?? 0}
              total={total}
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
