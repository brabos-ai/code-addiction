# TanStack Router

TanStack Router is a fully type-safe, modern routing library for React applications that elevates routing beyond traditional pathname matching. It provides 100% inferred TypeScript support with complete type safety across navigation, route parameters, and search params. The library treats URL search parameters as a powerful first-class state manager with JSON serialization and validation support, enabling sophisticated application state management directly in the URL.

Built with performance and developer experience in mind, TanStack Router offers built-in stale-while-revalidate caching for route loaders with dependency-based cache invalidation, automatic code splitting, and seamless integration with external data libraries like TanStack Query. It supports both file-based routing (with automatic type generation) and code-based routing, providing flexibility for projects of any size. Key features include route masking for URL privacy, nested layouts with pathless routes, navigation blocking, scroll restoration, and comprehensive authentication patterns with middleware support.

## Installation

Install TanStack Router in your React project

```bash
npm install @tanstack/react-router
# or
pnpm add @tanstack/react-router
# or
yarn add @tanstack/react-router
```

```tsx
// vite.config.ts - Setup file-based routing with Vite
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
```

## createFileRoute

Create a type-safe file-based route with automatic path inference

```tsx
// src/routes/posts.$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  // Loader runs before component renders, data is cached
  loader: async ({ params, context, deps }) => {
    const response = await fetch(`/api/posts/${params.postId}`)
    if (!response.ok) throw new Error('Failed to fetch post')
    return response.json()
  },
  // Validate and type-safe search params
  validateSearch: (search) => ({
    tab: (search.tab as 'comments' | 'details') || 'details',
    page: Number(search.page || 1),
  }),
  // Extract dependencies for cache invalidation
  loaderDeps: ({ search: { page } }) => ({ page }),
  // Data stays fresh for 10 seconds
  staleTime: 10_000,
  // Keep in cache for 5 minutes after unmount
  gcTime: 5 * 60 * 1000,
  // Error boundary component
  errorComponent: ({ error, reset }) => (
    <div>
      <h1>Error: {error.message}</h1>
      <button onClick={reset}>Retry</button>
    </div>
  ),
  // Main component with full type inference
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams() // Typed: { postId: string }
  const post = Route.useLoaderData() // Typed based on loader return
  const { tab, page } = Route.useSearch() // Typed: { tab: 'comments' | 'details', page: number }

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p>Viewing {tab} tab, page {page}</p>
    </div>
  )
}
```

## createRootRoute

Create the top-most route in your application's route tree

```tsx
// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <nav className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/posts" className="[&.active]:font-bold">
          Posts
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </nav>
      <hr />
      <Outlet /> {/* Child routes render here */}
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: () => <div>404 - Page Not Found</div>,
})
```

## createRootRouteWithContext

Create root route with typed context for dependency injection across all routes

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
    user: User | null
  }
  fetchPosts: () => Promise<Post[]>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
  beforeLoad: async ({ context }) => {
    // Context available in all child routes
    console.log('Auth status:', context.auth.isAuthenticated)
  },
})

// src/routes/posts.tsx - Access context in child routes
export const Route = createFileRoute('/posts')({
  loader: async ({ context }) => {
    // Use injected dependency
    return context.fetchPosts()
  },
  component: PostsComponent,
})

// src/main.tsx - Provide context to router
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // Will be set by provider
    fetchPosts: async () => {
      const res = await fetch('/api/posts')
      return res.json()
    },
  },
})

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <InnerApp />
      </QueryClientProvider>
    </AuthProvider>
  )
}
```

## createRouter

Create the router instance with configuration and context

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // Auto-generated by plugin

const router = createRouter({
  routeTree,
  // Preload routes on hover/touchstart
  defaultPreload: 'intent',
  // Preload delay in milliseconds
  defaultPreloadDelay: 100,
  // Restore scroll position on navigation
  scrollRestoration: true,
  // Default stale time for all routes
  defaultStaleTime: 0,
  // Default garbage collection time
  defaultGcTime: 30 * 60 * 1000, // 30 minutes
  // Context available to all routes
  context: {
    queryClient,
    auth: undefined!,
  },
  // Not found component
  defaultNotFoundComponent: () => <div>404 - Route Not Found</div>,
})

// TypeScript module augmentation for type inference
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  )
}
```

## Link Component

Type-safe navigation component with preloading and active state management

