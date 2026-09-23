import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Notes and comments are markdown the user wrote. Raw HTML stays disabled
 * (react-markdown's default); links open in a new tab.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        // Capped measure and normal leading: the panel is 680px wide and prose
        // set to its full width runs past 70 characters a line, which is a line
        // the eye has to track back across. Relaxed leading suits an essay; this
        // is a list of notes.
        'max-w-[56ch] text-body leading-normal text-ink [overflow-wrap:anywhere]',
        '[&_p]:my-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2',
        '[&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:py-px [&_code]:text-[0.9em]',
        '[&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: ({ node: _node, ...p }) => <a {...p} target="_blank" rel="noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
