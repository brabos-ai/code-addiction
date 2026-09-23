import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { CircleCheck, CircleDashed, X } from 'lucide-react';
import type { Ticket } from '@/api/types';
import { Markdown } from '@/components/markdown';
import { Chip, StatusPill } from '@/components/ui';
import { useBoard } from '@/hooks/use-board';
import { absoluteTime, relativeTime } from '@/lib/format';
import { rankOf } from '@/lib/tickets';
import { cn } from '@/lib/utils';

const ICON = { strokeWidth: 1.5 } as const;

/**
 * The ticket, over the board or the list. It is a child route: the URL names the
 * ticket, Back closes it, and the parent's filters survive the round trip.
 *
 * The header carries the close button and nothing else. The action region for
 * running agents on this ticket, or refining it first, belongs beside it — it
 * is designed and deliberately NOT rendered until those features exist.
 */
export function TicketSheet({ from }: { from: '/board' | '/list' }) {
  const { ticketId } = useParams({ from: `${from}/$ticketId` });
  const search = useSearch({ from });
  const navigate = useNavigate();
  const board = useBoard();
  const panel = useRef<HTMLDivElement | null>(null);

  const close = () => void navigate({ to: from, search });
  const tickets = board.kind === 'ok' ? board.data.tickets : [];
  const ticket = tickets.find((t) => t.id === ticketId);
  const rank = rankOf(tickets).get(ticketId);

  // The header already says "Priority N of M"; this is what makes it navigable.
  // Additive only: Esc still closes, Back still closes, and the filters ride
  // along because the parent's search is passed through unchanged.
  const step = (delta: number) => {
    const at = tickets.findIndex((t) => t.id === ticketId);
    const next = at < 0 ? undefined : tickets[at + delta];
    if (next) void navigate({ to: `${from}/$ticketId`, params: { ticketId: next.id }, search });
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const delta = e.key === 'j' || e.key === 'ArrowDown' ? 1 : e.key === 'k' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    step(delta);
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] animate-[fade-in_200ms_ease-out] dark:bg-black/60" />
        <Dialog.Content
          ref={panel}
          tabIndex={-1}
          aria-label="Ticket"
          // Focus the panel, not the close button: a ring on a button nobody reached
          // with the keyboard reads as a selection. Tab still lands on Close first.
          onOpenAutoFocus={(e) => { e.preventDefault(); panel.current?.focus(); }}
          onKeyDown={onKeyDown}
          className={cn(
            'fixed z-50 flex flex-col bg-surface-3 text-ink outline-none',
            // Phone: a bottom sheet the thumb can reach. Wider: a side panel.
            // The radius falls on the exposed edge and only there: the top on a
            // bottom sheet, the left on a panel anchored to the right. One 16px
            // step for both, where the two used to disagree at 22px and 0.
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl shadow-sheet animate-[sheet-in-up_420ms_var(--ease-spring)]',
            // Wider than it was: the content is long-form, and F16 caps the
            // measure from the inside rather than letting the panel do it.
            'sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-[min(680px,94vw)] sm:rounded-none sm:rounded-l-2xl',
            'sm:animate-[sheet-in-right_420ms_var(--ease-spring)]',
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
          {/* What a reader must never lose while scrolling: which ticket this is
              and what state it is in. Only the close control used to be anchored,
              so anyone deep in the notes had lost both. */}
          {ticket && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-5 py-3.5 pr-28 sm:px-8 sm:py-4">
              <StatusPill status={ticket.status} />
              <span translate="no" className="tabular text-xs tracking-[0.04em] text-muted">{ticket.id}</span>
              {(rank ?? 0) > 0 && <span className="tabular text-xs text-muted">Priority {rank} of {tickets.length}</span>}
            </div>
          )}
          {ticket ? (
            <TicketBody ticket={ticket} />
          ) : (
            <div className="p-6">
              <Dialog.Title className="text-lg font-semibold">Ticket {ticketId} is not on the board</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                It may have been removed, or the link is from another board.
              </Dialog.Description>
            </div>
          )}
          {/* Esc is the gesture people reach for, so the sheet says so. It is a
              hint and not a control: the header holds one button, the close. */}
          <span
            aria-hidden
            // Filled rather than outlined: a --line-strong rule on --surface-3
            // measures 1.37:1, well under the 3:1 a component outline needs.
            className="absolute top-5 right-15 hidden rounded bg-surface-sunken px-1.5 py-0.5 text-micro text-muted sm:block sm:top-6 sm:right-16"
          >
            Esc
          </span>
          <Dialog.Close
            className="absolute top-3 right-3 grid size-10 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-ink sm:top-4 sm:right-4"
          >
            <X {...ICON} className="size-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TicketBody({ ticket }: { ticket: Ticket }) {
  return (
    <div data-sheet-body className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-8 sm:px-8">
      <Dialog.Title className="text-display leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
        {ticket.title}
      </Dialog.Title>
      {ticket.tldr ? (
        <Dialog.Description className="mt-2 max-w-[56ch] text-body leading-normal text-muted">{ticket.tldr}</Dialog.Description>
      ) : (
        <Dialog.Description className="sr-only">Ticket {ticket.id}</Dialog.Description>
      )}

      {/* What the ticket IS, adjacent to its title. This was a Details section
          after Notes, Paths and Comments, so learning a ticket's theme meant
          scrolling past everything written about it. */}
      <dl className="mt-5 grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-y border-line py-4 text-sm">
        <Detail term="Theme">{ticket.theme || <span className="text-faint">None</span>}</Detail>
        <Detail term="Labels">
          {ticket.labels.length ? (
            <span className="flex flex-wrap gap-1.5">{ticket.labels.map((l) => <Chip key={l} tone="outline">{l}</Chip>)}</span>
          ) : (
            <span className="text-faint">None</span>
          )}
        </Detail>
        <Detail term="Grounded">
          <span className="inline-flex items-center gap-1.5">
            {ticket.grounded ? (
              <><CircleCheck {...ICON} className="size-4 text-[var(--s-done)]" />Checked against the repository</>
            ) : (
              <><CircleDashed {...ICON} className="size-4 text-faint" />Recorded as stated</>
            )}
          </span>
        </Detail>
        <Detail term="Work">{ticket.work_id ?? <span className="text-faint">Not picked up</span>}</Detail>
        <Detail term="Created"><time dateTime={ticket.created_at}>{absoluteTime(ticket.created_at)}</time></Detail>
        <Detail term="Updated"><time dateTime={ticket.updated_at}>{absoluteTime(ticket.updated_at)}</time></Detail>
      </dl>

      {ticket.done_when && (
        // A rule on the accent rather than a filled accent box: the filled
        // version read as a documentation callout, and it was spending the
        // palette's one accent on a block that is already the loudest thing here.
        <div className="mt-6 rounded-r-xl border-l-2 border-accent bg-surface-2 px-4 py-3">
          <h3 className="text-sm font-semibold text-accent">Done when</h3>
          <Markdown className="mt-1.5 text-body">{ticket.done_when}</Markdown>
        </div>
      )}

      {ticket.notes.length > 0 && (
        <Section title="Notes">
          <ul className="space-y-3">
            {ticket.notes.map((n, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-line-strong" />
                <Markdown className="min-w-0 flex-1">{n}</Markdown>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ticket.paths.length > 0 && (
        <Section title="Paths">
          <ul className="flex flex-wrap gap-1.5">
            {ticket.paths.map((p) => (
              <li key={p} className="min-w-0 max-w-full">
                <code translate="no" className="block truncate rounded-lg bg-surface-sunken px-2 py-1 text-meta text-ink">{p}</code>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ticket.comments.length > 0 && (
        <Section title={`Comments (${ticket.comments.length})`}>
          <ol className="relative space-y-4 border-l border-line pl-4">
            {ticket.comments.map((c, i) => (
              <li key={i}>
                <p className="text-xs text-faint" title={absoluteTime(c.created_at)}>{relativeTime(c.created_at)}</p>
                <Markdown className="mt-1">{c.content}</Markdown>
              </li>
            ))}
          </ol>
        </Section>
      )}

    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7 border-t border-line pt-5">
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{term}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </>
  );
}
