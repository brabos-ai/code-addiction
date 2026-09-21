import { Outlet, useSearch } from '@tanstack/react-router';
import { useBoard } from '@/hooks/use-board';
import { filterTickets } from '@/lib/tickets';

export function ListView() {
  const board = useBoard();
  const search = useSearch({ from: '/list' });
  if (board.kind === 'error') return <p role="alert">{board.error.error}</p>;
  return (
    <main>
      <ol>{filterTickets(board.data.tickets, search).map((t) => <li key={t.id}>{t.title}</li>)}</ol>
      <Outlet />
    </main>
  );
}
