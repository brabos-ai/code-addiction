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
  /** The feature id add.new created for this ticket — an id, never a path. */
  feature: string | null;
};

export type Status = { name: string; order: number; means: string; column?: string; label?: string };

/** A board column. Several statuses may share one; `hidden` keeps it off the board unless the URL asks. */
export type Column = { name: string; order: number; label?: string; hidden?: boolean };

export type LayerFilter = { name: string; values: string[] };

export type BoardData = {
  present: boolean;
  tickets: Ticket[];
  statuses: Status[];
  columns: Column[];
  layerFilter?: LayerFilter;
  damagedLines: number[];
  undefinedStatuses: string[];
  readAt: string;
};

export type BoardError = { error: 'bash-missing' | 'script-missing' | 'script-failed' | string; detail?: string };

export type BoardResponse = BoardData | BoardError;

export function isBoardError(r: BoardResponse): r is BoardError {
  return typeof (r as BoardError).error === 'string';
}
