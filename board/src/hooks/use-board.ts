import { useSuspenseQuery } from '@tanstack/react-query';
import { boardQueryOptions, normaliseTicket } from '@/api/board';
import { isBoardError, type BoardData, type BoardError } from '@/api/types';

export type BoardState = { kind: 'ok'; data: BoardData } | { kind: 'error'; error: BoardError };

/** The board as every screen reads it: loaded by the route, normalised once. */
export function useBoard(): BoardState {
  const { data } = useSuspenseQuery(boardQueryOptions);
  if (isBoardError(data)) return { kind: 'error', error: data };
  return { kind: 'ok', data: { ...data, tickets: data.tickets.map(normaliseTicket) } };
}
