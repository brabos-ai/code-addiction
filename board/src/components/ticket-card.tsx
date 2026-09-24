import { Link } from '@tanstack/react-router';
import { CircleDashed, Folder, GitBranch, MessageSquare, Package } from 'lucide-react';
import type { LayerFilter, Ticket } from '@/api/types';
import { workLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Chip, StatusGlyph, StatusPill } from './ui';

const ICON = { strokeWidth: 1.5 } as const;

type Props = { ticket: Ticket; rank: number; from: '/board' | '/list'; quiet?: boolean; showStatus?: boolean; layerFilter?: LayerFilter };

/** The shared meta line: theme, opt-in layer chips, and what a glance should catch. */
export function TicketMeta({ ticket, layerFilter, showTheme = true, showId = true, showStatus = false, className }: {
  ticket: Ticket; layerFilter?: LayerFilter; showTheme?: boolean; showId?: boolean; showStatus?: boolean; className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1.5', className)}>
      {/* On the board a column can hold several statuses, so the card names its
          own. The list shows status in a column of its table and leaves it off. */}
      {showStatus && <StatusPill status={ticket.status} />}
      {showTheme && ticket.theme && (
        // Text with a folder mark, not a filled chip: a theme is where a ticket
        // belongs, a label is a tag on it, and two chips side by side read as
        // two tags. Capped so a long theme does not push the labels onto a
        // second line; the full text stays in the title attribute.
        <span className="inline-flex min-w-0 max-w-[65%] items-center gap-1 text-xs text-muted compact:hidden" title={ticket.theme}>
          <Folder {...ICON} className="size-3.5 shrink-0 text-faint" />
          <span className="truncate">{ticket.theme}</span>
        </span>
      )}
      {ticket.labels.filter((l) => layerFilter?.values.includes(l)).map((l) => <Chip key={l} tone="outline">{l}</Chip>)}
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
      {/* The feature id, never its path: the path carries a slug that can be
          renamed, the id cannot. add.new writes it before any build starts. */}
      {ticket.feature && (
        <span translate="no" className="tabular inline-flex items-center gap-1 text-xs text-faint compact:hidden" title={`Feature ${ticket.feature}`}>
          <Package {...ICON} className="size-3.5 shrink-0" />
          {ticket.feature}
        </span>
      )}
      {ticket.work_id && (
        <span className="inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-faint compact:hidden" title={`Picked up as ${ticket.work_id}`}>
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

export function TicketCard({ ticket, rank, from, quiet, showStatus, layerFilter }: Props) {
  const className = cn(
    'group relative block rounded-md bg-surface px-4 py-3.5 shadow-card ring-1 ring-line compact:py-2.5',
    'transition-[box-shadow,transform] duration-300 ease-spring hover:-translate-y-px hover:shadow-lift hover:ring-line-strong',
    'active:translate-y-0 active:scale-[0.995]',
    quiet && 'bg-surface/70',
  );
  const body = (
    <>
      {/* One small line carries what used to take a column: status, id and the
          priority. The rank sat in a fixed 36px gutter down the card's left,
          which on a 245px card was 15% of the width taken from the title. */}
      <div className="mb-1.5 flex min-w-0 items-center gap-2 text-micro leading-5 text-muted compact:mb-1">
        {showStatus && (
          <span data-status={ticket.status} className="inline-flex items-center gap-1 font-medium text-[var(--st)]">
            <StatusGlyph status={ticket.status} className="size-3" />
            {ticket.status || 'no status'}
          </span>
        )}
        {/* The id is what a person copies into a command, so it reaches text
            contrast and is set in tabular figures. */}
        <span translate="no" className="tabular tracking-[0.04em]">{ticket.id}</span>
        <span
          aria-label={`Priority ${rank}`}
          className="tabular ml-auto rounded-sm bg-surface-sunken px-1.5 font-semibold text-ink"
        >
          #{rank}
        </span>
      </div>
      <h3
        className={cn(
          'line-clamp-2 text-body leading-snug font-medium text-ink [overflow-wrap:anywhere] compact:line-clamp-1 compact:text-sm',
          // Hover lands on the title, which is what the card is about.
          'transition-colors duration-200 group-hover:text-accent',
          quiet && 'text-muted',
        )}
      >
        {ticket.title}
      </h3>
      {ticket.tldr && <p className="mt-1 line-clamp-2 text-meta leading-snug text-muted [overflow-wrap:anywhere] compact:hidden">{ticket.tldr}</p>}
      <TicketMeta ticket={ticket} layerFilter={layerFilter} showId={false} className="mt-3 compact:mt-2" />
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
