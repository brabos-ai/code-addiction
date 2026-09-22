import { createFileRoute } from '@tanstack/react-router';
import { boardQueryOptions } from '@/api/board';
import { parseBoardSearch } from '@/lib/search';
import { AppShell } from '@/components/app-shell';
import { BoardSkeleton } from '@/components/states';
import { ListView } from '@/views/list-view';

export const Route = createFileRoute('/list')({
  validateSearch: parseBoardSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQueryOptions),
  component: ListView,
  pendingComponent: () => <AppShell view="list"><BoardSkeleton /></AppShell>,
});