```tsx
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <>
      {/* Basic navigation */}
      <Link to="/about">About</Link>

      {/* With path params - fully typed */}
      <Link
        to="/posts/$postId"
        params={{ postId: '123' }}
      >
        View Post
      </Link>

      {/* With search params */}
      <Link
        to="/posts"
        search={{ page: 1, filter: 'recent' }}
      >
        Recent Posts
      </Link>

      {/* Update search params based on previous values */}
      <Link
        to="/posts"
        search={(prev) => ({ ...prev, page: prev.page + 1 })}
      >
        Next Page
      </Link>

      {/* Active state styling */}
      <Link
        to="/dashboard"
        activeProps={{ className: 'font-bold text-blue-600' }}
        inactiveProps={{ className: 'text-gray-600' }}
      >
        Dashboard
      </Link>

      {/* Preload on hover */}
      <Link
        to="/posts/$postId"
        params={{ postId: '123' }}
        preload="intent"
        preloadDelay={100}
      >
        Hover to Preload
      </Link>

      {/* Relative navigation from current route */}
      <Link from="/posts/$postId" to="..">
        Back to Posts
      </Link>

      {/* With hash and state */}
      <Link
        to="/docs"
        hash="#introduction"
        state={{ fromPage: 'home' }}
      >
        Documentation
      </Link>

      {/* Replace instead of push */}
      <Link to="/login" replace>
        Login
      </Link>

      {/* External links (disables router) */}
      <Link to="https://tanstack.com" target="_blank">
        External Link
      </Link>
    </>
  )
}
```

## useNavigate Hook

Programmatic type-safe navigation with full parameter inference

```tsx
import { useNavigate } from '@tanstack/react-router'

function ProductForm() {
  // Specify 'from' for better type inference
  const navigate = useNavigate({ from: '/products' })

  const handleSubmit = async (product: Product) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })

    if (response.ok) {
      const { id } = await response.json()

      // Navigate with params - fully typed
      await navigate({
        to: '/products/$productId',
        params: { productId: id },
        search: { tab: 'details' },
      })
    }
  }

  const handleCancel = () => {
    // Relative navigation
    navigate({ to: '..' })
  }

  const handleReset = () => {
    // Navigate with replace
    navigate({
      to: '/products',
      search: {},
      replace: true,
    })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(/* ... */)
    }}>
      {/* Form fields */}
      <button type="submit">Save</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </form>
  )
}

// Global router navigation without hooks
import { router } from './router'

async function logout() {
  await fetch('/api/logout', { method: 'POST' })

  router.navigate({
    to: '/login',
    search: { redirect: window.location.pathname },
  })
}
```

## useParams Hook

Access route path parameters with full type safety

```tsx
import { useParams } from '@tanstack/react-router'

// In route component - use Route.useParams()
function PostComponent() {
  // Type: { postId: string }
  const { postId } = Route.useParams()

  return <div>Post ID: {postId}</div>
}

// Outside route component - specify 'from' for type inference
function CommentsList() {
  // Type: { postId: string, commentId: string }
  const params = useParams({
    from: '/posts/$postId/comments/$commentId'
  })

  return <div>Comment {params.commentId} on Post {params.postId}</div>
}

// Strict mode - error if route doesn't match
function StrictComponent() {
  const params = useParams({
    from: '/posts/$postId',
    strict: true, // Throws if not on this exact route
  })

  return <div>{params.postId}</div>
}

// With optional params
// Route: /posts/{-$category}/{-$slug}.tsx
function OptionalParamsComponent() {
  const { category, slug } = Route.useParams()
  // Type: { category?: string, slug?: string }

  return (
    <div>
      {category && <span>Category: {category}</span>}
      {slug && <span>Slug: {slug}</span>}
    </div>
  )
}
```

## useSearch Hook

Access validated search params with full type safety

