import { createRouter, createRoute, createRootRoute, redirect, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import Landing from '@/pages/Landing'
import SignIn from '@/pages/SignIn'
import Customers from '@/pages/Customers'
import Jobs from '@/pages/Jobs'
import Estimates from '@/pages/Estimates'
import NotFound from '@/pages/not-found'
import AppShell from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'

// Root route with authentication check
const rootRoute = createRootRoute({
  component: () => {
    const { isAuthenticated, isLoading } = useAuth()
    
    if (isLoading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    if (!isAuthenticated) {
      return <SignIn />
    }

    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    )
  }
})

// Index route - redirect to /mfnc/customers
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    // Use window.location to do immediate redirect
    window.location.href = '/mfnc/customers'
    return null
  }
})

// Main shell route  
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/$section',
  beforeLoad: ({ params }) => {
    const validDivisions = ['mfnc', 'sfnc', 'rr']
    const validSections = ['customers', 'jobs', 'estimates']
    
    if (!validDivisions.includes(params.division) || !validSections.includes(params.section)) {
      window.location.href = '/mfnc/customers'
      return
    }
  },
  component: () => {
    return <AppShell />
  }
})

// Edit routes
const editCustomerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/customers/edit/$id',
  component: () => {
    return <AppShell />
  }
})

const editJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/jobs/edit/$id',
  component: () => {
    return <AppShell />
  }
})

const editEstimateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/estimates/edit/$id',
  component: () => {
    return <AppShell />
  }
})

// 404 route
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  shellRoute,
  editCustomerRoute,
  editJobRoute,
  editEstimateRoute,
  notFoundRoute
])

// Create router instance
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}