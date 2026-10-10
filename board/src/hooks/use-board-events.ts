import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { boardQueryOptions } from '@/api/board';

/**
 * Keeps the board live: the server pushes `board-changed` when the board clone's
 * backlog or its definitions change (a write, or the server's own minute-by-minute
 * sync with the remote), and this invalidates the one board query. The query also
 * refetches on window focus, which makes the server sync the clone and covers a
 * filesystem whose watcher misses an event.
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