```tsx
import { useSearch } from '@tanstack/react-router'
import { z } from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'

// Define search schema in route
const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().catch(''),
  sort: z.enum(['newest', 'oldest', 'price']).catch('newest'),
  tags: z.array(z.string()).catch([]),
})

export const Route = createFileRoute('/products')({
  validateSearch: zodValidator(productSearchSchema),
  component: ProductsComponent,
})

function ProductsComponent() {
  // Fully typed based on schema
  const { page, filter, sort, tags } = Route.useSearch()
  // Type: { page: number, filter: string, sort: 'newest' | 'oldest' | 'price', tags: string[] }

  return (
    <div>
      <p>Page: {page}</p>
      <p>Filter: {filter}</p>
      <p>Sort: {sort}</p>
      <p>Tags: {tags.join(', ')}</p>

      {/* Update search params */}
      <Link
        to="/products"
        search={(prev) => ({ ...prev, page: prev.page + 1 })}
      >
        Next Page
      </Link>
    </div>
  )
}

// Outside route component
function FilterSidebar() {
  const search = useSearch({ from: '/products' })
  // Type: { page: number, filter: string, sort: ..., tags: string[] }

  return (
    <div>
      <Link
        to="/products"
        search={{ ...search, filter: 'electronics' }}
      >
        Electronics
      </Link>
    </div>
  )
}
```

## useLoaderData Hook

Access data loaded from route loader with full type inference

```tsx
import { useLoaderData } from '@tanstack/react-router'

interface Post {
  id: string
  title: string
  content: string
  author: string
}

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }): Promise<Post> => {
    const response = await fetch(`/api/posts/${params.postId}`)
    return response.json()
  },
  component: PostComponent,
})

function PostComponent() {
  // Type: Post - inferred from loader return type
  const post = Route.useLoaderData()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author}</p>
      <div>{post.content}</div>
    </article>
  )
}

// Outside route component
function PostStats() {
  const post = useLoaderData({ from: '/posts/$postId' })
  // Type: Post

  return <div>Post: {post.title}</div>
}

// With selection for performance
function PostTitle() {
  const title = useLoaderData({
    from: '/posts/$postId',
    select: (data) => data.title, // Only re-render when title changes
  })

  return <h1>{title}</h1>
}
```

## useRouter Hook

Access router instance for navigation, invalidation, and route state

```tsx
import { useRouter } from '@tanstack/react-router'

function Component() {
  const router = useRouter()

  // Navigate programmatically
  const handleNavigate = () => {
    router.navigate({
      to: '/posts',
      search: { page: 1 },
    })
  }

  // Invalidate all routes to refetch data
  const handleRefresh = () => {
    router.invalidate()
  }

  // Invalidate specific route
  const handleInvalidatePost = () => {
    router.invalidate({
      filter: (route) => route.fullPath === '/posts/$postId',
    })
  }

  // Preload route
  const handlePreload = () => {
    router.preloadRoute({
      to: '/posts/$postId',
      params: { postId: '123' },
    })
  }

  // Build href manually
  const href = router.buildLink({
    to: '/posts/$postId',
    params: { postId: '123' },
  })

  // Check if route matches
  const matchRoute = router.matchRoute({
    to: '/posts',
    pending: true, // Include pending matches
  })

  // Access current route state
  console.log('Current location:', router.state.location)
  console.log('Is loading:', router.state.isLoading)
  console.log('Matches:', router.state.matches)

  return (
    <div>
      <button onClick={handleNavigate}>Navigate</button>
      <button onClick={handleRefresh}>Refresh All</button>
      <button onClick={handleInvalidatePost}>Refresh Post</button>
    </div>
  )
}
```

## useLocation Hook

Access current location information including pathname, search, hash, and state

```tsx
import { useLocation } from '@tanstack/react-router'

function LocationDisplay() {
  const location = useLocation()

  return (
    <div>
      {/* Full pathname */}
      <p>Current path: {location.pathname}</p>

      {/* Search params as object */}
      <p>Search: {JSON.stringify(location.search)}</p>

      {/* Raw search string */}
      <p>Search string: {location.searchStr}</p>

      {/* Hash */}
      <p>Hash: {location.hash}</p>

      {/* State passed via navigation */}
      <p>State: {JSON.stringify(location.state)}</p>

      {/* Full href */}
      <p>Full URL: {location.href}</p>
    </div>
  )
}

// Conditional rendering based on location
function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav>
      {segments.map((segment, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/')
        return (
          <span key={path}>
            <Link to={path}>{segment}</Link>
            {i < segments.length - 1 && ' > '}
          </span>
        )
      })}
    </nav>
  )
}
```

## useMatchRoute Hook

Check if a route is currently matched for conditional rendering

