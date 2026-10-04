import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Eye, EyeOff, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Column, LayerFilter, Status } from '@/api/types';
import { effectiveBoardSearch, hasFilters, parseBoardSearch, type BoardSearch } from '@/lib/search';
import { cn } from '@/lib/utils';
import { Button, StatusGlyph } from './ui';

const ICON = { strokeWidth: 1.5 } as const;
export const HEADER_ACTIONS_ID = 'board-header-actions';

const WELL_BTN =
  'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-meta font-medium md:h-8 ' +
  'transition-[background-color,color,box-shadow,transform] duration-200 ease-spring active:scale-[0.96]';

type FormValues = { q: string; status: string[]; column: string[]; label: string[] };

function toForm(s: BoardSearch): FormValues {
  return { q: s.q ?? '', status: s.status ?? [], column: s.column ?? [], label: s.label ?? [] };
}

/** Both loaded views use the effective search immediately, even without a toolbar. */
export function useLayerSearch(search: BoardSearch, layerFilter?: LayerFilter): BoardSearch {
  const navigate = useNavigate();
  const rawLabel = useLocation({ select: (location) => location.search.label });
  const effective = effectiveBoardSearch(search, layerFilter);
  const canonicalLabel = JSON.stringify(effective.label);
  useEffect(() => {
    if (JSON.stringify(rawLabel) === canonicalLabel) return;
    // Stay on the current route: keep an open ticket while replacing only
    // the unsupported label selection. The updater reads the latest search.
    void navigate({ to: '.', search: (prev) => effectiveBoardSearch(prev, layerFilter), replace: true });
  }, [rawLabel, canonicalLabel, layerFilter, navigate]);
  return effective;
}

type Props = {
  to: '/board' | '/list';
  search: BoardSearch;
  statuses: Status[];
  layerFilter?: LayerFilter;
  /** The board shows statuses as its columns; only the list filters by them. */
  showStatus?: boolean;
  /** The board's columns hidden by default. Each gets a "Show" toggle writing its name to `column`. */
  hiddenColumns?: Column[];
};

/**
 * The filter form. Its defaults come from the route's validated search and every
 * change navigates, so the URL stays the one source of view state: a filtered
 * board can be reloaded, shared and stepped back through. The same schema that
 * validates the route parses what this form sends.
 */
