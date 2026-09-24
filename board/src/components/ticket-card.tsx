import { Link } from '@tanstack/react-router';
import { CircleDashed, GitBranch, MessageSquare } from 'lucide-react';
import type { Ticket } from '@/api/types';
import { formatRank, workLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Chip, StatusPill } from './ui';

const ICON = { strokeWidth: 1.5 } as const;

type Props = { ticket: Ticket; rank: number; total: number; from: '/board' | '/list'; quiet?: boolean; showStatus?: boolean };

/** The meta line a card and a list row share: theme, labels, and what a glance should catch. */
export function TicketMeta({ ticket, showTheme = true, showId = true, showStatus = false, className }: {
  ticket: Ticket; showTheme?: boolean; showId?: boolean; showStatus?: boolean; className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1.5', className)}>
      {/* On the board a column can hold several statuses, so the card names its
          own. The list shows status in a column of its table and leaves it off. */}
      {showStatus && <StatusPill status={ticket.status} />}
      {showTheme && ticket.theme && (
        // Capped, not max-w-full: a long theme took the whole row and pushed
        // every label onto a second line, making cards different heights for no
        // reason a reader could see. The full text stays in the title attribute.
        <Chip className="max-w-[60%]" title={ticket.theme}>
          <span className="truncate">{ticket.theme}</span>
        </Chip>
      )}
      {ticket.labels.map((l) => <Chip key={l} tone="outline">{l}</Chip>)}
      {!ticket.grounded && (
        <span className="inline-flex items-center text-faint" title="Recorded as stated — not checked against the repository">
          <CircleDashed {...ICON} className="size-3.5" />
          <span className="sr-only">Not grounded</span>
        </span>
      )}
      {ticket.comments.length > 0 && (
        <span className="tabular inline-flex items-center gap-1 text-xs text-faint" title={`${ticket.comments.length} comment(s)`}>
          <MessageSquare {...ICON} className="size-3.5" />
          {ticket.comments.length}
        </span>
      )}
      {ticket.work_id && (
        <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-faint" title={`Picked up as ${ticket.work_id}`}>
          <GitBranch {...ICON} className="size-3.5 shrink-0" />
          <span className="truncate">{workLabel(ticket.work_id)}</span>
        </span>
      )}
      {/* The id is what a person copies into a command, so it is set like one and
          reaches text contrast. It carried --faint, at ~3.9:1 on a light card. */}
      {showId && (
        <span translate="no" className="tabular ml-auto pl-1 text-micro tracking-[0.04em] text-muted">
          {ticket.id}
        </span>
      )}
    </div>
  );
}

export function TicketCard({ ticket, rank, total, from, quiet, showStatus }: Props) {
  const className = cn(
    'group relative flex gap-3 rounded-xl bg-surface p-3.5 shadow-card ring-1 ring-line',
    'transition-[box-shadow,transform] duration-300 ease-spring hover:-translate-y-px hover:shadow-lift hover:ring-line-strong',
    'active:translate-y-0 active:scale-[0.995]',
    quiet && 'bg-surface/70',
  );
  const body = (
    <>
      <span
        aria-label={`Priority ${rank}`}
        className={cn(
          // The card's one bold element (index.css:3-5). It kept its size and
          // weight and left ink/25, which rendered at ~2.1:1 in dark — too faint
          // to perform the job the stylesheet gives it. No quiet variant: the
          // card already dims through its surface and its title.
          'tabular w-[2.2ch] shrink-0 pt-px text-display leading-none font-semibold tracking-tight text-rank',
        )}
      >
        {formatRank(rank, total)}
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className={cn(
            'line-clamp-2 text-body leading-snug font-medium text-ink [overflow-wrap:anywhere]',
            // Hover lands on the title, which is what the card is about. It used
            // to light up the rank instead.
            'transition-colors duration-200 group-hover:text-accent',
            quiet && 'text-muted',
          )}
        >
          {ticket.title}
        </h3>
        {ticket.tldr && <p className="mt-1 line-clamp-2 text-meta leading-snug text-muted [overflow-wrap:anywhere]">{ticket.tldr}</p>}
        <TicketMeta ticket={ticket} showStatus={showStatus} className="mt-2.5" />
      </div>
    </>
  );
  return from === '/board' ? (
    <Link to="/board/$ticketId" params={{ ticketId: ticket.id }} search={(prev) => prev} className={className} data-quiet={quiet || undefined}>
      {body}
    </Link>
  ) : (
    <Link to="/list/$ticketId" params={{ ticketId: ticket.id }} search={(prev) => prev} className={className}>
      {body}
    </Link>
  );
}