```tsx
import { useMatchRoute } from '@tanstack/react-router'

function Navigation() {
  const matchRoute = useMatchRoute()

  // Check if on posts route (any child route)
  const isPostsSection = matchRoute({ to: '/posts', fuzzy: true })

  // Check if on specific route
  const isHomepage = matchRoute({ to: '/' })

  // Check including pending matches
  const isPendingPost = matchRoute({
    to: '/posts/$postId',
    pending: true
  })

  return (
    <nav>
      <Link to="/">
        Home {isHomepage && '←'}
      </Link>
      <Link to="/posts">
        Posts {isPostsSection && '←'}
      </Link>

      {isPostsSection && (
        <div className="subnav">
          <Link to="/posts/new">New Post</Link>
        </div>
      )}

      {isPendingPost && <span>Loading post...</span>}
    </nav>
  )
}

// Render different content based on route
function Sidebar() {
  const matchRoute = useMatchRoute()
  const postMatch = matchRoute({ to: '/posts/$postId' })

  if (postMatch) {
    // postMatch.params is typed: { postId: string }
    return <PostSidebar postId={postMatch.params.postId} />
  }

  return <DefaultSidebar />
}
```

## beforeLoad Option

Middleware function that runs before route loading for authentication and redirects

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

// Protected route - redirect if not authenticated
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    // Check authentication from context
    if (!context.auth.isAuthenticated) {
      // Redirect to login with return URL
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    // Return additional context for child routes
    return {
      user: context.auth.user,
    }
  },
})

// Role-based authorization
export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.user?.isAdmin) {
      throw redirect({ to: '/unauthorized' })
    }
  },
})

// Data preloading in beforeLoad
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    // Prefetch data before loader runs
    context.queryClient.prefetchQuery({
      queryKey: ['user'],
      queryFn: fetchCurrentUser,
    })
  },
  loader: async ({ context }) => {
    // Data already cached
    return context.queryClient.ensureQueryData({
      queryKey: ['user'],
      queryFn: fetchCurrentUser,
    })
  },
})

// Complex authorization logic
export const Route = createFileRoute('/posts/$postId/edit')({
  beforeLoad: async ({ params, context }) => {
    const post = await fetchPost(params.postId)

    // Check if user owns the post
    if (post.authorId !== context.auth.user?.id) {
      throw redirect({ to: '/posts/$postId', params: { postId: params.postId } })
    }

    // Make post available to loader
    return { post }
  },
  loader: async ({ context }) => {
    // Use post from beforeLoad
    return context.post
  },
})
```

## validateSearch Option

Validate and type search parameters with schema validation libraries

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

// Using Zod for validation
const productSearchSchema = z.object({
  page: z.number().min(1).catch(1),
  pageSize: z.number().min(10).max(100).catch(20),
  filter: z.string().catch(''),
  sort: z.enum(['name', 'price', 'date']).catch('name'),
  order: z.enum(['asc', 'desc']).catch('asc'),
  categories: z.array(z.string()).catch([]),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).catch({}),
  inStock: z.boolean().catch(false),
})

export const Route = createFileRoute('/products')({
  validateSearch: zodValidator(productSearchSchema),
  component: ProductsComponent,
})

function ProductsComponent() {
  const search = Route.useSearch()
  // Fully typed: {
  //   page: number,
  //   pageSize: number,
  //   filter: string,
  //   sort: 'name' | 'price' | 'date',
  //   order: 'asc' | 'desc',
  //   categories: string[],
  //   priceRange: { min?: number, max?: number },
  //   inStock: boolean
  // }

  return (
    <div>
      <Filters />
      <ProductList
        page={search.page}
        pageSize={search.pageSize}
        filter={search.filter}
      />
    </div>
  )
}

// Using Valibot
import * as v from 'valibot'
import { valibotValidator } from '@tanstack/valibot-adapter'

const postSearchSchema = v.object({
  q: v.fallback(v.string(), ''),
  tags: v.fallback(v.array(v.string()), []),
  authorId: v.fallback(v.optional(v.string()), undefined),
})

export const Route = createFileRoute('/posts')({
  validateSearch: valibotValidator(postSearchSchema),
})

// Using ArkType
import { type } from 'arktype'
import { arkTypeValidator } from '@tanstack/arktype-adapter'

const dashboardSearchSchema = type({
  'dateRange?': {
    'start?': 'Date',
    'end?': 'Date',
  },
  'view?': '"grid" | "list"',
  'showArchived?': 'boolean',
})

export const Route = createFileRoute('/dashboard')({
  validateSearch: arkTypeValidator(dashboardSearchSchema),
})

// Manual validation function
export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: String(search.q || ''),
      page: Number(search.page || 1),
      filters: Array.isArray(search.filters)
        ? search.filters.map(String)
        : [],
    }
  },
})
```

