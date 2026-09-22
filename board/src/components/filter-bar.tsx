import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Status } from '@/api/types';
import { hasFilters, parseBoardSearch, type BoardSearch } from '@/lib/search';
import { cn } from '@/lib/utils';
import { Button } from './ui';

const ICON = { strokeWidth: 1.5 } as const;

type FormValues = { q: string; theme: string; label: string[]; status: string[] };

function toForm(s: BoardSearch): FormValues {
  return { q: s.q ?? '', theme: s.theme ?? '', label: s.label ?? [], status: s.status ?? [] };
}

type Props = {
  to: '/board' | '/list';
  search: BoardSearch;
  themes: string[];
  labels: string[];
  statuses: Status[];
  /** The board shows statuses as its columns; only the list filters by them. */
  showStatus?: boolean;
};

/**
 * The filter form. Its defaults come from the route's validated search and every
 * change navigates, so the URL stays the one source of view state: a filtered
 * board can be reloaded, shared and stepped back through. The same schema that
 * validates the route parses what this form sends.
 */
export function FilterBar({ to, search, themes, labels, statuses, showStatus = false }: Props) {
  const navigate = useNavigate();
  const form = useForm<FormValues>({ values: toForm(search) });
  const values = useWatch({ control: form.control }) as FormValues;
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);

  // Text waits for a pause; toggles apply at once.
  useEffect(() => {
    const next = parseBoardSearch({ ...values });
    const same = JSON.stringify(next) === JSON.stringify(parseBoardSearch({ ...search }));
    if (same) return;
    const t = setTimeout(() => void navigate({ to, search: next, replace: true }), values.q !== (search.q ?? '') ? 250 : 0);
    return () => clearTimeout(t);
  }, [values, search, navigate, to]);

  // "/" focuses the search, as in most tools people already use.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = (field: 'label' | 'status', value: string) => {
    const cur = form.getValues(field);
    form.setValue(field, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
  };

  const refinements = (values.theme ? 1 : 0) + values.label.length + values.status.length;
  const { ref: qRef, ...qField } = form.register('q');

  const refineControls = (
    <>
      {themes.length > 0 && (
        <label className="relative flex min-w-0 items-center">
          <span className="sr-only">Theme</span>
          <select
            {...form.register('theme')}
            className={cn(
              'h-9 w-full min-w-0 appearance-none rounded-full bg-surface pr-8 pl-3 text-base shadow-card ring-1 ring-line md:w-auto md:max-w-56 md:text-[13px]',
              'transition-shadow duration-200 ease-spring hover:ring-line-strong',
              values.theme ? 'text-accent ring-accent/40' : 'text-muted',
            )}
          >
            <option value="">All themes</option>
            {themes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-3 size-3.5 text-faint">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
      )}
      {showStatus && (
        <ToggleGroup label="Status" options={statuses.map((s) => s.name)} selected={values.status} onToggle={(v) => toggle('status', v)} status />
      )}
      {labels.length > 0 && (
        <ToggleGroup label="Labels" options={labels} selected={values.label} onToggle={(v) => toggle('label', v)} />
      )}
    </>
  );

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:items-start">
        <label className="relative flex min-w-0 flex-1 items-center md:basis-full lg:basis-auto lg:max-w-sm">
          <span className="sr-only">Search tickets</span>
          <Search {...ICON} aria-hidden className="pointer-events-none absolute left-3.5 size-4 text-faint" />
          <input
            {...qField}
            ref={(el) => { qRef(el); input.current = el; }}
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search tickets…"
            className={cn(
              'h-10 w-full min-w-0 rounded-full bg-surface pr-9 pl-10 text-base text-ink shadow-card ring-1 ring-line placeholder:text-faint md:text-sm',
              'transition-shadow duration-200 ease-spring hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
              '[&::-webkit-search-cancel-button]:hidden',
            )}
          />
          {values.q ? (
            <button
              type="button"
              onClick={() => form.setValue('q', '')}
              className="absolute right-2 grid size-7 place-items-center rounded-full text-faint hover:bg-ink/[0.06] hover:text-ink"
            >
              <X {...ICON} className="size-3.5" />
              <span className="sr-only">Clear search</span>
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 hidden rounded border border-line px-1.5 text-[11px] leading-4 text-faint md:block">/</kbd>
          )}
        </label>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative md:hidden"
          aria-expanded={open}
          aria-controls="refine"
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal {...ICON} />
          <span className="sr-only">Filters</span>
          {refinements > 0 && (
            <span className="tabular absolute -top-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-ink">
              {refinements}
            </span>
          )}
        </Button>

        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 md:flex md:pt-1 lg:pt-0">{refineControls}</div>

        {hasFilters(search) && (
          <Button type="button" variant="quiet" size="sm" className="hidden md:inline-flex" onClick={() => form.reset(toForm({}))}>
            Clear
          </Button>
        )}
      </div>

      <div
        id="refine"
        className={cn('flex-col gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line md:hidden', open ? 'flex' : 'hidden')}
      >
        {refineControls}
        {hasFilters(search) && (
          <Button type="button" variant="quiet" size="sm" className="self-start" onClick={() => form.reset(toForm({}))}>
            Clear filters
          </Button>
        )}
      </div>
    </form>
  );
}

function ToggleGroup({
  label, options, selected, onToggle, status,
}: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void; status?: boolean }) {
  if (!options.length) return null;
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs text-faint">{label}</span>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            data-status={status ? o : undefined}
            onClick={() => onToggle(o)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium md:h-8',
              'transition-[background-color,color,box-shadow,transform] duration-200 ease-spring active:scale-[0.96]',
              on ? 'bg-accent-soft text-accent ring-1 ring-accent/30' : 'bg-surface text-muted shadow-card ring-1 ring-line hover:text-ink',
            )}
          >
            {status && <span aria-hidden className="size-1.5 rounded-full bg-[var(--st)]" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}
