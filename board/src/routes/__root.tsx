import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { useBoardEvents } from '@/hooks/use-board-events';

export type RouterContext = { queryClient: QueryClient };

function Root() {
  useBoardEvents();
  return <Outlet />;
}

export const Route = createRootRouteWithContext<RouterContext>()({ component: Root });