## loaderDeps Option

Extract dependencies from search params for cache key generation

```tsx
import { createFileRoute } from '@tanstack/react-router'

// Without loaderDeps - loader runs once, ignores search param changes
export const Route = createFileRoute('/products')({
  validateSearch: (search) => ({
    page: Number(search.page || 1),
    filter: String(search.filter || ''),
  }),
  loader: async () => {
    // Runs once, result cached regardless of search params
    return fetchProducts()
  },
})

// With loaderDeps - loader re-runs when dependencies change
export const Route = createFileRoute('/products')({
  validateSearch: (search) => ({
    page: Number(search.page || 1),
    filter: String(search.filter || ''),
    sort: String(search.sort || 'name'),
  }),
  // Extract deps that should trigger reload
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  // Loader re-runs when page or filter changes
  loader: async ({ deps }) => {
    // deps: { page: number, filter: string }
    const response = await fetch(
      `/api/products?page=${deps.page}&filter=${deps.filter}`
    )
    return response.json()
  },
  component: ProductsComponent,
})

// Complex dependency extraction
export const Route = createFileRoute('/analytics')({
  validateSearch: (search) => ({
    startDate: String(search.startDate || ''),
    endDate: String(search.endDate || ''),
    metrics: Array.isArray(search.metrics) ? search.metrics : ['views'],
    groupBy: String(search.groupBy || 'day'),
  }),
  loaderDeps: ({ search }) => ({
    // Include all search params that affect data
    dateRange: `${search.startDate}-${search.endDate}`,
    metrics: search.metrics.join(','),
    groupBy: search.groupBy,
  }),
  loader: async ({ deps, context }) => {
    // Separate cache entry for each unique combination
    return context.analyticsClient.query({
      dateRange: deps.dateRange,
      metrics: deps.metrics.split(','),
      groupBy: deps.groupBy,
    })
  },
})

// Using with TanStack Query
import { queryOptions } from '@tanstack/react-query'

const productsQueryOptions = (page: number, filter: string) =>
  queryOptions({
    queryKey: ['products', { page, filter }],
    queryFn: () => fetchProducts({ page, filter }),
  })

export const Route = createFileRoute('/products')({
  validateSearch: (search) => ({
    page: Number(search.page || 1),
    filter: String(search.filter || ''),
  }),
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  loader: async ({ context, deps }) => {
    return context.queryClient.ensureQueryData(
      productsQueryOptions(deps.page, deps.filter)
    )
  },
})
```

## redirect Function

Throw redirect from beforeLoad or loader to navigate to different route

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

// Authentication redirect
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href, // Return URL after login
        },
      })
    }
  },
})

// Conditional redirect based on data
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)

    // Redirect if post is draft
    if (post.status === 'draft') {
      throw redirect({
        to: '/posts/$postId/edit',
        params: { postId: params.postId },
      })
    }

    // Redirect if post is deleted
    if (post.status === 'deleted') {
      throw redirect({ to: '/posts' })
    }

    return post
  },
})

// Authorization redirect
export const Route = createFileRoute('/admin/users/$userId/delete')({
  beforeLoad: async ({ params, context }) => {
    const user = await fetchUser(params.userId)

    // Can't delete admin users
    if (user.role === 'admin') {
      throw redirect({
        to: '/admin/users/$userId',
        params: { postId: params.userId },
        replace: true, // Replace history entry
      })
    }
  },
})

// Redirect after successful form submission
export const Route = createFileRoute('/posts/new')({
  component: () => {
    const navigate = useNavigate()

    const handleSubmit = async (data: PostData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const { id } = await response.json()
        // Redirect to new post
        throw redirect({
          to: '/posts/$postId',
          params: { postId: id },
        })
      }
    }

    return <PostForm onSubmit={handleSubmit} />
  },
})
```

## Outlet Component

Render child routes in layout components

```tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

// Layout route with Outlet
export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <nav>
          <Link to="/dashboard" activeOptions={{ exact: true }}>
            Overview
          </Link>
          <Link to="/dashboard/analytics">
            Analytics
          </Link>
          <Link to="/dashboard/settings">
            Settings
          </Link>
        </nav>
      </aside>

      <main className="content">
        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  )
}

