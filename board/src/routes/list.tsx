import { createFileRoute } from '@tanstack/react-router';
import { boardQueryOptions } from '@/api/board';
import { parseBoardSearch } from '@/lib/search';
import { ListView } from '@/views/list-view';

export const Route = createFileRoute('/list')({
  validateSearch: parseBoardSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQueryOptions),
  component: ListView,
});
