import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Columns3, Monitor, Moon, Rows3, Sun } from 'lucide-react';
import type { BoardData } from '@/api/types';
import { absoluteTime, relativeTime } from '@/lib/format';
import { followSystem, readChoice, saveChoice, type ThemeChoice } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Shortcuts } from './shortcuts';

const ICON = { strokeWidth: 1.5 } as const;

/**
 * The frame every view sits in. It is shaped for an activity-management app:
 * the view switch is the navigation, and a later "Runs" section joins it there;
 * the grid leaves room for a right-hand activity panel. Neither exists yet, and
 * neither renders — not as a placeholder, not disabled.
 */
export function AppShell({ view, data, toolbar, children }: {
  view: 'board' | 'list';
  data?: BoardData;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    // The gutter widens with the screen: 16px on a phone, 40px on a desktop,
    // where 24px left the filters and the first column against the edge.
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1680px] flex-col px-4 pb-10 sm:px-6 lg:px-10">
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to tickets
      </a>
      <h1 className="sr-only">{view === 'board' ? 'Board' : 'Tickets by priority'}</h1>
      <header className="flex h-16 items-center gap-3 lg:h-[4.5rem]">
        <Link to="/board" search={{}} className="flex items-center gap-2.5 rounded-lg pr-1 text-ink" aria-label="Board — home">
          <Mark />
          {/* Hidden on a phone: the view switch beside it already says Board,
              and the row needs the room for the theme switch. */}
          <span className="hidden text-section font-semibold tracking-tight sm:inline">Board</span>
        </Link>

        <nav aria-label="Views" className="ml-auto sm:ml-4">
          <div className="flex items-center rounded-full bg-surface-sunken p-1">
            <ViewLink to="/board" active={view === 'board'} icon={<Columns3 {...ICON} />} label="Board" />
            <ViewLink to="/list" active={view === 'list'} icon={<Rows3 {...ICON} />} label="List" />
          </div>
        </nav>

        <div className="flex items-center gap-4 sm:ml-auto">
          {data && <LiveStamp readAt={data.readAt} />}
          <ThemeSwitch />
        </div>
      </header>

      {toolbar && <div className="pb-6">{toolbar}</div>}
      <main id="content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-4 outline-none">{children}</main>
      <Shortcuts />
    </div>
  );
}

function ViewLink({ to, active, icon, label }: { to: '/board' | '/list'; active: boolean; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      search={(prev) => prev}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-meta font-medium',
        'transition-[background-color,color,box-shadow] duration-200 ease-spring [&_svg]:size-4',
        // The accent's standing job: say which view you are on. Navigational,
        // never a status — the palette reserves status hues for named statuses.
        active ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-ink',
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

const THEMES: { value: ThemeChoice; label: string; icon: ReactNode }[] = [
  { value: 'system', label: 'System theme', icon: <Monitor {...ICON} /> },
  { value: 'light', label: 'Light theme', icon: <Sun {...ICON} /> },
  { value: 'dark', label: 'Dark theme', icon: <Moon {...ICON} /> },
];

/**
 * System, light or dark. The scheme followed the OS and nothing else, so a
 * reader on a dark desktop had no way to see the board light.
 */
function ThemeSwitch() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice);
  useEffect(() => followSystem(choice), [choice]);
  return (
    <div role="radiogroup" aria-label="Theme" className="flex shrink-0 items-center rounded-full bg-surface-sunken p-1">
      {THEMES.map((t) => {
        const on = t.value === choice;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={t.label}
            title={t.label}
            onClick={() => { saveChoice(t.value); setChoice(t.value); }}
            className={cn(
              'grid size-7 place-items-center rounded-full [&_svg]:size-3.5',
              'transition-[background-color,color,box-shadow] duration-200 ease-spring',
              on ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
            )}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
}

/** "Live": the server pushes changes to docs/backlog.jsonl, so this is never stale for long. */
function LiveStamp({ readAt }: { readAt: string }) {
  return (
    <p aria-live="polite" className="hidden items-center gap-2 text-xs text-faint sm:flex" title={`Read ${absoluteTime(readAt)}`}>
      {/* Neutral, not --s-done. Green is the done status; a heartbeat borrowing
          it made one colour mean "this ticket is finished" and "the server is
          connected" in the same viewport. The pulse carries the liveness. */}
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-[pulse-soft_2.4s_ease-in-out_infinite] rounded-full bg-muted opacity-60" />
        <span className="relative size-2 rounded-full bg-muted" />
      </span>
      Live, read {relativeTime(readAt)}
    </p>
  );
}

/** Three bars of falling length: a queue, in order. */
function Mark() {
  return (
    <span aria-hidden className="grid size-8 place-items-center rounded-[10px] bg-ink text-bg">
      <svg viewBox="0 0 16 16" className="size-4">
        <rect x="3" y="3" width="10" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="7" width="7" height="2" rx="1" fill="currentColor" opacity=".75" />
        <rect x="3" y="11" width="4" height="2" rx="1" fill="currentColor" opacity=".5" />
      </svg>
    </span>
  );
}