// Child route
export const Route = createFileRoute('/dashboard/analytics')({
  component: () => <div>Analytics Content</div>,
})

// Pathless layout route (underscore prefix)
// File: routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <div className="authenticated-wrapper">
      <Header />
      <Outlet />
      <Footer />
    </div>
  ),
})

// File: routes/_authenticated.profile.tsx
export const Route = createFileRoute('/_authenticated/profile')({
  component: () => <div>Profile</div>, // Renders at /profile with wrapper
})

// Multiple nested Outlets
export const Route = createFileRoute('/app')({
  component: () => (
    <div>
      <TopNav />
      <div className="flex">
        <Sidebar />
        <Outlet /> {/* First level children */}
      </div>
    </div>
  ),
})

export const Route = createFileRoute('/app/projects')({
  component: () => (
    <div>
      <ProjectsHeader />
      <Outlet /> {/* Second level children */}
    </div>
  ),
})
```

## getRouteApi Function

Access route API outside of route definition to avoid circular dependencies

```tsx
import { getRouteApi } from '@tanstack/react-router'

// Instead of importing Route directly (causes circular deps)
// import { Route } from '../routes/posts.$postId'

// Use getRouteApi with route path
const routeApi = getRouteApi('/posts/$postId')

function PostTitle() {
  // Access route hooks without importing Route
  const post = routeApi.useLoaderData()
  const { postId } = routeApi.useParams()
  const { tab } = routeApi.useSearch()

  return <h1>{post.title}</h1>
}

// In a separate file
function PostComments() {
  const routeApi = getRouteApi('/posts/$postId')
  const post = routeApi.useLoaderData()

  return (
    <div>
      {post.comments.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
    </div>
  )
}

// Multiple route APIs
function PostPage() {
  const postApi = getRouteApi('/posts/$postId')
  const appApi = getRouteApi('/app')

  const post = postApi.useLoaderData()
  const appContext = appApi.useRouteContext()

  return (
    <div>
      <h1>{post.title}</h1>
      <p>App version: {appContext.version}</p>
    </div>
  )
}
```

## Code-Based Routing

Create routes programmatically without file-based routing

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from '@tanstack/react-router'

// Create root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/posts">Posts</Link>
      </nav>
      <hr />
      <Outlet />
    </>
  ),
})

// Create index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Welcome Home!</div>,
})

// Create about route
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'about',
  component: () => <div>About Us</div>,
})

// Create posts layout route
const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'posts',
  component: () => (
    <div>
      <h2>Posts</h2>
      <Outlet />
    </div>
  ),
})

// Create posts index route
const postsIndexRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '/',
  loader: async () => {
    const response = await fetch('/api/posts')
    return response.json()
  },
  component: () => {
    const posts = postsIndexRoute.useLoaderData()
    return (
      <div>
        {posts.map(post => (
          <Link
            key={post.id}
            to="/posts/$postId"
            params={{ postId: post.id }}
          >
            {post.title}
          </Link>
        ))}
      </div>
    )
  },
})

// Create post detail route
const postRoute = createRoute({
  getParentRoute: () => postsRoute,
  path: '$postId',
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`)
    return response.json()
  },
  component: () => {
    const post = postRoute.useLoaderData()
    return (
      <article>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
      </article>
    )
  },
})

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  postsRoute.addChildren([
    postsIndexRoute,
    postRoute,
  ]),
])

// Create router
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

// Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<RouterProvider router={router} />)
```

## File-Based Routing Structure

Organize routes using file system with automatic type generation

```tsx
// Project structure:
// src/
//   routes/
//     __root.tsx              -> Root layout
//     index.tsx               -> / (homepage)
//     about.tsx               -> /about
//     posts.tsx               -> /posts (layout)
//     posts.index.tsx         -> /posts (index)
//     posts.$postId.tsx       -> /posts/:postId
//     posts.$postId.edit.tsx  -> /posts/:postId/edit
//     _authenticated.tsx      -> Pathless layout (authentication wrapper)
//     _authenticated.dashboard.tsx -> /dashboard (with auth wrapper)
//     _authenticated.profile.tsx   -> /profile (with auth wrapper)

// __root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <GlobalNav />
      <Outlet />
    </>
  ),
})

// index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div>Homepage</div>,
})

