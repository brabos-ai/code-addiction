import { Link } from '@tanstack/react-router';
import { AlertTriangle, SearchX, Terminal } from 'lucide-react';
import type { BoardData, BoardError } from '@/api/types';
import { Button } from './ui';

const ICON = { strokeWidth: 1.5 } as const;

const ERRORS: Record<string, { title: string; body: string }> = {
  'bash-missing': {
    title: 'bash is not on this machine’s PATH',
    body: 'The board reads tickets through backlog.sh, which needs bash. Install Git Bash on Windows, or start the board from a shell that has bash.',
  },
  'script-missing': {
    title: 'backlog.sh was not found',
    body: 'The board looks for it in .codeadd/scripts of the project it was started in. Start the board from the project root, or pass --scripts.',
  },
  'script-failed': {
    title: 'backlog.sh stopped with an error',
    body: 'The board could not be read. The script’s own message is below.',
  },
};

export function ErrorPanel({ error }: { error: BoardError }) {
  const copy = ERRORS[error.error] ?? { title: 'The board could not be read', body: 'The server answered with an error.' };
  return (
    <div role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
          <Terminal {...ICON} className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted">{copy.body}</p>
          {error.detail && (
            <pre className="scrollbar-thin mt-3 max-h-40 overflow-auto rounded-lg bg-surface-sunken p-3 text-xs whitespace-pre-wrap text-muted">
              {error.detail}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyBoard() {
  return (
    <div className="mx-auto mt-16 max-w-md px-2 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <span className="tabular text-lg font-semibold">0</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nothing on the board yet</h2>
      <p className="mt-2 text-sm text-muted">
        The board shows docs/backlog.jsonl. Record the first ticket by asking your agent to note something for later —
        the add-backlog skill in a project, or /add-framework--backlog in the framework repository.
      </p>
    </div>
  );
}

export function NoMatches({ to }: { to: '/board' | '/list' }) {
  return (
    <div className="mx-auto mt-12 max-w-sm px-2 text-center">
      <SearchX {...ICON} className="mx-auto size-8 text-faint" />
      <h2 className="mt-3 text-base font-semibold">No tickets match these filters</h2>
      <p className="mt-1 text-sm text-muted">Clear them to see the whole board again.</p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to={to} search={{}}>Clear filters</Link>
      </Button>
    </div>
  );
}

/** Damaged lines and undefined statuses: worth knowing, never a reason to hide the board. */
export function HealthBanner({ data }: { data: BoardData }) {
  const issues: string[] = [];
  if (data.damagedLines.length) {
    const n = data.damagedLines.length;
    issues.push(
      `${n === 1 ? 'Line' : 'Lines'} ${data.damagedLines.join(', ')} of docs/backlog.jsonl could not be read and ${n === 1 ? 'is' : 'are'} left out.`,
    );
  }
  if (data.undefinedStatuses.length) {
    const list = data.undefinedStatuses.map((s) => `“${s}”`).join(', ');
    issues.push(`${list} ${data.undefinedStatuses.length === 1 ? 'is a status' : 'are statuses'} in use but not defined in docs/backlog.definitions.json.`);
  }
  if (!issues.length) return null;
  return (
    <div role="status" className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
      <AlertTriangle {...ICON} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-0.5 [overflow-wrap:anywhere]">{issues.map((i) => <p key={i}>{i}</p>)}</div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-hidden className="grid animate-[pulse-soft_1.6s_ease-in-out_infinite] grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((c) => (
        <div key={c} className={c > 0 ? 'hidden md:block' : ''}>
          <div className="mb-3 h-5 w-24 rounded bg-surface-active" />
          {[0, 1, 2].map((r) => <div key={r} className="mb-2 h-28 rounded-xl bg-surface-sunken" />)}
        </div>
      ))}
    </div>
  );
}
