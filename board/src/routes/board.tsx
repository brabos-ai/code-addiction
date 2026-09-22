import { createFileRoute } from '@tanstack/react-router';
import { boardQueryOptions } from '@/api/board';
import { parseBoardSearch } from '@/lib/search';
import { AppShell } from '@/components/app-shell';
import { BoardSkeleton } from '@/components/states';
import { BoardView } from '@/views/board-view';

export const Route = createFileRoute('/board')({
  validateSearch: parseBoardSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQueryOptions),
  component: BoardView,
  pendingComponent: () => <AppShell view="board"><BoardSkeleton /></AppShell>,
});