export function FilterBar({ to, search, statuses, layerFilter, showStatus = false, hiddenColumns = [] }: Props) {
  const navigate = useNavigate();
  const form = useForm<FormValues>({ values: toForm(search) });
  const values = useWatch({ control: form.control }) as FormValues;
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);

  // Text waits for a pause; toggles apply at once.
  useEffect(() => {
    const next = effectiveBoardSearch(parseBoardSearch({ ...values }), layerFilter);
    const same = JSON.stringify(next) === JSON.stringify(parseBoardSearch({ ...search }));
    if (same) return;
    const t = setTimeout(() => void navigate({ to, search: next, replace: true }), values.q !== (search.q ?? '') ? 250 : 0);
    return () => clearTimeout(t);
  }, [values, search, navigate, to, layerFilter]);

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

  const toggle = (field: 'status' | 'column' | 'label', value: string) => {
    const cur = form.getValues(field);
    form.setValue(field, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
  };

  const refinements = values.status.length + values.column.length + values.label.length;
  const { ref: qRef, ...qField } = form.register('q');
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  useEffect(() => { setHeaderSlot(document.getElementById(HEADER_ACTIONS_ID)); }, []);

  const headerDropped = hiddenColumns.map((c) => {
    const on = values.column.includes(c.name);
    const name = `Show ${(c.label ?? c.name).toLowerCase()}`;
    return (
      <button
        key={c.name}
        type="button"
        aria-pressed={on}
        aria-label={name}
        title={name}
        onClick={() => toggle('column', c.name)}
        className={cn(
          'hidden size-7 shrink-0 place-items-center rounded-md text-meta sm:grid [&_svg]:size-3.5',
          'transition-[background-color,color,box-shadow] duration-200 ease-spring',
          on ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
        )}
      >
        {on ? <Eye {...ICON} /> : <EyeOff {...ICON} />}
      </button>
    );
  });

  const refineControls = (dropped: boolean) => (
    <>
      {showStatus && (
        <StatusToggles statuses={statuses} selected={values.status} onToggle={(v) => toggle('status', v)} />
      )}
      {layerFilter && (
        <ToggleGroup label={layerFilter.name} options={layerFilter.values} selected={values.label} onToggle={(v) => toggle('label', v)} />
      )}
      {dropped && hiddenColumns.map((c) => {
        const on = values.column.includes(c.name);
        return (
          <button
            key={c.name}
            type="button"
            aria-pressed={on}
            onClick={() => toggle('column', c.name)}
            className={cn(
              WELL_BTN,
              on ? 'bg-surface text-accent shadow-card' : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
            )}
          >
            Show {(c.label ?? c.name).toLowerCase()}
          </button>
        );
      })}
    </>
  );

  return (
    <>
    {headerSlot && headerDropped.length > 0 && createPortal(headerDropped, headerSlot)}
    <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:items-start">
        <label className="relative flex min-w-0 flex-1 items-center md:basis-full lg:basis-auto lg:max-w-xs">
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
              'h-9 w-full min-w-0 rounded-md bg-surface pr-9 pl-10 text-base text-ink ring-1 ring-line placeholder:text-faint md:h-8 md:text-sm',
              'transition-shadow duration-200 ease-spring hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
              '[&::-webkit-search-cancel-button]:hidden',
            )}
          />
          {values.q ? (
            <button
              type="button"
              onClick={() => form.setValue('q', '')}
              className="absolute right-2 grid size-7 place-items-center rounded-md text-faint hover:bg-surface-hover hover:text-ink"
            >
              <X {...ICON} className="size-3.5" />
              <span className="sr-only">Clear search</span>
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 hidden rounded border border-line px-1.5 text-micro leading-4 text-faint md:block">/</kbd>
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
            <span className="tabular absolute -top-0.5 -right-0.5 grid size-4.5 place-items-center rounded-full bg-accent text-micro font-semibold text-accent-ink">
              {refinements}
            </span>
          )}
        </Button>

        <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 md:flex md:pt-1 lg:pt-0">{refineControls(false)}</div>

        {hasFilters(search, layerFilter) && (
          <Button type="button" variant="quiet" size="sm" className="hidden md:inline-flex" onClick={() => form.reset(toForm({}))}>
            Clear
          </Button>
        )}
      </div>

      <div
        id="refine"
        className={cn('flex-col gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-line md:hidden', open ? 'flex' : 'hidden')}
      >
        {refineControls(true)}
        {hasFilters(search, layerFilter) && (
          <Button type="button" variant="quiet" size="sm" className="self-start" onClick={() => form.reset(toForm({}))}>
            Clear filters
          </Button>
        )}
      </div>
    </form>
    </>
  );
}

function ToggleGroup({
  label, options, selected, onToggle,
}: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  if (!options.length) return null;
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs text-faint">{label}</span>
      <div className="flex flex-wrap items-center rounded-lg bg-surface-sunken p-0.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={cn(WELL_BTN, on ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-ink')}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusToggles({
  statuses, selected, onToggle,
}: { statuses: Status[]; selected: string[]; onToggle: (v: string) => void }) {
  if (!statuses.length) return null;
  const groups: { key: string; items: Status[] }[] = [];
  for (const s of statuses) {
    const key = s.column ?? s.name;
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(s);
    else groups.push({ key, items: [s] });
  }
  return (
    <div role="group" aria-label="Status" className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs text-faint">Status</span>
      <div className="flex flex-wrap items-center rounded-lg bg-surface-sunken p-0.5">
        {groups.map((g, i) => (
          <div key={g.key} className={cn('flex items-center', i > 0 && 'border-l border-line pl-0.5')}>
            {g.items.map((s) => {
              const on = selected.includes(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  aria-pressed={on}
                  data-status={s.name}
                  onClick={() => onToggle(s.name)}
                  className={cn(WELL_BTN, on ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-ink')}
                >
                  <StatusGlyph status={s.name} className="size-3" />
                  {s.name}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


