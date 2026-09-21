// The /api/board contract, as board/server.mjs answers it. The ticket fields are
// owned by add-doc-schemas/references/backlog.md; this mirrors them, it does not
// define them.

export type Comment = { content: string; created_at: string };

export type Ticket = {
  id: string;
  title: string;
  theme: string;
  labels: string[];
  tldr: string;
  notes: string[];
  done_when: string;
  paths: string[];
  grounded: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  work_id: string | null;
};

export type Status = { name: string; order: number; means: string };

export type BoardData = {
  present: boolean;
  tickets: Ticket[];
  statuses: Status[];
  damagedLines: number[];
  undefinedStatuses: string[];
  readAt: string;
};

export type BoardError = { error: 'bash-missing' | 'script-missing' | 'script-failed' | string; detail?: string };

export type BoardResponse = BoardData | BoardError;

export function isBoardError(r: BoardResponse): r is BoardError {
  return typeof (r as BoardError).error === 'string';
}
