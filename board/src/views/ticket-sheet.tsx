import { useParams } from '@tanstack/react-router';
import { useBoard } from '@/hooks/use-board';

export function TicketSheet({ from }: { from: '/board' | '/list' }) {
  const { ticketId } = useParams({ from: `${from}/$ticketId` });
  const board = useBoard();
  if (board.kind === 'error') return null;
  const t = board.data.tickets.find((x) => x.id === ticketId);
  return <aside aria-label="Ticket">{t ? t.title : `No ticket ${ticketId}`}</aside>;
}
