# TanStack Query

TanStack Query (formerly React Query) is a powerful data-fetching and state management library for web applications that makes fetching, caching, synchronizing and updating server state effortless. Unlike traditional state management libraries designed for client state, TanStack Query is specifically built to handle the unique challenges of server state: asynchronous APIs, shared ownership, background updates, caching, deduplication, and memory management. It eliminates the need for hundreds of lines of boilerplate code and complex logic to manage server data.

The library works amazingly well out-of-the-box with zero configuration and can be customized as your application grows. It provides hooks for queries, mutations, infinite queries, and advanced patterns like optimistic updates, prefetching, and server-side rendering. TanStack Query supports multiple frameworks including React, Vue, Angular, Solid, and Svelte, making it a versatile solution for modern web applications.

## Basic Query with useQuery

Fetch and cache data from a server with automatic refetching, caching, and state management.

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

// Wrap your app
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoList />
    </QueryClientProvider>
  )
}

// Fetch function
const fetchTodos = async () => {
  const response = await fetch('https://api.example.com/todos')
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

// Component using the query
function TodoList() {
  const { isPending, isError, data, error, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
    retry: 3, // Retry failed requests 3 times
  })

  if (isPending) {
    return <div>Loading todos...</div>
  }

  if (isError) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      {isFetching && <div>Updating...</div>}
      <ul>
        {data.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Mutations with useMutation

Create, update, or delete server data with automatic invalidation and optimistic updates.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

function TodoForm() {
  const queryClient = useQueryClient()

  // Define mutation
  const createTodo = useMutation({
    mutationFn: (newTodo) => axios.post('/api/todos', newTodo),
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData(['todos'])

      // Optimistically update cache
      queryClient.setQueryData(['todos'], (old) => [...old, newTodo])

      // Return context for rollback
      return { previousTodos }
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos)
      alert('Failed to create todo: ' + err.message)
    },
    onSuccess: (data, variables, context) => {
      console.log('Todo created:', data)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    createTodo.mutate({
      id: Date.now(),
      title: formData.get('title'),
      completed: false,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />
      <button type="submit" disabled={createTodo.isPending}>
        {createTodo.isPending ? 'Creating...' : 'Create Todo'}
      </button>
      {createTodo.isError && <div>Error: {createTodo.error.message}</div>}
      {createTodo.isSuccess && <div>Todo created!</div>}
    </form>
  )
}
```

## Query Keys and Parameterized Queries

Use structured query keys to uniquely identify and manage cached data.

```tsx
import { useQuery } from '@tanstack/react-query'

// Fetch a single todo by ID
function TodoDetail({ todoId }) {
  const { data: todo } = useQuery({
    queryKey: ['todo', todoId],
    queryFn: async () => {
      const res = await fetch(`/api/todos/${todoId}`)
      return res.json()
    },
    enabled: !!todoId, // Only run when todoId exists
  })

  return <div>{todo?.title}</div>
}

// Fetch filtered todos
function FilteredTodos({ status, page }) {
  const { data } = useQuery({
    queryKey: ['todos', { status, page }], // Complex keys with objects
    queryFn: async () => {
      const res = await fetch(`/api/todos?status=${status}&page=${page}`)
      return res.json()
    },
    staleTime: 60000,
  })

  return (
    <ul>
      {data?.items.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

## QueryClient Methods for Cache Management

Programmatically manage cache data with QueryClient methods.

```tsx
import { useQueryClient } from '@tanstack/react-query'

function AdminPanel() {
  const queryClient = useQueryClient()

  // Prefetch data before navigation
  const prefetchTodo = async (id) => {
    await queryClient.prefetchQuery({
      queryKey: ['todo', id],
      queryFn: () => fetch(`/api/todos/${id}`).then(res => res.json()),
      staleTime: 10000,
    })
  }

  // Get cached data synchronously
  const getCachedTodo = (id) => {
    const data = queryClient.getQueryData(['todo', id])
    console.log('Cached todo:', data)
  }

  // Set cache data manually
  const updateCache = (id, newData) => {
    queryClient.setQueryData(['todo', id], newData)
  }

  // Invalidate and refetch queries
  const refreshTodos = async () => {
    // Invalidate all todos queries
    await queryClient.invalidateQueries({ queryKey: ['todos'] })

    // Invalidate only exact match
    await queryClient.invalidateQueries({
      queryKey: ['todos', { status: 'done' }],
      exact: true
    })
  }

  // Cancel ongoing queries
  const cancelFetches = async () => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
  }

  // Remove queries from cache
  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['todos'] })
    // Or clear everything
    queryClient.clear()
  }

  // Check fetching status
  const checkStatus = () => {
    const fetchingCount = queryClient.isFetching()
    console.log(`${fetchingCount} queries currently fetching`)
  }

  return (
    <div>
      <button onClick={() => prefetchTodo(1)}>Prefetch Todo 1</button>
      <button onClick={refreshTodos}>Refresh All Todos</button>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  )
}
```

## Infinite Queries for Pagination

Load paginated data with infinite scroll or load-more functionality.

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function ProjectList() {
  const fetchProjects = async ({ pageParam = 0 }) => {
    const res = await fetch(`/api/projects?cursor=${pageParam}`)
    return res.json() // Returns { data: [...], nextCursor: 3 }
  }

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
    maxPages: 5, // Keep only 5 pages in memory
  })

  if (status === 'pending') return <div>Loading...</div>
  if (status === 'error') return <div>Error: {error.message}</div>

  return (
    <div>
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.data.map((project) => (
            <div key={project.id}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>

      {isFetching && !isFetchingNextPage && <div>Background update...</div>}
    </div>
  )
}
```

## Prefetching and Router Integration

Prefetch data before navigation or user interaction for instant UI updates.

```tsx
import { useQueryClient } from '@tanstack/react-query'

function ProjectCard({ project }) {
  const queryClient = useQueryClient()

  // Prefetch on hover
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['project', project.id],
      queryFn: () => fetch(`/api/projects/${project.id}`).then(res => res.json()),
      staleTime: 60000, // Only prefetch if older than 1 minute
    })
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
    >
      <h3>{project.name}</h3>
      <Link to={`/projects/${project.id}`}>View Details</Link>
    </div>
  )
}

// Next.js Route Prefetching
export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}
```

## Query Invalidation Patterns

Mark queries as stale and trigger refetches intelligently.

```tsx
import { useQueryClient, useMutation } from '@tanstack/react-query'

function TodoManager() {
  const queryClient = useQueryClient()

  const deleteTodo = useMutation({
    mutationFn: (id) => fetch(`/api/todos/${id}`, { method: 'DELETE' }),
    onSuccess: (data, deletedId) => {
      // Invalidate all todos queries
      queryClient.invalidateQueries({ queryKey: ['todos'] })

      // Invalidate specific todo
      queryClient.invalidateQueries({ queryKey: ['todo', deletedId] })

      // Invalidate only active queries
      queryClient.invalidateQueries({
        queryKey: ['todos'],
        refetchType: 'active', // 'active' | 'inactive' | 'all' | 'none'
      })

      // Invalidate queries matching a filter
      queryClient.invalidateQueries({
        queryKey: ['todos'],
        predicate: (query) =>
          query.queryKey[1]?.status === 'pending',
      })
    },
  })

  // Refetch without invalidation
  const refreshAll = async () => {
    // Refetch all stale queries
    await queryClient.refetchQueries({ stale: true })

    // Refetch specific queries
    await queryClient.refetchQueries({
      queryKey: ['todos'],
      type: 'active',
      exact: false,
    })
  }

  return <button onClick={() => deleteTodo.mutate(1)}>Delete Todo</button>
}
```

## Server-Side Rendering with Hydration

Implement SSR with data prefetching and client-side hydration.

```tsx
// Next.js pages/_app.tsx
import { QueryClient, QueryClientProvider, Hydrate } from '@tanstack/react-query'
import { useState } from 'react'

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Avoid refetch on mount with SSR
            gcTime: 5 * 60 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={pageProps.dehydratedState}>
        <Component {...pageProps} />
      </Hydrate>
    </QueryClientProvider>
  )
}

// pages/todos.tsx
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query'

export async function getServerSideProps() {
  const queryClient = new QueryClient()

  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function TodosPage() {
  // This data is already in cache from SSR
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

## Optimistic Updates with Rollback

Update UI immediately before server confirmation with automatic rollback on failure.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function TodoToggle({ todo }) {
  const queryClient = useQueryClient()

  const toggleTodo = useMutation({
    mutationFn: async (updatedTodo) => {
      const res = await fetch(`/api/todos/${updatedTodo.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedTodo),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onMutate: async (updatedTodo) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      await queryClient.cancelQueries({ queryKey: ['todo', updatedTodo.id] })

      // Snapshot previous values
      const previousTodos = queryClient.getQueryData(['todos'])
      const previousTodo = queryClient.getQueryData(['todo', updatedTodo.id])

      // Optimistically update list
      queryClient.setQueryData(['todos'], (old) =>
        old.map((t) => (t.id === updatedTodo.id ? updatedTodo : t))
      )

      // Optimistically update single todo
      queryClient.setQueryData(['todo', updatedTodo.id], updatedTodo)

      return { previousTodos, previousTodo }
    },
    onError: (err, updatedTodo, context) => {
      // Rollback to previous values
      queryClient.setQueryData(['todos'], context.previousTodos)
      queryClient.setQueryData(['todo', updatedTodo.id], context.previousTodo)
      alert('Update failed! ' + err.message)
    },
    onSettled: (data, error, updatedTodo) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['todo', updatedTodo.id] })
    },
  })

  const handleToggle = () => {
    toggleTodo.mutate({
      ...todo,
      completed: !todo.completed,
    })
  }

  return (
    <input
      type="checkbox"
      checked={todo.completed}
      onChange={handleToggle}
      disabled={toggleTodo.isPending}
    />
  )
}
```

## Suspense Mode for React Suspense

Use React Suspense for declarative loading states with useSuspenseQuery.

```tsx
import { useSuspenseQuery, QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function TodoList() {
  // No need to check isPending or isError - handled by Suspense
  const { data } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <h2>Error loading todos</h2>
              <p>{error.message}</p>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <Suspense fallback={<div>Loading todos...</div>}>
            <TodoList />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

## Dependent Queries

Execute queries sequentially when one query depends on data from another.

```tsx
import { useQuery } from '@tanstack/react-query'

function UserProjects({ userId }) {
  // First query: get user
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
  })

  // Second query: get user's projects (depends on user data)
  const { data: projects } = useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => fetch(`/api/users/${user.id}/projects`).then(res => res.json()),
    enabled: !!user?.id, // Only run when user.id exists
  })

  if (!user) return <div>Loading user...</div>
  if (!projects) return <div>Loading projects...</div>

  return (
    <div>
      <h2>{user.name}'s Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Parallel Queries with useQueries

Execute multiple queries in parallel with a single hook.

```tsx
import { useQueries } from '@tanstack/react-query'

function Dashboard({ userIds }) {
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetch(`/api/users/${id}`).then(res => res.json()),
      staleTime: 60000,
    })),
  })

  // Check if all queries are done
  const isLoading = userQueries.some((query) => query.isPending)
  const isError = userQueries.some((query) => query.isError)

  if (isLoading) return <div>Loading users...</div>
  if (isError) return <div>Error loading some users</div>

  return (
    <div>
      {userQueries.map((query, i) => (
        <div key={userIds[i]}>
          <h3>{query.data?.name}</h3>
          <p>{query.data?.email}</p>
        </div>
      ))}
    </div>
  )
}
```

## Global Configuration and Defaults

Configure default options globally and per-query-key.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Global configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

// Set defaults for specific query keys
queryClient.setQueryDefaults(['todos'], {
  queryFn: async () => {
    const res = await fetch('/api/todos')
    return res.json()
  },
  staleTime: 10 * 60 * 1000, // Override global staleTime
})

// Set mutation defaults
queryClient.setMutationDefaults(['addTodo'], {
  mutationFn: async (newTodo) => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    })
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

## Summary

TanStack Query revolutionizes how web applications handle server state by providing a comprehensive solution for data fetching, caching, synchronization, and updates. The library's core use cases include real-time data synchronization, infinite scrolling and pagination, optimistic UI updates, server-side rendering with hydration, background refetching, and intelligent cache management. It excels in scenarios where applications need to display frequently changing server data, handle complex data dependencies, or provide seamless offline experiences with cache persistence.

Integration patterns range from simple GET requests with automatic caching to sophisticated mutation workflows with optimistic updates and rollback mechanisms. TanStack Query works seamlessly with REST APIs, GraphQL endpoints, and any Promise-based data source. The library integrates naturally with React routers for prefetching, supports SSR frameworks like Next.js and Remix, and provides devtools for debugging cache state and query behavior. Whether building a small application with basic data fetching or a large-scale system with complex state management requirements, TanStack Query provides the tools and patterns needed to build performant, maintainable, and user-friendly applications with minimal boilerplate code.
