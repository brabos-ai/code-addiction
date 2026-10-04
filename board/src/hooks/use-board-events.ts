import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { boardQueryOptions } from '@/api/board';

/**
 * Keeps the board live: the server pushes `board-changed` when docs/backlog.jsonl
 * or its definitions change, and this invalidates the one board query. The query
 * also refetches on window focus, which covers a filesystem whose watcher misses
 * an event.
 */
export function useBoardEvents() {
  const qc = useQueryClient();
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/events');
    const onChange = () => void qc.invalidateQueries({ queryKey: boardQueryOptions.queryKey });
    es.addEventListener('board-changed', onChange);
    return () => {
      es.removeEventListener('board-changed', onChange);
      es.close();
    };
  }, [qc]);
}
