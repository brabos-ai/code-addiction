import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useSearch } from '@tanstack/react-router';
import type { BoardData, Ticket } from '@/api/types';
import { AppShell } from '@/components/app-shell';
import { FilterBar } from '@/components/filter-bar';
import { EmptyBoard, ErrorPanel, HealthBanner, NoMatches } from '@/components/states';
import { TicketCard } from '@/components/ticket-card';
import { useBoard } from '@/hooks/use-board';
import { hasFilters } from '@/lib/search';
import { columnVisible, filterTickets, groupByColumn, rankOf, type ColumnGroup } from '@/lib/tickets';
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
      statuses={data.statuses}
      hiddenColumns={data.columns.filter((c) => c.hidden)}
    />
  ) : undefined;

  return (
    <AppShell view="board" data={data} toolbar={toolbar} fill>
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

  // Whether lanes lie past the right edge. Drives the fade, nothing else.
  const row = useRef<HTMLDivElement | null>(null);
  const [more, setMore] = useState(false);
  const measure = () => {
    const el = row.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  useEffect(() => {
    const el = row.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [groups.length]);

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
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3.5 text-sm font-medium',
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
        document.scrollingElement. From sm up the row fills the rest of the
        screen, so its scrollbar is always in view, and each lane scrolls its
        own cards. A fade on the right edge says more lanes wait that way.
      */}
      <div className="relative -mx-4 flex flex-col sm:-mx-6 sm:min-h-0 sm:flex-1 lg:-mx-10">
        <div
          ref={row}
          onScroll={measure}
          className="scrollbar-thin flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:min-h-0 sm:flex-1 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10"
        >
          {groups.map((g) => (
            <Column key={g.column.name} group={g} ranks={ranks} hiddenOnPhone={g.column.name !== current} />
          ))}
        </div>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 right-0 bottom-3 hidden w-16 bg-gradient-to-l from-bg to-transparent',
            'transition-opacity duration-200',
            more ? 'sm:block' : 'opacity-0',
          )}
        />
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
  const meanings = group.statuses
    .filter((sg) => sg.status.means)
    .map((sg) => ({ name: sg.status.name, label: sg.status.label ?? sg.status.name, means: sg.status.means }));
  const means = meanings.map((m) => `${m.label}: ${m.means}`).join('\n');
  // A lane with one status says it once, in its header; every card repeating
  // "open" in Backlog was noise. Two or more, and the card names its own.
  const showStatus = group.statuses.length > 1;
  return (
    <section
      id={`col-${group.column.name}`}
      aria-label={columnLabel(group)}
      data-phase={group.column.name}
      className={cn(
        'flex w-full shrink-0 snap-start flex-col sm:min-h-0 sm:rounded-lg sm:bg-lane sm:pt-2',
        // 18.5rem with cards, 10rem empty, 0.75rem apart: six lanes with three
        // populated fit a 1536px screen, which is 1920 at 125% zoom.
        group.tickets.length ? 'sm:w-[18.5rem]' : 'sm:w-40',
        hiddenOnPhone && 'hidden sm:flex',
      )}
    >
      <header className="hidden items-center gap-2 px-4 pt-1.5 pb-2.5 sm:flex" title={means || undefined}>
        {/* The phase's hue. Each card's status carries the same one, so a
            column is told by colour before it is read. */}
        <span aria-hidden className="size-2 shrink-0 rounded-[2px] bg-[var(--ph)]" />
        <h2 className="truncate text-sm font-semibold">{columnLabel(group)}</h2>
        {(group.undefined || undefinedStatus.size > 0) && <span className="text-xs text-warn">not defined</span>}
        <span className="tabular ml-auto rounded-sm bg-surface-sunken px-1.5 text-xs leading-5 font-medium text-muted">{group.tickets.length}</span>
      </header>
      {/* An empty lane says what its statuses mean, in the definitions' own
          words — the one thing a reader new to the pipeline cannot see
          anywhere else on the board. No placeholder card: the count in the
          header already says nothing is here. */}
      {group.tickets.length === 0 && meanings.length > 0 && (
        <dl className="hidden space-y-2 px-4 pb-3 text-xs leading-snug text-faint sm:block">
          {meanings.map((m) => (
            <div key={m.name}>
              {meanings.length > 1 && <dt className="font-medium text-muted">{m.label}</dt>}
              <dd>{m.means}</dd>
            </div>
          ))}
        </dl>
      )}
      <ol className="scrollbar-thin flex flex-col gap-2 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:px-2 sm:pt-0.5 sm:pb-2">
        {group.tickets.map((t: Ticket) => (
          <li key={t.id}>
            <TicketCard
              ticket={t}
              rank={ranks.get(t.id) ?? 0}
              from="/board"
              quiet={QUIET.has(t.status) || undefinedStatus.has(t.status)}
              showStatus={showStatus}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
