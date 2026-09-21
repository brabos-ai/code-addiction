import { createFileRoute } from '@tanstack/react-router';
import { boardQueryOptions } from '@/api/board';
import { TicketSheet } from '@/views/ticket-sheet';

export const Route = createFileRoute('/list/$ticketId')({
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQueryOptions),
  component: () => <TicketSheet from="/list" />,
});
