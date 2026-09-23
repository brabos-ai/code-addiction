import { Link } from '@tanstack/react-router';
import { CircleDashed, GitBranch, MessageSquare } from 'lucide-react';
import type { Ticket } from '@/api/types';
import { formatRank, workLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Chip } from './ui';

const ICON = { strokeWidth: 1.5 } as const;

type Props = { ticket: Ticket; rank: number; total: number; from: '/board' | '/list'; quiet?: boolean };

/** The meta line a card and a list row share: theme, labels, and what a glance should catch. */
export function TicketMeta({ ticket, showTheme = true, showId = true, className }: {
  ticket: Ticket; showTheme?: boolean; showId?: boolean; className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1.5', className)}>
      {showTheme && ticket.theme && (
        <Chip className="max-w-full" title={ticket.theme}>
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
      {showId && <span translate="no" className="tabular ml-auto pl-1 text-micro text-faint">{ticket.id}</span>}
    </div>
  );
}

export function TicketCard({ ticket, rank, total, from, quiet }: Props) {
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
          'tabular w-[2.2ch] shrink-0 pt-px text-display leading-none font-semibold tracking-tight text-ink/25',
          'transition-colors duration-200 group-hover:text-accent',
          quiet && 'text-ink/15',
        )}
      >
        {formatRank(rank, total)}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className={cn('line-clamp-2 text-body leading-snug font-medium text-ink [overflow-wrap:anywhere]', quiet && 'text-muted')}>
          {ticket.title}
        </h3>
        {ticket.tldr && <p className="mt-1 line-clamp-2 text-meta leading-snug text-muted [overflow-wrap:anywhere]">{ticket.tldr}</p>}
        <TicketMeta ticket={ticket} className="mt-2.5" />
      </div>
    </>
  );
  return from === '/board' ? (
    <Link to="/board/$ticketId" params={{ ticketId: ticket.id }} search={(prev) => prev} className={className}>
      {body}
    </Link>
  ) : (
    <Link to="/list/$ticketId" params={{ ticketId: ticket.id }} search={(prev) => prev} className={className}>
      {body}
    </Link>
  );
}
