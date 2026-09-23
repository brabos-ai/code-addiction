import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium select-none ' +
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
        'inline-flex max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-full px-2 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
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

/** The ticket's status, in its own hue. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[var(--st-soft)] px-2 py-0.5 text-xs font-medium leading-5 text-[var(--st)]',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--st)]" />
      {status || 'no status'}
    </span>
  );
}
