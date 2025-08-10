import { useParams } from '@tanstack/react-router'
import { Suspense, lazy, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load all page components for better performance
const Customers = lazy(() => import('@/pages/Customers'))
const Jobs = lazy(() => import('@/pages/Jobs'))
const Estimates = lazy(() => import('@/pages/Estimates'))
const Pipeline = lazy(() => import('@/pages/Pipeline'))
const Proposals = lazy(() => import('@/pages/Proposals'))
const Contracts = lazy(() => import('@/pages/Contracts'))
const Contacts = lazy(() => import('@/pages/Contacts'))
const Communication = lazy(() => import('@/pages/Communication'))
const Reports = lazy(() => import('@/pages/Reports'))
const EditCustomer = lazy(() => import('@/pages/EditCustomer'))

export default function AppShell() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const section = (params as any).section || 'customers'
  const currentPath = window.location.pathname

  // Listen for navigation changes from sidebar
  useEffect(() => {
    const handlePopState = () => {
      // Force re-render when navigation happens
      window.location.reload()
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Loading skeleton component
  const PageSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4 py-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Render the appropriate component based on the route with suspense
  const renderContent = () => {
    // Handle edit routes
    if (currentPath.includes('/customers/edit/')) {
      return (
        <Suspense fallback={<PageSkeleton />}>
          <EditCustomer />
        </Suspense>
      )
    }
    if (currentPath.includes('/jobs/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Job (Coming Soon)</div>
    }
    if (currentPath.includes('/estimates/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Estimate (Coming Soon)</div>
    }

    // Handle main sections with suspense for lazy loading
    const ComponentToRender = (() => {
      switch (section) {
        case 'customers': return Customers
        case 'jobs': return Jobs
        case 'estimates': return Estimates
        case 'pipeline': return Pipeline
        case 'proposals': return Proposals
        case 'contracts': return Contracts
        case 'contacts': return Contacts
        case 'communication': return Communication
        case 'reports': return Reports
        default: return Customers
      }
    })()

    return (
      <Suspense fallback={<PageSkeleton />}>
        <ComponentToRender />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}