// posts.tsx (layout)
export const Route = createFileRoute('/posts')({
  component: () => (
    <div>
      <PostsNav />
      <Outlet />
    </div>
  ),
})

// posts.index.tsx
export const Route = createFileRoute('/posts/')({
  loader: async () => {
    const response = await fetch('/api/posts')
    return response.json()
  },
  component: PostsList,
})

// posts.$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`)
    return response.json()
  },
  component: PostDetail,
})

// posts.$postId.edit.tsx
export const Route = createFileRoute('/posts/$postId/edit')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`)
    return response.json()
  },
  component: PostEdit,
})

// _authenticated.tsx (pathless layout)
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <div className="authenticated">
      <Outlet />
    </div>
  ),
})

// _authenticated.dashboard.tsx
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => <div>Dashboard</div>,
})

// File naming conventions:
// $param          -> Dynamic segment
// {-$param}       -> Optional param
// _layout         -> Pathless route (underscore prefix)
// (group)         -> Route group (parentheses, doesn't affect URL)
```

## TanStack Query Integration

Seamless integration with TanStack Query for advanced caching and data synchronization

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

// Define query options
const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ['posts', postId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}`)
      return response.json()
    },
    staleTime: 5000,
  })

export const Route = createFileRoute('/posts/$postId')({
  // Ensure data is loaded in loader
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(postQueryOptions(params.postId)),
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams()

  // Use suspense query - data guaranteed to be ready
  const { data: post, isRefetching } = useSuspenseQuery(
    postQueryOptions(postId)
  )

  return (
    <article>
      {isRefetching && <div>Refreshing...</div>}
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}

// Search params with TanStack Query
const postsQueryOptions = (page: number, filter: string) =>
  queryOptions({
    queryKey: ['posts', { page, filter }],
    queryFn: () => fetchPosts({ page, filter }),
  })

export const Route = createFileRoute('/posts')({
  validateSearch: (search) => ({
    page: Number(search.page || 1),
    filter: String(search.filter || ''),
  }),
  loaderDeps: ({ search: { page, filter } }) => ({ page, filter }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureQueryData(
      postsQueryOptions(deps.page, deps.filter)
    ),
  component: PostsList,
})

function PostsList() {
  const { page, filter } = Route.useSearch()
  const { data: posts } = useSuspenseQuery(postsQueryOptions(page, filter))

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      <Link
        to="/posts"
        search={(prev) => ({ ...prev, page: prev.page + 1 })}
      >
        Next Page
      </Link>
    </div>
  )
}

// Mutations with automatic invalidation
import { useMutation, useQueryClient } from '@tanstack/react-query'

function CreatePostForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const createPost = useMutation({
    mutationFn: async (data: PostData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onSuccess: (newPost) => {
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: ['posts'] })

      // Navigate to new post
      navigate({
        to: '/posts/$postId',
        params: { postId: newPost.id },
      })
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      createPost.mutate(/* form data */)
    }}>
      {/* Form fields */}
    </form>
  )
}

// Prefetching on hover
function PostLink({ postId }: { postId: string }) {
  const queryClient = useQueryClient()

  return (
    <Link
      to="/posts/$postId"
      params={{ postId }}
      onMouseEnter={() => {
        // Prefetch post data on hover
        queryClient.prefetchQuery(postQueryOptions(postId))
      }}
    >
      View Post
    </Link>
  )
}
```

## TanStack Router

TanStack Router transforms React routing from simple pathname matching into a comprehensive, type-safe navigation and state management solution. Its search params system enables complex application state to live directly in the URL with full JSON serialization, validation, and type inference, making it ideal for filter-heavy dashboards, e-commerce catalogs, and data exploration tools. The built-in SWR caching with dependency-based invalidation eliminates unnecessary network requests while maintaining fresh data, and seamless TanStack Query integration provides even more sophisticated caching strategies for complex applications.

The framework's versatility shines through its dual routing approaches: file-based routing with automatic type generation for rapid development, and code-based routing for maximum control. Pathless layouts enable authentication wrappers and layout composition without affecting URLs, while nested routes with inherited context support dependency injection patterns. With features like route masking for URL privacy, navigation blocking for unsaved changes, automatic code splitting, scroll restoration, and comprehensive SSR support, TanStack Router provides everything needed to build production-grade React applications with exceptional developer experience and end-user performance.
