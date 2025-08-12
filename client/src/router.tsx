import { createRouter, createRoute, createRootRoute, redirect, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import Landing from '@/pages/Landing'
import SignIn from '@/pages/SignIn'
import SignUp from '@/pages/SignUp'
import Customers from '@/pages/Customers'
import Jobs from '@/pages/Jobs'
import Estimates from '@/pages/Estimates'
import NotFound from '@/pages/not-found'
import AppShell from '@/components/layout/AppShell'
import PlansPage from '@/features/plans/PlansPage'
import { useAuth } from '@/hooks/useAuth'

// Root route without automatic redirects - let components handle authentication
const rootRoute = createRootRoute({
  component: () => {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    )
  }
})

// Landing page route 
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing
})

// Sign in route
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signin',
  component: SignIn
})

// Sign up route
const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUp
})

// Index route - redirect to /mfnc/customers
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => {
    // Use window.location to do immediate redirect
    window.location.href = '/mfnc/lead-management'
    return null
  }
})

// Main shell route  
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/$section',
  beforeLoad: ({ params }) => {
    const validDivisions = ['mfnc', 'sfnc', 'rr', 'all']
    const validSections = [
      'customers', 
      'estimates', 
      'field-management',
      'lead-management', 
      'pipeline', 
      'proposals', 
      'contracts', 
      'contacts', 
      'communication', 
      'reports',
      'business-insight'
    ]
    
    if (!validDivisions.includes(params.division) || !validSections.includes(params.section)) {
      window.location.href = '/mfnc/lead-management'
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

// Lead detail route
const leadDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/lead-management/lead/$id',
  component: () => {
    return <AppShell />
  }
})

// Field management with job ID route
const fieldManagementJobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/field-management/$jobId',
  component: () => {
    return <AppShell />
  }
})

// Proposal view route
const proposalViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/proposal/$proposalId',
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

// Plans route
const plansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$division/jobs/$jobId/plans',
  component: PlansPage
})

// 404 route
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  landingRoute,
  signInRoute,
  signUpRoute,
  indexRoute,
  shellRoute,
  editCustomerRoute,
  leadDetailRoute,
  fieldManagementJobRoute,
  proposalViewRoute,
  editEstimateRoute,
  plansRoute,
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