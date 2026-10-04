import { QueryClient } from '@tanstack/react-query';
import { createRouter, type RouterHistory } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export function makeRouter(history?: RouterHistory) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    history,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
  return { router, queryClient };
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof makeRouter>['router'];
  }
}
