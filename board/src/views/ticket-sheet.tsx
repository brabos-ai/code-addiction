import { useRef, type ReactNode } from 'react';
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
          className={cn(
            'fixed z-50 flex flex-col bg-surface-3 text-ink outline-none',
            // Phone: a bottom sheet the thumb can reach. Wider: a side panel.
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[22px] shadow-sheet animate-[sheet-in-up_420ms_var(--ease-spring)]',
            'sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-[min(560px,92vw)] sm:rounded-none sm:rounded-l-[22px]',
            'sm:animate-[sheet-in-right_420ms_var(--ease-spring)]',
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" />
          {ticket ? (
            <TicketBody ticket={ticket} rank={rank ?? 0} total={tickets.length} />
          ) : (
            <div className="p-6">
              <Dialog.Title className="text-lg font-semibold">Ticket {ticketId} is not on the board</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">
                It may have been removed, or the link is from another board.
              </Dialog.Description>
            </div>
          )}
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

function TicketBody({ ticket, rank, total }: { ticket: Ticket; rank: number; total: number }) {
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-8 sm:px-8 sm:pt-7">
      <div className="flex flex-wrap items-center gap-2 pr-12">
        <StatusPill status={ticket.status} />
        <span translate="no" className="tabular text-xs text-faint">{ticket.id}</span>
        {rank > 0 && <span className="tabular text-xs text-faint">Priority {rank} of {total}</span>}
      </div>

      <Dialog.Title className="mt-3 text-display leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
        {ticket.title}
      </Dialog.Title>
      {ticket.tldr ? (
        <Dialog.Description className="mt-2 text-body leading-relaxed text-muted">{ticket.tldr}</Dialog.Description>
      ) : (
        <Dialog.Description className="sr-only">Ticket {ticket.id}</Dialog.Description>
      )}

      {ticket.done_when && (
        <div className="mt-6 rounded-2xl bg-accent-soft/70 p-4">
          <h3 className="text-xs font-semibold text-accent">Done when</h3>
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

      <Section title="Details">
        <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
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
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
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
