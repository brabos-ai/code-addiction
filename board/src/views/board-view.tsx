import { Outlet, useSearch } from '@tanstack/react-router';
import { useBoard } from '@/hooks/use-board';
import { filterTickets, groupByStatus } from '@/lib/tickets';

export function BoardView() {
  const board = useBoard();
  const search = useSearch({ from: '/board' });
  if (board.kind === 'error') return <p role="alert">{board.error.error}</p>;
  const groups = groupByStatus(filterTickets(board.data.tickets, search), board.data.statuses);
  return (
    <main>
      {groups.map((g) => (
        <section key={g.status.name} aria-label={g.status.name}>
          <h2>{g.status.name}</h2>
          <ul>{g.tickets.map((t) => <li key={t.id}>{t.title}</li>)}</ul>
        </section>
      ))}
      <Outlet />
    </main>
  );
}
