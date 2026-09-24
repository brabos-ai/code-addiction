import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactElement } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium select-none ' +
    'transition-[background-color,color,box-shadow,transform] duration-200 ease-spring active:scale-[0.97] ' +
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-ink hover:brightness-110',
        quiet: 'text-muted hover:bg-surface-hover hover:text-ink',
        outline: 'bg-surface text-ink shadow-card ring-1 ring-line hover:ring-line-strong',
      },
      size: {
        md: 'h-10 px-4',
        sm: 'h-9 px-3 text-meta',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'quiet', size: 'md' },
  },
);

export function Button({
  className, variant, size, asChild, ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** A small tag: theme, label, path. */
export function Chip({ className, tone = 'plain', ...props }: ComponentProps<'span'> & { tone?: 'plain' | 'accent' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-sm px-1.5 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
        tone === 'plain' && 'bg-surface-sunken text-muted',
        tone === 'accent' && 'bg-accent-soft text-accent',
        // line-strong, not line: against a card in dark the softer rule falls to
        // ~1.4:1 and the outlined chip stops reading as outlined at all.
        tone === 'outline' && 'text-muted ring-1 ring-line-strong ring-inset',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The status mark: a shape per state, not only a hue.
 *
 * Four statuses told apart by the colour of one 6px dot are four statuses a
 * colour-blind reader cannot tell apart at all, and that anybody has to learn
 * before they can scan. The shapes carry the progression — empty, half, struck
 * through, complete — so hue becomes reinforcement rather than the whole signal.
 *
 * A status the definitions file declares but this set does not know keeps the
 * plain dot, so a user-defined status renders as something rather than nothing.
 */
export function StatusGlyph({ status, className }: { status: string; className?: string }) {
  const shape = SHAPES[status];
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cn('size-3.5 shrink-0', className)}>
      <g data-glyph={status in SHAPES ? status : 'unknown'}>
        {shape ?? <circle cx="8" cy="8" r="3.5" fill="var(--st)" />}
      </g>
    </svg>
  );
}

const RING = { cx: '8', cy: '8', r: '5.5', fill: 'none', stroke: 'var(--st)', strokeWidth: '2' } as const;

const SHAPES: Record<string, ReactElement> = {
  // Nothing started: an outline waiting to be filled.
  open: <circle {...RING} />,
  // Underway: the outline half filled, reading as progress.
  doing: (
    <>
      <circle {...RING} />
      <path d="M8 4.5A3.5 3.5 0 0 1 8 11.5Z" fill="var(--st)" />
    </>
  ),
  // Finished: solid, with the check cut out of it in the chip's own colour.
  done: (
    <>
      <circle cx="8" cy="8" r="6.5" fill="var(--st)" />
      <path d="M5 8.2l2.2 2.2L11 6.6" fill="none" stroke="var(--st-soft)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Waiting for the next phase: the outline with a point at its centre — the
  // work of this phase is finished, the next has not started.
  shaped: (
    <>
      <circle {...RING} />
      <circle cx="8" cy="8" r="2" fill="var(--st)" />
    </>
  ),
  // Abandoned: struck through, the one shape that reads as "not happening".
  dropped: (
    <>
      <circle {...RING} />
      <path d="M5.6 5.6l4.8 4.8" fill="none" stroke="var(--st)" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

// A phase's running status shares doing's shape and its waiting status shares
// shaped's; the hue says which phase. A pipeline read left to right is then
// ring, half, point, half, point, half, half, check.
SHAPES.refining = SHAPES.doing!;
SHAPES.planning = SHAPES.doing!;
SHAPES['in-review'] = SHAPES.doing!;
SHAPES.planned = SHAPES.shaped!;

/** The ticket's status, in its own hue and its own shape. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm bg-[var(--st-soft)] px-2 py-0.5 text-xs font-medium leading-5 text-[var(--st)]',
        className,
      )}
    >
      <StatusGlyph status={status} />
      {status || 'no status'}
    </span>
  );
}
