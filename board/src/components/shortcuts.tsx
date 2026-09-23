import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

/**
 * The shortcuts, and the only thing that tells anyone they exist.
 *
 * `/` and `Esc` shipped with the board and nothing named them, so they were
 * features only their author could find. `?` is the conventional way to ask.
 */
const KEYS: { keys: string[]; does: string }[] = [
  { keys: ['/'], does: 'Focus the search' },
  { keys: ['J', 'K'], does: 'Next and previous ticket, with a ticket open' },
  { keys: ['↑', '↓'], does: 'The same, for anyone who does not use J and K' },
  { keys: ['Esc'], does: 'Close the ticket, or this list' },
  { keys: ['?'], does: 'Show this list' },
];

export function Shortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
      // Never steal a keystroke from something being typed into.
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] animate-[fade-in_200ms_ease-out] dark:bg-black/60" />
        <Dialog.Content
          aria-label="Keyboard shortcuts"
          className="fixed top-1/2 left-1/2 z-50 w-[min(26rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-5 shadow-lift ring-1 ring-line-strong outline-none sm:p-6"
        >
          <Dialog.Title className="text-section font-semibold tracking-tight">Keyboard shortcuts</Dialog.Title>
          <Dialog.Description className="sr-only">Every key the board responds to.</Dialog.Description>
          <dl className="mt-4 space-y-2.5">
            {KEYS.map((row) => (
              <div key={row.does} className="flex items-baseline gap-3">
                <dt className="flex shrink-0 gap-1">
                  {row.keys.map((k) => (
                    <kbd key={k} className="rounded bg-surface-sunken px-1.5 py-0.5 text-micro text-ink">{k}</kbd>
                  ))}
                </dt>
                <dd className="text-sm text-muted">{row.does}</dd>
              </div>
            ))}
          </dl>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
