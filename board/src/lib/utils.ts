import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// The type scale in index.css (@theme inline) names its steps by job. Unknown
// to tailwind-merge, `text-meta` read as a colour and was dropped whenever a
// `text-muted` or `text-accent` came after it, so those controls rendered at
// the browser's 16px instead of 13px.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['micro', 'meta', 'body', 'section', 'display'] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
